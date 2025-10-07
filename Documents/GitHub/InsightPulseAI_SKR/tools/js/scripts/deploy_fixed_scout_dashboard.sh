#!/bin/bash
# Deploy Scout Dashboard with proper URL structure
# Uses fix_scout_dashboard_404.sh to prepare the deployment and then deploys to Azure

set -e

echo "🚀 Scout Dashboard Deployment Tool 🚀"
echo "===================================="

# Configuration - update these values as needed
STATIC_WEBAPP_NAME="scout-dashboard"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"

# Source directory (where your dashboard files are)
SOURCE_DIR="deploy-advisor-fixed"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Error: Source directory '$SOURCE_DIR' not found!"
  echo "Please specify a valid source directory."
  exit 1
fi

# Run the fix script to prepare the deployment
echo "1️⃣ Preparing deployment package with correct URL structure..."
./fix_scout_dashboard_404.sh

# Target directory (created by the fix script)
TARGET_DIR="scout-dashboard-fixed"

# Use known deployment token from previous deployments
echo "2️⃣ Using deployment token for scout-dashboard..."
DEPLOY_TOKEN="5d4094b03359795014c37eae8dfa7bbe46ffc4bd9a5684cdc8526b8a9b6baa9d06-522d0a67-bdf4-4de9-9a9e-95105ab6f05300f181203349aa0f"

# Verify deployment token is available
if [ -z "$DEPLOY_TOKEN" ]; then
  echo "⚠️ No deployment token available."
  echo "Please enter your Azure Static Web App deployment token:"
  read -s DEPLOY_TOKEN
  
  if [ -z "$DEPLOY_TOKEN" ]; then
    echo "❌ No token provided. Deployment aborted."
    exit 1
  fi
fi

# Deploy with SWA CLI
echo "3️⃣ Deploying to Azure Static Web App..."
swa deploy "$TARGET_DIR" --env production --deployment-token "$DEPLOY_TOKEN"

# Get the site URL
HOSTNAME=$(az staticwebapp show --name "$STATIC_WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv 2>/dev/null)

echo "✅ Deployment complete!"

if [ -n "$HOSTNAME" ]; then
  echo "🌐 Dashboard available at: https://$HOSTNAME"
  echo "🔗 Advisor Dashboard: https://$HOSTNAME/advisor"
  echo "🔗 Edge Dashboard: https://$HOSTNAME/edge"
  echo "🔗 Ops Dashboard: https://$HOSTNAME/ops"
  
  # Update the DEPLOYMENT_VERIFICATION.md file with the new URLs
  VERIFICATION_FILE="$SOURCE_DIR/DEPLOYMENT_VERIFICATION.md"
  if [ -f "$VERIFICATION_FILE" ]; then
    echo "📝 Updating deployment verification document..."
    sed -i "" "s|https://.*azurestaticapps.net|https://$HOSTNAME|g" "$VERIFICATION_FILE"
    echo "   Updated $VERIFICATION_FILE with the new URL."
  fi
else
  echo "🌐 Deployment successful, but couldn't retrieve the hostname."
  echo "Please check your Azure Portal for the dashboard URL."
fi

echo ""
echo "Don't forget to verify the deployment using the checklist in DEPLOYMENT_VERIFICATION.md!"