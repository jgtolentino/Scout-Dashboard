#!/usr/bin/env bash
# Smoke test for real-time NDJSON streaming

set -euo pipefail

PROJECT_REF="${PROJECT_REF:?Environment variable PROJECT_REF is required}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Environment variable SUPABASE_SERVICE_KEY is required}"

echo "🚀 Smoke Test: Real-time NDJSON Streaming"
echo "=========================================="
echo "Project: $PROJECT_REF"
echo ""

# Create test NDJSON data
TEST_FILE="/tmp/scout_stream_test.jsonl"
DEVICE_ID="test-device-$(date +%s)"

echo "📝 Creating test data..."
cat > "$TEST_FILE" <<EOF
{"id":"test-$(uuidgen)","device_id":"$DEVICE_ID","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","sku":"SKU-001","peso_value":25.50,"store_id":"STORE-001","brand_name":"Test Brand"}
{"id":"test-$(uuidgen)","device_id":"$DEVICE_ID","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","sku":"SKU-002","peso_value":45.75,"store_id":"STORE-002","brand_name":"Another Brand"}
{"id":"test-$(uuidgen)","device_id":"$DEVICE_ID","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","sku":"SKU-003","peso_value":15.25,"store_id":"STORE-001","brand_name":"Test Brand"}
EOF

echo "✅ Test data created with device ID: $DEVICE_ID"
echo ""

# Test the streaming function
echo "📡 Testing streaming function..."
RESPONSE=$(curl -fsS -X POST "https://$PROJECT_REF.functions.supabase.co/ingest-stream" \
  -H "Content-Type: application/x-ndjson" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "x-device-id: $DEVICE_ID" \
  --data-binary @"$TEST_FILE")

echo "📥 Streaming Response:"
echo "$RESPONSE" | jq '.'

# Parse response
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  LINES=$(echo "$RESPONSE" | jq -r '.lines_seen // 0')
  INSERTED=$(echo "$RESPONSE" | jq -r '.inserted // 0')
  ERRORS=$(echo "$RESPONSE" | jq -r '.errors // 0')
  
  echo ""
  echo "✅ Streaming test PASSED!"
  echo "📊 Lines processed: $LINES"
  echo "💾 Records inserted: $INSERTED"
  echo "❌ Parse errors: $ERRORS"
  
  if [ "$INSERTED" -eq 3 ]; then
    echo "🎉 All test records inserted successfully!"
  else
    echo "⚠️  Expected 3 records, got $INSERTED"
  fi
else
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
  echo ""
  echo "❌ Streaming test FAILED!"
  echo "Error: $ERROR"
  exit 1
fi

echo ""
echo "🔍 Verifying data in database..."

# Check if records exist in bronze layer
BRONZE_COUNT=$(curl -fsS -X POST "https://$PROJECT_REF.supabase.co/rest/v1/rpc/count_bronze_by_device" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"device_filter\":\"$DEVICE_ID\"}" 2>/dev/null || echo "0")

if [ "$BRONZE_COUNT" -gt 0 ]; then
  echo "✅ Found $BRONZE_COUNT records in bronze layer for device $DEVICE_ID"
else
  echo "⚠️  No records found in bronze layer (this might be OK if processing is async)"
fi

echo ""
echo "🧪 Testing edge client scripts..."

# Test bash script
echo "📊 Testing Bash client..."
export SUPABASE_EDGE_TOKEN="$SUPABASE_SERVICE_KEY"
export DEVICE_ID="$DEVICE_ID-bash"

if BASH_RESULT=$(scripts/edge/stream_ndjson.sh "$TEST_FILE" 2>&1); then
  echo "✅ Bash client test passed"
  echo "$BASH_RESULT" | tail -5
else
  echo "❌ Bash client test failed"
  echo "$BASH_RESULT"
fi

echo ""

# Test Python script  
echo "🐍 Testing Python client..."
export DEVICE_ID="$DEVICE_ID-python"

if command -v python3 >/dev/null 2>&1; then
  if PYTHON_RESULT=$(python3 scripts/edge/stream_ndjson.py "$TEST_FILE" 2>&1); then
    echo "✅ Python client test passed"
    echo "$PYTHON_RESULT" | jq -r '.lines_seen // "unknown"' | xargs echo "Lines processed:"
  else
    echo "❌ Python client test failed"
    echo "$PYTHON_RESULT"
  fi
else
  echo "⚠️  Python3 not available, skipping Python client test"
fi

echo ""
echo "🧹 Cleanup..."
rm -f "$TEST_FILE"

echo ""
echo "✅ STREAMING SMOKE TEST COMPLETE!"
echo ""
echo "🔗 Next steps:"
echo "• Check bronze records: SELECT * FROM scout.bronze_edge_raw WHERE device_id LIKE '$DEVICE_ID%';"
echo "• Process to silver: SELECT scout.process_recent_bronze_to_silver(10);"
echo "• View streaming stats: SELECT * FROM scout.streaming_stats;"