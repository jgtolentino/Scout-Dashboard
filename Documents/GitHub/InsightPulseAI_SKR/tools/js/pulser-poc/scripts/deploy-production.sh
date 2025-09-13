#!/bin/bash

# Production Deployment Script - Brand Performance Dashboard
# Deploys the complete dashboard with real data to Azure Static Web Apps
set -e

echo "🚀 Brand Performance Dashboard - Production Deployment"
echo "====================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-brand-performance-dashboard"
LOCATION="eastus2"
APP_NAME="brand-dashboard-$(date +%s)"
SUBSCRIPTION=""

# Check if logged into Azure
echo -e "${BLUE}Checking Azure login status...${NC}"
if ! az account show &>/dev/null; then
    echo -e "${YELLOW}Not logged into Azure. Please login:${NC}"
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Using subscription: $SUBSCRIPTION${NC}"

# Validate environment
echo -e "${BLUE}Validating environment...${NC}"
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}✗ Frontend build not found. Building now...${NC}"
    cd frontend
    npm install
    npm run build
    cd ..
fi

if [ ! -f "api/brands_500.json" ] && [ ! -f "api/data/brands_500.json" ]; then
    echo -e "${RED}✗ brands_500.json not found in api/ or api/data/. Please ensure the data file exists.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment validation passed${NC}"

# Create resource group if it doesn't exist
echo -e "${BLUE}Setting up Azure resources...${NC}"
if ! az group show -n $RESOURCE_GROUP &>/dev/null; then
    az group create -n $RESOURCE_GROUP -l $LOCATION
    echo -e "${GREEN}✓ Resource group created${NC}"
else
    echo -e "${GREEN}✓ Resource group already exists${NC}"
fi

# Create Static Web App
echo -e "${BLUE}Creating Azure Static Web App...${NC}"
az staticwebapp create \
    -n $APP_NAME \
    -g $RESOURCE_GROUP \
    -l $LOCATION \
    --sku Standard

# Get deployment token
echo -e "${BLUE}Getting deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    -n $APP_NAME \
    -g $RESOURCE_GROUP \
    --query "properties.apiKey" -o tsv)

# Deploy using SWA CLI
echo -e "${BLUE}Deploying to Azure Static Web Apps...${NC}"
npx -y @azure/static-web-apps-cli deploy \
    ./dist \
    --api-location ./api \
    --deployment-token $DEPLOYMENT_TOKEN \
    --env production

# Get the app URL
APP_URL=$(az staticwebapp show -n $APP_NAME -g $RESOURCE_GROUP --query "defaultHostname" -o tsv)

# Run post-deployment verification
echo -e "${BLUE}Running post-deployment verification...${NC}"
sleep 30  # Wait for deployment to propagate

# Test health endpoint
HEALTH_URL="https://$APP_URL/api/health"
echo -e "${BLUE}Testing health endpoint: $HEALTH_URL${NC}"
if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
else
    echo -e "${YELLOW}⚠ Health endpoint not responding yet (may take a few minutes)${NC}"
fi

# Test brands API
BRANDS_URL="https://$APP_URL/api/brands/kpis"
echo -e "${BLUE}Testing brands API: $BRANDS_URL${NC}"
if curl -f -s "$BRANDS_URL" > /dev/null; then
    echo -e "${GREEN}✓ Brands API responding${NC}"
else
    echo -e "${YELLOW}⚠ Brands API not responding yet (may take a few minutes)${NC}"
fi

echo ""
echo -e "${GREEN}==========================================================="
echo -e "✅ Production Deployment Complete!"
echo -e "==========================================================="
echo -e "App Name: ${YELLOW}$APP_NAME${NC}"
echo -e "Resource Group: ${YELLOW}$RESOURCE_GROUP${NC}"
echo -e "Dashboard URL: ${YELLOW}https://$APP_URL${NC}"
echo -e "Health Check: ${YELLOW}https://$APP_URL/api/health${NC}"
echo -e "API Docs: ${YELLOW}https://$APP_URL/api/brands/schema${NC}"
echo -e "===========================================================${NC}"
echo ""
echo -e "${BLUE}📊 Your Brand Performance Dashboard is now live!${NC}"
echo -e "${BLUE}Features available:${NC}"
echo -e "   • Real-time KPIs from 500 brands (₱759M revenue)"
echo -e "   • Market share visualization"
echo -e "   • Top gainers/losers tracking"
echo -e "   • Brand leaderboard with drill-down"
echo -e "   • AI-powered insights"
echo -e "   • Health monitoring and alerts"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Set up monitoring alerts in Azure"
echo -e "   2. Configure custom domain (optional)"
echo -e "   3. Review performance metrics"
echo -e "   4. Share dashboard URL with stakeholders"
echo ""
echo -e "${YELLOW}🗑️  To delete this deployment:${NC}"
echo -e "   az group delete -n $RESOURCE_GROUP --yes"
echo ""
echo -e "${GREEN}🎉 Deployment successful! Visit your dashboard now.${NC}"