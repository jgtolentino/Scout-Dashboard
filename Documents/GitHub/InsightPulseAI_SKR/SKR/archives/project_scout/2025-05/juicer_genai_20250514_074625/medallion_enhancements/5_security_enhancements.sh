#!/bin/bash
# 5_security_enhancements.sh - Enhance security for Juicer GenAI Insights

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
DATABRICKS_WORKSPACE_NAME="tbwa-juicer-databricks"
STORAGE_ACCOUNT_NAME="tbwajuicerstorage"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
REGION="eastus"
VNET_NAME="juicer-vnet"
SUBNET_STORAGE_NAME="storage-subnet"
SUBNET_KEYVAULT_NAME="keyvault-subnet"
SUBNET_DATABRICKS_PUBLIC_NAME="databricks-public-subnet"
SUBNET_DATABRICKS_PRIVATE_NAME="databricks-private-subnet"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Security Enhancements for Juicer GenAI Insights           ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${RESET}"
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

# Create Virtual Network and Subnets
echo -e "\n${BLUE}Creating Virtual Network and Subnets...${RESET}"
az network vnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VNET_NAME}" \
  --address-prefixes "10.0.0.0/16" \
  --location "${REGION}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Virtual Network${RESET}"
  exit 1
fi
echo -e "${GREEN}Virtual Network created successfully${RESET}"

# Create Storage Subnet
echo -e "\n${BLUE}Creating Storage Subnet...${RESET}"
az network vnet subnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --vnet-name "${VNET_NAME}" \
  --name "${SUBNET_STORAGE_NAME}" \
  --address-prefixes "10.0.1.0/24" \
  --service-endpoints "Microsoft.Storage"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Storage Subnet${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage Subnet created successfully${RESET}"

# Create Key Vault Subnet
echo -e "\n${BLUE}Creating Key Vault Subnet...${RESET}"
az network vnet subnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --vnet-name "${VNET_NAME}" \
  --name "${SUBNET_KEYVAULT_NAME}" \
  --address-prefixes "10.0.2.0/24" \
  --service-endpoints "Microsoft.KeyVault"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Key Vault Subnet${RESET}"
  exit 1
fi
echo -e "${GREEN}Key Vault Subnet created successfully${RESET}"

# Create Databricks Public Subnet
echo -e "\n${BLUE}Creating Databricks Public Subnet...${RESET}"
az network vnet subnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --vnet-name "${VNET_NAME}" \
  --name "${SUBNET_DATABRICKS_PUBLIC_NAME}" \
  --address-prefixes "10.0.3.0/24" \
  --service-endpoints "Microsoft.Storage" \
  --delegations "Microsoft.Databricks/workspaces"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Databricks Public Subnet${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks Public Subnet created successfully${RESET}"

# Create Databricks Private Subnet
echo -e "\n${BLUE}Creating Databricks Private Subnet...${RESET}"
az network vnet subnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --vnet-name "${VNET_NAME}" \
  --name "${SUBNET_DATABRICKS_PRIVATE_NAME}" \
  --address-prefixes "10.0.4.0/24" \
  --service-endpoints "Microsoft.Storage" \
  --delegations "Microsoft.Databricks/workspaces"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Databricks Private Subnet${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks Private Subnet created successfully${RESET}"

# Create Storage Account Private Endpoint
echo -e "\n${BLUE}Creating Storage Account Private Endpoint...${RESET}"
STORAGE_ID=$(az storage account show \
  --name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query id -o tsv)

# Create private endpoint for blob service
az network private-endpoint create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT_NAME}-blob-pe" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_STORAGE_NAME}" \
  --private-connection-resource-id "${STORAGE_ID}" \
  --group-id "blob" \
  --connection-name "${STORAGE_ACCOUNT_NAME}-blob-connection" \
  --location "${REGION}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Storage Account Private Endpoint for blob${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage Account Private Endpoint for blob created successfully${RESET}"

# Create private endpoint for dfs service (for Databricks)
az network private-endpoint create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT_NAME}-dfs-pe" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_STORAGE_NAME}" \
  --private-connection-resource-id "${STORAGE_ID}" \
  --group-id "dfs" \
  --connection-name "${STORAGE_ACCOUNT_NAME}-dfs-connection" \
  --location "${REGION}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Storage Account Private Endpoint for dfs${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage Account Private Endpoint for dfs created successfully${RESET}"

# Create Key Vault Private Endpoint
echo -e "\n${BLUE}Creating Key Vault Private Endpoint...${RESET}"
KEYVAULT_ID=$(az keyvault show \
  --name "${KEYVAULT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query id -o tsv)

az network private-endpoint create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${KEYVAULT_NAME}-pe" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_KEYVAULT_NAME}" \
  --private-connection-resource-id "${KEYVAULT_ID}" \
  --group-id "vault" \
  --connection-name "${KEYVAULT_NAME}-connection" \
  --location "${REGION}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Key Vault Private Endpoint${RESET}"
  exit 1
fi
echo -e "${GREEN}Key Vault Private Endpoint created successfully${RESET}"

# Update Databricks workspace to use VNET injection
echo -e "\n${BLUE}Updating Databricks workspace for VNET injection...${RESET}"
# Note: This is a destructive operation that will fail if the workspace is in use
echo -e "${YELLOW}WARNING: This operation will restart the Databricks workspace and may cause running jobs to fail.${RESET}"
echo -e "${YELLOW}Do you want to continue? (y/n)${RESET}"
read -p "" confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
  # Get public & private subnet IDs
  PUBLIC_SUBNET_ID=$(az network vnet subnet show \
    --resource-group "${RESOURCE_GROUP}" \
    --vnet-name "${VNET_NAME}" \
    --name "${SUBNET_DATABRICKS_PUBLIC_NAME}" \
    --query id -o tsv)
  
  PRIVATE_SUBNET_ID=$(az network vnet subnet show \
    --resource-group "${RESOURCE_GROUP}" \
    --vnet-name "${VNET_NAME}" \
    --name "${SUBNET_DATABRICKS_PRIVATE_NAME}" \
    --query id -o tsv)
  
  # Update Databricks workspace
  az databricks workspace update \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${DATABRICKS_WORKSPACE_NAME}" \
    --custom-virtual-network-id $(az network vnet show --resource-group "${RESOURCE_GROUP}" --name "${VNET_NAME}" --query id -o tsv) \
    --custom-public-subnet-name "${SUBNET_DATABRICKS_PUBLIC_NAME}" \
    --custom-private-subnet-name "${SUBNET_DATABRICKS_PRIVATE_NAME}"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update Databricks workspace for VNET injection${RESET}"
    echo -e "${YELLOW}This may require manual configuration or recreation of the workspace${RESET}"
  else
    echo -e "${GREEN}Databricks workspace updated for VNET injection successfully${RESET}"
  fi
else
  echo -e "${YELLOW}Skipping Databricks VNET integration${RESET}"
fi

# Update Azure Storage network rules
echo -e "\n${BLUE}Updating Azure Storage network rules...${RESET}"
az storage account update \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT_NAME}" \
  --default-action Deny \
  --bypass AzureServices

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to update Azure Storage network rules${RESET}"
  exit 1
fi

# Add VNET rule for storage account
az storage account network-rule add \
  --resource-group "${RESOURCE_GROUP}" \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_STORAGE_NAME}"

