#!/bin/bash
# deploy_dashboard.sh - Hardened deployment script for Scout Analytics dashboard
# Safely handles Azure CLI, error checking, and deployment validation

# Exit on any error
set -e

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Environment variables with defaults (can be overridden)
ROOT_DIR="${SCOUT_ROOT_DIR:-$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard}"
SOURCE_DIR="${SOURCE_DIR:-$ROOT_DIR/deployment-v2/public}"
APP_NAME="${AZURE_SWA_NAME:-tbwa-juicer-insights-dashboard}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-RG-TBWA-ProjectScout-Juicer}"
KEY_VAULT="${AZURE_KEY_VAULT:-kv-tbwa-juicer-insights2}"
TOKEN_NAME="${AZURE_TOKEN_NAME:-AZURE-STATIC-WEB-APPS-API-TOKEN}"
DRY_RUN="${DRY_RUN:-false}"

# Function to display usage
usage() {
  echo -e "${BOLD}Usage:${RESET} $0 [OPTIONS]"
  echo -e "${BOLD}Options:${RESET}"
  echo -e "  -a, --app-name NAME      Azure Static Web App name (default: $APP_NAME)"
  echo -e "  -g, --resource-group RG  Azure Resource Group (default: $RESOURCE_GROUP)"
  echo -e "  -s, --source DIR         Source directory (default: $SOURCE_DIR)"
  echo -e "  -d, --dry-run            Show commands without executing"
  echo -e "  -h, --help               Show this help message"
  echo -e "\n${BOLD}Environment Variables:${RESET}"
  echo -e "  SCOUT_ROOT_DIR           Root directory of project"
  echo -e "  AZURE_SWA_NAME           Azure Static Web App name"
  echo -e "  AZURE_RESOURCE_GROUP     Azure Resource Group name"
  echo -e "  AZURE_KEY_VAULT          Azure Key Vault name"
  echo -e "  AZURE_TOKEN_NAME         Azure Token secret name"
  echo -e "  DRY_RUN                  Set to 'true' for dry run mode"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--app-name)
      APP_NAME="$2"
      shift 2
      ;;
    -g|--resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    -s|--source)
      SOURCE_DIR="$2"
      shift 2
      ;;
    -d|--dry-run)
      DRY_RUN="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${RESET}" >&2
      usage
      exit 1
      ;;
  esac
done

# Display header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Scout Analytics with Power BI Style to Azure SWA        ${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Print deployment parameters
echo -e "${BOLD}Deployment Parameters:${RESET}"
echo -e "  App Name:       ${YELLOW}$APP_NAME${RESET}"
echo -e "  Resource Group: ${YELLOW}$RESOURCE_GROUP${RESET}"
echo -e "  Source:         ${YELLOW}$SOURCE_DIR${RESET}"
if [ "$DRY_RUN" = "true" ]; then
  echo -e "  ${YELLOW}⚠️ DRY RUN MODE: Commands will be shown but not executed${RESET}"
fi
echo ""

# Verify source directory
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}ERROR: Source directory does not exist: $SOURCE_DIR${RESET}"
  exit 1
fi

# Check for required files in source directory
echo -e "${BLUE}Verifying required files...${RESET}"
REQUIRED_FILES=("index.html" "insights_dashboard_v2.html" "css/retail_edge_style_patch.css")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$SOURCE_DIR/$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo -e "${RED}ERROR: Missing required files in source directory:${RESET}"
  for file in "${MISSING_FILES[@]}"; do
    echo -e "  - ${YELLOW}$file${RESET}"
  done
  
  echo -e "\n${YELLOW}Please run the package script first:${RESET}"
  echo -e "${GREEN}  ./scripts/package_dashboard.sh${RESET}"
  exit 1
fi

echo -e "${GREEN}✅ Source directory contains all required files${RESET}"

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}ERROR: Azure CLI (az) not found${RESET}"
  echo -e "${YELLOW}Please install the Azure CLI:${RESET}"
  echo -e "${GREEN}  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${RESET}"
  exit 1
fi

# Verify Azure login
echo -e "${BLUE}Verifying Azure login...${RESET}"
if [ "$DRY_RUN" = "false" ]; then
  az account show --query name -o tsv &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged into Azure. Running az login...${RESET}"
    az login
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to login to Azure. Deployment aborted.${RESET}"
      exit 1
    fi
  fi
  ACCOUNT=$(az account show --query name -o tsv)
  echo -e "${GREEN}✅ Logged into Azure as: $ACCOUNT${RESET}"
else
  echo -e "${YELLOW}Dry run mode - skipping Azure login check${RESET}"
fi

# Function to execute or echo a command based on dry run mode
run_cmd() {
  if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN:${RESET} $@"
  else
    eval "$@"
  fi
}

