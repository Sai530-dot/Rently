# Rently

Rently is a rental platform for students and landlords. It's built with React for the frontend and Django for the backend, providing property listings, roommate matching, messaging, and location insights using AI.

## Features

### For Students
- Browse and filter rental properties by location, price, bedrooms, and property type
- View properties on an interactive map
- Save interesting listings for later
- Find compatible roommates using preference matching
- Message landlords and potential roommates
- Get AI-powered insights about neighborhoods, transit, and amenities

### For Landlords
- Create and manage rental listings
- Communicate with prospective tenants
- Track property availability
- Add precise locations for properties

### AI Features
- Location insights using Gemini AI
- Geocoding with Geoapify
- Automatic detection of nearby amenities (groceries, healthcare, transit, schools)
- Student-focused neighborhood analysis

## Tech Stack

### Frontend
- React 18.2.0
- React Scripts 5.0.1
- MapLibre GL 5.15.0 for mapping
- Custom CSS styling

### Backend
- Django 5.2
- Django CORS Headers
- PostgreSQL for production, SQLite for development
- WhiteNoise for static files
- Requests for HTTP calls
- BeautifulSoup4 for web scraping

### External APIs
- Geoapify for geocoding and mapping
- Google Gemini AI for location analysis
- MapLibre for map tiles

## Prerequisites

- Python 3.10+
- Node.js 18+
- pip
- npm
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Rently
```

### 2. Backend setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

**macOS/Linux:**
```bash
source .venv/bin/activate
```

**Windows:**
```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r backend/src/requirements.txt
```

Configure environment variables by creating `backend/.env`:

```bash
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000

# Optional: Database configuration
# DATABASE_URL=postgresql://user:password@host:5432/reelty

# Optional: Email configuration
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_HOST_USER=your-email@example.com
# EMAIL_HOST_PASSWORD=your-password
# EMAIL_USE_TLS=true
# DEFAULT_FROM_EMAIL=Rently <no-reply@example.com>

# API keys for location insights
GEOAPIFY_API_KEY=your-geoapify-api-key
GEMINI_API_KEY=your-gemini-api-key
```

Run database migrations:

```bash
python backend/src/manage.py migrate
```

Import sample listings:

```bash
python backend/src/manage.py import_listings
```

### 3. Frontend setup

Install dependencies:

```bash
cd frontend
npm install
```

Configure frontend environment by creating `frontend/.env`:

```bash
REACT_APP_GEOAPIFY_API_KEY=your-geoapify-api-key
```

## Running the Application

Start the backend (Terminal 1):

```bash
python backend/src/manage.py runserver 127.0.0.1:8000
```

Start the frontend (Terminal 2):

```bash
cd frontend
npm start
```

Open your browser to `http://localhost:3000`

The React development proxy forwards API requests to Django automatically.

## Project Structure

```
Rently/
├── api/                          # Vercel serverless functions
│   ├── index.py                  # Django WSGI entry point
│   └── requirements.txt
├── backend/                      # Django backend
│   ├── src/
│   │   ├── manage.py            # Django management commands
│   │   ├── reelty_backend/       # Django project settings
│   │   │   ├── settings.py
│   │   │   ├── urls.py
│   │   │   └── wsgi.py
│   │   └── users/               # Main Django app
│   │       ├── models.py        # Database models
│   │       ├── views.py         # API views
│   │       ├── api.py           # API endpoints
│   │       ├── urls.py          # App URL routing
│   │       ├── location_insights.py  # AI location analysis
│   │       ├── matching.py      # Roommate matching
│   │       ├── tests.py         # Unit tests
│   │       └── management/      # Custom management commands
│   │           └── commands/
│   │               ├── import_listings.py
│   │               └── recheck_imported_listings.py
│   └── requirements.txt
├── frontend/                     # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── BrowseProperties.js
│   │   │   ├── Dashboard.js
│   │   │   ├── RoommateMatching.js
│   │   │   ├── Messages.js
│   │   │   ├── PropertyMap.js
│   │   │   └── others...
│   │   ├── services/
│   │   │   └── api.js          # API client
│   │   ├── data/                 # Sample data
│   │   │   ├── craigslist_listings.json
│   │   │   ├── kijiji_listings.json
│   │   │   └── real_listings.json
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
├── scripts/                      # Utility scripts
│   ├── kijiji_scraper.py
│   └── listing_scraper.py
├── shared/                       # Shared utilities
│   └── README.md
├── .env.example
├── .gitignore
├── README.md
└── vercel.json
```

