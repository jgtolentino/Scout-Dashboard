#!/bin/bash
# Deploy TBWA Client 360 Dashboard to Azure Static Web Apps

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="deploy"
OUTPUT_DIR="../output/client360"
STATIC_DIR="../static"

# Check if static directory exists, if not use local static directory
if [ ! -d "$STATIC_DIR" ]; then
    STATIC_DIR="./static"
fi
SWA_CONFIG="staticwebapp.config.json"
ENVIRONMENT="production"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --env) ENVIRONMENT="$2"; shift ;;
        --target) TARGET="$2"; shift ;;
        --static-only) STATIC_ONLY=1 ;;
        --help) 
            echo "Usage: $0 [--env production|staging|dev] [--target azure|vercel|netlify] [--static-only]"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Default target is Azure if not specified
if [[ -z "$TARGET" ]]; then
    TARGET="azure"
fi

echo -e "${GREEN}TBWA Client 360 Dashboard Deployment${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Target: ${YELLOW}${TARGET}${NC}"
echo -e "Static only: ${YELLOW}${STATIC_ONLY:-false}${NC}"
echo -e "${YELLOW}=====================================${NC}"

# Create deploy directory
mkdir -p $DEPLOY_DIR

# Clean deploy directory
rm -rf $DEPLOY_DIR/*

# Prepare static site deployment
echo -e "${GREEN}Preparing static site deployment...${NC}"

# Copy static files
cp -r $STATIC_DIR/* $DEPLOY_DIR/

# Add configuration files for the specific deployment target
if [[ "$TARGET" == "azure" ]]; then
    # Create Azure Static Web App configuration
    cat > $DEPLOY_DIR/$SWA_CONFIG << EOF
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
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.azurewebsites.net;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".css": "text/css",
    ".js": "text/javascript",
    ".html": "text/html"
  }
}
EOF
    echo -e "${GREEN}Created Azure Static Web App configuration.${NC}"
elif [[ "$TARGET" == "vercel" ]]; then
    # Create Vercel configuration
    cat > $DEPLOY_DIR/vercel.json << EOF
{
  "version": 2,
  "builds": [
    { "src": "**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "ENVIRONMENT": "${ENVIRONMENT}"
  }
}
EOF
    echo -e "${GREEN}Created Vercel configuration.${NC}"
elif [[ "$TARGET" == "netlify" ]]; then
    # Create Netlify configuration
    cat > $DEPLOY_DIR/netlify.toml << EOF
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
    echo -e "${GREEN}Created Netlify configuration.${NC}"
else
    echo -e "${RED}Unsupported target: $TARGET${NC}"
    exit 1
fi

# Create deploy package
echo -e "${GREEN}Creating deployment package...${NC}"

# Create the output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Create a zip archive of the deployment
ZIPFILE="client360_dashboard_${ENVIRONMENT}.zip"
cd $DEPLOY_DIR
zip -r ../$OUTPUT_DIR/$ZIPFILE .
cd ..

echo -e "${GREEN}Deployment package created: ${OUTPUT_DIR}/${ZIPFILE}${NC}"

# Deploy to target
if [[ "$STATIC_ONLY" != "1" ]]; then
    echo -e "${GREEN}Deploying to $TARGET...${NC}"
    
    if [[ "$TARGET" == "azure" ]]; then
        # Check if Azure CLI is installed
        if ! command -v az &> /dev/null; then
            echo -e "${RED}Azure CLI not found. Please install Azure CLI and try again.${NC}"
            exit 1
        fi
        
        # Deploy to Azure Static Web Apps
        SITE_NAME="tbwa-client360-dashboard-${ENVIRONMENT}"
        
        # Check if the static site already exists
        if az staticwebapp show --name $SITE_NAME &> /dev/null; then
            echo -e "${YELLOW}Updating existing Azure Static Web App: $SITE_NAME${NC}"
            az staticwebapp update --name $SITE_NAME
        else
            echo -e "${YELLOW}Creating new Azure Static Web App: $SITE_NAME${NC}"
            az staticwebapp create --name $SITE_NAME --resource-group "scout-dashboard" --location "eastus2" --sku "Standard"
        fi
        
        # Deploy the site using SWA CLI
        echo -e "${YELLOW}Deploying content to Azure Static Web App using SWA CLI...${NC}"
        # First extract the zip
        TEMP_DIR=$(mktemp -d)
        unzip -q $OUTPUT_DIR/$ZIPFILE -d $TEMP_DIR
        
        # Deploy using SWA CLI
        swa deploy $TEMP_DIR --deployment-token $(az staticwebapp secrets list --name $SITE_NAME --query "properties.apiKey" -o tsv)
        
        # Clean up
        rm -rf $TEMP_DIR
        
        # Get the URL of the deployed site
        URL=$(az staticwebapp show --name $SITE_NAME --query "defaultHostname" -o tsv)
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        echo -e "Your dashboard is now available at: ${YELLOW}https://$URL${NC}"
    elif [[ "$TARGET" == "vercel" ]]; then
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo -e "${RED}Vercel CLI not found. Please install Vercel CLI and try again.${NC}"
            exit 1
        fi
        
        # Deploy to Vercel
        cd $DEPLOY_DIR
        echo -e "${YELLOW}Deploying to Vercel...${NC}"
        VERCEL_PROJECT_NAME="tbwa-client360-dashboard-${ENVIRONMENT}"
        vercel --prod --name $VERCEL_PROJECT_NAME
        cd ..
        
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        echo -e "Your dashboard is now available on Vercel."
    elif [[ "$TARGET" == "netlify" ]]; then
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            echo -e "${RED}Netlify CLI not found. Please install Netlify CLI and try again.${NC}"
            exit 1
        fi
        
        # Deploy to Netlify
        cd $DEPLOY_DIR
        echo -e "${YELLOW}Deploying to Netlify...${NC}"
        netlify deploy --prod --dir=. --site="tbwa-client360-dashboard-${ENVIRONMENT}"
        cd ..
        
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        echo -e "Your dashboard is now available on Netlify."
    fi
else
    echo -e "${YELLOW}Skipping deployment. Package created for manual deployment.${NC}"
    echo -e "To manually deploy, you can use:"
    echo -e "  - Azure: az staticwebapp deploy --name <app-name> --source ${OUTPUT_DIR}/${ZIPFILE}"
    echo -e "  - Vercel: vercel --prod ${DEPLOY_DIR}"
    echo -e "  - Netlify: netlify deploy --prod --dir=${DEPLOY_DIR}"
fi

echo -e "${GREEN}Process completed successfully.${NC}"
exit 0