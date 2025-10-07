#!/bin/bash
# deploy_locked_dashboard.sh - Deploy the final locked dashboard structure to Azure Static Web Apps

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="dashboard_scope_locked_v4"
TEMP_BUILD_DIR="/tmp/dashboard-build-${DEPLOY_TAG}"
DEPLOY_DIR="/tmp/dashboard-deploy-${DEPLOY_TAG}"
PUBLIC_DIR="$DEPLOY_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Locked Dashboard Structure (v4) - System Architecture ${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Create index.html that redirects to qa.html
echo -e "${BLUE}Creating index.html redirect...${RESET}"
cat > "$SOURCE_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=qa.html">
    <title>Redirecting to System Architecture & QA Dashboard</title>
</head>
<body>
    <p>Redirecting to <a href="qa.html">System Architecture & QA Dashboard</a>...</p>
    <script>
        window.location.href = "qa.html";
    </script>
</body>
</html>
EOF
echo -e "${GREEN}Created index.html redirect${RESET}"

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
# Remove ops directory as it's being decommissioned
rm -rf "$TEMP_BUILD_DIR/ops"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy source files${RESET}"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
echo -e "${GREEN}Source files copied successfully${RESET}"

# 3. Set up SQL Analytics dependencies
echo -e "${BLUE}Setting up SQL Analytics dependencies...${RESET}"

# Create the SQL Analytics section in retail_edge_dashboard.html if it doesn't exist
echo -e "${BLUE}Adding SQL Analytics section to retail_edge_dashboard.html...${RESET}"
RETAIL_DASHBOARD="$TEMP_BUILD_DIR/retail_edge/retail_edge_dashboard.html"

# Check if the file exists before modifying
if [ -f "$RETAIL_DASHBOARD" ]; then
  # Check if SQL Analytics section already exists
  if ! grep -q "analytics-dashboard-container" "$RETAIL_DASHBOARD"; then
    # Find the main content container closing div to insert before it
    INSERT_LINE=$(grep -n "</main>" "$RETAIL_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$INSERT_LINE" ]; then
      # Create the SQL Analytics section HTML
      SQL_ANALYTICS_HTML=$(cat << 'EOF'
    <!-- SQL Analytics Dashboard Section -->
    <section class="dashboard-section" id="sql-analytics-section">
      <div class="section-header">
        <h2><i class="fas fa-chart-line"></i> Advanced Analytics</h2>
        <p>Explore detailed sales and customer data analytics</p>
      </div>
      
      <div class="card">
        <div class="card-body">
          <div id="analytics-dashboard-container"></div>
        </div>
      </div>
    </section>
    
EOF
)
      
      # Insert the SQL Analytics section before the closing main tag
      sed -i '' "${INSERT_LINE}i\\
${SQL_ANALYTICS_HTML}
" "$RETAIL_DASHBOARD"
      
      echo -e "${GREEN}Added SQL Analytics section to retail_edge_dashboard.html${RESET}"
    else
      echo -e "${YELLOW}Could not find insertion point in retail_edge_dashboard.html${RESET}"
    fi
  else
    echo -e "${YELLOW}SQL Analytics section already exists in retail_edge_dashboard.html${RESET}"
  fi
  
  # Add script and CSS references if they don't exist
  if ! grep -q "analytics-dashboard.css" "$RETAIL_DASHBOARD"; then
    # Find the head closing tag to insert CSS reference before it
    CSS_INSERT_LINE=$(grep -n "</head>" "$RETAIL_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$CSS_INSERT_LINE" ]; then
      sed -i '' "${CSS_INSERT_LINE}i\\
    <!-- SQL Analytics Dashboard Styles -->\\
    <link rel=\"stylesheet\" href=\"../css/analytics-dashboard.css\">
" "$RETAIL_DASHBOARD"
      echo -e "${GREEN}Added SQL Analytics CSS reference to retail_edge_dashboard.html${RESET}"
    fi
  fi
  
  if ! grep -q "dashboard_sql_component.js" "$RETAIL_DASHBOARD"; then
    # Find the body closing tag to insert script reference before it
    SCRIPT_INSERT_LINE=$(grep -n "</body>" "$RETAIL_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$SCRIPT_INSERT_LINE" ]; then
      sed -i '' "${SCRIPT_INSERT_LINE}i\\
    <!-- Chart.js for SQL Analytics -->\\
    <script src=\"https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js\"></script>\\
    <!-- SQL Analytics Dashboard Component -->\\
    <script src=\"../dashboard_sql_component.js\"></script>
