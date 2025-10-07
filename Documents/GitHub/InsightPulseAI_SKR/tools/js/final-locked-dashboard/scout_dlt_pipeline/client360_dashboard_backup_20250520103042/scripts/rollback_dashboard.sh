#!/bin/bash
# Scout Advisor Dashboard Rollback Script
# This script rolls back the dashboard to the known working version (golden-20250519)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
GOLDEN_TAG="golden-20250519"
SOURCE_DIR="deploy-advisor-fixed"
OUTPUT_DIR="output"
STATIC_WEB_APP_NAME="scout-dashboard"
RESOURCE_GROUP="InsightPulseAI-RG"
BACKUP_SUFFIX=$(date +"%Y%m%d%H%M%S")

echo -e "${GREEN}Scout Advisor Dashboard Rollback${NC}"
echo -e "Rolling back to golden tag: ${YELLOW}${GOLDEN_TAG}${NC}"
echo -e "${YELLOW}=====================================${NC}"

# Ensure we're in the right directory (repository root)
cd "$(dirname "$0")/../../../.."

# Validate git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository.${NC}"
    exit 1
fi

# Validate the golden tag exists
if ! git tag -l | grep -q "^${GOLDEN_TAG}$"; then
    echo -e "${RED}Error: Golden tag '${GOLDEN_TAG}' does not exist.${NC}"
    echo "Available tags:"
    git tag -l | sort -r | head -n 10
    exit 1
fi

# Backup current deploy directory
if [ -d "${SOURCE_DIR}" ]; then
    echo -e "${YELLOW}Backing up current ${SOURCE_DIR} directory...${NC}"
    BACKUP_DIR="${SOURCE_DIR}_backup_${BACKUP_SUFFIX}"
    cp -r "${SOURCE_DIR}" "${BACKUP_DIR}"
    echo -e "${GREEN}Current deployment backed up to: ${BACKUP_DIR}${NC}"
fi

# Create a temporary directory for the checkout
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Creating temporary directory for checkout: ${TEMP_DIR}${NC}"

# Extract files from the golden tag
echo -e "${YELLOW}Extracting dashboard files from golden tag...${NC}"
git show "${GOLDEN_TAG}:${SOURCE_DIR}" > /dev/null 2>&1 || {
    echo -e "${RED}Error: Could not find ${SOURCE_DIR} in golden tag.${NC}"
    exit 1
}

# Check out the deployment files from the golden tag
for file in $(git ls-tree -r --name-only "${GOLDEN_TAG}" "${SOURCE_DIR}"); do
    # Create directory structure in temp dir
    mkdir -p "${TEMP_DIR}/$(dirname "${file}")"
    # Extract file content
    git show "${GOLDEN_TAG}:${file}" > "${TEMP_DIR}/${file}"
done

# Clear the current deployment directory
echo -e "${YELLOW}Clearing current deployment directory...${NC}"
rm -rf "${SOURCE_DIR}"
mkdir -p "${SOURCE_DIR}"

# Copy files from temp to deployment directory
echo -e "${YELLOW}Restoring files from golden tag...${NC}"
cp -r "${TEMP_DIR}/${SOURCE_DIR}/"* "${SOURCE_DIR}/"

# Verify essential geospatial map files are included
echo -e "${YELLOW}Verifying geospatial map files...${NC}"
MAP_FILES_MISSING=0

# Check for store map JavaScript component
if [ ! -f "${SOURCE_DIR}/js/components/store_map.js" ] && [ ! -f "${SOURCE_DIR}/js/store_map.js" ]; then
    echo -e "${RED}Warning: Store map JavaScript file not found!${NC}"
    MAP_FILES_MISSING=1
fi

# Check for GeoJSON data
if [ ! -f "${SOURCE_DIR}/data/philippines_outline.geojson" ]; then
    echo -e "${RED}Warning: Philippines GeoJSON file not found!${NC}"
    MAP_FILES_MISSING=1
fi

