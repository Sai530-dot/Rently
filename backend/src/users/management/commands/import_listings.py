"""Normalize and persist source-backed imported rental snapshots."""
import hashlib
import json
import math
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from users.models import Property


CITIES = {
    'Toronto': ('ON', 43.6532, -79.3832),
    'Saskatoon': ('SK', 52.1332, -106.6700),
    'Vancouver': ('BC', 49.2827, -123.1207),
    'Montreal': ('QC', 45.5019, -73.5674),
    'Ottawa': ('ON', 45.4215, -75.6972),
    'Regina': ('SK', 50.4452, -104.6189),
}
SOURCE_FILES = ('craigslist_listings.json', 'kijiji_listings.json', 'real_listings.json')
NON_RENTAL_TITLES = re.compile(r'\b(carpet|upholstery|housekeeping|cleaning service|moving service)\b', re.I)
VALID_PROPERTY_TYPES = {'Apartment', 'Single Family House', 'Condominium', 'Room'}
LEGACY_PLACEHOLDER_DESCRIPTION = 'Imported rental snapshot. Confirm current price, room counts, amenities and availability at the original source.'


def clean_text(value, limit):
    if not isinstance(value, str):
        return ''
    return ' '.join(value.split())[:limit]


def clean_url(value):
    value = clean_text(value, 2000)
    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        return ''
    return value


def canonical_url(value):
    parsed = urlparse(value)
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip('/'), '', '', ''))


def source_listing_id(url, supplied_identifier=''):
    supplied_identifier = clean_text(supplied_identifier, 200)
    if supplied_identifier:
        return supplied_identifier
    parsed = urlparse(url)
    if parsed.netloc.lower().endswith('kijiji.ca'):
        match = re.search(r'/(\d{6,})/?$', parsed.path)
        if match:
            return f'kijiji:{match.group(1)}'
    return canonical_url(url)


def source_key(url, listing_id):
    return hashlib.sha256((listing_id or canonical_url(url)).encode('utf-8')).hexdigest()


def image_urls(item):
    candidates = []
    if isinstance(item.get('images'), list):
        candidates.extend(item['images'])
    candidates.append(item.get('image'))
    valid = []
    for candidate in candidates:
        url = clean_url(candidate)
        if not url:
            continue
        if any(marker in url.lower() for marker in ('placeholder', 'data:image', 'default-image')):
            continue
        if url not in valid:
            valid.append(url)
    return valid


def positive_integer(value, maximum=100000):
    if isinstance(value, bool):
        return None
    match = re.match(r'\s*(\d+)', str(value).replace(',', ''))
    if not match:
        return None
    number = int(match.group(1))
    return number if 0 <= number <= maximum else None


def bathroom_count(value):
    if isinstance(value, bool):
        return None
    try:
        number = Decimal(str(value).strip())
    except (InvalidOperation, TypeError, ValueError):
        return None
    return number if Decimal('0.5') <= number <= Decimal('20') else None


def text_list(value, item_limit=120, list_limit=30):
    if not isinstance(value, list):
        return []
    result = []
    for item in value:
        text = clean_text(item, item_limit)
        if text and text not in result:
            result.append(text)
    return result[:list_limit]


def normalized_rich_fields(item):
    """Only trust fields a source-specific parser explicitly marked as source-backed."""
    source_fields = item.get('source_fields')
    if not isinstance(source_fields, dict):
        return {}
    result = {}
    bedrooms = positive_integer(source_fields.get('bedrooms'), 20)
    bathrooms = bathroom_count(source_fields.get('bathrooms'))
    square_feet = positive_integer(source_fields.get('square_feet'))
    property_type = clean_text(source_fields.get('property_type'), 30)
    if bedrooms is not None:
        result['bedrooms'] = bedrooms
    if bathrooms is not None:
        result['bathrooms'] = bathrooms
    if square_feet is not None:
        result['square_feet'] = square_feet
    if property_type in VALID_PROPERTY_TYPES:
        result['property_type'] = property_type
    for field in ('parking', 'pets', 'lease_term', 'available_date', 'description'):
        value = clean_text(source_fields.get(field), 10000 if field == 'description' else 200)
        if value:
            result[field] = value
    for field in ('utilities', 'appliances', 'features'):
        value = text_list(source_fields.get(field))
        if value:
            result[field] = value
    return result


