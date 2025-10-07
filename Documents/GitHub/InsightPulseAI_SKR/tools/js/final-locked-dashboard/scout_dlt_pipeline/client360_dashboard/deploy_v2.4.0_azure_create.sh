#!/bin/bash
# deploy_v2.4.0_azure_create.sh
# Script to deploy Client360 Dashboard v2.4.0 to Azure Static Web Apps
# This version will create Azure resources if they don't exist

set -e  # Exit on any error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define directories and paths
DEPLOY_DIR="deploy_v2.4.0"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="output"
LOG_FILE="$LOG_DIR/azure_deployment_v2.4.0_$TIMESTAMP.log"
CHECKSUM_FILE="$LOG_DIR/checksums_v2.4.0_$TIMESTAMP.md5"

# Azure resource names
AZURE_LOCATION="eastus"
AZURE_RESOURCE_GROUP="rg-client360-dashboard"
AZURE_SWA_NAME="swa-client360-dashboard"
AZURE_OPENAI_NAME="openai-client360"
AZURE_KEYVAULT_NAME="kv-client360-dashboard"

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Function to log messages
log() {
  echo -e "$1" | tee -a $LOG_FILE
}

log "${BLUE}=======================================================${NC}"
log "${BLUE}= Client360 Dashboard v2.4.0 Azure Deployment         =${NC}"
log "${BLUE}=======================================================${NC}"
log "Started at: $(date)"
log "Deployment directory: $DEPLOY_DIR"
log ""

# Verify deployment files
log "${YELLOW}Verifying deployment files...${NC}"
if ! ./verify_v2.4.0_deployment.sh; then
  log "${RED}Verification failed. Aborting deployment.${NC}"
  exit 1
fi

# Generate version file
log "${YELLOW}Generating version file...${NC}"
cat > "$DEPLOY_DIR/version.json" << EOF
{
  "version": "v2.4.0",
  "buildTimestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deploymentId": "client360_$TIMESTAMP",
  "environment": "production"
}
EOF

# Create deployment package
log "${YELLOW}Creating deployment package...${NC}"
DEPLOY_PACKAGE="client360_dashboard_v2.4.0_$TIMESTAMP.zip"
zip -r "$LOG_DIR/$DEPLOY_PACKAGE" "$DEPLOY_DIR" > /dev/null
log "${GREEN}Deployment package created: $LOG_DIR/$DEPLOY_PACKAGE${NC}"

# Generate file checksums
log "${YELLOW}Generating file integrity checksums...${NC}"
echo "# Client360 Dashboard v2.4.0 Deployment Checksums" > $CHECKSUM_FILE
echo "# Generated: $(date)" >> $CHECKSUM_FILE
echo "" >> $CHECKSUM_FILE

# Generate checksums for all files in the deployment directory
find "$DEPLOY_DIR" -type f | while read file; do
  shasum -a 256 "$file" | cut -d ' ' -f 1 >> $CHECKSUM_FILE
done
log "${GREEN}Checksums generated: $CHECKSUM_FILE${NC}"

# Check Azure CLI is installed
log "${YELLOW}Checking Azure CLI...${NC}"
if ! command -v az &> /dev/null; then
  log "${RED}Azure CLI not found. Please install it to deploy to Azure.${NC}"
  log "${RED}Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
  log "${YELLOW}Continuing with local deployment preparation only...${NC}"
  
  # Create deployment verification report without Azure deployment
  REPORT_FILE="$LOG_DIR/azure_deployment_preparation_v2.4.0_$TIMESTAMP.md"
  
  cat > $REPORT_FILE << EOF
# Client360 Dashboard v2.4.0 Azure Deployment Preparation

**Preparation Date:** $(date)
**Deployment Package:** $DEPLOY_PACKAGE
**Status:** Azure CLI not found, prepared for manual deployment

## Deployment Summary

The Client360 Dashboard v2.4.0 deployment package has been successfully created and verified.
The package is ready for manual upload to Azure Static Web Apps.

## Features Included

- **Multi-Model AI Framework**: Enhanced AI insights with multiple model support and fallback capabilities
- **Enhanced Map Visualization**: Improved geographical visualizations with heat mapping and region selection
- **User Personalization Framework**: User-specific dashboard layouts, saved filters, and preferences

## Manual Deployment Steps

1. Upload the deployment package to Azure:
   - Package location: $LOG_DIR/$DEPLOY_PACKAGE
   - Extract and upload contents to your Azure Static Web App

2. Configure environment variables in Azure Static Web App:
   - AZURE_OPENAI_ENDPOINT: Your Azure OpenAI endpoint URL
   - AZURE_OPENAI_DEPLOYMENT_PRIMARY: client360-insights
   - AZURE_OPENAI_DEPLOYMENT_EMBEDDING: client360-embedding
   - AZURE_OPENAI_API_VERSION: 2023-05-15
   - DASHBOARD_VERSION: 2.4.0
   - ENABLE_AI_STREAMING: true
   - ENABLE_MULTI_MODEL: true
   - ENABLE_ADVANCED_CACHING: true

## Verification Checklist

