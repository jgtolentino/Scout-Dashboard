#!/bin/bash
# Scout Advisor Dashboard Rollback Verification Script
# This script verifies the rolled back dashboard version is properly deployed

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DASHBOARD_URL="https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor"
VERIFICATION_FILE="../DASHBOARD_ROLLBACK_VERIFICATION.md"
REPORT_DIR="../reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCREENSHOT_FILE="${REPORT_DIR}/rollback_verification_${TIMESTAMP}.png"

echo -e "${GREEN}Scout Advisor Dashboard Rollback Verification${NC}"
echo -e "${YELLOW}=====================================${NC}"

# Create report directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl command not found. Please install curl and try again.${NC}"
    exit 1
fi

# Check if the dashboard is accessible
echo -e "${BLUE}Checking dashboard accessibility...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DASHBOARD_URL}")

if [ "${HTTP_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}Dashboard is accessible. HTTP status: ${HTTP_STATUS}${NC}"
else
    echo -e "${RED}Dashboard is not accessible. HTTP status: ${HTTP_STATUS}${NC}"
    echo -e "${YELLOW}Please check the deployment and try again.${NC}"
    exit 1
fi

# Check for CSS file accessibility
echo -e "${BLUE}Checking CSS file accessibility...${NC}"
CSS_URL="${DASHBOARD_URL%/*}/css/analytics-dashboard.css"
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CSS_URL}")

