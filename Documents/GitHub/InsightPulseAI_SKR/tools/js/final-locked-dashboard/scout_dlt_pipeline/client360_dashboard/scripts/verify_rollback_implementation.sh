#!/bin/bash
# Client360 Dashboard Rollback Verification Script
# This script verifies that the rollback was successful

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DASHBOARD_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy"
REPORT_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERIFICATION_REPORT="${REPORT_DIR}/rollback_verification_${TIMESTAMP}.md"
STATIC_SITE_URL="https://blue-coast-0acb6880f.6.azurestaticapps.net" # Updated to tbwa-client360-dashboard-production URL

echo -e "${GREEN}Client360 Dashboard Rollback Verification${NC}"
echo -e "${YELLOW}=============================================${NC}"

# Create report directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Verify local files
echo -e "${BLUE}Verifying local files...${NC}"

# Function to check file existence
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$DASHBOARD_DIR/$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing: $file - $description${NC}"
        return 1
    fi
}

# Check essential files
MISSING_FILES=0

# HTML files
echo -e "${YELLOW}Checking HTML files...${NC}"
check_file "index.html" "Main dashboard page" || ((MISSING_FILES++))
check_file "direct_url_links.html" "Documentation hub" || ((MISSING_FILES++))
check_file "guide.html" "User guide" || ((MISSING_FILES++))
check_file "prd.html" "Product requirements document" || ((MISSING_FILES++))

# CSS files
echo -e "${YELLOW}Checking CSS files...${NC}"
check_file "css/dashboard.css" "Main dashboard styles" || ((MISSING_FILES++))
check_file "css/tbwa-theme.css" "TBWA theming" || ((MISSING_FILES++))
check_file "css/variables.css" "CSS variables" || ((MISSING_FILES++))

# JavaScript files
echo -e "${YELLOW}Checking JavaScript files...${NC}"
check_file "js/dashboard.js" "Dashboard functionality" || ((MISSING_FILES++))
check_file "js/store_map.js" "Store map component" || ((MISSING_FILES++))
check_file "js/tbwa-charts.js" "Chart theming" || ((MISSING_FILES++))

# Component files
echo -e "${YELLOW}Checking component files...${NC}"
check_file "js/components/store_map.js" "Store map component" || true # Optional location
check_file "js/components/brand_insights.js" "Brand insights component" || true # Optional
check_file "js/components/transaction_metrics.js" "Transaction metrics component" || true # Optional

# Data files
echo -e "${YELLOW}Checking data files...${NC}"
check_file "data/philippines_outline.geojson" "Philippines map outline" || ((MISSING_FILES++))
check_file "data/stores.geojson" "Store location data" || ((MISSING_FILES++))

# Configuration files
echo -e "${YELLOW}Checking configuration files...${NC}"
check_file "staticwebapp.config.json" "Azure Static Web App config" || true # Optional

# Documentation files
echo -e "${YELLOW}Checking documentation files...${NC}"
check_file "CLIENT360_DASHBOARD_PRD.md" "Product requirements document" || true # Optional location
check_file "CLIENT360_VISUAL_REFERENCE.md" "Visual reference guide" || true # Optional location
check_file "VERSION_2.3.0_HIGHLIGHTS.md" "Version highlights" || true # Optional location

# Summary of local file checks
if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}All essential files are present in the rollback.${NC}"
else
    echo -e "${RED}Missing $MISSING_FILES essential files in the rollback.${NC}"
fi

