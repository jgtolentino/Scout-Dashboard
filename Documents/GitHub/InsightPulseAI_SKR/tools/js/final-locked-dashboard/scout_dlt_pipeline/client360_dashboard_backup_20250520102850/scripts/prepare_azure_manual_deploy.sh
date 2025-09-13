#!/bin/bash
# Simplified Azure Deployment Preparation Script for Client360 Dashboard
# This script prepares a deployment package and instructions for manual deployment

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

# Azure configuration (can be updated manually)
STATIC_WEBAPP_NAME="tbwa-client360-dashboard"
DEFAULT_APP_URL="client360.azurestaticapps.net"

echo -e "${GREEN}Azure Deployment Preparation for Client360 Dashboard${NC}"
echo -e "${YELLOW}==================================================${NC}"

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

# Ask for the Azure Static Web App URL if known
echo -e "${YELLOW}Do you know the Azure Static Web App URL for your deployment? (y/n)${NC}"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Please enter the Azure Static Web App URL (e.g., client360.azurestaticapps.net):${NC}"
    read -p "" APP_URL
    echo -e "${GREEN}Using Azure Static Web App URL: https://$APP_URL${NC}"
else
    echo -e "${YELLOW}Using default URL: https://$DEFAULT_APP_URL${NC}"
    echo -e "${YELLOW}You can update this in the verification instructions later.${NC}"
    APP_URL=$DEFAULT_APP_URL
fi

# Create verification instructions
VERIFICATION_FILE="$DESKTOP_DIR/AZURE_DEPLOYMENT_INSTRUCTIONS.md"
cat > "$VERIFICATION_FILE" << EOF
# Azure Deployment Instructions for Client360 Dashboard

## Deployment Package

A deployment package has been prepared for you at:
\`\`\`
$DEPLOY_PACKAGE
\`\`\`

## Manual Deployment Steps

1. **Log in to Azure Portal**
   - Go to [Azure Portal](https://portal.azure.com)
   - Sign in with your Azure credentials

2. **Navigate to your Static Web App resource**
   - Find and select your Static Web App resource (e.g., \`$STATIC_WEBAPP_NAME\`)
   - If you can't find it, use the search bar at the top of the Azure Portal

3. **Deploy the package**
   - In the left menu, under "Deployment", select "Manual Deploy"
   - Click "Browse" and select the deployment package from your Desktop:
     \`$DEPLOY_PACKAGE\`
   - Select "Production" as the environment
   - Click "Upload" to start the deployment

4. **Wait for deployment to complete**
   - The deployment may take a few minutes
   - You can monitor the progress in the "Deployment" section

## Verification Steps

After deployment is complete, verify the dashboard is working correctly:

1. **Access the dashboard at:**
   - https://$APP_URL
   - https://$APP_URL/index.html
   - https://$APP_URL/guide.html

2. **Verify critical components:**
   - Dashboard loads with TBWA branding (yellow #ffc300, blue #005bbb)
   - All CSS styles are applied correctly
   - JavaScript functionality works properly
   - Store map displays correctly with Philippines outline
   - Store markers appear and are interactive
   - Documentation links work correctly

3. **Run the verification script:**
   \`\`\`bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
   ./scripts/verify_rollback_implementation.sh
   \`\`\`

4. **Update the script with the correct URL:**
   - Open the script in an editor
   - Update the DASHBOARD_URL variable with your actual URL:
     \`DASHBOARD_URL="https://$APP_URL"\`
   - Save the file and run it again

## Troubleshooting

If you encounter issues during deployment or verification:

1. Check that all files are included in the deployment package
2. Verify that you have the necessary permissions for deployment
3. Check the Azure Portal for any error messages
4. Ensure the Static Web App configuration is correct

For more detailed instructions, refer to:
\`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/AZURE_DEPLOYMENT_INSTRUCTIONS.md\`

---

*Prepared on: $(date +"%B %d, %Y at %H:%M:%S")*
EOF

echo -e "${GREEN}Deployment instructions created at: $VERIFICATION_FILE${NC}"
echo -e "${YELLOW}Please follow these instructions to manually deploy the dashboard to Azure.${NC}"
echo -e "${BLUE}After deployment, run the verification script to ensure everything is working.${NC}"
exit 0