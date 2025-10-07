#!/bin/bash
# Automated Client360 Dashboard Rollback Implementation Script
# This script implements a rollback for the Client360 Dashboard to fix CSS styling issues

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_SUFFIX=$(date +"%Y%m%d%H%M%S")
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy"
BACKUP_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy_backup_${BACKUP_SUFFIX}"
ROLLBACK_ZIP="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output/client360_dashboard_rollback_20250519201210.zip"
OUTPUT_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output"
DESKTOP_DIR="$HOME/Desktop"
STATIC_WEB_APP_NAME="tbwa-client360-dashboard"
RESOURCE_GROUP="InsightPulseAI-RG"

echo -e "${GREEN}Client360 Dashboard Rollback Implementation${NC}"
echo -e "${YELLOW}==============================================${NC}"
echo -e "${YELLOW}Automatically rolling back to fix CSS styling issues${NC}"

# Create backup of current deploy directory
echo -e "${BLUE}Creating backup of current deploy directory...${NC}"
if [ -d "$SOURCE_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$SOURCE_DIR/"* "$BACKUP_DIR/"
    echo -e "${GREEN}Current deployment backed up to: $BACKUP_DIR${NC}"
else
    echo -e "${RED}Error: Source directory $SOURCE_DIR does not exist.${NC}"
    exit 1
fi

# Check if rollback zip exists
if [ ! -f "$ROLLBACK_ZIP" ]; then
    echo -e "${RED}Error: Rollback zip file does not exist: $ROLLBACK_ZIP${NC}"
    echo -e "${YELLOW}Available backup files in output directory:${NC}"
    ls -la "$OUTPUT_DIR" | grep "zip"
    exit 1
fi

# Clean deploy directory
echo -e "${BLUE}Cleaning deploy directory...${NC}"
rm -rf "$SOURCE_DIR"/*

# Extract rollback zip to deploy directory
echo -e "${BLUE}Extracting rollback zip to deploy directory...${NC}"
unzip -q "$ROLLBACK_ZIP" -d "$SOURCE_DIR"

# Verify essential files
echo -e "${BLUE}Verifying essential files...${NC}"
MISSING_FILES=0

# Check HTML files - only require index.html as mandatory
if [ ! -f "$SOURCE_DIR/index.html" ]; then
    echo -e "${RED}Critical error: index.html is missing!${NC}"
    exit 1
fi

# Check CSS files
for CSS_FILE in css/dashboard.css css/tbwa-theme.css css/variables.css; do
    if [ ! -f "$SOURCE_DIR/$CSS_FILE" ]; then
        echo -e "${RED}Warning: $CSS_FILE is missing!${NC}"
        MISSING_FILES=1
    else
        echo -e "${GREEN}Found CSS file: $CSS_FILE${NC}"
    fi
done

# Check JavaScript files
for JS_FILE in js/dashboard.js js/store_map.js; do
    if [ ! -f "$SOURCE_DIR/$JS_FILE" ]; then
        echo -e "${RED}Warning: $JS_FILE is missing!${NC}"
        MISSING_FILES=1
    else
        echo -e "${GREEN}Found JS file: $JS_FILE${NC}"
    fi
done

# Create the staticwebapp.config.json if it doesn't exist
if [ ! -f "$SOURCE_DIR/staticwebapp.config.json" ]; then
    echo -e "${YELLOW}Warning: staticwebapp.config.json is missing, creating it...${NC}"
    cat > "$SOURCE_DIR/staticwebapp.config.json" << EOF
{
  "routes": [
    {
      "route": "/css/*.css",
      "headers": {
        "content-type": "text/css"
      }
    },
    {
      "route": "/js/*.js",
      "headers": {
        "content-type": "application/javascript"
      }
    },
    {
      "route": "/*.html",
      "headers": {
        "content-type": "text/html"
      }
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.azurewebsites.net https://unpkg.com https://fonts.googleapis.com https://fonts.gstatic.com;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Access-Control-Allow-Origin": "*"
  },
  "mimeTypes": {
    ".css": "text/css",
    ".js": "application/javascript",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".geojson": "application/json"
  }
}
EOF
    echo -e "${GREEN}Created staticwebapp.config.json${NC}"
fi

if [ $MISSING_FILES -eq 1 ]; then
    echo -e "${YELLOW}Some non-critical files are missing from the rollback package.${NC}"
    echo -e "${YELLOW}Continuing with rollback since index.html and essential files are present.${NC}"
else
    echo -e "${GREEN}All essential files verified!${NC}"
fi

# Create a new deployment package
echo -e "${BLUE}Creating new deployment package...${NC}"
DEPLOY_ZIP="client360_dashboard_rollback_${BACKUP_SUFFIX}.zip"
(cd "$SOURCE_DIR" && zip -r "$OUTPUT_DIR/$DEPLOY_ZIP" .)
echo -e "${GREEN}Deployment package created: $OUTPUT_DIR/$DEPLOY_ZIP${NC}"

# Copy to Desktop for easy access
echo -e "${BLUE}Copying deployment package to Desktop...${NC}"
cp "$OUTPUT_DIR/$DEPLOY_ZIP" "$DESKTOP_DIR/"
echo -e "${GREEN}Deployment package copied to: $DESKTOP_DIR/$DEPLOY_ZIP${NC}"

# Create verification checklist
VERIFICATION_FILE="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/CLIENT360_ROLLBACK_VERIFICATION.md"
cat > "$VERIFICATION_FILE" << EOF
# Client360 Dashboard Rollback Verification

## Rollback Summary

- **Rollback Date**: $(date +"%B %d, %Y")
- **Rollback Zip**: ${DEPLOY_ZIP}
- **Backup Location**: ${BACKUP_DIR}
- **Status**: ⏳ Pending verification

## Files Verification

| Component | Status | Notes |
|-----------|--------|-------|
| HTML Files | ⏳ | Verify index.html loads correctly |
| CSS Files | ⏳ | Verify TBWA theme is properly applied |
| JavaScript Files | ⏳ | Verify all JS functions work correctly |
| Store Map | ⏳ | Verify geospatial map loads and displays correctly |
| GeoJSON Data | ⏳ | Verify store locations appear on the map |

## Functionality Verification

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard Layout | ⏳ | Verify proper layout and styling |
| TBWA Branding | ⏳ | Verify TBWA colors and branding elements |
| Charts & Visualizations | ⏳ | Verify all charts display correctly |
| Map Interaction | ⏳ | Verify zoom, pan, click interactions |
| Documentation Links | ⏳ | Verify all documentation is accessible |
| Mobile Responsiveness | ⏳ | Verify dashboard is responsive on mobile devices |

## Next Steps

1. Complete the verification checklist above
2. Document any remaining issues
3. Update status to ✅ Completed or ❌ Failed

---

*Rollback performed by: Dashboard Team*
EOF

echo -e "${GREEN}Created rollback verification checklist: $VERIFICATION_FILE${NC}"
echo -e "${GREEN}Rollback implementation completed successfully.${NC}"
echo -e "${YELLOW}Please deploy the package manually using the Azure Portal:${NC}"
echo -e "${YELLOW}1. Login to Azure Portal${NC}"
echo -e "${YELLOW}2. Navigate to tbwa-client360-dashboard Static Web App${NC}"
echo -e "${YELLOW}3. Go to Deployment > Manual Deploy${NC}"
echo -e "${YELLOW}4. Upload the zip file: $DESKTOP_DIR/$DEPLOY_ZIP${NC}"
echo -e "${YELLOW}5. Once deployed, verify using the checklist: $VERIFICATION_FILE${NC}"

echo -e "${GREEN}Rollback preparation complete. Please deploy the package manually as instructed.${NC}"