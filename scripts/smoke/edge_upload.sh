#!/usr/bin/env bash
set -euo pipefail
EDGE_TOKEN="${EDGE_TOKEN:?}"
PROJECT_REF="${PROJECT_REF:?}" # e.g., cxzllzyxwpyptfretryc
DATE="$(date -u +%F)"
DEVICE="pi-05"

curl -s -X POST \
  -H "Authorization: Bearer $EDGE_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/tmp/transactions.jsonl \
  "https://${PROJECT_REF}.supabase.co/storage/v1/object/scout-ingest/${DATE}/${DEVICE}/transactions-raw.jsonl"
echo "Uploaded JSONL to scout-ingest/${DATE}/${DEVICE}/transactions-raw.jsonl"