#!/bin/bash
# Azure Deployment Script for Client360 Dashboard Rollback
# This script handles the Azure deployment of the rolled back dashboard

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
DEPLOY_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy"
DESKTOP_DIR="$HOME/Desktop"

# Azure configuration
SUBSCRIPTION="TBWA-ProjectScout-Prod"  # Update with your subscription name
RESOURCE_GROUP="InsightPulseAI-RG"     # Update with your resource group name
STATIC_WEBAPP_NAME="tbwa-client360"    # Update with your Static Web App name
DEPLOYMENT_ENV="production"           # Can be 'production', 'staging', etc.

echo -e "${GREEN}Azure Deployment for Client360 Dashboard Rollback${NC}"
echo -e "${YELLOW}==================================================${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found. Please install Azure CLI to proceed.${NC}"
    echo -e "${YELLOW}Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Login to Azure with device code flow (more reliable for scripts)
echo -e "${YELLOW}Logging in to Azure using device code flow...${NC}"
az login --use-device-code

# List available subscriptions
echo -e "${BLUE}Available Azure Subscriptions:${NC}"
az account list --query "[].{Name:name, ID:id, DefaultStatus:isDefault}" --output table

# Set the subscription
echo -e "${YELLOW}Setting subscription to: $SUBSCRIPTION${NC}"
az account set --subscription "$SUBSCRIPTION"

# Verify current subscription
CURRENT_SUB=$(az account show --query "name" -o tsv)
echo -e "${GREEN}Working with subscription: $CURRENT_SUB${NC}"

# List Static Web Apps in the resource group
echo -e "${BLUE}Static Web Apps in resource group $RESOURCE_GROUP:${NC}"
az staticwebapp list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name, Location:location, Url:defaultHostname}" --output table

# Confirm deployment
echo -e "${YELLOW}You are about to deploy the Client360 Dashboard rollback to:${NC}"
echo -e "   Static Web App: ${BLUE}$STATIC_WEBAPP_NAME${NC}"
echo -e "   Resource Group: ${BLUE}$RESOURCE_GROUP${NC}"
echo -e "   Environment: ${BLUE}$DEPLOYMENT_ENV${NC}"

read -p "Do you want to proceed with the deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Check if the deployment directory exists and has the required files
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${RED}Error: Deployment directory $DEPLOY_DIR does not exist.${NC}"
    exit 1
fi

if [ ! -f "$DEPLOY_DIR/index.html" ]; then
    echo -e "${RED}Error: Required file index.html not found in deployment directory.${NC}"
    exit 1
fi

# Create a deployment package
echo -e "${BLUE}Creating deployment package...${NC}"
DEPLOY_PACKAGE="$DESKTOP_DIR/client360_dashboard_azure_deploy_$TIMESTAMP.zip"
(cd "$DEPLOY_DIR" && zip -r "$DEPLOY_PACKAGE" .)
echo -e "${GREEN}Deployment package created: $DEPLOY_PACKAGE${NC}"

# Start the deployment
echo -e "${YELLOW}Starting deployment to Azure Static Web App...${NC}"

