#!/bin/bash
# Deploy themed dashboard to Azure Static Web Apps

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
DEPLOY_DIR="deploy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/themed_deploy_${TIMESTAMP}.log"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}Deploying themed Client360 Dashboard to Azure${NC}" | tee -a "$LOG_FILE"

# Build themes
echo -e "${YELLOW}Building theme bundles...${NC}" | tee -a "$LOG_FILE"
./scripts/build-themes.sh | tee -a "$LOG_FILE"

# Ensure the index.html exists in the deploy directory
echo -e "${YELLOW}Creating index.html from template...${NC}" | tee -a "$LOG_FILE"
cp index.html.template deploy/index.html

# Ensure the geospatial map data is available
echo -e "${YELLOW}Copying geospatial data...${NC}" | tee -a "$LOG_FILE"
mkdir -p deploy/data
cp -r data/* deploy/data/ 2>/dev/null || echo "No data files to copy"

# Create the staticwebapp.config.json in the deploy directory
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}" | tee -a "$LOG_FILE"
cat > deploy/staticwebapp.config.json << EOF
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
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*", "/assets/*", "/data/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.tile.openstreetmap.org https://*.azurestaticapps.net;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".geojson": "application/json",
    ".css": "text/css",
    ".js": "text/javascript",
    ".html": "text/html",
    ".svg": "image/svg+xml"
  }
}
EOF

# Check if we need to create a staging deployment first
if [ "$1" == "--staging" ]; then
  echo -e "${YELLOW}Creating staged deployment...${NC}" | tee -a "$LOG_FILE"
  
  # Create a zip package for deployment
  echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
  mkdir -p output
  cd $DEPLOY_DIR
  ZIP_FILE="../output/client360_themed_dashboard_${TIMESTAMP}.zip"
  zip -r $ZIP_FILE * | tee -a "../$LOG_FILE"
  cd ..
  
  # Deploy to staging
  echo -e "${YELLOW}Deploying to Azure Static Web App staging slot...${NC}" | tee -a "$LOG_FILE"
  az staticwebapp deploy \
    --name $APP \
    --resource-group $RG \
    --source $ZIP_FILE \
    --slot staging | tee -a "$LOG_FILE"
  
  # Run smoke tests
  echo -e "${YELLOW}Running smoke tests against staging...${NC}" | tee -a "$LOG_FILE"
  STAGING_URL=$(az staticwebapp show \
    --name $APP \
    --resource-group $RG \
    --query "defaultHostname" -o tsv | sed 's/\.azurestaticapps\.net/-staging.azurestaticapps.net/')
    
  # Simple smoke test
  echo -e "${YELLOW}Testing staging URL: https://$STAGING_URL${NC}" | tee -a "$LOG_FILE"
  if curl -s -f "https://$STAGING_URL" > /dev/null; then
    echo -e "${GREEN}✓ Staging site is accessible${NC}" | tee -a "$LOG_FILE"
    
    # Swap staging to production
    echo -e "${YELLOW}Swapping staging to production...${NC}" | tee -a "$LOG_FILE"
    az staticwebapp hostname swap \
      --name $APP \
      --resource-group $RG \
      --slot staging | tee -a "$LOG_FILE"
      
    echo -e "${GREEN}✓ Deployment completed and swapped to production${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}✗ Staging site is not accessible. Aborting swap.${NC}" | tee -a "$LOG_FILE"
    exit 1
  fi
else
  # Direct production deployment
  echo -e "${YELLOW}Deploying directly to production...${NC}" | tee -a "$LOG_FILE"
  
  # Create a zip package for deployment
  echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
  mkdir -p output
  cd $DEPLOY_DIR
  ZIP_FILE="../output/client360_themed_dashboard_${TIMESTAMP}.zip"
  zip -r $ZIP_FILE * | tee -a "../$LOG_FILE"
  cd ..
  
  # Deploy directly to production
  echo -e "${YELLOW}Deploying to Azure Static Web App production...${NC}" | tee -a "$LOG_FILE"
  az staticwebapp deploy \
    --name $APP \
    --resource-group $RG \
    --source $ZIP_FILE | tee -a "$LOG_FILE"
fi

# Get the production URL
PROD_URL=$(az staticwebapp show \
  --name $APP \
  --resource-group $RG \
  --query "defaultHostname" -o tsv)
  
echo -e "${GREEN}✓ Deployment complete!${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Dashboard URL: https://$PROD_URL${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Try different themes by appending ?tenant=tbwa or ?tenant=sarisari to the URL${NC}" | tee -a "$LOG_FILE"

# Create a deployment report
REPORT_FILE="reports/themed_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# Themed Client360 Dashboard Deployment Report

## Deployment Details
- **Date**: $(date)
- **Deployment Package**: $ZIP_FILE
- **Production URL**: https://$PROD_URL

## Themes Deployed
- TBWA Theme (default)
- Sari Sari Theme

## Features
- Build-time theme generation
- Runtime theme switching via URL parameter or UI
- Per-brand CSS variables and styling
- Brand-specific logos
- Geospatial map integration
- Responsive layout

## Testing
To test different themes, use these URLs:
- TBWA Theme: https://$PROD_URL?tenant=tbwa
- Sari Sari Theme: https://$PROD_URL?tenant=sarisari

## Next Steps
1. Add more brand themes as needed
2. Enhance theme-specific visualizations
3. Implement more advanced theming features

EOF

echo -e "${GREEN}✓ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"