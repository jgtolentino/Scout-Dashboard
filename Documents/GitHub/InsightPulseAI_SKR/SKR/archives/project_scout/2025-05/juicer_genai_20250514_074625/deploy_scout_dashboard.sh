#!/bin/bash
# Script to deploy Scout dashboards to Azure Blob Storage

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARDS_DIR="$BASE_DIR/dashboards/deploy"

# Azure Storage configuration for Project Scout
STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-"pscoutdash0513"}
RESOURCE_GROUP=${RESOURCE_GROUP:-"ProjectScout-ResourceGroup"}
CONTAINER_NAME='$web'

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo -e "${YELLOW}Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if logged in to Azure
echo -e "${BLUE}Checking Azure login status...${NC}"
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure. Please login:${NC}"
    az login
fi

# Deploy dashboard files to Azure Blob Storage
echo -e "${BLUE}Deploying dashboards to Azure Blob Storage...${NC}"

# Upload all files in deploy directory with proper MIME types
for file in "$DASHBOARDS_DIR"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Determine content type
        content_type="text/plain"
        if [[ "$filename" == *.html ]]; then
            content_type="text/html"
        elif [[ "$filename" == *.js ]]; then
            content_type="application/javascript"
        elif [[ "$filename" == *.css ]]; then
            content_type="text/css"
        elif [[ "$filename" == *.json ]]; then
            content_type="application/json"
        elif [[ "$filename" == *.png ]]; then
            content_type="image/png"
        elif [[ "$filename" == *.jpg || "$filename" == *.jpeg ]]; then
            content_type="image/jpeg"
        fi
        
        echo -e "${BLUE}Uploading ${filename} (${content_type})...${NC}"
        
        # Upload file with overwrite flag using key auth mode
        az storage blob upload \
            --account-name "$STORAGE_ACCOUNT" \
            --container-name "$CONTAINER_NAME" \
            --file "$file" \
            --name "$filename" \
            --content-type "$content_type" \
            --auth-mode key \
            --overwrite
            
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Successfully uploaded: $filename${NC}"
        else
            echo -e "${RED}Failed to upload: $filename${NC}"
        fi
    fi
done

# Get the public URL of the storage account
PUBLIC_URL=$(az storage account show -n $STORAGE_ACCOUNT -g $RESOURCE_GROUP --query "primaryEndpoints.web" -o tsv)
PUBLIC_URL=${PUBLIC_URL%/}  # Remove trailing slash

echo -e "\n${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Dashboards are available at: $PUBLIC_URL${NC}"
echo -e "${YELLOW}Note: Make sure to set up the API endpoint at /api/juicer/query for JuicyChat to work.${NC}"
echo -e "${YELLOW}For more information on Project Scout naming conventions, see README_AZURE_NAMING.md${NC}"