#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TBWA Power BI Dashboard Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies.${NC}"
    exit 1
fi

# Build the project
echo -e "${YELLOW}Building enhanced Power BI dashboard...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Create a deployment directory for the Power BI dashboard
echo -e "${YELLOW}Creating deployment package...${NC}"
DEPLOY_DIR="deploy-powerbi"
mkdir -p $DEPLOY_DIR

# Copy build files
cp -r dist/* $DEPLOY_DIR/

# Create a staticwebapp.config.json for proper routing
cat > $DEPLOY_DIR/staticwebapp.config.json << EOF
{
  "routes": [
    { "route": "/advisor", "rewrite": "/advisor.html" },
    { "route": "/edge", "rewrite": "/edge.html" },
    { "route": "/ops", "rewrite": "/ops.html" },
    { "route": "/powerbi", "rewrite": "/index.html?powerbi=true" }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/css/*", "/js/*", "/images/*"]
  },
  "globalHeaders": {
    "cache-control": "max-age=3600",
    "X-Frame-Options": "SAMEORIGIN"
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  }
}
EOF

# Create a zip file for easy deployment
echo -e "${YELLOW}Creating zip package...${NC}"
(cd $DEPLOY_DIR && zip -r ../tbwa-powerbi-dashboard.zip .)

echo -e "${GREEN}Deployment package created successfully!${NC}"
echo -e "${GREEN}Files are available in: ${YELLOW}$DEPLOY_DIR${NC}"
echo -e "${GREEN}Zip package: ${YELLOW}tbwa-powerbi-dashboard.zip${NC}"
echo -e ""
echo -e "${BLUE}To deploy to Azure Static Web Apps:${NC}"
echo -e "1. Go to Azure Portal and create a new Static Web App"
echo -e "2. Select 'Custom upload' during deployment"
echo -e "3. Upload the generated zip file"
echo -e "4. Access your enhanced Power BI dashboard at: https://your-site.azurestaticapps.net/powerbi"
echo -e ""
echo -e "${YELLOW}Note: For complete Power BI integration, you would need to:${NC}"
echo -e "1. Set up Power BI Embedded capacity in Azure"
echo -e "2. Create the necessary app registrations for authentication"
echo -e "3. Deploy a backend API for secure token generation"
echo -e "4. Update the environment variables with proper Power BI configuration"
echo -e ""

exit 0