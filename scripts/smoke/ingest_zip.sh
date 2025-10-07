#!/usr/bin/env bash
# Smoke test for ingest-zip function

set -euo pipefail

PROJECT_REF="${PROJECT_REF:?Environment variable PROJECT_REF is required}"
FUNCTIONS_BASE="https://${PROJECT_REF}.functions.supabase.co"
BUCKET="${1:-scout-ingest}"
OBJECT="${2:-edge-inbox/json.zip}"
SRK="${SUPABASE_SERVICE_KEY:?Environment variable SUPABASE_SERVICE_KEY is required}"

echo "🚀 Smoke Test: Ingest ZIP Function"
echo "=================================="
echo "Project: $PROJECT_REF"
echo "Bucket: $BUCKET"
echo "Object: $OBJECT"
echo ""

echo "📡 Calling ingest-zip function..."
RESPONSE=$(curl -fsS -X POST "$FUNCTIONS_BASE/ingest-zip" \
  -H "Content-Type: application/json" \
  -H "apikey: $SRK" \
  -H "Authorization: Bearer $SRK" \
  -d "{\"bucket\":\"$BUCKET\",\"object\":\"$OBJECT\"}")

echo "📥 Response:"
echo "$RESPONSE" | jq '.'

# Parse response
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
ERROR=$(echo "$RESPONSE" | jq -r '.error // null')

if [ "$SUCCESS" = "true" ]; then
  echo ""
  echo "✅ SUCCESS!"
  
  STAGED=$(echo "$RESPONSE" | jq -r '.staged // 0')
  BRONZE=$(echo "$RESPONSE" | jq -r '.bronze_inserted // 0')
  SILVER=$(echo "$RESPONSE" | jq -r '.silver_processed // 0')
  ZIP_SIZE=$(echo "$RESPONSE" | jq -r '.zip_size // 0')
  
  echo "📊 Processing Results:"
  echo "   • ZIP Size: $(numfmt --to=iec --suffix=B $ZIP_SIZE)"
  echo "   • Records Staged: $STAGED"
  echo "   • Bronze Inserted: $BRONZE" 
  echo "   • Silver Processed: $SILVER"
  
  if [ "$BRONZE" -gt 0 ]; then
    echo ""
    echo "🎉 Eugene's data successfully processed!"
    echo "✅ Ready for dashboard consumption"
  else
    echo ""
    echo "⚠️  No records were inserted - check logs"
  fi
  
else
  echo ""
  echo "❌ FAILED!"
  if [ "$ERROR" != "null" ]; then
    echo "Error: $ERROR"
  fi
  exit 1
fi

echo ""
echo "🔍 Quick verification (optional):"
echo "• Check bronze: SELECT COUNT(*) FROM scout.bronze_edge_raw;"
echo "• Check silver: SELECT COUNT(*) FROM scout.silver_transactions;"
echo "• View recent: SELECT * FROM scout.silver_transactions ORDER BY processed_at DESC LIMIT 10;"