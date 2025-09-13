#!/bin/bash
# deploy_v2.4.0_to_azure.sh
# Script to deploy Client360 Dashboard v2.4.0 to Azure Static Web Apps

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
LOG_FILE="$LOG_DIR/deployment_v2.4.0_$TIMESTAMP.log"
CHECKSUM_FILE="$LOG_DIR/checksums_v2.4.0_$TIMESTAMP.md5"
SWA_CONFIG_PATH="$DEPLOY_DIR/staticwebapp.config.json"
AZURE_RESOURCE_GROUP="tbwa-client360-dashboard"
AZURE_SWA_NAME="tbwa-client360-dashboard-production"
DEPLOYMENT_URL=""

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
  exit 1
fi

# Check if logged into Azure
log "${YELLOW}Checking Azure login...${NC}"
if ! az account show &> /dev/null; then
  log "${YELLOW}Not logged into Azure. Logging in...${NC}"
  az login
  if [ $? -ne 0 ]; then
    log "${RED}Azure login failed. Aborting deployment.${NC}"
    exit 1
  fi
fi

# Verify resource group exists
log "${YELLOW}Verifying Azure resource group...${NC}"
if ! az group show --name "$AZURE_RESOURCE_GROUP" &> /dev/null; then
  log "${RED}Resource group $AZURE_RESOURCE_GROUP not found. Aborting deployment.${NC}"
  exit 1
fi

# Verify Static Web App exists
log "${YELLOW}Verifying Azure Static Web App...${NC}"
if ! az staticwebapp show --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
  log "${RED}Static Web App $AZURE_SWA_NAME not found. Aborting deployment.${NC}"
  exit 1
fi

# Deploy to Azure Static Web App
log "${YELLOW}Deploying to Azure Static Web App...${NC}"
log "${YELLOW}This may take several minutes...${NC}"

# Get SWA deployment token
SWA_TOKEN=$(az staticwebapp secrets list --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query "properties.apiKey" -o tsv)
if [ -z "$SWA_TOKEN" ]; then
  log "${RED}Failed to get SWA deployment token. Aborting deployment.${NC}"
  exit 1
fi

# Deploy using SWA CLI
if ! command -v swa &> /dev/null; then
  log "${YELLOW}SWA CLI not found. Installing...${NC}"
  npm install -g @azure/static-web-apps-cli
  if [ $? -ne 0 ]; then
    log "${RED}Failed to install SWA CLI. Aborting deployment.${NC}"
    exit 1
  fi
fi

log "${YELLOW}Deploying with SWA CLI...${NC}"
swa deploy "$DEPLOY_DIR" --env production --deployment-token "$SWA_TOKEN" >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
  log "${GREEN}Deployment to Azure Static Web App succeeded!${NC}"
  
  # Get deployment URL
  DEPLOYMENT_URL=$(az staticwebapp show --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query "defaultHostname" -o tsv)
  log "${GREEN}Deployed to: https://$DEPLOYMENT_URL${NC}"
  
  # Update deployment record
  echo "v2.4.0,$TIMESTAMP,https://$DEPLOYMENT_URL" >> "$LOG_DIR/deployment_history.csv"
else
  log "${RED}Deployment to Azure Static Web App failed. Check $LOG_FILE for details.${NC}"
  exit 1
fi

# Create deployment verification report
log "${YELLOW}Generating deployment verification report...${NC}"
REPORT_FILE="$LOG_DIR/deployment_verification_v2.4.0_$TIMESTAMP.md"

cat > $REPORT_FILE << EOF
# Client360 Dashboard v2.4.0 Deployment Verification Report

**Deployment Date:** $(date)
**Deployment ID:** client360_$TIMESTAMP
**Deployment URL:** https://$DEPLOYMENT_URL
**Deployment Package:** $DEPLOY_PACKAGE

## Deployment Summary

The Client360 Dashboard v2.4.0 has been successfully deployed to Azure Static Web App.

## Features Included

- **Multi-Model AI Framework**: Enhanced AI insights with multiple model support and fallback capabilities
- **Enhanced Map Visualization**: Improved geographical visualizations with heat mapping and region selection
- **User Personalization Framework**: User-specific dashboard layouts, saved filters, and preferences

## Verification Steps

1. ✅ Pre-deployment verification passed
2. ✅ Deployment package created
3. ✅ File integrity checksums generated
4. ✅ Deployment to Azure successful

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
log "Deployment Status: ${GREEN}SUCCESS${NC}"
log "Deployed Version: v2.4.0"
log "Deployment URL: https://$DEPLOYMENT_URL"
log "Deployment Timestamp: $TIMESTAMP"
log "Deployment Log: $LOG_FILE"
log "Checksums: $CHECKSUM_FILE"
log "Verification Report: $REPORT_FILE"
log ""
log "${GREEN}Client360 Dashboard v2.4.0 has been successfully deployed to Azure Static Web App.${NC}"
log "Please run the verification checklist to ensure all features are working correctly."