#!/usr/bin/env bash
set -euo pipefail

# Configuration
RG="tbwa-client360-dashboard"
APP="tbwa-client360-dashboard-production"

echo "🔍 Finding production static web app..."
az staticwebapp list \
  --resource-group "$RG" \
  --query "[].{name:name, url:defaultHostname}" \
  -o table

echo -e "\n📍 Getting production URL for $APP..."
HOST=$(az staticwebapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query "defaultHostname" -o tsv)

echo "🔗 Production URL: https://$HOST"

echo -e "\n🏥 Checking HTTP status..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$HOST")
if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "✅ Site is accessible - HTTP Status: $HTTP_STATUS"
else
  echo "❌ Site returned non-200 status: $HTTP_STATUS"
  exit 1
fi

echo -e "\n🔬 Checking HTML content..."
HTML_CONTENT=$(curl -s "https://$HOST" | head -n10)
echo "$HTML_CONTENT"

echo -e "\n🧪 Checking for TBWA theme..."
THEME_CHECK=$(curl -s "https://$HOST" | grep -c 'data-theme="tbwa"' || true)
if [[ "$THEME_CHECK" -gt 0 ]]; then
  echo "✅ TBWA theme is correctly applied"
else
  echo "❌ TBWA theme not found in HTML"
  exit 1
fi

echo -e "\n📊 Checking for rollback component..."
ROLLBACK_CHECK=$(curl -s "https://$HOST" | grep -c 'rollback-dashboard' || true)
if [[ "$ROLLBACK_CHECK" -gt 0 ]]; then
  echo "✅ Rollback component is present"
else
  echo "❌ Rollback component not found"
  exit 1
fi

echo -e "\n🎉 Production site is fully verified and operational!"
echo "📱 Visit your dashboard at: https://$HOST"