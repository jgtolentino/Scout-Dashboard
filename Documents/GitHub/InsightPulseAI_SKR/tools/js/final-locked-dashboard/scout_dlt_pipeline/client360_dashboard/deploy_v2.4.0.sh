#!/bin/bash
# deploy_v2.4.0.sh
# Deployment script for Client360 Dashboard v2.4.0
# This script packages and deploys v2.4.0 with all new components

set -e  # Exit on any error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="deploy_v2.4.0"
TARGET_ENV=${1:-"production"}  # Default to production if not specified
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="deploy_backup_${TIMESTAMP}"
LOG_FILE="logs/deployment_${TIMESTAMP}.log"
AZURE_RESOURCE_GROUP="rg-client360-${TARGET_ENV}"
AZURE_STATIC_WEB_APP="swa-client360-${TARGET_ENV}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to log messages
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

# Function for section headers
section() {
  echo -e "\n${YELLOW}====================================================${NC}"
  echo -e "${YELLOW}  $1${NC}"
  echo -e "${YELLOW}====================================================${NC}\n"
  echo -e "====================================================" >> "$LOG_FILE"
  echo -e "  $1" >> "$LOG_FILE"
  echo -e "====================================================\n" >> "$LOG_FILE"
}

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}Error: Source directory '$SOURCE_DIR' not found${NC}"
  exit 1
fi

# Start deployment
section "Starting Client360 Dashboard v2.4.0 Deployment"
log "Target environment: $TARGET_ENV"
log "Source directory: $SOURCE_DIR"
log "Timestamp: $TIMESTAMP"

