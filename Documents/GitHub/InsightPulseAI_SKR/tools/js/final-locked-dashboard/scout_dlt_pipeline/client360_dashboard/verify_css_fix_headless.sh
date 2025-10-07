#!/bin/bash
# Headless Client360 Dashboard CSS Fix Verification Script
# This script verifies CSS fixes with no user interaction required

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# The URL to check (default or provided as argument)
URL=${1:-"https://blue-coast-0acb6880f.6.azurestaticapps.net"}

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Create report directory and file
REPORT_DIR="$BASE_DIR/reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${REPORT_DIR}/css_fix_verification_${TIMESTAMP}.md"

echo -e "${GREEN}Client360 Dashboard CSS Fix Headless Verification${NC}"
echo -e "${BLUE}URL: ${URL}${NC}"
echo -e "${BLUE}Report will be saved to: ${REPORT_FILE}${NC}"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Client360 Dashboard CSS Fix Verification Report

**Date:** $(date +"%B %d, %Y %H:%M:%S")
**URL:** ${URL}

## CSS Files Verification Results

| File | Status | Content-Type | Notes |
|------|--------|-------------|-------|
EOF

# Function to check content type with timeout and retries
check_content_type() {
    local file_url=$1
    local file_name=$2
    local max_retries=3
    local retry_count=0
    local content_type=""
    
    echo -e "${BLUE}Checking ${file_name}...${NC}"
    
    while [ $retry_count -lt $max_retries ]; do
        # Get just the headers with curl (with timeout)
        header_output=$(curl -s -I --connect-timeout 10 --max-time 20 "${file_url}")
        
        # Extract content type
        content_type=$(echo "$header_output" | grep -i "content-type" | tr -d '\r' | awk '{print $2}')
        
        # Check if it's the correct content type
        if [[ "$content_type" == "text/css"* ]]; then
            echo -e "${GREEN}✓ ${file_name} has correct content type: ${content_type}${NC}"
            status="✅ Passed"
            notes="Content type correctly set to text/css"
            break
        elif [[ -z "$header_output" ]]; then
            echo -e "${YELLOW}! ${file_name} request timed out, retrying (${retry_count}/${max_retries})${NC}"
            retry_count=$((retry_count + 1))
            sleep 5
        else
            echo -e "${RED}✗ ${file_name} has incorrect content type: ${content_type}${NC}"
            status="❌ Failed"
            if [[ -z "$content_type" ]]; then
                notes="Missing content-type header"
            else
                notes="Incorrect content-type: ${content_type}"
            fi
            break
        fi
    done
    
    # If we've exhausted retries, mark as failed
    if [ $retry_count -eq $max_retries ]; then
        echo -e "${RED}✗ ${file_name} verification failed after ${max_retries} retries${NC}"
        status="❌ Failed"
        notes="Request timed out after multiple attempts"
    fi
    
    # Add to report
    echo "| ${file_name} | ${status} | ${content_type:-'None'} | ${notes} |" >> "$REPORT_FILE"
    
    # Return success (0) if content type is correct, failure (1) otherwise
    if [[ "$content_type" == "text/css"* ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check HTML references with timeout and retries
check_html_references() {
    local max_retries=3
    local retry_count=0
    local html_content=""
    
    echo -e "${BLUE}Checking HTML references...${NC}"
    
    while [ $retry_count -lt $max_retries ]; do
        # Get HTML content with curl (with timeout)
        html_content=$(curl -s --connect-timeout 10 --max-time 30 "${URL}")
        
        if [[ -n "$html_content" ]]; then
            break
        else
            echo -e "${YELLOW}! HTML request timed out, retrying (${retry_count}/${max_retries})${NC}"
            retry_count=$((retry_count + 1))
            sleep 5
        fi
    done
    
    # If we've exhausted retries, mark as failed
    if [ $retry_count -eq $max_retries ]; then
        echo -e "${RED}✗ HTML content verification failed after ${max_retries} retries${NC}"
        
        cat >> "$REPORT_FILE" << EOF

## HTML References Check

| CSS File | Referenced in HTML | Notes |
|----------|-------------------|-------|
| variables.css | ❌ Failed | Could not fetch HTML content after multiple attempts |
| tbwa-theme.css | ❌ Failed | Could not fetch HTML content after multiple attempts |
| dashboard.css | ❌ Failed | Could not fetch HTML content after multiple attempts |
EOF
        
        return 1
    fi
    
    # Add HTML check to report
    cat >> "$REPORT_FILE" << EOF

## HTML References Check

| CSS File | Referenced in HTML | Notes |
|----------|-------------------|-------|
EOF
    
    # Variables to track overall HTML reference check success
    local html_check_success=true
    
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
            html_check_success=false
        fi
        
        echo "| ${css_file} | ${status} | ${notes} |" >> "$REPORT_FILE"
    done
    
    # Return success (0) if all references are found, failure (1) otherwise
    if [ "$html_check_success" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check staticwebapp.config.json
check_config() {
    echo -e "${BLUE}Checking staticwebapp.config.json...${NC}"
    
    # Try to fetch config file
    local config_file="/tmp/staticwebapp_${TIMESTAMP}.json"
    curl -s --connect-timeout 10 --max-time 20 "${URL}/staticwebapp.config.json" -o "$config_file" || {
        echo -e "${RED}Could not download staticwebapp.config.json for verification${NC}"
        
        cat >> "$REPORT_FILE" << EOF

## Configuration Check

| Configuration | Status | Notes |
|---------------|--------|-------|
| CSS Routes | ⚠️ Unknown | Could not download staticwebapp.config.json for verification |
| CSS MIME Type | ⚠️ Unknown | Could not download staticwebapp.config.json for verification |
EOF
        
        return 1
    }
    
    # Add config check to report
    cat >> "$REPORT_FILE" << EOF

## Configuration Check

| Configuration | Status | Notes |
|---------------|--------|-------|
EOF
    
    # Variables to track overall config check success
    local config_check_success=true
    
    # Check for CSS route configuration
    if grep -q '"/css/\*\.css"' "$config_file"; then
        echo -e "${GREEN}✓ CSS route configuration found in staticwebapp.config.json${NC}"
        status="✅ Configured"
        notes="CSS routes properly configured with content-type headers"
    else
        echo -e "${RED}✗ CSS route configuration not found in staticwebapp.config.json${NC}"
        status="❌ Missing"
        notes="No CSS route configuration with content-type headers"
        config_check_success=false
    fi
    
    echo "| CSS Routes | ${status} | ${notes} |" >> "$REPORT_FILE"
    
    # Check for MIME type configuration
    if grep -q '".css": "text/css"' "$config_file"; then
        echo -e "${GREEN}✓ CSS MIME type configuration found in staticwebapp.config.json${NC}"
        status="✅ Configured"
        notes="CSS MIME type correctly set to text/css"
    else
        echo -e "${RED}✗ CSS MIME type configuration not found in staticwebapp.config.json${NC}"
        status="❌ Missing"
        notes="No CSS MIME type configuration"
        config_check_success=false
    fi
    
    echo "| CSS MIME Type | ${status} | ${notes} |" >> "$REPORT_FILE"
    
    # Clean up temp file
    rm -f "$config_file"
    
    # Return success (0) if all checks passed, failure (1) otherwise
    if [ "$config_check_success" = true ]; then
        return 0
    else
        return 1
    fi
}

# Main function to run all checks
run_verification() {
    # Track overall success
    local all_checks_passed=true
    
    # Check content types for all CSS files
    check_content_type "${URL}/css/variables.css" "variables.css" || all_checks_passed=false
    check_content_type "${URL}/css/tbwa-theme.css" "tbwa-theme.css" || all_checks_passed=false
    check_content_type "${URL}/css/dashboard.css" "dashboard.css" || all_checks_passed=false
    
    # Check if the styles are referenced in the HTML
    check_html_references || all_checks_passed=false
    
    # Check configuration
    check_config || all_checks_passed=false
    
    # Add conclusion to report
    cat >> "$REPORT_FILE" << EOF

## Conclusion

Based on the automated verification checks:

EOF
    
    if [ "$all_checks_passed" = true ]; then
        echo -e "${GREEN}✅ All verification checks PASSED! The CSS fix has been successfully applied.${NC}"
        echo "✅ All verification checks PASSED! The CSS fix has been successfully applied." >> "$REPORT_FILE"
        echo "- All CSS files are being served with the correct content-type headers" >> "$REPORT_FILE"
        echo "- All CSS files are properly referenced in the HTML" >> "$REPORT_FILE"
        echo "- The staticwebapp.config.json has the correct configuration" >> "$REPORT_FILE"
    else
        echo -e "${RED}❌ Some verification checks FAILED. Review the report for details.${NC}"
        echo "❌ Some verification checks FAILED. The CSS fix may not be completely applied." >> "$REPORT_FILE"
        echo "- Review the detailed results above for specific issues that need attention" >> "$REPORT_FILE"
    fi
    
    # Add next steps
    cat >> "$REPORT_FILE" << EOF

## Next Steps

1. **Visual Verification**: Manually verify that the TBWA branding (yellow #ffc300 and blue #005bbb) is correctly displayed
2. **Browser Testing**: Check the dashboard in multiple browsers to ensure consistent styling
3. **Responsive Testing**: Verify the dashboard styling on different screen sizes

---

*Verification Timestamp: $(date)*
EOF
    
    echo -e "${BLUE}Verification report created: ${REPORT_FILE}${NC}"
    
    # Return success (0) if all checks passed, failure (1) otherwise
    if [ "$all_checks_passed" = true ]; then
        return 0
    else
        return 1
    fi
}

# Run the verification
run_verification
VERIFICATION_RESULT=$?

# Output the final result
if [ $VERIFICATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}====================================================${NC}"
    echo -e "${GREEN}          Verification PASSED!                      ${NC}"
    echo -e "${GREEN}====================================================${NC}"
    echo -e "${GREEN}The CSS fix has been successfully applied.${NC}"
    echo -e "${GREEN}Report: ${REPORT_FILE}${NC}"
    exit 0
else
    echo -e "${RED}====================================================${NC}"
    echo -e "${RED}          Verification FAILED!                      ${NC}"
    echo -e "${RED}====================================================${NC}"
    echo -e "${RED}The CSS fix may not be completely applied.${NC}"
    echo -e "${RED}Please review the report for details: ${REPORT_FILE}${NC}"
    exit 1
fi