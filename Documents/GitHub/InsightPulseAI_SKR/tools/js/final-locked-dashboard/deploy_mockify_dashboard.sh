#!/bin/bash
# deploy_mockify_dashboard.sh - Deploy Scout Advanced Analytics with Mockify styling

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_mockify_v1"
TEMP_BUILD_DIR="/tmp/mockify-build-${DEPLOY_TAG}"
DEPLOY_DIR="/tmp/mockify-deploy-${DEPLOY_TAG}"
PUBLIC_DIR="$DEPLOY_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Scout Advanced Analytics Dashboard with Mockify Theme  ${RESET}"
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

# 3. Set up Project Scout Analysis section in insights_dashboard.html if it doesn't exist
echo -e "${BLUE}Adding Project Scout Analysis section to insights_dashboard.html...${RESET}"
INSIGHTS_DASHBOARD="$TEMP_BUILD_DIR/insights_dashboard.html"

# Check if the file exists before modifying
if [ -f "$INSIGHTS_DASHBOARD" ]; then
  # Check if Project Scout Analysis Overview section already exists
  if ! grep -q "project-scout-analysis" "$INSIGHTS_DASHBOARD"; then
    # Find the location to insert the new section (before the navigation links)
    INSERT_LINE=$(grep -n "View Other Dashboards" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$INSERT_LINE" ]; then
      # Get the line number of the parent row element to properly close tags
      ROW_START_LINE=$((INSERT_LINE - 3))
      
      # Create the Project Scout Analysis Overview section HTML
      PROJECT_SCOUT_HTML=$(cat << 'EOF'
    <!-- Project Scout Analysis Overview Section -->
    <div id="project-scout-analysis" class="mb-5">
      <div class="glass-panel">
        <div class="card-header bg-white">
          <h4 class="analytics-title">Project Scout Analysis Overview</h4>
          <div class="badge badge-primary">Market Intelligence</div>
        </div>
        <div class="card-body">
          <!-- Analytics Categories -->
          <div class="analytics-grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-blue">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-label">Customer Profile</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-chart-line"></i> Purchase patterns</li>
                <li><i class="fas fa-heart"></i> Brand loyalty metrics</li>
                <li><i class="fas fa-globe"></i> Cultural influence</li>
              </ul>
            </div>
            
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-green">
                <i class="fas fa-store"></i>
              </div>
              <div class="stat-label">Store Performance</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-map-marker-alt"></i> Regional analysis</li>
                <li><i class="fas fa-expand"></i> Store size impact</li>
                <li><i class="fas fa-clock"></i> Peak transaction times</li>
              </ul>
            </div>
            
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-orange">
                <i class="fas fa-box-open"></i>
              </div>
              <div class="stat-label">Product Intelligence</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-puzzle-piece"></i> Bundle effectiveness</li>
                <li><i class="fas fa-tags"></i> Category performance</li>
                <li><i class="fas fa-barcode"></i> SKU-level patterns</li>
              </ul>
            </div>
            
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-red">
                <i class="fas fa-brain"></i>
              </div>
              <div class="stat-label">Advanced Analytics</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-shopping-basket"></i> Market basket</li>
                <li><i class="fas fa-chart-line"></i> Demand forecasting</li>
                <li><i class="fas fa-percentage"></i> Promotional impact</li>
              </ul>
            </div>
          </div>
          
          <!-- SQL Analytics Dashboard -->
          <div id="analytics-dashboard-container"></div>
        </div>
      </div>
    </div>
    
EOF
)
      
      # Insert the Project Scout Analysis section before the navigation links row
      sed -i '' "${ROW_START_LINE}i\\
${PROJECT_SCOUT_HTML}
" "$INSIGHTS_DASHBOARD"
      
      echo -e "${GREEN}Added Project Scout Analysis Overview section to insights_dashboard.html${RESET}"
    else
      echo -e "${YELLOW}Could not find insertion point in insights_dashboard.html${RESET}"
    fi
  else
    echo -e "${YELLOW}Project Scout Analysis section already exists in insights_dashboard.html${RESET}"
  fi
  
  # Add script and CSS references if they don't exist
  if ! grep -q "mockify-style.css" "$INSIGHTS_DASHBOARD"; then
    # Find the head closing tag to insert CSS reference before it
    CSS_INSERT_LINE=$(grep -n "</head>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$CSS_INSERT_LINE" ]; then
      sed -i '' "${CSS_INSERT_LINE}i\\
  <!-- Mockify Theme Styles -->\\
  <link rel=\"stylesheet\" href=\"css/mockify-style.css\">
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added Mockify CSS reference to insights_dashboard.html${RESET}"
    fi
  fi
  
  if ! grep -q "dashboard_sql_component.js" "$INSIGHTS_DASHBOARD"; then
    # Find the script section to insert script reference in the appropriate place
    SCRIPT_INSERT_LINE=$(grep -n "<script src=\"js/insights_visualizer.js\"></script>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$SCRIPT_INSERT_LINE" ]; then
      sed -i '' "${SCRIPT_INSERT_LINE}a\\
  <!-- Project Scout Analytics -->\\
  <script src=\"dashboard_sql_component.js\"></script>
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added SQL Analytics script references to insights_dashboard.html${RESET}"
    fi
  fi

  # Update page title to include "Market Intelligence"
  if ! grep -q "Scout Advanced Analytics (Market Intelligence)" "$INSIGHTS_DASHBOARD"; then
    # Find the title tag
    TITLE_LINE=$(grep -n "<title>Scout Advanced Analytics</title>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$TITLE_LINE" ]; then
      sed -i '' "${TITLE_LINE}s|<title>Scout Advanced Analytics</title>|<title>Scout Advanced Analytics (Market Intelligence)</title>|" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Updated page title in insights_dashboard.html${RESET}"
    fi
    
    # Update the header title as well
    HEADER_LINE=$(grep -n "<span>Scout Advanced Analytics</span>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$HEADER_LINE" ]; then
      sed -i '' "${HEADER_LINE}s|<span>Scout Advanced Analytics</span>|<span>Scout Advanced Analytics (Market Intelligence)</span>|" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Updated header title in insights_dashboard.html${RESET}"
    fi
  fi
else
  echo -e "${RED}insights_dashboard.html not found!${RESET}"
fi

# Make sure CSS directory exists
mkdir -p "$TEMP_BUILD_DIR/css"
echo -e "${GREEN}Mockify theme setup complete${RESET}"

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
  "mockifyTheme": true,
  "projectScoutAnalytics": true,
  "endpoints": {
    "customer-profile": "/api/customer-profile",
    "store-performance": "/api/store-performance",
    "product-intelligence": "/api/product-intelligence",
    "advanced-analytics": "/api/advanced-analytics"
  },
  "defaultStore": "all",
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
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Scout Advanced Analytics with Mockify Theme)"
fi

# 11. Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployment Tag: ${DEPLOY_TAG}"
echo -e ""
echo -e "${BOLD}${BLUE}Mockify Theme Features:${RESET}"
echo -e "  - Modern, clean UI from mockify-creator repository"
echo -e "  - Glass panel design elements"
echo -e "  - Enhanced card transitions and hover effects"
echo -e "  - Cohesive color scheme with TBWA and Azure design systems"
echo -e "  - Responsive layout for all screen sizes"
echo -e ""
echo -e "${BOLD}${BLUE}Project Scout Analysis Features:${RESET}"
echo -e "  - Project Scout Analysis Overview dashboard section"
echo -e "  - Four main analytics categories:"
echo -e "    1. Customer Profile Analysis"
echo -e "    2. Store Performance Analytics"
echo -e "    3. Product Intelligence"
echo -e "    4. Advanced Analytics"
echo -e "  - SQL data visualization with charts"
echo -e ""
echo -e "${BOLD}${GREEN}Deployment Log:${RESET}"
echo -e "patch_id: mockify_theme_project_scout_v1"
echo -e "Log timestamp: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${BOLD}${GREEN}Scout Advanced Analytics with Mockify Theme Deployment Complete! ✅${RESET}"