#!/bin/bash
# deploy_static_dashboards.sh
#
# Deploys the QA and Retail Edge dashboards to Azure Static Web Apps

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="../dashboards"
TEMP_BUILD_DIR="/tmp/static-dashboards-build-$(date +%s)"
DEPLOY_DIR="/tmp/static-dashboards-deploy-$(date +%s)"
PUBLIC_DIR="$DEPLOY_DIR/public"
RESOURCE_GROUP="RG-TBWA-RetailAdvisor"
STATIC_WEB_APP_NAME="tbwa-project-scout-dashboards"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"
DEPLOYMENT_TAG="unified-scout-dashboards"
ENVIRONMENT="production"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --version)
      VERSION_TAG="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${RESET}"
      exit 1
      ;;
  esac
done

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║   Deploy Static Dashboards (QA & Retail Edge)              ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${RESET}"
  echo "Please install the Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Step 1: Check Azure CLI login
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

# Step 2: Create temporary working directory
echo -e "\n${BLUE}Creating temporary working directory...${RESET}"
mkdir -p "$TEMP_BUILD_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create temporary directory${RESET}"
  exit 1
fi
echo -e "${GREEN}Created temporary directory: $TEMP_BUILD_DIR${RESET}"

# Step 3: Create deployment directory structure
echo -e "\n${BLUE}Creating deployment directory structure...${RESET}"
mkdir -p "$PUBLIC_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment directory structure${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# Step 4: Copy source files to the deployment directory
echo -e "\n${BLUE}Copying source files to the deployment directory...${RESET}"
cp -r "$SOURCE_DIR"/* "$PUBLIC_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy source files to the deployment directory${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# Remove Retail Advisor from the static deployment (it's deployed separately)
echo -e "\n${BLUE}Removing Retail Advisor from the static deployment...${RESET}"
rm -rf "$PUBLIC_DIR/retail_advisor"
echo -e "${GREEN}Removed Retail Advisor from the static deployment${RESET}"

# Step 5: Create a redirect from index.html to qa.html
echo -e "\n${BLUE}Creating redirect from index.html to qa.html...${RESET}"
cat > "$PUBLIC_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=qa.html">
    <title>Redirecting to System Architecture & QA Dashboard</title>
</head>
<body>
    <p>Redirecting to <a href="qa.html">System Architecture & QA Dashboard</a>...</p>
    <script>
        window.location.href = "qa.html";
    </script>
</body>
</html>
EOF
echo -e "${GREEN}Created redirect from index.html to qa.html${RESET}"

# Step 6: Create a minimal staticwebapp.config.json
echo -e "\n${BLUE}Creating staticwebapp.config.json...${RESET}"
cat > "$PUBLIC_DIR/staticwebapp.config.json" << EOF
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "routes": [
    {
      "route": "/qa.html",
      "allowedRoles": ["authenticated", "internal"]
    },
    {
      "route": "/retail_edge/retail_edge_dashboard.html",
      "allowedRoles": ["authenticated", "internal"]
    },
    {
      "route": "/",
      "rewrite": "/index.html",
      "statusCode": 200
    }
  ],
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  },
  "responseOverrides": {
    "401": {
      "redirect": "/qa.html",
      "statusCode": 302
    }
  },
  "globalHeaders": {
    "X-Dashboard-Tag": "${DEPLOYMENT_TAG}",
    "X-Environment": "${ENVIRONMENT}",
    "X-Version": "${VERSION_TAG:-latest}"
  }
}
EOF
echo -e "${GREEN}Created staticwebapp.config.json${RESET}"

# Step 7: Create a minimal swa-cli.config.json in the deploy directory
echo -e "\n${BLUE}Creating swa-cli.config.json...${RESET}"
cat > "$DEPLOY_DIR/swa-cli.config.json" << EOF
{
  "configurations": {
    "app": {
      "outputLocation": "./public",
      "appLocation": "."
    }
  }
}
EOF
echo -e "${GREEN}Created swa-cli.config.json${RESET}"

# Step 8: Get Static Web App deployment token
echo -e "\n${BLUE}Getting Static Web App deployment token from Key Vault...${RESET}"
DEPLOYMENT_TOKEN=$(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "${KEYVAULT_NAME}" --query "value" -o tsv 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$DEPLOYMENT_TOKEN" ]; then
  echo -e "${YELLOW}Failed to get deployment token from Key Vault${RESET}"
  echo -e "${YELLOW}Checking if Static Web App exists...${RESET}"
  
  az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Static Web App doesn't exist. Creating new Static Web App...${RESET}"
    
    # Create a new Static Web App
    echo -e "${BLUE}Creating Azure Static Web App...${RESET}"
    az staticwebapp create \
      --name "$STATIC_WEB_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --location "eastus2" \
      --sku "Standard"
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to create Azure Static Web App${RESET}"
      rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
      exit 1
    fi
    
    # Get the deployment token
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
      --name "$STATIC_WEB_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "properties.apiKey" -o tsv)
    
    if [ $? -ne 0 ] || [ -z "$DEPLOYMENT_TOKEN" ]; then
      echo -e "${RED}Failed to get deployment token${RESET}"
      rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
      exit 1
    fi
    
    # Store the deployment token in Key Vault
    echo -e "${BLUE}Storing deployment token in Key Vault...${RESET}"
    az keyvault secret set \
      --name "AZURE-STATIC-WEB-APPS-API-TOKEN" \
      --vault-name "${KEYVAULT_NAME}" \
      --value "$DEPLOYMENT_TOKEN"
    
    if [ $? -ne 0 ]; then
      echo -e "${YELLOW}Failed to store deployment token in Key Vault${RESET}"
    fi
  else
    # Get the deployment token directly from the Static Web App
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
      --name "$STATIC_WEB_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "properties.apiKey" -o tsv)
    
    if [ $? -ne 0 ] || [ -z "$DEPLOYMENT_TOKEN" ]; then
      echo -e "${RED}Failed to get deployment token${RESET}"
      rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
      exit 1
    fi
  fi
fi
echo -e "${GREEN}Retrieved deployment token successfully${RESET}"

# Step 9: Navigate to deployment directory and run SWA deployment
echo -e "\n${BLUE}Deploying to Azure Static Web App...${RESET}"
cd "$DEPLOY_DIR"
echo -e "${YELLOW}Current directory: $(pwd)${RESET}"

# Check for SWA CLI
if ! command -v swa &> /dev/null; then
  echo -e "${YELLOW}Azure Static Web Apps CLI not found. Installing...${RESET}"
  npm install -g @azure/static-web-apps-cli
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Azure Static Web Apps CLI${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

# Deploy using SWA CLI
echo -e "${BLUE}Running SWA deployment...${RESET}"
swa deploy ./public \
  --deployment-token "$DEPLOYMENT_TOKEN" \
  --env "$ENVIRONMENT"

# Check deployment result
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy to Azure Static Web App${RESET}"
  echo -e "${YELLOW}Trying alternative deployment method...${RESET}"
  
  # Alternative deployment method using az staticwebapp
  echo -e "${BLUE}Attempting deployment with az staticwebapp...${RESET}"
  az staticwebapp deploy \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --source "./public" \
    --token "$DEPLOYMENT_TOKEN" \
    --no-build
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Both deployment methods failed${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

echo -e "${GREEN}Deployment completed!${RESET}"

# Step 10: Clean up
echo -e "\n${BLUE}Cleaning up temporary directories...${RESET}"
rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
echo -e "${GREEN}Cleanup complete${RESET}"

# Step 11: Get the Azure Static Web App URL
echo -e "\n${BLUE}Getting Azure Static Web App URL...${RESET}"
STATIC_WEB_APP_URL=$(az staticwebapp show \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Azure Static Web App URL${RESET}"
  exit 1
fi
echo -e "${GREEN}Azure Static Web App URL: https://${STATIC_WEB_APP_URL}${RESET}"
echo -e "${BLUE}Available pages:${RESET}"
echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}${RESET} (Redirects to QA Dashboard)"
echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/qa.html${RESET} (System Architecture & QA Dashboard)"
echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/retail_edge/retail_edge_dashboard.html${RESET} (Retail Edge Dashboard)"

# Step 12: Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: $SOURCE_DIR"
echo -e "Deployment Tag: $DEPLOYMENT_TAG"
echo -e "Environment: $ENVIRONMENT"
echo -e "Static Web App: $STATIC_WEB_APP_NAME"
echo -e "Resource Group: $RESOURCE_GROUP"
echo -e ""
echo -e "${BOLD}${GREEN}Static Dashboards Deployed Successfully! ✅${RESET}"
echo -e "${BOLD}${GREEN}QA & Retail Edge Dashboards are now accessible at: https://${STATIC_WEB_APP_URL} ${RESET}"
echo -e ""
echo -e "${YELLOW}NOTE: These dashboards require authentication for internal use only.${RESET}"
echo -e "${YELLOW}The Retail Advisor dashboard should be deployed separately using deploy_retail_advisor.sh${RESET}"