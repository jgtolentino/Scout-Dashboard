#!/usr/bin/env bash
set -euo pipefail

# ■ CONFIGURE ■
KEEP_APP="tbwa-client360-dashboard-production"
KEEP_RG="tbwa-client360-dashboard"

# Fetch all SWAs
apps=$(az staticwebapp list \
  --query "[].{name:name,rg:resourceGroup}" -o tsv)

echo "Found these Static Web Apps:"
echo "$apps" | column -t

while read -r name rg; do
  if [[ "$name" == "$KEEP_APP" && "$rg" == "$KEEP_RG" ]]; then
    echo "✅ Keeping: $name  (RG: $rg)"
  else
    echo "🗑  Deleting: $name  (RG: $rg)"
    az staticwebapp delete \
      --name "$name" \
      --resource-group "$rg" \
      --yes \
      --no-wait
  fi
done <<< "$apps"

echo "✅ Requested deletions. Give Azure a minute to tear them down."
echo "🔍 Verify with: az staticwebapp list --query \"[].{name:name,hostname:defaultHostname}\" -o table"