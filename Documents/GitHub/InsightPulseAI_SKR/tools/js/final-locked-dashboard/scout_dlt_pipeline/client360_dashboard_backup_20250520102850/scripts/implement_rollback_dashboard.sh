#!/bin/bash
# Client360 Dashboard Rollback Implementation Script
# This script implements a rollback for the Client360 Dashboard to a known working state

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
ROLLBACK_ZIP="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output/tbwa_client360_dashboard_v2.3.0_20250519_191948.zip"
OUTPUT_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output"
DESKTOP_DIR="$HOME/Desktop"
STATIC_WEB_APP_NAME="tbwa-client360-dashboard"
RESOURCE_GROUP="InsightPulseAI-RG"

echo -e "${GREEN}Client360 Dashboard Rollback Implementation${NC}"
echo -e "${YELLOW}==============================================${NC}"

# Confirm rollback action
echo -e "${YELLOW}This script will roll back the Client360 Dashboard to a known working state.${NC}"
echo -e "${YELLOW}A backup of the current deploy directory will be created before proceeding.${NC}"
read -p "Do you want to continue with the rollback? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Rollback cancelled.${NC}"
    exit 1
fi

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
    
    # Ask user to select a different zip file
    read -p "Enter the name of a different zip file to use for rollback (or press Enter to cancel): " ALTERNATIVE_ZIP
    if [ -z "$ALTERNATIVE_ZIP" ]; then
        echo -e "${RED}Rollback cancelled.${NC}"
        exit 1
    elif [ ! -f "$OUTPUT_DIR/$ALTERNATIVE_ZIP" ]; then
        echo -e "${RED}Error: File $OUTPUT_DIR/$ALTERNATIVE_ZIP does not exist.${NC}"
        exit 1
    else
        ROLLBACK_ZIP="$OUTPUT_DIR/$ALTERNATIVE_ZIP"
    fi
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

# Check HTML files
for HTML_FILE in index.html direct_url_links.html guide.html prd.html; do
    if [ ! -f "$SOURCE_DIR/$HTML_FILE" ]; then
        echo -e "${RED}Warning: $HTML_FILE is missing!${NC}"
        MISSING_FILES=1
    fi
done

# Check CSS files
for CSS_FILE in css/dashboard.css css/tbwa-theme.css css/variables.css; do
    if [ ! -f "$SOURCE_DIR/$CSS_FILE" ]; then
        echo -e "${RED}Warning: $CSS_FILE is missing!${NC}"
        MISSING_FILES=1
    fi
done

# Check JavaScript files
for JS_FILE in js/dashboard.js js/store_map.js js/tbwa-charts.js; do
    if [ ! -f "$SOURCE_DIR/$JS_FILE" ]; then
        echo -e "${RED}Warning: $JS_FILE is missing!${NC}"
        MISSING_FILES=1
    fi
done

# Check geospatial map files
if [ ! -f "$SOURCE_DIR/data/philippines_outline.geojson" ]; then
    echo -e "${RED}Warning: Philippines GeoJSON file is missing!${NC}"
    MISSING_FILES=1
fi

if [ ! -f "$SOURCE_DIR/data/stores.geojson" ]; then
    echo -e "${RED}Warning: Stores GeoJSON file is missing!${NC}"
    MISSING_FILES=1
fi

# If missing files, ask for confirmation
if [ $MISSING_FILES -eq 1 ]; then
    echo -e "${RED}Some essential files are missing from the rollback package.${NC}"
    read -p "Do you want to continue with the rollback anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Rollback cancelled.${NC}"
        exit 1
    fi
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

# Ask for confirmation to deploy
read -p "Do you want to deploy the rollback version to Azure Static Web App? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Deploying rollback version to Azure...${NC}"
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        echo -e "${RED}Azure CLI not found. Please install Azure CLI and try again.${NC}"
        echo -e "${YELLOW}You can manually deploy using the Azure Static Web Apps CLI or portal.${NC}"
        echo -e "${YELLOW}Deployment package is available at: $DESKTOP_DIR/$DEPLOY_ZIP${NC}"
    else
        # Login to Azure
        echo -e "${YELLOW}Logging in to Azure...${NC}"
        az login
        
        # Deploy using Azure CLI
        echo -e "${YELLOW}Deploying to Azure Static Web App...${NC}"
        az staticwebapp deploy \
            --name $STATIC_WEB_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --source-path "$SOURCE_DIR"
            
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        echo -e "Your dashboard has been rolled back to the working version."
        echo -e "Please verify the deployment at the appropriate Azure URL."
    fi
else
    echo -e "${YELLOW}Skipping deployment. Package created for manual deployment.${NC}"
    echo -e "To manually deploy, you can use:"
    echo -e "  - Azure Portal: Upload the zip file at $DESKTOP_DIR/$DEPLOY_ZIP"
    echo -e "  - Azure CLI: az staticwebapp deploy --name $STATIC_WEB_APP_NAME --source $SOURCE_DIR"
    echo -e "  - SWA CLI: swa deploy $SOURCE_DIR --deployment-token <your-token>"
fi

# Create verification checklist
VERIFICATION_FILE="../CLIENT360_ROLLBACK_VERIFICATION.md"
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
| HTML Files | ⏳ | Verify index.html, direct_url_links.html, guide.html, prd.html |
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
echo -e "${YELLOW}Please complete the verification checklist to ensure all components are working correctly.${NC}"
exit 0