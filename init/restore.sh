#!/bin/bash
set -e

echo ">>> [init] Ripristino backup PrenotazioniDB..."

pg_restore \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  /tmp/PrenotazioniDB.backup \
  2>&1 | grep -v 'already exists' || true

echo ">>> [init] Ripristino completato."
