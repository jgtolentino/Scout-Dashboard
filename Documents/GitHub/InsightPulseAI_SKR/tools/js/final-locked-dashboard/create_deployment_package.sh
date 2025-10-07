#!/bin/bash
# create_deployment_package.sh - Create a complete deployment package for Scout Advanced Analytics

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
PACKAGE_NAME="scout_analytics_powerbi_package_$(date +%Y%m%d)"
OUTPUT_DIR="$SOURCE_DIR/output"
TEMP_DIR="/tmp/$PACKAGE_NAME"

# Header
echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Create Scout Analytics Power BI Style Deployment Package  ${RESET}"
echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Create temporary directory structure
echo -e "${BLUE}Creating package directory structure...${RESET}"
mkdir -p "$TEMP_DIR"/{css,js,docs,deployment}
mkdir -p "$OUTPUT_DIR"

# Copy main HTML files
echo -e "${BLUE}Copying HTML files...${RESET}"
cp "$SOURCE_DIR/insights_dashboard_v2.html" "$TEMP_DIR/"
cp "$SOURCE_DIR/deploy_power_bi_styled.sh" "$TEMP_DIR/"
chmod +x "$TEMP_DIR/deploy_power_bi_styled.sh"

# Copy CSS files
echo -e "${BLUE}Copying CSS files...${RESET}"
cp "$SOURCE_DIR/css/retail_edge_style_patch.css" "$TEMP_DIR/css/"
cp "$SOURCE_DIR/css/mockify-style.css" "$TEMP_DIR/css/" 2>/dev/null || echo -e "${YELLOW}mockify-style.css not found, skipping${RESET}"
cp "$SOURCE_DIR/css/shared-theme.css" "$TEMP_DIR/css/" 2>/dev/null || echo -e "${YELLOW}shared-theme.css not found, skipping${RESET}"

# Copy JS files
echo -e "${BLUE}Copying JS files...${RESET}"
cp "$SOURCE_DIR/js/unified_genai_insights.js" "$TEMP_DIR/js/" 2>/dev/null || echo -e "${YELLOW}unified_genai_insights.js not found${RESET}"
cp "$SOURCE_DIR/deployment-v2/public/js/unified_genai_insights.js" "$TEMP_DIR/js/" 2>/dev/null || echo -e "${YELLOW}Fetching from alternate location${RESET}"

# Copy documentation
echo -e "${BLUE}Copying documentation...${RESET}"
cp "$SOURCE_DIR/POWER_BI_STYLE_GUIDE.md" "$TEMP_DIR/docs/" 2>/dev/null || echo -e "${YELLOW}Style guide not found, skipping${RESET}"
cp -r "$SOURCE_DIR/docs/deployment/"* "$TEMP_DIR/deployment/" 2>/dev/null || echo -e "${YELLOW}Deployment guides not found, skipping${RESET}"

# Create a summary README
echo -e "${BLUE}Creating package README...${RESET}"
cat > "$TEMP_DIR/README.md" << 'EOF'
# Scout Advanced Analytics - Power BI Style Package

This package contains all necessary files to deploy the Scout Advanced Analytics dashboard with Power BI styling to match the Vercel deployment.

## Package Contents

- `insights_dashboard_v2.html` - Main dashboard HTML with Power BI styling
- `deploy_power_bi_styled.sh` - Deployment script for Azure Static Web Apps
- `css/` - Style files including the Power BI style harmonization
- `js/` - JavaScript files for dashboard functionality
- `docs/` - Documentation including style guide
- `deployment/` - Deployment instructions and scripts

## Quick Start

To deploy the dashboard:

```bash
# Make the deployment script executable if needed
chmod +x deploy_power_bi_styled.sh

# Run the deployment script
./deploy_power_bi_styled.sh
```

See `deployment/DEPLOYMENT_INSTRUCTIONS.md` for detailed deployment instructions.

## Style Harmonization

The package implements the following style improvements:

1. Azure blue header with breadcrumb navigation
2. KPI cards with left accent color bars
3. Enhanced chart containers with better headers/footers
4. Responsive insights grid with unified GenAI presentation
5. Improved footer with proper spacing

See `docs/POWER_BI_STYLE_GUIDE.md` for a complete list of style changes.

## Support

For assistance with this package, please refer to the documentation or contact the dashboard team.

---

Package created: $(date +"%Y-%m-%d")
EOF

# Create ZIP file
echo -e "${BLUE}Creating ZIP package...${RESET}"
cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/$PACKAGE_NAME.zip" . -x "*.DS_Store" -x "*.git*"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create ZIP package${RESET}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Clean up
echo -e "${BLUE}Cleaning up temporary directory...${RESET}"
rm -rf "$TEMP_DIR"

echo -e "${GREEN}Package created successfully!${RESET}"
echo -e "${YELLOW}Package location:${RESET} $OUTPUT_DIR/$PACKAGE_NAME.zip"
echo -e "${YELLOW}Package name:${RESET} $PACKAGE_NAME.zip"
echo -e "\n${BOLD}${GREEN}Done!${RESET}"