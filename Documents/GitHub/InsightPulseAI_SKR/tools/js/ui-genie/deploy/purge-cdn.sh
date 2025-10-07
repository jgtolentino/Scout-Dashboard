#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
STATIC_WEBAPP_NAME="ui-genie-app"
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"  # Active subscription

# Login to Azure (interactive)
echo "Logging in to Azure..."
az login

# Set the correct subscription
echo "Setting subscription to $SUBSCRIPTION_NAME..."
az account set --subscription "$SUBSCRIPTION_NAME"

# Purge the CDN cache
echo "Purging the CDN cache for $STATIC_WEBAPP_NAME..."
az staticwebapp purge \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --routes '/*'

echo "CDN cache purged successfully!"