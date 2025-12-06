#!/bin/bash

# Install backend dependencies
python3 -m pip install -r requirements.txt

# Run database migrations
python3 manage.py makemigrations --noinput
python3 manage.py migrate --noinput

# Collect static assets for admin and any static files
python3 manage.py collectstatic --noinput --clear
