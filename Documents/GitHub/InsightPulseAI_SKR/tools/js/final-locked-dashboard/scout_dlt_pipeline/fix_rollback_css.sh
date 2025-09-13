#!/bin/bash
# Quick fix for rollback component CSS formatting

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing rollback component CSS variables...${NC}"

# Create backups
cd client360_dashboard
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p backups_styles_$TIMESTAMP
cp -f src/styles/variables-tbwa.scss backups_styles_$TIMESTAMP/variables-tbwa.scss.bak
cp -f src/themes/tbwa.scss backups_styles_$TIMESTAMP/tbwa.scss.bak
cp -f src/styles/common.scss backups_styles_$TIMESTAMP/common.scss.bak

echo "Created backups in backups_styles_$TIMESTAMP"

# Make sure the variables are correctly formatted in the CSS file
# Check if the variables already exist
if grep -q "rollback-bg" src/styles/variables-tbwa.scss; then
  # Fix the formatting - make sure it's inside the :root block
  sed -i '' 's/  --rollback-bg: #FFFFFF;/  --rollback-bg: #FFFFFF;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-border: #00C3EC;/  --rollback-border: #00C3EC;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-title: #002B80;/  --rollback-title: #002B80;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-text: #777777;/  --rollback-text: #777777;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-action-primary: #002B80;/  --rollback-action-primary: #002B80;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-action-secondary: #00C3EC;/  --rollback-action-secondary: #00C3EC;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-info-bg: rgba(0, 195, 236, 0.1);/  --rollback-info-bg: rgba(0, 195, 236, 0.1);/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-action-text: #FFFFFF;/  --rollback-action-text: #FFFFFF;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-action-text-secondary: #002B80;/  --rollback-action-text-secondary: #002B80;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-header-height: 32px;/  --rollback-header-height: 32px;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-content-padding: 24px;/  --rollback-content-padding: 24px;/' src/styles/variables-tbwa.scss
  sed -i '' 's/  --rollback-border-radius: 8px;/  --rollback-border-radius: 8px;/' src/styles/variables-tbwa.scss
  
  echo -e "${GREEN}CSS variables formatting fixed${NC}"
else
  # Add the rollback component variables to the TBWA variables file within the :root block
  awk '/:root {/ { print; print "\n  // Rollback component specific colors (explicit declarations to avoid theme issues)"; print "  --rollback-bg: #FFFFFF;"; print "  --rollback-border: #00C3EC;"; print "  --rollback-title: #002B80;"; print "  --rollback-text: #777777;"; print "  --rollback-action-primary: #002B80;"; print "  --rollback-action-secondary: #00C3EC;"; print "  --rollback-info-bg: rgba(0, 195, 236, 0.1);"; print "  --rollback-action-text: #FFFFFF;"; print "  --rollback-action-text-secondary: #002B80;"; print "  --rollback-header-height: 32px;"; print "  --rollback-content-padding: 24px;"; print "  --rollback-border-radius: 8px;"; next } 1' src/styles/variables-tbwa.scss > src/styles/variables-tbwa.scss.new
  
  mv src/styles/variables-tbwa.scss.new src/styles/variables-tbwa.scss
  echo -e "${GREEN}Added rollback component variables to TBWA variables file${NC}"
fi

echo -e "${YELLOW}Building TBWA theme with rollback component...${NC}"

if [ -f "dist/tbwa.css" ]; then
  rm -f dist/tbwa.css
fi

# Run webpack
npx webpack --config webpack.config.js --env theme=tbwa --mode production

# Check if the build was successful
if [ -f "dist/tbwa.css" ]; then
  echo -e "${GREEN}Successfully built TBWA theme with rollback styles${NC}"
  
  # Verify that rollback styles are in the compiled output
  if grep -q "rollback-dashboard" dist/tbwa.css; then
    echo -e "${GREEN}Verified rollback styles in compiled CSS${NC}"
  else
    echo -e "${RED}Error: Rollback styles not found in compiled CSS${NC}"
    exit 1
  fi
else
  echo -e "${RED}Failed to build TBWA theme${NC}"
  exit 1
fi

echo -e "${GREEN}Rollback component CSS fix complete!${NC}"