import os
import sys
from django.core.wsgi import get_wsgi_application

# 1. Add the 'src' folder to the system path so Python can find 'reelty_backend'
# This gets the folder above the current one (which is 'src')
current_path = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.dirname(current_path)
if src_path not in sys.path:
    sys.path.append(src_path)

# 2. Set the correct settings module
# CHANGE 'your_project_name' -> 'reelty_backend'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reelty_backend.settings')

application = get_wsgi_application()

# Vercel looks for an `app` callable by default; alias the Django WSGI application.
app = application
