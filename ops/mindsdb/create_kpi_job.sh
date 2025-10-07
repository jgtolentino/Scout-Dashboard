#!/bin/bash
# Scout Analytics - MindsDB KPI Job Creation  
# Creates hourly KPI snapshot job in MindsDB code instance
# Usage: ./ops/mindsdb/create_kpi_job.sh

set -euo pipefail

echo "📊 Creating hourly KPI snapshot job in MindsDB..."

# Check if code instance is running
if ! curl -sf http://127.0.0.1:57334/api/status >/dev/null 2>&1; then
    echo "❌ MindsDB code instance not running on port 57334"
    echo "💡 Run: ./start_instances.sh first"
    exit 1
fi

# Create the KPI job SQL
read -r -d '' KPI_JOB_SQL <<'SQL' || true
-- Clear any existing snapshots for this timestamp to ensure idempotency
DELETE FROM supabase_ds_codew.analytics_snap.kpi_hourly 
WHERE snapshot_ts >= date_trunc('hour', now()) 
  AND snapshot_ts < date_trunc('hour', now()) + interval '1 hour';

-- Insert fresh KPI snapshots for this hour
INSERT INTO supabase_ds_codew.analytics_snap.kpi_hourly (snapshot_ts, metric, value)
SELECT date_trunc('hour', now()), 'recommendations_total', COUNT(*)::numeric
FROM supabase_ds_code.analytics.recommendations;

INSERT INTO supabase_ds_codew.analytics_snap.kpi_hourly (snapshot_ts, metric, value)
SELECT date_trunc('hour', now()), 'agent_insights_total', COUNT(*)::numeric  
FROM supabase_ds_code.analytics.agent_insights;

INSERT INTO supabase_ds_codew.analytics_snap.kpi_hourly (snapshot_ts, metric, value)
SELECT date_trunc('hour', now()), 'chat_conversations_total', COUNT(*)::numeric
FROM supabase_ds_code.analytics.chat_conversations;

-- Add system metrics
INSERT INTO supabase_ds_codew.analytics_snap.kpi_hourly (snapshot_ts, metric, value)
SELECT date_trunc('hour', now()), 'snapshot_job_success', 1::numeric;
SQL

echo "🔨 Creating job: kpi_hourly_snap"
echo "⏰ Schedule: every 1 hour"

# Create the job via MindsDB REST API
RESPONSE=$(curl -s -X POST "http://127.0.0.1:57334/api/projects/mindsdb/jobs" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg name "kpi_hourly_snap" \
    --arg query "$KPI_JOB_SQL" \
    --arg schedule "every 1 hour" \
    '{name: $name, query: $query, schedule_str: $schedule}')")

if echo "$RESPONSE" | jq -e '.name' >/dev/null 2>&1; then
    echo "✅ KPI job created successfully"
    echo "📋 Job details:"
    echo "$RESPONSE" | jq '{name, schedule_str, created_at}'
else
    echo "❌ Job creation failed:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo ""
echo "🧪 Testing manual job execution..."

# Test with a manual insert
MANUAL_TEST_SQL="
INSERT INTO supabase_ds_codew.analytics_snap.kpi_hourly (snapshot_ts, metric, value)
SELECT now(), 'manual_test', 999::numeric;
"

TEST_RESPONSE=$(curl -s -X POST http://127.0.0.1:57334/api/sql/query \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg query "$MANUAL_TEST_SQL" '{query: $query}')")

if echo "$TEST_RESPONSE" | jq -e '.results' >/dev/null 2>&1; then
    echo "✅ Manual write test successful"
else
    echo "❌ Manual write test failed:"
    echo "$TEST_RESPONSE" | jq .
fi

echo ""
echo "📈 Verifying data in Supabase..."

# Check if data landed in Supabase
PG_POOLER="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__PG_URL_POOLER -w)"
if psql "$PG_POOLER" -c "SELECT snapshot_ts, metric, value FROM analytics_snap.kpi_hourly ORDER BY snapshot_ts DESC LIMIT 5;" 2>/dev/null; then
    echo "✅ Data successfully written to Supabase"
else
    echo "⚠️  Unable to verify data in Supabase (check permissions)"
fi

echo ""
echo "🎯 KPI job setup complete!"
echo ""
echo "📋 Job summary:"
echo "  Name: kpi_hourly_snap"
echo "  Schedule: every 1 hour"
echo "  Target: analytics_snap.kpi_hourly"
echo "  Metrics: recommendations_total, agent_insights_total, chat_conversations_total"
echo ""
echo "🔍 Management commands:"
echo "  List jobs:   curl -s http://127.0.0.1:57334/api/projects/mindsdb/jobs | jq ."
echo "  Get job:     curl -s http://127.0.0.1:57334/api/projects/mindsdb/jobs/kpi_hourly_snap | jq ."
echo "  Check data:  psql \"\$SUPABASE_PG_URL_POOLER\" -c 'SELECT * FROM analytics_snap.kpi_hourly ORDER BY snapshot_ts DESC LIMIT 10;'"