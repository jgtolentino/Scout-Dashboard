#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
LOCATION="eastus2"
STATIC_WEBAPP_NAME="ui-genie-app"
SOURCE_DIR="frontend/dist"  # Output of npm run build
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"  # Active subscription

# Login to Azure (interactive)
echo "Logging in to Azure..."
az login

# Set the correct subscription
echo "Setting subscription to $SUBSCRIPTION_NAME..."
az account set --subscription "$SUBSCRIPTION_NAME"

# Create resource group if it doesn't exist
echo "Creating resource group $RESOURCE_GROUP in $LOCATION if it doesn't exist..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none || true

# Deploy infrastructure using Bicep
echo "Deploying infrastructure using Bicep..."
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infrastructure/main.bicep \
  --parameters staticWebAppName="$STATIC_WEBAPP_NAME" \
  --output none

# Build the frontend
echo "Building the frontend application for production..."
cd frontend
npm run build:prod
cd ..

# Deploy to Static Web App
echo "Deploying to Azure Static Web App..."
az staticwebapp deploy \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source "$SOURCE_DIR"

# Set environment variables
echo "Setting environment variables..."
az staticwebapp environment setting set \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --setting-names VITE_API_URL \
  --setting-values "https://$STATIC_WEBAPP_NAME-api.azurewebsites.net" \
  --output none

# Get the URL of the deployed app
APP_URL=$(az staticwebapp show \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" \
  --output tsv)

echo "Deployment completed successfully!"
echo "Your Magic Patterns UI-Genie app is available at: https://$APP_URL"