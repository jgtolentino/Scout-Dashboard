#!/bin/bash
# Setup script for Azure DevOps deployment of Scout Dashboard
# This script helps you set up Azure resources and Azure DevOps pipeline

# Text formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration - modify these variables
RESOURCE_GROUP=${RESOURCE_GROUP:-"RG-TBWA-ProjectScout-Juicer"}
LOCATION=${LOCATION:-"eastus2"}
STATIC_WEBAPP_NAME=${STATIC_WEBAPP_NAME:-"scout-dashboard"}
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-"/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy-advisor-fixed"}

# Check Azure CLI installation
echo -e "${BLUE}Checking if Azure CLI is installed...${NC}"
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI not found. Please install it:${NC}"
    echo -e "${YELLOW}https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Login to Azure
echo -e "${BLUE}Logging in to Azure...${NC}"
az account show &> /dev/null || az login

# Create Resource Group if it doesn't exist
echo -e "${BLUE}Checking if Resource Group exists...${NC}"
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}Resource Group $RESOURCE_GROUP does not exist. Creating it...${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
else
    echo -e "${GREEN}Resource Group $RESOURCE_GROUP already exists.${NC}"
fi

# Create Static Web App
echo -e "${BLUE}Creating Azure Static Web App...${NC}"
if ! az staticwebapp show --name "$STATIC_WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}Creating new Static Web App: $STATIC_WEBAPP_NAME${NC}"
    az staticwebapp create \
        --name "$STATIC_WEBAPP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "Free"
else
    echo -e "${GREEN}Static Web App $STATIC_WEBAPP_NAME already exists.${NC}"
fi

# Get Deployment Token
echo -e "${BLUE}Getting Deployment Token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${RED}Failed to retrieve deployment token.${NC}"
    exit 1
fi

# Display Azure DevOps Setup Instructions
echo -e "\n${GREEN}=== Azure Resources Created Successfully ===${NC}"
echo -e "${GREEN}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${GREEN}Static Web App:${NC} $STATIC_WEBAPP_NAME"
echo -e "${GREEN}URL:${NC} https://$STATIC_WEBAPP_NAME.azurestaticapps.net"
echo -e "${GREEN}Deployment Token:${NC} [SECURED]"

echo -e "\n${YELLOW}=== Azure DevOps Setup Instructions ===${NC}"
echo -e "1. Go to ${BLUE}https://dev.azure.com/${NC} and create/select your organization and project"
echo -e "2. Create a Variable Group:"
echo -e "   - Go to Pipelines > Library > + Variable group"
echo -e "   - Name: ${BLUE}azure-static-webapp-vars${NC}"
echo -e "   - Add variable: ${BLUE}AZURE_STATIC_WEB_APP_TOKEN${NC} = [paste the token below]"
echo -e "   - Add variable: ${BLUE}STATIC_WEB_APP_NAME${NC} = $STATIC_WEBAPP_NAME"
echo -e "   - Check 'Keep this value secret' for the token"
echo -e "3. Create a Pipeline:"
echo -e "   - Go to Pipelines > New Pipeline"
echo -e "   - Select GitHub as source"
echo -e "   - Select your repository"
echo -e "   - Choose 'Existing Azure Pipelines YAML file'"
echo -e "   - Path: /tools/js/azure-pipelines.yml"
echo -e "   - Run the pipeline"

echo -e "\n${GREEN}=== Deployment Token (COPY THIS, IT WON'T BE SHOWN AGAIN) ===${NC}"
echo -e "$DEPLOYMENT_TOKEN"

echo -e "\n${BLUE}=== Manual Deployment Command ===${NC}"
echo -e "az staticwebapp deploy \\"
echo -e "  --source-location \"$DEPLOYMENT_SOURCE\" \\"
echo -e "  --app-name \"$STATIC_WEBAPP_NAME\" \\"
echo -e "  --resource-group \"$RESOURCE_GROUP\" \\"
echo -e "  --deployment-token \"[DEPLOYMENT_TOKEN]\" \\"
echo -e "  --no-build"

echo -e "\n${GREEN}Setup complete! Follow the Azure DevOps Setup Instructions above to complete CI/CD setup.${NC}"