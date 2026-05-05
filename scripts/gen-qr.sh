#!/usr/bin/env sh
# Regenerate handover/qr.png pointing at the live preview URL.
# Uses qrserver.com — replace with any QR generator you trust.
set -eu
URL="${1:-https://bchuazw.github.io/cooking_game/}"
OUT="${2:-handover/qr.png}"
ENCODED=$(printf '%s' "$URL" | sed 's/:/%3A/g; s|/|%2F|g')
curl -sS -o "$OUT" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=$ENCODED"
echo "wrote $OUT for $URL"
