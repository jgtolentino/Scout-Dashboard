#!/bin/bash

# Deploy Client360 Dashboard ONLY to the /360 path, with no other content
# This script removes all other content and redirects everything to /360

set -e  # Exit on any error

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying ONLY to /360 path (removing all other content)...${NC}"

# Configuration
RESOURCE_GROUP="scout-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy"
API_KEY_FILE=".azure_deploy_key"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/deploy_360_only_${TIMESTAMP}.log"
TEMP_DIR="temp_360_only_${TIMESTAMP}"

# Create directories
mkdir -p logs
mkdir -p "$TEMP_DIR"

# Copy deployment files to temp directory
echo -e "${YELLOW}📂 Preparing deployment files...${NC}" | tee -a "$DEPLOYMENT_LOG"
cp -r "$SOURCE_DIR"/* "$TEMP_DIR"

# Update the staticwebapp.config.json to REDIRECT all paths to /360
echo -e "${YELLOW}🛠️ Updating Azure Static Web App config to force /360 path only...${NC}" | tee -a "$DEPLOYMENT_LOG"

cat > "$TEMP_DIR/staticwebapp.config.json" << 'EOF'
{
  "routes": [
    {
      "route": "/360/*",
      "serve": "/*",
      "statusCode": 200
    },
    {
      "route": "/360",
      "serve": "/index.html",
      "statusCode": 200
    },
    {
      "route": "/*",
      "redirect": "/360",
      "statusCode": 301
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg,webp}", "/css/*", "/js/*", "/assets/*", "/data/*", "/theme.css", "/logo.svg", "/*.webp"]
  },
  "responseOverrides": {
    "404": {
      "redirect": "/360",
      "statusCode": 301
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

# Make sure the dashboard loads at /360 path
echo -e "${YELLOW}🔗 Adding base tag to HTML files for /360 path...${NC}" | tee -a "$DEPLOYMENT_LOG"
for HTML_FILE in $(find "$TEMP_DIR" -name "*.html"); do
    # Check if base tag already exists
    if ! grep -q "<base href=" "$HTML_FILE"; then
        echo -e "${YELLOW}➕ Adding base tag to $(basename "$HTML_FILE")...${NC}" | tee -a "$DEPLOYMENT_LOG"
        sed -i '' 's|<head>|<head>\n  <base href="/360/" />|g' "$HTML_FILE"
        
        # Fix any absolute path references
        sed -i '' 's|href="/css/|href="css/|g' "$HTML_FILE"
        sed -i '' 's|href="/js/|href="js/|g' "$HTML_FILE"
        sed -i '' 's|href="/assets/|href="assets/|g' "$HTML_FILE"
        sed -i '' 's|src="/js/|src="js/|g' "$HTML_FILE"
        sed -i '' 's|src="/assets/|src="assets/|g' "$HTML_FILE"
    else
        echo -e "${GREEN}✅ Base tag already exists in $(basename "$HTML_FILE")${NC}" | tee -a "$DEPLOYMENT_LOG"
    fi
done

# Get the API key from Azure or from file
echo -e "${YELLOW}🔑 Retrieving deployment key from Azure...${NC}" | tee -a "$DEPLOYMENT_LOG"
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
DEPLOY_ZIP="output/client360_360_only_${TIMESTAMP}.zip"
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
    
    echo -e "${GREEN}🌐 Dashboard is ONLY available at: https://$DEPLOYMENT_URL/360/${NC}" | tee -a "$DEPLOYMENT_LOG"
    echo -e "${GREEN}🌐 All other URLs will redirect to /360${NC}" | tee -a "$DEPLOYMENT_LOG"
    
    # Create a deployment record
    DEPLOYMENT_RECORD="reports/azure_360_only_${TIMESTAMP}.md"
    mkdir -p reports
    cat > "$DEPLOYMENT_RECORD" << EOL
# Azure Deployment Record - Client360 Dashboard ONLY at /360 path

## Deployment Summary
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **Package:** $DEPLOY_ZIP
- **Log:** $DEPLOYMENT_LOG
- **URL:** https://$DEPLOYMENT_URL/360/

## Changes Deployed
- ✅ Updated routing to serve ONLY at /360 path
- ✅ Redirected ALL other paths to /360
- ✅ Added base tag to fix relative URLs
- ✅ Removed all content except for the dashboard

## Verification
- Dashboard is accessible ONLY at: https://$DEPLOYMENT_URL/360/
- All other paths redirect to /360
- No other content is accessible

## Next Steps
- Update all documentation to use only the /360 URL
- Inform users they can only access through /360
EOL
    
    echo -e "${GREEN}📝 Deployment record created: $DEPLOYMENT_RECORD${NC}" | tee -a "$DEPLOYMENT_LOG"
    
    # Clean up temporary files
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}🧹 Temporary files cleaned up${NC}" | tee -a "$DEPLOYMENT_LOG"
else
    echo -e "${RED}❌ Deployment failed. Check the logs for details: $DEPLOYMENT_LOG${NC}" | tee -a "$DEPLOYMENT_LOG"
    exit 1
fi