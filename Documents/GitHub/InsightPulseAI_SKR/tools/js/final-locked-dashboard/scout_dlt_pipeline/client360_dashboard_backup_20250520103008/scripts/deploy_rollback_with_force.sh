#!/bin/bash
# Client360 Dashboard Rollback Implementation Script with Force Option
# This script implements a rollback for the Client360 Dashboard to a known working state
# and continues even if some non-critical files are missing

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
OUTPUT_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output"
DESKTOP_DIR="$HOME/Desktop"
STATIC_WEB_APP_NAME="tbwa-client360-dashboard"
RESOURCE_GROUP="InsightPulseAI-RG"

echo -e "${GREEN}Client360 Dashboard Rollback Implementation (FORCE MODE)${NC}"
echo -e "${YELLOW}=======================================================${NC}"
echo -e "${YELLOW}This script will roll back the Client360 Dashboard to a known working state.${NC}"
echo -e "${RED}FORCE MODE: Will continue even if non-critical files are missing.${NC}"
echo -e "${YELLOW}A backup of the current deploy directory will be created before proceeding.${NC}"

# Create backup of current deploy directory
echo -e "${BLUE}Creating backup of current deploy directory...${NC}"
if [ -d "$SOURCE_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$SOURCE_DIR/"* "$BACKUP_DIR/"
    echo -e "${GREEN}Current deployment backed up to: $BACKUP_DIR${NC}"
else
    echo -e "${RED}Warning: Source directory $SOURCE_DIR does not exist. Creating it...${NC}"
    mkdir -p "$SOURCE_DIR"
fi

# Find latest backup in output directory
echo -e "${BLUE}Finding latest backup in output directory...${NC}"
LATEST_ZIP=$(ls -t $OUTPUT_DIR/*.zip | head -n 1)

if [ -z "$LATEST_ZIP" ]; then
    echo -e "${RED}Error: No backup zip files found in $OUTPUT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}Using backup: $LATEST_ZIP${NC}"

# Clean deploy directory
echo -e "${BLUE}Cleaning deploy directory...${NC}"
rm -rf "$SOURCE_DIR"/*

# Extract rollback zip to deploy directory
echo -e "${BLUE}Extracting rollback zip to deploy directory...${NC}"
unzip -q "$LATEST_ZIP" -d "$SOURCE_DIR"

# Verify essential files
echo -e "${BLUE}Verifying essential files...${NC}"
MISSING_CRITICAL_FILES=0

# Check HTML files (only index.html is critical)
if [ ! -f "$SOURCE_DIR/index.html" ]; then
    echo -e "${RED}CRITICAL: index.html is missing!${NC}"
    MISSING_CRITICAL_FILES=1
else
    echo -e "${GREEN}Found critical file: index.html${NC}"
fi

# Create missing non-critical HTML files if needed
for HTML_FILE in direct_url_links.html guide.html prd.html; do
    if [ ! -f "$SOURCE_DIR/$HTML_FILE" ]; then
        echo -e "${YELLOW}Non-critical file $HTML_FILE is missing. Creating placeholder...${NC}"
        echo "<html><head><title>Client360 Dashboard - $HTML_FILE</title></head><body><h1>Client360 Dashboard</h1><p>This is a placeholder page created during rollback.</p></body></html>" > "$SOURCE_DIR/$HTML_FILE"
    else
        echo -e "${GREEN}Found: $HTML_FILE${NC}"
    fi
done

# Check CSS files (all are critical)
for CSS_FILE in css/dashboard.css css/tbwa-theme.css css/variables.css; do
    if [ ! -f "$SOURCE_DIR/$CSS_FILE" ]; then
        # Create parent directory if it doesn't exist
        mkdir -p "$(dirname "$SOURCE_DIR/$CSS_FILE")"
        
        echo -e "${YELLOW}Critical CSS file $CSS_FILE is missing. Restoring from backup...${NC}"
        
        # Look for the file in the backup directory
        if [ -f "$BACKUP_DIR/$CSS_FILE" ]; then
            cp "$BACKUP_DIR/$CSS_FILE" "$SOURCE_DIR/$CSS_FILE"
            echo -e "${GREEN}Restored $CSS_FILE from backup${NC}"
        else
            echo -e "${RED}CRITICAL: $CSS_FILE is missing and not found in backup!${NC}"
            MISSING_CRITICAL_FILES=1
            
            # Create a basic placeholder file
            echo "/* Placeholder CSS file created during rollback */" > "$SOURCE_DIR/$CSS_FILE"
        fi
    else
        echo -e "${GREEN}Found: $CSS_FILE${NC}"
    fi
done

# Check JavaScript files (dashboard.js is critical)
if [ ! -f "$SOURCE_DIR/js/dashboard.js" ]; then
    # Create directory if it doesn't exist
    mkdir -p "$SOURCE_DIR/js"
    
    echo -e "${RED}CRITICAL: js/dashboard.js is missing!${NC}"
    
    # Look for the file in the backup directory
    if [ -f "$BACKUP_DIR/js/dashboard.js" ]; then
        cp "$BACKUP_DIR/js/dashboard.js" "$SOURCE_DIR/js/dashboard.js"
        echo -e "${GREEN}Restored js/dashboard.js from backup${NC}"
    else
        echo -e "${RED}CRITICAL: js/dashboard.js is missing and not found in backup!${NC}"
        MISSING_CRITICAL_FILES=1
        
        # Create a basic placeholder file
        echo "// Placeholder JavaScript file created during rollback" > "$SOURCE_DIR/js/dashboard.js"
    fi
else
    echo -e "${GREEN}Found critical file: js/dashboard.js${NC}"
fi

# Create missing non-critical JS files if needed
for JS_FILE in js/store_map.js js/tbwa-charts.js; do
    if [ ! -f "$SOURCE_DIR/$JS_FILE" ]; then
        # Create parent directory if it doesn't exist
        mkdir -p "$(dirname "$SOURCE_DIR/$JS_FILE")"
        
        echo -e "${YELLOW}Non-critical file $JS_FILE is missing. Creating placeholder...${NC}"
        echo "// Placeholder JavaScript file created during rollback" > "$SOURCE_DIR/$JS_FILE"
    else
        echo -e "${GREEN}Found: $JS_FILE${NC}"
    fi
done

# Check geospatial map files (can continue without them but with warning)
mkdir -p "$SOURCE_DIR/data"
if [ ! -f "$SOURCE_DIR/data/philippines_outline.geojson" ]; then
    echo -e "${YELLOW}Warning: Philippines GeoJSON file is missing!${NC}"
    
    # Look for the file in the backup directory
    if [ -f "$BACKUP_DIR/data/philippines_outline.geojson" ]; then
        cp "$BACKUP_DIR/data/philippines_outline.geojson" "$SOURCE_DIR/data/philippines_outline.geojson"
        echo -e "${GREEN}Restored philippines_outline.geojson from backup${NC}"
    else
        echo -e "${YELLOW}Creating placeholder GeoJSON file for Philippines outline${NC}"
        echo '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Philippines"},"geometry":{"type":"Polygon","coordinates":[[[120.0,10.0],[121.0,10.0],[121.0,11.0],[120.0,11.0],[120.0,10.0]]]}}]}' > "$SOURCE_DIR/data/philippines_outline.geojson"
    fi
fi

if [ ! -f "$SOURCE_DIR/data/stores.geojson" ]; then
    echo -e "${YELLOW}Warning: Stores GeoJSON file is missing!${NC}"
    
    # Look for the file in the backup directory
    if [ -f "$BACKUP_DIR/data/stores.geojson" ]; then
        cp "$BACKUP_DIR/data/stores.geojson" "$SOURCE_DIR/data/stores.geojson"
        echo -e "${GREEN}Restored stores.geojson from backup${NC}"
    else
        echo -e "${YELLOW}Creating placeholder GeoJSON file for store locations${NC}"
        echo '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"StoreID":"sari-001","Name":"Sample Store 1","Sales":25000},"geometry":{"type":"Point","coordinates":[121.0,14.5]}},{"type":"Feature","properties":{"StoreID":"sari-002","Name":"Sample Store 2","Sales":15000},"geometry":{"type":"Point","coordinates":[121.1,14.6]}}]}' > "$SOURCE_DIR/data/stores.geojson"
    fi
fi

# If critical files are missing, ask for confirmation
if [ $MISSING_CRITICAL_FILES -eq 1 ]; then
    echo -e "${RED}WARNING: Some critical files are missing from the rollback package.${NC}"
    echo -e "${RED}The dashboard may not function correctly after rollback.${NC}"
    echo -e "${YELLOW}Do you want to continue with the rollback anyway? (y/n)${NC}"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Rollback cancelled.${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Continuing with rollback despite missing critical files...${NC}"
else
    echo -e "${GREEN}All critical files verified or restored!${NC}"
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

echo -e "${BLUE}Do you want to deploy the rollback version to Azure Static Web App? (y/n)${NC}"
read -p "" -n 1 -r
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