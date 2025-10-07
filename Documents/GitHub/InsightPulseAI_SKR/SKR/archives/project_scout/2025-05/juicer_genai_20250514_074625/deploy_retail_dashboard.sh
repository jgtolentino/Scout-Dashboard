#!/bin/bash

# Deploy Retail Advisor dashboard to Azure Blob Storage
# This script uploads the white-labeled dashboard with Power BI styling to Azure
# Updated version with all Pulser/InsightPulseAI references removed

# Default configuration
STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-"pscoutdash0513"}
RESOURCE_GROUP=${RESOURCE_GROUP:-"ProjectScout-ResourceGroup"}
CONTAINER_NAME=${CONTAINER_NAME:-'$web'}
SOURCE_DIR=${SOURCE_DIR:-"./dashboards/deploy"}
AUTH_MODE="--auth-mode key"

echo "============================"
echo "Retail Advisor Dashboard Deployment"
echo "============================"
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Resource Group: $RESOURCE_GROUP"
echo "Container: $CONTAINER_NAME"
echo "Source Directory: $SOURCE_DIR"
echo "============================"

# Validate that source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory $SOURCE_DIR does not exist."
  exit 1
fi

# Validate Azure Storage Account exists
az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: Storage account $STORAGE_ACCOUNT does not exist in resource group $RESOURCE_GROUP."
  exit 1
fi

# Create container if it doesn't exist (Note: $web is special for static websites)
if [ "$CONTAINER_NAME" != "$web" ]; then
  az storage container create --name "$CONTAINER_NAME" --account-name "$STORAGE_ACCOUNT" $AUTH_MODE
fi

# Enable static website hosting if using $web container
if [ "$CONTAINER_NAME" = "$web" ]; then
  echo "Ensuring static website hosting is enabled..."
  az storage blob service-properties update --account-name "$STORAGE_ACCOUNT" \
    --static-website --index-document "index.html" --404-document "404.html"
fi

# Upload files
echo "Uploading dashboard files..."

# Upload HTML files
echo "Uploading HTML files..."
for file in $(find "$SOURCE_DIR" -name "*.html"); do
  relative_path=${file#"$SOURCE_DIR/"}
  echo "Uploading $relative_path..."
  az storage blob upload \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER_NAME" \
    --file "$file" \
    --name "$relative_path" \
    --content-type "text/html" \
    --overwrite \
    $AUTH_MODE
done

# Upload CSS files
echo "Uploading CSS files..."
for file in $(find "$SOURCE_DIR" -name "*.css"); do
  relative_path=${file#"$SOURCE_DIR/"}
  echo "Uploading $relative_path..."
  az storage blob upload \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER_NAME" \
    --file "$file" \
    --name "$relative_path" \
    --content-type "text/css" \
    --overwrite \
    $AUTH_MODE
done

# Upload JS files
echo "Uploading JavaScript files..."
for file in $(find "$SOURCE_DIR" -name "*.js"); do
  relative_path=${file#"$SOURCE_DIR/"}
  echo "Uploading $relative_path..."
  az storage blob upload \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER_NAME" \
    --file "$file" \
    --name "$relative_path" \
    --content-type "application/javascript" \
    --overwrite \
    $AUTH_MODE
done

# Upload SVG files (icons)
echo "Uploading SVG files..."
for file in $(find "$SOURCE_DIR" -name "*.svg"); do
  relative_path=${file#"$SOURCE_DIR/"}
  echo "Uploading $relative_path..."
  az storage blob upload \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER_NAME" \
    --file "$file" \
    --name "$relative_path" \
    --content-type "image/svg+xml" \
    --overwrite \
    $AUTH_MODE
done

# Upload any remaining files without specific content types
echo "Uploading other files..."
find "$SOURCE_DIR" -type f \
  -not -name "*.html" \
  -not -name "*.css" \
  -not -name "*.js" \
  -not -name "*.svg" \
  -not -name "*.md" \
  | while read file; do
    relative_path=${file#"$SOURCE_DIR/"}
    echo "Uploading $relative_path..."
    az storage blob upload \
      --account-name "$STORAGE_ACCOUNT" \
      --container-name "$CONTAINER_NAME" \
      --file "$file" \
      --name "$relative_path" \
      --overwrite \
      $AUTH_MODE
  done

echo "============================"
echo "Deployment Complete!"
echo "============================"

# Get website URL
if [ "$CONTAINER_NAME" = "$web" ]; then
  WEBSITE_URL=$(az storage account show -n "$STORAGE_ACCOUNT" -g "$RESOURCE_GROUP" --query "primaryEndpoints.web" --output tsv)
  echo "Dashboard URL: ${WEBSITE_URL}insights_dashboard.html"
else
  echo "Files uploaded to container: $CONTAINER_NAME"
fi

echo "============================"