import os
from pathlib import Path
from urllib.parse import urlparse

try:
    import dj_database_url  # type: ignore
except ImportError:
    dj_database_url = None

# Fallback SQLite shim for environments without system sqlite3 (e.g., Vercel build image)
try:
    import pysqlite3  # type: ignore
    import sys

    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
except Exception:
    # If pysqlite3 is not installed, keep default import path
    pass

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_environment_file(path):
    """Load local Django settings without overriding real process environment values."""
    try:
        lines = path.read_text(encoding='utf-8').splitlines()
    except OSError:
        return
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        name, value = line.split('=', 1)
        name = name.removeprefix('export ').strip()
        if name:
            os.environ.setdefault(name, value.strip().strip('"').strip("'"))


# Local server credentials belong in backend/.env. Frontend .env files are not
# loaded here so browser-only REACT_APP_* variables cannot become server secrets.
_load_environment_file(BASE_DIR.parent / '.env')

DEBUG = os.environ.get('DJANGO_DEBUG', 'true').lower() == 'true'
LOCAL_SECRET_KEY = 'local-development-only-reelty-key-change-this-before-production-2026'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', LOCAL_SECRET_KEY)
if not DEBUG and SECRET_KEY == LOCAL_SECRET_KEY:
    raise RuntimeError('Set DJANGO_SECRET_KEY before running in production.')
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'users',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'reelty_backend.urls'

sqlite_name = os.environ.get("SQLITE_NAME", "db.sqlite3")
# Default to project directory for local/dev; override with SQLITE_PATH or DATABASE_URL when needed.
default_sqlite_path = Path(os.environ.get("SQLITE_PATH", BASE_DIR)) / sqlite_name


def parse_database_url(database_url: str):
    """
    Minimal DATABASE_URL parser for environments where dj_database_url is absent.
    Supports postgres, mysql, and sqlite URLs.
    """
    parsed = urlparse(database_url)
    scheme = parsed.scheme

    if scheme.startswith("postgres"):
        engine = "django.db.backends.postgresql"
    elif scheme.startswith("mysql"):
        engine = "django.db.backends.mysql"
    elif scheme.startswith("sqlite"):
        engine = "django.db.backends.sqlite3"
    else:
        raise ValueError(f"Unsupported DATABASE_URL scheme: {scheme}")

    # sqlite: path is full file path
    if engine == "django.db.backends.sqlite3":
        return {
            "ENGINE": engine,
            "NAME": parsed.path if parsed.path else default_sqlite_path,
        }

    return {
        "ENGINE": engine,
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username or "",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "",
        "PORT": parsed.port or "",
        "CONN_MAX_AGE": 600,
    }


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': default_sqlite_path,
    }
}

# Override database configuration if DATABASE_URL is provided (e.g., Postgres on Vercel)
db_url = os.environ.get('DATABASE_URL')
if db_url:
    if dj_database_url:
        DATABASES['default'] = dj_database_url.config(
            conn_max_age=600,
            conn_health_checks=True
        )
    else:
        DATABASES['default'] = parse_database_url(db_url)

AUTH_USER_MODEL = 'users.CustomUser'

# CORS settings for frontend
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001',
).split(',')
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
CSRF_FAILURE_VIEW = 'users.api.csrf_failure'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SAMESITE = 'Lax'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
CORS_ALLOW_CREDENTIALS = True

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles_build" / "static"
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'true').lower() == 'true'
EMAIL_TIMEOUT = 15
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'reelty@localhost')
PASSWORD_RESET_TIMEOUT = 3600

# Location Insights uses server-only provider credentials. Never expose these as
# REACT_APP_* variables, which are embedded in the browser build.
GEOAPIFY_API_KEY = os.environ.get('GEOAPIFY_API_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
# Gemini 2.5 Flash-Lite is unavailable to newly created Gemini API accounts.
GEMINI_MODEL = 'gemini-3.5-flash-lite'
LOCATION_INSIGHTS_CACHE_SECONDS = int(os.environ.get('LOCATION_INSIGHTS_CACHE_SECONDS', '3600'))
LOCATION_INSIGHTS_HTTP_TIMEOUT_SECONDS = int(os.environ.get('LOCATION_INSIGHTS_HTTP_TIMEOUT_SECONDS', '10'))
LOCATION_INSIGHTS_MAX_AMENITIES = int(os.environ.get('LOCATION_INSIGHTS_MAX_AMENITIES', '3'))
