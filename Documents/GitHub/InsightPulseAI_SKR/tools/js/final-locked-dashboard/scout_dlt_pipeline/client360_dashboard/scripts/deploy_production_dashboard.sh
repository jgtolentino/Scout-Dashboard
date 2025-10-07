#!/bin/bash

# Deploy TBWA Client360 Dashboard (Production Version)
# This script deploys the full dashboard with TBWA theming and complete documentation

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TBWA Client 360 Dashboard Production Deployment ===${NC}"

# Set directory paths
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${BASE_DIR}/deploy"
SAMPLE_DATA_DIR="${BASE_DIR}/sample_data"
OUTPUT_DIR="${BASE_DIR}/output"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Preparing deployment package...${NC}"

# Create temporary deployment directory
TEMP_DEPLOY_DIR="${BASE_DIR}/temp_deploy_${TIMESTAMP}"
mkdir -p "${TEMP_DEPLOY_DIR}"
mkdir -p "${TEMP_DEPLOY_DIR}/data"
mkdir -p "${TEMP_DEPLOY_DIR}/data/sample"
mkdir -p "${TEMP_DEPLOY_DIR}/js/components"
mkdir -p "${TEMP_DEPLOY_DIR}/css"
mkdir -p "${TEMP_DEPLOY_DIR}/screenshots"

# Copy all deployment files (including documentation)
echo -e "${YELLOW}Copying core dashboard files...${NC}"
cp -r "${DEPLOY_DIR}/css" "${TEMP_DEPLOY_DIR}/"
cp -r "${DEPLOY_DIR}/js" "${TEMP_DEPLOY_DIR}/"
cp "${DEPLOY_DIR}/index.html" "${TEMP_DEPLOY_DIR}/"
cp "${DEPLOY_DIR}/guide.html" "${TEMP_DEPLOY_DIR}/" 2>/dev/null || echo -e "${YELLOW}guide.html not found, skipping...${NC}"
cp "${DEPLOY_DIR}/README.md" "${TEMP_DEPLOY_DIR}/" 2>/dev/null || echo -e "${YELLOW}README.md not found, skipping...${NC}"
cp "${DEPLOY_DIR}/CLIENT360_DASHBOARD_PRD.md" "${TEMP_DEPLOY_DIR}/" 2>/dev/null || echo -e "${YELLOW}CLIENT360_DASHBOARD_PRD.md not found, skipping...${NC}"
cp "${DEPLOY_DIR}/CLIENT360_VISUAL_REFERENCE.md" "${TEMP_DEPLOY_DIR}/" 2>/dev/null || echo -e "${YELLOW}CLIENT360_VISUAL_REFERENCE.md not found, skipping...${NC}"
cp "${DEPLOY_DIR}/VERSION_2.3.0_HIGHLIGHTS.md" "${TEMP_DEPLOY_DIR}/" 2>/dev/null || echo -e "${YELLOW}VERSION_2.3.0_HIGHLIGHTS.md not found, skipping...${NC}"
cp "${DEPLOY_DIR}/staticwebapp.config.json" "${TEMP_DEPLOY_DIR}/"

# Include Philippines outline GeoJSON if it exists
if [ -f "${DEPLOY_DIR}/data/philippines_outline.geojson" ]; then
    cp "${DEPLOY_DIR}/data/philippines_outline.geojson" "${TEMP_DEPLOY_DIR}/data/"
    echo -e "${GREEN}Philippines outline GeoJSON copied.${NC}"
fi

# Include original stores GeoJSON if it exists 
if [ -f "${DEPLOY_DIR}/data/stores.geojson" ]; then
    echo -e "${YELLOW}Original stores GeoJSON found, backing up...${NC}"
    cp "${DEPLOY_DIR}/data/stores.geojson" "${DEPLOY_DIR}/data/stores.geojson.bak.${TIMESTAMP}"
fi

# Copy sample data files
echo -e "${YELLOW}Copying sample data files...${NC}"
cp "${SAMPLE_DATA_DIR}/stores.geojson" "${TEMP_DEPLOY_DIR}/data/"
echo -e "${GREEN}Sample stores.geojson copied.${NC}"

# Copy the rest of the sample data to a dedicated sample subdirectory
cp "${SAMPLE_DATA_DIR}/sari_sari_transactions.json" "${TEMP_DEPLOY_DIR}/data/sample/"
cp "${SAMPLE_DATA_DIR}/sari_sari_heartbeat.json" "${TEMP_DEPLOY_DIR}/data/sample/"
cp "${SAMPLE_DATA_DIR}/sari_sari_visual_data.json" "${TEMP_DEPLOY_DIR}/data/sample/"
cp "${SAMPLE_DATA_DIR}/product_catalog.json" "${TEMP_DEPLOY_DIR}/data/sample/"

# Copy sample README to the data directory
cp "${SAMPLE_DATA_DIR}/README.md" "${TEMP_DEPLOY_DIR}/data/sample/" 2>/dev/null || echo -e "${YELLOW}Sample data README not found, skipping...${NC}"

