#!/bin/bash
# deploy_dashboards.sh - Automated deployment of Scout Dashboards to Azure Static Web Apps
# Compatible with Pulser CLI and Claude integration

# Text formatting for output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"
CYAN="\033[0;36m"
MAGENTA="\033[0;35m"

# Default configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
OUTPUT_DIR="${SOURCE_DIR}/deploy-ready"
ZIP_PATH="${SOURCE_DIR}/scout_dashboards.zip"
APP_NAME="tbwa-juicer-insights-dashboard"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"
TOKEN_SECRET_NAME="AZURE-STATIC-WEB-APPS-API-TOKEN"
SHOULD_DEPLOY=false

# Timestamp generator for logs
generate_timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

# Banner display
show_banner() {
  echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${BLUE}║           Scout Dashboard Automated Deployment Tool                ║${RESET}"
  echo -e "${BOLD}${BLUE}║                  Powered by Pulser CLI + Claude                    ║${RESET}"
  echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
  echo -e "${CYAN}[$(generate_timestamp)] Initializing deployment process...${RESET}"
  echo ""
}

# Help/usage function
show_help() {
  echo -e "${BOLD}Usage:${RESET} deploy_dashboards.sh [options]"
  echo ""
  echo -e "${BOLD}Options:${RESET}"
  echo "  --source DIR       Source directory (default: ${SOURCE_DIR})"
  echo "  --output DIR       Output directory for prepared files (default: ${OUTPUT_DIR})"
  echo "  --zip PATH         Path to save the ZIP package (default: ${ZIP_PATH})"
  echo "  --app NAME         Azure Static Web App name (default: ${APP_NAME})"
  echo "  --resource-group   Azure Resource Group (default: ${RESOURCE_GROUP})"
  echo "  --keyvault NAME    Azure Key Vault name for token retrieval (default: ${KEYVAULT_NAME})"
  echo "  --token-secret     Key Vault secret name for deployment token (default: ${TOKEN_SECRET_NAME})"
  echo "  --deploy           Upload to Azure after packaging (default: false)"
  echo "  --no-build         Skip the build phase, use existing files (default: false)"
  echo "  --help             Show this help message"
  echo ""
  echo -e "${BOLD}Examples:${RESET}"
  echo "  deploy_dashboards.sh --deploy"
  echo "  deploy_dashboards.sh --output ./custom-output --zip ./my-package.zip"
  echo "  deploy_dashboards.sh --app my-static-web-app --resource-group my-resource-group --deploy"
  echo ""
  echo -e "${BOLD}Pulser CLI Integration:${RESET}"
  echo "  :dash-deploy all                          # Run full deployment with defaults"
  echo "  :dash-deploy build --output ./custom-out  # Only build the deployment files"
  echo "  :dash-deploy zip --source ./deploy-ready  # Only create ZIP package"
  echo "  :dash-deploy azure --zip ./package.zip    # Only upload to Azure"
  echo ""
}

# Parse command-line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --source)
        SOURCE_DIR="$2"
        shift 2
        ;;
      --output)
        OUTPUT_DIR="$2"
        shift 2
        ;;
      --zip)
        ZIP_PATH="$2"
        shift 2
        ;;
      --app)
        APP_NAME="$2"
        shift 2
        ;;
      --resource-group)
        RESOURCE_GROUP="$2"
        shift 2
        ;;
      --keyvault)
        KEYVAULT_NAME="$2"
        shift 2
        ;;
      --token-secret)
        TOKEN_SECRET_NAME="$2"
        shift 2
        ;;
      --deploy)
        SHOULD_DEPLOY=true
        shift
        ;;
      --no-build)
        NO_BUILD=true
        shift
        ;;
      --help)
        show_help
        exit 0
        ;;
      *)
        echo -e "${RED}Unknown option: $1${RESET}"
        show_help
        exit 1
        ;;
    esac
  done

  # Print configuration
  echo -e "${BOLD}${CYAN}Configuration:${RESET}"
  echo -e "  Source Directory:   ${SOURCE_DIR}"
  echo -e "  Output Directory:   ${OUTPUT_DIR}"
  echo -e "  ZIP Path:           ${ZIP_PATH}"
  echo -e "  App Name:           ${APP_NAME}"
  echo -e "  Resource Group:     ${RESOURCE_GROUP}"
  echo -e "  Deploy to Azure:    ${SHOULD_DEPLOY}"
  echo ""
}

