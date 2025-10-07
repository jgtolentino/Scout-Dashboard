#!/bin/bash
# deploy_retail_advisor_to_azure.sh
#
# Deploys the Retail Advisor dashboard from mockify-creator repository to Azure Web App
# This script handles cloning, building, and deploying the dashboard directly from the source repository

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration - MODIFY THESE VARIABLES
REPO_URL="https://github.com/jgtolentino/mockify-creator"
BRANCH="main"
AZURE_RESOURCE_GROUP="RG-TBWA-RetailAdvisor"
AZURE_WEB_APP_NAME="retail-advisor-dashboard"
DEPLOYMENT_SLOT="production" # Use "staging" for a staging slot if needed

# Working directories
TEMP_DIR="/tmp/retail-advisor-deployment-$(date +%s)"
REPO_DIR="$TEMP_DIR/mockify-creator"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║   Retail Advisor Dashboard Deployment to Azure Web App     ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${RESET}"
  echo "Please install the Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check for Git
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: Git is not installed${RESET}"
  echo "Please install Git: https://git-scm.com/downloads"
  exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed${RESET}"
  echo "Please install Node.js: https://nodejs.org/"
  exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm is not installed${RESET}"
  echo "Please install npm (comes with Node.js): https://nodejs.org/"
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
mkdir -p "$TEMP_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create temporary directory${RESET}"
  exit 1
fi
echo -e "${GREEN}Created temporary directory: $TEMP_DIR${RESET}"

# Step 3: Clone the repository
echo -e "\n${BLUE}Cloning repository $REPO_URL...${RESET}"
git clone "$REPO_URL" "$REPO_DIR" --branch "$BRANCH" --single-branch
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to clone repository${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Repository cloned successfully${RESET}"

# Step 4: Navigate to the repository directory
echo -e "\n${BLUE}Navigating to repository directory...${RESET}"
cd "$REPO_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to navigate to repository directory${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Current directory: $(pwd)${RESET}"

# Step 5: Install dependencies
echo -e "\n${BLUE}Installing dependencies...${RESET}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install dependencies${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Dependencies installed successfully${RESET}"

# Step 6: Build the project
echo -e "\n${BLUE}Building the project...${RESET}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to build the project${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Project built successfully${RESET}"

# Step 7: Check if the Azure Web App exists
echo -e "\n${BLUE}Checking if Azure Web App exists...${RESET}"
az webapp show --name "$AZURE_WEB_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Azure Web App doesn't exist. Creating new Web App...${RESET}"
  
  # Create a new Web App
  echo -e "${BLUE}Creating Azure Web App...${RESET}"
  az webapp create \
    --name "$AZURE_WEB_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --plan "AppServicePlan-$AZURE_RESOURCE_GROUP" \
    --runtime "NODE|16-lts"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create Azure Web App${RESET}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  echo -e "${GREEN}Azure Web App created successfully${RESET}"
else
  echo -e "${GREEN}Azure Web App already exists${RESET}"
fi

# Step 8: Configure deployment settings
echo -e "\n${BLUE}Configuring deployment settings...${RESET}"
az webapp config appsettings set \
  --name "$AZURE_WEB_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --settings \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  WEBSITE_NODE_DEFAULT_VERSION=~16 \
  DASHBOARD_NAME="Retail Advisor"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure deployment settings${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Deployment settings configured successfully${RESET}"

# Step 9: Deploy to Azure Web App
echo -e "\n${BLUE}Deploying to Azure Web App...${RESET}"
if [ -d "./build" ]; then
  BUILD_DIR="./build"
elif [ -d "./dist" ]; then
  BUILD_DIR="./dist"
elif [ -d "./.next" ]; then
  BUILD_DIR="./"
else
  echo -e "${YELLOW}No standard build directory found. Deploying the entire project...${RESET}"
  BUILD_DIR="./"
fi

echo -e "${BLUE}Using build directory: $BUILD_DIR${RESET}"

# Ensure the directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}Build directory $BUILD_DIR does not exist${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Create ZIP package for deployment
echo -e "${BLUE}Creating deployment package...${RESET}"
DEPLOY_ZIP="$TEMP_DIR/deploy.zip"
cd "$BUILD_DIR"
zip -r "$DEPLOY_ZIP" .
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment package${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Deployment package created successfully${RESET}"

# Deploy the ZIP package to Azure Web App
echo -e "${BLUE}Deploying package to Azure Web App...${RESET}"
az webapp deployment source config-zip \
  --name "$AZURE_WEB_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --src "$DEPLOY_ZIP" \
  --slot "$DEPLOYMENT_SLOT" 2>/dev/null
if [ $? -ne 0 ]; then
  # Try without the slot parameter
  az webapp deployment source config-zip \
    --name "$AZURE_WEB_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --src "$DEPLOY_ZIP"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy to Azure Web App${RESET}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
fi
echo -e "${GREEN}Deployed to Azure Web App successfully${RESET}"

# Step 10: Get the Azure Web App URL
echo -e "\n${BLUE}Getting Azure Web App URL...${RESET}"
WEB_APP_URL=$(az webapp show \
  --name "$AZURE_WEB_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query "defaultHostName" -o tsv)
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Azure Web App URL${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi
echo -e "${GREEN}Azure Web App URL: https://$WEB_APP_URL${RESET}"

# Step 11: Clean up temporary directory
echo -e "\n${BLUE}Cleaning up temporary directory...${RESET}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}Cleaned up temporary directory${RESET}"

# Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Repository: $REPO_URL"
echo -e "Branch: $BRANCH"
echo -e "Azure Resource Group: $AZURE_RESOURCE_GROUP"
echo -e "Azure Web App: $AZURE_WEB_APP_NAME"
echo -e "Deployment Slot: $DEPLOYMENT_SLOT"
echo -e "Dashboard URL: https://$WEB_APP_URL"
echo -e ""
echo -e "${BOLD}${GREEN}Retail Advisor Dashboard Deployed Successfully! ✅${RESET}"
echo -e "${BOLD}${GREEN}Dashboard is now accessible at: https://$WEB_APP_URL ${RESET}"