" "$RETAIL_DASHBOARD"
      echo -e "${GREEN}Added SQL Analytics script references to retail_edge_dashboard.html${RESET}"
    fi
  fi
else
  echo -e "${RED}retail_edge_dashboard.html not found!${RESET}"
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

# 6. Create a minimal staticwebapp.config.json if it doesn't exist
if [ ! -f "$PUBLIC_DIR/staticwebapp.config.json" ]; then
  echo -e "${BLUE}Creating staticwebapp.config.json...${RESET}"
  cat > "$PUBLIC_DIR/staticwebapp.config.json" << EOF
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "routes": [
    {
      "route": "/ops/system_dashboard.html",
      "redirect": "/qa.html",
      "statusCode": 301
    },
    {
      "route": "/dashboards/*",
      "redirect": "/qa.html",
      "statusCode": 301
    },
    {
      "route": "/qa.html",
      "allowedRoles": ["authenticated", "internal"]
    },
    {
      "route": "/insights_dashboard.html",
      "allowedRoles": ["authenticated", "internal"]
    },
    {
      "route": "/retail_edge/retail_edge_dashboard.html",
      "serve": "/retail_edge/retail_edge_dashboard.html",
      "statusCode": 200
    },
    {
      "route": "/*",
      "serve": "/*",
      "statusCode": 200
    }
  ],
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  },
  "responseOverrides": {
    "401": {
      "redirect": "/retail_edge/retail_edge_dashboard.html",
      "statusCode": 302
    }
  },
  "platform": {
    "apiRuntime": "node:16"
  },
  "globalHeaders": {
    "X-Dashboard-Tag": "${DEPLOY_TAG}",
    "X-Patch-ID": "dashboard-final-alignment-sql-v4",
    "X-Client-Context": "TBWA-direct-only"
  }
}
EOF
  echo -e "${GREEN}Created staticwebapp.config.json${RESET}"
fi

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

# 8. Update the API configuration for SQL data (simulated for this example)
echo -e "${BLUE}Creating API configuration for SQL data...${RESET}"
mkdir -p "$PUBLIC_DIR/api"
cat > "$PUBLIC_DIR/api/config.json" << EOF
{
  "sqlConnectionEnabled": true,
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

# 9. Navigate to deployment directory and run SWA deployment
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

# 10. Clean up
echo -e "\n${BLUE}Cleaning up temporary directories...${RESET}"
rm -rf "$TEMP_BUILD_DIR"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}Cleanup complete${RESET}"

# 11. Display Static Web App URL
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
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}${RESET} (Redirects to QA Dashboard)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/qa.html${RESET} (System Architecture & QA)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Scout Advanced Analytics)"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/retail_edge/retail_edge_dashboard.html${RESET} (Retail Advisor with SQL Analytics)"
fi

# 12. Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployment Tag: ${DEPLOY_TAG}"
echo -e "Deployed Pages:"
echo -e "  - System Architecture & QA (/qa.html) - ${YELLOW}INTERNAL ONLY${RESET}"
echo -e "  - Scout Advanced Analytics (/insights_dashboard.html) - ${YELLOW}INTERNAL ONLY${RESET}"
echo -e "  - Retail Advisor (/retail_edge/retail_edge_dashboard.html) - ${GREEN}CLIENT-FACING${RESET}"
echo -e ""
echo -e "${BOLD}${BLUE}New Features:${RESET}"
echo -e "  - SQL Analytics Dashboard integration in Retail Advisor"
echo -e "  - Customer Profile Analysis"
echo -e "  - Store Performance Analysis"
echo -e "  - Product Intelligence"
echo -e "  - Advanced Analytics with forecasting capabilities"
echo -e ""
echo -e "${BOLD}${BLUE}Client Context:${RESET}"
echo -e "  - TBWA is our direct client"
echo -e "  - Only Retail Advisor dashboard should be shared with TBWA clients"
echo -e "  - Access controls are configured for internal dashboards"
echo -e "  - All deployments are white-labeled for TBWA's downstream clients"
echo -e ""
echo -e "${BOLD}${GREEN}Deployment Log:${RESET}"
echo -e "patch_id: dashboard-final-alignment-sql-v4"
echo -e "Log timestamp: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${BOLD}${GREEN}Dashboard Consolidation Complete with SQL Analytics Integration! ✅${RESET}"