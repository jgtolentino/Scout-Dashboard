#!/bin/bash
# deploy_insights_dashboard.sh - Deploy Scout Advanced Analytics with SQL data integration

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_analytics_v1"
TEMP_BUILD_DIR="/tmp/analytics-build-${DEPLOY_TAG}"
DEPLOY_DIR="/tmp/analytics-deploy-${DEPLOY_TAG}"
PUBLIC_DIR="$DEPLOY_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Scout Advanced Analytics Dashboard with SQL Integration  ${RESET}"
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

# 3. Set up SQL Analytics dependencies
echo -e "${BLUE}Setting up SQL Analytics dependencies...${RESET}"

# Create the SQL Analytics section in insights_dashboard.html if it doesn't exist
echo -e "${BLUE}Adding SQL Analytics section to insights_dashboard.html...${RESET}"
INSIGHTS_DASHBOARD="$TEMP_BUILD_DIR/insights_dashboard.html"

# Check if the file exists before modifying
if [ -f "$INSIGHTS_DASHBOARD" ]; then
  # Check if Project Scout Analysis Overview section already exists
  if ! grep -q "analytics-dashboard-container" "$INSIGHTS_DASHBOARD"; then
    # Find the location to insert the new section (before the navigation links)
    INSERT_LINE=$(grep -n "View Other Dashboards" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$INSERT_LINE" ]; then
      # Get the line number of the parent row element to properly close tags
      ROW_START_LINE=$((INSERT_LINE - 3))
      
      # Create the Project Scout Analysis Overview section HTML
      SQL_ANALYTICS_HTML=$(cat << 'EOF'
    <!-- Project Scout Analysis Overview Section -->
    <h4 class="mb-3">Project Scout Analysis Overview</h4>
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">SQL Data Analytics</h5>
            <span class="badge bg-primary">Advanced</span>
          </div>
          <div class="card-body">
            <div id="analytics-dashboard-container"></div>
          </div>
        </div>
      </div>
    </div>
    
EOF
)
      
      # Insert the SQL Analytics section before the navigation links row
      sed -i '' "${ROW_START_LINE}i\\
${SQL_ANALYTICS_HTML}
" "$INSIGHTS_DASHBOARD"
      
      echo -e "${GREEN}Added Project Scout Analysis Overview section to insights_dashboard.html${RESET}"
    else
      echo -e "${YELLOW}Could not find insertion point in insights_dashboard.html${RESET}"
    fi
  else
    echo -e "${YELLOW}SQL Analytics section already exists in insights_dashboard.html${RESET}"
  fi
  
  # Add script and CSS references if they don't exist
  if ! grep -q "analytics-dashboard.css" "$INSIGHTS_DASHBOARD"; then
    # Find the head closing tag to insert CSS reference before it
    CSS_INSERT_LINE=$(grep -n "</head>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$CSS_INSERT_LINE" ]; then
      sed -i '' "${CSS_INSERT_LINE}i\\
  <!-- SQL Analytics Dashboard Styles -->\\
  <link rel=\"stylesheet\" href=\"css/analytics-dashboard.css\">
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added SQL Analytics CSS reference to insights_dashboard.html${RESET}"
    fi
  fi
  
  if ! grep -q "dashboard_sql_component.js" "$INSIGHTS_DASHBOARD"; then
    # Find the script section to insert script reference in the appropriate place
    SCRIPT_INSERT_LINE=$(grep -n "<script src=\"js/insights_visualizer.js\"></script>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$SCRIPT_INSERT_LINE" ]; then
      sed -i '' "${SCRIPT_INSERT_LINE}a\\
  <script src=\"dashboard_sql_component.js\"></script>
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added SQL Analytics script references to insights_dashboard.html${RESET}"
    fi
  fi
else
  echo -e "${RED}insights_dashboard.html not found!${RESET}"
fi

# Make sure CSS directory exists
mkdir -p "$TEMP_BUILD_DIR/css"
echo -e "${GREEN}SQL Analytics dependencies set up successfully${RESET}"

# 4. Create deployment directory structure
echo -e "${BLUE}Creating deployment directory structure...${RESET}"
mkdir -p "$PUBLIC_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment directory structure${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# 5. Copy built files to deployment directory
echo -e "${BLUE}Copying built files to deployment directory...${RESET}"
cp -r "$TEMP_BUILD_DIR"/* "$PUBLIC_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy built files to deployment directory${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi
echo -e "${GREEN}Built files copied successfully${RESET}"

# 6. Create the API configuration for SQL data (simulated for this example)
echo -e "${BLUE}Creating API configuration for SQL data...${RESET}"
mkdir -p "$PUBLIC_DIR/api"
cat > "$PUBLIC_DIR/api/config.json" << EOF
{
  "sqlConnectionEnabled": true,
  "projectScoutAnalytics": true,
  "endpoints": {
    "store-transactions": "/api/store-transactions",
    "store-daily-sales": "/api/store-daily-sales",
    "store-sessions": "/api/store-sessions",
    "store-traffic": "/api/store-traffic",
    "store-products": "/api/store-products"
  },
  "defaultStore": 112,
  "defaultDateRange": 30
}
EOF
echo -e "${GREEN}Created API configuration for SQL data${RESET}"

# 7. Create a minimal swa-cli.config.json in the deploy directory
echo -e "${BLUE}Creating swa-cli.config.json...${RESET}"
cat > "$DEPLOY_DIR/swa-cli.config.json" << EOF
{
  "configurations": {
    "app": {
      "outputLocation": "./public",
      "appLocation": "."
    }
  }
}
EOF
echo -e "${GREEN}Created swa-cli.config.json${RESET}"

# 8. Navigate to deployment directory and run SWA deployment
echo -e "\n${BLUE}Deploying to Azure Static Web App...${RESET}"
cd "$DEPLOY_DIR"
echo -e "${YELLOW}Current directory: $(pwd)${RESET}"
echo -e "${YELLOW}Directory contents:${RESET}"
ls -la

# Check for Azure CLI first
if ! command -v az &> /dev/null; then
  echo -e "${RED}Azure CLI (az) not found. Please install Azure CLI first.${RESET}"
  echo -e "${YELLOW}Visit https://docs.microsoft.com/en-us/cli/azure/install-azure-cli for installation instructions.${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# Verify Azure login
az account show &> /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Not logged into Azure. Running az login...${RESET}"
  az login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Azure. Deployment aborted.${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

# Check for SWA CLI
if ! command -v swa &> /dev/null; then
  echo -e "${YELLOW}Azure Static Web Apps CLI not found. Installing...${RESET}"
  npm install -g @azure/static-web-apps-cli
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Azure Static Web Apps CLI${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

# Deploy using SWA CLI
echo -e "${BLUE}Running SWA deployment...${RESET}"
echo -e "${YELLOW}Using deployment tag: ${DEPLOY_TAG}${RESET}"
swa deploy ./public \
  --deployment-token $(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv) \
  --env production

# Check deployment result
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy to Azure Static Web App${RESET}"
  echo -e "${YELLOW}Trying alternative deployment method...${RESET}"
  
  # Alternative deployment method using az staticwebapp
  echo -e "${BLUE}Attempting deployment with az staticwebapp...${RESET}"
  RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
  STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
  DEPLOYMENT_TOKEN=$(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv)
  
  az staticwebapp deploy \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --source "./public" \
    --token "$DEPLOYMENT_TOKEN" \
    --no-build
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Both deployment methods failed${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

echo -e "${GREEN}Deployment completed!${RESET}"

# 9. Clean up
echo -e "\n${BLUE}Cleaning up temporary directories...${RESET}"
rm -rf "$TEMP_BUILD_DIR"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}Cleanup complete${RESET}"

# 10. Display Static Web App URL
echo -e "\n${BLUE}Getting Static Web App URL...${RESET}"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
STATIC_WEB_APP_URL=$(az staticwebapp show \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Static Web App URL${RESET}"
else
  echo -e "${GREEN}Static Web App URL: https://${STATIC_WEB_APP_URL}${RESET}"
  echo -e "${BLUE}Available pages:${RESET}"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Scout Advanced Analytics with SQL Data Integration)"
fi

# 11. Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployment Tag: ${DEPLOY_TAG}"
echo -e ""
echo -e "${BOLD}${BLUE}SQL Analytics Integration Features:${RESET}"
echo -e "  - Project Scout Analysis Overview dashboard section"
echo -e "  - Four main analytics categories based on the Analysis Overview document:"
echo -e "    1. Customer Profile Analysis"
echo -e "    2. Store Performance Analytics"
echo -e "    3. Product Intelligence"
echo -e "    4. Advanced Analytics"
echo -e "  - Interactive filtering and data exploration"
echo -e "  - SQL database query capabilities"
echo -e "  - Data visualization with charts and insights"
echo -e ""
echo -e "${BOLD}${GREEN}Deployment Log:${RESET}"
echo -e "patch_id: scout_analytics_sql_v1"
echo -e "Log timestamp: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${BOLD}${GREEN}Scout Advanced Analytics Dashboard Update Complete! ✅${RESET}"