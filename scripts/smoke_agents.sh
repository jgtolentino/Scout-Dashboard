#!/usr/bin/env bash
set -euo pipefail
: "${SUPABASE_URL:?}"; : "${SUPABASE_ANON_KEY:?}"
probe(){ local fn=$1; local file=$2;
  echo "→ $fn"
  curl -s -X POST "$SUPABASE_URL/functions/v1/$fn" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
    --data @"scripts/smoke/$file" | jq -r . | head -c 1200; echo; echo;
}
probe agents-query agent_query.json
probe agents-retriever agent_retriever.json
probe agents-chart agent_chart.json
probe agents-narrative agent_narrative.json
probe agents-orchestrator agent_orchestrator.json
