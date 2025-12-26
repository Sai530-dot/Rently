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

SECRET_KEY = 'your-secret-key-for-now-12345'
DEBUG = True
ALLOWED_HOSTS = ['.vercel.app', 'now.sh', '127.0.0.1', 'localhost']

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
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
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
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles_build" / "static"
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
