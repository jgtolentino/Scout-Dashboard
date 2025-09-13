#!/bin/bash
# Build script for TBWA theme CSS bundle

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building TBWA theme CSS bundle...${NC}"

# Check if webpack is installed
if ! command -v npx &> /dev/null; then
  echo -e "${RED}Error: npx command not found. Please install Node.js and npm.${NC}"
  exit 1
fi

# Create dist directory if it doesn't exist
mkdir -p dist

# Check if the assets directory exists in dist
if [ ! -d "dist/assets" ]; then
  mkdir -p dist/assets
fi

# Ensure the TBWA logo directory exists
if [ ! -d "assets/logos" ]; then
  mkdir -p assets/logos
fi

# Check if the webp logo exists
if [ ! -f "assets/logos/tbwasmp-logo.webp" ]; then
  echo -e "${YELLOW}Looking for tbwasmp-logo.webp...${NC}"
  
  # Check if the file has been downloaded to the user's Downloads folder
  USER_HOME=$(eval echo ~${USER})
  DOWNLOAD_PATHS=(
    "${USER_HOME}/Downloads/tbwasmp-logo.webp"
    "${USER_HOME}/Desktop/tbwasmp-logo.webp"
    "/tmp/tbwasmp-logo.webp"
  )
  
  LOGO_FOUND=false
  for SEARCH_PATH in "${DOWNLOAD_PATHS[@]}"; do
    if [ -f "$SEARCH_PATH" ]; then
      echo -e "${GREEN}Found the logo at: $SEARCH_PATH${NC}"
      cp "$SEARCH_PATH" "assets/logos/tbwasmp-logo.webp"
      LOGO_FOUND=true
      break
    fi
  done
  
  # If logo not found, search more efficiently in recent temp directories (last day)
  if [ "$LOGO_FOUND" = false ] && [ -d "/var/folders" ]; then
    echo -e "${YELLOW}Searching in recent temporary directories...${NC}"
    # Only search in folders modified in the last day to avoid long searches
    FOUND_LOGO=$(find /var/folders -type f -name "tbwasmp-logo.webp" -mtime -1 2>/dev/null | head -n 1)
    if [ -n "$FOUND_LOGO" ]; then
      echo -e "${GREEN}Found the logo at: $FOUND_LOGO${NC}"
      cp "$FOUND_LOGO" "assets/logos/tbwasmp-logo.webp"
      LOGO_FOUND=true
    fi
  fi
  
  # If logo still not found, create the SVG placeholder and update CSS
  if [ "$LOGO_FOUND" = false ]; then
    echo -e "${YELLOW}Warning: Could not find tbwasmp-logo.webp. Creating fallback SVG logo.${NC}"
    
    # Create a fallback SVG logo with updated TBWA colors (Azure Blue and Yellow-Orange)
    cat > assets/logos/tbwa-logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#0052CC"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#FFAB00" font-family="Arial" font-weight="bold" font-size="16">TBWA SMP</text>
</svg>
EOF
    
    # Update variables-tbwa.scss to use the SVG instead - create a new file and move it
    cat src/styles/variables-tbwa.scss | sed 's|url(.*/tbwasmp-logo.webp)|url(\"/assets/logos/tbwa-logo.svg\")|g' > src/styles/variables-tbwa.scss.new
    mv src/styles/variables-tbwa.scss.new src/styles/variables-tbwa.scss
    echo -e "${YELLOW}Updated variables-tbwa.scss to use fallback SVG logo${NC}"
    
    # Create a directory for the SVG if it doesn't exist
    mkdir -p client360/public/assets/logos
    
    # Verify the change was made
    if grep -q "tbwa-logo.svg" src/styles/variables-tbwa.scss; then
      echo -e "${GREEN}Successfully updated CSS to use SVG logo${NC}"
    else
      echo -e "${RED}Warning: Failed to update CSS file. Logo references may be broken.${NC}"
    fi
  fi
else
  echo -e "${GREEN}tbwasmp-logo.webp already exists.${NC}"
fi

# Ensure we have mimetype for webp in the deployment config
if [ -f "client360/public/staticwebapp.config.json" ]; then
  # Check if webp mime type is already in the config
  if ! grep -q '".webp"' "client360/public/staticwebapp.config.json"; then
    echo -e "${YELLOW}Adding WEBP mime type to staticwebapp.config.json...${NC}"
    sed -i '' 's|".svg": "image/svg+xml"|".svg": "image/svg+xml",\n    ".webp": "image/webp"|g' "client360/public/staticwebapp.config.json"
  fi
fi

# Build only the TBWA theme using webpack
echo -e "${YELLOW}Running webpack to build TBWA theme...${NC}"
npx webpack --config webpack.config.js --env theme=tbwa

# Check if the build was successful
if [ -f "dist/tbwa.css" ]; then
  echo -e "${GREEN}✅ TBWA theme CSS bundle built successfully!${NC}"
  
  # Copy either the webp logo or the SVG logo to the assets directory
  if [ -f "assets/logos/tbwasmp-logo.webp" ]; then
    mkdir -p dist/assets/logos
    cp assets/logos/tbwasmp-logo.webp dist/assets/logos/
    echo -e "${GREEN}✅ TBWA SMP logo (webp) copied to dist/assets/logos/tbwasmp-logo.webp${NC}"
  else
    mkdir -p dist/assets/logos
    cp assets/logos/tbwa-logo.svg dist/assets/logos/
    echo -e "${GREEN}✅ TBWA logo (SVG fallback) copied to dist/assets/logos/tbwa-logo.svg${NC}"
  fi
  
  # List the generated files
  echo -e "${YELLOW}Generated files:${NC}"
  ls -la dist/
  ls -la dist/assets/
  if [ -d "dist/assets/logos" ]; then
    ls -la dist/assets/logos/
  fi
else
  echo -e "${RED}❌ Failed to build TBWA theme CSS bundle.${NC}"
  exit 1
fi