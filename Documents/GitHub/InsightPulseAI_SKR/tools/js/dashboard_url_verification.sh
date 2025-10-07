#!/bin/bash
# Dashboard URL Structure Verification Script
# Validates all URL patterns for Scout Dashboard deployment

set -e

# Configuration 
DASHBOARD_URL=${1:-"https://wonderful-desert-03a292c00.6.azurestaticapps.net"}
URLS_TO_CHECK=(
  "/"
  "/advisor"
  "/advisor.html"
  "/advisor/index.html"
  "/edge"
  "/edge.html" 
  "/edge/index.html"
  "/ops"
  "/ops.html"
  "/ops/index.html"
  "/insights_dashboard.html"
  "/assets/index.js"
  "/css/shared-theme.css"
)

echo "🔍 Scout Dashboard URL Structure Verification"
echo "============================================="
echo "Testing: $DASHBOARD_URL"
echo

# Keep track of results
PASS_COUNT=0
FAIL_COUNT=0
REDIRECT_COUNT=0

# Check each URL
for url in "${URLS_TO_CHECK[@]}"; do
  full_url="${DASHBOARD_URL}${url}"
  echo -n "Testing $url ... "
  
  # Use curl to check status
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")
  
  # Check if status code indicates success (200, 302, 301, etc)
  if [[ $status_code == 2* ]]; then
    echo "✅ OK ($status_code)"
    PASS_COUNT=$((PASS_COUNT + 1))
  elif [[ $status_code == 3* ]]; then
    # For redirects, show where they redirect to
    redirect_url=$(curl -s -I "$full_url" | grep -i "location:" | awk '{print $2}' | tr -d '\r')
    echo "➡️ REDIRECT ($status_code) → $redirect_url"
    REDIRECT_COUNT=$((REDIRECT_COUNT + 1))
  else
    echo "❌ FAILED ($status_code)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo
echo "============================================="
echo "SUMMARY:"
echo "✅ Passed: $PASS_COUNT URLs"
echo "➡️ Redirects: $REDIRECT_COUNT URLs"
echo "❌ Failed: $FAIL_COUNT URLs"

# Exit with failure if any URLs failed
if [[ $FAIL_COUNT -gt 0 ]]; then
  echo "❌ Verification FAILED: Some URLs are not accessible"
  exit 1
else
  echo "✅ Verification PASSED: All URLs are accessible or properly redirected"
  exit 0
fi