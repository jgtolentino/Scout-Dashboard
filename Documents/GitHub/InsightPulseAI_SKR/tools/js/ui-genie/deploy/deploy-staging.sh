#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
STATIC_WEBAPP_NAME="ui-genie-app"
SOURCE_DIR="frontend/dist"  # Output of npm run build
SLOT_NAME="staging"
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"  # Active subscription

# Login to Azure (interactive)
echo "Logging in to Azure..."
az login

# Set the correct subscription
echo "Setting subscription to $SUBSCRIPTION_NAME..."
az account set --subscription "$SUBSCRIPTION_NAME"

# Create the staging slot if it doesn't exist
echo "Creating staging slot if it doesn't exist..."
az staticwebapp environment create \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment-name "$SLOT_NAME" \
  --output none || true

# Build the frontend
echo "Building the frontend application for production..."
cd frontend
npm run build:prod
cd ..

# Deploy to staging slot
echo "Deploying to staging slot..."
az staticwebapp deploy \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source "$SOURCE_DIR" \
  --env "$SLOT_NAME"

# Get the URL of the staging slot
STAGING_URL=$(az staticwebapp environment show \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment-name "$SLOT_NAME" \
  --query "properties.hostNameSslState[0].hostName" \
  --output tsv)

echo "Deployment to staging completed successfully!"
echo "Your staging app is available at: https://$STAGING_URL"
echo "To swap staging to production, run: ./swap-slots.sh"