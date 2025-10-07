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

# Ensure the TBWA logo exists
if [ ! -d "assets/logos" ]; then
  mkdir -p assets/logos
fi

# Check if TBWA logo exists, create a placeholder if not
if [ ! -f "assets/logos/tbwa-logo.svg" ]; then
  echo -e "${YELLOW}Creating placeholder TBWA logo...${NC}"
  
  cat > assets/logos/tbwa-logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#000"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#FFC300" font-family="Arial" font-weight="bold" font-size="16">TBWA</text>
</svg>
EOF
fi

# Build only the TBWA theme using webpack
echo -e "${YELLOW}Running webpack to build TBWA theme...${NC}"
npx webpack --config webpack.config.js --env theme=tbwa

# Check if the build was successful
if [ -f "dist/tbwa.css" ]; then
  echo -e "${GREEN}✅ TBWA theme CSS bundle built successfully!${NC}"
  
  # Also copy the logo to the assets directory
  cp assets/logos/tbwa-logo.svg dist/assets/
  echo -e "${GREEN}✅ TBWA logo copied to dist/assets/tbwa-logo.svg${NC}"
  
  # List the generated files
  echo -e "${YELLOW}Generated files:${NC}"
  ls -la dist/
  ls -la dist/assets/
else
  echo -e "${RED}❌ Failed to build TBWA theme CSS bundle.${NC}"
  exit 1
fi