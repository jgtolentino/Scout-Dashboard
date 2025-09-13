#!/bin/bash
# deploy_to_storage.sh - Deploy mockify-creator to Azure Blob Storage with static website hosting

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy mockify-creator to Azure Blob Storage       ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
REPO_URL="https://github.com/jgtolentino/mockify-creator.git"
TEMP_DIR="/tmp/mockify-storage-clone"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STORAGE_ACCOUNT="retailadvisorstore"
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

# Create storage account if it doesn't exist
echo -e "${BLUE}Checking storage account...${RESET}"
if ! az storage account show --name "${STORAGE_ACCOUNT}" --resource-group "${RESOURCE_GROUP}" &> /dev/null; then
  echo -e "${YELLOW}Storage account doesn't exist. Creating...${RESET}"
  az storage account create \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --https-only true \
    --allow-blob-public-access true

  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create storage account.${RESET}"
    exit 1
  fi
  echo -e "${GREEN}Storage account created.${RESET}"
else
  echo -e "${GREEN}Storage account exists.${RESET}"
fi

# Enable static website hosting
echo -e "${BLUE}Enabling static website hosting...${RESET}"
az storage blob service-properties update \
  --account-name "${STORAGE_ACCOUNT}" \
  --static-website \
  --index-document index.html \
  --404-document index.html

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to enable static website hosting.${RESET}"
  exit 1
fi
echo -e "${GREEN}Static website hosting enabled.${RESET}"

# Upload files
echo -e "${BLUE}Uploading files to storage account...${RESET}"
cd "${TEMP_DIR}"
az storage blob upload-batch \
  --account-name "${STORAGE_ACCOUNT}" \
  --destination '$web' \
  --source .

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to upload files.${RESET}"
  exit 1
fi
echo -e "${GREEN}Files uploaded successfully.${RESET}"

# Get the static website URL
echo -e "${BLUE}Getting static website URL...${RESET}"
STORAGE_URL=$(az storage account show \
  --name "${STORAGE_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "primaryEndpoints.web" \
  --output tsv)

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get static website URL.${RESET}"
  exit 1
fi

echo -e "\n${BOLD}${GREEN}Deployment Complete!${RESET}"
echo -e "${BOLD}${BLUE}Static Website URL:${RESET} ${STORAGE_URL}"

# Clean up
echo -e "${BLUE}Cleaning up...${RESET}"
cd - > /dev/null
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}Cleanup complete.${RESET}"