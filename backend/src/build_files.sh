#!/bin/bash

# Install dependencies
python3.9 -m pip install -r requirements.txt

# Collect static assets
python3.9 manage.py collectstatic --noinput --clear
