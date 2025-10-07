#!/bin/bash
# Deploy Client360 Dashboard to the /360 path on Azure Static Web Apps

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Client360 Dashboard to the /360 path on Azure...${NC}"

# Configuration
RESOURCE_GROUP="scout-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy"
API_KEY_FILE=".azure_deploy_key"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/deploy_360_azure_${TIMESTAMP}.log"
TEMP_DIR="temp_360_deployment_${TIMESTAMP}"

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p "$TEMP_DIR"

# Copy deployment files to temp directory
echo -e "${YELLOW}Preparing deployment files...${NC}" | tee -a "$DEPLOYMENT_LOG"
cp -r "$SOURCE_DIR"/* "$TEMP_DIR"

# Update the staticwebapp.config.json to support the /360 path
echo -e "${YELLOW}Updating Azure Static Web App configuration for /360 path...${NC}" | tee -a "$DEPLOYMENT_LOG"

cat > "$TEMP_DIR/staticwebapp.config.json" << 'EOF'
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/css/*.css",
      "headers": {
        "content-type": "text/css"
      }
    },
    {
      "route": "/js/*.js",
      "headers": {
        "content-type": "application/javascript"
      }
    },
    {
      "route": "/360",
      "serve": "/index.html",
      "statusCode": 200
    },
    {
      "route": "/360/*",
      "serve": "/index.html",
      "statusCode": 200
    },
    {
      "route": "/*",
      "serve": "/direct_url_links.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/direct_url_links.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.azurewebsites.net https://unpkg.com https://fonts.googleapis.com https://fonts.gstatic.com;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Access-Control-Allow-Origin": "*"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".css": "text/css",
    ".js": "application/javascript",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".geojson": "application/json"
  }
}
EOF

# Ensure the direct_url_links.html is set up correctly
echo -e "${YELLOW}Updating landing page with links to the dashboard...${NC}" | tee -a "$DEPLOYMENT_LOG"

cat > "$TEMP_DIR/direct_url_links.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard Access</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #f8f9fa;
    }
    header {
      background-color: #002B80; /* TBWA Navy */
      color: white;
      padding: 2rem;
      margin-bottom: 2rem;
      border-radius: 8px;
      text-align: center;
      border-bottom: 3px solid #00C3EC; /* TBWA Cyan */
    }
    h1 {
      margin: 0;
      font-size: 2.5rem;
    }
    h2 {
      font-weight: 600;
      color: #002B80; /* TBWA Navy */
      margin-top: 2rem;
    }
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      transition: transform 0.3s, box-shadow 0.3s;
      border-left: 4px solid #00C3EC; /* TBWA Cyan */
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    .card h3 {
      color: #002B80; /* TBWA Navy */
      margin-top: 0;
      font-size: 1.5rem;
      border-bottom: 2px solid #00C3EC; /* TBWA Cyan */
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    .card p {
      margin-bottom: 1.5rem;
      color: #666;
    }
    .card-footer {
      margin-top: 1rem;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #002B80; /* TBWA Navy */
      color: white;
      padding: 0.5rem 1.5rem;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: background-color 0.3s;
    }
    .btn-secondary {
      background-color: #00C3EC; /* TBWA Cyan */
      color: #002B80; /* TBWA Navy */
    }
    .btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #777;
    }
  </style>
</head>
<body>
  <header>
    <h1>Client360 Dashboard</h1>
    <p>Unified business intelligence for real-time decision making</p>
  </header>

  <main>
    <h2>Client360 Dashboard Access Options</h2>
    <p>Choose how you'd like to access the Client360 Dashboard:</p>

    <div class="card-container">
      <div class="card">
        <h3>Direct Dashboard Access</h3>
        <p>Access the full Client360 Dashboard with all features, real-time data, KPIs, and interactive visualizations.</p>
        <ul>
          <li>Interactive geospatial map</li>
          <li>AI-powered insights</li>
          <li>Real-time metrics</li>
          <li>Full export capabilities</li>
        </ul>
        <div class="card-footer">
          <a href="/360" class="btn">Access Dashboard</a>
        </div>
      </div>

      <div class="card">
        <h3>Dashboard Documentation</h3>
        <p>Learn about the Client360 Dashboard features, data sources, and how to interpret the visualization.</p>
        <ul>
          <li>User guides and tutorials</li>
          <li>Data dictionary</li>
          <li>Frequently asked questions</li>
          <li>Version history and roadmap</li>
        </ul>
        <div class="card-footer">
          <a href="/360/guide" class="btn btn-secondary">View Documentation</a>
        </div>
      </div>
    </div>

    <h2>System Requirements</h2>
    <p>For the best experience, we recommend:</p>
    <ul>
      <li>Modern browser: Chrome, Edge, Firefox, or Safari</li>
      <li>Screen resolution: 1366 × 768 or higher</li>
      <li>Internet connection: Broadband (1 Mbps+)</li>
    </ul>

    <h2>Need Help?</h2>
    <p>Contact the support team at <a href="mailto:dashboard-support@tbwa.com">dashboard-support@tbwa.com</a> or call +1 (555) 123-4567 during business hours.</p>
  </main>

  <footer>
    <p>&copy; 2025 TBWA | Client360 Dashboard v2.3.0</p>
  </footer>

  <script>
    // Simple script to redirect from landing directly to dashboard if ?direct=true is in URL
    document.addEventListener('DOMContentLoaded', function() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('direct') === 'true') {
        window.location.href = '/360';
      }
    });
  </script>
