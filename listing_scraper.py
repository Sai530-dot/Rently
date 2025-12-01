import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv(os.path.join("frontend", ".env"))
GEOAPIFY_API_KEY = os.getenv("REACT_APP_GEOAPIFY_API_KEY")

OUTPUT_FILE = os.path.join("frontend", "src", "data", "craigslist_listings.json")
TARGET_PER_CITY = 200  # 🎯 Listings per city

# ✅ NEW: List of cities to scrape
CITIES = [
    {
        "name": "Toronto",
        "code": "ON",
        "url": "https://toronto.craigslist.org/search/apa",
        "lat_fallback": 43.6532,
        "lon_fallback": -79.3832
    },
    {
        "name": "Saskatoon",
        "code": "SK",
        "url": "https://saskatoon.craigslist.org/search/apa",
        "lat_fallback": 52.1332,
        "lon_fallback": -106.6700
    }
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

coord_cache = {}


def get_coordinates(address, city, region):
    """Converts address to Lat/Lon using Geoapify"""
    if not address or not GEOAPIFY_API_KEY: return None, None

    # Unique cache key including city
    cache_key = f"{address}, {city}"
    if cache_key in coord_cache:
        return coord_cache[cache_key]

    try:
        # Specific query: "123 Main St, Saskatoon, SK, Canada"
        search_query = f"{address}, {city}, {region}, Canada"
        encoded = requests.utils.quote(search_query)
        url = f"https://api.geoapify.com/v1/geocode/search?text={encoded}&apiKey={GEOAPIFY_API_KEY}"

        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('features'):
                props = data['features'][0]['properties']
                lat, lon = props['lat'], props['lon']
                coord_cache[cache_key] = (lat, lon)
                return lat, lon
    except Exception:
        pass
    return None, None


def scrape_listings():
    all_listings = []

    # LOOP THROUGH EACH CITY
    for city_config in CITIES:
        city_name = city_config["name"]
        print(f"\n----------- 🏙️ STARTING: {city_name.upper()} -----------")

        city_listings = []
        page_start = 0

        while len(city_listings) < TARGET_PER_CITY:
            current_url = f"{city_config['url']}?s={page_start}"
            print(f"   📄 Fetching {city_name} page index {page_start}...")

            try:
                response = requests.get(current_url, headers=HEADERS)
                if response.status_code != 200:
                    print(f"   ❌ {city_name} blocked or done.")
                    break

                soup = BeautifulSoup(response.text, 'html.parser')
                results = soup.find_all('li', class_='cl-static-search-result')
                if not results: results = soup.find_all('li', class_='result-row')

                if not results:
                    print(f"   ⚠️ No results for {city_name}. Moving on.")
                    break

                for item in results:
                    if len(city_listings) >= TARGET_PER_CITY: break

                    try:
                        # 1. Title & Link
                        title_tag = item.find('div', class_='title') or item.find('a', class_='result-title')
                        if not title_tag: continue
                        title = title_tag.text.strip()
                        link = title_tag.parent.get('href') or title_tag.get('href')

                        # 2. Price
                        price_tag = item.find('div', class_='price') or item.find('span', class_='result-price')
                        price = int(price_tag.text.replace('$', '').replace(',', '').strip()) if price_tag else 1500

                        # 3. Location
                        loc_tag = item.find('div', class_='location') or item.find('span', class_='result-hood')
                        location_text = loc_tag.text.strip(" ()") if loc_tag else city_name

                        # 4. Images
                        image_url = random.choice(['🏢', '🏠', '🏘️', '🏙️'])
                        img_container = item.find('a', class_='result-image')
                        if img_container and img_container.has_attr('data-ids'):
                            img_ids = img_container['data-ids'].split(',')
                            if img_ids:
                                clean_id = img_ids[0].split(':')[1]
                                image_url = f"https://images.craigslist.org/{clean_id}_300x300.jpg"

                        # 5. Geocode
                        lat, lon = get_coordinates(location_text, city_name, city_config["code"])

                        # Fallback coordinates jittered around city center
                        if not lat:
                            lat = city_config["lat_fallback"] + (random.uniform(-0.05, 0.05))
                            lon = city_config["lon_fallback"] + (random.uniform(-0.05, 0.05))

                        city_listings.append({
                            "id": len(all_listings) + len(city_listings) + 10000,
                            "title": title[:60],
                            "address": f"{location_text}, {city_name}, {city_config['code']}",
                            "rent": price,
                            "bedrooms": random.choice([1, 2, 3]),
                            "bathrooms": 1,
                            "sqft": random.randint(500, 1200),
                            "image": image_url,
                            "available": "Available Now",
                            "utilities": random.choice(["Included", "Not Included"]),
                            "parking": random.choice([True, False]),
                            "laundry": random.choice(["In-unit", "Shared"]),
                            "petFriendly": True,
                            "furnished": False,
                            "distance": f"{random.randint(1, 10)} km",
                            "amenities": ["WiFi", "Heating"],
                            "landlord": "Verified Landlord",
                            "description": f"Great rental opportunity in {city_name}.",
                            "url": link,
                            "lat": lat,
                            "lon": lon
                        })

                    except Exception:
                        continue

                page_start += 120
                time.sleep(2)

            except Exception as e:
                print(f"Error scraping {city_name}: {e}")
                break

        print(f"   ✅ Collected {len(city_listings)} listings for {city_name}")
        all_listings.extend(city_listings)

    return all_listings


if __name__ == "__main__":
    data = scrape_listings()

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    if data:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"\n🎉 TOTAL SUCCESS! Saved {len(data)} listings to {OUTPUT_FILE}")
    else:
        print("⚠️ No data collected.")