# Create backup of current deployment
section "Creating backup of current deployment"
if [ -d "deploy" ]; then
  log "Creating backup in $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
  cp -r deploy/* "$BACKUP_DIR/" 2>/dev/null || true
  log "Backup completed"
else
  log "No existing deployment found to backup"
fi

# Verify deployment package
section "Verifying deployment package"
log "Running verification script..."
if ! ./verify_v2.4.0_deployment.sh; then
  echo -e "${RED}Deployment package verification failed. See log for details.${NC}"
  echo -e "${RED}Aborting deployment.${NC}"
  exit 1
fi
log "Verification completed successfully"

# Prepare for deployment
section "Preparing for deployment"
log "Removing old files from deploy directory"
mkdir -p deploy
rm -rf deploy/* 2>/dev/null || true

log "Copying new files to deploy directory"
cp -r "$SOURCE_DIR"/* deploy/

# Update version file
echo "{\"version\":\"2.4.0\",\"buildDate\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\",\"environment\":\"${TARGET_ENV}\"}" > deploy/version.json
log "Created version.json with build information"

# Process configuration files
section "Processing configuration files"
log "Applying environment-specific configurations"

# Replace placeholders in configuration files
if [ -f "config/${TARGET_ENV}.env" ]; then
  log "Found environment config: config/${TARGET_ENV}.env"
  # Load environment variables
  source "config/${TARGET_ENV}.env"
  
  # Replace placeholder in config file
  if [ -f "deploy/js/config.js" ]; then
    log "Updating API endpoints and keys in config.js"
    sed -i.bak "s|AZURE_OPENAI_ENDPOINT_PLACEHOLDER|${AZURE_OPENAI_ENDPOINT}|g" deploy/js/config.js
    sed -i.bak "s|AZURE_OPENAI_KEY_PLACEHOLDER|${AZURE_OPENAI_KEY}|g" deploy/js/config.js
    sed -i.bak "s|MAPBOX_TOKEN_PLACEHOLDER|${MAPBOX_TOKEN}|g" deploy/js/config.js
    rm -f deploy/js/config.js.bak
  fi
else
  log "${YELLOW}Warning: No environment config found for ${TARGET_ENV}${NC}"
  log "Using default configuration"
fi

# Update the static web app configuration
if [ -f "deploy/staticwebapp.config.json" ]; then
  log "Updating Static Web App configuration"
  # Add environment-specific settings if needed
  # This is a placeholder for environment-specific modifications
fi

# Deploy to Azure Static Web App
section "Deploying to Azure Static Web App"
if [ "$TARGET_ENV" = "local" ]; then
  log "Local deployment selected. Skipping Azure deployment."
else
  log "Deploying to Azure Static Web App: $AZURE_STATIC_WEB_APP"
  
  # Check if the user is logged in to Azure
  az account show > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    log "${YELLOW}Not logged in to Azure. Please login.${NC}"
    az login
  fi
  
  # Check if we need to set the subscription
  if [ ! -z "$AZURE_SUBSCRIPTION" ]; then
    log "Setting Azure subscription to: $AZURE_SUBSCRIPTION"
    az account set --subscription "$AZURE_SUBSCRIPTION"
  fi
  
  # Deploy to Azure Static Web App
  log "Starting deployment to Azure..."
  
  # Detect if we're using the Azure CLI extension or the newer StaticWebApps CLI
  if az staticwebapp --help > /dev/null 2>&1; then
    log "Using Azure CLI staticwebapp extension"
    az staticwebapp deploy \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --name "$AZURE_STATIC_WEB_APP" \
      --source-location "deploy" \
      --output table
  else
    log "Using StaticWebApps CLI"
    npx @azure/static-web-apps-cli deploy \
      --app-location "deploy" \
      --api-location "" \
      --output-location "" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --app-name "$AZURE_STATIC_WEB_APP"
  fi
  
  if [ $? -eq 0 ]; then
    log "${GREEN}Deployment to Azure completed successfully${NC}"
  else
    log "${RED}Deployment to Azure failed${NC}"
    exit 1
  fi
  
  # Get the deployment URL
  log "Getting deployment URL..."
  DEPLOYMENT_URL=$(az staticwebapp show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AZURE_STATIC_WEB_APP" \
    --query "defaultHostname" \
    --output tsv 2>/dev/null)
  
  if [ ! -z "$DEPLOYMENT_URL" ]; then
    log "${GREEN}Dashboard available at: https://$DEPLOYMENT_URL${NC}"
  fi
fi

# Update documentation
section "Updating documentation"
log "Copying documentation to docs directory"
mkdir -p docs
cp "$SOURCE_DIR/docs/RELEASE_2.4.0.md" docs/
cp "$SOURCE_DIR/docs/DEPLOYMENT_CHECKLIST_2.4.0.md" docs/
cp "$SOURCE_DIR/docs/CLIENT360_V2.4.0_FEATURES.md" docs/

# Generate deployment report
section "Generating deployment report"
REPORT_FILE="reports/deployment_report_v2.4.0_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# Client360 Dashboard v2.4.0 Deployment Report

Generated: $(date '+%Y-%m-%d %H:%M:%S')

## Deployment Information
- **Version:** 2.4.0
- **Environment:** ${TARGET_ENV}
- **Timestamp:** ${TIMESTAMP}
- **Deployment Log:** \`${LOG_FILE}\`

## Components Deployed
- Multi-Model AI Engine
- Enhanced Map Visualization
- User Personalization Framework
- Performance Optimizations

## Deployment Status
- ✅ Verification: Passed
- ✅ Configuration: Applied
- ✅ Deployment: Completed
EOF

if [ "$TARGET_ENV" != "local" ]; then
  cat >> "$REPORT_FILE" << EOF
- ✅ Azure Resource: ${AZURE_STATIC_WEB_APP}
- ✅ URL: https://${DEPLOYMENT_URL}
EOF
fi

cat >> "$REPORT_FILE" << EOF

## Next Steps
1. **Verify Deployment**:
   - Run end-to-end tests
   - Check AI Model functionality
   - Validate Map visualizations
   - Test User Personalization features

2. **Monitor Performance**:
   - Watch Azure Monitor for any issues
   - Check Application Insights for errors
   - Monitor API usage and costs

3. **User Communication**:
   - Notify users of the new release
   - Share release notes
   - Schedule training sessions

## Additional Notes
- Backup created at: \`${BACKUP_DIR}\`
- Full logs available at: \`${LOG_FILE}\`
- Deployment performed by: \`$(whoami)\`

EOF

log "${GREEN}Deployment report generated: ${REPORT_FILE}${NC}"

# Final message
section "Deployment Completed"
log "${GREEN}Client360 Dashboard v2.4.0 deployment completed successfully${NC}"
log "Summary:"
log "- Source directory: $SOURCE_DIR"
log "- Target environment: $TARGET_ENV"
log "- Backup created: $BACKUP_DIR"
log "- Logs saved to: $LOG_FILE"
log "- Deployment report: $REPORT_FILE"

if [ "$TARGET_ENV" != "local" ]; then
  log "- Dashboard URL: https://$DEPLOYMENT_URL"
fi

log "${YELLOW}Next step: Run verification tests to confirm deployment${NC}"
log "${YELLOW}Command: ./verify_v2.4.0_deployment.sh --generate-report${NC}"

exit 0