#!/bin/bash
# Scout Analytics - Inventory Health Check
# Validates that POC infrastructure is working correctly
# Usage: ./ops/inventory.check.sh
# Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_PG_URL_REMOTE

set -euo pipefail

echo "🔍 Scout Analytics - Inventory Health Check"
echo "============================================"

# Verify required environment variables
if [[ -z "${SUPABASE_URL:-}" ]]; then
    echo "❌ SUPABASE_URL not set"
    echo "💡 Run: source ./ops/secrets_export.sh remote"
    exit 1
fi

if [[ -z "${SUPABASE_SERVICE_KEY:-}" ]]; then
    echo "❌ SUPABASE_SERVICE_KEY not set"
    echo "💡 Run: source ./ops/secrets_export.sh remote"
    exit 1
fi

if [[ -z "${SUPABASE_PG_URL_REMOTE:-}" ]]; then
    echo "❌ SUPABASE_PG_URL_REMOTE not set" 
    echo "💡 Run: source ./ops/secrets_export.sh remote"
    exit 1
fi

echo "📊 Testing health RPC endpoint..."
if curl -s -f -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_readonly_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{"q":"select 1 as ok"}' >/dev/null; then
    echo "✅ Health RPC working"
else
    echo "❌ Health RPC failed"
    exit 1
fi

echo "🚀 Testing Platinum installer (idempotency)..."
if curl -s -f -X POST "${SUPABASE_URL}/rest/v1/rpc/install_platinum_layer_rpc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{}' >/dev/null; then
    echo "✅ Platinum installer working"
else
    echo "❌ Platinum installer failed"
    exit 1
fi

echo "📦 Verifying Platinum Layer tables exist..."
if psql "$SUPABASE_PG_URL_REMOTE" -c "select 1 from recommendations limit 1;" >/dev/null 2>&1; then
    echo "✅ recommendations table exists"
else
    echo "❌ recommendations table missing"
    exit 1
fi

if psql "$SUPABASE_PG_URL_REMOTE" -c "select 1 from agent_insights limit 1;" >/dev/null 2>&1; then
    echo "✅ agent_insights table exists"
else
    echo "❌ agent_insights table missing"
    exit 1
fi

if psql "$SUPABASE_PG_URL_REMOTE" -c "select 1 from chat_conversations limit 1;" >/dev/null 2>&1; then
    echo "✅ chat_conversations table exists"
else
    echo "❌ chat_conversations table missing"
    exit 1
fi

echo ""
echo "🎉 All inventory checks passed!"
echo "📈 Status: POC infrastructure is healthy and operational"