#!/bin/bash
# deploy_retail_dashboards.sh
# Deploys both retail dashboards to Azure Blob Storage for static web hosting
# Author: InsightPulseAI Team

# Color constants for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==== Retail Dashboards Deployment Tool ====${NC}"
echo "This script deploys the Retail Edge and Retail Performance dashboards to Azure"

# Check if az CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if the user is logged in to Azure
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You are not logged in to Azure. Initiating login...${NC}"
    az login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to login to Azure. Exiting.${NC}"
        exit 1
    fi
fi

# Configuration - EDIT THESE VALUES
RESOURCE_GROUP="retail-dashboards-rg"
STORAGE_ACCOUNT_EDGE="retailedgedash0513"
STORAGE_ACCOUNT_PERFORMANCE="retailperfdash0513"
LOCATION="eastus"  # Azure region

# Function to create storage account if it doesn't exist
create_storage_account() {
    local STORAGE_ACCOUNT=$1
    local PURPOSE=$2
    
    echo -e "${BLUE}Checking if ${STORAGE_ACCOUNT} storage account exists...${NC}"
    
    # Check if storage account exists
    if az storage account show --name ${STORAGE_ACCOUNT} --resource-group ${RESOURCE_GROUP} &> /dev/null; then
        echo -e "${GREEN}Storage account ${STORAGE_ACCOUNT} already exists.${NC}"
    else
        echo -e "${YELLOW}Creating storage account ${STORAGE_ACCOUNT}...${NC}"
        az storage account create \
            --name ${STORAGE_ACCOUNT} \
            --resource-group ${RESOURCE_GROUP} \
            --location ${LOCATION} \
            --sku Standard_LRS \
            --kind StorageV2 \
            --https-only true \
            --output none
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to create storage account ${STORAGE_ACCOUNT}. Exiting.${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}Storage account ${STORAGE_ACCOUNT} created successfully.${NC}"
    fi
    
    # Enable static website hosting
    echo -e "${BLUE}Enabling static website hosting for ${STORAGE_ACCOUNT}...${NC}"
    az storage blob service-properties update \
        --account-name ${STORAGE_ACCOUNT} \
        --static-website \
        --index-document "${PURPOSE}_dashboard.html" \
        --404-document "404.html" \
        --output none
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to enable static website hosting. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Static website hosting enabled for ${STORAGE_ACCOUNT}.${NC}"
}

# Function to deploy a dashboard to Azure Storage
deploy_dashboard() {
    local STORAGE_ACCOUNT=$1
    local SOURCE_DIR=$2
    local DASHBOARD_TYPE=$3
    
    echo -e "${BLUE}Deploying ${DASHBOARD_TYPE} dashboard to ${STORAGE_ACCOUNT}...${NC}"
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list --account-name ${STORAGE_ACCOUNT} --resource-group ${RESOURCE_GROUP} --query '[0].value' -o tsv)
    
    if [ -z "$STORAGE_KEY" ]; then
        echo -e "${RED}Failed to retrieve storage key. Exiting.${NC}"
        exit 1
    fi
    
    # Upload HTML file
    echo -e "${BLUE}Uploading HTML file...${NC}"
    az storage blob upload \
        --account-name ${STORAGE_ACCOUNT} \
        --account-key ${STORAGE_KEY} \
        --container '$web' \
        --file "${SOURCE_DIR}/${DASHBOARD_TYPE}_dashboard.html" \
        --name "${DASHBOARD_TYPE}_dashboard.html" \
        --content-type "text/html" \
        --output none
    
    # Upload JavaScript file
    echo -e "${BLUE}Uploading JavaScript file...${NC}"
    az storage blob upload \
        --account-name ${STORAGE_ACCOUNT} \
        --account-key ${STORAGE_KEY} \
        --container '$web' \
        --file "${SOURCE_DIR}/${DASHBOARD_TYPE}_visualizer.js" \
        --name "${DASHBOARD_TYPE}_visualizer.js" \
        --content-type "application/javascript" \
        --output none
    
    # Create 404 page if needed
    if [ ! -f "${SOURCE_DIR}/404.html" ]; then
        echo -e "${YELLOW}Creating default 404 page...${NC}"
        echo '<!DOCTYPE html><html><head><title>Page Not Found</title></head><body style="font-family: Arial, sans-serif; text-align: center; padding-top: 100px;"><h1>404 - Page Not Found</h1><p>The page you are looking for might have been removed or is temporarily unavailable.</p></body></html>' > /tmp/404.html
        
        az storage blob upload \
            --account-name ${STORAGE_ACCOUNT} \
            --account-key ${STORAGE_KEY} \
            --container '$web' \
            --file "/tmp/404.html" \
            --name "404.html" \
            --content-type "text/html" \
            --output none
    fi
    
    # Get website URL
    WEBSITE_URL=$(az storage account show -n ${STORAGE_ACCOUNT} -g ${RESOURCE_GROUP} --query "primaryEndpoints.web" -o tsv | sed 's/\/$//')
    
    echo -e "${GREEN}${DASHBOARD_TYPE} dashboard deployed successfully!${NC}"
    echo -e "${GREEN}Access your dashboard at: ${WEBSITE_URL}/${DASHBOARD_TYPE}_dashboard.html${NC}"
    
    # Verify deployment by checking if files exist
    echo -e "${BLUE}Verifying deployment...${NC}"
    if az storage blob show --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY} --container-name '$web' --name "${DASHBOARD_TYPE}_dashboard.html" &> /dev/null; then
        echo -e "${GREEN}HTML file verified on storage.${NC}"
    else
        echo -e "${RED}WARNING: HTML file not found on storage. Deployment may have failed.${NC}"
    fi
    
    if az storage blob show --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY} --container-name '$web' --name "${DASHBOARD_TYPE}_visualizer.js" &> /dev/null; then
        echo -e "${GREEN}JavaScript file verified on storage.${NC}"
    else
        echo -e "${RED}WARNING: JavaScript file not found on storage. Deployment may have failed.${NC}"
    fi
}

