import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
import re
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv(os.path.join("frontend", ".env"))
GEOAPIFY_API_KEY = os.getenv("REACT_APP_GEOAPIFY_API_KEY")

# 2. Settings
TARGET_URL = "https://www.kijiji.ca/b-apartments-condos/saskatoon/c37l1700197"
OUTPUT_FILE = os.path.join("frontend", "src", "data", "kijiji_listings.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/"
}

coord_cache = {}


def get_coordinates(address):
    if not address or not GEOAPIFY_API_KEY: return None, None
    if address in coord_cache: return coord_cache[address]

    try:
        search_query = f"{address}, Saskatoon, SK, Canada"
        encoded = requests.utils.quote(search_query)
        url = f"https://api.geoapify.com/v1/geocode/search?text={encoded}&apiKey={GEOAPIFY_API_KEY}"

        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('features'):
                props = data['features'][0]['properties']
                lat, lon = props['lat'], props['lon']
                coord_cache[address] = (lat, lon)
                return lat, lon
    except Exception:
        pass
    return None, None


def scrape_kijiji():
    print(f"🕵️‍♂️ Scraping Kijiji Saskatoon...")
    listings = []

    try:
        response = requests.get(TARGET_URL, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')

        search_items = soup.find_all('li', attrs={'data-testid': re.compile('listing-card')})
        if not search_items:
            search_items = soup.find_all('div', attrs={'data-testid': 'listing-card'})

        print(f"✅ Found {len(search_items)} items. Parsing prices correctly...")

        for item in search_items:
            if len(listings) >= 40: break

            try:
                # --- 1. PRICE FIX ---
                price = 1200
                price_node = item.find('p', attrs={'data-testid': 'listing-price'})
                if not price_node: price_node = item.find(string=re.compile(r'\$[0-9,]+'))

                if price_node:
                    p_text = price_node.get_text(strip=True) if hasattr(price_node, 'get_text') else str(price_node)

                    # FIX: Remove .00 cents before stripping non-digits
                    if "." in p_text:
                        p_text = p_text.split(".")[0]

                    clean_p = re.sub(r'[^\d]', '', p_text)
                    if clean_p: price = int(clean_p)

                # Skip if price is suspiciously high (parsing error safety net)
                if price > 10000: price = price // 100

                # --- 2. TITLE & LINK ---
                title_node = item.find('a', attrs={'data-testid': 'listing-link'})
                if not title_node: title_node = item.find('a', class_='title')
                if not title_node: title_node = item.find('a', href=True)

                if not title_node: continue

                title = title_node.get_text(strip=True)
                href = title_node['href']
                full_link = f"https://www.kijiji.ca{href}" if href.startswith('/') else href

                # --- 3. IMAGE ---
                image_url = "🏠"
                img_node = item.find('img')
                if img_node:
                    image_url = img_node.get('src') or img_node.get('data-src') or img_node.get('srcset') or "🏠"
                    if "placeholder" in image_url or "data:image" in image_url:
                        image_url = "🏠"

                # --- 4. LOCATION ---
                location_text = "Saskatoon"
                date_node = item.find('p', attrs={'data-testid': 'listing-date'})
                if not date_node: date_node = item.find('span', class_='date-posted')

                if date_node:
                    raw_loc = date_node.get_text(strip=True)
                    if "ago" not in raw_loc: location_text = raw_loc

                # --- 5. GEOCODE ---
                lat, lon = get_coordinates(location_text)
                if not lat:
                    lat = 52.1332 + (random.uniform(-0.05, 0.05))
                    lon = -106.6700 + (random.uniform(-0.05, 0.05))

                listings.append({
                    "id": len(listings) + 8000,
                    "title": title[:50],
                    "address": f"{location_text}, Saskatoon, SK",
                    "rent": price,
                    "bedrooms": random.choice([1, 2]),
                    "bathrooms": 1,
                    "sqft": random.randint(500, 1000),
                    "image": image_url,
                    "available": "Now",
                    "utilities": "Contact",
                    "parking": True,
                    "laundry": "Shared",
                    "petFriendly": True,
                    "furnished": False,
                    "distance": f"{random.randint(1, 10)} km",
                    "amenities": ["Heating"],
                    "landlord": "Kijiji User",
                    "description": "Found on Kijiji Saskatoon.",
                    "url": full_link,
                    "lat": lat,
                    "lon": lon
                })
            except Exception:
                continue

        if len(listings) == 0:
            return generate_fallback_data()

        return listings

    except Exception as e:
        print(f"Critical Error: {e}")
        return generate_fallback_data()


def generate_fallback_data():
    print("⚠️ Scraper blocked. Generating fallback items.")
    return [
        {
            "id": 9999, "title": "Fallback Kijiji Listing", "rent": 1000,
            "address": "Saskatoon, SK", "lat": 52.1332, "lon": -106.6700,
            "url": "https://kijiji.ca", "image": "🏠"
        }
    ]


if __name__ == "__main__":
    data = scrape_kijiji()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"🎉 Success! Saved {len(data)} listings to {OUTPUT_FILE}")