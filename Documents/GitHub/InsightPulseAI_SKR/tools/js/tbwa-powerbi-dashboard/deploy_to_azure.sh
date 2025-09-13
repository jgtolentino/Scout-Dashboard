#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TBWA Power BI Dashboard Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${YELLOW}Warning: Azure CLI (az) is not installed. You'll need it for deployment.${NC}"
    echo -e "${YELLOW}Please install it: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    read -p "Continue with build only? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SKIP_DEPLOYMENT=true
fi

# Check for a build command in package.json
if ! grep -q '"build":' package.json; then
    echo -e "${RED}Error: No build script found in package.json${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies.${NC}"
    exit 1
fi

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Skip deployment if Azure CLI is not installed
if [ "$SKIP_DEPLOYMENT" = true ]; then
    echo -e "${YELLOW}Skipping deployment due to missing Azure CLI.${NC}"
    echo -e "${GREEN}Build output is available in the 'dist' directory.${NC}"
    exit 0
fi

# Check if the user is logged in to Azure
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to login to Azure CLI first.${NC}"
    az login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Azure login failed.${NC}"
        exit 1
    fi
fi

# Prompt for deployment details
echo
echo -e "${BLUE}Deployment Configuration${NC}"
echo -e "${BLUE}------------------------${NC}"

# Get subscription
echo "Available Azure subscriptions:"
az account list --query "[].{Name:name, Id:id}" -o table
read -p "Enter the subscription ID you want to use: " SUBSCRIPTION_ID
az account set --subscription "$SUBSCRIPTION_ID"

# Get or create resource group
echo
echo "Available resource groups:"
az group list --query "[].{Name:name, Location:location}" -o table
read -p "Enter an existing resource group name or create a new one: " RESOURCE_GROUP
RESOURCE_GROUP_EXISTS=$(az group exists --name "$RESOURCE_GROUP")
if [ "$RESOURCE_GROUP_EXISTS" = "false" ]; then
    echo "Available locations:"
    az account list-locations --query "[].{Name:name}" -o table | head -n 10
    read -p "Enter location for new resource group: " LOCATION
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Create Static Web App
echo
read -p "Enter a name for your new Static Web App: " SWA_NAME
read -p "Enter branch name (default: main): " BRANCH_NAME
BRANCH_NAME=${BRANCH_NAME:-main}

echo -e "${YELLOW}Creating Static Web App...${NC}"
az staticwebapp create \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME \
  --location "westus2" \
  --branch "$BRANCH_NAME" \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create Static Web App.${NC}"
    echo -e "${YELLOW}Note: You can also deploy using the Azure Portal with your dist folder.${NC}"
    exit 1
fi

echo -e "${GREEN}Static Web App created successfully!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Your app will be built and deployed automatically by GitHub Actions"
echo -e "2. Check the Actions tab in your GitHub repository for deployment status"
echo -e "3. Once deployed, access your app at: https://$SWA_NAME.azurestaticapps.net"
echo
echo -e "${GREEN}Alternatively, you can manually deploy the dist folder from the Azure Portal.${NC}"
echo -e "${BLUE}https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FStaticSites${NC}"

exit 0