#!/bin/bash

# Verify Client360 Dashboard v2.3.2 deployment with AI Insights Panel
# This script checks if the deployment was successful and verifies the AI Insights panel

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
VERSION="2.3.2"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERIFICATION_LOG="logs/deployment_verification_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p screenshots
mkdir -p reports

echo "🔍 Starting verification of Client360 Dashboard v${VERSION}..." | tee -a "$VERIFICATION_LOG"

# Get the URL of the deployed app
DEPLOYMENT_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)

echo "🌐 Dashboard URL: https://$DEPLOYMENT_URL" | tee -a "$VERIFICATION_LOG"

# Create verification report file
REPORT_FILE="reports/deployment_verification_v${VERSION}_${TIMESTAMP}.md"
echo "# Deployment Verification Report - v${VERSION}" > $REPORT_FILE
echo "## Basic Information" >> $REPORT_FILE
echo "- **URL:** https://$DEPLOYMENT_URL" >> $REPORT_FILE
echo "- **Timestamp:** $(date)" >> $REPORT_FILE
echo "- **Verification Log:** $VERIFICATION_LOG" >> $REPORT_FILE

echo "📋 Manual verification steps:" | tee -a "$VERIFICATION_LOG"
echo "1. Visit https://$DEPLOYMENT_URL in your browser" | tee -a "$VERIFICATION_LOG"
echo "2. Check that the dashboard loads correctly" | tee -a "$VERIFICATION_LOG"
echo "3. Verify the version number in the footer shows ${VERSION}" | tee -a "$VERIFICATION_LOG"
echo "4. Confirm that the AI Insights Panel is displayed between the map and footer" | tee -a "$VERIFICATION_LOG"
echo "5. Check that all three insight types are present:" | tee -a "$VERIFICATION_LOG"
echo "   - Sales Performance Insights" | tee -a "$VERIFICATION_LOG"
echo "   - Brand Analysis" | tee -a "$VERIFICATION_LOG"
echo "   - Strategic Recommendations" | tee -a "$VERIFICATION_LOG"
echo "6. Try clicking on an insight card to expand it" | tee -a "$VERIFICATION_LOG"
echo "7. Test the insight type filter dropdown" | tee -a "$VERIFICATION_LOG"
echo "8. Toggle the data source between Live and Simulated" | tee -a "$VERIFICATION_LOG"
echo "9. Test the responsive design by resizing the browser window" | tee -a "$VERIFICATION_LOG"

echo "" | tee -a "$VERIFICATION_LOG"
echo "📸 Take a screenshot of the dashboard showing the AI Insights Panel" | tee -a "$VERIFICATION_LOG"
echo "Save the screenshot to: screenshots/dashboard_v${VERSION}_${TIMESTAMP}.png" | tee -a "$VERIFICATION_LOG"

echo "" | tee -a "$VERIFICATION_LOG"
echo "✅ Update the deployment verification report at: $REPORT_FILE" | tee -a "$VERIFICATION_LOG"

echo "" | tee -a "$VERIFICATION_LOG"
echo "🏁 Verification checklist completed. Please manually verify all aspects of the deployment." | tee -a "$VERIFICATION_LOG"
echo "If any issues are found, check the deployment logs in the logs directory." | tee -a "$VERIFICATION_LOG"

# Optional: Open the deployment URL in the default browser
echo "Opening dashboard in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://$DEPLOYMENT_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://$DEPLOYMENT_URL"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    start "https://$DEPLOYMENT_URL"
fi