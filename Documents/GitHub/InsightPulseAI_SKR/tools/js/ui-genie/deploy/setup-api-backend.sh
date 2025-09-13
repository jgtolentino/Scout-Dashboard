#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
LOCATION="eastus2"
APP_NAME="ui-genie-api"
SKU="B1"
RUNTIME="PYTHON:3.9"
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

# Create App Service Plan
echo "Creating App Service Plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku "$SKU" \
  --is-linux

# Create Web App
echo "Creating Web App..."
az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "${APP_NAME}-plan" \
  --runtime "$RUNTIME"

# Configure Web App settings
echo "Configuring Web App settings..."
az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"

# Copy environment variables from .env.azure
echo "Setting environment variables..."
# Read values from .env.azure
OPENAI_API_KEY=$(grep OPENAI_API_KEY ../backend/.env.azure | cut -d '=' -f2-)
ALLOWED_ORIGINS=$(grep ALLOWED_ORIGINS ../backend/.env.azure | cut -d '=' -f2-)
MOCK_MODE=$(grep MOCK_MODE ../backend/.env.azure | cut -d '=' -f2-)

# Set environment variables
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    ALLOWED_ORIGINS="$ALLOWED_ORIGINS" \
    MOCK_MODE="$MOCK_MODE" \
    WEBSITES_PORT=8000

# Enable CORS
echo "Enabling CORS..."
STATIC_WEBAPP_URL=$(az staticwebapp show \
  --name "ui-genie-app" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" \
  --output tsv)

az webapp cors add \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --allowed-origins "https://${STATIC_WEBAPP_URL}"

# Deploy the backend code
echo "Deploying backend code..."
cd backend
zip -r ../backend-deploy.zip .
cd ..

az webapp deployment source config-zip \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src "backend-deploy.zip"

# Cleanup
rm backend-deploy.zip

# Get the URL of the deployed API
API_URL=$(az webapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostName" \
  --output tsv)

echo "Backend API deployment completed successfully!"
echo "Your API is available at: https://$API_URL"

# Update the Static Web App with the API URL
echo "Updating Static Web App environment variables with API URL..."
az staticwebapp environment setting set \
  --name "ui-genie-app" \
  --resource-group "$RESOURCE_GROUP" \
  --setting-names VITE_API_URL \
  --setting-values "https://$API_URL" \
  --output none

echo "Setup complete! The frontend has been configured to use the backend API."