az storage account network-rule add \
  --resource-group "${RESOURCE_GROUP}" \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_DATABRICKS_PUBLIC_NAME}"

az storage account network-rule add \
  --resource-group "${RESOURCE_GROUP}" \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_DATABRICKS_PRIVATE_NAME}"

echo -e "${GREEN}Azure Storage network rules updated successfully${RESET}"

# Update Key Vault network rules
echo -e "\n${BLUE}Updating Key Vault network rules...${RESET}"
az keyvault update \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${KEYVAULT_NAME}" \
  --default-action Deny \
  --bypass AzureServices

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to update Key Vault network rules${RESET}"
  exit 1
fi

# Add VNET rule for Key Vault
az keyvault network-rule add \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${KEYVAULT_NAME}" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_KEYVAULT_NAME}"

echo -e "${GREEN}Key Vault network rules updated successfully${RESET}"

# Configure Key Vault for automatic secret rotation
echo -e "\n${BLUE}Configuring Key Vault for automatic secret rotation...${RESET}"
# Create a scheduled task to rotate API keys every 90 days
cat > rotate_secrets.sh << 'EOF'
#!/bin/bash
# Script to rotate API keys

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"

# Generate new keys
generate_new_key() {
  # Generate a new random key
  NEW_KEY=$(openssl rand -base64 32)
  echo "${NEW_KEY}"
}