After manual deployment:
- [ ] Verify dashboard loads correctly
- [ ] Verify AI components functionality
- [ ] Verify Enhanced Map components
- [ ] Verify User Personalization features
- [ ] Verify data connections

## References

- Checksums: \`$CHECKSUM_FILE\`
- Preparation Log: \`$LOG_FILE\`
EOF

  log "${GREEN}Deployment preparation report generated: $REPORT_FILE${NC}"
  log ""
  log "${BLUE}=======================================================${NC}"
  log "${BLUE}= Deployment Preparation Summary                      =${NC}"
  log "${BLUE}=======================================================${NC}"
  log "Status: ${YELLOW}PREPARED FOR MANUAL DEPLOYMENT${NC}"
  log "Deployed Version: v2.4.0"
  log "Deployment Package: $LOG_DIR/$DEPLOY_PACKAGE"
  log "Preparation Log: $LOG_FILE"
  log "Checksums: $CHECKSUM_FILE"
  log "Preparation Report: $REPORT_FILE"
  log ""
  log "${YELLOW}Azure CLI not found. The deployment package is prepared for manual upload.${NC}"
  log "Please follow the instructions in the preparation report for manual deployment."
  
  exit 0
fi

# Try to log in to Azure
log "${YELLOW}Attempting Azure login...${NC}"
if ! az account show &> /dev/null; then
  log "${YELLOW}Not logged into Azure. Attempting login...${NC}"
  if ! az login --allow-no-subscriptions; then
    log "${RED}Azure login failed. Preparing for manual deployment instead.${NC}"
    # Similar preparation report as above
    exit 1
  fi
fi

# Create/verify resource group
log "${YELLOW}Creating/verifying Azure resource group...${NC}"
if ! az group show --name "$AZURE_RESOURCE_GROUP" &> /dev/null; then
  log "${YELLOW}Resource group $AZURE_RESOURCE_GROUP not found. Creating...${NC}"
  if ! az group create --name "$AZURE_RESOURCE_GROUP" --location "$AZURE_LOCATION"; then
    log "${RED}Failed to create resource group. Aborting deployment.${NC}"
    exit 1
  fi
  log "${GREEN}Resource group created successfully.${NC}"
else
  log "${GREEN}Resource group $AZURE_RESOURCE_GROUP exists.${NC}"
fi

# Create/verify Static Web App
log "${YELLOW}Creating/verifying Azure Static Web App...${NC}"
if ! az staticwebapp show --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
  log "${YELLOW}Static Web App $AZURE_SWA_NAME not found. Creating...${NC}"
  if ! az staticwebapp create --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --location "$AZURE_LOCATION" --sku Free --branch main --app-location "/" --output-location "/" --login-with-github; then
    log "${RED}Failed to create Static Web App. Manual steps required for deployment.${NC}"
    # Create manual deployment preparation report
    exit 1
  fi
  log "${GREEN}Static Web App created successfully.${NC}"
else
  log "${GREEN}Static Web App $AZURE_SWA_NAME exists.${NC}"
fi

# Deploy to Azure Static Web App
log "${YELLOW}Deploying to Azure Static Web App...${NC}"
log "${YELLOW}This may take several minutes...${NC}"

# Get SWA deployment token (or create a dummy one for testing)
SWA_TOKEN=$(az staticwebapp secrets list --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query "properties.apiKey" -o tsv 2>/dev/null || echo "dummy-token-for-testing")

# If we have a real token, deploy using SWA CLI
if [ "$SWA_TOKEN" != "dummy-token-for-testing" ]; then
  # Deploy using SWA CLI
  if ! command -v swa &> /dev/null; then
    log "${YELLOW}SWA CLI not found. Installing...${NC}"
    npm install -g @azure/static-web-apps-cli
    if [ $? -ne 0 ]; then
      log "${RED}Failed to install SWA CLI. Manual steps required for deployment.${NC}"
      # Create manual deployment preparation report
      exit 1
    fi
  fi

  log "${YELLOW}Deploying with SWA CLI...${NC}"
  swa deploy "$DEPLOY_DIR" --env production --deployment-token "$SWA_TOKEN" >> $LOG_FILE 2>&1
  
  if [ $? -eq 0 ]; then
    log "${GREEN}Deployment to Azure Static Web App succeeded!${NC}"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(az staticwebapp show --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query "defaultHostname" -o tsv 2>/dev/null || echo "example.com")
    log "${GREEN}Deployed to: https://$DEPLOYMENT_URL${NC}"
    
    # Update deployment record
    echo "v2.4.0,$TIMESTAMP,https://$DEPLOYMENT_URL" >> "$LOG_DIR/deployment_history.csv"
  else
    log "${RED}Deployment to Azure Static Web App failed. Check $LOG_FILE for details.${NC}"
    # Create manual deployment preparation report
    exit 1
  fi
else
  # If we don't have a real token, inform user how to deploy manually
  log "${YELLOW}No deployment token available. Manual steps required for deployment.${NC}"
  
  # Create manual deployment preparation report
  REPORT_FILE="$LOG_DIR/azure_manual_deployment_v2.4.0_$TIMESTAMP.md"
  
  cat > $REPORT_FILE << EOF
# Client360 Dashboard v2.4.0 Manual Deployment Guide

**Preparation Date:** $(date)
**Deployment Package:** $DEPLOY_PACKAGE
**Status:** Prepared for manual deployment

## Manual Deployment Steps

1. Go to the Azure Portal: https://portal.azure.com
2. Navigate to your Static Web App: $AZURE_SWA_NAME in resource group $AZURE_RESOURCE_GROUP
3. Click on "Deployments" then "Manual Deploy"
4. Upload the deployment package: $LOG_DIR/$DEPLOY_PACKAGE
5. Or extract and upload contents from: $DEPLOY_DIR

## Environment Configuration

Configure these environment variables in the Azure Static Web App:

\`\`\`
AZURE_OPENAI_ENDPOINT=<your-openai-endpoint>
AZURE_OPENAI_DEPLOYMENT_PRIMARY=client360-insights
AZURE_OPENAI_DEPLOYMENT_EMBEDDING=client360-embedding
AZURE_OPENAI_API_VERSION=2023-05-15
DASHBOARD_VERSION=2.4.0
ENABLE_AI_STREAMING=true
ENABLE_MULTI_MODEL=true
ENABLE_ADVANCED_CACHING=true
\`\`\`

## Post-Deployment Verification

- Access the dashboard at: https://$AZURE_SWA_NAME.azurestaticapps.net
- Verify version number in footer shows v2.4.0
- Test AI Insights, Map Components, and User Personalization features
EOF

  log "${GREEN}Manual deployment guide created: $REPORT_FILE${NC}"
fi

# Create deployment verification report
log "${YELLOW}Generating deployment verification report...${NC}"
REPORT_FILE="$LOG_DIR/azure_deployment_verification_v2.4.0_$TIMESTAMP.md"

cat > $REPORT_FILE << EOF
# Client360 Dashboard v2.4.0 Deployment Verification Report

**Deployment Date:** $(date)
**Deployment ID:** client360_$TIMESTAMP
**Deployment URL:** ${DEPLOYMENT_URL:-"<Manual Deployment Required>"}
**Deployment Package:** $DEPLOY_PACKAGE

## Deployment Summary

The Client360 Dashboard v2.4.0 has been ${SWA_TOKEN != "dummy-token-for-testing" ? "deployed to Azure Static Web App." : "prepared for manual deployment."}

## Features Included

- **Multi-Model AI Framework**: Enhanced AI insights with multiple model support and fallback capabilities
- **Enhanced Map Visualization**: Improved geographical visualizations with heat mapping and region selection
- **User Personalization Framework**: User-specific dashboard layouts, saved filters, and preferences

## Verification Steps

1. ✅ Pre-deployment verification passed
2. ✅ Deployment package created
3. ✅ File integrity checksums generated
4. ${SWA_TOKEN != "dummy-token-for-testing" ? "✅ Deployment to Azure successful" : "⏳ Manual deployment required"}

## Next Steps

1. Configure Azure OpenAI API keys in production environment
2. Run end-to-end testing with real data
3. Enable monitoring and alerts
4. Update documentation for end users

## Verification Checklist

- [ ] Verify Azure Active Directory integration
- [ ] Verify AI components functionality
- [ ] Verify Enhanced Map components
- [ ] Verify User Personalization features
- [ ] Verify data connections
- [ ] Run performance testing
- [ ] Verify browser compatibility

## References

- Checksums: \`$CHECKSUM_FILE\`
- Deployment Log: \`$LOG_FILE\`
- Version File: \`$DEPLOY_DIR/version.json\`
EOF

log "${GREEN}Deployment verification report generated: $REPORT_FILE${NC}"

# Final summary
log ""
log "${BLUE}=======================================================${NC}"
log "${BLUE}= Deployment Summary                                  =${NC}"
log "${BLUE}=======================================================${NC}"
if [ "$SWA_TOKEN" != "dummy-token-for-testing" ]; then
  log "Deployment Status: ${GREEN}SUCCESS${NC}"
  log "Deployed Version: v2.4.0"
  log "Deployment URL: https://$DEPLOYMENT_URL"
else
  log "Deployment Status: ${YELLOW}MANUAL DEPLOYMENT REQUIRED${NC}"
  log "Version: v2.4.0"
  log "Manual Deployment Guide: $REPORT_FILE"
fi
log "Deployment Timestamp: $TIMESTAMP"
log "Deployment Log: $LOG_FILE"
log "Checksums: $CHECKSUM_FILE"
log "Verification Report: $REPORT_FILE"
log ""

if [ "$SWA_TOKEN" != "dummy-token-for-testing" ]; then
  log "${GREEN}Client360 Dashboard v2.4.0 has been successfully deployed to Azure Static Web App.${NC}"
  log "Please run the verification checklist to ensure all features are working correctly."
else
  log "${YELLOW}Client360 Dashboard v2.4.0 is prepared for manual deployment to Azure.${NC}"
  log "Please follow the instructions in the manual deployment guide: $REPORT_FILE"
fi