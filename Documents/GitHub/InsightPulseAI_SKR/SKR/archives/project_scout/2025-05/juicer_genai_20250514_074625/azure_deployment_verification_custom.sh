#!/bin/bash
# azure_deployment_verification_custom.sh - Verify Azure deployment status with TBWA naming conventions
# This script checks that all Azure resources are properly deployed and configured

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration - Edit these variables to match setup_azure_resources_custom.sh
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STORAGE_ACCOUNT_NAME="tbwajuicerstorage"
DATABRICKS_WORKSPACE_NAME="tbwa-juicer-databricks"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Azure Deployment Verification for Juicer GenAI Insights   ║${RESET}"
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

# Initialize results tracking
total_checks=0
passed_checks=0
failed_checks=0
warn_checks=0

# Function to check Azure resource existence
check_resource() {
  local resource_type="$1"
  local resource_name="$2"
  local description="$3"
  local required="$4"  # true/false
  
  ((total_checks++))
  
  echo -e "${BLUE}Checking ${resource_type} ${resource_name}...${RESET}"
  
  # Run the appropriate Azure CLI command based on resource type
  if [ "$resource_type" == "resource-group" ]; then
    az group show --name "${resource_name}" &> /dev/null
  elif [ "$resource_type" == "storage-account" ]; then
    az storage account show --name "${resource_name}" --resource-group "${RESOURCE_GROUP}" &> /dev/null
  elif [ "$resource_type" == "databricks" ]; then
    az databricks workspace show --name "${resource_name}" --resource-group "${RESOURCE_GROUP}" &> /dev/null
  elif [ "$resource_type" == "static-web-app" ]; then
    az staticwebapp show --name "${resource_name}" --resource-group "${RESOURCE_GROUP}" &> /dev/null
  elif [ "$resource_type" == "keyvault" ]; then
    az keyvault show --name "${resource_name}" --resource-group "${RESOURCE_GROUP}" &> /dev/null
  fi
  
  # Check the result
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ${resource_type} ${resource_name} exists${RESET}"
    ((passed_checks++))
    return 0
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ Required ${resource_type} ${resource_name} not found${RESET}"
      ((failed_checks++))
    else
      echo -e "${YELLOW}⚠️ Optional ${resource_type} ${resource_name} not found${RESET}"
      ((warn_checks++))
    fi
    return 1
  fi
}

# Function to check storage container
check_container() {
  local container_name="$1"
  local description="$2"
  local required="$3"  # true/false
  
  ((total_checks++))
  
  echo -e "${BLUE}Checking storage container ${container_name}...${RESET}"
  
  # Get storage account key
  STORAGE_KEY=$(az storage account keys list --account-name "${STORAGE_ACCOUNT_NAME}" --resource-group "${RESOURCE_GROUP}" --query [0].value -o tsv 2>/dev/null)
  
  if [ -z "$STORAGE_KEY" ]; then
    echo -e "${RED}❌ Failed to get storage account key${RESET}"
    ((failed_checks++))
    return 1
  fi
  
  # Check if container exists
  az storage container exists --name "${container_name}" --account-name "${STORAGE_ACCOUNT_NAME}" --account-key "${STORAGE_KEY}" --query exists -o tsv 2>/dev/null | grep -q "true"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container ${container_name} exists${RESET}"
    ((passed_checks++))
    return 0
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ Required container ${container_name} not found${RESET}"
      ((failed_checks++))
    else
      echo -e "${YELLOW}⚠️ Optional container ${container_name} not found${RESET}"
      ((warn_checks++))
    fi
    return 1
  fi
}

# Function to check Key Vault secret
check_secret() {
  local secret_name="$1"
  local description="$2"
  local required="$3"  # true/false
  
  ((total_checks++))
  
  echo -e "${BLUE}Checking Key Vault secret ${secret_name}...${RESET}"
  
  # Check if secret exists (this just checks existence, not value)
  az keyvault secret show --name "${secret_name}" --vault-name "${KEYVAULT_NAME}" --query name -o tsv &> /dev/null
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Secret ${secret_name} exists${RESET}"
    ((passed_checks++))
    return 0
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ Required secret ${secret_name} not found${RESET}"
      ((failed_checks++))
    else
      echo -e "${YELLOW}⚠️ Optional secret ${secret_name} not found${RESET}"
      ((warn_checks++))
    fi
    return 1
  fi
}

# Function to check Static Web App deployment status
check_static_web_app_deployment() {
  local app_name="$1"
  
  ((total_checks++))
  
  echo -e "${BLUE}Checking Static Web App deployment status...${RESET}"
  
  # Check if app has a production environment
  PROD_ENV=$(az staticwebapp environment list --name "${app_name}" --resource-group "${RESOURCE_GROUP}" --query "[?name=='Production']" -o tsv 2>/dev/null)
  
  if [ -n "$PROD_ENV" ]; then
    echo -e "${GREEN}✅ Static Web App ${app_name} has a production environment${RESET}"
    ((passed_checks++))
    return 0
  else
    echo -e "${YELLOW}⚠️ Static Web App ${app_name} does not have a production environment${RESET}"
    ((warn_checks++))
    return 1
  fi
}

