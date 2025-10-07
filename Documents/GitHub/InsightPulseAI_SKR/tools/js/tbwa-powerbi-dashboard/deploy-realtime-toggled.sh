#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TBWA Power BI Dashboard - Real-time Toggle Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check for required tools
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is required but not installed${NC}"
    exit 1
fi

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Verify .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating default...${NC}"
    echo 'VITE_REALTIME_API=https://your-prod-api.scout.ai/insights' > .env
    echo -e "${YELLOW}Created .env with default API endpoint. Please update before production deployment.${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build
echo -e "${YELLOW}Building the application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Real-time toggle implementation complete!${NC}"

# Create deployment package
DEPLOY_DIR="deploy-realtime"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR
cp -r dist/* $DEPLOY_DIR/
cp staticwebapp.config.json $DEPLOY_DIR/ 2>/dev/null || :

# Output summary
echo -e "\n${BLUE}Implementation Summary${NC}"
echo -e "${BLUE}======================${NC}"
echo -e "${GREEN}✅ DataToggle component already had realtime button${NC}"
echo -e "${GREEN}✅ Added real API endpoint handling in dataStore.js${NC}"
echo -e "${GREEN}✅ Created .env with API configuration${NC}"
echo -e "${GREEN}✅ Updated ChartGrid to respond to dataSource changes${NC}"
echo -e "${GREEN}✅ Added visual indicator for real-time data mode${NC}"

echo -e "\n${YELLOW}To deploy to Azure Static Web Apps:${NC}"
echo -e "Run: swa deploy ./deploy-realtime --app-name scout-dashboard --resource-group RG-TBWA-ProjectScout-Juicer --env production"

echo -e "\n${YELLOW}To test locally:${NC}"
echo -e "npm run preview"

# Generate mock API data for local development
echo -e "\n${YELLOW}Generating sample API response file for testing...${NC}"
mkdir -p public/api
cat > public/api/dashboard-data.json << EOL
{
  "salesByRegion": [
    { "region": "North", "value": 4200 },
    { "region": "South", "value": 3500 },
    { "region": "East", "value": 5100 },
    { "region": "West", "value": 6200 }
  ],
  "salesByCategory": [
    { "category": "Electronics", "value": 7500 },
    { "category": "Clothing", "value": 4800 },
    { "category": "Food", "value": 3200 },
    { "category": "Home", "value": 3600 }
  ],
  "salesTrend": [
    { "month": "Jan", "value": 7200 },
    { "month": "Feb", "value": 6800 },
    { "month": "Mar", "value": 8100 },
    { "month": "Apr", "value": 8900 },
    { "month": "May", "value": 9300 },
    { "month": "Jun", "value": 10200 },
    { "month": "Jul", "value": 11500 },
    { "month": "Aug", "value": 12100 },
    { "month": "Sep", "value": 11800 },
    { "month": "Oct", "value": 10900 },
    { "month": "Nov", "value": 11200 },
    { "month": "Dec", "value": 12800 }
  ],
  "kpis": {
    "totalSales": 982500,
    "averageOrder": 125,
    "customerCount": 31456,
    "conversionRate": "8.72"
  }
}
EOL

echo -e "${GREEN}✅ Sample API response file created at public/api/dashboard-data.json${NC}"
echo -e "${YELLOW}You can now toggle between simulated and real-time data modes.${NC}"

exit 0