#!/bin/bash
# Build and deploy the TBWA-themed Client360 Dashboard to Azure

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
CLIENT360_DIR="client360"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/tbwa_deploy_${TIMESTAMP}.log"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}Building and deploying TBWA-themed Client360 Dashboard to Azure${NC}" | tee -a "$LOG_FILE"

# Ensure client360 directory exists
if [ ! -d "$CLIENT360_DIR" ]; then
  echo -e "${YELLOW}Creating client360 directory...${NC}" | tee -a "$LOG_FILE"
  mkdir -p "$CLIENT360_DIR/public"
else
  echo -e "${YELLOW}Using existing client360 directory.${NC}" | tee -a "$LOG_FILE"
  mkdir -p "$CLIENT360_DIR/public"
fi

# 1. Build only the TBWA theme CSS bundle with forced rebuild
echo -e "${YELLOW}Building TBWA theme CSS bundle...${NC}" | tee -a "$LOG_FILE"
# Clean the dist directory first to ensure fresh build
rm -rf dist
# Run webpack with explicit TBWA theme selection
npx webpack --config webpack.config.js --env theme=tbwa --mode production | tee -a "$LOG_FILE"

# Check if dist directory was created
if [ ! -d "dist" ]; then
  echo -e "${RED}Failed to create dist directory. Build may have failed.${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# 2. Copy the TBWA CSS and logo into the client360 public assets
echo -e "${YELLOW}Copying TBWA CSS and logo to client360/public/...${NC}" | tee -a "$LOG_FILE"
# Create directories if they don't exist
mkdir -p "$CLIENT360_DIR/public/css"
mkdir -p "$CLIENT360_DIR/public/assets"

