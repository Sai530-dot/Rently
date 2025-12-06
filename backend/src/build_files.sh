#!/bin/bash

# Stop script immediately on error
set -e

echo "BUILD START"

# Resolve python binary
PYTHON_BIN=$(command -v python3 || command -v python)

# Bootstrap pip if missing, then install deps
$PYTHON_BIN -m ensurepip --upgrade || true
$PYTHON_BIN -m pip install --upgrade pip
$PYTHON_BIN -m pip install -r requirements.txt

# Run migrations (optional, but good to ensure DB connectivity)
# python3 manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
$PYTHON_BIN manage.py collectstatic --noinput --clear

echo "BUILD END"
