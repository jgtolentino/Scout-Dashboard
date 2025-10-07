#!/bin/bash
# Client360 Dashboard CSS Fix Verification Script
# This script verifies that CSS files are being served with the correct content type

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# The URL to check (default or provided as argument)
URL=${1:-"https://blue-coast-0acb6880f.6.azurestaticapps.net"}

echo -e "${GREEN}Client360 Dashboard CSS Fix Verification${NC}"
echo -e "${YELLOW}==============================================${NC}"
echo -e "${YELLOW}Verifying CSS files for: ${URL}${NC}"

# Create report directory
REPORT_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/reports"
mkdir -p $REPORT_DIR
REPORT_FILE="${REPORT_DIR}/css_fix_verification_$(date +"%Y%m%d_%H%M%S").md"

# Initialize report
cat > $REPORT_FILE << EOF
# Client360 Dashboard CSS Fix Verification Report

**Date:** $(date +"%B %d, %Y %H:%M:%S")
**URL:** ${URL}

## CSS Files Verification Results

| File | Status | Content-Type | Notes |
|------|--------|-------------|-------|
EOF

# Function to check content type
check_content_type() {
    local file_url=$1
    local file_name=$2
    
    echo -e "${BLUE}Checking ${file_name}...${NC}"
    
    # Get just the headers with curl
    header_output=$(curl -s -I "${file_url}")
    
    # Extract content type
    content_type=$(echo "$header_output" | grep -i "content-type" | tr -d '\r' | awk '{print $2}')
    
    # Check if it's the correct content type
    if [[ "$content_type" == "text/css"* ]]; then
        echo -e "${GREEN}✓ ${file_name} has correct content type: ${content_type}${NC}"
        status="✅ Passed"
        notes="Content type correctly set to text/css"
    else
        echo -e "${RED}✗ ${file_name} has incorrect content type: ${content_type}${NC}"
        status="❌ Failed"
        if [[ -z "$content_type" ]]; then
            notes="Missing content-type header"
        else
            notes="Incorrect content-type: ${content_type}"
        fi
    fi
    
    # Add to report
    echo "| ${file_name} | ${status} | ${content_type:-'None'} | ${notes} |" >> $REPORT_FILE
}

# Check content types for all CSS files
check_content_type "${URL}/css/variables.css" "variables.css"
check_content_type "${URL}/css/tbwa-theme.css" "tbwa-theme.css"
check_content_type "${URL}/css/dashboard.css" "dashboard.css"

# Check if the styles are referenced in the HTML
echo -e "${BLUE}Checking if CSS files are referenced in HTML...${NC}"

html_content=$(curl -s "${URL}")

# Add HTML check to report
cat >> $REPORT_FILE << EOF

## HTML References Check

| CSS File | Referenced in HTML | Notes |
|----------|-------------------|-------|
EOF

# Check for each CSS file
for css_file in "variables.css" "tbwa-theme.css" "dashboard.css"; do
    if echo "$html_content" | grep -q "css/${css_file}"; then
        echo -e "${GREEN}✓ ${css_file} is referenced in the HTML${NC}"
        status="✅ Included"
        notes="Properly referenced in HTML head"
    else
        echo -e "${RED}✗ ${css_file} is not referenced in the HTML${NC}"
        status="❌ Missing"
        notes="Not found in HTML head section"
    fi
    
    echo "| ${css_file} | ${status} | ${notes} |" >> $REPORT_FILE
done

# Add staticwebapp.config.json check to report
echo -e "${BLUE}Checking if staticwebapp.config.json has proper CSS configuration...${NC}"

curl -s "${URL}/staticwebapp.config.json" -o "/tmp/staticwebapp.config.json" || {
    echo -e "${RED}Could not download staticwebapp.config.json for verification${NC}"
    echo "⚠️ Could not verify staticwebapp.config.json configuration" >> $REPORT_FILE
}

cat >> $REPORT_FILE << EOF

## Configuration Check

| Configuration | Status | Notes |
|---------------|--------|-------|
EOF

# Check for CSS route configuration
if [ -f "/tmp/staticwebapp.config.json" ]; then
    if grep -q '"/css/\*\.css"' "/tmp/staticwebapp.config.json"; then
        echo -e "${GREEN}✓ CSS route configuration found in staticwebapp.config.json${NC}"
        status="✅ Configured"
        notes="CSS routes properly configured with content-type headers"
    else
        echo -e "${RED}✗ CSS route configuration not found in staticwebapp.config.json${NC}"
        status="❌ Missing"
        notes="No CSS route configuration with content-type headers"
    fi
    
    echo "| CSS Routes | ${status} | ${notes} |" >> $REPORT_FILE
    
    # Check for MIME type configuration
    if grep -q '".css": "text/css"' "/tmp/staticwebapp.config.json"; then
        echo -e "${GREEN}✓ CSS MIME type configuration found in staticwebapp.config.json${NC}"
        status="✅ Configured"
        notes="CSS MIME type correctly set to text/css"
    else
        echo -e "${RED}✗ CSS MIME type configuration not found in staticwebapp.config.json${NC}"
        status="❌ Missing"
        notes="No CSS MIME type configuration"
    fi
    
    echo "| CSS MIME Type | ${status} | ${notes} |" >> $REPORT_FILE
fi

# Add manual verification section
cat >> $REPORT_FILE << EOF

## Manual Verification (Visual Inspection)

To complete verification, visually inspect the dashboard in a browser:

1. **TBWA Branding Colors**: Verify the TBWA yellow (#ffc300) and blue (#005bbb) colors appear correctly.
2. **Style Application**: Verify all components are correctly styled (KPI tiles, charts, navigation).
3. **Mobile Responsiveness**: Verify the dashboard is properly styled on mobile devices.
4. **Browser Compatibility**: Test in multiple browsers (Chrome, Firefox, Safari).

## Conclusion

EOF

# Finalize report with status
if grep -q "❌" "$REPORT_FILE"; then
    echo -e "${RED}⚠️ Some checks failed. See report for details.${NC}"
    echo "⚠️ Some issues were detected during verification. See details above." >> $REPORT_FILE
else
    echo -e "${GREEN}✅ All checks passed! CSS files are properly configured and served.${NC}"
    echo "✅ All checks passed! CSS files are properly configured and served." >> $REPORT_FILE
fi

echo -e "${GREEN}Verification report created: ${REPORT_FILE}${NC}"
echo -e "${YELLOW}Please complete the manual verification steps to ensure all styling is correctly applied.${NC}"