# Rotate a key in Key Vault
rotate_key() {
  local secret_name=$1
  local new_value=$2
  
  # Get current key
  CURRENT_KEY=$(az keyvault secret show --vault-name "${KEYVAULT_NAME}" --name "${secret_name}" --query "value" -o tsv)
  
  # Store the current key as a backup
  az keyvault secret set --vault-name "${KEYVAULT_NAME}" --name "${secret_name}-previous" --value "${CURRENT_KEY}"
  
  # Set the new key
  az keyvault secret set --vault-name "${KEYVAULT_NAME}" --name "${secret_name}" --value "${new_value}"
  
  echo "Rotated key: ${secret_name}"
}

# Rotate the Claude API key
NEW_CLAUDE_KEY=$(generate_new_key)
rotate_key "CLAUDE-API-KEY" "${NEW_CLAUDE_KEY}"

# Rotate the OpenAI API key
NEW_OPENAI_KEY=$(generate_new_key)
rotate_key "OPENAI-API-KEY" "${NEW_OPENAI_KEY}"

# Databricks token requires manual rotation due to Databricks API requirements
echo "Reminder: Databricks token requires manual rotation"

# Note: In a production environment, you would update the application configurations to use the new keys
# This might involve restarting services or updating application settings
echo "Key rotation complete. Application configurations may need to be updated."
EOF

chmod +x rotate_secrets.sh

echo -e "${YELLOW}Created secret rotation script: rotate_secrets.sh${RESET}"
echo -e "${YELLOW}This script should be scheduled to run every 90 days using a scheduler (e.g., Azure Automation, cron)${RESET}"

# Create Azure Automation Account for key rotation
echo -e "\n${BLUE}Creating Azure Automation Account for key rotation...${RESET}"
AUTOMATION_ACCOUNT_NAME="juicer-key-rotation"

az automation account create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${AUTOMATION_ACCOUNT_NAME}" \
  --location "${REGION}" \
  --sku "Basic"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Azure Automation Account${RESET}"
  exit 1
fi
echo -e "${GREEN}Azure Automation Account created successfully${RESET}"

# Upload key rotation script as a runbook
echo -e "\n${BLUE}Creating runbook for key rotation...${RESET}"
az automation runbook create \
  --resource-group "${RESOURCE_GROUP}" \
  --automation-account-name "${AUTOMATION_ACCOUNT_NAME}" \
  --name "RotateJuicerAPIKeys" \
  --type "PowerShell" \
  --location "${REGION}"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create runbook${RESET}"
  exit 1
fi

# Create a PowerShell version of the key rotation script
cat > rotate_secrets.ps1 << 'EOF'
# PowerShell script to rotate API keys

# Configuration
$ResourceGroup = "RG-TBWA-ProjectScout-Juicer"
$KeyVaultName = "kv-tbwa-juicer-insights2"

# Generate a new random key
function Generate-NewKey {
    $bytes = New-Object Byte[] 32
    $rand = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rand.GetBytes($bytes)
    $newKey = [System.Convert]::ToBase64String($bytes)
    return $newKey
}

# Rotate a key in Key Vault
function Rotate-Key {
    param (
        [string]$SecretName,
        [string]$NewValue
    )
    
    # Get current key
    $currentKey = (Get-AzKeyVaultSecret -VaultName $KeyVaultName -Name $SecretName).SecretValueText
    
    # Store the current key as a backup
    $secureBackupValue = ConvertTo-SecureString $currentKey -AsPlainText -Force
    Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name "$SecretName-previous" -SecretValue $secureBackupValue
    
    # Set the new key
    $secureValue = ConvertTo-SecureString $NewValue -AsPlainText -Force
    Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name $SecretName -SecretValue $secureValue
    
    Write-Output "Rotated key: $SecretName"
}

# Connect to Azure
try {
    Connect-AzAccount -Identity
    Write-Output "Connected to Azure using Managed Identity"
} catch {
    Write-Error "Failed to connect to Azure: $_"
    exit 1
}

# Rotate the Claude API key
$newClaudeKey = Generate-NewKey
Rotate-Key -SecretName "CLAUDE-API-KEY" -NewValue $newClaudeKey

# Rotate the OpenAI API key
$newOpenAIKey = Generate-NewKey
Rotate-Key -SecretName "OPENAI-API-KEY" -NewValue $newOpenAIKey

# Databricks token requires manual rotation due to Databricks API requirements
Write-Output "Reminder: Databricks token requires manual rotation"