## API Documentation

### Authentication

#### POST `/api/auth/register/`
Register a new user account.

#### POST `/api/auth/login/`
Authenticate user and create session.

#### GET `/api/auth/session/`
Get current authenticated user session.

#### POST `/api/auth/logout/`
End user session.

### Properties

#### GET `/api/properties/`
List all properties with optional filtering by city, max rent, bedrooms, or type.

#### POST `/api/properties/`
Create a new property listing (landlords only).

#### PUT `/api/properties/<id>/`
Update an existing property listing.

#### DELETE `/api/properties/<id>/`
Delete a property listing.

#### POST `/api/saved-properties/`
Save a property to user's favorites.

#### DELETE `/api/saved-properties/<id>/`
Remove property from favorites.

#### GET `/api/saved-properties/`
Get user's saved properties.

### Roommate Matching

#### GET `/api/roommates/`
Get potential roommate matches based on preferences.

#### POST `/api/roommate-decisions/`
Record like/pass decisions on roommate candidates.

### Messaging

#### GET `/api/conversations/`
Get user's message conversations.

#### POST `/api/conversations/`
Start a new conversation.

#### GET `/api/conversations/<id>/messages/`
Get messages in a conversation.

#### POST `/api/conversations/<id>/messages/`
Send a message in a conversation.

### Location Insights

#### POST `/api/location-insights/analyze/`
Get AI-powered location insights for a property.

Request:
```json
{
  "property_id": 123
}
```

## Testing

### Backend Tests

```bash
# Run all tests
python backend/src/manage.py test

# Run specific app tests
python backend/src/manage.py test users

# Run with verbose output
python backend/src/manage.py test --verbosity=2
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests in CI mode
CI=true npm test

# Build for production
npm run build

# Run linter
npm run lint
```

## Data Management

### Importing Listings

Import sample rental data:

```bash
python backend/src/manage.py import_listings
```

### Refreshing Data

Update listings from external sources:

```bash
# Run Kijiji scraper
python scripts/kijiji_scraper.py

# Import updated data
python backend/src/manage.py import_listings
```

### Checking Listing Availability

```bash
# Check availability of imported listings
python backend/src/manage.py recheck_imported_listings --limit 25

# Check specific property
python backend/src/manage.py recheck_imported_listings --property-id 123
```

## Deployment

The root `vercel.json` uses Vercel Services so the `frontend/` Create React App and `backend/src/` Django application deploy together in the single `rently` project. Public routing sends `/api` and `/api/*` to Django while all other paths go to the React SPA. The backend receives the original `/api/...` request path, so no frontend API base URL change is required. Keep the Vercel project Root Directory at the repository root and use the Services framework preset. Run database migrations separately whenever a deployment includes new migrations.

Set these production environment variables in the `rently` Vercel project: `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS=rently-sand.vercel.app`, `CORS_ALLOWED_ORIGINS=https://rently-sand.vercel.app`, `FRONTEND_URL=https://rently-sand.vercel.app`, `GEOAPIFY_API_KEY`, and `GEMINI_API_KEY`. Do not set `GEMINI_API_KEY` as a `REACT_APP_*` variable.

## Troubleshooting

### Backend won't start
- Ensure virtual environment is activated
- Verify dependencies with `pip install -r backend/src/requirements.txt`
- Check that migrations have been run

### Frontend won't start
- Ensure Node.js 18+ is installed
- Delete node_modules and run `npm install`
- Check that port 3000 is not in use

### API requests failing
- Verify CORS_ALLOWED_ORIGINS includes your frontend URL
- Check backend logs for error messages
- Ensure environment variables are configured

### Location insights not working
- Verify Geoapify and Gemini API keys are valid
- Ensure properties have valid addresses for geocoding
- Review backend logs for API request failures

### Images not loading
- Verify external image URLs are accessible
- Check browser console for CORS or loading errors
- Try opening image URLs directly in browser

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly with both backend and frontend tests
4. Commit with clear messages
5. Push and create a pull request

### Code Style
- Python: Follow PEP 8 guidelines
- JavaScript: Use the provided ESLint configuration
- Add comments for complex logic
- Use descriptive variable and function names

### Testing Requirements
- Write unit tests for new API endpoints
- Write component tests for new React components
- Test API integration between frontend and backend

## License

This project is licensed under the MIT License.