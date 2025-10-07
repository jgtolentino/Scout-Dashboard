#!/bin/bash

# Deployment Verification Script
# Verifies that all endpoints are working correctly

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <app-url>"
    echo "Example: $0 https://brand-dashboard-123.azurestaticapps.net"
    exit 1
fi

APP_URL="$1"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying deployment at: $APP_URL${NC}"
echo "================================================"

# Test main dashboard
echo -e "${BLUE}Testing main dashboard...${NC}"
if curl -f -s "$APP_URL" > /dev/null; then
    echo -e "${GREEN}✓ Main dashboard accessible${NC}"
else
    echo -e "${RED}✗ Main dashboard not accessible${NC}"
    exit 1
fi

# Test health endpoint
echo -e "${BLUE}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -f -s "$APP_URL/api/health" || echo "failed")
if [ "$HEALTH_RESPONSE" != "failed" ]; then
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
    echo "   Status: $(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
else
    echo -e "${RED}✗ Health endpoint not responding${NC}"
fi

# Test brands API endpoints
echo -e "${BLUE}Testing brands API endpoints...${NC}"

# KPIs
if curl -f -s "$APP_URL/api/brands/kpis" > /dev/null; then
    echo -e "${GREEN}✓ KPIs endpoint responding${NC}"
else
    echo -e "${RED}✗ KPIs endpoint not responding${NC}"
fi

# Market Share
if curl -f -s "$APP_URL/api/brands/market-share" > /dev/null; then
    echo -e "${GREEN}✓ Market Share endpoint responding${NC}"
else
    echo -e "${RED}✗ Market Share endpoint not responding${NC}"
fi

# Movers
if curl -f -s "$APP_URL/api/brands/movers" > /dev/null; then
    echo -e "${GREEN}✓ Movers endpoint responding${NC}"
else
    echo -e "${RED}✗ Movers endpoint not responding${NC}"
fi

# Leaderboard
if curl -f -s "$APP_URL/api/brands/leaderboard" > /dev/null; then
    echo -e "${GREEN}✓ Leaderboard endpoint responding${NC}"
else
    echo -e "${RED}✗ Leaderboard endpoint not responding${NC}"
fi

# Insights
if curl -f -s "$APP_URL/api/brands/insights" > /dev/null; then
    echo -e "${GREEN}✓ Insights endpoint responding${NC}"
else
    echo -e "${RED}✗ Insights endpoint not responding${NC}"
fi

echo ""
echo -e "${GREEN}================================================"
echo -e "✅ Deployment verification complete!"
echo -e "================================================${NC}"
echo ""
echo -e "${BLUE}🎉 Your Brand Performance Dashboard is ready!"
echo -e "📊 Visit: $APP_URL"
echo -e "🏥 Health: $APP_URL/api/health"
echo -e "📋 API Schema: $APP_URL/api/brands/schema${NC}"