#!/bin/bash

# Canary Deployment Script
# This script deploys the application to a canary environment with feature flags enabled
# for testing before it goes to production.

set -e

# Configuration
CANARY_SLOT="canary"
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

# Generate the canary configuration
echo "Generating canary configuration..."
node config/azure-swa-config.js canary

# Build the application with canary feature flags enabled
echo "Building application with canary features enabled..."
REACT_APP_ENABLE_NEW_DASHBOARD_UI=true \
REACT_APP_ENABLE_AI_INSIGHTS=true \
REACT_APP_ENABLE_CHART_ANNOTATIONS=true \
REACT_APP_ENVIRONMENT=canary \
REACT_APP_DEPLOYMENT_ID="${TIMESTAMP}" \
npm run build

# Ensure the build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: Build directory '$BUILD_DIR' does not exist."
    exit 1
fi

# Copy the canary configuration to the build directory
echo "Copying canary configuration to build directory..."
cp deploy/canary/staticwebapp.config.json $BUILD_DIR/

# Tag the deployment in Git for reference
echo "Tagging deployment in Git..."
git tag "canary-${TIMESTAMP}"

# Deploy to Azure Static Web Apps canary slot
echo "Deploying to Azure Static Web Apps canary slot..."
az staticwebapp deploy \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --deployment-environment $CANARY_SLOT \
    --source $BUILD_DIR

# Get the canary URL
CANARY_URL=$(az staticwebapp environment show \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --environment $CANARY_SLOT \
    --query "hostname" \
    --output tsv)

echo "Canary deployment complete!"
echo "Deployment ID: canary-${TIMESTAMP}"
echo "Canary URL: https://${CANARY_URL}"
echo ""
echo "The deployment will be monitored for 24 hours before promotion to production."
echo "Run ./scripts/promote-to-production.sh to promote this canary to production."