# Provide warning if map files are missing
if [ $MAP_FILES_MISSING -eq 1 ]; then
    echo -e "${RED}Some geospatial map files appear to be missing from the golden tag.${NC}"
    echo -e "${YELLOW}The map component may not function correctly after rollback.${NC}"
    read -p "Do you want to continue with the rollback anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Rollback cancelled.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}All geospatial map files verified!${NC}"
fi

# Clean up temporary directory
rm -rf "${TEMP_DIR}"

# Create deployment package
echo -e "${GREEN}Creating deployment package...${NC}"
mkdir -p "${OUTPUT_DIR}"
ZIPFILE="scout_advisor_dashboard_rollback_${BACKUP_SUFFIX}.zip"
(cd "${SOURCE_DIR}" && zip -r "../${OUTPUT_DIR}/${ZIPFILE}" .)

echo -e "${GREEN}Deployment package created: ${OUTPUT_DIR}/${ZIPFILE}${NC}"

# Ask for confirmation to deploy
read -p "Do you want to deploy the rollback version to Azure Static Web App? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deploying rollback version to Azure...${NC}"
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        echo -e "${RED}Azure CLI not found. Please install Azure CLI and try again.${NC}"
        echo -e "${YELLOW}You can manually deploy using: az staticwebapp deploy --name $STATIC_WEB_APP_NAME --source ${SOURCE_DIR}${NC}"
        exit 1
    fi
    
    # Deploy using Azure CLI
    az staticwebapp deploy \
        --name $STATIC_WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --source-path "${SOURCE_DIR}"
        
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo -e "Your dashboard has been rolled back to the working version."
    echo -e "Verify the deployment at: ${YELLOW}https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor${NC}"
else
    echo -e "${YELLOW}Skipping deployment. Package created for manual deployment.${NC}"
    echo -e "To manually deploy, you can use:"
    echo -e "  - Azure CLI: az staticwebapp deploy --name $STATIC_WEB_APP_NAME --source ${SOURCE_DIR}"
    echo -e "  - SWA CLI: swa deploy ${SOURCE_DIR} --deployment-token <your-token>"
fi

# Create a rollback verification checklist
VERIFICATION_FILE="DASHBOARD_ROLLBACK_VERIFICATION.md"
cat > "${VERIFICATION_FILE}" << EOF
# Scout Advisor Dashboard Rollback Verification

## Rollback Summary

- **Rollback Date**: $(date +"%B %d, %Y")
- **Rolled Back To**: ${GOLDEN_TAG}
- **Deployment Package**: ${OUTPUT_DIR}/${ZIPFILE}
- **Status**: ⏳ Pending verification

## Verification Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| Advisor Dashboard Loading | ⏳ | Verify dashboard loads without errors |
| CSS Styling | ⏳ | Verify all CSS styles are correctly applied |
| JavaScript Functionality | ⏳ | Verify all JS functions work properly |
| KPI Tiles | ⏳ | Verify all KPI tiles display correctly |
| Charts and Graphs | ⏳ | Verify all visualizations render properly |
| Geospatial Store Map | ⏳ | Verify map loads with store locations and Leaflet library |
| Map Interactivity | ⏳ | Verify map zoom, pan, tooltips, and filters work correctly |
| Navigation Links | ⏳ | Verify all navigation works correctly |
| Filters | ⏳ | Verify all filters function as expected |
| Data Loading | ⏳ | Verify data loads correctly in all sections |
| Mobile Responsiveness | ⏳ | Verify dashboard works on mobile devices |

## Verification URLs

- Primary URL: [https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor](https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor)
- Alternative URL: [https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor.html](https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor.html)

## Next Steps

1. Complete the verification checklist above
2. Document any remaining issues
3. Update status to ✅ Completed or ❌ Failed

---

*Rollback performed by: Scout Dashboard Team*
EOF

echo -e "${GREEN}Created rollback verification checklist: ${VERIFICATION_FILE}${NC}"
echo -e "${GREEN}Rollback preparation completed successfully.${NC}"
echo -e "${YELLOW}Please complete the verification checklist after deployment.${NC}"
exit 0