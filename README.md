# Rently

React frontend + Django backend. Frontend runs with `npm start`; backend runs with `python manage.py runserver`.

## Structure
- `frontend/` — React app (create-react-app). Build output: `frontend/build`.
- `backend/src/` — Django project (`reelty_backend` + `users` app); run `python manage.py ...` from here.
- `api/` — Vercel serverless entrypoint that imports the Django WSGI app.
- `kijiji_scraper.py`, `listing_scraper.py` — keep (used).
- `vercel.json` — deploy config: builds frontend, routes `/api/*` to Django.

## Commands
- Frontend dev: `cd frontend && npm start`
- Backend dev: `cd backend/src && python manage.py runserver 0.0.0.0:8000`
- Frontend build: `cd frontend && npm run build`

## Notes
- Legacy Node/Express backend removed; backend is Django-only.
- If you need a lockfile, generate `frontend/package-lock.json` from inside `frontend/` (root lock was removed).
