#!/bin/bash
# Scout Analytics - Register Supabase Datasources
# Registers Supabase datasources on both MindsDB instances with proper role isolation
# Usage: ./ops/mindsdb/register_datasources.sh

set -euo pipefail

echo "📊 Registering Supabase datasources on MindsDB instances..."

# Extract connection details from Keychain
POOLER_URL="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__PG_URL_POOLER -w)"
HOST="$(echo "$POOLER_URL" | sed -E "s#.*@([^:/]+):([0-9]+)/([^?]+).*#\1#")"
PORT="$(echo "$POOLER_URL" | sed -E "s#.*@([^:/]+):([0-9]+)/([^?]+).*#\2#")"
DBN="$(echo "$POOLER_URL" | sed -E "s#.*@([^:/]+):([0-9]+)/([^?]+).*#\3#")"

# Get credentials from Keychain
D_USER="$(security find-generic-password -a "$USER" -s SCOUT__MCP__DESKTOP_DB_USER -w)"
D_PASS="$(security find-generic-password -a "$USER" -s SCOUT__MCP__DESKTOP_DB_PASS -w)"
C_USER="$(security find-generic-password -a "$USER" -s SCOUT__MCP__CODE_DB_USER -w)"
C_PASS="$(security find-generic-password -a "$USER" -s SCOUT__MCP__CODE_DB_PASS -w)"
W_USER="$(security find-generic-password -a "$USER" -s SCOUT__MCP__CODEW_DB_USER -w)"
W_PASS="$(security find-generic-password -a "$USER" -s SCOUT__MCP__CODEW_DB_PASS -w)"

if [[ -z "$D_USER" || -z "$C_USER" || -z "$W_USER" ]]; then
    echo "❌ MindsDB credentials not found in Keychain"
    echo "💡 Run: ./setup_roles.sh first"
    exit 1
fi

echo "🔗 Connection: $HOST:$PORT/$DBN"
echo ""

# Register read-only datasource on Desktop instance (analytics views only)
echo "🖥️  Registering supabase_ds_desktop (analytics views only)..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:47334/api/databases \
  -H "Content-Type: application/json" \
  -d "{
    \"database\": {
      \"name\": \"supabase_ds_desktop\",
      \"engine\": \"postgres\",
      \"parameters\": {
        \"host\": \"$HOST\",
        \"port\": \"$PORT\",
        \"database\": \"$DBN\",
        \"user\": \"$D_USER\",
        \"password\": \"$D_PASS\",
        \"sslmode\": \"require\"
      }
    }
  }")

if echo "$RESPONSE" | jq -e '.name' >/dev/null 2>&1; then
    echo "✅ Desktop datasource registered successfully"
else
    echo "❌ Desktop datasource registration failed:"
    echo "$RESPONSE" | jq .
    exit 1
fi

# Register read-only datasource on Code instance (analytics + ref)
echo "💻 Registering supabase_ds_code (analytics + ref)..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:57334/api/databases \
  -H "Content-Type: application/json" \
  -d "{
    \"database\": {
      \"name\": \"supabase_ds_code\",
      \"engine\": \"postgres\",
      \"parameters\": {
        \"host\": \"$HOST\",
        \"port\": \"$PORT\",
        \"database\": \"$DBN\",
        \"user\": \"$C_USER\",
        \"password\": \"$C_PASS\",
        \"sslmode\": \"require\"
      }
    }
  }")

if echo "$RESPONSE" | jq -e '.name' >/dev/null 2>&1; then
    echo "✅ Code read datasource registered successfully"
else
    echo "❌ Code read datasource registration failed:"
    echo "$RESPONSE" | jq .
    exit 1
fi

# Register write-only datasource on Code instance (analytics_snap)
echo "✍️  Registering supabase_ds_codew (write-only to analytics_snap)..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:57334/api/databases \
  -H "Content-Type: application/json" \
  -d "{
    \"database\": {
      \"name\": \"supabase_ds_codew\",
      \"engine\": \"postgres\",
      \"parameters\": {
        \"host\": \"$HOST\",
        \"port\": \"$PORT\",
        \"database\": \"$DBN\",
        \"user\": \"$W_USER\",
        \"password\": \"$W_PASS\",
        \"sslmode\": \"require\"
      }
    }
  }")

if echo "$RESPONSE" | jq -e '.name' >/dev/null 2>&1; then
    echo "✅ Code write datasource registered successfully"
else
    echo "❌ Code write datasource registration failed:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo ""
echo "🧪 Testing datasource connections..."

# Test Desktop instance (should only see analytics)
echo "  🖥️  Testing desktop access (analytics only)..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:47334/api/sql/query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = '\''analytics'\'' ORDER BY table_name LIMIT 5;"}')

if echo "$RESPONSE" | jq -e '.results[0].rows' >/dev/null 2>&1; then
    echo "    ✅ Desktop can access analytics schema"
    echo "$RESPONSE" | jq '.results[0].rows'
else
    echo "    ❌ Desktop access test failed"
fi

# Test Code instance (should see analytics + ref)
echo "  💻 Testing code access (analytics + ref)..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:57334/api/sql/query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema IN ('\''analytics'\'','\''ref'\'') ORDER BY 1;"}')

if echo "$RESPONSE" | jq -e '.results[0].rows' >/dev/null 2>&1; then
    echo "    ✅ Code can access analytics + ref schemas"
    echo "$RESPONSE" | jq '.results[0].rows'
else
    echo "    ❌ Code access test failed"
fi

# Store SSE URLs in Keychain
echo ""
echo "🔑 Storing MCP endpoints in Keychain..."
security add-generic-password -a "$USER" -s SCOUT__MCP__DESKTOP_SSE_URL -w "http://127.0.0.1:47334/sse" -U
security add-generic-password -a "$USER" -s SCOUT__MCP__CODE_SSE_URL -w "http://127.0.0.1:57334/sse" -U

echo ""
echo "🎯 Datasource registration complete!"
echo "📊 Registered datasources:"
echo "  Desktop: supabase_ds_desktop (analytics views only)"
echo "  Code:    supabase_ds_code (analytics + ref read)"
echo "  Code:    supabase_ds_codew (analytics_snap write-only)"