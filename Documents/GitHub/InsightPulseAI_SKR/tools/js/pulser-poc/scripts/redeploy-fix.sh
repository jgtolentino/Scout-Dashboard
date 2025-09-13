#!/bin/bash

# Quick redeploy script to fix API routing
set -e

echo "🚀 Redeploying Brand Performance Dashboard with API fixes"
echo "========================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration from previous deployment
RESOURCE_GROUP="rg-brand-performance-dashboard"
APP_NAME="brand-dashboard-1748105837"

# Get deployment token
echo -e "${BLUE}Getting deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    -n $APP_NAME \
    -g $RESOURCE_GROUP \
    --query "properties.apiKey" -o tsv)

# Deploy with updated configuration
echo -e "${BLUE}Deploying with fixed API routing...${NC}"
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/pulser-poc

npx -y @azure/static-web-apps-cli deploy \
    ./dist \
    --api-location ./api \
    --deployment-token $DEPLOYMENT_TOKEN \
    --env production

# Get the app URL
APP_URL=$(az staticwebapp show -n $APP_NAME -g $RESOURCE_GROUP --query "defaultHostname" -o tsv)

echo ""
echo -e "${GREEN}=========================================================="
echo -e "✅ Redeployment Complete!"
echo -e "=========================================================="
echo -e "Dashboard URL: ${YELLOW}https://$APP_URL${NC}"
echo -e "===========================================================${NC}"

# Test the endpoints
echo -e "${BLUE}Testing API endpoints...${NC}"
echo -e "${BLUE}Health check:${NC}"
curl -s "https://$APP_URL/api/health" | python3 -m json.tool | head -10

echo -e "${BLUE}KPIs check:${NC}"
curl -s "https://$APP_URL/api/brands/kpis" | python3 -m json.tool | head -10

echo -e "${GREEN}🎉 Your dashboard should now be fully functional!${NC}"