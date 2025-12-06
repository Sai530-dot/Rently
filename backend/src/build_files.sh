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
STATIC_DIR="staticfiles_build"
mkdir -p "$STATIC_DIR/static"
$PYTHON_BIN manage.py collectstatic --noinput --clear
# Ensure the output directory exists even if no static assets are present
touch "$STATIC_DIR/.vercel-keep"

echo "BUILD END"