# Verify remote deployment if URL is provided
if [ -n "$STATIC_SITE_URL" ]; then
    echo -e "${BLUE}Verifying remote deployment at $STATIC_SITE_URL...${NC}"
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl command not found. Please install curl and try again.${NC}"
        echo -e "${YELLOW}Skipping remote verification checks.${NC}"
    else
        # Function to check URL accessibility
        check_url() {
            local url="$1"
            local description="$2"
            local http_status
            
            http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
            
            if [ "$http_status" -eq 200 ]; then
                echo -e "${GREEN}✅ Accessible: $url${NC}"
                return 0
            else
                echo -e "${RED}❌ Not accessible: $url (HTTP status: $http_status) - $description${NC}"
                return 1
            fi
        }
        
        # Check essential URLs
        INACCESSIBLE_URLS=0
        
        echo -e "${YELLOW}Checking remote URLs...${NC}"
        check_url "$STATIC_SITE_URL" "Main site" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/index.html" "Dashboard page" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/css/dashboard.css" "Dashboard CSS" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/css/tbwa-theme.css" "TBWA theme CSS" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/js/dashboard.js" "Dashboard JavaScript" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/js/store_map.js" "Store map JavaScript" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/data/philippines_outline.geojson" "Philippines GeoJSON" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/data/stores.geojson" "Stores GeoJSON" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/direct_url_links.html" "Documentation hub" || ((INACCESSIBLE_URLS++))
        check_url "$STATIC_SITE_URL/guide.html" "User guide" || ((INACCESSIBLE_URLS++))
        
        # Summary of remote URL checks
        if [ $INACCESSIBLE_URLS -eq 0 ]; then
            echo -e "${GREEN}All essential URLs are accessible in the remote deployment.${NC}"
        else
            echo -e "${RED}$INACCESSIBLE_URLS essential URLs are not accessible in the remote deployment.${NC}"
        fi
    fi
else
    echo -e "${YELLOW}No static site URL provided. Skipping remote verification checks.${NC}"
    echo -e "${YELLOW}Set the STATIC_SITE_URL variable in this script to enable remote checks.${NC}"
fi

# Create a verification report
echo -e "${BLUE}Creating verification report...${NC}"

cat > "${VERIFICATION_REPORT}" << EOF
# Client360 Dashboard Rollback Verification Report

## Verification Details

- **Verification Date**: $(date +"%B %d, %Y at %H:%M:%S")
- **Dashboard Directory**: ${DASHBOARD_DIR}
- **Remote URL**: ${STATIC_SITE_URL}

## Local File Verification

| Category | Status | Details |
|----------|--------|---------|
| HTML Files | $([ $(check_file "index.html" "" &>/dev/null && check_file "direct_url_links.html" "" &>/dev/null && check_file "guide.html" "" &>/dev/null && check_file "prd.html" "" &>/dev/null && echo "true") ] && echo "✅ Pass" || echo "❌ Fail") | Main dashboard and documentation pages |
| CSS Files | $([ $(check_file "css/dashboard.css" "" &>/dev/null && check_file "css/tbwa-theme.css" "" &>/dev/null && check_file "css/variables.css" "" &>/dev/null && echo "true") ] && echo "✅ Pass" || echo "❌ Fail") | Styling and TBWA theme |
| JavaScript Files | $([ $(check_file "js/dashboard.js" "" &>/dev/null && check_file "js/store_map.js" "" &>/dev/null && check_file "js/tbwa-charts.js" "" &>/dev/null && echo "true") ] && echo "✅ Pass" || echo "❌ Fail") | Dashboard functionality |
| GeoJSON Files | $([ $(check_file "data/philippines_outline.geojson" "" &>/dev/null && check_file "data/stores.geojson" "" &>/dev/null && echo "true") ] && echo "✅ Pass" || echo "❌ Fail") | Map data files |
| Documentation | $([ $(check_file "CLIENT360_DASHBOARD_PRD.md" "" &>/dev/null || check_file "VERSION_2.3.0_HIGHLIGHTS.md" "" &>/dev/null && echo "true") ] && echo "✅ Pass" || echo "⚠️ Partial") | Documentation files |

$([ $MISSING_FILES -eq 0 ] && echo "**Overall Local Verification**: ✅ PASSED - All essential files present" || echo "**Overall Local Verification**: ❌ FAILED - Missing $MISSING_FILES essential files")

## Remote Deployment Verification

$(if [ -z "$STATIC_SITE_URL" ]; then 
    echo "Remote verification not performed (no URL provided)."
else
    if ! command -v curl &> /dev/null; then
        echo "Remote verification skipped (curl not installed)."
    else
        echo "| URL | Status |"
        echo "|-----|--------|"
        echo "| Main Site | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        echo "| Dashboard | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL/index.html" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        echo "| TBWA Theme CSS | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL/css/tbwa-theme.css" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        echo "| Store Map JS | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL/js/store_map.js" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        echo "| Philippines GeoJSON | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL/data/philippines_outline.geojson" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        echo "| Stores GeoJSON | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL/data/stores.geojson" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        echo "| Documentation Hub | $(curl -s -o /dev/null -w "%{http_code}" "$STATIC_SITE_URL/direct_url_links.html" | grep -q "200" && echo "✅ 200 OK" || echo "❌ Failed") |"
        
        if [ $INACCESSIBLE_URLS -eq 0 ]; then
            echo -e "\n**Overall Remote Verification**: ✅ PASSED - All essential URLs accessible"
        else
            echo -e "\n**Overall Remote Verification**: ❌ FAILED - $INACCESSIBLE_URLS URLs inaccessible"
        fi
    fi
fi)

