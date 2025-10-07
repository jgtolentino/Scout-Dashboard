#!/bin/bash
# package_dashboard.sh - Safe, robust dashboard packaging script for Scout Analytics
# Creates a deployment package and copies it to the user's desktop

# Exit on any error
set -e

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Environment setup with fallbacks
ROOT_DIR="${SCOUT_ROOT_DIR:-$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard}"
OUTPUT_DIR="$ROOT_DIR/output"
DEST="$OUTPUT_DIR/scout_dashboard_package"
DESKTOP="${HOME}/Desktop"
ZIP_NAME="scout_dashboard_deployment.zip"

# Display header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Scout Dashboard Deployment Package Creator    ${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════╝${RESET}"
echo ""

# Validate source directory
if [ ! -d "$ROOT_DIR" ]; then
  echo -e "${RED}ERROR: Source directory does not exist: $ROOT_DIR${RESET}"
  echo -e "${YELLOW}Set SCOUT_ROOT_DIR environment variable to correct path${RESET}"
  exit 1
fi

# Ensure clean destination
echo -e "${BLUE}🔄 Creating output folder...${RESET}"
rm -rf "$DEST"
mkdir -p "$DEST"

# Create organized folder structure
echo -e "${BLUE}📂 Creating folder structure...${RESET}"
mkdir -p "$DEST"/{css,js,docs,deployment,assets/data}

# Copy public assets
echo -e "${BLUE}📦 Copying deployment assets...${RESET}"
if [ -d "$ROOT_DIR/deployment-v2/public" ]; then
  echo -e "${GREEN}Found deployment-v2 structure${RESET}"
  cp -r "$ROOT_DIR/deployment-v2/public/"* "$DEST/" 2>/dev/null || true
  cp -r "$ROOT_DIR/deployment-v2/public/css/"* "$DEST/css/" 2>/dev/null || true
  cp -r "$ROOT_DIR/deployment-v2/public/js/"* "$DEST/js/" 2>/dev/null || true
  cp -r "$ROOT_DIR/deployment-v2/public/assets/data/"* "$DEST/assets/data/" 2>/dev/null || true
else
  echo -e "${YELLOW}Warning: deployment-v2 structure not found, using fallback paths${RESET}"
  # Fallback to direct structure
  cp -r "$ROOT_DIR/css/"* "$DEST/css/" 2>/dev/null || true
  cp -r "$ROOT_DIR/js/"* "$DEST/js/" 2>/dev/null || true
  cp -r "$ROOT_DIR/assets/data/"* "$DEST/assets/data/" 2>/dev/null || true
fi

# Copy core files
echo -e "${BLUE}📄 Copying core dashboard files...${RESET}"
cp "$ROOT_DIR/deploy_power_bi_styled.sh" "$DEST/" 2>/dev/null || echo -e "${YELLOW}Warning: deploy_power_bi_styled.sh not found${RESET}"
cp "$ROOT_DIR/POWER_BI_STYLE_GUIDE.md" "$DEST/docs/" 2>/dev/null || echo -e "${YELLOW}Warning: POWER_BI_STYLE_GUIDE.md not found${RESET}"
cp "$ROOT_DIR/insights_dashboard_v2.html" "$DEST/" 2>/dev/null || echo -e "${YELLOW}Warning: insights_dashboard_v2.html not found${RESET}"
cp "$ROOT_DIR/css/retail_edge_style_patch.css" "$DEST/css/" 2>/dev/null || echo -e "${YELLOW}Warning: retail_edge_style_patch.css not found${RESET}"

# Copy documentation
echo -e "${BLUE}📚 Copying documentation...${RESET}"
if [ -d "$ROOT_DIR/docs/deployment" ]; then
  cp -r "$ROOT_DIR/docs/deployment/"* "$DEST/deployment/" 2>/dev/null || true
else
  echo -e "${YELLOW}Warning: docs/deployment directory not found${RESET}"
fi

# Make scripts executable
echo -e "${BLUE}🔐 Making scripts executable...${RESET}"
find "$DEST" -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true

