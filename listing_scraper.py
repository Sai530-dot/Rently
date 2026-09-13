"""Capture source-backed Craigslist rental snapshots without invented fields."""
import json
import os
import re
import time
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


OUTPUT_FILE = os.path.join('frontend', 'src', 'data', 'craigslist_listings.json')
TARGET_PER_CITY = 200
REQUEST_TIMEOUT_SECONDS = 15
CITIES = (
    {'name': 'Toronto', 'code': 'ON', 'url': 'https://toronto.craigslist.org/search/apa'},
    {'name': 'Saskatoon', 'code': 'SK', 'url': 'https://saskatoon.craigslist.org/search/apa'},
)
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ReeltySnapshot/1.0)', 'Accept-Language': 'en-CA,en;q=0.9'}


def clean_text(value, limit=10000):
    return ' '.join(str(value or '').split())[:limit]


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
    token = urlparse(url).path.rstrip('/').split('/')[-1]
    return f'craigslist:{token}' if re.fullmatch(r'[A-Za-z0-9]{12,}', token or '') else ''


def valid_image_url(value):
    value = clean_text(value, 2000)
    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        return ''
    if parsed.netloc.lower() != 'images.craigslist.org':
        return ''
    return re.sub(r'_\d+x\d+[a-z]?\.jpg$', '_600x450.jpg', value, flags=re.I)


def unique_images(values):
    images = []
    for value in values:
        image = valid_image_url(value)
        if image and image not in images:
            images.append(image)
    return images


def json_ld_documents(soup):
    documents = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            document = json.loads(script.get_text())
        except json.JSONDecodeError:
            continue
        if isinstance(document, dict):
            documents.append(document)
    return documents


def property_json_ld(documents):
    for document in documents:
        if document.get('@type') in {'Apartment', 'House', 'SingleFamilyResidence', 'Residence'}:
            return document
    return {}


def normalize_property_type(value):
    value = clean_text(value, 100).lower()
    if 'apartment' in value:
        return 'Apartment'
    if 'condo' in value:
        return 'Condominium'
    if any(word in value for word in ('house', 'residence')):
        return 'Single Family House'
    if 'room' in value:
        return 'Room'
    return ''


def source_fields_from_detail(soup):
    fields = {}
    property_data = property_json_ld(json_ld_documents(soup))
    if property_data:
        for source_name, target_name in (('numberOfBedrooms', 'bedrooms'), ('numberOfBathroomsTotal', 'bathrooms')):
            if property_data.get(source_name) is not None:
                fields[target_name] = str(property_data[source_name])
        if property_type := normalize_property_type(property_data.get('@type')):
            fields['property_type'] = property_type
        if property_data.get('petsAllowed') is True:
            fields['pets'] = 'Pets allowed'

    attribute_text = ' '.join(clean_text(group.get_text(' ', strip=True), 1000) for group in soup.select('.attrgroup'))
    if match := re.search(r'(\d+)\s*BR\b', attribute_text, re.I):
        fields.setdefault('bedrooms', match.group(1))
    if match := re.search(r'(\d+(?:\.\d+)?)\s*Ba\b', attribute_text, re.I):
        fields.setdefault('bathrooms', match.group(1))
    if match := re.search(r'([\d,]+)\s*ft\s*(?:2|²)?\b', attribute_text, re.I):
        fields['square_feet'] = match.group(1)
    if re.search(r'\bavailable now\b', attribute_text, re.I):
        fields['available_date'] = 'Available now'
    if re.search(r'\b(?:off-street parking|attached garage|detached garage|carport)\b', attribute_text, re.I):
        parking = re.search(r'\b(off-street parking|attached garage|detached garage|carport)\b', attribute_text, re.I)
        fields['parking'] = parking.group(1).title()
    if re.search(r'\b(?:cats|dogs) are ok\b', attribute_text, re.I):
        fields['pets'] = 'Pets allowed'
    features = []
    for pattern, label in ((r'\bw/d in unit\b', 'In-unit laundry'), (r'\bw/d hookups\b', 'Laundry hookups'),
                           (r'\bair conditioning\b', 'Air conditioning'), (r'\bwheelchair accessible\b', 'Wheelchair accessible')):
        if re.search(pattern, attribute_text, re.I):
            features.append(label)
    if features:
        fields['features'] = features

    body = soup.select_one('#postingbody')
    description = clean_text(body.get_text(' ', strip=True), 10000) if body else ''
    description = re.sub(r'^QR Code Link to This Post\s*', '', description, flags=re.I)
    if description:
        fields['description'] = description
    if re.search(r'\ball utilities included\b', description, re.I):
        fields['utilities'] = ['All utilities included']
    appliances = []
    if re.search(r'\bin[- ]suite laundry\b', description, re.I):
        appliances.append('In-suite laundry')
    if re.search(r'\bdishwasher\b', description, re.I):
        appliances.append('Dishwasher')
    if appliances:
        fields['appliances'] = appliances
    return fields


def detail_snapshot(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException:
        return {}, []
    soup = BeautifulSoup(response.text, 'html.parser')
    images = [meta.get('content') for meta in soup.select('meta[property="og:image"]')]
    images.extend(image.get('src') for image in soup.select('img[src]'))
    return source_fields_from_detail(soup), unique_images(images)


def search_results(soup):
    rows = soup.select('li.cl-static-search-result, li.result-row')
    if rows:
        return rows
    return [anchor.parent for anchor in soup.select('a[href*="/view/d/"]')]


def result_snapshot(row, city):
    link = row.select_one('a[href*="/view/d/"]') or row.find('a', href=True)
    if not link:
        return None
    url = urljoin('https://www.craigslist.org', link.get('href', ''))
    title_node = row.select_one('.title') or link
    price_node = row.select_one('.price')
    location_node = row.select_one('.location')
    title = clean_text(title_node.get_text(' ', strip=True), 200)
    price = parse_price(price_node.get_text(' ', strip=True) if price_node else row.get_text(' ', strip=True))
    if not url or not title or price is None:
        return None
    source_fields, gallery = detail_snapshot(url)
    location = clean_text(location_node.get_text(' ', strip=True) if location_node else '', 200)
    address = ', '.join(part for part in (location, city['name'], city['code']) if part)
    return {
        'source_identifier': listing_identifier(url), 'title': title, 'address': address,
        'rent': price, 'url': url, 'image': gallery[0] if gallery else '', 'images': gallery,
        'source_fields': source_fields,
    }


def scrape_city(city):
    listings = []
    offset = 0
    while len(listings) < TARGET_PER_CITY:
        try:
            response = requests.get(f"{city['url']}?s={offset}", headers=HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
            response.raise_for_status()
        except requests.RequestException:
            break
        rows = search_results(BeautifulSoup(response.text, 'html.parser'))
        if not rows:
            break
        before = len(listings)
        for row in rows:
            if len(listings) >= TARGET_PER_CITY:
                break
            snapshot = result_snapshot(row, city)
            if snapshot and all(snapshot['source_identifier'] != item['source_identifier'] for item in listings):
                listings.append(snapshot)
        if len(listings) == before:
            break
        offset += len(rows)
        time.sleep(1)
    return listings


def scrape_listings():
    listings = []
    for city in CITIES:
        city_listings = scrape_city(city)
        print(f"Collected {len(city_listings)} source-backed Craigslist listings for {city['name']}.")
        listings.extend(city_listings)
    return listings


if __name__ == '__main__':
    data = scrape_listings()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as output:
        json.dump(data, output, indent=2, ensure_ascii=False)
    print(f'Saved {len(data)} source-backed Craigslist snapshots to {OUTPUT_FILE}.')
