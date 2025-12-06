#!/bin/bash

# Stop script immediately on error
set -e

echo "BUILD START"

# install dependencies using the generic python3 alias
python3 -m pip install -r requirements.txt

# Run migrations (optional, but good to ensure DB connectivity)
# python3 manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python3 manage.py collectstatic --noinput --clear

echo "BUILD END"
