#!/bin/bash
# Test script for the Store Map component

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="logs"
LOG_FILE="${LOG_DIR}/store_map_test_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p ${LOG_DIR}

echo -e "${GREEN}Store Map Component Test${NC}" | tee -a "${LOG_FILE}"
echo -e "${YELLOW}=============================${NC}" | tee -a "${LOG_FILE}"

# 1. Verify component file exists
echo -e "${YELLOW}Checking component files...${NC}" | tee -a "${LOG_FILE}"

COMPONENT_FILE="src/components/store_map.js"
STYLE_FILE="src/styles/store-map.scss"
GEOJSON_FILE="data/philippines_outline.geojson"
STORE_DATA_FILE="data/sample_data/enhanced_store_locations.json"

FILES_OK=true

if [ ! -f "${COMPONENT_FILE}" ]; then
  echo -e "${RED}❌ Component file not found: ${COMPONENT_FILE}${NC}" | tee -a "${LOG_FILE}"
  FILES_OK=false
else
  echo -e "${GREEN}✅ Component file exists: ${COMPONENT_FILE}${NC}" | tee -a "${LOG_FILE}"
  # Check file size to ensure it's a reasonable size
  FILE_SIZE=$(wc -c < "${COMPONENT_FILE}")
  if [ "${FILE_SIZE}" -lt 1000 ]; then
    echo -e "${RED}❌ Component file is too small (${FILE_SIZE} bytes). It may be incomplete.${NC}" | tee -a "${LOG_FILE}"
    FILES_OK=false
  else
    echo -e "${GREEN}   File size: ${FILE_SIZE} bytes${NC}" | tee -a "${LOG_FILE}"
  fi
fi

if [ ! -f "${STYLE_FILE}" ]; then
  echo -e "${RED}❌ Style file not found: ${STYLE_FILE}${NC}" | tee -a "${LOG_FILE}"
  FILES_OK=false
else
  echo -e "${GREEN}✅ Style file exists: ${STYLE_FILE}${NC}" | tee -a "${LOG_FILE}"
  # Check file size to ensure it's a reasonable size
  FILE_SIZE=$(wc -c < "${STYLE_FILE}")
  if [ "${FILE_SIZE}" -lt 500 ]; then
    echo -e "${RED}❌ Style file is too small (${FILE_SIZE} bytes). It may be incomplete.${NC}" | tee -a "${LOG_FILE}"
    FILES_OK=false
  else
    echo -e "${GREEN}   File size: ${FILE_SIZE} bytes${NC}" | tee -a "${LOG_FILE}"
  fi
fi

if [ ! -f "${GEOJSON_FILE}" ]; then
  echo -e "${RED}❌ GeoJSON file not found: ${GEOJSON_FILE}${NC}" | tee -a "${LOG_FILE}"
  FILES_OK=false
else
  echo -e "${GREEN}✅ GeoJSON file exists: ${GEOJSON_FILE}${NC}" | tee -a "${LOG_FILE}"
  # Check file size to ensure it's a reasonable size
  FILE_SIZE=$(wc -c < "${GEOJSON_FILE}")
  if [ "${FILE_SIZE}" -lt 500 ]; then
    echo -e "${RED}❌ GeoJSON file is too small (${FILE_SIZE} bytes). It may be incomplete.${NC}" | tee -a "${LOG_FILE}"
    FILES_OK=false
  else
    echo -e "${GREEN}   File size: ${FILE_SIZE} bytes${NC}" | tee -a "${LOG_FILE}"
  fi
fi

if [ ! -f "${STORE_DATA_FILE}" ]; then
  echo -e "${YELLOW}⚠️ Store data file not found: ${STORE_DATA_FILE}${NC}" | tee -a "${LOG_FILE}"
  echo -e "${YELLOW}   Component will fall back to simulated data${NC}" | tee -a "${LOG_FILE}"
else
  echo -e "${GREEN}✅ Store data file exists: ${STORE_DATA_FILE}${NC}" | tee -a "${LOG_FILE}"
  # Check file size to ensure it's a reasonable size
  FILE_SIZE=$(wc -c < "${STORE_DATA_FILE}")
  if [ "${FILE_SIZE}" -lt 500 ]; then
    echo -e "${RED}❌ Store data file is too small (${FILE_SIZE} bytes). It may be incomplete.${NC}" | tee -a "${LOG_FILE}"
    FILES_OK=false
  else
    echo -e "${GREEN}   File size: ${FILE_SIZE} bytes${NC}" | tee -a "${LOG_FILE}"
  fi
fi

if [ "${FILES_OK}" = false ]; then
  echo -e "${RED}❌ Component file check failed${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

# 2. Test themes build with store-map import
echo -e "\n${YELLOW}Testing theme build with store-map import...${NC}" | tee -a "${LOG_FILE}"

# Create temporary file to capture build output
TEMP_BUILD_LOG=$(mktemp)

# Build themes
echo -e "${YELLOW}Building TBWA theme...${NC}" | tee -a "${LOG_FILE}"
npx webpack --config webpack.config.js --env theme=tbwa --mode production > "${TEMP_BUILD_LOG}" 2>&1

