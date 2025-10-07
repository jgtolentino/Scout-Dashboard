#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
STATIC_WEBAPP_NAME="ui-genie-app"
CUSTOM_DOMAIN="ui-genie.tbwa-client.com"  # Domain to use
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"  # Active subscription

# Login to Azure (interactive)
echo "Logging in to Azure..."
az login

# Set the correct subscription
echo "Setting subscription to $SUBSCRIPTION_NAME..."
az account set --subscription "$SUBSCRIPTION_NAME"

# Add custom domain
echo "Adding custom domain $CUSTOM_DOMAIN to $STATIC_WEBAPP_NAME..."
az staticwebapp hostname set \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --hostname "$CUSTOM_DOMAIN"

echo "Custom domain setup initiated!"
echo "You need to configure the following DNS record at your domain provider:"
echo "CNAME $CUSTOM_DOMAIN -> $STATIC_WEBAPP_NAME.azurestaticapps.net"
echo "Note: DNS propagation might take up to 48 hours."