#!/bin/bash

# Transaction Trends PoC - Quick Deploy Script
set -e

echo "🚀 Transaction Trends PoC - Azure Static Web Apps Deployment"
echo "=========================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged into Azure
echo -e "${BLUE}Checking Azure login status...${NC}"
if ! az account show &>/dev/null; then
    echo -e "${YELLOW}Not logged into Azure. Please login:${NC}"
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Using subscription: $SUBSCRIPTION${NC}"

# Variables
RESOURCE_GROUP="rg-transaction-trends-poc"
LOCATION="eastus2"
APP_NAME="swa-transaction-trends-poc-$(date +%s)"

# Create resource group if it doesn't exist
echo -e "${BLUE}Creating resource group...${NC}"
if ! az group show -n $RESOURCE_GROUP &>/dev/null; then
    az group create -n $RESOURCE_GROUP -l $LOCATION
    echo -e "${GREEN}✓ Resource group created${NC}"
else
    echo -e "${GREEN}✓ Resource group already exists${NC}"
fi

# Build the frontend
echo -e "${BLUE}Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built${NC}"

# Create Static Web App
echo -e "${BLUE}Creating Azure Static Web App...${NC}"
az staticwebapp create \
    -n $APP_NAME \
    -g $RESOURCE_GROUP \
    -l $LOCATION \
    --sku Free

# Get deployment token
echo -e "${BLUE}Getting deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    -n $APP_NAME \
    -g $RESOURCE_GROUP \
    --query "properties.apiKey" -o tsv)

# Deploy using SWA CLI
echo -e "${BLUE}Deploying to Azure...${NC}"
npx -y @azure/static-web-apps-cli deploy ./dist \
    --api-location ./api \
    --deployment-token $DEPLOYMENT_TOKEN \
    --env production

# Get the app URL
APP_URL=$(az staticwebapp show -n $APP_NAME -g $RESOURCE_GROUP --query "defaultHostname" -o tsv)

echo ""
echo -e "${GREEN}=========================================================="
echo -e "✅ Deployment Complete!"
echo -e "=========================================================="
echo -e "App Name: ${YELLOW}$APP_NAME${NC}"
echo -e "Resource Group: ${YELLOW}$RESOURCE_GROUP${NC}"
echo -e "URL: ${YELLOW}https://$APP_URL${NC}"
echo -e "==========================================================${NC}"
echo ""
echo "To delete this deployment, run:"
echo "az group delete -n $RESOURCE_GROUP --yes"