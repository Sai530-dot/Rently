import os
from django.core.wsgi import get_wsgi_application

# CHANGE 'your_project_name' to the actual name of the folder containing settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')

application = get_wsgi_application()
