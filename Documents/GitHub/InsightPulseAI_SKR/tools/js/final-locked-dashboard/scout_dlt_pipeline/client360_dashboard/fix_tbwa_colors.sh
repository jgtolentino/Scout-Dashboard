#!/bin/bash
# Fix TBWA colors in the deployment files
# This script ensures that the correct TBWA brand colors are used in the deployment

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Fixing TBWA brand colors in deployment files...${NC}"

# 1. Update variables.css with correct TBWA colors
echo -e "${YELLOW}Updating CSS variables with TBWA brand colors...${NC}"

# Make a backup of the original file
cp deploy/css/variables.css deploy/css/variables.css.bak.$(date +"%Y%m%d_%H%M%S")

# Update the CSS variables
sed -i '' 's/--color-primary: #ffc300; \/\* TBWA yellow \*\//--color-primary: #002B80; \/\* TBWA Navy \*\//' deploy/css/variables.css
sed -i '' 's/--color-secondary: #005bbb; \/\* TBWA blue \*\//--color-secondary: #00C3EC; \/\* TBWA Cyan \*\//' deploy/css/variables.css
sed -i '' 's/--color-accent: #ff6f61; \/\* highlight for alerts \*\//--color-accent: #E60028; \/\* TBWA Red \*\//' deploy/css/variables.css
sed -i '' 's/--color-primary-dark: #e6b000; \/\* darker yellow for hover \*\//--color-primary-dark: #001e5c; \/\* darker navy for hover \*\//' deploy/css/variables.css
sed -i '' 's/--color-secondary-dark: #004a99; \/\* darker blue for hover \*\//--color-secondary-dark: #00a5c9; \/\* darker cyan for hover \*\//' deploy/css/variables.css

echo -e "${GREEN}✅ Fixed CSS variables${NC}"

# 2. Build the theme CSS file
echo -e "${YELLOW}Building TBWA theme with corrected colors...${NC}"

# Check if build-tbwa-theme.sh exists
if [ -f "scripts/build-tbwa-theme.sh" ]; then
  bash scripts/build-tbwa-theme.sh
  
  # Copy the theme CSS to the deploy directory
  if [ -f "dist/tbwa.css" ]; then
    cp dist/tbwa.css deploy/css/tbwa-theme.css
    echo -e "${GREEN}✅ Built and copied new TBWA theme CSS${NC}"
  else
    echo -e "${RED}❌ Failed to build TBWA theme CSS${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ scripts/build-tbwa-theme.sh not found, skipping build step${NC}"
fi

# 3. Update staticwebapp.config.json to ensure CSS files are served correctly
echo -e "${YELLOW}Updating staticwebapp.config.json...${NC}"

# Make a backup of the original file
cp deploy/staticwebapp.config.json deploy/staticwebapp.config.json.bak.$(date +"%Y%m%d_%H%M%S")

# Ensure MIME types include CSS
if ! grep -q '"\.css": "text/css"' deploy/staticwebapp.config.json; then
  sed -i '' 's/"mimeTypes": {/"mimeTypes": {\n    "\.css": "text\/css",/' deploy/staticwebapp.config.json
  echo -e "${GREEN}✅ Added CSS MIME type to staticwebapp.config.json${NC}"
fi

echo -e "${GREEN}✅ TBWA color fix completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Deploy the fixed dashboard using: ./deploy_to_azure.sh"
echo -e "2. Verify the deployed site has the correct TBWA Navy (#002B80) and Cyan (#00C3EC) colors"