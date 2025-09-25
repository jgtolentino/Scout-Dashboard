#!/usr/bin/env bash
set -euo pipefail
DB="${DB:?Set DB}"
MIN_PROD="${MIN_PROD:-90}"   # percent
MIN_LINE="${MIN_LINE:-85}"   # percent

row=$(./scripts/sql.sh -d "$DB" -Q "SELECT product_coverage_pct, line_coverage_pct FROM gold.v_nielsen_coverage_summary;")
# Extract the first two numeric values from result (very simple parse)
pct_prod=$(echo "$row" | grep -Eo '[0-9]+\.[0-9]+' | sed -n '1p')
pct_line=$(echo "$row" | grep -Eo '[0-9]+\.[0-9]+' | sed -n '2p')

echo "Coverage: products=${pct_prod}% (min ${MIN_PROD}%), lines=${pct_line}% (min ${MIN_LINE}%)"
# Compare as integers (×100)
ip=$(printf '%.0f' "$(echo "$pct_prod*100" | bc -l)")
il=$(printf '%.0f' "$(echo "$pct_line*100" | bc -l)")
mp=$(($MIN_PROD*100)); ml=$(($MIN_LINE*100))

if [[ $ip -lt $mp || $il -lt $ml ]]; then
  echo "❌ Coverage threshold not met."
  exit 2
fi
echo "✅ Coverage thresholds satisfied."