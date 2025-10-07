#!/bin/bash

# Azure Application Insights Setup Script for Phase 3A Monitoring
# This script provisions Application Insights and configures GitHub Secrets

set -e

echo "🔍 Setting up Azure Application Insights for Brand Performance API..."

# Configuration
RESOURCE_GROUP="pulser-rg"
APP_INSIGHTS_NAME="pulser-ai"
LOCATION="East US"

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
    echo "❌ Please log in to Azure CLI first: az login"
    exit 1
fi

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo "📦 Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
else
    echo "✅ Resource group $RESOURCE_GROUP already exists"
fi

# Create Application Insights component
echo "🔍 Creating Application Insights component: $APP_INSIGHTS_NAME"
az monitor app-insights component create \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --resource-group "$RESOURCE_GROUP" \
    --application-type web \
    --retention-time 90

# Get connection string
echo "🔗 Retrieving Application Insights connection string..."
AI_CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

# Get instrumentation key (for legacy compatibility)
AI_INSTRUMENTATION_KEY=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query instrumentationKey -o tsv)

# Get App ID
AI_APP_ID=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query appId -o tsv)

echo "✅ Application Insights created successfully!"
echo ""
echo "📋 Configuration Details:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Insights Name: $APP_INSIGHTS_NAME"
echo "  Location: $LOCATION"
echo "  App ID: $AI_APP_ID"
echo "  Instrumentation Key: ${AI_INSTRUMENTATION_KEY:0:8}..."
echo ""

# Store in GitHub Secrets (if GitHub CLI is available)
if command -v gh &> /dev/null; then
    echo "🔐 Setting GitHub Secrets..."
    
    # Check if we're in a git repository
    if git rev-parse --git-dir &> /dev/null; then
        echo "  Setting APPINSIGHTS_CONNECTION_STRING..."
        gh secret set APPINSIGHTS_CONNECTION_STRING --body "$AI_CONNECTION_STRING"
        
        echo "  Setting APPINSIGHTS_INSTRUMENTATION_KEY..."
        gh secret set APPINSIGHTS_INSTRUMENTATION_KEY --body "$AI_INSTRUMENTATION_KEY"
        
        echo "  Setting APPINSIGHTS_APP_ID..."
        gh secret set APPINSIGHTS_APP_ID --body "$AI_APP_ID"
        
        echo "✅ GitHub Secrets configured successfully!"
    else
        echo "⚠️ Not in a git repository. Please set GitHub Secrets manually:"
        echo "  APPINSIGHTS_CONNECTION_STRING=$AI_CONNECTION_STRING"
        echo "  APPINSIGHTS_INSTRUMENTATION_KEY=$AI_INSTRUMENTATION_KEY"
        echo "  APPINSIGHTS_APP_ID=$AI_APP_ID"
    fi
else
    echo "⚠️ GitHub CLI not found. Please set GitHub Secrets manually:"
    echo "  APPINSIGHTS_CONNECTION_STRING=$AI_CONNECTION_STRING"
    echo "  APPINSIGHTS_INSTRUMENTATION_KEY=$AI_INSTRUMENTATION_KEY"
    echo "  APPINSIGHTS_APP_ID=$AI_APP_ID"
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Update your Azure Static Web App environment variables"
echo "2. Deploy the updated API with monitoring endpoints"
echo "3. Test /api/status and /api/metrics endpoints"
echo "4. Verify telemetry in Azure Portal > Application Insights"
echo ""
echo "📊 Application Insights Portal URL:"
echo "https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME"
