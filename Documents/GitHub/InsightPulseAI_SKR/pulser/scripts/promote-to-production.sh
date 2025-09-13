#!/bin/bash

# Promote Canary to Production Script
# This script promotes a successful canary deployment to production

set -e

# Configuration
CANARY_SLOT="canary"
PRODUCTION_SLOT="production"
RESOURCE_GROUP="InsightPulseAI-RG"
STATIC_WEB_APP_NAME="scout-dashboard"
BUILD_DIR="build"

# Ensure we have the Azure CLI installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

# Get the current timestamp for deployment tagging
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Ask for confirmation
echo "You are about to promote the current canary deployment to production."
echo "This will replace the current production deployment."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Check if there are any active alerts for the canary
echo "Checking for active alerts on the canary deployment..."
ACTIVE_ALERTS=$(az monitor alert list \
    --resource-group $RESOURCE_GROUP \
    --query "[?properties.essentials.targetResourceType=='Microsoft.Web/staticSites' && properties.essentials.alertState=='Active']" \
    --output json)

# If there are active alerts, warn the user
if [ "$(echo $ACTIVE_ALERTS | jq length)" -gt 0 ]; then
    echo "Warning: There are active alerts for the canary deployment:"
    echo $ACTIVE_ALERTS | jq -r '.[].properties.essentials.description'
    read -p "Do you still want to promote to production? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

# Generate the production configuration
echo "Generating production configuration..."
node config/azure-swa-config.js production

# Check if we should continue with feature flags from canary
read -p "Do you want to keep the feature flags enabled in production? (y/n) " -n 1 -r
echo
ENABLE_FEATURES="false"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ENABLE_FEATURES="true"
fi

# Build the application for production
echo "Building application for production..."
if [ "$ENABLE_FEATURES" = "true" ]; then
    echo "Keeping new features enabled in production..."
    REACT_APP_ENABLE_NEW_DASHBOARD_UI=true \
    REACT_APP_ENABLE_AI_INSIGHTS=true \
    REACT_APP_ENABLE_CHART_ANNOTATIONS=true \
    REACT_APP_ENVIRONMENT=production \
    REACT_APP_DEPLOYMENT_ID="${TIMESTAMP}" \
    npm run build
else
    echo "Disabling new features in production..."
    REACT_APP_ENVIRONMENT=production \
    REACT_APP_DEPLOYMENT_ID="${TIMESTAMP}" \
    npm run build
fi

# Ensure the build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: Build directory '$BUILD_DIR' does not exist."
    exit 1
fi

# Copy the production configuration to the build directory
echo "Copying production configuration to build directory..."
cp deploy/production/staticwebapp.config.json $BUILD_DIR/

# Tag the deployment in Git for reference and as a golden version
echo "Tagging deployment in Git..."
git tag "production-${TIMESTAMP}"
git tag "golden-${TIMESTAMP}"

# Deploy to Azure Static Web Apps production slot
echo "Deploying to Azure Static Web Apps production slot..."
az staticwebapp deploy \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --source $BUILD_DIR

# Get the production URL
PRODUCTION_URL=$(az staticwebapp show \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "defaultHostname" \
    --output tsv)

echo "Production deployment complete!"
echo "Deployment ID: production-${TIMESTAMP}"
echo "Production URL: https://${PRODUCTION_URL}"
echo ""
echo "A golden tag has been created: golden-${TIMESTAMP}"
echo "Use this tag for rollback if needed."