# Verify Static Web App exists
echo -e "${BLUE}Verifying Static Web App exists...${RESET}"
if [ "$DRY_RUN" = "false" ]; then
  az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Static Web App not found: $APP_NAME${RESET}"
    echo -e "${YELLOW}Please check the app name and resource group.${RESET}"
    exit 1
  fi
  echo -e "${GREEN}✅ Static Web App verified${RESET}"
else
  echo -e "${YELLOW}Dry run mode - skipping Static Web App verification${RESET}"
fi

# Get deployment token
echo -e "${BLUE}Retrieving deployment token...${RESET}"
if [ "$DRY_RUN" = "false" ]; then
  DEPLOYMENT_TOKEN=$(az keyvault secret show --name "$TOKEN_NAME" --vault-name "$KEY_VAULT" --query "value" -o tsv 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Could not retrieve deployment token from Key Vault${RESET}"
    echo -e "${YELLOW}Will attempt deployment without explicit token${RESET}"
    DEPLOYMENT_TOKEN=""
  else
    echo -e "${GREEN}✅ Retrieved deployment token from Key Vault${RESET}"
  fi
else
  echo -e "${YELLOW}Dry run mode - skipping token retrieval${RESET}"
  DEPLOYMENT_TOKEN="[REDACTED-DEPLOYMENT-TOKEN]"
fi

# Prepare for deployment
echo -e "${BLUE}Preparing for deployment...${RESET}"
# Create a copy of insights_dashboard_v2.html as insights_dashboard.html
if [ -f "$SOURCE_DIR/insights_dashboard_v2.html" ]; then
  if [ ! -f "$SOURCE_DIR/insights_dashboard.html" ]; then
    echo -e "${YELLOW}Creating insights_dashboard.html from insights_dashboard_v2.html${RESET}"
    run_cmd "cp \"$SOURCE_DIR/insights_dashboard_v2.html\" \"$SOURCE_DIR/insights_dashboard.html\""
  fi
fi

# Deploy to Azure Static Web App
echo -e "\n${BLUE}Deploying to Azure Static Web App...${RESET}"
if [ -n "$DEPLOYMENT_TOKEN" ]; then
  # Deploy with token
  echo -e "${YELLOW}Deploying with deployment token...${RESET}"
  run_cmd "az staticwebapp deploy \\
    --name \"$APP_NAME\" \\
    --resource-group \"$RESOURCE_GROUP\" \\
    --source \"$SOURCE_DIR\" \\
    --token \"$DEPLOYMENT_TOKEN\" \\
    --no-build \\
    --verbose"
else
  # Deploy without explicit token
  echo -e "${YELLOW}Deploying without explicit token...${RESET}"
  run_cmd "az staticwebapp deploy \\
    --name \"$APP_NAME\" \\
    --resource-group \"$RESOURCE_GROUP\" \\
    --source \"$SOURCE_DIR\" \\
    --no-build \\
    --verbose"
fi

# Check deployment result (only if not in dry run mode)
if [ "$DRY_RUN" = "false" ]; then
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Deployment failed${RESET}"
    exit 1
  fi
fi

# Get app URL
if [ "$DRY_RUN" = "false" ]; then
  echo -e "${BLUE}Retrieving app URL...${RESET}"
  APP_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)
  
  echo -e "${GREEN}✅ Dashboard deployed to:${RESET}"
  echo -e "  - ${BOLD}https://$APP_URL/insights_dashboard.html${RESET} (Standard version)"
  echo -e "  - ${BOLD}https://$APP_URL/insights_dashboard_v2.html${RESET} (Power BI styled version)"
else
  echo -e "${YELLOW}Dry run complete - no deployment performed${RESET}"
  echo -e "${YELLOW}When deployed, the dashboard would be available at:${RESET}"
  echo -e "  - ${BOLD}https://$APP_NAME.azurestaticapps.net/insights_dashboard.html${RESET} (Standard version)"
  echo -e "  - ${BOLD}https://$APP_NAME.azurestaticapps.net/insights_dashboard_v2.html${RESET} (Power BI styled version)"
fi

# Final summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "App Name: ${GREEN}$APP_NAME${RESET}"
echo -e "Resource Group: ${GREEN}$RESOURCE_GROUP${RESET}"
echo -e "Source Directory: ${GREEN}$SOURCE_DIR${RESET}"

if [ "$DRY_RUN" = "true" ]; then
  echo -e "\n${YELLOW}⚠️ This was a dry run - No actual deployment performed${RESET}"
  echo -e "${YELLOW}To perform actual deployment, run without --dry-run flag${RESET}"
else
  echo -e "\n${BOLD}${GREEN}✅ Deployment completed successfully!${RESET}"
  echo -e "${YELLOW}Timestamp:${RESET} $(date +"%Y-%m-%d %H:%M:%S")"
fi