# Create placeholder screenshots directory for future content
mkdir -p "${TEMP_DEPLOY_DIR}/screenshots"
echo "# Dashboard Screenshots" > "${TEMP_DEPLOY_DIR}/screenshots/README.md"
echo "This directory will contain screenshots referenced in documentation." >> "${TEMP_DEPLOY_DIR}/screenshots/README.md"

# Verify all sample data files were copied
echo -e "${YELLOW}Verifying sample data files...${NC}"
if [ -f "${TEMP_DEPLOY_DIR}/data/stores.geojson" ] && \
   [ -f "${TEMP_DEPLOY_DIR}/data/sample/sari_sari_transactions.json" ] && \
   [ -f "${TEMP_DEPLOY_DIR}/data/sample/sari_sari_heartbeat.json" ] && \
   [ -f "${TEMP_DEPLOY_DIR}/data/sample/sari_sari_visual_data.json" ] && \
   [ -f "${TEMP_DEPLOY_DIR}/data/sample/product_catalog.json" ]; then
    echo -e "${GREEN}All sample data files successfully copied.${NC}"
else
    echo -e "${RED}Error: Not all sample data files were copied successfully.${NC}"
    exit 1
fi

# Create README file in the data directory to indicate sample data
cat > "${TEMP_DEPLOY_DIR}/data/README.md" << EOL
# TBWA Client360 Dashboard Data

This directory contains data files used by the TBWA Client360 Dashboard:

- **stores.geojson**: Store locations for the geospatial map component
- **philippines_outline.geojson**: Philippines country outline for the map
- **sample/**: Contains additional sample data files:
  - sari_sari_transactions.json: Transaction records
  - sari_sari_heartbeat.json: Device health data
  - sari_sari_visual_data.json: Computer vision analysis
  - product_catalog.json: Product catalog data

All files in the sample/ directory contain simulated data with the 'simulated: true' flag.
EOL

# Create version info file
cat > "${TEMP_DEPLOY_DIR}/version.json" << EOL
{
  "version": "2.3.0",
  "releaseDate": "$(date +"%Y-%m-%d")",
  "name": "TBWA Client360 Dashboard",
  "description": "Comprehensive retail performance dashboard for Sari-Sari stores in the Philippines",
  "features": [
    "TBWA Design System Integration",
    "Enhanced Geospatial Store Map",
    "AI-Powered Brand Insights",
    "Unified Sample Data Package",
    "Advertiser's Guide"
  ]
}
EOL

# Create deployment zip
echo -e "${YELLOW}Creating deployment package...${NC}"
DEPLOY_PACKAGE="${OUTPUT_DIR}/tbwa_client360_dashboard_v2.3.0_${TIMESTAMP}.zip"
(cd "${TEMP_DEPLOY_DIR}" && zip -r "${DEPLOY_PACKAGE}" .)

# Check if zip creation was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment package created successfully: ${DEPLOY_PACKAGE}${NC}"
else
    echo -e "${RED}Failed to create deployment package.${NC}"
    exit 1
fi

# Deploy to Azure Static Web Apps if SWA CLI is installed
if command -v swa &> /dev/null; then
    echo -e "${YELLOW}Deploying to Azure Static Web Apps...${NC}"
    
    # Check if swa-cli.config.json exists
    if [ -f "${BASE_DIR}/swa-cli.config.json" ]; then
        swa deploy "${TEMP_DEPLOY_DIR}" --env production
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Deployment to Azure Static Web Apps completed successfully.${NC}"
            # Extract and display the deployment URL from the SWA output
            echo -e "${GREEN}Dashboard is now available at: https://blue-coast-0acb6880f.eastus2.6.azurestaticapps.net${NC}"
            echo -e "${YELLOW}Note: It may take a few minutes for changes to propagate.${NC}"
        else
            echo -e "${RED}Deployment to Azure Static Web Apps failed.${NC}"
        fi
    else
        echo -e "${YELLOW}SWA CLI config not found. Please deploy manually using:${NC}"
        echo -e "swa deploy ${TEMP_DEPLOY_DIR} --env production"
    fi
else
    echo -e "${YELLOW}Azure Static Web Apps CLI not found. Please deploy manually:${NC}"
    echo -e "1. Install SWA CLI: npm install -g @azure/static-web-apps-cli"
    echo -e "2. Deploy using: swa deploy ${TEMP_DEPLOY_DIR} --env production"
    echo -e "3. Or use the Azure Portal to deploy the zip package: ${DEPLOY_PACKAGE}"
fi

# Create local copy for desktop access
cp "${DEPLOY_PACKAGE}" "${HOME}/Desktop/tbwa_client360_dashboard_v2.3.0.zip"
echo -e "${GREEN}Copied deployment package to desktop as: tbwa_client360_dashboard_v2.3.0.zip${NC}"

# Clean up temporary deployment directory
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "${TEMP_DEPLOY_DIR}"

echo -e "${GREEN}Deployment process completed.${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}TBWA Client360 Dashboard v2.3.0 is ready!${NC}"
echo -e "${BLUE}===========================================${NC}"