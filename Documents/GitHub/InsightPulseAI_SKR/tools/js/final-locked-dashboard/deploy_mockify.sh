#!/bin/bash
# Direct deployment of mockify-creator repo to Azure

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Direct Deploy mockify-creator to Azure             ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
REPO_URL="https://github.com/jgtolentino/mockify-creator.git"
TEMP_DIR="/tmp/mockify-direct-clone"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
WEBAPP_NAME="retail-advisor-app"
LOCATION="eastus"

# Check Azure CLI is installed
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is required but not installed.${RESET}"
  exit 1
fi

# Check Git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: Git is required but not installed.${RESET}"
  exit 1
fi

# Clean up any existing directory
rm -rf "${TEMP_DIR}"

# Clone repository
echo -e "${BLUE}Cloning mockify-creator repository...${RESET}"
git clone "${REPO_URL}" "${TEMP_DIR}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to clone repository.${RESET}"
  exit 1
fi
echo -e "${GREEN}Repository cloned successfully.${RESET}"

# Navigate to repo directory
cd "${TEMP_DIR}"

# Check if logged in to Azure
echo -e "${BLUE}Checking Azure login...${RESET}"
az account show &> /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Not logged in to Azure. Running az login...${RESET}"
  az login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Azure. Deployment aborted.${RESET}"
    exit 1
  fi
fi
echo -e "${GREEN}Azure login confirmed.${RESET}"

# Create resource group if it doesn't exist
echo -e "${BLUE}Checking resource group...${RESET}"
if ! az group show --name "${RESOURCE_GROUP}" &> /dev/null; then
  echo -e "${YELLOW}Resource group ${RESOURCE_GROUP} does not exist. Creating...${RESET}"
  az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create resource group.${RESET}"
    exit 1
  fi
  echo -e "${GREEN}Resource group created.${RESET}"
else
  echo -e "${GREEN}Resource group exists.${RESET}"
fi

# Create App Service Plan if it doesn't exist
APP_SERVICE_PLAN="AppServicePlan-${RESOURCE_GROUP}"
echo -e "${BLUE}Checking App Service Plan...${RESET}"
if ! az appservice plan show --name "${APP_SERVICE_PLAN}" --resource-group "${RESOURCE_GROUP}" &> /dev/null; then
  echo -e "${YELLOW}App Service Plan does not exist. Creating...${RESET}"
  az appservice plan create \
    --name "${APP_SERVICE_PLAN}" \
    --resource-group "${RESOURCE_GROUP}" \
    --sku B1 \
    --is-linux
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create App Service Plan.${RESET}"
    exit 1
  fi
  echo -e "${GREEN}App Service Plan created.${RESET}"
else
  echo -e "${GREEN}App Service Plan exists.${RESET}"
fi

# Check if the web app exists, create if not
echo -e "${BLUE}Checking if Web App exists...${RESET}"
if ! az webapp show --name "${WEBAPP_NAME}" --resource-group "${RESOURCE_GROUP}" &> /dev/null; then
  echo -e "${YELLOW}Web App does not exist. Creating...${RESET}"
  az webapp create \
    --name "${WEBAPP_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --plan "${APP_SERVICE_PLAN}" \
    --runtime "NODE:18-lts"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create Web App.${RESET}"
    exit 1
  fi
  echo -e "${GREEN}Web App created.${RESET}"
else
  echo -e "${GREEN}Web App exists.${RESET}"
fi

# Configure Web App settings
echo -e "${BLUE}Configuring Web App settings...${RESET}"
az webapp config set \
  --name "${WEBAPP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --startup-file "index.html"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure Web App settings.${RESET}"
  exit 1
fi

# Deploy from local git repo
echo -e "${BLUE}Deploying to Azure Web App...${RESET}"
az webapp deployment source config-local-git \
  --name "${WEBAPP_NAME}" \
  --resource-group "${RESOURCE_GROUP}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure local git deployment.${RESET}"
  exit 1
fi

# Get deployment credentials
DEPLOYMENT_URL=$(az webapp deployment source config-local-git \
  --name "${WEBAPP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query url -o tsv)

# Get deployment credentials
echo -e "${BLUE}Getting deployment credentials...${RESET}"
CREDENTIALS=$(az webapp deployment list-publishing-credentials \
  --name "${WEBAPP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "{username:publishingUserName, password:publishingPassword}" -o json)

USERNAME=$(echo ${CREDENTIALS} | grep -o '"username":"[^"]*' | grep -o '[^"]*$')
PASSWORD=$(echo ${CREDENTIALS} | grep -o '"password":"[^"]*' | grep -o '[^"]*$')

# Add the remote
git remote add azure "${DEPLOYMENT_URL}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to add Azure remote.${RESET}"
  exit 1
fi

# Push to Azure
echo -e "${BLUE}Pushing code to Azure...${RESET}"
git push azure master
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to push to Azure.${RESET}"
  exit 1
fi

# Get the URL
echo -e "${BLUE}Getting Web App URL...${RESET}"
WEBAPP_URL=$(az webapp show \
  --name "${WEBAPP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query defaultHostName -o tsv)

echo -e "\n${BOLD}${GREEN}Deployment Complete!${RESET}"
echo -e "${BOLD}${BLUE}Web App URL:${RESET} https://${WEBAPP_URL}"

# Clean up
echo -e "${BLUE}Cleaning up...${RESET}"
cd - > /dev/null
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}Cleanup complete.${RESET}"