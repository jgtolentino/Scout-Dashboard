#!/bin/bash
# Script for deploying to Azure Static Web Apps
# Compatible with Azure URL structure requirements
# Created for Project Scout Dashboard Management

set -e

echo "🚀 Azure Static Web App Deployment Tool 🚀"
echo "==========================================="

# Configuration
APP_NAME="tbwa-juicer-insights-dashboard"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
LOCATION="East Asia"
SKU="Free"
DEPLOY_DIR="deploy-ready"
DEPLOY_ENV="production"  # or "preview"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

# Ensure logged in to Azure
az account show &> /dev/null || {
    echo "⚠️ Not logged in to Azure. Please run 'az login' first."
    exit 1
}

# Check if static web app exists
echo "🔍 Checking if Static Web App exists..."
APP_EXISTS=$(az staticwebapp list --resource-group "$RESOURCE_GROUP" --query "[?name=='$APP_NAME'].name" -o tsv)

if [ -z "$APP_EXISTS" ]; then
    echo "🏗️ Creating new Static Web App: $APP_NAME"
    az staticwebapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$SKU"
    
    echo "✅ Static Web App created successfully!"
else
    echo "✅ Using existing Static Web App: $APP_NAME"
fi

# Get deployment token
echo "🔑 Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOY_TOKEN" ]; then
    echo "❌ Failed to get deployment token. Check permissions."
    exit 1
fi

# Check if SWA CLI is installed
if ! command -v swa &> /dev/null; then
    echo "📦 Installing Azure Static Web Apps CLI..."
    npm install -g @azure/static-web-apps-cli
fi

# Deploy the site
echo "📤 Deploying to $APP_NAME ($DEPLOY_ENV environment)..."
swa deploy "$DEPLOY_DIR" \
    --deployment-token "$DEPLOY_TOKEN" \
    --app-name "$APP_NAME" \
    --env "$DEPLOY_ENV"

# Get the site URL
HOSTNAME=$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)

echo "✨ Deployment complete!"
echo "🌐 Site is available at: https://$HOSTNAME"
echo "📊 Dashboard URL: https://$HOSTNAME/advisor"
echo "📈 Legacy URL: https://$HOSTNAME/insights_dashboard.html (redirects to /advisor)"

# Instructions for future deployments
echo ""
echo "💡 To deploy future updates, run:"
echo "    ./deploy_azure_static_website.sh"