if [ "${CSS_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}CSS file is accessible. HTTP status: ${CSS_STATUS}${NC}"
else
    echo -e "${RED}CSS file is not accessible. HTTP status: ${CSS_STATUS}${NC}"
    echo -e "${YELLOW}This might indicate styling issues.${NC}"
fi

# Check for JavaScript file accessibility
echo -e "${BLUE}Checking JavaScript file accessibility...${NC}"
JS_URL="${DASHBOARD_URL%/*}/js/dashboard-interactivity.js"
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${JS_URL}")

if [ "${JS_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}JavaScript file is accessible. HTTP status: ${JS_STATUS}${NC}"
else
    echo -e "${RED}JavaScript file is not accessible. HTTP status: ${JS_STATUS}${NC}"
    echo -e "${YELLOW}This might indicate functionality issues.${NC}"
fi

# Check for Store Map JavaScript file accessibility
echo -e "${BLUE}Checking Store Map JavaScript file accessibility...${NC}"
MAP_JS_URL="${DASHBOARD_URL%/*}/js/components/store_map.js"
MAP_JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${MAP_JS_URL}")

if [ "${MAP_JS_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}Store Map JavaScript file is accessible. HTTP status: ${MAP_JS_STATUS}${NC}"
else
    echo -e "${RED}Store Map JavaScript file is not accessible. HTTP status: ${MAP_JS_STATUS}${NC}"
    echo -e "${YELLOW}This might indicate issues with the geospatial map functionality.${NC}"
fi

# Check for Leaflet CSS file accessibility
echo -e "${BLUE}Checking Leaflet CSS file accessibility...${NC}"
LEAFLET_CSS_URL="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
LEAFLET_CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${LEAFLET_CSS_URL}")

if [ "${LEAFLET_CSS_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}Leaflet CSS file is accessible. HTTP status: ${LEAFLET_CSS_STATUS}${NC}"
else
    echo -e "${RED}Leaflet CSS file is not accessible. HTTP status: ${LEAFLET_CSS_STATUS}${NC}"
    echo -e "${YELLOW}This might indicate issues with the map library loading.${NC}"
fi

# Take a screenshot if available
if command -v screencapture &> /dev/null; then
    echo -e "${BLUE}Taking a screenshot for verification...${NC}"
    echo -e "${YELLOW}Please open ${DASHBOARD_URL} in your browser before continuing.${NC}"
    read -p "Press Enter after opening the dashboard in your browser... " -r
    
    # Take screenshot (macOS)
    screencapture -T 5 "${SCREENSHOT_FILE}"
    echo -e "${GREEN}Screenshot saved to ${SCREENSHOT_FILE}${NC}"
elif command -v import &> /dev/null; then
    echo -e "${BLUE}Taking a screenshot for verification...${NC}"
    echo -e "${YELLOW}Please open ${DASHBOARD_URL} in your browser before continuing.${NC}"
    read -p "Press Enter after opening the dashboard in your browser... " -r
    
    # Take screenshot (Linux with ImageMagick)
    import -window root "${SCREENSHOT_FILE}"
    echo -e "${GREEN}Screenshot saved to ${SCREENSHOT_FILE}${NC}"
else
    echo -e "${YELLOW}Screenshot tools not found. Please take a manual screenshot for verification.${NC}"
fi

# Create a verification report
echo -e "${BLUE}Creating verification report...${NC}"
REPORT_FILE="${REPORT_DIR}/rollback_verification_${TIMESTAMP}.md"

cat > "${REPORT_FILE}" << EOF
# Scout Advisor Dashboard Rollback Verification Report

## Verification Details

- **Verification Date**: $(date +"%B %d, %Y at %H:%M:%S")
- **Dashboard URL**: ${DASHBOARD_URL}
- **Rollback Status**: $([ "${HTTP_STATUS}" -eq 200 ] && echo "✅ Accessible" || echo "❌ Not accessible")

## Accessibility Check

| Resource | URL | Status | Result |
|----------|-----|--------|--------|
| Dashboard | ${DASHBOARD_URL} | ${HTTP_STATUS} | $([ "${HTTP_STATUS}" -eq 200 ] && echo "✅ Passed" || echo "❌ Failed") |
| CSS File | ${CSS_URL} | ${CSS_STATUS} | $([ "${CSS_STATUS}" -eq 200 ] && echo "✅ Passed" || echo "❌ Failed") |
| JavaScript File | ${JS_URL} | ${JS_STATUS} | $([ "${JS_STATUS}" -eq 200 ] && echo "✅ Passed" || echo "❌ Failed") |
| Store Map JS | ${MAP_JS_URL} | ${MAP_JS_STATUS} | $([ "${MAP_JS_STATUS}" -eq 200 ] && echo "✅ Passed" || echo "❌ Failed") |
| Leaflet CSS | ${LEAFLET_CSS_URL} | ${LEAFLET_CSS_STATUS} | $([ "${LEAFLET_CSS_STATUS}" -eq 200 ] && echo "✅ Passed" || echo "❌ Failed") |

## Visual Verification

$([ -f "${SCREENSHOT_FILE}" ] && echo "Screenshot captured and saved to: ${SCREENSHOT_FILE}" || echo "No screenshot captured. Please verify visually.")

## Manual Verification Required

Please verify the following dashboard elements manually:

1. Dashboard loads without errors in browser console
2. All styling is correctly applied (no unstyled elements)
3. All JavaScript functionality works properly
4. All visualizations render correctly
5. **Geospatial store map displays correctly with store locations**
6. **Map interactivity (zooming, panning, tooltips) works as expected**
7. **Store location markers show the correct information when clicked**
8. Navigation and filters function as expected
9. **Map filters update the store locations correctly**

## Verification Result

Overall verification result: **$([ "${HTTP_STATUS}" -eq 200 ] && [ "${CSS_STATUS}" -eq 200 ] && [ "${JS_STATUS}" -eq 200 ] && [ "${MAP_JS_STATUS}" -eq 200 ] && [ "${LEAFLET_CSS_STATUS}" -eq 200 ] && echo "✅ PASSED" || echo "⚠️ PARTIAL - Manual verification required")**

Please update the main verification document at:
${VERIFICATION_FILE}

---

*Verification performed by: Scout Dashboard Team*
EOF

echo -e "${GREEN}Verification report created: ${REPORT_FILE}${NC}"
echo -e "${YELLOW}Please complete the manual verification steps in the report.${NC}"
echo -e "${GREEN}Verification process completed.${NC}"
exit 0