#!/bin/bash
# Deploy Danno Dashboard (renamed from Client360)
# This script deploys the dashboard with updated branding to the preview environment

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
DEPLOYMENT_URL="blue-coast-0acb6880f-preview.eastus2.6.azurestaticapps.net"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/danno_deploy_${TIMESTAMP}.log"
DEPLOY_DIR="deploy-danno"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}Building and deploying Danno Dashboard to Azure Preview Environment${NC}" | tee -a "$LOG_FILE"

# Create deploy directory if it doesn't exist
if [ -d "$DEPLOY_DIR" ]; then
  echo -e "${YELLOW}Removing existing $DEPLOY_DIR directory...${NC}" | tee -a "$LOG_FILE"
  rm -rf "$DEPLOY_DIR"
fi

echo -e "${YELLOW}Creating fresh $DEPLOY_DIR directory...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$DEPLOY_DIR"

# Copy from existing deploy directory if it exists
if [ -d "deploy" ]; then
  echo -e "${YELLOW}Copying from existing deploy directory...${NC}" | tee -a "$LOG_FILE"
  cp -r deploy/* "$DEPLOY_DIR/" || echo "No files to copy"
else
  echo -e "${RED}Deploy directory not found. Creating basic structure...${NC}" | tee -a "$LOG_FILE"
  
  # Create basic structure
  mkdir -p "$DEPLOY_DIR/css"
  mkdir -p "$DEPLOY_DIR/js"
  mkdir -p "$DEPLOY_DIR/assets"
  mkdir -p "$DEPLOY_DIR/data"
  
  # Create basic index.html if needed
  if [ ! -f "$DEPLOY_DIR/index.html" ]; then
    echo -e "${YELLOW}Creating basic index.html...${NC}" | tee -a "$LOG_FILE"
    cat > "$DEPLOY_DIR/index.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Danno</title>
  <link rel="stylesheet" href="/css/tbwa-theme.css">
</head>
<body class="tbwa-branded">
  <header class="header">
    <div class="container">
      <h1>Danno</h1>
      <p class="subtitle">Powered by TBWA\</p>
    </div>
  </header>
  
  <main class="main-content">
    <div class="container">
      <div class="dashboard-container">
        <h2>Dashboard</h2>
        <div class="dashboard-content">
          <p>Loading dashboard content...</p>
        </div>
      </div>
    </div>
  </main>
  
  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 TBWA\Danno. All rights reserved.</p>
    </div>
  </footer>
  
  <script src="/js/dashboard.js"></script>
</body>
</html>
EOL
  fi
  
  # Create basic CSS
  if [ ! -f "$DEPLOY_DIR/css/tbwa-theme.css" ]; then
    echo -e "${YELLOW}Creating basic tbwa-theme.css...${NC}" | tee -a "$LOG_FILE"
    cat > "$DEPLOY_DIR/css/tbwa-theme.css" << EOL
/* TBWA Theme for Danno Dashboard */
:root {
  --color-primary: #002B80; /* TBWA navy */
  --color-secondary: #00C3EC; /* TBWA cyan */
  --color-danger: #E60028; /* TBWA red */
  --color-success: #00A551; /* TBWA green */
  --color-light: #f8f9fa;
  --color-dark: #4B4F56;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  --font-family-base: 'Helvetica Neue', Arial, sans-serif;
}

body {
  font-family: var(--font-family-base);
  margin: 0;
  padding: 0;
  background-color: var(--color-light);
  color: var(--color-dark);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.header {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md) 0;
  border-bottom: 3px solid var(--color-secondary);
}

.subtitle {
  color: var(--color-secondary);
}

.footer {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md) 0;
  margin-top: var(--spacing-xl);
  border-top: 3px solid var(--color-secondary);
}

.main-content {
  padding: var(--spacing-lg) 0;
}

.dashboard-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}
EOL
  fi
  
  # Create basic JS
  if [ ! -f "$DEPLOY_DIR/js/dashboard.js" ]; then
    echo -e "${YELLOW}Creating basic dashboard.js...${NC}" | tee -a "$LOG_FILE"
    cat > "$DEPLOY_DIR/js/dashboard.js" << EOL
/**
 * Danno Dashboard JavaScript
 */