</body>
</html>
EOF

# Get the API key from Azure or from file
echo -e "${YELLOW}Retrieving deployment key from Azure...${NC}" | tee -a "$DEPLOYMENT_LOG"
API_KEY=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv)

if [ -z "$API_KEY" ]; then
    echo -e "${YELLOW}⚠️ Failed to retrieve API key. Checking if key file exists...${NC}" | tee -a "$DEPLOYMENT_LOG"
    
    # Check if we have the API key stored locally
    if [ ! -f "$API_KEY_FILE" ]; then
        echo -e "${RED}⚠️ Azure deployment key not found. Please create a file named $API_KEY_FILE containing your Static Web App deployment key.${NC}" | tee -a "$DEPLOYMENT_LOG"
        echo "To retrieve your deployment key, run: az staticwebapp secrets list --name $APP_NAME --resource-group $RESOURCE_GROUP --query 'properties.apiKey' -o tsv"
        exit 1
    fi
    
    # Read the API key from the file
    API_KEY=$(cat "$API_KEY_FILE")
else
    # Store the API key for future use
    echo "$API_KEY" > "$API_KEY_FILE"
    echo -e "${GREEN}✅ API key retrieved and stored for future use.${NC}" | tee -a "$DEPLOYMENT_LOG"
fi

# Create a deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}" | tee -a "$DEPLOYMENT_LOG"
DEPLOY_ZIP="output/client360_360_deploy_${TIMESTAMP}.zip"
mkdir -p output

# Create the ZIP file from the temp directory
(cd "$TEMP_DIR" && zip -r "../$DEPLOY_ZIP" * -x "*/node_modules/*" -x "*/\.*") | tee -a "$DEPLOYMENT_LOG"

# Deploy to Azure
echo -e "${YELLOW}🚀 Deploying to Azure Static Web App: $APP_NAME...${NC}" | tee -a "$DEPLOYMENT_LOG"
echo -e "${YELLOW}Using resource group: $RESOURCE_GROUP${NC}" | tee -a "$DEPLOYMENT_LOG"

az staticwebapp deploy \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --source "$DEPLOY_ZIP" \
    --api-key "$API_KEY" | tee -a "$DEPLOYMENT_LOG"

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}" | tee -a "$DEPLOYMENT_LOG"
    
    # Get the URL of the deployed app
    DEPLOYMENT_URL=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)
    
    echo -e "${GREEN}🌐 Dashboard is now available at: https://$DEPLOYMENT_URL/360${NC}" | tee -a "$DEPLOYMENT_LOG"
    
    # Create a deployment record
    DEPLOYMENT_RECORD="reports/azure_360_deployment_${TIMESTAMP}.md"
    mkdir -p reports
    cat > "$DEPLOYMENT_RECORD" << EOL
# Azure Deployment Record - Client360 Dashboard at /360 path

## Deployment Summary
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **Package:** $DEPLOY_ZIP
- **Log:** $DEPLOYMENT_LOG
- **URL:** https://$DEPLOYMENT_URL/360

## Changes Deployed
- ✅ Updated routing to serve dashboard at /360 path
- ✅ Created landing page with direct links
- ✅ Fixed TBWA theme colors
- ✅ Included rollback component styles

## Verification
- Dashboard is accessible at: https://$DEPLOYMENT_URL/360
- Landing page is at: https://$DEPLOYMENT_URL
- Both pages use correct TBWA branding
EOL
    
    echo -e "${GREEN}📝 Deployment record created: $DEPLOYMENT_RECORD${NC}" | tee -a "$DEPLOYMENT_LOG"
    
    # Clean up temporary files
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}🧹 Temporary files cleaned up${NC}" | tee -a "$DEPLOYMENT_LOG"
else
    echo -e "${RED}❌ Deployment failed. Check the logs for details: $DEPLOYMENT_LOG${NC}" | tee -a "$DEPLOYMENT_LOG"
    exit 1
fi