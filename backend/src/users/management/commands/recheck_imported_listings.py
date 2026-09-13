"""Manually verify whether imported marketplace listing URLs remain available."""
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from users.models import Property


REMOVED_MARKERS = (
    'this listing has been removed', 'this ad has been removed',
    'this listing is no longer available', 'this ad is no longer available',
    'listing unavailable', 'ad unavailable',
)
AMBIGUOUS_MARKERS = (
    'captcha', 'verify you are human', 'access denied', 'unusual traffic',
    'temporarily blocked', 'rate limit', 'too many requests',
)


def visible_page_text(content):
    """Ignore scripts that often mention CAPTCHA on otherwise normal listing pages."""
    content = re.sub(r'<(script|style)[^>]*>.*?</\1\s*>', ' ', content, flags=re.I | re.S)
    return re.sub(r'<[^>]+>', ' ', content).lower()


def check_source_url(url, timeout):
    """Return active, unavailable, or unknown without treating blocks as removals."""
    request = Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; ReeltyAvailabilityCheck/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
    })
    try:
        with urlopen(request, timeout=timeout) as response:
            status = response.getcode()
            content = visible_page_text(response.read(512000).decode('utf-8', errors='ignore'))
    except HTTPError as exc:
        if exc.code in {404, 410}:
            return 'unavailable', f'HTTP {exc.code}'
        return 'unknown', f'HTTP {exc.code}'
    except (URLError, TimeoutError, ValueError, OSError) as exc:
        return 'unknown', exc.__class__.__name__
    if any(marker in content for marker in AMBIGUOUS_MARKERS):
        return 'unknown', 'ambiguous access response'
    if status in {404, 410} or any(marker in content for marker in REMOVED_MARKERS):
        return 'unavailable', f'HTTP {status} removed listing response'
    if 200 <= status < 300:
        return 'active', f'HTTP {status}'
    return 'unknown', f'HTTP {status}'


class Command(BaseCommand):
    help = 'Recheck imported source URLs; marketplace blocks and failures remain unknown.'

    def add_arguments(self, parser):
        parser.add_argument('--property-id', type=int)
        parser.add_argument('--limit', type=int)
        parser.add_argument('--timeout', type=int, default=15)

    def handle(self, *args, **options):
        if options['timeout'] < 1 or options['timeout'] > 60:
            raise CommandError('--timeout must be between 1 and 60 seconds.')
        properties = Property.objects.filter(owner__isnull=True).exclude(source_url='').order_by('pk')
        if options['property_id']:
            properties = properties.filter(pk=options['property_id'])
        if options['limit'] is not None:
            if options['limit'] < 1:
                raise CommandError('--limit must be at least 1.')
            properties = properties[:options['limit']]

        checked = {'active': 0, 'unavailable': 0, 'unknown': 0}
        for property_record in properties:
            status, detail = check_source_url(property_record.source_url, options['timeout'])
            property_record.listing_status = status
            property_record.last_checked = timezone.now()
            property_record.save(update_fields=['listing_status', 'last_checked', 'updated_at'])
            checked[status] += 1
            self.stdout.write(f'[{status}] {property_record.pk}: {detail}')
        self.stdout.write(self.style.SUCCESS(
            f"Checked {sum(checked.values())} imported listings: "
            f"{checked['active']} active, {checked['unavailable']} unavailable, {checked['unknown']} unknown."
        ))