# Check for store-map in build log
if grep -q "store-map" "${TEMP_BUILD_LOG}"; then
  echo -e "${GREEN}✅ TBWA theme successfully built with store-map component${NC}" | tee -a "${LOG_FILE}"
else
  # Check if build failed
  if grep -q "Error" "${TEMP_BUILD_LOG}"; then
    echo -e "${RED}❌ TBWA theme build failed${NC}" | tee -a "${LOG_FILE}"
    cat "${TEMP_BUILD_LOG}" >> "${LOG_FILE}"
    exit 1
  else
    echo -e "${YELLOW}⚠️ TBWA theme built but store-map not explicitly mentioned in log${NC}" | tee -a "${LOG_FILE}"
  fi
fi

# Build sarisari theme
echo -e "${YELLOW}Building Sari-Sari theme...${NC}" | tee -a "${LOG_FILE}"
npx webpack --config webpack.config.js --env theme=sarisari --mode production > "${TEMP_BUILD_LOG}" 2>&1

# Check for store-map in build log
if grep -q "store-map" "${TEMP_BUILD_LOG}"; then
  echo -e "${GREEN}✅ Sari-Sari theme successfully built with store-map component${NC}" | tee -a "${LOG_FILE}"
else
  # Check if build failed
  if grep -q "Error" "${TEMP_BUILD_LOG}"; then
    echo -e "${RED}❌ Sari-Sari theme build failed${NC}" | tee -a "${LOG_FILE}"
    cat "${TEMP_BUILD_LOG}" >> "${LOG_FILE}"
    exit 1
  else
    echo -e "${YELLOW}⚠️ Sari-Sari theme built but store-map not explicitly mentioned in log${NC}" | tee -a "${LOG_FILE}"
  fi
fi

# Clean up temp file
rm -f "${TEMP_BUILD_LOG}"

# 3. Verify component build script
echo -e "\n${YELLOW}Testing component build script...${NC}" | tee -a "${LOG_FILE}"

if [ ! -f "scripts/build-components.sh" ]; then
  echo -e "${RED}❌ Component build script not found: scripts/build-components.sh${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

# Make sure it's executable
chmod +x scripts/build-components.sh

# Run the build script
echo -e "${YELLOW}Running build-components.sh...${NC}" | tee -a "${LOG_FILE}"
./scripts/build-components.sh >> "${LOG_FILE}" 2>&1

# Check if dist/js/components/store_map.js exists
if [ ! -f "dist/js/components/store_map.js" ]; then
  echo -e "${RED}❌ Component build failed: dist/js/components/store_map.js not found${NC}" | tee -a "${LOG_FILE}"
  exit 1
else
  echo -e "${GREEN}✅ Component build successful: dist/js/components/store_map.js created${NC}" | tee -a "${LOG_FILE}"
fi

# 4. Test HTML integration
echo -e "\n${YELLOW}Testing HTML integration...${NC}" | tee -a "${LOG_FILE}"

if [ ! -f "index.html.template" ]; then
  echo -e "${RED}❌ HTML template not found: index.html.template${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

# Check if the store-map container exists in the HTML
if grep -q "store-map" "index.html.template"; then
  echo -e "${GREEN}✅ Store map container found in HTML template${NC}" | tee -a "${LOG_FILE}"
else
  echo -e "${RED}❌ Store map container not found in HTML template${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

# Check if the map-metric-selector exists
if grep -q "map-metric-selector" "index.html.template"; then
  echo -e "${GREEN}✅ Map metric selector found in HTML template${NC}" | tee -a "${LOG_FILE}"
else
  echo -e "${YELLOW}⚠️ Map metric selector not found in HTML template${NC}" | tee -a "${LOG_FILE}"
fi

# Check if the store_map.js script is included
if grep -q "store_map.js" "index.html.template"; then
  echo -e "${GREEN}✅ store_map.js included in HTML template${NC}" | tee -a "${LOG_FILE}"
else
  echo -e "${RED}❌ store_map.js not included in HTML template${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

# 5. Test deployment script integration
echo -e "\n${YELLOW}Testing deployment script integration...${NC}" | tee -a "${LOG_FILE}"

if [ ! -f "scripts/deploy_tbwa_theme.sh" ]; then
  echo -e "${RED}❌ TBWA theme deployment script not found: scripts/deploy_tbwa_theme.sh${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

# Check if the script includes the store map component build/copy logic
if grep -q "store_map.js" "scripts/deploy_tbwa_theme.sh" || grep -q "build-components.sh" "scripts/deploy_tbwa_theme.sh"; then
  echo -e "${GREEN}✅ Store map component included in deployment script${NC}" | tee -a "${LOG_FILE}"
else
  echo -e "${RED}❌ Store map component not included in deployment script${NC}" | tee -a "${LOG_FILE}"
  exit 1
fi

echo -e "\n${GREEN}✅ All store map component tests passed!${NC}" | tee -a "${LOG_FILE}"
echo -e "${YELLOW}Check ${LOG_FILE} for detailed test results${NC}"

exit 0