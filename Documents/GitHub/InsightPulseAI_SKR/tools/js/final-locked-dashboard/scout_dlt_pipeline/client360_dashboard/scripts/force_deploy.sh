#!/bin/bash
# Force deployment without verification

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="scout-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy"
API_KEY="${AZURE_DEPLOYMENT_TOKEN:-"$(cat .azure_deploy_key 2>/dev/null || echo "")"}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/force_deploy_azure_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs

echo "🚀 Forcing deployment to Azure Static Web App..."
echo "WARNING: Bypassing verification checks. Use only when needed."

# Verify API key
if [ -z "$API_KEY" ]; then
    echo "⚠️ Azure deployment key not found."
    echo "Please set AZURE_DEPLOYMENT_TOKEN or create a file named .azure_deploy_key with your token."
    exit 1
fi

echo "📦 Preparing deployment package..."
# Create a temporary zip file for deployment
DEPLOY_ZIP="output/client360_azure_deploy_${TIMESTAMP}.zip"
mkdir -p output
zip -r "$DEPLOY_ZIP" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" | tee -a "$DEPLOYMENT_LOG"

echo "Running Azure deployment..." | tee -a "$DEPLOYMENT_LOG"
az staticwebapp deploy \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --source "$DEPLOY_ZIP" \
    --api-key "$API_KEY" | tee -a "$DEPLOYMENT_LOG"

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "✅ Deployment completed successfully!" | tee -a "$DEPLOYMENT_LOG"
    
    # Get the URL of the deployed app
    DEPLOYMENT_URL=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)
    
    echo "🌐 Dashboard is now available at: https://$DEPLOYMENT_URL" | tee -a "$DEPLOYMENT_LOG"
else
    echo "❌ Deployment failed. Check the logs for details: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
    exit 1
fi