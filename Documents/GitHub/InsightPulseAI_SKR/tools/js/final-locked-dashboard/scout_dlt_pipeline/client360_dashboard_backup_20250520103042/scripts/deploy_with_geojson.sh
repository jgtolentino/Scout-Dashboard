#!/bin/bash
# Deploy TBWA Client 360 Dashboard to Azure Static Web Apps with GeoJSON files

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="deploy"
OUTPUT_DIR="../output"
mkdir -p "$OUTPUT_DIR"
TEMP_DIR=$(mktemp -d)

echo -e "${GREEN}TBWA Client 360 Dashboard Deployment with GeoJSON${NC}"
echo -e "${YELLOW}=====================================${NC}"

# Create temp directory for deployment
mkdir -p $TEMP_DIR

# Copy all files from deploy directory to temp directory
echo -e "${YELLOW}Copying deployment files...${NC}"
cp -r $DEPLOY_DIR/* $TEMP_DIR/

# Ensure data directory exists
mkdir -p $TEMP_DIR/data

# Check existing GeoJSON files
echo -e "${YELLOW}Checking GeoJSON files...${NC}"
if [ -f "$DEPLOY_DIR/data/philippines_outline.geojson" ]; then
    echo -e "${GREEN}Found philippines_outline.geojson${NC}"
    cp $DEPLOY_DIR/data/philippines_outline.geojson $TEMP_DIR/data/
else
    echo -e "${RED}Warning: philippines_outline.geojson not found${NC}"
fi

# Ensure stores.geojson is copied to the deployment
echo -e "${YELLOW}Adding stores.geojson...${NC}"
if [ -f "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy/data/stores.geojson" ]; then
    cp "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy/data/stores.geojson" $TEMP_DIR/data/
    echo -e "${GREEN}Added stores.geojson${NC}"
else
    echo -e "${RED}Error: stores.geojson not found${NC}"
    exit 1
fi

# Create Azure Static Web App configuration
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}"
cat > $TEMP_DIR/staticwebapp.config.json << EOF
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*", "/data/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.azurewebsites.net https://unpkg.com;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".geojson": "application/json",
    ".css": "text/css",
    ".js": "text/javascript",
    ".html": "text/html"
  }
}
EOF

# List all files in the temp directory
echo -e "${YELLOW}Deployment file list:${NC}"
find $TEMP_DIR -type f | sort

# Skip deployment package creation
echo -e "${GREEN}Skipping deployment package creation...${NC}"
echo -e "${GREEN}Using direct deployment from temp directory${NC}"

# Deploy using Azure CLI
echo -e "${YELLOW}Deploying to Azure...${NC}"
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI not found. Please install Azure CLI and try again.${NC}"
    exit 1
fi

# Deploy to Azure Static Web Apps
SITE_NAME="tbwa-client360-dashboard-production"

# Check if the static site already exists
if az staticwebapp show --name $SITE_NAME &> /dev/null; then
    echo -e "${YELLOW}Updating existing Azure Static Web App: $SITE_NAME${NC}"
    az staticwebapp update --name $SITE_NAME
else
    echo -e "${YELLOW}Creating new Azure Static Web App: $SITE_NAME${NC}"
    az staticwebapp create --name $SITE_NAME --resource-group "scout-dashboard" --location "eastus2" --sku "Standard"
fi

# Deploy using SWA CLI
echo -e "${YELLOW}Deploying content to Azure Static Web App using SWA CLI...${NC}"
if ! command -v swa &> /dev/null; then
    echo -e "${RED}Static Web Apps CLI not found. Installing...${NC}"
    npm install -g @azure/static-web-apps-cli
fi

# Deploy to Azure
swa deploy $TEMP_DIR --deployment-token $(az staticwebapp secrets list --name $SITE_NAME --query "properties.apiKey" -o tsv)

# Get the URL of the deployed site
URL=$(az staticwebapp show --name $SITE_NAME --query "defaultHostname" -o tsv)
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Your dashboard is now available at: ${YELLOW}https://$URL${NC}"

# Clean up
rm -rf $TEMP_DIR

exit 0