## Manual Verification Required

Please verify the following dashboard elements manually:

1. **Visual Appearance**:
   - Dashboard loads with correct TBWA branding (yellow #ffc300, blue #005bbb)
   - All UI elements are properly styled and aligned
   - No CSS conflicts or visual glitches

2. **Map Functionality**:
   - Store map loads and displays the Philippines outline
   - Store markers appear at correct locations
   - Zooming, panning, and clicking on markers works
   - Store information popups display correctly

3. **Dashboard Functionality**:
   - All charts and visualizations render correctly
   - Interactive elements (dropdowns, filters) work as expected
   - Documentation links work and load the correct content
   - Dashboard is responsive on different screen sizes

## Screenshots

$(if command -v screencapture &> /dev/null; then
    SCREENSHOT_FILE="${REPORT_DIR}/dashboard_screenshot_${TIMESTAMP}.png"
    echo "Please open ${STATIC_SITE_URL} in your browser and take a screenshot."
    echo "You can use: \`screencapture -T 5 ${SCREENSHOT_FILE}\`"
    echo ""
    echo "Screenshot saved to: ${SCREENSHOT_FILE} (if taken)"
else
    echo "Screenshot tools not found. Please take a manual screenshot for verification."
fi)

## Verification Result

Overall verification result: **$([ $MISSING_FILES -eq 0 ] && ([ -z "$STATIC_SITE_URL" ] || [ $INACCESSIBLE_URLS -eq 0 ]) && echo "✅ PASSED" || echo "⚠️ PARTIAL - Manual verification required")**

---

*Verification performed by: Dashboard Team*
EOF

echo -e "${GREEN}Verification report created: ${VERIFICATION_REPORT}${NC}"
echo -e "${YELLOW}Please complete the manual verification steps in the report.${NC}"

# Create a simple document to open the verification report
OPEN_REPORT="${DASHBOARD_DIR}/verification_report.html"
cat > "${OPEN_REPORT}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Rollback Verification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #005bbb;
            border-bottom: 3px solid #ffc300;
            padding-bottom: 10px;
        }
        .report-link {
            display: inline-block;
            margin: 20px 0;
            padding: 10px 15px;
            background-color: #005bbb;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
        }
        .report-link:hover {
            background-color: #003d7a;
        }
        .note {
            background-color: #fffaeb;
            border-left: 4px solid #ffc300;
            padding: 10px 15px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <h1>Client360 Dashboard Rollback Verification</h1>
    
    <p>This page provides access to the verification report for the Client360 Dashboard rollback.</p>
    
    <div class="note">
        <p><strong>Note:</strong> This verification report contains information about the files and functionality checked during the rollback process. Please review it carefully to ensure the rollback was successful.</p>
    </div>
    
    <a class="report-link" href="../reports/rollback_verification_${TIMESTAMP}.md" target="_blank">View Verification Report</a>
    
    <p>If the report indicates any issues, please address them before confirming the rollback as successful.</p>
    
    <h2>Manual Verification Steps</h2>
    
    <ol>
        <li>Check the dashboard's visual appearance (TBWA branding, layout, styles)</li>
        <li>Verify the store map functionality (loading, markers, interaction)</li>
        <li>Test all interactive elements (filters, charts, navigation)</li>
        <li>Confirm documentation links and content are accessible</li>
        <li>Test the dashboard on different devices and screen sizes</li>
    </ol>
    
    <p>After completing these steps, update the verification report with your findings.</p>
</body>
</html>
EOF

echo -e "${GREEN}Verification process completed.${NC}"
echo -e "${YELLOW}A verification HTML page has been created at: ${OPEN_REPORT}${NC}"
echo -e "${YELLOW}Please open this page to access the verification report.${NC}"
exit 0