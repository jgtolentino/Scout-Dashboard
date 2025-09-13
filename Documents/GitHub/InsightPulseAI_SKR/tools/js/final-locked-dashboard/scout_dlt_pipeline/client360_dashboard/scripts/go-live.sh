#!/usr/bin/env bash
set -euo pipefail

### 1. Merge feature-dashboard → main
git fetch origin
git checkout main
git reset --hard origin/main
git merge --no-ff origin/feature-dashboard -m "chore: merge feature-dashboard → main for production deploy"
git push origin main

### 2. (Optional) trigger GH Actions workflow dispatch
# requires GH CLI and a repo with workflow_dispatch enabled on unified-pipeline.yml
if command -v gh &> /dev/null; then
  gh workflow run unified-pipeline.yml --ref main
fi

### 3. Wait for Actions to finish (poll every 15s, up to 15m)
if command -v gh &> /dev/null; then
  echo "⏳ Waiting for CI to succeed…"
  gh run watch --exit-status --timeout 900s
fi

### 4. Fallback: manual Azure CLI deploy if the GH action didn't run or failed
# adjust name / resource group to yours
APP_NAME="tbwa-client360-dashboard-production"
RG="scout-dashboard"
DEPLOY_SCRIPT="./scripts/deploy_to_azure.sh"

if [[ -x "$DEPLOY_SCRIPT" ]]; then
  echo "⚙️  Running local deploy script…"
  bash "$DEPLOY_SCRIPT" production
else
  echo "⚠️  Deploy script not found or not executable: $DEPLOY_SCRIPT"
fi

### 5. Poll Azure for your new hostname
echo "⏳ Polling Azure Static Web App…"
for i in {1..40}; do
  HOST=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RG" \
    --query defaultHostname -o tsv 2>/dev/null || true)
  if [[ -n "$HOST" ]]; then
    echo "✅ Deployed at: https://$HOST"
    exit 0
  fi
  sleep 15
done

echo "❌ Timed out waiting for Azure SWA. Check GH Actions logs or Azure portal." >&2
exit 1