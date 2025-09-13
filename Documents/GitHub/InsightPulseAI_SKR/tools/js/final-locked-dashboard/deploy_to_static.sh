#!/bin/bash
# deploy_to_static.sh - Deploy mockify-creator to Azure Static Web Apps

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy mockify-creator to Azure Static Web Apps    ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
REPO_URL="https://github.com/jgtolentino/mockify-creator.git"
TEMP_DIR="/tmp/mockify-static-clone"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STATIC_SITE_NAME="retail-advisor-static"
LOCATION="eastus2"

# Clean up any existing temp directory
rm -rf "${TEMP_DIR}"

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: Git is required but not installed.${RESET}"
  exit 1
fi

# Clone the repository
echo -e "${BLUE}Cloning mockify-creator repository...${RESET}"
git clone "${REPO_URL}" "${TEMP_DIR}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to clone repository.${RESET}"
  exit 1
fi
echo -e "${GREEN}Repository cloned successfully.${RESET}"

# Check if az is installed
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is required but not installed.${RESET}"
  exit 1
fi

# Check Azure login
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

# Create Static Web App
echo -e "${BLUE}Creating Azure Static Web App...${RESET}"
az staticwebapp create \
  --name "${STATIC_SITE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --source "${TEMP_DIR}" \
  --branch main \
  --app-location "/" \
  --output-location "/" \
  --login-with-github

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Static Web App.${RESET}"
  exit 1
fi
echo -e "${GREEN}Static Web App created.${RESET}"

# Get the Static Web App URL
echo -e "${BLUE}Getting Static Web App URL...${RESET}"
STATIC_SITE_URL=$(az staticwebapp show \
  --name "${STATIC_SITE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "defaultHostname" -o tsv)

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Static Web App URL.${RESET}"
  exit 1
fi

echo -e "\n${BOLD}${GREEN}Deployment Complete!${RESET}"
echo -e "${BOLD}${BLUE}Static Web App URL:${RESET} https://${STATIC_SITE_URL}"

# Clean up
echo -e "${BLUE}Cleaning up...${RESET}"
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}Cleanup complete.${RESET}"