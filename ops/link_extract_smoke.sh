#!/usr/bin/env bash
set -euo pipefail

# Quick smoke test: did link & extract actually do work?
# Usage: ops/link_extract_smoke.sh

echo "=== Link & Extract Smoke Test ==="

# Get credentials from Keychain
SUPABASE_URL="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_URL -w)"
SERVICE_KEY="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_SERVICE_KEY -w)"

# Call the RPC
echo "Calling link_and_extract_rpc..."
RESULT=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/link_and_extract_rpc" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{"p_window_seconds": 90}' || echo '{"error": "failed"}')

echo "Result: $RESULT"

# Parse results
LINKED=$(echo "$RESULT" | jq -r '.linked // 0')
EXTRACTED=$(echo "$RESULT" | jq -r '.extracted // 0')

echo "Linked: $LINKED face events to transactions"
echo "Extracted: $EXTRACTED brand mentions from segments"

# Quick verification queries
echo ""
echo "=== Verification Queries ==="

# Check face_txn_link table
FACE_LINKS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/analytics.face_txn_link?select=count" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[0].count // 0')

echo "Total face→transaction links: $FACE_LINKS"

# Check txn_brand_hits table  
BRAND_HITS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/analytics.txn_brand_hits?select=count" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[0].count // 0')

echo "Total brand hits extracted: $BRAND_HITS"

# Check brand coverage view
echo ""
echo "=== Recent Brand Coverage ==="
curl -s -X GET "$SUPABASE_URL/rest/v1/analytics.v_brand_coverage?order=dte.desc&limit=5" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[] | "\(.dte): \(.detected)/\(.total_hits) (\(.hit_rate)% hit rate)"'

# Check face match quality
echo ""
echo "=== Recent Face Match Quality ==="
curl -s -X GET "$SUPABASE_URL/rest/v1/analytics.v_face_match_quality?order=dte.desc&limit=5" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[] | "\(.dte): \(.links) links, \(.p50_conf) avg confidence, \(.avg_dt_ms)ms avg delta"'

echo ""
echo "=== Smoke Test Complete ==="