(function() {
  // Initialize the dashboard
  function initDashboard() {
    document.querySelector('.dashboard-content').innerHTML = '<h3>Welcome to Danno</h3><p>Dashboard initialized successfully.</p>';
    console.log('Danno dashboard initialized');
  }
  
  // Load event listener
  window.addEventListener('load', initDashboard);
})();
EOL
  fi
fi

# Update HTML and Config files to rename from Client360 to Danno
echo -e "${YELLOW}Updating files to rename from Client360 to Danno...${NC}" | tee -a "$LOG_FILE"

# Update index.html if it exists
if [ -f "$DEPLOY_DIR/index.html" ]; then
  echo -e "${YELLOW}Updating index.html...${NC}" | tee -a "$LOG_FILE"
  sed -i '.bak' 's/Client360 Dashboard/Danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/CLIENT360 DASHBOARD/DANNO/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/client360 dashboard/Danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/Client360/Danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/client360/danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/CLIENT360/DANNO/g' "$DEPLOY_DIR/index.html"
fi

# Update any JavaScript files
for js_file in "$DEPLOY_DIR/js"/*.js; do
  if [ -f "$js_file" ]; then
    echo -e "${YELLOW}Updating $js_file...${NC}" | tee -a "$LOG_FILE"
    sed -i '.bak' 's/Client360 Dashboard/Danno/g' "$js_file"
    sed -i '.bak' 's/CLIENT360 DASHBOARD/DANNO/g' "$js_file"
    sed -i '.bak' 's/client360 dashboard/Danno/g' "$js_file"
    sed -i '.bak' 's/Client360/Danno/g' "$js_file"
    sed -i '.bak' 's/client360/danno/g' "$js_file"
    sed -i '.bak' 's/CLIENT360/DANNO/g' "$js_file"
  fi
done

# Create a SWA config file if it doesn't exist
if [ ! -f "$DEPLOY_DIR/staticwebapp.config.json" ]; then
  echo -e "${YELLOW}Creating staticwebapp.config.json...${NC}" | tee -a "$LOG_FILE"
  cat > "$DEPLOY_DIR/staticwebapp.config.json" << EOL
{
  "routes": [
    {
      "route": "/danno",
      "serve": "/index.html",
      "statusCode": 200
    },
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
EOL
else
  echo -e "${YELLOW}Updating staticwebapp.config.json...${NC}" | tee -a "$LOG_FILE"
  sed -i '.bak' 's/Client360 Dashboard/Danno/g' "$DEPLOY_DIR/staticwebapp.config.json"
  
  # Add route for /danno if it doesn't exist
  if ! grep -q '"/danno"' "$DEPLOY_DIR/staticwebapp.config.json"; then
    sed -i '.bak' '/"routes": \[/a \
    {\
      "route": "/danno",\
      "serve": "/index.html",\
      "statusCode": 200\
    },' "$DEPLOY_DIR/staticwebapp.config.json"
  fi
fi

# Clean up backup files
find "$DEPLOY_DIR" -name "*.bak" -delete

# Create a package.json for the deployment if it doesn't exist
if [ ! -f "$DEPLOY_DIR/package.json" ]; then
  echo -e "${YELLOW}Creating package.json...${NC}" | tee -a "$LOG_FILE"
  cat > "$DEPLOY_DIR/package.json" << EOL
{
  "name": "danno-dashboard",
  "version": "1.0.0",
  "description": "Danno Dashboard with TBWA branding",
  "scripts": {
    "build": "echo 'Static build completed.'"
  }
}
EOL
fi

# Create a README.md with deployment info
echo -e "${YELLOW}Creating README.md...${NC}" | tee -a "$LOG_FILE"
cat > "$DEPLOY_DIR/README.md" << EOL
# Danno Dashboard

TBWA branded dashboard deployed to: https://${DEPLOYMENT_URL}/danno

## Deployment Details

- **Deployment Date**: $(date)
- **Environment**: Preview
- **URL**: https://${DEPLOYMENT_URL}/danno

## Notes

This dashboard was previously known as Client360 and has been rebranded to Danno.
EOL

# Check if Azure CLI is available
if command -v az >/dev/null 2>&1; then
  # Check if logged into Azure
  if az account show >/dev/null 2>&1; then
    echo -e "${YELLOW}Deploying to Azure Static Web App...${NC}" | tee -a "$LOG_FILE"
    
    # Check if we have the API token
    if [ -f ".azure_deploy_key" ]; then
      echo -e "${YELLOW}Using API token from .azure_deploy_key...${NC}" | tee -a "$LOG_FILE"
      API_TOKEN=$(cat .azure_deploy_key)
    else
      echo -e "${YELLOW}Getting API token from Azure...${NC}" | tee -a "$LOG_FILE"
      API_TOKEN=$(az staticwebapp secrets list \
        --name "$APP" \
        --resource-group "$RG" \
        --query "properties.apiKey" -o tsv)
      
      if [ -n "$API_TOKEN" ]; then
        echo "$API_TOKEN" > .azure_deploy_key
        echo -e "${GREEN}Saved API token to .azure_deploy_key${NC}" | tee -a "$LOG_FILE"
      fi
    fi
    
    if [ -n "$API_TOKEN" ]; then
      echo -e "${YELLOW}Deploying to preview environment...${NC}" | tee -a "$LOG_FILE"
      
      # Deploy with environment name to ensure it goes to the preview slot
      az staticwebapp deploy \
        --name "$APP" \
        --resource-group "$RG" \
        --source "$DEPLOY_DIR" \
        --api-key "$API_TOKEN" \
        --env "preview" | tee -a "$LOG_FILE"
      
      echo -e "${GREEN}✅ Deployment to preview environment completed!${NC}" | tee -a "$LOG_FILE"
      echo -e "${GREEN}Dashboard URL: https://${DEPLOYMENT_URL}/danno${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "${RED}Could not retrieve API token. Creating deployment package instead.${NC}" | tee -a "$LOG_FILE"
      
      # Create deployment package
      PACKAGE_FILE="output/danno_dashboard_${TIMESTAMP}.zip"
      mkdir -p output
      
      echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
      cd "$DEPLOY_DIR" && zip -r "../$PACKAGE_FILE" * && cd ..
      
      echo -e "${GREEN}Deployment package created: $PACKAGE_FILE${NC}" | tee -a "$LOG_FILE"
      echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
      echo "az staticwebapp deploy --name $APP --resource-group $RG --source $PACKAGE_FILE --env preview --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
    fi
  else
    echo -e "${RED}Not logged into Azure CLI. Creating deployment package instead.${NC}" | tee -a "$LOG_FILE"
    
    # Create deployment package
    PACKAGE_FILE="output/danno_dashboard_${TIMESTAMP}.zip"
    mkdir -p output
    
    echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
    cd "$DEPLOY_DIR" && zip -r "../$PACKAGE_FILE" * && cd ..
    
    echo -e "${GREEN}Deployment package created: $PACKAGE_FILE${NC}" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
    echo "az staticwebapp deploy --name $APP --resource-group $RG --source $PACKAGE_FILE --env preview --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${RED}Azure CLI not installed. Creating deployment package instead.${NC}" | tee -a "$LOG_FILE"
  
  # Create deployment package
  PACKAGE_FILE="output/danno_dashboard_${TIMESTAMP}.zip"
  mkdir -p output
  
  echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
  cd "$DEPLOY_DIR" && zip -r "../$PACKAGE_FILE" * && cd ..
  
  echo -e "${GREEN}Deployment package created: $PACKAGE_FILE${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
  echo "az staticwebapp deploy --name $APP --resource-group $RG --source $PACKAGE_FILE --env preview --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
fi

# Create deployment report
REPORT_FILE="reports/danno_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOL
# Danno Dashboard Deployment

## Deployment Summary
- **Date**: $(date)
- **Environment**: Preview
- **URL**: https://${DEPLOYMENT_URL}/danno

## Process
1. Created Danno deployment directory
2. Updated all references from Client360 to Danno
3. Added /danno route to Static Web App configuration
4. Deployed to Azure Static Web App preview environment

## Verification Steps
1. Confirm the dashboard is accessible at https://${DEPLOYMENT_URL}/danno
2. Verify all branding shows "Danno" instead of "Client360"
3. Check that all dashboard functionality works correctly

## Notes
John Ed has assigned Danno for the branding. Danno is signing NDA today and will be briefed tomorrow.
EOL

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Process completed successfully!${NC}" | tee -a "$LOG_FILE"