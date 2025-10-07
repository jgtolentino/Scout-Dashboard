#!/bin/bash
# deploy_dbt_dashboard.sh - Deploy the Scout Edge Dashboard with dbt Integration

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_edge_dbt_$(date +%Y%m%d)"
TEMP_BUILD_DIR="/tmp/dashboard-build-${DEPLOY_TAG}"
AZURE_RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
AZURE_STORAGE_ACCOUNT="tbwajuicerstorage"
AZURE_BLOB_CONTAINER="data"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║   Deploy Scout Edge Dashboard with dbt Integration         ║${RESET}"
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
cp -r "$SOURCE_DIR"/* "$TEMP_BUILD_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy source files${RESET}"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
echo -e "${GREEN}Source files copied successfully${RESET}"

# 3. Generate sample data with dbt
echo -e "${BLUE}Generating sample data with dbt...${RESET}"
cd "$TEMP_BUILD_DIR/dbt_project"
./run_and_export.sh --sample
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to generate sample data${RESET}"
  cd "$SOURCE_DIR"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
cd "$TEMP_BUILD_DIR"
echo -e "${GREEN}Sample data generated successfully${RESET}"

# 4. Monitor data freshness
echo -e "${BLUE}Monitoring data freshness...${RESET}"
python3 dbt_project/scripts/monitor_freshness.py --data-dir assets/data
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some datasets may not be fresh${RESET}"
fi

# 5. Upload JSON data to Azure Blob Storage
echo -e "${BLUE}Uploading JSON data to Azure Blob Storage...${RESET}"
# Check if container exists, create if not
CONTAINER_EXISTS=$(az storage container exists --account-name "$AZURE_STORAGE_ACCOUNT" --name "$AZURE_BLOB_CONTAINER" --auth-mode login --query exists -o tsv 2>/dev/null || echo "false")
if [ "$CONTAINER_EXISTS" == "false" ]; then
  echo -e "${YELLOW}Container $AZURE_BLOB_CONTAINER does not exist, creating...${RESET}"
  az storage container create --account-name "$AZURE_STORAGE_ACCOUNT" --name "$AZURE_BLOB_CONTAINER" --auth-mode login --public-access blob
fi

# Upload data files
az storage blob upload-batch --account-name "$AZURE_STORAGE_ACCOUNT" --destination "$AZURE_BLOB_CONTAINER" --source assets/data --auth-mode login
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Failed to upload data to Azure Blob Storage${RESET}"
  echo -e "${YELLOW}Will use local data files instead${RESET}"
fi

# 6. Create Static Web App deployment package
echo -e "${BLUE}Creating deployment package...${RESET}"
PACKAGE_DIR="$TEMP_BUILD_DIR/deployment_package"
mkdir -p "$PACKAGE_DIR"

# Create a simple GitHub workflow file for Static Web Apps
mkdir -p "$PACKAGE_DIR/.github/workflows"
cat > "$PACKAGE_DIR/.github/workflows/azure-static-web-apps.yml" << EOF
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

# Copy the necessary files for deployment
cp -r retail_edge "$PACKAGE_DIR/"
cp -r assets "$PACKAGE_DIR/"
cp -r css "$PACKAGE_DIR/" 2>/dev/null || mkdir -p "$PACKAGE_DIR/css"
cp -r js "$PACKAGE_DIR/" 2>/dev/null || mkdir -p "$PACKAGE_DIR/js"
cp -r images "$PACKAGE_DIR/" 2>/dev/null || mkdir -p "$PACKAGE_DIR/images"

# Make sure we have an index.html that redirects to retail_edge_dashboard.html
cat > "$PACKAGE_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=retail_edge/retail_edge_dashboard.html">
    <title>Redirecting to Scout Edge Dashboard</title>
</head>
<body>
    <p>Redirecting to <a href="retail_edge/retail_edge_dashboard.html">Scout Edge Dashboard</a>...</p>
    <script>
        window.location.href = "retail_edge/retail_edge_dashboard.html";
    </script>
</body>
</html>
EOF

# Copy the corrected staticwebapp.config.json
cat > "$PACKAGE_DIR/staticwebapp.config.json" << EOF
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "routes": [
    {
      "route": "/retail_edge/retail_edge_dashboard.html",
      "rewrite": "/retail_edge/retail_edge_dashboard.html"
    },
    {
      "route": "/*",
      "rewrite": "/*"
    }
  ],
  "globalHeaders": {
    "X-Dashboard-Tag": "scout_edge_dbt_deployment",
    "X-Patch-ID": "dashboard-final-with-dbt-v1",
    "X-Client-Context": "TBWA-direct-only"
  }
}
EOF

# Create zip file for manual upload
ZIP_FILE="$SOURCE_DIR/scout_edge_dbt_deployment.zip"
cd "$PACKAGE_DIR"
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
echo -e "\n${BOLD}${GREEN}Deployment Complete!${RESET}"
echo -e "${YELLOW}Next steps:${RESET}"
echo -e "1. Upload $ZIP_FILE to Azure Portal for $STATIC_WEB_APP_NAME"
echo -e "2. Or deploy using the Azure CLI with:"
echo -e "   az staticwebapp create --name '$STATIC_WEB_APP_NAME' --resource-group '$AZURE_RESOURCE_GROUP' --source-file '$ZIP_FILE'"
echo -e "\n${BOLD}${GREEN}Scout Edge Dashboard with dbt Integration is ready for deployment! ✅${RESET}"