#!/bin/bash

# Install dependencies
python3 -m pip install -r requirements.txt

# Collect static assets
python3 manage.py collectstatic --noinput --clear
