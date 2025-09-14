#!/usr/bin/env bash
set -euo pipefail

# Brand extraction only
echo "=== Brand Extract Only ==="

SUPABASE_URL="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_URL -w)"
SERVICE_KEY="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_SERVICE_KEY -w)"

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/brand_extract_rpc" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" | jq .