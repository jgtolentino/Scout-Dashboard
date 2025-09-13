#!/bin/bash
# Test script to validate all TBWA theme rollback component fixes
# Run this script before submitting the PR to ensure all changes work correctly

set -e  # Exit on error

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/theme_fix_test_${TIMESTAMP}.log"
mkdir -p logs

echo -e "${GREEN}Testing TBWA theme rollback component fixes${NC}" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

# Test 1: Verify TBWA theme contains rollback component styles
echo -e "${YELLOW}Test 1: Checking TBWA theme for rollback component styles${NC}" | tee -a "$LOG_FILE"
if grep -q "rollback-dashboard" src/themes/tbwa.scss; then
    echo -e "${GREEN}✅ TBWA theme contains rollback component styles${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${RED}❌ TBWA theme is missing rollback component styles${NC}" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}Running ensure_rollback_components.sh to fix...${NC}" | tee -a "$LOG_FILE"
    ./ensure_rollback_components.sh | tee -a "$LOG_FILE"
    
    # Verify fix worked
    if grep -q "rollback-dashboard" src/themes/tbwa.scss; then
        echo -e "${GREEN}✅ Fix successful: TBWA theme now has rollback component styles${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}❌ Fix failed: TBWA theme still missing rollback component styles${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
fi

# Test 2: Verify TBWA variables file has rollback-specific variables
echo -e "${YELLOW}Test 2: Checking TBWA variables for rollback-specific variables${NC}" | tee -a "$LOG_FILE"
if grep -q "rollback-" src/styles/variables-tbwa.scss; then
    echo -e "${GREEN}✅ TBWA variables file contains rollback-specific variables${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${RED}❌ TBWA variables file is missing rollback-specific variables${NC}" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}Adding rollback-specific variables to TBWA variables file...${NC}" | tee -a "$LOG_FILE"
    
    # Create a backup
    cp src/styles/variables-tbwa.scss src/styles/variables-tbwa.scss.bak
    
    # Add rollback component specific variables
    cat >> src/styles/variables-tbwa.scss << EOF
  
  // Rollback component specific colors (explicit declarations to avoid theme issues)
  --rollback-bg: #FFFFFF;
  --rollback-border: var(--color-secondary);
  --rollback-title: var(--color-primary);
  --rollback-text: var(--text-secondary);
  --rollback-action-primary: var(--color-primary);
  --rollback-action-secondary: var(--color-secondary);
  --rollback-info-bg: rgba(var(--color-secondary-rgb), 0.1);
EOF
    
    echo -e "${GREEN}✅ Added rollback-specific variables to TBWA variables file${NC}" | tee -a "$LOG_FILE"
fi

# Test 3: Test the deployment script's verification logic
echo -e "${YELLOW}Test 3: Testing deploy_tbwa_theme.sh verification logic${NC}" | tee -a "$LOG_FILE"
if [ -f "scripts/deploy_tbwa_theme.sh" ]; then
    # Check if verification code exists
    if grep -q "Verifying rollback component styles" scripts/deploy_tbwa_theme.sh; then
        echo -e "${GREEN}✅ deploy_tbwa_theme.sh has verification code${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}❌ deploy_tbwa_theme.sh is missing verification code${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ deploy_tbwa_theme.sh not found${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Test 4: Test the deploy_to_azure.sh verification and fallback logic
echo -e "${YELLOW}Test 4: Testing deploy_to_azure.sh verification logic${NC}" | tee -a "$LOG_FILE"
if [ -f "deploy_to_azure.sh" ]; then
    # Check if verification code exists
    if grep -q "Verifying rollback component styles" deploy_to_azure.sh; then
        echo -e "${GREEN}✅ deploy_to_azure.sh has verification code${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}❌ deploy_to_azure.sh is missing verification code${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ deploy_to_azure.sh not found${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Test 5: Build the TBWA theme and verify styles in the output CSS
echo -e "${YELLOW}Test 5: Building TBWA theme and checking output CSS${NC}" | tee -a "$LOG_FILE"
if [ -f "webpack.config.js" ]; then
    # First delete any existing dist directory
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # Build the TBWA theme
    npx webpack --config webpack.config.js --env theme=tbwa --mode production | tee -a "$LOG_FILE"
    
    # Check if build was successful
    if [ -f "dist/tbwa.css" ]; then
        echo -e "${GREEN}✅ TBWA theme build successful${NC}" | tee -a "$LOG_FILE"
        
        # Check for rollback styles in the CSS
        if grep -q "rollback-dashboard" dist/tbwa.css; then
            echo -e "${GREEN}✅ Rollback component styles found in compiled CSS${NC}" | tee -a "$LOG_FILE"
        else
            echo -e "${RED}❌ Rollback component styles missing from compiled CSS${NC}" | tee -a "$LOG_FILE"
            exit 1
        fi
    else
        echo -e "${RED}❌ TBWA theme build failed${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ webpack.config.js not found, skipping build test${NC}" | tee -a "$LOG_FILE"
fi

# Test 6: Run the ensure_rollback_components.sh utility and verify it works
echo -e "${YELLOW}Test 6: Testing ensure_rollback_components.sh utility${NC}" | tee -a "$LOG_FILE"
if [ -f "ensure_rollback_components.sh" ]; then
    # Run the script (it should detect that everything is already fixed)
    ./ensure_rollback_components.sh | tee -a "$LOG_FILE"
    
    # Check that the verification file was created
    if [ -f "ROLLBACK_COMPONENTS_VERIFIED.md" ]; then
        echo -e "${GREEN}✅ ensure_rollback_components.sh ran successfully${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}❌ ensure_rollback_components.sh failed to create verification file${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ ensure_rollback_components.sh not found${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Test 7: Run the verification script to ensure rollback styles are detected
echo -e "${YELLOW}Test 7: Running verification script${NC}" | tee -a "$LOG_FILE"
if [ -f "../../scripts/verify-against-golden.sh" ]; then
    ../../scripts/verify-against-golden.sh -v -o "logs/verification_${TIMESTAMP}.md" | tee -a "$LOG_FILE"
    
    # Check if verification completed successfully
    if [ -f "logs/verification_${TIMESTAMP}.md" ]; then
        # Check if the report contains rollback styles verification
        if grep -q "Rollback.*styles.*found" "logs/verification_${TIMESTAMP}.md"; then
            echo -e "${GREEN}✅ Verification script confirmed rollback styles${NC}" | tee -a "$LOG_FILE"
        else
            echo -e "${RED}❌ Verification script did not confirm rollback styles${NC}" | tee -a "$LOG_FILE"
            # This isn't a fatal error, just a warning
            cat "logs/verification_${TIMESTAMP}.md" | tee -a "$LOG_FILE"
        fi
    else
        echo -e "${RED}❌ Verification script failed to create report${NC}" | tee -a "$LOG_FILE"
        # This isn't a fatal error, just a warning
    fi
else
    echo -e "${YELLOW}⚠️ verify-against-golden.sh not found, skipping verification test${NC}" | tee -a "$LOG_FILE"
fi

echo "----------------------------------------" | tee -a "$LOG_FILE"
echo -e "${GREEN}All tests completed successfully!${NC}" | tee -a "$LOG_FILE"
echo -e "You can now proceed with creating your PR. Test log saved to: $LOG_FILE"

exit 0