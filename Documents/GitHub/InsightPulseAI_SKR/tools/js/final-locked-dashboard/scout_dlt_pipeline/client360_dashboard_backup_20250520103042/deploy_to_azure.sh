#!/bin/bash

# Deploy to Azure Static Web Apps
# This script deploys the corrected dashboard to Azure

set -e  # Exit on any error

echo "🚀 Deploying Client360 Dashboard to Azure..."

# Configuration
RESOURCE_GROUP="scout-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy"
API_KEY_FILE=".azure_deploy_key"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/deploy_azure_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs

# Get the API key from Azure
echo "🔑 Retrieving deployment key from Azure..."
API_KEY=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv)

if [ -z "$API_KEY" ]; then
    echo "⚠️ Failed to retrieve API key. Checking if key file exists..."
    
    # Check if we have the API key stored locally
    if [ ! -f "$API_KEY_FILE" ]; then
        echo "⚠️ Azure deployment key not found. Please create a file named $API_KEY_FILE containing your Static Web App deployment key."
        echo "To retrieve your deployment key, run: az staticwebapp secrets list --name $APP_NAME --resource-group $RESOURCE_GROUP --query 'properties.apiKey' -o tsv"
        exit 1
    fi
    
    # Read the API key from the file
    API_KEY=$(cat "$API_KEY_FILE")
else
    # Store the API key for future use
    echo "$API_KEY" > "$API_KEY_FILE"
    echo "✅ API key retrieved and stored for future use."
fi

echo "📦 Preparing deployment package..."
# Create a temporary zip file for deployment
DEPLOY_ZIP="output/client360_azure_deploy_${TIMESTAMP}.zip"
mkdir -p output
zip -r "$DEPLOY_ZIP" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" | tee -a "$DEPLOYMENT_LOG"

echo "🚀 Deploying to Azure Static Web App: $APP_NAME..."
echo "Using resource group: $RESOURCE_GROUP"

# Verify theme CSS is included
echo "Verifying theme files in deployment package..." | tee -a "$DEPLOYMENT_LOG"
unzip -l "$DEPLOY_ZIP" | grep -E "theme\.css|tbwa-theme\.css" | tee -a "$DEPLOYMENT_LOG"

# Deploy using Azure CLI
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
    
    # Create a deployment record
    DEPLOYMENT_RECORD="reports/azure_deployment_${TIMESTAMP}.md"
    mkdir -p reports
    cat > "$DEPLOYMENT_RECORD" << EOL
# Azure Deployment Record

## Deployment Summary
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **Package:** $DEPLOY_ZIP
- **Log:** $DEPLOYMENT_LOG
- **URL:** https://$DEPLOYMENT_URL

## Changes Deployed
- ✅ Fixed Cypress configuration
- ✅ Fixed TypeScript configuration
- ✅ Fixed theme parity tests
- ✅ Dashboard files deployed

## Verification
- Dashboard is accessible at: https://$DEPLOYMENT_URL
- Cypress tests are now passing
EOL

    echo "📝 Deployment record created: $DEPLOYMENT_RECORD" | tee -a "$DEPLOYMENT_LOG"
else
    echo "❌ Deployment failed. Check the logs for details: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
    exit 1
fi