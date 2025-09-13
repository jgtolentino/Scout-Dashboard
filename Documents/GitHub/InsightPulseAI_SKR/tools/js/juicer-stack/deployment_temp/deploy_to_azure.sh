#!/bin/bash
# Script to deploy dashboards to Azure

# Set your Azure resource names here (or use environment variables)
RESOURCE_GROUP=${RESOURCE_GROUP:-"RG-TBWA-ProjectScout-Retail"}
STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-"tbwaretailadvisor"}
CONTAINER=${CONTAINER:-"$web"}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI not found. Please install it first."
    exit 1
fi

# Check if logged in to Azure
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Check if resource group exists
az group show --name $RESOURCE_GROUP &> /dev/null
if [ $? -ne 0 ]; then
    echo "Creating resource group $RESOURCE_GROUP..."
    az group create --name $RESOURCE_GROUP --location eastus
fi

# Check if storage account exists
az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &> /dev/null
if [ $? -ne 0 ]; then
    echo "Creating storage account $STORAGE_ACCOUNT..."
    az storage account create \
        --name $STORAGE_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --location eastus \
        --sku Standard_LRS \
        --kind StorageV2 \
        --enable-static-website
fi

# Get storage account key
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query "[0].value" -o tsv)

# Check if container exists
az storage container show --name $CONTAINER --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY &> /dev/null
if [ $? -ne 0 ]; then
    echo "Creating container $CONTAINER..."
    az storage container create --name $CONTAINER --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY --public-access blob
fi

# Upload files to Azure Storage
echo "Uploading dashboard files to Azure Storage..."
az storage blob upload-batch \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --destination $CONTAINER \
    --source ./dashboards \
    --overwrite

# Enable static website hosting
echo "Enabling static website hosting..."
az storage blob service-properties update \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --static-website \
    --index-document index.html \
    --404-document error.html

# Get website URL
WEBSITE_URL=$(az storage account show \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query "primaryEndpoints.web" \
    --output tsv)

echo "================================================"
echo "✅ Deployment complete!"
echo "Website URL: $WEBSITE_URL"
echo "================================================"
