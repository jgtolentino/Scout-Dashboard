#!/bin/bash
# Deploy clean version to root URL only

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deploy_clean_root_${TIMESTAMP}.log"

# Create logs directory
mkdir -p logs
mkdir -p output

echo -e "${GREEN}Deploying clean root version to Azure...${NC}" | tee -a "$LOG_FILE"

# First, build the TBWA theme
echo -e "${YELLOW}Building TBWA theme...${NC}" | tee -a "$LOG_FILE"
if [ -f "./scripts/build-tbwa-theme.sh" ]; then
  bash ./scripts/build-tbwa-theme.sh | tee -a "$LOG_FILE"
else
  echo -e "${RED}Error: Could not find build-tbwa-theme.sh script${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# Create a clean deployment folder
DEPLOY_DIR="deploy_clean_root_${TIMESTAMP}"
mkdir -p "$DEPLOY_DIR"

echo -e "${YELLOW}Creating clean deployment in $DEPLOY_DIR...${NC}" | tee -a "$LOG_FILE"

# Copy essential files to deployment directory
cp dist/tbwa.css "$DEPLOY_DIR/theme.css"
mkdir -p "$DEPLOY_DIR/css"
cp dist/tbwa.css "$DEPLOY_DIR/css/tbwa-theme.css"

