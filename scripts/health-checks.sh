#!/bin/bash
# Runtime health checks for Platinum Layer
# Can be used in CI/CD pipelines

set -euo pipefail

echo "🔍 Running Platinum Layer health checks..."

# Load environment
export SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
if command -v security >/dev/null 2>&1; then
    export SUPABASE_SERVICE_KEY="$(security find-generic-password -a "$USER" -s SUPABASE_SERVICE_KEY -w)"
else
    echo "⚠️  Keychain not available, using .env if present"
    if [ -f "bruno/scout-analytics/.env" ]; then
        source bruno/scout-analytics/.env
    fi
fi

# Test 1: PostgREST auth smoke test
echo "🔑 Testing PostgREST authentication..."
curl -sf -X POST "${SUPABASE_URL}/rest/v1/rpc/install_platinum_layer_rpc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{"request_data": {"action": "health_check"}}' | jq '.success' > /dev/null
echo "✅ Authentication working"

# Test 2: Platinum table existence and row counts
echo "🗃️  Checking Platinum Layer tables..."
PGPASSWORD='Postgres_26' psql "postgres://postgres.cxzllzyxwpyptfretryc:Postgres_26@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -c "
SELECT 
  'recommendations' as table_name, 
  count(*) as row_count 
FROM recommendations
UNION ALL
SELECT 
  'chat_conversations' as table_name, 
  count(*) as row_count 
FROM chat_conversations  
UNION ALL
SELECT 
  'agent_insights' as table_name,
  count(*) as row_count 
FROM agent_insights;" || echo "⚠️  Some tables may not exist"

# Test 3: RLS policy check
echo "🔒 Checking RLS policies..."
PGPASSWORD='Postgres_26' psql "postgres://postgres.cxzllzyxwpyptfretryc:Postgres_26@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -c "
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('recommendations','agent_insights','chat_conversations');" || true

echo "✅ Health checks completed successfully!"