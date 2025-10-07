#!/bin/bash
# deploy_url_structure_to_azure.sh - Deploy Scout Dashboards with URL structure to Azure

# Set variables
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
APP_NAME="tbwa-juicer-insights-dashboard"
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
ZIP_FILE="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dashboards_url_structure.zip"

# Text formatting for output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}=== Deploy Scout Dashboards with Clean URL Structure to Azure ===${RESET}"
echo -e "${YELLOW}App Name:${RESET} $APP_NAME"
echo -e "${YELLOW}Resource Group:${RESET} $RESOURCE_GROUP"
echo -e "${YELLOW}Source Directory:${RESET} $SOURCE_DIR"
echo -e "${YELLOW}Zip File:${RESET} $ZIP_FILE"
echo ""

# Check if the zip file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo -e "${RED}Zip file not found: $ZIP_FILE${RESET}"
    echo -e "${YELLOW}Running the deploy_url_structure.sh script to create it...${RESET}"
    
    # Run the script to create the zip file
    "$SOURCE_DIR/deploy_url_structure.sh"
    
    # Check if the zip file was created
    if [ ! -f "$ZIP_FILE" ]; then
        echo -e "${RED}Failed to create zip file. Exiting.${RESET}"
        exit 1
    fi
    
    echo -e "${GREEN}Zip file created: $ZIP_FILE${RESET}"
fi

# Verify Azure login
echo -e "${BLUE}Verifying Azure CLI login...${RESET}"
ACCOUNT=$(az account show --query name -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure CLI. Logging in...${RESET}"
    az login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to login to Azure CLI. Exiting.${RESET}"
        exit 1
    fi
fi
echo -e "${GREEN}Logged in as: $(az account show --query name -o tsv)${RESET}"

# Verify Static Web App exists
echo -e "${BLUE}Verifying Static Web App exists...${RESET}"
az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Static Web App not found: $APP_NAME${RESET}"
    echo -e "${YELLOW}Please check the app name and resource group are correct.${RESET}"
    exit 1
fi
echo -e "${GREEN}Static Web App verified.${RESET}"

# Retrieve deployment token
echo -e "${BLUE}Retrieving deployment token from Key Vault...${RESET}"
DEPLOYMENT_TOKEN=$(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Could not retrieve deployment token from Key Vault.${RESET}"
    echo -e "${YELLOW}Will attempt to deploy without explicit token.${RESET}"
    DEPLOYMENT_TOKEN=""
fi

# Create a temporary directory for extracted files
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}Extracting zip file to temporary directory: $TEMP_DIR${RESET}"
unzip -q "$ZIP_FILE" -d "$TEMP_DIR"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to extract zip file. Exiting.${RESET}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Deploy to Azure Static Web App
echo -e "${BLUE}Deploying to Azure Static Web App...${RESET}"

if [ -n "$DEPLOYMENT_TOKEN" ]; then
    # Deploy with token
    echo -e "${YELLOW}Deploying with deployment token...${RESET}"
    az staticwebapp deploy \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source "$TEMP_DIR" \
        --token "$DEPLOYMENT_TOKEN" \
        --no-wait \
        --verbose
else
    # Deploy without explicit token
    echo -e "${YELLOW}Deploying without explicit token...${RESET}"
    az staticwebapp deploy \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source "$TEMP_DIR" \
        --no-wait \
        --verbose
fi

DEPLOY_RESULT=$?

# Clean up temporary directory
echo -e "${BLUE}Cleaning up temporary directory...${RESET}"
rm -rf "$TEMP_DIR"

# Check deployment result
if [ $DEPLOY_RESULT -ne 0 ]; then
    echo -e "${RED}Deployment failed.${RESET}"
    echo -e "${YELLOW}Trying alternative deployment method...${RESET}"
    
    # Alternative method: Use SWA CLI with deployment token
    if command -v swa &> /dev/null && [ -n "$DEPLOYMENT_TOKEN" ]; then
        echo -e "${BLUE}Deploying using SWA CLI...${RESET}"
        # Extract zip file again
        TEMP_DIR=$(mktemp -d)
        unzip -q "$ZIP_FILE" -d "$TEMP_DIR"
        
        # Deploy using SWA CLI
        cd "$TEMP_DIR"
        swa deploy \
            --deployment-token "$DEPLOYMENT_TOKEN" \
            --env production
        
        DEPLOY_RESULT=$?
        
        # Clean up
        cd "$SOURCE_DIR"
        rm -rf "$TEMP_DIR"
        
        if [ $DEPLOY_RESULT -ne 0 ]; then
            echo -e "${RED}Alternative deployment method also failed.${RESET}"
            exit 1
        fi
    else
        echo -e "${RED}Alternative deployment method not available.${RESET}"
        exit 1
    fi
fi

echo -e "${GREEN}Deployment initiated successfully!${RESET}"

# Get the app URL
echo -e "${BLUE}Retrieving app URL...${RESET}"
APP_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)

echo -e "${GREEN}Dashboard deployed to:${RESET}"
echo -e "  - ${BOLD}https://$APP_URL/${RESET} (Main landing page)"
echo -e "  - ${BOLD}https://$APP_URL/advisor${RESET} (Scout Advisor)"
echo -e "  - ${BOLD}https://$APP_URL/edge${RESET} (Scout Edge)"
echo -e "  - ${BOLD}https://$APP_URL/ops${RESET} (Scout Ops)"

echo -e "\n${BOLD}${GREEN}Deployment completed!${RESET}"
echo -e "${YELLOW}Note: The deployment is in progress and may take a few minutes to complete.${RESET}"
echo -e "${YELLOW}You can check the deployment status in the Azure Portal.${RESET}"
echo -e "${YELLOW}Timestamp:${RESET} $(date +"%Y-%m-%d %H:%M:%S")"