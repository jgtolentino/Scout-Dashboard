#!/bin/bash

# Deploy the fully schema-aligned POC to Azure
set -e

echo "🚀 Deploying Schema-Aligned POC Dashboard"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="rg-brand-performance-dashboard"
APP_NAME="brand-dashboard-1748105837"
POC_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/poc"

# Build the POC
echo -e "${BLUE}Building the POC application...${NC}"
cd "$POC_DIR"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Build the application
echo -e "${BLUE}Building for production...${NC}"
npm run build

# Copy built files to our deployment directory
echo -e "${BLUE}Preparing deployment files...${NC}"
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/pulser-poc

# Clear old dist
rm -rf dist/*

# Copy POC's built client files
cp -r "$POC_DIR/dist/client/"* dist/

# Copy the POC's API (if needed)
mkdir -p api/poc-api
cp -r "$POC_DIR/dist/"*.js api/poc-api/ 2>/dev/null || true

# Get deployment token
echo -e "${BLUE}Getting deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    -n $APP_NAME \
    -g $RESOURCE_GROUP \
    --query "properties.apiKey" -o tsv)

# Deploy to Azure
echo -e "${BLUE}Deploying to Azure Static Web Apps...${NC}"
npx -y @azure/static-web-apps-cli deploy \
    ./dist \
    --api-location ./api \
    --deployment-token $DEPLOYMENT_TOKEN \
    --env production

# Get the app URL
APP_URL=$(az staticwebapp show -n $APP_NAME -g $RESOURCE_GROUP --query "defaultHostname" -o tsv)

echo ""
echo -e "${GREEN}=========================================================="
echo -e "✅ POC Deployment Complete!"
echo -e "=========================================================="
echo -e "Dashboard URL: ${YELLOW}https://$APP_URL${NC}"
echo -e "===========================================================${NC}"
echo ""
echo -e "${GREEN}🎉 Your schema-aligned dashboard is now live!${NC}"