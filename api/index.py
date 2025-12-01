import os
import sys
from pathlib import Path

# Ensure the backend source is on the path so Django imports resolve.
ROOT = Path(__file__).resolve().parent
BACKEND_SRC = ROOT.parent / "backend" / "src"
BACKEND_SRC_STR = str(BACKEND_SRC)
if BACKEND_SRC_STR not in sys.path:
    sys.path.append(BACKEND_SRC_STR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "reelty_backend.settings")

# Reuse the Django WSGI application.
from reelty_backend.wsgi import app as application  # noqa: E402

# Vercel looks for `app` by default.
app = application
