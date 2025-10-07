#!/bin/bash
# Direct deployment script for dashboard files to Azure Blob Storage
# This script bypasses GitHub Actions and deploys directly to Azure

# Set variables
STORAGE_ACCOUNT="projectscoutstorage$(date +%Y%m%d)"
CONTAINER_NAME='$web'  # This is a special container name for static websites
LOCAL_FOLDER="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/SKR/archives/project_scout/2025-05/juicer_genai_20250512_165150/dashboards"
CDN_PROFILE="project-scout-cdn"
CDN_ENDPOINT="projectscout"
RESOURCE_GROUP="ProjectScout-ResourceGroup"

# Make sure we have a valid storage account name (lowercase, alphanumeric, 3-24 chars)
STORAGE_ACCOUNT=$(echo $STORAGE_ACCOUNT | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
if [ ${#STORAGE_ACCOUNT} -gt 24 ]; then
  STORAGE_ACCOUNT=${STORAGE_ACCOUNT:0:24}
fi

# Verify Azure CLI is installed
if ! command -v az &> /dev/null; then
  echo "❌ Azure CLI is not installed. Please install it first."
  echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Not logged in to Azure. Logging in..."
  az login
  if [ $? -ne 0 ]; then
    echo "❌ Failed to log in to Azure. Exiting."
    exit 1
  fi
fi

# Create resource group if it doesn't exist
echo "Checking if resource group exists..."
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
  echo "Creating resource group $RESOURCE_GROUP..."
  az group create --name $RESOURCE_GROUP --location eastus
fi

# Create storage account if it doesn't exist
echo "Checking if storage account exists..."
if ! az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &> /dev/null; then
  echo "Creating storage account $STORAGE_ACCOUNT..."
  az storage account create \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --location eastus \
    --sku Standard_LRS \
    --kind StorageV2 \
    --https-only true \
    --allow-blob-public-access true

  # Enable static website hosting
  echo "Enabling static website hosting..."
  az storage blob service-properties update \
    --account-name $STORAGE_ACCOUNT \
    --static-website \
    --index-document index.html \
    --404-document index.html
fi

# Get storage account key
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query '[0].value' -o tsv)

# Upload test HTML file first
echo "Creating and uploading test HTML file..."
TEST_HTML="/tmp/test_scout_dashboard.html"
cat > "$TEST_HTML" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Scout Dashboard Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #002b49;
    }
    .accent {
      color: #ff3300;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #002b49;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .timestamp {
      margin-top: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Project <span class="accent">Scout</span> Dashboard</h1>
    <p>This is a test page for the Project Scout Dashboard.</p>
    <p>If you're seeing this page, it means the deployment is working.</p>
    <p>The actual dashboard content should be available soon.</p>
    <a href="project_scout_dashboard.html" class="button">View Dashboard</a>
    <p class="timestamp">Generated: $(date)</p>
  </div>
</body>
</html>
EOF

# Upload test HTML file
az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --container-name $CONTAINER_NAME \
  --file "$TEST_HTML" \
  --name "index.html" \
  --overwrite

# Upload project scout dashboard
echo "Uploading project_scout_dashboard.html..."
DASHBOARD_FILE="$LOCAL_FOLDER/project_scout_dashboard.html"
if [ -f "$DASHBOARD_FILE" ]; then
  az storage blob upload \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --container-name $CONTAINER_NAME \
    --file "$DASHBOARD_FILE" \
    --name "project_scout_dashboard.html" \
    --overwrite

  echo "✅ Dashboard file uploaded successfully"
else
  echo "❌ Dashboard file not found at $DASHBOARD_FILE"
  exit 1
fi

# Upload all other files
echo "Uploading remaining dashboard files..."
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --destination $CONTAINER_NAME \
  --source $LOCAL_FOLDER \
  --overwrite

# Get website URL
WEBSITE_URL=$(az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv)

# Verify content uploaded 
echo "Verifying uploaded content..."
if az storage blob exists \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --container-name $CONTAINER_NAME \
  --name "project_scout_dashboard.html" \
  --query "exists" -o tsv; then
  
  echo "✅ project_scout_dashboard.html successfully uploaded"
else
  echo "❌ project_scout_dashboard.html not found in storage"
  exit 1
fi

# Skipping CDN for now to simplify deployment
CDN_URL=""

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "Your dashboard is available at:"
echo "Storage URL: $WEBSITE_URL"
echo "Project Scout Dashboard: ${WEBSITE_URL}project_scout_dashboard.html"
echo ""
if [ ! -z "$CDN_URL" ]; then
  echo "CDN URL: https://$CDN_URL"
  echo "Project Scout Dashboard (CDN): https://$CDN_URL/project_scout_dashboard.html"
fi
echo ""
echo "Note: It might take a few minutes for the CDN to update with the latest content."