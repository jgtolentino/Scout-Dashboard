#!/bin/bash
# manual_az_cli.sh - Manual deployment of Scout Advanced Analytics Dashboard using Azure CLI
# Use this script when you need precise control over the deployment process

# Set variables
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
APP_NAME="tbwa-juicer-insights-dashboard"
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/deployment-v2/public"

# Text formatting for output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}=== Manual Deployment to Azure Static Web Apps ===${RESET}"
echo -e "${YELLOW}App Name:${RESET} $APP_NAME"
echo -e "${YELLOW}Resource Group:${RESET} $RESOURCE_GROUP"
echo -e "${YELLOW}Source Directory:${RESET} $SOURCE_DIR"
echo ""

# Verify Azure login
echo -e "${BLUE}Verifying Azure CLI login...${RESET}"
ACCOUNT=$(az account show --query name -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure CLI. Logging in...${RESET}"
    az login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to login to Azure CLI. Exiting.${RESET}"
        exit 1
    fi
fi
echo -e "${GREEN}Logged in as: $(az account show --query name -o tsv)${RESET}"

# Verify source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}Source directory does not exist: $SOURCE_DIR${RESET}"
    echo -e "${YELLOW}Please check the path and try again.${RESET}"
    exit 1
fi

# Check for required files
echo -e "${BLUE}Verifying required files...${RESET}"
REQUIRED_FILES=("index.html" "insights_dashboard.html" "insights_dashboard_v2.html" "css/retail_edge_style_patch.css")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$SOURCE_DIR/$file" ]; then
        echo -e "${RED}Required file missing: $file${RESET}"
        echo -e "${YELLOW}Please ensure all required files are present before deployment.${RESET}"
        exit 1
    fi
done
echo -e "${GREEN}All required files verified.${RESET}"

# Verify Static Web App exists
echo -e "${BLUE}Verifying Static Web App exists...${RESET}"
az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Static Web App not found: $APP_NAME${RESET}"
    echo -e "${YELLOW}Please check the app name and resource group are correct.${RESET}"
    exit 1
fi
echo -e "${GREEN}Static Web App verified.${RESET}"

# Optional: Retrieve deployment token
echo -e "${BLUE}Retrieving deployment token from Key Vault...${RESET}"
DEPLOYMENT_TOKEN=$(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Could not retrieve deployment token from Key Vault.${RESET}"
    echo -e "${YELLOW}Will attempt to deploy without explicit token.${RESET}"
    DEPLOYMENT_TOKEN=""
fi

# Deploy to Azure Static Web App
echo -e "${BLUE}Deploying to Azure Static Web App...${RESET}"

if [ -n "$DEPLOYMENT_TOKEN" ]; then
    # Deploy with token
    echo -e "${YELLOW}Deploying with deployment token...${RESET}"
    az staticwebapp deploy \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source "$SOURCE_DIR" \
        --token "$DEPLOYMENT_TOKEN" \
        --no-build \
        --verbose
else
    # Deploy without explicit token
    echo -e "${YELLOW}Deploying without explicit token...${RESET}"
    az staticwebapp deploy \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source "$SOURCE_DIR" \
        --no-build \
        --verbose
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed.${RESET}"
    exit 1
fi

echo -e "${GREEN}Deployment successful!${RESET}"

# Get the app URL
echo -e "${BLUE}Retrieving app URL...${RESET}"
APP_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)

echo -e "${GREEN}Dashboard deployed to:${RESET}"
echo -e "  - ${BOLD}https://$APP_URL/insights_dashboard.html${RESET} (Standard version)"
echo -e "  - ${BOLD}https://$APP_URL/insights_dashboard_v2.html${RESET} (Power BI styled version)"

echo -e "\n${BOLD}${GREEN}Deployment completed successfully!${RESET}"
echo -e "${YELLOW}Timestamp:${RESET} $(date +"%Y-%m-%d %H:%M:%S")"