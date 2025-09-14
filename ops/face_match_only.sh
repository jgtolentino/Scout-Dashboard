#!/usr/bin/env bash
set -euo pipefail

# Face matching only
echo "=== Face Match Only ==="

SUPABASE_URL="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_URL -w)"
SERVICE_KEY="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_SERVICE_KEY -w)"

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/face_match_rpc" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{"p_window_seconds": 90}' | jq .