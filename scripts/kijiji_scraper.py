"""Capture source-backed Kijiji rental snapshots without inventing listing facts."""
import json
import os
import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


TARGET_URL = 'https://www.kijiji.ca/b-apartments-condos/saskatoon/c37l1700197'
OUTPUT_FILE = os.path.join('frontend', 'src', 'data', 'kijiji_listings.json')
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ReeltySnapshot/1.0)', 'Accept-Language': 'en-CA,en;q=0.9'}
REQUEST_TIMEOUT_SECONDS = 15
MAX_LISTINGS = 40


def clean_text(value, limit=10000):
    return ' '.join(str(value or '').split())[:limit]


def valid_image_url(value):
    value = clean_text(value, 2000).split(' ')[0]
    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        return ''
    if any(token in value.lower() for token in ('placeholder', 'default-image', 'data:image')):
        return ''
    return value


def unique_images(values):
    images = []
    for value in values:
        image = valid_image_url(value)
        if image and image not in images:
            images.append(image)
    return images


def image_candidates(node):
    candidates = []
    for image in node.find_all('img'):
        candidates.extend([image.get('src'), image.get('data-src')])
        if image.get('srcset'):
            candidates.extend(part.strip().split(' ')[0] for part in image['srcset'].split(','))
    for meta in node.select('meta[property="og:image"], meta[name="twitter:image"]'):
        candidates.append(meta.get('content'))
    return unique_images(candidates)


def parse_price(value):
    match = re.search(r'\$\s*([\d,]+)(?:\.\d{2})?', clean_text(value))
    if not match:
        return None
    try:
        price = int(match.group(1).replace(',', ''))
    except ValueError:
        return None
    return price if 100 <= price <= 20000 else None


def listing_identifier(url):
    match = re.search(r'/(\d{6,})/?$', urlparse(url).path)
    return f'kijiji:{match.group(1)}' if match else ''


def json_ld_documents(soup):
    documents = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            documents.append(json.loads(script.string or script.get_text()))
        except (TypeError, json.JSONDecodeError):
            continue
    return documents


def walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def values_for_keys(documents, keys):
    wanted = {key.lower().replace('_', '').replace('-', '') for key in keys}
    values = []
    for document in documents:
        for item in walk_json(document):
            for key, value in item.items():
                if str(key).lower().replace('_', '').replace('-', '') in wanted:
                    values.append(value)
    return values


def scalar_value(value):
    if isinstance(value, (str, int, float)) and not isinstance(value, bool):
        return clean_text(value, 10000)
    return ''


def list_value(value):
    if isinstance(value, list):
        return [text for item in value if (text := scalar_value(item))]
    return [text] if (text := scalar_value(value)) else []


def normalize_property_type(value):
    value = clean_text(value, 100).lower()
    if 'condo' in value:
        return 'Condominium'
    if any(word in value for word in ('house', 'townhouse', 'duplex')):
        return 'Single Family House'
    if any(word in value for word in ('room', 'shared')):
        return 'Room'
    if any(word in value for word in ('apartment', 'suite', 'rental unit')):
        return 'Apartment'
    return ''