# Main script execution

# First check if resource group exists, create if it doesn't
echo -e "${BLUE}Checking if resource group exists...${NC}"
if az group show --name ${RESOURCE_GROUP} &> /dev/null; then
    echo -e "${GREEN}Resource group ${RESOURCE_GROUP} exists.${NC}"
else
    echo -e "${YELLOW}Creating resource group ${RESOURCE_GROUP}...${NC}"
    az group create --name ${RESOURCE_GROUP} --location ${LOCATION} --output none
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create resource group. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Resource group ${RESOURCE_GROUP} created successfully.${NC}"
fi

# Set paths to source directories
EDGE_SOURCE_DIR="$(pwd)/../dashboards/retail_edge"
PERFORMANCE_SOURCE_DIR="$(pwd)/../dashboards/retail_performance"

# Check if source directories exist
if [ ! -d "$EDGE_SOURCE_DIR" ]; then
    echo -e "${RED}Error: Retail Edge dashboard source directory not found at ${EDGE_SOURCE_DIR}${NC}"
    exit 1
fi

if [ ! -d "$PERFORMANCE_SOURCE_DIR" ]; then
    echo -e "${RED}Error: Retail Performance dashboard source directory not found at ${PERFORMANCE_SOURCE_DIR}${NC}"
    exit 1
fi

# Deploy Retail Edge Dashboard
create_storage_account ${STORAGE_ACCOUNT_EDGE} "retail_edge"
deploy_dashboard ${STORAGE_ACCOUNT_EDGE} ${EDGE_SOURCE_DIR} "retail_edge"

# Deploy Retail Performance Dashboard
create_storage_account ${STORAGE_ACCOUNT_PERFORMANCE} "retail_performance"
deploy_dashboard ${STORAGE_ACCOUNT_PERFORMANCE} ${PERFORMANCE_SOURCE_DIR} "retail_performance"

echo -e "${GREEN}=== Deployment Summary ===${NC}"
EDGE_URL=$(az storage account show -n ${STORAGE_ACCOUNT_EDGE} -g ${RESOURCE_GROUP} --query "primaryEndpoints.web" -o tsv | sed 's/\/$//')
PERFORMANCE_URL=$(az storage account show -n ${STORAGE_ACCOUNT_PERFORMANCE} -g ${RESOURCE_GROUP} --query "primaryEndpoints.web" -o tsv | sed 's/\/$//')

echo -e "${BLUE}Retail Edge Dashboard:${NC} ${EDGE_URL}/retail_edge_dashboard.html"
echo -e "${BLUE}Retail Performance Dashboard:${NC} ${PERFORMANCE_URL}/retail_performance_dashboard.html"
echo -e "${GREEN}Deployment complete!${NC}"