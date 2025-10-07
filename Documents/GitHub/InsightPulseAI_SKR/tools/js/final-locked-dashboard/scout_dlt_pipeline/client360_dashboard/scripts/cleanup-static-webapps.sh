#!/usr/bin/env bash
set -euo pipefail

RG="tbwa-client360-dashboard"                           # your resource group
KEEP="tbwa-client360-dashboard-production"              # the one App to keep

echo "👉 Fetching all Static Web Apps in RG '$RG'…"
apps=$(az staticwebapp list \
  --resource-group "$RG" \
  --query "[].name" -o tsv)

for app in $apps; do
  if [[ "$app" != "$KEEP" ]]; then
    echo "🗑️  Deleting orphaned app: $app"
    az staticwebapp delete \
      --name "$app" \
      --resource-group "$RG" \
      --yes
  fi
done

echo "✅ Only $KEEP remains."