#!/bin/bash
set -euo pipefail

# Direct production deployment script that doesn't require git operations
# This is an alternative to go-live.sh when there are unstashed changes

echo "🚀 Starting direct production deployment..."

# Configuration
APP_NAME="tbwa-client360-dashboard-production"
RESOURCE_GROUP="scout-dashboard"
SOURCE_DIR="./deploy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/direct_production_deploy_${TIMESTAMP}.log"

mkdir -p logs

echo "📋 Running pre-deployment verification..." | tee -a "$LOG_FILE"
if [ -f "./scripts/verify_deployment.sh" ]; then
  bash ./scripts/verify_deployment.sh | tee -a "$LOG_FILE"
fi

echo "🔍 Verifying TBWA theme and rollback component..." | tee -a "$LOG_FILE"
if [ -f "./scripts/verify_tbwa_theme.sh" ]; then
  bash ./scripts/verify_tbwa_theme.sh | tee -a "$LOG_FILE"
fi

echo "📦 Preparing deployment package..." | tee -a "$LOG_FILE"
DEPLOY_ZIP="output/client360_production_${TIMESTAMP}.zip"
mkdir -p output
zip -r "$DEPLOY_ZIP" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" | tee -a "$LOG_FILE"

# Get API key from Azure or from file
echo "🔑 Retrieving deployment key..." | tee -a "$LOG_FILE"
if [ -f ".azure_deploy_key" ]; then
  API_KEY=$(cat .azure_deploy_key)
  echo "✅ Using API key from .azure_deploy_key file" | tee -a "$LOG_FILE"
else 
  API_KEY=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv)
  if [ -z "$API_KEY" ]; then
    echo "❌ Failed to retrieve API key from Azure. Please ensure you have the right permissions." | tee -a "$LOG_FILE"
    exit 1
  fi
  echo "$API_KEY" > .azure_deploy_key
  echo "✅ Retrieved and saved API key for future use" | tee -a "$LOG_FILE"
fi

# Deploy to Azure
echo "🚀 Deploying to Azure..." | tee -a "$LOG_FILE"
az staticwebapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source "$DEPLOY_ZIP" \
  --api-key "$API_KEY" | tee -a "$LOG_FILE"

# Verify deployment
echo "🔍 Verifying deployment..." | tee -a "$LOG_FILE"
APP_URL=$(az staticwebapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)

echo "✅ Deployment completed!" | tee -a "$LOG_FILE"
echo "🌐 Application is now live at: https://$APP_URL" | tee -a "$LOG_FILE"

# Create deployment record
DEPLOYMENT_RECORD="reports/production_deployment_${TIMESTAMP}.md"
mkdir -p reports
cat > "$DEPLOYMENT_RECORD" << EOL
# Production Deployment Record

## Deployment Details
- **Timestamp:** $(date)
- **App Name:** $APP_NAME
- **Resource Group:** $RESOURCE_GROUP
- **Deployment Package:** $DEPLOY_ZIP
- **Log File:** $LOG_FILE

## Access URL
- Production URL: https://$APP_URL

## Next Steps
1. Verify that the application is working correctly at the URL above
2. Verify that the TBWA theme is applied correctly
3. Verify that the rollback component is functioning properly
4. Submit the verification report to stakeholders
EOL

echo "📝 Deployment record created: $DEPLOYMENT_RECORD" | tee -a "$LOG_FILE"
echo "🎯 Deployment process completed successfully!"