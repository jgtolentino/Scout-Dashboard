#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║  Juicer Dashboard Deployment Tool                          ║${NC}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
AZURE_STATIC_WEBAPP_NAME="brave-wave-0f91dbd1e"
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/dashboards"
BUILD_DIR="/tmp/dashboard-deploy-$(date +%Y%m%d%H%M%S)"
REGION="westus2"

# Create build directory
echo -e "${BLUE}Creating build directory at ${BUILD_DIR}...${NC}"
mkdir -p "${BUILD_DIR}"

# Copy dashboard files
echo -e "${BLUE}Copying dashboard files...${NC}"
cp -r "${SOURCE_DIR}"/* "${BUILD_DIR}/"

# Check if required files exist
if [ ! -f "${BUILD_DIR}/drilldown-dashboard.html" ]; then
  echo -e "${RED}Error: drilldown-dashboard.html not found!${NC}"
  exit 1
fi

echo -e "${GREEN}Files prepared for deployment.${NC}"
echo -e "${BLUE}Checking Azure CLI login status...${NC}"

# Check if logged in to Azure
if ! az account show &>/dev/null; then
  echo -e "${YELLOW}Not logged in to Azure. Please log in first.${NC}"
  az login
fi

# Deploy to Azure Static Web App
echo -e "${BLUE}Deploying to Azure Static Web App...${NC}"
echo -e "${YELLOW}This process may take a few minutes.${NC}"

# Check if using GitHub Actions for proper deployment
echo -e "${YELLOW}Note: For production deployments, the GitHub Actions workflow should be used.${NC}"
echo -e "${YELLOW}This is a quick deployment for testing purposes.${NC}"

# Deploy using az staticwebapp CLI
if ! command -v az staticwebapp &>/dev/null; then
  echo -e "${YELLOW}Azure Static Web App CLI extension not found. Installing...${NC}"
  az extension add --name staticwebapp
fi

# Deploy using az storage for testing (since proper SWA deployment requires GitHub Actions)
echo -e "${BLUE}Uploading files to Azure...${NC}"

# Create a temporary zip file for upload
ZIP_FILE="/tmp/dashboard-deploy-$(date +%Y%m%d%H%M%S).zip"
cd "${BUILD_DIR}" && zip -r "${ZIP_FILE}" . 

# Upload using the az staticwebapp CLI
az staticwebapp deploy --name "${AZURE_STATIC_WEBAPP_NAME}" --source "${ZIP_FILE}" --target-location "/"

# Clean up
echo -e "${BLUE}Cleaning up temporary files...${NC}"
rm -rf "${BUILD_DIR}"
rm -f "${ZIP_FILE}"

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${BLUE}Your dashboards should now be available at:${NC}"
echo -e "${GREEN}https://${AZURE_STATIC_WEBAPP_NAME}.6.azurestaticapps.net/dashboards/${NC}"
echo ""
echo -e "${BLUE}Don't forget to verify your deployment with the Shogun dashboard capture tool:${NC}"
echo -e "${YELLOW}/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/tools/shogun_dashboard_capture.sh${NC}"