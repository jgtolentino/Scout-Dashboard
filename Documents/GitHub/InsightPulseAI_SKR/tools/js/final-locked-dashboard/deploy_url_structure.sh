#!/bin/bash
# deploy_url_structure.sh - Deploy the Scout Dashboards with clean URL structure

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_dashboard_$(date +%Y%m%d)"
TEMP_BUILD_DIR="/tmp/dashboard-build-${DEPLOY_TAG}"
AZURE_RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║   Deploy Scout Dashboards with Clean URL Structure          ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# 1. Create temporary build directory
echo -e "${BLUE}Creating temporary build directory...${RESET}"
mkdir -p "$TEMP_BUILD_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create temporary build directory${RESET}"
  exit 1
fi

# 2. Copy source files to temporary build directory
echo -e "${BLUE}Copying source files to build directory...${RESET}"
cp -r "$SOURCE_DIR"/{advisor,edge,ops,assets,css,js,images,staticwebapp.config.json,index.html} "$TEMP_BUILD_DIR/" 2>/dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy source files${RESET}"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
echo -e "${GREEN}Source files copied successfully${RESET}"

# Update staticwebapp.config.json for new URL structure
echo -e "${BLUE}Updating staticwebapp.config.json for new URL structure...${RESET}"
cat > "$TEMP_BUILD_DIR/staticwebapp.config.json" << EOF
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*", "/assets/*"]
  },
  "routes": [
    {
      "route": "/advisor",
      "rewrite": "/advisor/index.html"
    },
    {
      "route": "/edge",
      "rewrite": "/edge/index.html"
    },
    {
      "route": "/ops",
      "rewrite": "/ops/index.html"
    },
    {
      "route": "/retail_edge/retail_edge_dashboard.html",
      "redirect": "/edge",
      "statusCode": 301
    },
    {
      "route": "/insights_dashboard.html",
      "redirect": "/advisor",
      "statusCode": 301
    },
    {
      "route": "/qa.html",
      "redirect": "/ops",
      "statusCode": 301
    },
    {
      "route": "/*",
      "rewrite": "/*"
    }
  ],
  "globalHeaders": {
    "X-Dashboard-Tag": "scout_dashboards_clean_urls",
    "X-Patch-ID": "dashboard-url-structure-v1",
    "X-Client-Context": "TBWA-direct-only"
  }
}
EOF

# Create a simple GitHub workflow file for Static Web Apps
echo -e "${BLUE}Creating GitHub workflow file...${RESET}"
mkdir -p "$TEMP_BUILD_DIR/.github/workflows"
cat > "$TEMP_BUILD_DIR/.github/workflows/azure-static-web-apps.yml" << EOF
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v2
      
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: \${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: \${{ secrets.GITHUB_TOKEN }}
          app_location: "/"
          api_location: ""
          output_location: ""
          skip_app_build: true
EOF

# Create zip file for manual upload
ZIP_FILE="$SOURCE_DIR/scout_dashboards_url_structure.zip"
cd "$TEMP_BUILD_DIR"
zip -r "$ZIP_FILE" .
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create zip file${RESET}"
  cd "$SOURCE_DIR"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
cd "$SOURCE_DIR"
echo -e "${GREEN}✓ Deployment package created at $ZIP_FILE${RESET}"

# Clean up
echo -e "${BLUE}Cleaning up...${RESET}"
rm -rf "$TEMP_BUILD_DIR"

# Display final instructions
echo -e "\n${BOLD}${GREEN}Deployment Preparation Complete!${RESET}"
echo -e "${YELLOW}Next steps:${RESET}"
echo -e "1. Upload $ZIP_FILE to Azure Portal for $STATIC_WEB_APP_NAME"
echo -e "2. Or deploy using the Azure CLI with:"
echo -e "   az staticwebapp create --name '$STATIC_WEB_APP_NAME' --resource-group '$AZURE_RESOURCE_GROUP' --source-file '$ZIP_FILE'"
echo -e "\n${BOLD}${GREEN}Scout Dashboards with Clean URL Structure are ready for deployment! ✅${RESET}"