#!/usr/bin/env bash
set -euo pipefail

RG="tbwa-client360-dashboard"
APP="tbwa-client360-dashboard-production"
TOKEN="${AZURE_STATIC_WEBAPP_API_TOKEN:-$(cat .azure_deploy_key)}"
BUILD_DIR="./deploy"     # or wherever your build output is

echo "🚀 Deploying $APP to Azure Static Web Apps…"
swa deploy "$BUILD_DIR" \
  --app-name "$APP" \
  --resource-group "$RG" \
  --deployment-token "$TOKEN" \
  --env production

echo "✅ $APP is live at https://$(az staticwebapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query defaultHostname -o tsv)"