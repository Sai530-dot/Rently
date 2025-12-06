import os
from pathlib import Path
import dj_database_url

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
# Default to /tmp for writeable sqlite on serverless; override with DATABASE_URL for persistent DB.
default_sqlite_path = Path(os.environ.get("SQLITE_PATH", "/tmp")) / sqlite_name
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': default_sqlite_path,
    }
}

# Override database configuration if DATABASE_URL is provided (e.g., Postgres on Vercel)
if 'DATABASE_URL' in os.environ:
    DATABASES['default'] = dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True
    )

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
