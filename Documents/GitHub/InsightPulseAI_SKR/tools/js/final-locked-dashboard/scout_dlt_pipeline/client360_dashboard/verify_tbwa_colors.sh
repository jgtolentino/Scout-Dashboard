#!/bin/bash
# Verify TBWA brand colors in CSS files
# This script checks that the correct TBWA brand colors are used in the CSS files

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Verifying TBWA brand colors in CSS files...${NC}"

# Define expected color values
EXPECTED_NAVY="#002B80"
EXPECTED_CYAN="#00C3EC"
EXPECTED_RED="#E60028"

# Directory to check
CSS_DIR="deploy/css"

# Check variables.css
if [ -f "${CSS_DIR}/variables.css" ]; then
    echo -e "${YELLOW}Checking variables.css...${NC}"
    
    # Check for Navy color
    if grep -q "${EXPECTED_NAVY}" "${CSS_DIR}/variables.css"; then
        echo -e "${GREEN}✅ TBWA Navy color found: ${EXPECTED_NAVY}${NC}"
    else
        echo -e "${RED}❌ TBWA Navy color not found in variables.css${NC}"
        grep --color=always -n "color-primary" "${CSS_DIR}/variables.css"
    fi
    
    # Check for Cyan color
    if grep -q "${EXPECTED_CYAN}" "${CSS_DIR}/variables.css"; then
        echo -e "${GREEN}✅ TBWA Cyan color found: ${EXPECTED_CYAN}${NC}"
    else
        echo -e "${RED}❌ TBWA Cyan color not found in variables.css${NC}"
        grep --color=always -n "color-secondary" "${CSS_DIR}/variables.css" 
    fi
    
    # Check for Red color
    if grep -q "${EXPECTED_RED}" "${CSS_DIR}/variables.css"; then
        echo -e "${GREEN}✅ TBWA Red color found: ${EXPECTED_RED}${NC}"
    else
        echo -e "${RED}❌ TBWA Red color not found in variables.css${NC}"
        grep --color=always -n "color-accent" "${CSS_DIR}/variables.css"
    fi
else
    echo -e "${RED}❌ variables.css not found in ${CSS_DIR}${NC}"
fi

# Check tbwa-theme.css
if [ -f "${CSS_DIR}/tbwa-theme.css" ]; then
    echo -e "${YELLOW}Checking tbwa-theme.css...${NC}"
    
    # Create a temporary file with the content
    TMP_FILE=$(mktemp)
    cat "${CSS_DIR}/tbwa-theme.css" > "$TMP_FILE"
    
    # Look for color values in the CSS
    if grep -q "${EXPECTED_NAVY}" "$TMP_FILE"; then
        echo -e "${GREEN}✅ TBWA Navy color found in tbwa-theme.css${NC}"
    else
        echo -e "${RED}❌ TBWA Navy color not found in tbwa-theme.css${NC}"
    fi
    
    if grep -q "${EXPECTED_CYAN}" "$TMP_FILE"; then
        echo -e "${GREEN}✅ TBWA Cyan color found in tbwa-theme.css${NC}"
    else
        echo -e "${RED}❌ TBWA Cyan color not found in tbwa-theme.css${NC}"
    fi
    
    # Clean up
    rm "$TMP_FILE"
else
    echo -e "${RED}❌ tbwa-theme.css not found in ${CSS_DIR}${NC}"
fi

# Check for rollback component styles
echo -e "${YELLOW}Checking for rollback component styles...${NC}"
if [ -f "${CSS_DIR}/tbwa-theme.css" ] && grep -q "rollback-dashboard" "${CSS_DIR}/tbwa-theme.css"; then
    echo -e "${GREEN}✅ Rollback dashboard component styles found in tbwa-theme.css${NC}"
else
    echo -e "${RED}❌ Rollback dashboard component styles not found in tbwa-theme.css${NC}"
    if [ -f "${CSS_DIR}/tbwa-theme.css" ]; then
        echo "Checking for partial match..."
        grep -n "rollback" "${CSS_DIR}/tbwa-theme.css" || echo "No matches for 'rollback'"
    fi
fi

echo -e "${YELLOW}Verification complete.${NC}"
echo -e "To fix any issues, run: ./fix_tbwa_colors.sh"
echo -e "Then deploy using: ./deploy_to_azure.sh"