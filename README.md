# Reelty

Reelty is a React and Django rental platform for students and landlords. Accounts, profiles, property listings, saved properties, roommate decisions, conversations, and messages are stored by the Django backend. The offer-evaluation experiment is intentionally outside the completed product scope.

## Local setup

Requirements: Python 3.10+ and Node.js 18+.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend\src\requirements.txt
.venv\Scripts\python.exe backend\src\manage.py migrate
.venv\Scripts\python.exe backend\src\manage.py import_listings
cd frontend
npm ci
```

Start the backend in one terminal:

```powershell
.venv\Scripts\python.exe backend\src\manage.py runserver 127.0.0.1:8000
```

Start the frontend in another terminal:

```powershell
cd frontend
npm start
```

Open `http://localhost:3000`. The React development proxy sends `/api` requests to Django, so authentication cookies and CSRF protection work without extra configuration.

Development password-reset emails are printed in the backend terminal. Follow the URL in that output to test a reset. Configure SMTP variables for delivered email in production.

## Verification

```powershell
.venv\Scripts\python.exe backend\src\manage.py test users
cd frontend
$env:CI='true'
npm run build
```

## Data

`python manage.py import_listings` validates and updates bundled imported snapshots by stable source identity. It keeps a first valid image in `image`, stores the validated gallery in `images`, and preserves previously captured source fields when a later scrape returns no value. Imported records clearly link to their original source. Their map pins show an approximate city location because the supplied scrapers previously fabricated missing coordinates; landlords can provide precise coordinates for their own listings.

To refresh the Kijiji snapshot, run the source-specific scraper from the repository root, then import its output:

```powershell
.venv\Scripts\python.exe kijiji_scraper.py
.venv\Scripts\python.exe backend\src\manage.py import_listings
```

Imported marketplace availability is separate from Rently's local `active` field. Recheck it manually when needed; successful listing pages become `active`, confirmed 404/410 pages become `unavailable`, and network failures or marketplace bot challenges remain `unknown`.

```powershell
.venv\Scripts\python.exe backend\src\manage.py recheck_imported_listings --limit 25
.venv\Scripts\python.exe backend\src\manage.py recheck_imported_listings --property-id <property-id>
```

SQLite is suitable for local development. Production needs a persistent PostgreSQL database and must run `python manage.py migrate` against it before serving traffic.

## Production environment

Copy `.env.example` into your hosting provider's environment settings. At minimum, set `DJANGO_DEBUG=false`, a long random `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, and `DATABASE_URL`. Configure the SMTP settings to enable delivered password-reset mail.

The root `vercel.json` builds the React app and sends `/api/*` to the Django serverless function. Run database migrations separately whenever a deployment includes new migrations.

## Location Insights backend configuration

The authenticated `POST /api/location-insights/analyze/` endpoint accepts a `property_id`, resolves that server-side listing, and uses Geoapify geocoding and nearby-place evidence before making one Gemini `gemini-3.5-flash-lite` structured-summary request for an uncached, evidence-sufficient listing. Configure `GEOAPIFY_API_KEY` and `GEMINI_API_KEY` only in the Django environment. Google has retired `gemini-2.5-flash-lite` for newly created API accounts, so this project uses Google's current replacement model. The endpoint returns an unavailable result without calling Gemini when it cannot resolve a detailed location or retrieve usable nearby evidence.

The browser-visible `REACT_APP_GEOAPIFY_API_KEY` remains limited to existing map and autocomplete features. Never expose `GEMINI_API_KEY` through a frontend environment variable. Imported or unresolved listing coordinates are not used for detailed insights. Gemini receives only server-collected structured evidence and is instructed not to invent safety, transit, amenity, or neighborhood facts. Until a verified public-safety source is configured, the endpoint returns an explicit unavailable Safety Insights section with no numeric rating.

For local development, put `GEOAPIFY_API_KEY=your-server-geoapify-key` and `GEMINI_API_KEY=your-gemini-api-key` in `backend/.env`; Django loads that ignored file before reading settings. Environment variables set by the host still take precedence. Never put `GEMINI_API_KEY` in `frontend/.env` or name it `REACT_APP_GEMINI_API_KEY`.