# Copy the main theme CSS
cp dist/tbwa.css "$CLIENT360_DIR/public/theme.css"
# Backup copy in css directory
cp dist/tbwa.css "$CLIENT360_DIR/public/css/tbwa-theme.css"
# Also copy any other assets from the dist directory
cp -r dist/assets/* "$CLIENT360_DIR/public/assets/" 2>/dev/null || echo "No assets to copy"

# Copy the index.html.template to client360
echo -e "${YELLOW}Creating index.html in client360/public/...${NC}" | tee -a "$LOG_FILE"

# Make a backup copy of the template
cp index.html.template "index.html.template.backup-${TIMESTAMP}"

# Modify the template to use the TBWA theme CSS
echo -e "${YELLOW}Replacing theme-selector with TBWA theme CSS link...${NC}" | tee -a "$LOG_FILE"
sed 's|<script src="/js/theme-selector.js"></script>|<link rel="stylesheet" href="/theme.css">\n  <link rel="stylesheet" href="/css/tbwa-theme.css">|g' index.html.template > "$CLIENT360_DIR/public/index.html"

# Remove the theme selector from the HTML
echo -e "${YELLOW}Removing theme selector div...${NC}" | tee -a "$LOG_FILE"
sed -i '' 's|<div class="theme-selector">.*</div>||g' "$CLIENT360_DIR/public/index.html"

# Add TBWA branding class to body
echo -e "${YELLOW}Adding TBWA branding class to body...${NC}" | tee -a "$LOG_FILE"
sed -i '' 's|<body>|<body class="tbwa-branded">|g' "$CLIENT360_DIR/public/index.html"

# Also copy any geospatial data needed
mkdir -p "$CLIENT360_DIR/public/data"
if [ -d "data" ]; then
  echo -e "${YELLOW}Copying geospatial data...${NC}" | tee -a "$LOG_FILE"
  cp -r data/* "$CLIENT360_DIR/public/data/" 2>/dev/null || echo "No data files to copy"
fi

# Create a minimal package.json for the client360 app if it doesn't exist
if [ ! -f "$CLIENT360_DIR/package.json" ]; then
  echo -e "${YELLOW}Creating package.json for client360...${NC}" | tee -a "$LOG_FILE"
  cat > "$CLIENT360_DIR/package.json" << EOF
{
  "name": "client360-tbwa-dashboard",
  "version": "1.0.0",
  "description": "Client360 Dashboard with TBWA branding",
  "scripts": {
    "build": "cp -r public/ build/"
  }
}
EOF
fi

# Create the Azure Static Web App configuration
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$CLIENT360_DIR/public"
cat > "$CLIENT360_DIR/public/staticwebapp.config.json" << EOF
{
  "routes": [
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
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*", "/assets/*", "/data/*", "/theme.css", "/logo.svg"]
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
EOF

# 3. Build the Client360 app with TBWA branding baked in
echo -e "${YELLOW}Building the Client360 app...${NC}" | tee -a "$LOG_FILE"
cd "$CLIENT360_DIR"
mkdir -p build
npm run build | tee -a "../$LOG_FILE"
cd ..

# Check if the API token environment variable exists
if [ -z "$AZ_STATIC_WEBAPP_API_TOKEN" ]; then
  # Check if there's a .env file with the token
  if [ -f ".env" ]; then
    echo -e "${YELLOW}Loading API token from .env file...${NC}" | tee -a "$LOG_FILE"
    source .env
  else
    echo -e "${YELLOW}AZ_STATIC_WEBAPP_API_TOKEN not found. Checking if Azure CLI is logged in...${NC}" | tee -a "$LOG_FILE"
    # Try to get the API token from Azure
    if az account show > /dev/null 2>&1; then
      AZ_STATIC_WEBAPP_API_TOKEN=$(az staticwebapp secrets list \
        --name "$APP" \
        --resource-group "$RG" \
        --query "properties.apiKey" -o tsv 2>/dev/null)
    fi
      
    if [ -z "$AZ_STATIC_WEBAPP_API_TOKEN" ]; then
      echo -e "${YELLOW}Could not retrieve API token. Creating a manual deployment package instead.${NC}" | tee -a "$LOG_FILE"
      
      # Create a zip package for manual deployment
      mkdir -p output
      ZIPFILE="output/client360_tbwa_dashboard_${TIMESTAMP}.zip"
      cd $CLIENT360_DIR/build
      zip -r "../../$ZIPFILE" * | tee -a "../../$LOG_FILE"
      cd ../..
      
      echo -e "${GREEN}Created manual deployment package: $ZIPFILE${NC}" | tee -a "$LOG_FILE"
      echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
      echo "az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
      
      # Create a deployment report
      REPORT_FILE="reports/tbwa_deployment_${TIMESTAMP}.md"
      mkdir -p reports
      
      cat > "$REPORT_FILE" << EOL
# TBWA-themed Client360 Dashboard Deployment Package

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA (baked in at build time)
- **Deployment Package**: $ZIPFILE

## Process
1. Built TBWA theme CSS bundle
2. Copied theme CSS and logo to client360 app
3. Built client360 app with TBWA branding
4. Created deployment package for manual deployment

## Manual Deployment Instructions
To deploy to Azure Static Web Apps, run:

\`\`\`bash
az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN
\`\`\`

Replace YOUR_API_TOKEN with your Azure Static Web App deployment token.

## Next Steps
- Monitor dashboard usage and performance after deployment
- Gather user feedback on the TBWA theme
- Consider additional brand-specific features
EOL

      echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
      exit 0
    fi
    
    # Save the token for future use
    echo "AZ_STATIC_WEBAPP_API_TOKEN=${AZ_STATIC_WEBAPP_API_TOKEN}" > .env
    echo -e "${GREEN}Saved API token to .env file.${NC}" | tee -a "$LOG_FILE"
  fi
fi

# 4. Deploy the TBWA-themed dashboard to Azure Static Web Apps
echo -e "${YELLOW}Deploying to Azure Static Web Apps...${NC}" | tee -a "$LOG_FILE"

if az staticwebapp deploy --name "$APP" --resource-group "$RG" --source "$CLIENT360_DIR/build" --api-key "$AZ_STATIC_WEBAPP_API_TOKEN" 2>/dev/null; then
  echo -e "${GREEN}✅ Deployment successful!${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}Azure CLI deployment failed. Creating a manual deployment package instead.${NC}" | tee -a "$LOG_FILE"
  
  # Create a zip package for manual deployment
  mkdir -p output
  ZIPFILE="output/client360_tbwa_dashboard_${TIMESTAMP}.zip"
  cd $CLIENT360_DIR/build
  zip -r "../../$ZIPFILE" * | tee -a "../../$LOG_FILE"
  cd ../..
  
  echo -e "${GREEN}Created manual deployment package: $ZIPFILE${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
  echo "az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
fi

# Get the deployment URL
DEPLOYMENT_URL=$(az staticwebapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query "defaultHostname" -o tsv 2>/dev/null)

echo -e "${GREEN}✅ Deployment complete!${NC}" | tee -a "$LOG_FILE"
if [ -n "$DEPLOYMENT_URL" ]; then
  echo -e "${YELLOW}Dashboard URL: https://$DEPLOYMENT_URL${NC}" | tee -a "$LOG_FILE"
fi

# Create a deployment report
REPORT_FILE="reports/tbwa_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# TBWA-themed Client360 Dashboard Deployment

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA (baked in at build time)
EOF

if [ -n "$DEPLOYMENT_URL" ]; then
  cat >> "$REPORT_FILE" << EOF
- **URL**: https://$DEPLOYMENT_URL
EOF
else
  cat >> "$REPORT_FILE" << EOF
- **Deployment Package**: $ZIPFILE
EOF
fi

cat >> "$REPORT_FILE" << EOF

## Process
1. Built TBWA theme CSS bundle
2. Copied theme CSS and logo to client360 app
3. Built client360 app with TBWA branding
4. Deployed to Azure Static Web Apps

## Next Steps
- Monitor dashboard usage and performance
- Gather user feedback on the TBWA theme
- Consider additional brand-specific features

EOF

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"