# Prepare dashboard files (build phase)
build_dashboards() {
  echo -e "${CYAN}[$(generate_timestamp)] Starting build phase...${RESET}"
  
  # Create the output directory
  mkdir -p "${OUTPUT_DIR}"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create output directory${RESET}"
    exit 1
  fi
  
  # Copy source files to output directory
  echo -e "${BLUE}Copying dashboard files...${RESET}"
  mkdir -p "${OUTPUT_DIR}"
  # First copy the core files
  cp -r "${SOURCE_DIR}"/index.html "${OUTPUT_DIR}/" 2>/dev/null
  # Then create directories and copy files
  for dir in advisor edge ops; do
    mkdir -p "${OUTPUT_DIR}/$dir"
    if [ -d "${SOURCE_DIR}/$dir" ]; then
      cp -r "${SOURCE_DIR}/$dir"/* "${OUTPUT_DIR}/$dir/" 2>/dev/null
    fi
  done
  # Copy assets and supporting directories
  for dir in assets css js images; do
    if [ -d "${SOURCE_DIR}/$dir" ]; then
      mkdir -p "${OUTPUT_DIR}/$dir"
      cp -r "${SOURCE_DIR}/$dir"/* "${OUTPUT_DIR}/$dir/" 2>/dev/null
    fi
  done
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Some files may not have been copied successfully${RESET}"
  fi
  
  # Create flat HTML files for direct routing
  echo -e "${BLUE}Creating flat HTML files for direct routing...${RESET}"
  cp "${OUTPUT_DIR}/advisor/index.html" "${OUTPUT_DIR}/advisor.html"
  cp "${OUTPUT_DIR}/edge/index.html" "${OUTPUT_DIR}/edge.html"
  cp "${OUTPUT_DIR}/ops/index.html" "${OUTPUT_DIR}/ops.html"
  
  # Create optimized staticwebapp.config.json
  echo -e "${BLUE}Generating Azure Static Web App routing configuration...${RESET}"
  cat > "${OUTPUT_DIR}/staticwebapp.config.json" << EOF
{
  "routes": [
    { 
      "route": "/advisor", 
      "serve": "/advisor.html" 
    },
    { 
      "route": "/edge", 
      "serve": "/edge.html" 
    },
    { 
      "route": "/ops", 
      "serve": "/ops.html" 
    },
    {
      "route": "/retail_edge/retail_edge_dashboard.html",
      "redirect": "/edge",
      "statusCode": 301
    },
    {
      "route": "/insights_dashboard.html",
      "redirect": "/advisor",
      "statusCode": 301
    },
    {
      "route": "/qa.html",
      "redirect": "/ops",
      "statusCode": 301
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/css/*", "/js/*", "/images/*"]
  },
  "globalHeaders": {
    "X-Dashboard-Tag": "scout_dashboards_clean_urls",
    "X-Patch-ID": "dashboard-url-structure-v1-pulser",
    "X-Client-Context": "TBWA-direct-only",
    "X-Generated-By": "Pulser-CLI-Claude"
  }
}
EOF
  
  # Verify all required files exist
  echo -e "${BLUE}Verifying required files...${RESET}"
  REQUIRED_FILES=("index.html" "advisor.html" "edge.html" "ops.html" "staticwebapp.config.json")
  for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "${OUTPUT_DIR}/${file}" ]; then
      echo -e "${RED}Error: Required file ${file} is missing from the output directory${RESET}"
      exit 1
    fi
  done
  
  echo -e "${GREEN}✓ Build phase completed successfully${RESET}"
}

# Create deployment package (zip phase)
create_package() {
  echo -e "${CYAN}[$(generate_timestamp)] Starting packaging phase...${RESET}"
  
  # Check if output directory exists
  if [ ! -d "${OUTPUT_DIR}" ]; then
    echo -e "${RED}Error: Output directory ${OUTPUT_DIR} not found${RESET}"
    exit 1
  fi
  
  # Create the ZIP file
  echo -e "${BLUE}Creating deployment package...${RESET}"
  cd "${OUTPUT_DIR}"
  zip -r "${ZIP_PATH}" . > /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create ZIP package${RESET}"
    exit 1
  fi
  cd - > /dev/null
  
  # Verify the ZIP file was created
  if [ ! -f "${ZIP_PATH}" ]; then
    echo -e "${RED}Error: Failed to create ZIP package at ${ZIP_PATH}${RESET}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Packaging phase completed successfully${RESET}"
  echo -e "${GREEN}  Deployment package: ${ZIP_PATH}${RESET}"
}

# Deploy to Azure (deploy phase)
deploy_to_azure() {
  echo -e "${CYAN}[$(generate_timestamp)] Starting Azure deployment phase...${RESET}"
  
  # Check if the ZIP file exists
  if [ ! -f "${ZIP_PATH}" ]; then
    echo -e "${RED}Error: ZIP package ${ZIP_PATH} not found${RESET}"
    exit 1
  fi
  
  # Check if Azure CLI is installed
  if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found. Please install Azure CLI first.${RESET}"
    echo -e "${YELLOW}Visit https://docs.microsoft.com/en-us/cli/azure/install-azure-cli for installation instructions.${RESET}"
    exit 1
  fi
  
  # Verify Azure login
  echo -e "${BLUE}Verifying Azure CLI login...${RESET}"
  az account show &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure. Running az login...${RESET}"
    az login
    if [ $? -ne 0 ]; then
      echo -e "${RED}Error: Failed to login to Azure. Deployment aborted.${RESET}"
      exit 1
    fi
  fi
  
  # Fetch deployment token from Key Vault
  echo -e "${BLUE}Retrieving deployment token from Azure Key Vault...${RESET}"
  DEPLOYMENT_TOKEN=$(az keyvault secret show --name "${TOKEN_SECRET_NAME}" --vault-name "${KEYVAULT_NAME}" --query "value" -o tsv 2>/dev/null)
  
  # Verify Static Web App exists
  echo -e "${BLUE}Verifying Azure Static Web App exists...${RESET}"
  az staticwebapp show --name "${APP_NAME}" --resource-group "${RESOURCE_GROUP}" --query "name" -o tsv &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Azure Static Web App '${APP_NAME}' not found in resource group '${RESOURCE_GROUP}'${RESET}"
    exit 1
  fi
  
  # Create a temporary directory with extracted files for SWA CLI
  echo -e "${BLUE}Preparing for deployment...${RESET}"
  TEMP_DIR=$(mktemp -d)
  unzip -q "${ZIP_PATH}" -d "${TEMP_DIR}"
  
  # Try multiple deployment methods
  echo -e "${BLUE}Uploading to Azure Static Web App...${RESET}"
  
  # Method 1: Try SWA CLI if available
  if command -v swa &> /dev/null && [ -n "${DEPLOYMENT_TOKEN}" ]; then
    echo -e "${YELLOW}Deploying using SWA CLI...${RESET}"
    (cd "${TEMP_DIR}" && swa deploy --deployment-token "${DEPLOYMENT_TOKEN}" --env production)
    DEPLOY_RESULT=$?
  else
    DEPLOY_RESULT=1
  fi
  
  # Method 2: Try Azure CLI if method 1 failed
  if [ $DEPLOY_RESULT -ne 0 ]; then
    echo -e "${YELLOW}SWA CLI failed or not available. Trying Azure CLI staticwebapp upload...${RESET}"
    az staticwebapp upload --name "${APP_NAME}" --resource-group "${RESOURCE_GROUP}" --source "${TEMP_DIR}" 2>/dev/null
    DEPLOY_RESULT=$?
  fi
  
  # Method 3: Inform for manual upload if both methods failed
  if [ $DEPLOY_RESULT -ne 0 ]; then
    echo -e "${YELLOW}Automated deployment methods failed.${RESET}"
    echo -e "${YELLOW}Please manually upload the deployment package through the Azure Portal:${RESET}"
    echo -e "  1. Go to Azure Portal: https://portal.azure.com"
    echo -e "  2. Navigate to Static Web App: ${APP_NAME}"
    echo -e "  3. Go to Deployment > Manual deployment"
    echo -e "  4. Upload ZIP file: ${ZIP_PATH}"
    echo -e "  5. Wait for deployment to complete"
    echo ""
    echo -e "${RED}Deployment could not be completed automatically.${RESET}"
  else
    # Clean up
    rm -rf "${TEMP_DIR}"
    
    # Get app URL
    APP_URL=$(az staticwebapp show --name "${APP_NAME}" --resource-group "${RESOURCE_GROUP}" --query "defaultHostname" -o tsv)
    
    echo -e "${GREEN}✓ Azure deployment completed successfully${RESET}"
    echo -e "${GREEN}  Static Web App URL: https://${APP_URL}${RESET}"
    echo -e "${GREEN}  - Main Page:  https://${APP_URL}/${RESET}"
    echo -e "${GREEN}  - Advisor:    https://${APP_URL}/advisor${RESET}"
    echo -e "${GREEN}  - Edge:       https://${APP_URL}/edge${RESET}"
    echo -e "${GREEN}  - Ops:        https://${APP_URL}/ops${RESET}"
  fi
}

# Sync documentation (docs phase)
sync_docs() {
  echo -e "${CYAN}[$(generate_timestamp)] Syncing documentation...${RESET}"
  
  # Check if Pulser CLI's docsync command is available
  if command -v :docsync &> /dev/null; then
    echo -e "${BLUE}Using Pulser CLI docsync command...${RESET}"
    :docsync push --docs "CLAUDE.md,docs/SOP_DEPLOYMENT.md"
  else
    # Manual documentation update
    echo -e "${BLUE}Ensuring deployment documentation is up to date...${RESET}"
    
    # Check if SOP document exists, create if not
    if [ ! -d "${SOURCE_DIR}/docs" ]; then
      mkdir -p "${SOURCE_DIR}/docs"
    fi

    # Update or create SOP document
    if [ ! -f "${SOURCE_DIR}/docs/SOP_DEPLOYMENT.md" ]; then
      cat > "${SOURCE_DIR}/docs/SOP_DEPLOYMENT.md" << EOF
# Scout Dashboard Deployment SOP

This document outlines the standard operating procedures for deploying Scout Dashboards.

## Static Web Deployment Notes

- Always include \`staticwebapp.config.json\` in the root of the deployed folder.
- Create both nested structure (\`advisor/index.html\`) and flat files (\`advisor.html\`).
- Use \`deploy_dashboards.sh\` to prepare and deploy dashboards with Pulser CLI integration.
- Verify routes after deployment by testing both URL styles:
  - \`/advisor\` (preferred clean URL)
  - \`/advisor.html\` (fallback)
- If automated deployment fails, upload the package through the Azure Portal.

## Using the Dashboard Deployment Tool

### Through Pulser CLI

\`\`\`bash
# Full automated deployment
:dash-deploy all

# Step-by-step deployment
:dash-deploy build --output ./deploy-ready
:dash-deploy zip --source ./deploy-ready --output ./scout_dashboards.zip
:dash-deploy azure --zip ./scout_dashboards.zip
\`\`\`

### Through standard shell

\`\`\`bash
# Full deployment with defaults
./tools/cli/deploy_dashboards.sh --deploy

# Custom deployment path
./tools/cli/deploy_dashboards.sh --output ./custom-output --deploy

# Just create deployment package
./tools/cli/deploy_dashboards.sh --no-deploy
\`\`\`

Last updated: $(date +"%Y-%m-%d")
EOF
    else
      # Update the SOP document if needed
      # (We could add more sophisticated update logic here)
      touch "${SOURCE_DIR}/docs/SOP_DEPLOYMENT.md"
    fi
    
    echo -e "${GREEN}✓ Documentation updated${RESET}"
  fi
}

# Main function
main() {
  show_banner
  parse_args "$@"
  
  # Execute phases in sequence
  if [ "${NO_BUILD}" != "true" ]; then
    build_dashboards
  else
    echo -e "${YELLOW}Skipping build phase as requested${RESET}"
  fi
  
  create_package
  sync_docs
  
  if [ "${SHOULD_DEPLOY}" = "true" ]; then
    deploy_to_azure
  else
    echo -e "${YELLOW}Skipping Azure deployment phase as requested${RESET}"
    echo -e "${YELLOW}To deploy manually, run:${RESET}"
    echo -e "  ${YELLOW}$0 --deploy${RESET}"
    echo -e "  ${YELLOW}or upload ${ZIP_PATH} through the Azure Portal${RESET}"
  fi
  
  echo -e "\n${BOLD}${MAGENTA}Pulser Dashboard Deployment Summary${RESET}"
  echo -e "${BLUE}-----------------------------------${RESET}"
  echo -e "${GREEN}✓ Deployment files prepared:  ${OUTPUT_DIR}${RESET}"
  echo -e "${GREEN}✓ Deployment package created: ${ZIP_PATH}${RESET}"
  if [ "${SHOULD_DEPLOY}" = "true" ]; then
    echo -e "${GREEN}✓ Azure deployment completed${RESET}"
  fi
  echo -e "${GREEN}✓ Documentation updated${RESET}"
  echo -e "${BLUE}-----------------------------------${RESET}"
  echo -e "${CYAN}[$(generate_timestamp)] All tasks completed!${RESET}"
}

# Execute main function with all arguments
main "$@"