# Function to check Databricks workspace items
check_databricks_item() {
  local item_type="$1"  # workspace, cluster, job
  local item_name="$2"
  local description="$3"
  local required="$4"  # true/false
  
  ((total_checks++))
  
  echo -e "${BLUE}Checking Databricks ${item_type} ${item_name}...${RESET}"
  
  # This would require Databricks CLI to be installed and configured
  # For this script, we'll just simulate the check
  
  echo -e "${YELLOW}⚠️ Databricks ${item_type} verification requires manual check${RESET}"
  echo -e "${YELLOW}   Please verify ${item_name} exists in the Databricks workspace${RESET}"
  ((warn_checks++))
  return 0
}

# Check core Azure resources
echo -e "\n${BOLD}Checking core Azure resources...${RESET}"
check_resource "resource-group" "${RESOURCE_GROUP}" "Resource group" "true"
check_resource "storage-account" "${STORAGE_ACCOUNT_NAME}" "Storage account" "true"
check_resource "databricks" "${DATABRICKS_WORKSPACE_NAME}" "Databricks workspace" "true"
check_resource "static-web-app" "${STATIC_WEB_APP_NAME}" "Static Web App" "true"
check_resource "keyvault" "${KEYVAULT_NAME}" "Key Vault" "true"

# Check storage containers
if check_resource "storage-account" "${STORAGE_ACCOUNT_NAME}" "Storage account" "true"; then
  echo -e "\n${BOLD}Checking storage containers...${RESET}"
  check_container "bronze" "Bronze layer data" "true"
  check_container "silver" "Silver layer data" "true"
  check_container "gold" "Gold layer data" "true"
  check_container "platinum" "Platinum layer data" "true"
fi

# Check Key Vault secrets
if check_resource "keyvault" "${KEYVAULT_NAME}" "Key Vault" "true"; then
  echo -e "\n${BOLD}Checking Key Vault secrets...${RESET}"
  check_secret "DATABRICKS-TOKEN" "Databricks API token" "true"
  check_secret "CLAUDE-API-KEY" "Claude API key" "true"
  check_secret "OPENAI-API-KEY" "OpenAI API key" "false"
  check_secret "AZURE-STATIC-WEB-APPS-API-TOKEN" "Static Web App deployment token" "true"
  check_secret "STORAGE-ACCOUNT-KEY" "Storage account key" "true"
fi

# Check Static Web App deployment
if check_resource "static-web-app" "${STATIC_WEB_APP_NAME}" "Static Web App" "true"; then
  echo -e "\n${BOLD}Checking Static Web App deployment...${RESET}"
  check_static_web_app_deployment "${STATIC_WEB_APP_NAME}"
fi

# Check Databricks components (requires manual verification)
if check_resource "databricks" "${DATABRICKS_WORKSPACE_NAME}" "Databricks workspace" "true"; then
  echo -e "\n${BOLD}Checking Databricks components (requires manual verification)...${RESET}"
  check_databricks_item "notebook" "/Shared/InsightPulseAI/Juicer/juicer_gold_insights" "Gold insights notebook" "true"
  check_databricks_item "notebook" "/Shared/InsightPulseAI/Juicer/juicer_setup_insights_tables" "Insights tables setup notebook" "true"
  check_databricks_item "job" "Juicer Daily Insights Generation" "Daily insights job" "true"
  check_databricks_item "job" "Juicer Weekly Insights Summary" "Weekly insights summary job" "false"
  check_databricks_item "cluster" "JuicerProcessing" "Processing cluster" "true"
fi

# Summary
echo -e "\n${BLUE}${BOLD}Deployment Verification Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Total checks: ${total_checks}"
echo -e "${GREEN}Passed: ${passed_checks}${RESET}"
echo -e "${RED}Failed: ${failed_checks}${RESET}"
echo -e "${YELLOW}Warnings/Manual checks: ${warn_checks}${RESET}"

# Overall status
if [ $failed_checks -eq 0 ]; then
  if [ $warn_checks -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✅ Deployment verification complete! All components are deployed.${RESET}"
    echo -e "${GREEN}You can now proceed with running the end-to-end pipeline tests.${RESET}"
    exit 0
  else
    echo -e "\n${YELLOW}${BOLD}⚠️ Deployment mostly complete with some warnings.${RESET}"
    echo -e "${YELLOW}Please address the warnings and manually verify Databricks components.${RESET}"
    exit 0
  fi
else
  echo -e "\n${RED}${BOLD}❌ Deployment verification failed. Some required components are missing.${RESET}"
  echo -e "${RED}Please deploy the missing components before proceeding.${RESET}"
  exit 1
fi