def source_fields_from_detail(soup):
    """Return only fields explicitly exposed by the detail page."""
    documents = json_ld_documents(soup)
    result = {}
    scalar_fields = {
        'bedrooms': ('bedrooms', 'numberofbedrooms'),
        'bathrooms': ('bathrooms', 'numberofbathrooms'),
        'square_feet': ('squarefeet', 'squarefootage', 'floorarea', 'size'),
        'parking': ('parking', 'parkingtype'), 'pets': ('pets', 'petfriendly', 'petpolicy'),
        'lease_term': ('leaseterm', 'term'),
        'available_date': ('availabledate', 'availabilitydate', 'dateavailable'),
        'property_type': ('propertytype', 'typeofproperty', 'category'),
    }
    for field, keys in scalar_fields.items():
        values = values_for_keys(documents, keys)
        if not values:
            continue
        value = scalar_value(values[0])
        if field == 'property_type':
            value = normalize_property_type(value)
        if value:
            result[field] = value
    for field, keys in {
        'utilities': ('utilities', 'utility'), 'appliances': ('appliances', 'appliance'),
        'features': ('amenities', 'features', 'includedfeatures'),
    }.items():
        values = values_for_keys(documents, keys)
        items = []
        for value in values:
            for text in list_value(value):
                if text not in items:
                    items.append(text)
        if items:
            result[field] = items
    descriptions = values_for_keys(documents, ('description',))
    if descriptions and (description := scalar_value(descriptions[0])):
        result['description'] = description

    # Conservative fallback for rendered label/value markup when JSON-LD is sparse.
    labels = {
        'bedrooms': ('bedroom',), 'bathrooms': ('bathroom',),
        'square_feet': ('square feet', 'sq ft', 'size'), 'parking': ('parking',),
        'pets': ('pet',), 'utilities': ('utilities',), 'appliances': ('appliances',),
        'features': ('features', 'amenities'), 'lease_term': ('lease term',),
        'available_date': ('available date', 'available from', 'date available'),
        'property_type': ('property type', 'type'),
    }
    for row in soup.select('dl, li, [data-testid*="attribute"], [data-testid*="detail"]'):
        parts = [clean_text(part, 200) for part in row.stripped_strings]
        if len(parts) < 2 or len(parts) > 4:
            continue
        label, value = parts[0].lower(), parts[-1]
        for field, names in labels.items():
            if field in result or not any(name in label for name in names):
                continue
            if field in {'utilities', 'appliances', 'features'}:
                result[field] = [value]
            elif field == 'property_type':
                if normalized := normalize_property_type(value):
                    result[field] = normalized
            else:
                result[field] = value
    if 'description' not in result:
        node = soup.select_one('[data-testid="listing-description"], #description')
        if node and (description := clean_text(node.get_text(' ', strip=True), 10000)):
            result['description'] = description

    # Current Kijiji detail pages also expose these source values in a single
    # rendered facts block. Parse its labelled phrases rather than assigning
    # defaults when an individual field is absent.
    fact_blocks = []
    for node in soup.select('li, [data-testid*="attribute"], [data-testid*="detail"]'):
        text = clean_text(node.get_text(' ', strip=True), 2000)
        if text and any(label in text.lower() for label in ('bedrooms', 'bathrooms', 'sqft', 'utilities', 'rental agreement')) and text not in fact_blocks:
            fact_blocks.append(text)
    facts = max(fact_blocks, key=len, default='')
    if facts:
        scalar_patterns = {
            'bedrooms': r'(\d+)\s*(?:\+\s*den\s*)?bedrooms\b',
            'bathrooms': r'(\d+(?:\.\d+)?)\s+bathrooms\b',
            'square_feet': r'([\d,]+)\s*sq\s*ft\b',
            'parking': r'((?:\d+\s+)?parking\s+(?:included|available))',
            'pets': r'((?:limited\s+|no\s+|pet[- ]friendly\s+)?pets?)\b',
            'lease_term': r'rental agreement\s+(.+?)\s+available\b',
            'available_date': r'available\s+(.+?)\s+utilities\b',
        }
        for field, pattern in scalar_patterns.items():
            if field in result:
                continue
            match = re.search(pattern, facts, re.I)
            if match:
                result[field] = clean_text(match.group(1), 200)
        if 'property_type' not in result:
            match = re.search(r'\bsq\s*ft\s+(apartment|house|condo|townhouse|room)\b', facts, re.I)
            if match and (property_type := normalize_property_type(match.group(1))):
                result['property_type'] = property_type
        if 'utilities' not in result:
            match = re.search(r'\butilities\s+(.+?)(?:\s+furnished\b|\s+appliances\b|\s+includes\b|$)', facts, re.I)
            if match:
                utilities = re.findall(r'.+?\bincluded\b', match.group(1), re.I)
                result['utilities'] = [clean_text(item, 120) for item in utilities if clean_text(item, 120)] or [clean_text(match.group(1), 200)]
        if 'appliances' not in result:
            match = re.search(r'\bappliances\s+(.+?)(?:\s+includes\b|\s+getting around\b|$)', facts, re.I)
            if match and (appliances := clean_text(match.group(1), 500)):
                result['appliances'] = [appliances]
        if 'features' not in result:
            match = re.search(r'\bincludes\s+(.+?)(?:\s+getting around\b|$)', facts, re.I)
            if match and (features := clean_text(match.group(1), 500)):
                result['features'] = [features]
    return result


def detail_snapshot(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException:
        return {}, []
    soup = BeautifulSoup(response.text, 'html.parser')
    documents = json_ld_documents(soup)
    candidates = image_candidates(soup)
    for value in values_for_keys(documents, ('image', 'images')):
        candidates.extend(list_value(value))
    return source_fields_from_detail(soup), unique_images(candidates)


def scrape_kijiji():
    try:
        response = requests.get(TARGET_URL, headers=HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f'Could not fetch Kijiji results: {exc}')
        return []
    soup = BeautifulSoup(response.text, 'html.parser')
    cards = soup.find_all('li', attrs={'data-testid': re.compile('listing-card')})
    if not cards:
        cards = soup.find_all('div', attrs={'data-testid': re.compile('listing-card')})
    listings = []
    for card in cards:
        if len(listings) >= MAX_LISTINGS:
            break
        link = card.find('a', attrs={'data-testid': 'listing-link'}) or card.find('a', href=True)
        if not link:
            continue
        url = urljoin('https://www.kijiji.ca', link.get('href', ''))
        title = clean_text(link.get_text(' ', strip=True), 200)
        price_node = card.find(attrs={'data-testid': re.compile('listing-price')})
        price = parse_price(price_node.get_text(' ', strip=True) if price_node else card.get_text(' ', strip=True))
        if not url or not title or price is None:
            continue
        location_node = card.find(attrs={'data-testid': re.compile('listing-location')})
        location = clean_text(location_node.get_text(' ', strip=True) if location_node else 'Saskatoon, SK', 300)
        source_fields, detail_images = detail_snapshot(url)
        gallery = unique_images([*detail_images, *image_candidates(card)])
        listings.append({
            'source_identifier': listing_identifier(url), 'title': title, 'address': location,
            'rent': price, 'url': url, 'image': gallery[0] if gallery else '', 'images': gallery,
            'source_fields': source_fields,
        })
    return listings


if __name__ == '__main__':
    data = scrape_kijiji()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as output:
        json.dump(data, output, indent=2, ensure_ascii=False)
    print(f'Saved {len(data)} source-backed Kijiji snapshots to {OUTPUT_FILE}')