def normalize_listing(item):
    if not isinstance(item, dict):
        return None
    url = clean_url(item.get('url'))
    title = clean_text(item.get('title'), 200)
    try:
        rent = float(item.get('rent', 0))
    except (TypeError, ValueError):
        rent = 0
    if not url or not title or NON_RENTAL_TITLES.search(title) or not math.isfinite(rent) or not 100 <= rent <= 20000:
        return None
    address = clean_text(item.get('address'), 300)
    city = next((name for name in CITIES if name.lower() in f'{address} {url}'.lower()), '')
    province, lat, lon = CITIES.get(city, ('', None, None))
    listing_id = source_listing_id(url, item.get('source_identifier', ''))
    return {
        'source_url': url, 'source_key': source_key(url, listing_id), 'source_listing_id': listing_id,
        'title': title, 'address': address, 'city': city or 'Unknown', 'province': province,
        'rent': rent, 'lat': lat, 'lon': lon, 'images': image_urls(item),
        'rich_fields': normalized_rich_fields(item),
    }


def find_existing_listing(snapshot):
    return (Property.objects.filter(source_key=snapshot['source_key']).first()
            or Property.objects.filter(source_listing_id=snapshot['source_listing_id']).first()
            or Property.objects.filter(source_url=snapshot['source_url']).first())


def persist_listing(snapshot):
    """Update a marketplace record without replacing good data with empty extraction output."""
    property_record = find_existing_listing(snapshot)
    created = property_record is None
    if created:
        property_record = Property(
            source_key=snapshot['source_key'], source_listing_id=snapshot['source_listing_id'],
            source_url=snapshot['source_url'], title=snapshot['title'], address=snapshot['address'],
            city=snapshot['city'], province=snapshot['province'], rent=snapshot['rent'],
            bedrooms=None, bathrooms=None, property_type='', description='', image='', images=[],
            lat=snapshot['lat'], lon=snapshot['lon'], listing_status='unknown',
        )
    elif property_record.owner_id is not None:
        return property_record, False, False
    else:
        property_record.title = snapshot['title']
        property_record.address = snapshot['address'] or property_record.address
        property_record.city = snapshot['city'] if snapshot['city'] != 'Unknown' else property_record.city
        property_record.province = snapshot['province'] or property_record.province
        property_record.rent = snapshot['rent']
        property_record.source_url = snapshot['source_url']
        property_record.source_listing_id = snapshot['source_listing_id'] or property_record.source_listing_id
        if property_record.description == LEGACY_PLACEHOLDER_DESCRIPTION:
            property_record.description = ''

    if snapshot['images']:
        property_record.images = snapshot['images']
        property_record.image = snapshot['images'][0]
    elif not property_record.images and clean_url(property_record.image):
        property_record.images = [property_record.image]
    for field, value in snapshot['rich_fields'].items():
        if value not in ('', [], None):
            setattr(property_record, field, value)
    property_record.save()
    return property_record, created, True


class Command(BaseCommand):
    help = 'Import and update bundled source-backed listing snapshots.'

    def add_arguments(self, parser):
        parser.add_argument('--directory', type=Path, default=settings.BASE_DIR.parent.parent / 'frontend' / 'src' / 'data')

    def handle(self, *args, **options):
        directory = options['directory']
        if not directory.is_dir():
            raise CommandError(f'Listing directory does not exist: {directory}')
        added = updated = skipped = 0
        for filename in SOURCE_FILES:
            path = directory / filename
            if not path.exists():
                continue
            try:
                items = json.loads(path.read_text(encoding='utf-8'))
            except (OSError, json.JSONDecodeError) as exc:
                raise CommandError(f'Could not read {path.name}: {exc}') from exc
            if not isinstance(items, list):
                raise CommandError(f'{path.name} must contain a JSON list.')
            for item in items:
                snapshot = normalize_listing(item)
                if snapshot is None:
                    skipped += 1
                    continue
                _, created, persisted = persist_listing(snapshot)
                if not persisted:
                    skipped += 1
                elif created:
                    added += 1
                else:
                    updated += 1
        self.stdout.write(self.style.SUCCESS(f'Imported {added} listings; updated {updated}; skipped {skipped} invalid, duplicate, or local records.'))
