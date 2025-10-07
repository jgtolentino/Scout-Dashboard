#!/bin/bash
# deploy_fixed.sh - Fixed deployment script for Azure Static Web Apps
# Resolves the "Current directory cannot be identical to or contained within artifact folders" error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy-final-patch"
TEMP_BUILD_DIR="/tmp/dashboard-build-$(date +%s)"
DEPLOY_DIR="/tmp/dashboard-deploy-$(date +%s)"
PUBLIC_DIR="$DEPLOY_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Fixed Azure Static Web App Dashboard Deployment Script    ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# 1. Create temporary build directory
echo -e "${BLUE}Creating temporary build directory...${RESET}"
mkdir -p "$TEMP_BUILD_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create temporary build directory${RESET}"
  exit 1
fi

# 2. Copy source files to temporary build directory
echo -e "${BLUE}Copying source files to build directory...${RESET}"
cp -r "$SOURCE_DIR"/* "$TEMP_BUILD_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy source files${RESET}"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
echo -e "${GREEN}Source files copied successfully${RESET}"

# 3. Create deployment directory structure
echo -e "${BLUE}Creating deployment directory structure...${RESET}"
mkdir -p "$PUBLIC_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment directory structure${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# 4. Copy built files to deployment directory
echo -e "${BLUE}Copying built files to deployment directory...${RESET}"
cp -r "$TEMP_BUILD_DIR"/* "$PUBLIC_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy built files to deployment directory${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi
echo -e "${GREEN}Built files copied successfully${RESET}"

# 5. Create a minimal staticwebapp.config.json if it doesn't exist
if [ ! -f "$PUBLIC_DIR/staticwebapp.config.json" ]; then
  echo -e "${BLUE}Creating staticwebapp.config.json...${RESET}"
  cat > "$PUBLIC_DIR/staticwebapp.config.json" << EOF
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ]
}
EOF
  echo -e "${GREEN}Created staticwebapp.config.json${RESET}"
fi

# 6. Create a minimal swa-cli.config.json in the deploy directory
echo -e "${BLUE}Creating swa-cli.config.json...${RESET}"
cat > "$DEPLOY_DIR/swa-cli.config.json" << EOF
{
  "configurations": {
    "app": {
      "outputLocation": "./public",
      "appLocation": "."
    }
  }
}
EOF
echo -e "${GREEN}Created swa-cli.config.json${RESET}"

# 7. Navigate to deployment directory and run SWA deployment
echo -e "\n${BLUE}Deploying to Azure Static Web App...${RESET}"
cd "$DEPLOY_DIR"
echo -e "${YELLOW}Current directory: $(pwd)${RESET}"
echo -e "${YELLOW}Directory contents:${RESET}"
ls -la

# Check for SWA CLI
if ! command -v swa &> /dev/null; then
  echo -e "${YELLOW}Azure Static Web Apps CLI not found. Installing...${RESET}"
  npm install -g @azure/static-web-apps-cli
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Azure Static Web Apps CLI${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

# Deploy using SWA CLI
echo -e "${BLUE}Running SWA deployment...${RESET}"
swa deploy ./public \
  --deployment-token $(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv) \
  --env production

# Check deployment result
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy to Azure Static Web App${RESET}"
  echo -e "${YELLOW}Trying alternative deployment method...${RESET}"
  
  # Alternative deployment method using az staticwebapp
  echo -e "${BLUE}Attempting deployment with az staticwebapp...${RESET}"
  RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
  STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
  DEPLOYMENT_TOKEN=$(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv)
  
  az staticwebapp deploy \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --source "./public" \
    --token "$DEPLOYMENT_TOKEN" \
    --no-build
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Both deployment methods failed${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

echo -e "${GREEN}Deployment completed!${RESET}"

# 8. Clean up
echo -e "\n${BLUE}Cleaning up temporary directories...${RESET}"
rm -rf "$TEMP_BUILD_DIR"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}Cleanup complete${RESET}"

# 9. Display Static Web App URL
echo -e "\n${BLUE}Getting Static Web App URL...${RESET}"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
STATIC_WEB_APP_URL=$(az staticwebapp show \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Static Web App URL${RESET}"
else
  echo -e "${GREEN}Static Web App URL: https://${STATIC_WEB_APP_URL}${RESET}"
  echo -e "${BLUE}Available pages:${RESET}"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}${RESET} (Main Dashboard)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Insights Dashboard)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/retail_edge/retail_edge_dashboard.html${RESET} (Retail Edge Dashboard)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/ops/system_dashboard.html${RESET} (Operations Dashboard)"
fi

# 10. Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployed Pages:"
echo -e "  - Main Dashboard (System Architecture & QA)"
echo -e "  - Insights Dashboard"
echo -e "  - Retail Edge Dashboard"
echo -e "  - Operations Dashboard"
echo -e "${BOLD}${GREEN}System Architecture & QA Dashboard successfully deployed!${RESET}"