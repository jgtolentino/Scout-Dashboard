#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
STATIC_WEBAPP_NAME="ui-genie-app"
SLOT_NAME="staging"
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"  # Active subscription

# Login to Azure (interactive)
echo "Logging in to Azure..."
az login

# Set the correct subscription
echo "Setting subscription to $SUBSCRIPTION_NAME..."
az account set --subscription "$SUBSCRIPTION_NAME"

# Swap staging to production
echo "Swapping staging to production..."
az staticwebapp environment swap \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source "$SLOT_NAME" \
  --target "production"

echo "Slot swap completed successfully!"
echo "The staging environment has been promoted to production."

# Get the URL of the production app
PROD_URL=$(az staticwebapp show \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" \
  --output tsv)

echo "Production app is available at: https://$PROD_URL"