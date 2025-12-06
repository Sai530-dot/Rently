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

# Run migrations when a real database is configured
if [ -n "$DATABASE_URL" ]; then
  echo "Running migrations against DATABASE_URL..."
  $PYTHON_BIN manage.py migrate --noinput
else
  echo "Skipping migrations (DATABASE_URL not set; using ephemeral /tmp sqlite)."
fi

# Collect static files
echo "Collecting static files..."
STATIC_DIR="staticfiles_build"
mkdir -p "$STATIC_DIR/static"
$PYTHON_BIN manage.py collectstatic --noinput --clear
# Ensure the output directory exists even if no static assets are present
touch "$STATIC_DIR/.vercel-keep"

echo "BUILD END"
