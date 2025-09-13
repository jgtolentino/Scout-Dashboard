#!/bin/bash

# Deploy Client360 Dashboard v2.3.2 to Azure Static Web Apps
# This script deploys the v2.3.2 version of the dashboard (with AI Insights Panel)

set -e  # Exit on any error

echo "🚀 Deploying Client360 Dashboard v2.3.2 to Azure..."

# Configuration
RESOURCE_GROUP="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy_v2.3.2"
API_KEY_FILE=".azure_deploy_key"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/deploy_v232_azure_${TIMESTAMP}.log"
VERSION="2.3.2"

# Create logs directory if it doesn't exist
mkdir -p logs

# Verify the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Error: Source directory $SOURCE_DIR not found!"
  echo "Please ensure the v2.3.2 dashboard build is available."
  exit 1
fi

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
DEPLOY_ZIP="output/client360_v232_deploy_${TIMESTAMP}.zip"
mkdir -p output
zip -r "$DEPLOY_ZIP" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" -x "*/cypress/*" | tee -a "$DEPLOYMENT_LOG"

echo "🔍 Verifying AI Insights panel files in deployment package..."
# Check for main component files
AI_INSIGHTS_FILES=$(unzip -l "$DEPLOY_ZIP" | grep -E "ai_insights\.js|ai-insights\.css|ai_insights_component\.js")
echo "$AI_INSIGHTS_FILES" | tee -a "$DEPLOYMENT_LOG"

if [ -z "$AI_INSIGHTS_FILES" ]; then
  echo "⚠️ Warning: AI Insights panel files not found in deployment package!" | tee -a "$DEPLOYMENT_LOG"
  echo "❌ Critical Error: No AI insights components found. Aborting deployment." | tee -a "$DEPLOYMENT_LOG"
  exit 1
fi

# Check for sample data
AI_INSIGHTS_DATA=$(unzip -l "$DEPLOY_ZIP" | grep -E "all_insights_latest\.json")
if [ -z "$AI_INSIGHTS_DATA" ]; then
  echo "⚠️ Warning: AI Insights data file not found in deployment package!" | tee -a "$DEPLOYMENT_LOG"
else
  echo "✅ AI Insights data file verified" | tee -a "$DEPLOYMENT_LOG"
fi

# Verify version number is correct in index.html
VERSION_CHECK=$(unzip -p "$DEPLOY_ZIP" "$SOURCE_DIR/index.html" | grep -E "Version\s+$VERSION|v$VERSION")
if [ -z "$VERSION_CHECK" ]; then
  echo "⚠️ Warning: Version number $VERSION not found in index.html!" | tee -a "$DEPLOYMENT_LOG"
  echo "This may indicate that the version was not properly updated." | tee -a "$DEPLOYMENT_LOG"
else
  echo "✅ Version number $VERSION verified in index.html" | tee -a "$DEPLOYMENT_LOG"
  echo "$VERSION_CHECK" | tee -a "$DEPLOYMENT_LOG"
fi

# Verify AI section in index.html
AI_SECTION_CHECK=$(unzip -p "$DEPLOY_ZIP" "$SOURCE_DIR/index.html" | grep -A10 "AI-Powered Insights")
if [ -z "$AI_SECTION_CHECK" ]; then
  echo "⚠️ Warning: AI Insights section not found in index.html!" | tee -a "$DEPLOYMENT_LOG"
else
  echo "✅ AI Insights section verified in index.html" | tee -a "$DEPLOYMENT_LOG"
fi

# Deploy using Azure CLI
echo "🚀 Deploying v${VERSION} to Azure Static Web App: $APP_NAME..."
echo "Using resource group: $RESOURCE_GROUP"

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
    
    echo "🌐 Dashboard v${VERSION} is now available at: https://$DEPLOYMENT_URL" | tee -a "$DEPLOYMENT_LOG"
    
    # Create a deployment record
    DEPLOYMENT_RECORD="reports/azure_deployment_v${VERSION}_${TIMESTAMP}.md"
    mkdir -p reports
    cat > "$DEPLOYMENT_RECORD" << EOL
# Azure Deployment Record - v${VERSION}

## Deployment Summary
- **Version:** ${VERSION}
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **Package:** $DEPLOY_ZIP
- **Log:** $DEPLOYMENT_LOG
- **URL:** https://$DEPLOYMENT_URL

## Features Deployed
- ✅ Base dashboard functionality
- ✅ AI Insights Panel (F9 - Insight Panel from PRD)
- ✅ Store Map component (F8)
- ✅ Theme integration with TBWA branding
- ✅ Data source toggle integration

## QA Verification Checklist
- [ ] Dashboard loads correctly
- [ ] Footer displays correct version number: ${VERSION}
- [ ] AI Insights Panel displays properly 
- [ ] AI Insights Panel shows all three sections:
  - [ ] Sales Performance Insights
  - [ ] Brand Analysis
  - [ ] Strategic Recommendations
- [ ] AI Insights cards expand properly when clicked
- [ ] AI Insights type filter works correctly
- [ ] Data source toggle works with AI insights
- [ ] Responsive design adapts to different screen sizes
- [ ] Panel properly positioned between Map component and Footer

## Post-Deployment Instructions
1. Verify the dashboard is accessible at: https://$DEPLOYMENT_URL
2. Run through the QA verification checklist above
3. Take a screenshot of the working dashboard showing the AI Insights Panel
4. Save the screenshot to \`screenshots/dashboard_v${VERSION}_${TIMESTAMP}.png\`
5. If issues are found, check the deployment log: $DEPLOYMENT_LOG

## Verification Process
Run this command to verify the deployment:
\`\`\`bash
# Create verification report
REPORT_FILE="reports/deployment_verification_v${VERSION}_${TIMESTAMP}.md"
echo "# Deployment Verification Report - v${VERSION}" > $REPORT_FILE
echo "## Basic Information" >> $REPORT_FILE
echo "- **URL:** https://$DEPLOYMENT_URL" >> $REPORT_FILE
echo "- **Timestamp:** $(date)" >> $REPORT_FILE
echo "- **Version in Footer:** " >> $REPORT_FILE
echo "- **AI Insights Panel Present:** Yes/No" >> $REPORT_FILE
echo "- **Number of Insight Cards:** " >> $REPORT_FILE
\`\`\`
EOL

    echo "📝 Deployment record created: $DEPLOYMENT_RECORD" | tee -a "$DEPLOYMENT_LOG"
    echo "🧪 Please run QA tests to verify the deployment"
else
    echo "❌ Deployment failed. Check the logs for details: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
    exit 1
fi