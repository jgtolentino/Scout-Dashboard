#!/bin/bash
# setup_azure_resources_custom.sh - Custom script to configure Azure resources for Juicer GenAI Insights
# Modified to align with existing TBWA-ProjectScout naming conventions

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration - Customized for TBWA-ProjectScout naming conventions
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
LOCATION="eastus2"
STORAGE_ACCOUNT_NAME="tbwajuicerstorage"
DATABRICKS_WORKSPACE_NAME="tbwa-juicer-databricks"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
KEYVAULT_NAME="kv-tbwa-juicer-insights"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Azure Resources Setup for Juicer GenAI Insights           ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${RESET}"
  echo "Please install the Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check Azure CLI login
echo -e "${BLUE}Checking Azure CLI login...${RESET}"
ACCOUNT=$(az account show --query name -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Not logged in to Azure CLI. Please log in:${RESET}"
  az login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to log in to Azure CLI${RESET}"
    exit 1
  fi
fi

ACCOUNT=$(az account show --query name -o tsv)
echo -e "${GREEN}Logged in as: ${ACCOUNT}${RESET}"

# Confirm before proceeding
echo -e "\n${YELLOW}This script will create the following Azure resources:${RESET}"
echo "- Resource Group: ${RESOURCE_GROUP}"
echo "- Storage Account: ${STORAGE_ACCOUNT_NAME}"
echo "- Databricks Workspace: ${DATABRICKS_WORKSPACE_NAME}"
echo "- Static Web App: ${STATIC_WEB_APP_NAME}"
echo "- Key Vault: ${KEYVAULT_NAME}"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Operation cancelled by user${RESET}"
  exit 0
fi

# Create Resource Group
echo -e "\n${BLUE}Creating Resource Group...${RESET}"
az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Resource Group${RESET}"
  exit 1
fi
echo -e "${GREEN}Resource Group created successfully${RESET}"

# Create Storage Account
echo -e "\n${BLUE}Creating Storage Account...${RESET}"
az storage account create \
  --name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --sku "Standard_LRS" \
  --kind "StorageV2" \
  --enable-hierarchical-namespace true
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Storage Account${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage Account created successfully${RESET}"

# Create Containers
echo -e "\n${BLUE}Creating Storage Containers...${RESET}"
STORAGE_KEY=$(az storage account keys list --account-name "${STORAGE_ACCOUNT_NAME}" --resource-group "${RESOURCE_GROUP}" --query [0].value -o tsv)

for container in "bronze" "silver" "gold" "platinum"; do
  az storage container create \
    --name "${container}" \
    --account-name "${STORAGE_ACCOUNT_NAME}" \
    --account-key "${STORAGE_KEY}"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create container ${container}${RESET}"
    exit 1
  fi
  echo -e "${GREEN}Container ${container} created successfully${RESET}"
done

# Create Databricks Workspace
echo -e "\n${BLUE}Creating Databricks Workspace...${RESET}"
az databricks workspace create \
  --name "${DATABRICKS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --sku "standard"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Databricks Workspace${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks Workspace created successfully${RESET}"

# Create Static Web App
echo -e "\n${BLUE}Creating Static Web App...${RESET}"
az staticwebapp create \
  --name "${STATIC_WEB_APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --sku "Free"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Static Web App${RESET}"
  exit 1
fi
echo -e "${GREEN}Static Web App created successfully${RESET}"

# Create Key Vault
echo -e "\n${BLUE}Creating Key Vault...${RESET}"
az keyvault create \
  --name "${KEYVAULT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Key Vault created successfully${RESET}"

# Get current user object ID
USER_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

# Set Key Vault access policy for current user
echo -e "\n${BLUE}Setting Key Vault access policy...${RESET}"
az keyvault set-policy \
  --name "${KEYVAULT_NAME}" \
  --object-id "${USER_OBJECT_ID}" \
  --secret-permissions get list set delete
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to set Key Vault access policy${RESET}"
  exit 1
fi
echo -e "${GREEN}Key Vault access policy set successfully${RESET}"

# Get Static Web App deployment token
echo -e "\n${BLUE}Getting Static Web App deployment token...${RESET}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name "${STATIC_WEB_APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "properties.apiKey" -o tsv)
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Static Web App deployment token${RESET}"
  exit 1
fi

# Get Databricks workspace URL
DATABRICKS_URL=$(az databricks workspace show \
  --name "${DATABRICKS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "properties.workspaceUrl" -o tsv)
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Databricks workspace URL${RESET}"
  exit 1
fi

# Store token in Key Vault
echo -e "\n${BLUE}Storing deployment token in Key Vault...${RESET}"
az keyvault secret set \
  --vault-name "${KEYVAULT_NAME}" \
  --name "AZURE-STATIC-WEB-APPS-API-TOKEN" \
  --value "${DEPLOYMENT_TOKEN}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to store deployment token in Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Deployment token stored in Key Vault successfully${RESET}"

# Store storage access key in Key Vault
echo -e "\n${BLUE}Storing storage access key in Key Vault...${RESET}"
az keyvault secret set \
  --vault-name "${KEYVAULT_NAME}" \
  --name "STORAGE-ACCOUNT-KEY" \
  --value "${STORAGE_KEY}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to store storage access key in Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage access key stored in Key Vault successfully${RESET}"

# Create a configuration file for the Databricks mount
echo -e "\n${BLUE}Creating Databricks mount configuration...${RESET}"
cat > databricks_mount_config.py << EOL
# Databricks notebook source
storage_account_name = "${STORAGE_ACCOUNT_NAME}"
container_name = "bronze"
mount_point = "/mnt/insightpulseai/bronze"

# First, set up storage account access key in Databricks secrets
# dbutils.secrets.put(scope="insightpulseai", key="storage-account-key", string="${STORAGE_KEY}")

# Mount the storage account
dbutils.fs.mount(
  source = f"wasbs://{container_name}@{storage_account_name}.blob.core.windows.net/",
  mount_point = mount_point,
  extra_configs = {
    f"fs.azure.account.key.{storage_account_name}.blob.core.windows.net": "${STORAGE_KEY}"
  }
)

# Repeat for other containers
for container in ["silver", "gold", "platinum"]:
  mount_point = f"/mnt/insightpulseai/{container}"
  dbutils.fs.mount(
    source = f"wasbs://{container}@{storage_account_name}.blob.core.windows.net/",
    mount_point = mount_point,
    extra_configs = {
      f"fs.azure.account.key.{storage_account_name}.blob.core.windows.net": "${STORAGE_KEY}"
    }
  )

print("All containers mounted successfully")
EOL

# Summary
echo -e "\n${BLUE}${BOLD}Azure Resources Setup Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Resource Group: ${GREEN}${RESOURCE_GROUP}${RESET}"
echo -e "Storage Account: ${GREEN}${STORAGE_ACCOUNT_NAME}${RESET}"
echo -e "Databricks Workspace: ${GREEN}${DATABRICKS_WORKSPACE_NAME}${RESET}"
echo -e "Databricks URL: ${GREEN}https://${DATABRICKS_URL}${RESET}"
echo -e "Static Web App: ${GREEN}${STATIC_WEB_APP_NAME}${RESET}"
echo -e "Key Vault: ${GREEN}${KEYVAULT_NAME}${RESET}"

# Next steps
echo -e "\n${YELLOW}${BOLD}Next Steps:${RESET}"
echo -e "1. Create a Databricks access token at https://${DATABRICKS_URL}/#secrets/createToken"
echo -e "2. Store the Databricks token in Key Vault:"
echo -e "   ${BLUE}az keyvault secret set --vault-name \"${KEYVAULT_NAME}\" --name \"DATABRICKS-TOKEN\" --value \"<your-token>\"${RESET}"
echo -e "3. Store LLM API keys in Key Vault:"
echo -e "   ${BLUE}az keyvault secret set --vault-name \"${KEYVAULT_NAME}\" --name \"CLAUDE-API-KEY\" --value \"<your-api-key>\"${RESET}"
echo -e "   ${BLUE}az keyvault secret set --vault-name \"${KEYVAULT_NAME}\" --name \"OPENAI-API-KEY\" --value \"<your-api-key>\"${RESET}"
echo -e "4. Create a Databricks cluster and note the cluster ID"
echo -e "5. Run the databricks_mount_config.py script in your Databricks workspace"
echo -e "6. Upload the Juicer notebooks to your Databricks workspace"
echo -e "7. Configure GitHub repository secrets for CI/CD deployment"

echo -e "\n${GREEN}Azure resources setup complete! You can now proceed with deploying the Juicer GenAI Insights system.${RESET}"