# Attempt deployment using CLI first
echo -e "${BLUE}Attempting direct deployment using Azure CLI...${NC}"
if az staticwebapp browse --resource-group "$RESOURCE_GROUP" --name "$STATIC_WEBAPP_NAME" &> /dev/null; then
    # Static Web App exists, deploy to it
    echo -e "${GREEN}Static Web App found. Deploying...${NC}"
    
    # Try using the deploy command
    if az staticwebapp deploy --resource-group "$RESOURCE_GROUP" --name "$STATIC_WEBAPP_NAME" --source-path "$DEPLOY_DIR" --env "$DEPLOYMENT_ENV"; then
        echo -e "${GREEN}Deployment successful using az staticwebapp deploy!${NC}"
    else
        echo -e "${YELLOW}Direct deployment failed. Trying alternative approach...${NC}"
        
        # Alternative: Get the deployment token and use it with swa-cli
        TOKEN=$(az staticwebapp secrets list --resource-group "$RESOURCE_GROUP" --name "$STATIC_WEBAPP_NAME" --query "properties.apiKey" -o tsv)
        
        if [ -n "$TOKEN" ]; then
            echo -e "${BLUE}Got deployment token. Using swa-cli...${NC}"
            if command -v swa &> /dev/null; then
                swa deploy "$DEPLOY_DIR" --deployment-token "$TOKEN" --env "$DEPLOYMENT_ENV"
                echo -e "${GREEN}Deployment successful using swa-cli!${NC}"
            else
                echo -e "${YELLOW}swa-cli not found. Please use manual deployment method.${NC}"
                echo -e "${YELLOW}Deployment token: $TOKEN${NC}"
            fi
        else
            echo -e "${RED}Failed to get deployment token. Using manual upload method...${NC}"
            # Provide instructions for manual deployment
            echo -e "${YELLOW}Please use the Azure Portal to deploy the package manually:${NC}"
            echo -e "1. Go to Azure Portal: https://portal.azure.com"
            echo -e "2. Navigate to Resource Group: $RESOURCE_GROUP"
            echo -e "3. Select Static Web App: $STATIC_WEBAPP_NAME"
            echo -e "4. Choose 'Deployment > Manual Deploy'"
            echo -e "5. Upload the package: $DEPLOY_PACKAGE"
        fi
    fi
else
    echo -e "${RED}Static Web App not found or not accessible.${NC}"
    echo -e "${YELLOW}Please check the resource group and web app name.${NC}"
    echo -e "${YELLOW}Alternatively, use manual deployment through the Azure Portal:${NC}"
    echo -e "1. Go to Azure Portal: https://portal.azure.com"
    echo -e "2. Navigate to your Static Web App resource"
    echo -e "3. Choose 'Deployment > Manual Deploy'"
    echo -e "4. Upload the package: $DEPLOY_PACKAGE"
fi

# Get deployment URLs
echo -e "${BLUE}Getting deployment URLs...${NC}"
if az staticwebapp browse --resource-group "$RESOURCE_GROUP" --name "$STATIC_WEBAPP_NAME" &> /dev/null; then
    APP_URL=$(az staticwebapp show --resource-group "$RESOURCE_GROUP" --name "$STATIC_WEBAPP_NAME" --query "defaultHostname" -o tsv)
    echo -e "${GREEN}Deployment completed. Your dashboard is available at:${NC}"
    echo -e "https://$APP_URL"
    echo -e "https://$APP_URL/index.html"
    echo -e "https://$APP_URL/guide.html"
    echo -e "https://$APP_URL/direct_url_links.html"
fi

# Create verification reminder
VERIFICATION_FILE="$DESKTOP_DIR/VERIFY_CLIENT360_DEPLOYMENT.md"
cat > "$VERIFICATION_FILE" << EOF
# Client360 Dashboard Deployment Verification

## Deployment Details

- **Deployment Date**: $(date +"%B %d, %Y at %H:%M:%S")
- **Package Path**: $DEPLOY_PACKAGE
- **Deployment Environment**: $DEPLOYMENT_ENV

## Verification Steps

1. Access the dashboard at:
   - https://$APP_URL
   - https://$APP_URL/index.html

2. Verify critical components:
   - [ ] Dashboard loads with TBWA branding (yellow #ffc300, blue #005bbb)
   - [ ] All CSS styles are applied correctly
   - [ ] JavaScript functionality works properly
   - [ ] Store map displays correctly with Philippines outline
   - [ ] Store markers appear and are interactive
   - [ ] Documentation links work correctly

3. Run verification script:
   \`\`\`bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
   ./scripts/verify_rollback_implementation.sh
   \`\`\`

## Manual Deployment (if automated method failed)

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to Resource Group: $RESOURCE_GROUP
3. Select Static Web App: $STATIC_WEBAPP_NAME
4. Choose 'Deployment > Manual Deploy'
5. Upload the package: $DEPLOY_PACKAGE

## Support

If you encounter any issues, please contact the Dashboard Team.

---

*Deployment performed on: $(date +"%B %d, %Y")*
EOF

echo -e "${GREEN}Created verification reminder at: $VERIFICATION_FILE${NC}"
echo -e "${YELLOW}Please follow the verification steps to ensure the deployment was successful.${NC}"
exit 0