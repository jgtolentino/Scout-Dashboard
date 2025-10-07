#!/bin/bash

# Script to deploy mockify-creator to Azure Static Web App
# Created by Claude for InsightPulseAI/Project Scout

# Set error handling
set -e

echo "Starting deployment process for Advisor Dashboard..."

# Get directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration variables
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
SWA_NAME="tbwa-juicer-insights-dashboard"
DEPLOY_DIR="deploy-ready"

# Ensure deploy directory exists
mkdir -p "$DEPLOY_DIR"

echo "🔍 Checking Azure Static Web App status..."
APP_STATUS=$(az staticwebapp show --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv 2>/dev/null || echo "not_found")

if [[ "$APP_STATUS" == "not_found" ]]; then
  echo "⚠️ Static Web App not found. Creating new instance..."
  az staticwebapp create \
    --name "$SWA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "East Asia" \
    --sku Free
  
  echo "✅ Static Web App created successfully."
else
  echo "✅ Using existing Static Web App: $APP_STATUS"
fi

# Get deployment token for the Static Web App
echo "🔑 Retrieving deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

if [[ -z "$DEPLOY_TOKEN" ]]; then
  echo "❌ Failed to retrieve deployment token. Please check your Azure permissions."
  exit 1
fi

# Create zip package for deployment
echo "📦 Creating deployment package..."
cd "$DEPLOY_DIR"
zip -r ../deploy-package.zip ./*
cd ..

echo "🚀 Deploying to Azure Static Web App..."
az staticwebapp deployment create \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --deployment-token "$DEPLOY_TOKEN" \
  --source deploy-package.zip

# Clean up
rm deploy-package.zip

HOSTNAME=$(az staticwebapp show --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)

echo "✨ Deployment complete!"
echo "📊 Dashboard available at: https://$HOSTNAME/advisor"
echo "📊 Legacy URL redirects from: https://$HOSTNAME/insights_dashboard.html"