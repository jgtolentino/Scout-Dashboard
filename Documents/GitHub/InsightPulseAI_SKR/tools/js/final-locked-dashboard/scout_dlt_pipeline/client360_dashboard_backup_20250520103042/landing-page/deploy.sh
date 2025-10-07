#!/bin/bash
# Deploy both landing pages to Azure Static Web Apps

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="../output"
DEPLOY_DIR="landing_page_deploy_${TIMESTAMP}"
LOG_FILE="../logs/landing_page_deploy_${TIMESTAMP}.log"
ZIP_FILE="${OUTPUT_DIR}/client360_landing_pages_${TIMESTAMP}.zip"
APP_NAME="tbwa-client360-landing-page"
RESOURCE_GROUP="scout-dashboard"

# Make sure directories exist
mkdir -p ../logs ${OUTPUT_DIR} ${DEPLOY_DIR}

echo -e "${GREEN}Starting Client360 landing pages deployment process...${NC}" | tee -a "$LOG_FILE"

# Step 1: Create deployment directory with all necessary files
echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"

# Copy the full-featured landing page
cp -r index.html css images ${DEPLOY_DIR}/

# Copy the streamlined landing page as a separate file
cp client-360.html ${DEPLOY_DIR}/

# Create an index page that links to both versions
cat > "${DEPLOY_DIR}/landing-options.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard Landing Page Options</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      color: #0056FF;
      margin-bottom: 40px;
    }
    .options {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
    }
    .option {
      flex: 1;
      min-width: 300px;
      border: 1px solid #eee;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,.06);
    }
    h2 {
      margin-top: 0;
      color: #0056FF;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #0056FF;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 500;
      margin-top: 10px;
    }
    .button.secondary {
      background-color: #FFD300;
      color: black;
    }
  </style>
</head>
<body>
  <h1>Client360 Dashboard Landing Page Options</h1>
  
  <div class="options">
    <div class="option">
      <h2>Full-Featured Landing Page</h2>
      <p>A comprehensive marketing page with responsive design, interactive components, contact form, and detailed feature breakdown.</p>
      <p><strong>Best for:</strong> Primary marketing site, lead generation</p>
      <a href="index.html" class="button">View Full Landing Page</a>
    </div>
    
    <div class="option">
      <h2>Copy-Paste-Ready Landing Page</h2>
      <p>A streamlined, minimal-dependency page with clean HTML, professional copy by Kath, and built-in TBWA styling.</p>
      <p><strong>Best for:</strong> CMS embedding, quick deployment</p>
      <a href="client-360.html" class="button secondary">View Streamlined Page</a>
    </div>
  </div>
</body>
</html>
EOF

# Create Azure Static Web App configuration
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}" | tee -a "$LOG_FILE"

cat > "${DEPLOY_DIR}/staticwebapp.config.json" << EOF
{
  "routes": [
    {
      "route": "/",
      "rewrite": "/landing-options.html"
    },
    {
      "route": "/client360",
      "rewrite": "/client-360.html"
    },
    {
      "route": "/full",
      "rewrite": "/index.html"
    }
  ],
  "navigationFallback": {
    "rewrite": "/landing-options.html",
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".css": "text/css",
    ".js": "text/javascript",
    ".html": "text/html",
    ".svg": "image/svg+xml"
  }
}
EOF

# Create README in the deployment package
cat > "${DEPLOY_DIR}/README.md" << EOF
# Client360 Dashboard Landing Pages

This package contains two landing page options for the TBWA Client360 Dashboard:

1. **Full-Featured Landing Page** (index.html)
   - Comprehensive marketing page with advanced features
   - Access at: /full

2. **Copy-Paste-Ready Landing Page** (client-360.html)
   - Streamlined version with Kath's professional copy
   - Access at: /client360

The default route (/) shows a selection page with links to both options.

Deployed on: ${TIMESTAMP}
EOF

# Create deployment package
echo -e "${YELLOW}Creating deployment zip file...${NC}" | tee -a "$LOG_FILE"
cd "${DEPLOY_DIR}"
zip -r "../${ZIP_FILE}" * | tee -a "../${LOG_FILE}"
cd ..

echo -e "${GREEN}✅ Deployment package created: ${ZIP_FILE}${NC}" | tee -a "$LOG_FILE"

# Check if SWA CLI is installed
if command -v swa &> /dev/null; then
  echo -e "${YELLOW}Deploying to Azure Static Web Apps using SWA CLI...${NC}" | tee -a "$LOG_FILE"
  
  # Try to get deployment token
  DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name $APP_NAME --resource-group $RESOURCE_GROUP --query properties.apiKey -o tsv 2>/dev/null)
  
  if [ -n "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${YELLOW}Deploying with deployment token...${NC}" | tee -a "$LOG_FILE"
    swa deploy ${DEPLOY_DIR} --env production --deployment-token $DEPLOYMENT_TOKEN
    DEPLOY_URL=$(az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv 2>/dev/null)
    
    if [ -n "$DEPLOY_URL" ]; then
      echo -e "${GREEN}✅ Landing pages deployed to: https://${DEPLOY_URL}${NC}" | tee -a "$LOG_FILE"
      echo -e "${YELLOW}Access full version at: https://${DEPLOY_URL}/full${NC}" | tee -a "$LOG_FILE"
      echo -e "${YELLOW}Access streamlined version at: https://${DEPLOY_URL}/client360${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "${YELLOW}Deployment completed, but couldn't retrieve the URL.${NC}" | tee -a "$LOG_FILE"
    fi
  else
    echo -e "${YELLOW}No deployment token found. Package is ready for manual deployment.${NC}" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
    echo -e "swa deploy ${DEPLOY_DIR} --env production --deployment-token YOUR_DEPLOYMENT_TOKEN" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${YELLOW}SWA CLI not found. Package is ready for manual deployment.${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}To deploy with Azure CLI, run:${NC}" | tee -a "$LOG_FILE"
  echo -e "az staticwebapp deploy --source ${ZIP_FILE} --app-name ${APP_NAME} --resource-group ${RESOURCE_GROUP}" | tee -a "$LOG_FILE"
fi

# Create deployment summary
SUMMARY_FILE="../reports/landing_pages_deployment_${TIMESTAMP}.md"
mkdir -p ../reports

cat > "${SUMMARY_FILE}" << EOF
# Client360 Landing Pages Deployment Summary

## Deployment Details
- **Date**: $(date)
- **Deployment Package**: ${ZIP_FILE}
- **Deployment Directory**: ${DEPLOY_DIR}

## Landing Page Options

### 1. Full-Featured Landing Page
- **File**: index.html
- **URL**: https://YOUR_DEPLOY_URL/full
- **Features**: Responsive design, interactive components, contact form

### 2. Copy-Paste-Ready Landing Page
- **File**: client-360.html
- **URL**: https://YOUR_DEPLOY_URL/client360
- **Features**: Clean HTML, professional copy, minimal dependencies

## Access
- **Selection Page**: https://YOUR_DEPLOY_URL/
- **Log File**: ${LOG_FILE}

## Next Steps
1. Replace YOUR_DEPLOY_URL with your actual deployment URL
2. Update dashboard preview links in both landing pages
3. Test all page components on different devices
4. Set up analytics to track which landing page performs better
EOF

echo -e "${GREEN}✅ Deployment summary created: ${SUMMARY_FILE}${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Client360 landing pages deployment process completed!${NC}" | tee -a "$LOG_FILE"