#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POCKETBASE_BIN="$ROOT_DIR/bin/pocketbase"

if [ ! -x "$POCKETBASE_BIN" ]; then
  echo "PocketBase binary not found: $POCKETBASE_BIN"
  echo "Download PocketBase into the bin directory first."
  exit 1
fi

cd "$ROOT_DIR"
exec "$POCKETBASE_BIN" serve --http=127.0.0.1:8090
