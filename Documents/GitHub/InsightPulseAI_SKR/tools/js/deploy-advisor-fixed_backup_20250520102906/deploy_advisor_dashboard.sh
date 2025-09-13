#!/bin/bash
# Script to deploy Advisor Dashboard to Azure Static Web App
# Based on the SOP for deploying dashboards with clean URL structure

set -e

echo "🌟 Deploying Scout Advisor Dashboard to Azure 🌟"
echo "================================================"

# Configuration
APP_NAME="wonderful-desert-03a292c00.6"
RESOURCE_GROUP="RG-TBWA-Scout-Dashboard"
DEPLOY_DIR="deploy-advisor-fixed"

# Check if the SWA CLI is installed
if ! command -v swa &> /dev/null && ! az extension show --name staticwebapp &> /dev/null; then
  echo "Installing Azure Static Web App CLI..."
  az extension add --name staticwebapp
fi

# Check if we're logged into Azure
ACCOUNT=$(az account show --query name -o tsv 2>/dev/null || echo "")
if [ -z "$ACCOUNT" ]; then
  echo "🔒 Please log in to Azure..."
  az login
  if [ $? -ne 0 ]; then
    echo "❌ Failed to log in to Azure. Exiting."
    exit 1
  fi
fi

# Get the deployment token
echo "🔑 Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv 2>/dev/null || echo "")

if [ -z "$DEPLOY_TOKEN" ]; then
  echo "⚠️ Could not automatically retrieve deployment token."
  echo "Falling back to manual upload via Azure Portal."
  echo "Please follow these steps:"
  echo "1. Create a zip file of the $DEPLOY_DIR directory"
  echo "2. Go to the Azure Portal"
  echo "3. Navigate to your Static Web App ($APP_NAME)"
  echo "4. Click on 'Deployment' and upload the zip file"
  
  cd "$DEPLOY_DIR"
  zip -r ../advisor_dashboard.zip .
  cd ..
  
  echo "📦 Created deployment package: advisor_dashboard.zip"
  echo "Please upload this file to the Azure Portal."
  exit 0
fi

# Deploy with SWA CLI if we have the token
echo "🚀 Deploying to Azure Static Web App..."
cd "$DEPLOY_DIR"
az staticwebapp deploy --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --source "." --no-use-keychain --api-key "$DEPLOY_TOKEN"

if [ $? -ne 0 ]; then
  echo "⚠️ Deployment with Azure CLI failed. Trying alternate deployment method..."
  swa deploy . --app-name "$APP_NAME" --deployment-token "$DEPLOY_TOKEN" --env production
  
  if [ $? -ne 0 ]; then
    echo "❌ Both deployment methods failed. Please deploy manually via the Azure Portal."
    zip -r ../advisor_dashboard.zip .
    cd ..
    echo "📦 Created deployment package: advisor_dashboard.zip"
    echo "Please upload this file to the Azure Portal."
    exit 1
  fi
fi

# Verify deployment
echo "✅ Deployment completed! Verifying accessibility..."
echo "🌐 Dashboard should be available at:"
echo "   https://$APP_NAME.azurestaticapps.net/advisor"
echo "   https://$APP_NAME.azurestaticapps.net/advisor.html"

echo "🔍 Final Verification Checklist:"
echo "1. Verify KPI cards are functioning with modals"
echo "2. Confirm AI Insights section is displayed properly"
echo "3. Check that charts are loading correctly"
echo "4. Test navigation between Advisor, Edge, and Ops dashboards"
echo "5. Confirm responsive design works on mobile devices"