# Create assets directory
mkdir -p "$DEPLOY_DIR/assets/logos"
cp assets/logos/* "$DEPLOY_DIR/assets/logos/" 2>/dev/null || true

# Copy or create the index.html
if [ -f "index.html.template" ]; then
  echo -e "${YELLOW}Using index.html.template as base...${NC}" | tee -a "$LOG_FILE"
  # Replace theme-selector with direct TBWA theme CSS link
  sed 's|<script src="/js/theme-selector.js"></script>|<link rel="stylesheet" href="/theme.css">\n  <link rel="stylesheet" href="/css/tbwa-theme.css">|g' index.html.template > "$DEPLOY_DIR/index.html"
  # Remove theme selector div if it exists
  sed -i '' 's|<div class="theme-selector">.*</div>||g' "$DEPLOY_DIR/index.html"
  # Add TBWA branding class to body
  sed -i '' 's|<body>|<body class="tbwa-branded">|g' "$DEPLOY_DIR/index.html"
else
  echo -e "${YELLOW}No template found. Creating basic index.html...${NC}" | tee -a "$LOG_FILE"
  cat > "$DEPLOY_DIR/index.html" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Client360 Dashboard</title>
  <link rel="stylesheet" href="/theme.css">
  <link rel="stylesheet" href="/css/tbwa-theme.css">
</head>
<body class="tbwa-branded">
  <header class="header">
    <div class="header-container">
      <div class="header-logo"></div>
      <h1 class="header-title">Client360 Dashboard</h1>
    </div>
  </header>
  
  <main class="main-content">
    <div class="data-freshness">Last updated: <span id="update-date"></span></div>
    
    <section class="kpi-section">
      <h2 class="section-title">Key Metrics</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <h3>Total Sales</h3>
          <div class="value" id="total-sales">₱5,824,350</div>
          <div class="change positive">+12.3%</div>
        </div>
        <div class="kpi-card">
          <h3>Conversion Rate</h3>
          <div class="value" id="conversion-rate">4.8%</div>
          <div class="change positive">+0.7%</div>
        </div>
        <div class="kpi-card">
          <h3>Marketing ROI</h3>
          <div class="value" id="marketing-roi">3.2x</div>
          <div class="change positive">+0.2x</div>
        </div>
        <div class="kpi-card">
          <h3>Brand Sentiment</h3>
          <div class="value" id="brand-sentiment">78.5%</div>
          <div class="change positive">+2.1%</div>
        </div>
      </div>
    </section>
    
    <section class="rollback-dashboard">
      <div class="rollback-dashboard-header">
        <h3>Dashboard Rollback</h3>
        <div class="status-indicator active">System Ready</div>
      </div>
      <div class="rollback-dashboard-content">
        <p>You can safely rollback to a previous version if you encounter any issues with the current dashboard.</p>
        <div class="version-info">
          <span class="version-label">Current Version:</span>
          <span class="version-value">v2.3.0</span>
        </div>
        <div class="version-info">
          <span class="version-label">Previous Version:</span>
          <span class="version-value">v2.2.1</span>
        </div>
      </div>
      <div class="rollback-dashboard-actions">
        <button class="btn-rollback">Rollback to Previous Version</button>
        <button class="btn-verify">Verify Current System</button>
      </div>
    </section>
  </main>
  
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-info">
        <p>&copy; 2025 TBWA\SMP. All rights reserved.</p>
      </div>
      <div class="data-disclaimer">
        Data shown is for demonstration purposes.
      </div>
    </div>
  </footer>
  
  <script>
    document.getElementById('update-date').textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  </script>
</body>
</html>
EOL
fi

# Copy sample data directory for SQL queries if it exists
echo -e "${YELLOW}Copying sample data for SQL queries...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$DEPLOY_DIR/data/sample_data"

# Check if we have sample data in various possible locations
if [ -d "data/sample_data" ]; then
  cp -r data/sample_data/* "$DEPLOY_DIR/data/sample_data/" 2>/dev/null || true
  echo -e "${GREEN}Sample data copied from data/sample_data${NC}" | tee -a "$LOG_FILE"
elif [ -d "sample_data" ]; then
  cp -r sample_data/* "$DEPLOY_DIR/data/sample_data/" 2>/dev/null || true
  echo -e "${GREEN}Sample data copied from sample_data${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}No sample data found. Creating a minimal sample data placeholder.${NC}" | tee -a "$LOG_FILE"
  # Create a minimal sample data JSON if no sample data exists
  cat > "$DEPLOY_DIR/data/sample_data/minimal_sample.json" << EOF
{
  "metadata": {
    "simulated": true,
    "version": "1.0.0",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "data": {
    "kpis": {
      "total_sales": 5824350,
      "sales_change": 12.3,
      "conversion_rate": 4.8,
      "conversion_change": 0.7,
      "marketing_roi": 3.2,
      "roi_change": 0.2,
      "brand_sentiment": 78.5,
      "sentiment_change": 2.1
    }
  }
}
EOF
fi

# Create Azure Static Web App configuration at the root level
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}" | tee -a "$LOG_FILE"
cat > "$DEPLOY_DIR/staticwebapp.config.json" << EOF
{
  "routes": [
    {
      "route": "/",
      "serve": "/index.html",
      "statusCode": 200
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg,webp}", "/css/*", "/js/*", "/assets/*", "/data/*", "/theme.css", "/logo.svg", "/*.webp"]
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
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
  }
}
EOF

# Create a deployment package
DEPLOY_ZIP="output/clean_root_deploy_${TIMESTAMP}.zip"
echo -e "${YELLOW}Creating deployment package: $DEPLOY_ZIP${NC}" | tee -a "$LOG_FILE"
cd "$DEPLOY_DIR"
zip -r "../$DEPLOY_ZIP" * | tee -a "../$LOG_FILE"
cd ..

# Get API key from Azure if possible
echo -e "${YELLOW}Getting API key from Azure...${NC}" | tee -a "$LOG_FILE"
if az account show > /dev/null 2>&1; then
  API_KEY=$(az staticwebapp secrets list \
    --name "$APP" \
    --resource-group "$RG" \
    --query "properties.apiKey" -o tsv 2>/dev/null)
    
  if [ -z "$API_KEY" ]; then
    echo -e "${RED}Could not get API key from Azure. Using key file if available...${NC}" | tee -a "$LOG_FILE"
    if [ -f ".azure_deploy_key" ]; then
      API_KEY=$(cat .azure_deploy_key)
    fi
  else
    # Save the key for future use
    echo "$API_KEY" > .azure_deploy_key
  fi
else
  echo -e "${YELLOW}Azure CLI not logged in. Using key file if available...${NC}" | tee -a "$LOG_FILE"
  if [ -f ".azure_deploy_key" ]; then
    API_KEY=$(cat .azure_deploy_key)
  fi
fi

# Deploy to Azure
if [ -n "$API_KEY" ]; then
  echo -e "${GREEN}Deploying to Azure...${NC}" | tee -a "$LOG_FILE"
  if az staticwebapp deploy \
      --name "$APP" \
      --resource-group "$RG" \
      --source "$DEPLOY_ZIP" \
      --api-key "$API_KEY" | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}❌ Deployment failed. Check the logs for details: $LOG_FILE${NC}" | tee -a "$LOG_FILE"
    exit 1
  fi
else
  echo -e "${RED}❌ API key not available. Cannot deploy to Azure.${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}Manual deployment package has been created: $DEPLOY_ZIP${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# Get the deployment URL
DEPLOYMENT_URL=$(az staticwebapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query "defaultHostname" -o tsv 2>/dev/null)

# Create a deployment record
REPORT_FILE="reports/clean_root_deployment_${TIMESTAMP}.md"
mkdir -p reports
cat > "$REPORT_FILE" << EOF
# Azure Deployment Record - Clean Root Only

## Deployment Summary
- **Timestamp:** $(date)
- **Resource Group:** $RG
- **App Name:** $APP
- **Package:** $DEPLOY_ZIP
- **Log:** $LOG_FILE

## Primary URL
- **URL:** https://$DEPLOYMENT_URL

## Changes Deployed
- ✅ Deployed clean root-only version
- ✅ Removed all path-based deployments
- ✅ Fixed TBWA branding
- ✅ Created simple dashboard with rollback widget

## Next Steps
- Verify deployment and inform users of direct root URL
EOF

echo -e "${GREEN}✅ Deployment record created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Dashboard URL: https://$DEPLOYMENT_URL${NC}" | tee -a "$LOG_FILE"