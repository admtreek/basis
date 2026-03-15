#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POCKETBASE_BIN="$ROOT_DIR/bin/pocketbase"
DATA_DIR="$ROOT_DIR/pb_data"
MIGRATIONS_DIR="$ROOT_DIR/pb_migrations"
PUBLIC_DIR="$ROOT_DIR/public"
HOOKS_DIR="$ROOT_DIR/pb_hooks"

if [ ! -x "$POCKETBASE_BIN" ]; then
  echo "PocketBase binary not found: $POCKETBASE_BIN"
  echo "Download PocketBase into the bin directory first."
  exit 1
fi

cd "$ROOT_DIR"
exec "$POCKETBASE_BIN" serve \
  --http=127.0.0.1:8090 \
  --dir="$DATA_DIR" \
  --migrationsDir="$MIGRATIONS_DIR" \
  --publicDir="$PUBLIC_DIR" \
  --hooksDir="$HOOKS_DIR"
