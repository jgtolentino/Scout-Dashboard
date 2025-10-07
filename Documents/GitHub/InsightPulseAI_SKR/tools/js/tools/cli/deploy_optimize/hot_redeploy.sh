#!/bin/bash
# hot_redeploy.sh - Fast redeploy for individual routes during development
# Usage: ./hot_redeploy.sh <route_name>

set -e

ROUTE="${1:-advisor}"
SRC_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/mockify-$ROUTE-ui"
DEPLOY_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy-ready"
HASH_FILE="./$ROUTE-build-hash"
WEBAPP_NAME="wonderful-desert-03a292c00"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Hot Redeploy for route: $ROUTE${NC}"

# Check if the source directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo -e "${RED}❌ Source directory '$SRC_DIR' not found!${NC}"
  exit 1
fi

# Check for changes using git
echo -e "${YELLOW}📊 Checking for changes...${NC}"
CHANGED_FILES=$(git diff --name-only HEAD~1 | grep -E "$ROUTE|deploy-ready" || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${GREEN}✅ No changes detected for route '$ROUTE'. Skipping build.${NC}"
else
  echo -e "${YELLOW}🔍 Found changes in files:${NC}"
  echo "$CHANGED_FILES"
  
  # Calculate hash of current source code
  CURRENT_HASH=$(find "$SRC_DIR/src" -type f -not -path "*/node_modules/*" | sort | xargs cat | sha256sum | awk '{print $1}')
  
  # Check if hash file exists and compare hashes
  if [ -f "$HASH_FILE" ]; then
    OLD_HASH=$(cat "$HASH_FILE")
    if [ "$OLD_HASH" = "$CURRENT_HASH" ]; then
      echo -e "${GREEN}✅ Source code unchanged. Skipping build.${NC}"
      BUILD_NEEDED=0
    else
      echo -e "${YELLOW}🔄 Source code changed. Building...${NC}"
      BUILD_NEEDED=1
    fi
  else
    echo -e "${YELLOW}📝 No previous hash record found. Building...${NC}"
    BUILD_NEEDED=1
  fi
  
  # Build if needed
  if [ "$BUILD_NEEDED" -eq 1 ]; then
    echo -e "${BLUE}🏗️ Building $ROUTE...${NC}"
    
    # Add Vite cache configuration if doesn't exist
    if ! grep -q "cacheDir" "$SRC_DIR/vite.config.ts"; then
      sed -i.bak '/plugins/ i\  cacheDir: "./.vite-cache",' "$SRC_DIR/vite.config.ts"
      echo -e "${GREEN}✅ Added Vite cache configuration${NC}"
    fi
    
    # Run the build
    cd "$SRC_DIR"
    npm run build
    
    # Create deploy directory if needed
    mkdir -p "$DEPLOY_DIR/$ROUTE"
    mkdir -p "$DEPLOY_DIR/$ROUTE/assets"
    
    # Copy files to deploy directory
    cp -r dist/* "$DEPLOY_DIR/$ROUTE/"
    
    # Update route redirect file
    cat > "$DEPLOY_DIR/$ROUTE.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | ${ROUTE^}</title>
  <meta http-equiv="refresh" content="0;url=/${ROUTE}">
</head>
<body>
  <p>Redirecting to ${ROUTE} dashboard...</p>
  <script>
    window.location.href = '/${ROUTE}';
  </script>
</body>
</html>
EOF
    
    # Update hash file
    echo "$CURRENT_HASH" > "$HASH_FILE"
    
    echo -e "${GREEN}✅ Build complete${NC}"
  fi
  
  # Create deployment package
  echo -e "${BLUE}📦 Creating deployment package...${NC}"
  PACKAGE_NAME="${ROUTE}_update.zip"
  
  cd "$DEPLOY_DIR"
  zip -r "$PACKAGE_NAME" "$ROUTE" "$ROUTE.html" staticwebapp.config.json
  mv "$PACKAGE_NAME" "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/$PACKAGE_NAME"
  
  echo -e "${GREEN}✅ Package created: /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/$PACKAGE_NAME${NC}"
  
  # Deploy to Azure if az command is available
  if command -v az &> /dev/null; then
    echo -e "${BLUE}☁️ Deploying to Azure...${NC}"
    
    # Check if logged in to Azure
    AZURE_STATUS=$(az account show 2>&1 || echo "error")
    if [[ "$AZURE_STATUS" == *"error"* ]]; then
      echo -e "${YELLOW}⚠️ Not logged in to Azure. Please log in:${NC}"
      echo -e "${YELLOW}az login${NC}"
      echo -e "${YELLOW}Then run:${NC}"
      echo -e "${YELLOW}az staticwebapp upload --source-path '$DEPLOY_DIR' --app-name '$WEBAPP_NAME' --deployment-token <your-token> --env production${NC}"
    else
      echo -e "${BLUE}🔄 Uploading to Azure Static Web App...${NC}"
      echo -e "${YELLOW}⚠️ Note: For security reasons, we're not executing the actual az command.${NC}"
      echo -e "${YELLOW}Run the following command manually:${NC}"
      echo -e "${YELLOW}az staticwebapp upload --source-path '$DEPLOY_DIR' --app-name '$WEBAPP_NAME' --env production${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Azure CLI not found. Please deploy manually:${NC}"
    echo -e "${YELLOW}1. Log in to Azure Portal${NC}"
    echo -e "${YELLOW}2. Navigate to Static Web App $WEBAPP_NAME${NC}"
    echo -e "${YELLOW}3. Upload package: /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/$PACKAGE_NAME${NC}"
  fi
fi

echo -e "${GREEN}✅ Hot redeploy process complete for route: $ROUTE${NC}"