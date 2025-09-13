#!/bin/bash
# Simplified script to deploy dashboard files to Azure Static Web App

# Set variables
RESOURCE_GROUP="ProjectScout-ResourceGroup"
STORAGE_ACCOUNT="pscoutdash$(date +%m%d)" # Short name to avoid length limits
LOCATION="eastus"
LOCAL_FOLDER="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/SKR/archives/project_scout/2025-05/juicer_genai_20250512_165150/dashboards"

echo "Starting simplified deployment..."
echo "Using resource group: $RESOURCE_GROUP"
echo "Storage account name: $STORAGE_ACCOUNT"

# Login to Azure if needed
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Please login to Azure:"
  az login
fi

# Create resource group if it doesn't exist
if ! az group show -n $RESOURCE_GROUP > /dev/null 2>&1; then
  echo "Creating resource group $RESOURCE_GROUP..."
  az group create --name $RESOURCE_GROUP --location $LOCATION
fi

# Create storage account
echo "Creating storage account $STORAGE_ACCOUNT..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Enable static website hosting
echo "Enabling static website hosting..."
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --index-document index.html \
  --404-document index.html

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "[0].value" \
  -o tsv)

# Upload index.html
echo "Creating index.html..."
INDEX_FILE=$(mktemp)
cat > $INDEX_FILE << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Project Scout Dashboard</title>
  <meta http-equiv="refresh" content="0;URL='project_scout_dashboard.html'" />
</head>
<body>
  <p>Redirecting to <a href="project_scout_dashboard.html">dashboard</a>...</p>
</body>
</html>
EOF

az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --container-name '$web' \
  --file $INDEX_FILE \
  --name "index.html"

# Upload project_scout_dashboard.html
DASHBOARD_FILE="$LOCAL_FOLDER/project_scout_dashboard.html"
echo "Uploading dashboard file $DASHBOARD_FILE..."
az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --container-name '$web' \
  --file $DASHBOARD_FILE \
  --name "project_scout_dashboard.html"

# Get website URL
URL=$(az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv)

echo ""
echo "Deployment completed!"
echo "Your dashboard is available at:"
echo $URL
echo "${URL}project_scout_dashboard.html"