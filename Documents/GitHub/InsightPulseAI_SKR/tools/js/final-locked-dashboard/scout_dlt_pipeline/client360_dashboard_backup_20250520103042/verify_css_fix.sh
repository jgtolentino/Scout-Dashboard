#!/bin/bash

# Verify CSS Fix for Client360 Dashboard
# This script checks if the CSS and theme styles are loading correctly after deployment

set -e  # Exit immediately if a command exits with a non-zero status

# Setup logging
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/verify_${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "==== TBWA Client360 Dashboard - CSS Fix Verification ===="

# Get dashboard URL from arguments or prompt
DASHBOARD_URL="$1"
if [[ -z "$DASHBOARD_URL" ]]; then
    echo "Please enter the URL of your deployed dashboard:"
    read -r DASHBOARD_URL
    
    if [[ -z "$DASHBOARD_URL" ]]; then
        echo "ERROR: No URL provided. Exiting."
        exit 1
    fi
fi

echo "Verifying CSS fix for: ${DASHBOARD_URL}"
echo "Checking content types for CSS files..."

# Use curl to check content types for CSS files
echo "Checking tbwa-theme.css..."
CSS_CONTENT_TYPE=$(curl -sI "${DASHBOARD_URL}/css/tbwa-theme.css" | grep -i "content-type" | cut -d' ' -f2-)

echo "Checking variables.css..."
VARIABLES_CONTENT_TYPE=$(curl -sI "${DASHBOARD_URL}/css/variables.css" | grep -i "content-type" | cut -d' ' -f2-)

echo "Checking dashboard.css..."
DASHBOARD_CONTENT_TYPE=$(curl -sI "${DASHBOARD_URL}/css/dashboard.css" | grep -i "content-type" | cut -d' ' -f2-)

echo ""
echo "==== Verification Results ===="
echo "tbwa-theme.css Content-Type: ${CSS_CONTENT_TYPE}"
echo "variables.css Content-Type: ${VARIABLES_CONTENT_TYPE}"
echo "dashboard.css Content-Type: ${DASHBOARD_CONTENT_TYPE}"

# Check if content types are correct
VERIFICATION_PASSED=true

if [[ "${CSS_CONTENT_TYPE}" == *"text/css"* ]]; then
    echo "✅ tbwa-theme.css Content-Type is correct: ${CSS_CONTENT_TYPE}"
else
    echo "❌ tbwa-theme.css Content-Type is incorrect. Expected 'text/css' but got '${CSS_CONTENT_TYPE}'"
    VERIFICATION_PASSED=false
fi

if [[ "${VARIABLES_CONTENT_TYPE}" == *"text/css"* ]]; then
    echo "✅ variables.css Content-Type is correct: ${VARIABLES_CONTENT_TYPE}"
else
    echo "❌ variables.css Content-Type is incorrect. Expected 'text/css' but got '${VARIABLES_CONTENT_TYPE}'"
    VERIFICATION_PASSED=false
fi

if [[ "${DASHBOARD_CONTENT_TYPE}" == *"text/css"* ]]; then
    echo "✅ dashboard.css Content-Type is correct: ${DASHBOARD_CONTENT_TYPE}"
else
    echo "❌ dashboard.css Content-Type is incorrect. Expected 'text/css' but got '${DASHBOARD_CONTENT_TYPE}'"
    VERIFICATION_PASSED=false
fi

echo ""
echo "==== Additional Verification Steps ===="
echo "Please perform these manual checks to fully verify the fix:"
echo "1. Open the dashboard URL in your browser: ${DASHBOARD_URL}"
echo "2. Open browser developer tools (F12 or right-click > Inspect)"
echo "3. Go to the Network tab and reload the page"
echo "4. Filter for 'css' and check that all CSS files have 'text/css' content type"
echo "5. Visually confirm that the TBWA branding is applied:"
echo "   - Header has TBWA yellow (#ffc300) and blue (#005bbb) colors"
echo "   - KPI tiles have the yellow border at the top"
echo "   - Charts use the TBWA color palette"
echo ""

if [ "$VERIFICATION_PASSED" = true ]; then
    echo "✅ CSS content type verification PASSED!"
    exit 0
else
    echo "❌ CSS content type verification FAILED!"
    echo "The fix may not have been applied correctly."
    exit 1
fi