#!/bin/bash
# deploy_power_bi_styled.sh - Deploy Scout Advanced Analytics with Power BI styling to match Vercel

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_power_bi_styled_v1"
DEPLOYMENT_DIR="$SOURCE_DIR/deployment-v2"
PUBLIC_DIR="$DEPLOYMENT_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔═════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Scout Advanced Analytics with Power BI Style (Vercel Match)  ${RESET}"
echo -e "${BOLD}${BLUE}╚═════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check if the deployment directory exists
if [ ! -d "$DEPLOYMENT_DIR" ]; then
  echo -e "${RED}Error: Deployment directory not found${RESET}"
  echo -e "${YELLOW}Please run the setup script first to create the deployment directory${RESET}"
  exit 1
fi

# Check Azure CLI login status
echo -e "${BLUE}Checking Azure login status...${RESET}"
az account show &> /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Not logged into Azure. Running az login...${RESET}"
  az login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Azure. Deployment aborted.${RESET}"
    exit 1
  fi
fi

# Check for SWA CLI
if ! command -v swa &> /dev/null; then
  echo -e "${YELLOW}Azure Static Web Apps CLI not found. Installing...${RESET}"
  npm install -g @azure/static-web-apps-cli
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Azure Static Web Apps CLI${RESET}"
    exit 1
  fi
fi

# Copy main dashboard file to match the expected name
echo -e "${BLUE}Preparing files for deployment...${RESET}"
cp "$PUBLIC_DIR/insights_dashboard_v2.html" "$PUBLIC_DIR/insights_dashboard.html"

# Update config file for deployment
echo -e "${BLUE}Updating configuration...${RESET}"
cp "$DEPLOYMENT_DIR/config/swa-cli.config.json" "$DEPLOYMENT_DIR/swa-cli.config.json"

# Navigate to deployment directory and run SWA deployment
echo -e "\n${BLUE}Deploying to Azure Static Web App...${RESET}"
cd "$DEPLOYMENT_DIR"
echo -e "${YELLOW}Current directory: $(pwd)${RESET}"
echo -e "${YELLOW}Directory contents:${RESET}"
ls -la public/

echo -e "${BLUE}Running SWA deployment...${RESET}"
echo -e "${YELLOW}Using deployment tag: ${DEPLOY_TAG}${RESET}"

# Deploy using SWA CLI
swa deploy "./public" \
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
    exit 1
  fi
fi

echo -e "${GREEN}Deployment completed!${RESET}"

# Display Static Web App URL
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
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Power BI Style)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard_v2.html${RESET} (Power BI Style - Direct)"
fi

# Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployment Tag: ${DEPLOY_TAG}"
echo -e ""
echo -e "${BOLD}${BLUE}Power BI Style Features:${RESET}"
echo -e "  - Azure blue primary color scheme"
echo -e "  - Clean, modern dashboard aesthetics"
echo -e "  - Card layout with left accent strips"
echo -e "  - Chart improvements with proper axis labeling"
echo -e "  - Unified GenAI presentation"
echo -e ""
echo -e "${BOLD}${GREEN}Deployment Log:${RESET}"
echo -e "patch_id: scout_power_bi_style_${DEPLOY_TAG}"
echo -e "Log timestamp: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${BOLD}${GREEN}Scout Advanced Analytics with Power BI Styling Deployment Complete! ✅${RESET}"