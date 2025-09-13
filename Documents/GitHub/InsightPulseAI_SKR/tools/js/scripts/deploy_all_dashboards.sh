#!/bin/bash
# Example script to deploy all dashboards with TBWA theme

# Create logs directory
mkdir -p logs

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}  InsightPulseAI Dashboard Deployment Suite${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo ""
echo -e "${YELLOW}This script will deploy all dashboards with TBWA theme${NC}"
echo ""

# Function to handle errors
handle_error() {
    echo -e "${YELLOW}Deployment of $1 dashboard encountered an error.${NC}"
    echo -e "${YELLOW}See logs for details. Continuing with next dashboard...${NC}"
    echo ""
}

# Deploy Client360 Dashboard
echo -e "${GREEN}Deploying Client360 Dashboard...${NC}"
./deploy_dashboard.sh --theme tbwa --dashboard client360 --app-name tbwa-client360-dashboard --no-verify --package-only || handle_error "Client360"
echo ""

# Deploy Retail Dashboard
echo -e "${GREEN}Deploying Retail Dashboard...${NC}"
./deploy_dashboard.sh --theme tbwa --dashboard retail --app-name tbwa-retail-dashboard --no-verify --package-only || handle_error "Retail"
echo ""

# Deploy Advisor Dashboard
echo -e "${GREEN}Deploying Advisor Dashboard...${NC}"
./deploy_dashboard.sh --theme tbwa --dashboard advisor --app-name tbwa-advisor-dashboard --no-verify --package-only || handle_error "Advisor"
echo ""

echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}  Deployment packages created successfully${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo ""
echo -e "${YELLOW}Deployment packages can be found in the output/ directory${NC}"
echo -e "${YELLOW}Reports can be found in the reports/ directory${NC}"
echo ""
echo -e "${YELLOW}To deploy to Azure manually, use:${NC}"
echo "az staticwebapp deploy --name <app-name> --resource-group <resource-group> --source-path <package-path>"
echo ""
echo -e "${GREEN}=======================================================${NC}"