# Create README at top level
echo -e "${BLUE}📝 Creating README...${RESET}"
cat > "$DEST/README.md" << 'EOF'
# 🧭 Scout Dashboard Deployment (Azure Power BI Style)

## 🛠 What's Inside
- Full `insights_dashboard_v2.html` for Azure
- Tailwind-compatible CSS patch
- Unified GenAI JS logic
- Azure SWA deploy script
- GitHub CI/CD YAML (optional)
- All docs for design/style parity

## 🚀 Deploy
```bash
# Using the deployment script
chmod +x deploy_power_bi_styled.sh
./deploy_power_bi_styled.sh
```

## 🌐 Azure CLI Direct Deploy (Optional)
```bash
# Using Azure CLI directly
chmod +x deployment/manual_az_cli.sh
./deployment/manual_az_cli.sh
```

## 🤖 GitHub CI/CD (Optional)
Place the file `deployment/GITHUB_WORKFLOW_SWA.yml` in your repository at `.github/workflows/` to enable automatic deployment on push to main.

## 📖 Documentation
- `docs/POWER_BI_STYLE_GUIDE.md` - Complete style guide
- `deployment/DEPLOYMENT_INSTRUCTIONS.md` - Detailed deployment instructions

## 🎯 Azure Deployment Context
- App Name: `tbwa-juicer-insights-dashboard`
- Resource Group: `RG-TBWA-ProjectScout-Juicer`
- Region: East US 2

*Package created: $(date +"%Y-%m-%d")*
EOF

# Create ZIP package
echo -e "${BLUE}🗂 Creating zip package...${RESET}"
rm -f "$OUTPUT_DIR/$ZIP_NAME"
(cd "$OUTPUT_DIR" && zip -rq "$ZIP_NAME" scout_dashboard_package)

# Check zip creation success
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Failed to create zip package${RESET}"
  exit 1
fi

# Copy to desktop
echo -e "${BLUE}📤 Copying to desktop...${RESET}"
if [ -d "$DESKTOP" ]; then
  cp "$OUTPUT_DIR/$ZIP_NAME" "$DESKTOP/"
  
  # Create descriptive README on desktop
  cat > "$DESKTOP/SCOUT_DASHBOARD_README.md" << EOF
# Scout Analytics Power BI Style Dashboard

This package contains all the files needed to deploy the Scout Advanced Analytics dashboard with Power BI styling to match the Vercel app.

## Quick Start

1. Unzip the package: \`unzip scout_dashboard_deployment.zip\`
2. Navigate to the extracted folder: \`cd scout_dashboard_package\`
3. Make the deployment script executable: \`chmod +x deploy_power_bi_styled.sh\`
4. Run the deployment script: \`./deploy_power_bi_styled.sh\`

## Azure Deployment Context

- **App Name**: \`tbwa-juicer-insights-dashboard\`
- **Resource Group**: \`RG-TBWA-ProjectScout-Juicer\` 
- **Region**: East US 2

## Documentation

See the README.md file inside the package for complete details.

*Package created: $(date +"%Y-%m-%d")*
EOF

  echo -e "${GREEN}✅ Desktop README created${RESET}"
  echo -e "${GREEN}✅ Package copied to desktop: $DESKTOP/$ZIP_NAME${RESET}"
else
  echo -e "${YELLOW}⚠️ Desktop directory not found, package available at: $OUTPUT_DIR/$ZIP_NAME${RESET}"
fi

# Print summary
echo -e "\n${BOLD}${GREEN}Deployment Package Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Package location: ${GREEN}$OUTPUT_DIR/$ZIP_NAME${RESET}"
if [ -d "$DESKTOP" ]; then
  echo -e "Desktop copy: ${GREEN}$DESKTOP/$ZIP_NAME${RESET}"
fi
echo -e "Package size: ${GREEN}$(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)${RESET}"
echo -e "Files included: ${GREEN}$(unzip -l "$OUTPUT_DIR/$ZIP_NAME" | grep -v Archive | wc -l | xargs)${RESET}"
echo -e "\n${BOLD}${GREEN}✅ Package creation completed successfully!${RESET}"