# Note: In a production environment, you would update the application configurations to use the new keys
# This might involve restarting services or updating application settings
Write-Output "Key rotation complete. Application configurations may need to be updated."
EOF

# Upload runbook content
az automation runbook replace-content \
  --resource-group "${RESOURCE_GROUP}" \
  --automation-account-name "${AUTOMATION_ACCOUNT_NAME}" \
  --name "RotateJuicerAPIKeys" \
  --content @rotate_secrets.ps1

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to upload runbook content${RESET}"
  exit 1
fi

# Publish the runbook
az automation runbook publish \
  --resource-group "${RESOURCE_GROUP}" \
  --automation-account-name "${AUTOMATION_ACCOUNT_NAME}" \
  --name "RotateJuicerAPIKeys"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to publish runbook${RESET}"
  exit 1
fi
echo -e "${GREEN}Runbook published successfully${RESET}"

# Create a schedule for key rotation (every 90 days)
echo -e "\n${BLUE}Creating schedule for key rotation...${RESET}"
az automation schedule create \
  --resource-group "${RESOURCE_GROUP}" \
  --automation-account-name "${AUTOMATION_ACCOUNT_NAME}" \
  --name "RotateKeys90Days" \
  --frequency "Day" \
  --interval 90 \
  --start-time "$(date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ")" \
  --timezone "UTC"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create schedule${RESET}"
  exit 1
fi
echo -e "${GREEN}Schedule created successfully${RESET}"

# Link runbook to schedule
az automation job schedule create \
  --resource-group "${RESOURCE_GROUP}" \
  --automation-account-name "${AUTOMATION_ACCOUNT_NAME}" \
  --runbook-name "RotateJuicerAPIKeys" \
  --schedule-name "RotateKeys90Days"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to link runbook to schedule${RESET}"
  exit 1
fi
echo -e "${GREEN}Runbook linked to schedule successfully${RESET}"

# Grant Managed Identity access to Key Vault
echo -e "\n${BLUE}Granting Managed Identity access to Key Vault...${RESET}"
# Get the Managed Identity Object ID
IDENTITY_PRINCIPAL_ID=$(az automation account show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${AUTOMATION_ACCOUNT_NAME}" \
  --query identity.principalId -o tsv)

# Set Key Vault policy for the Managed Identity
az keyvault set-policy \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${KEYVAULT_NAME}" \
  --object-id "${IDENTITY_PRINCIPAL_ID}" \
  --secret-permissions get set list delete backup restore

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to grant Managed Identity access to Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Managed Identity granted access to Key Vault successfully${RESET}"

# Summary
echo -e "\n${BLUE}${BOLD}Security Enhancements Setup Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Virtual Network: ${GREEN}${VNET_NAME}${RESET}"
echo -e "Subnets:"
echo -e "  • ${GREEN}${SUBNET_STORAGE_NAME}${RESET}"
echo -e "  • ${GREEN}${SUBNET_KEYVAULT_NAME}${RESET}"
echo -e "  • ${GREEN}${SUBNET_DATABRICKS_PUBLIC_NAME}${RESET}"
echo -e "  • ${GREEN}${SUBNET_DATABRICKS_PRIVATE_NAME}${RESET}"
echo -e "Private Endpoints:"
echo -e "  • ${GREEN}${STORAGE_ACCOUNT_NAME}-blob-pe${RESET}"
echo -e "  • ${GREEN}${STORAGE_ACCOUNT_NAME}-dfs-pe${RESET}"
echo -e "  • ${GREEN}${KEYVAULT_NAME}-pe${RESET}"
echo -e "Network Rules:"
echo -e "  • ${GREEN}Storage Account: Default Deny with VNet exceptions${RESET}"
echo -e "  • ${GREEN}Key Vault: Default Deny with VNet exceptions${RESET}"
echo -e "Key Rotation:"
echo -e "  • ${GREEN}Automation Account: ${AUTOMATION_ACCOUNT_NAME}${RESET}"
echo -e "  • ${GREEN}Runbook: RotateJuicerAPIKeys${RESET}"
echo -e "  • ${GREEN}Schedule: Every 90 days${RESET}"

echo -e "\n${GREEN}Security enhancements setup complete!${RESET}"
echo -e "${YELLOW}Note: Some Azure services may take time to fully apply network rules.${RESET}"
echo -e "${YELLOW}Manual configuration may be required for Databricks VNET integration if it failed.${RESET}"