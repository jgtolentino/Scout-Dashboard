#!/bin/bash
# Deployment Verification Script for Client360 Dashboard
# This script checks all critical components before deployment to ensure success

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deployment_verification_${TIMESTAMP}.log"

mkdir -p logs

echo -e "${YELLOW}Starting Deployment Verification...${NC}" | tee -a "$LOG_FILE"

# Function to check status and log results
check_status() {
  local status=$1
  local message=$2
  local error_msg=$3
  
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: $message${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}❌ FAIL: $message${NC}" | tee -a "$LOG_FILE"
    echo -e "${RED}    Error: $error_msg${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

# Check 1: Verify TBWA theme files exist and have correct content
echo -e "\n${YELLOW}Checking TBWA theme files...${NC}" | tee -a "$LOG_FILE"

THEME_FILES=(
  "src/styles/variables-tbwa.scss"
  "src/themes/tbwa.scss"
)

THEME_ERRORS=0
for file in "${THEME_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "- Checking $file" | tee -a "$LOG_FILE"
    
    # Check for primary brand color (TBWA Navy)
    if grep -q '#002B80' "$file"; then
      echo -e "  ${GREEN}✓ TBWA Navy color found${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "  ${RED}✗ TBWA Navy color missing${NC}" | tee -a "$LOG_FILE"
      THEME_ERRORS=$((THEME_ERRORS+1))
    fi
    
    # Check for secondary brand color (TBWA Cyan)
    if grep -q '#00C3EC' "$file"; then
      echo -e "  ${GREEN}✓ TBWA Cyan color found${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "  ${RED}✗ TBWA Cyan color missing${NC}" | tee -a "$LOG_FILE"
      THEME_ERRORS=$((THEME_ERRORS+1))
    fi
  else
    echo -e "${RED}✗ File not found: $file${NC}" | tee -a "$LOG_FILE"
    THEME_ERRORS=$((THEME_ERRORS+1))
  fi
done

check_status $((THEME_ERRORS == 0)) "TBWA theme files check" "Theme files have issues that need to be fixed"

# Check 2: Verify rollback component styles are included
echo -e "\n${YELLOW}Checking rollback component styles...${NC}" | tee -a "$LOG_FILE"

if [ -f "src/themes/tbwa.scss" ]; then
  if grep -q "rollback-dashboard" "src/themes/tbwa.scss"; then
    check_status 0 "Rollback component styles found in TBWA theme" ""
  else
    check_status 1 "Rollback component styles check" "Rollback component styles missing in TBWA theme"
  fi
else
  check_status 1 "TBWA theme file check" "src/themes/tbwa.scss file not found"
fi

# Check 3: Verify logo resources
echo -e "\n${YELLOW}Checking TBWA logo resources...${NC}" | tee -a "$LOG_FILE"

LOGO_FOUND=0
LOGO_PATHS=(
  "assets/logos/tbwasmp-logo.webp"
  "assets/logos/tbwa-logo.svg"
  "public/assets/logos/tbwasmp-logo.webp"
  "public/assets/logos/tbwa-logo.svg"
)

for logo_path in "${LOGO_PATHS[@]}"; do
  if [ -f "$logo_path" ]; then
    echo -e "- Found logo at $logo_path" | tee -a "$LOG_FILE"
    LOGO_FOUND=1
    break
  fi
done

check_status $LOGO_FOUND "TBWA logo resources check" "No TBWA logo files found"

# Check 4: Verify deployment scripts contain necessary theme validation
echo -e "\n${YELLOW}Checking deployment scripts for theme validation...${NC}" | tee -a "$LOG_FILE"

DEPLOY_SCRIPTS=(
  "deploy_to_azure.sh"
  "scripts/deploy_tbwa_theme.sh"
)

DEPLOY_SCRIPT_ERRORS=0
for script in "${DEPLOY_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo -e "- Checking $script" | tee -a "$LOG_FILE"
    
    # Check for rollback component verification
    if grep -q "rollback" "$script" && grep -q "theme" "$script"; then
      echo -e "  ${GREEN}✓ Theme validation found${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "  ${RED}✗ Theme validation missing${NC}" | tee -a "$LOG_FILE"
      DEPLOY_SCRIPT_ERRORS=$((DEPLOY_SCRIPT_ERRORS+1))
    fi
  else
    echo -e "${RED}✗ Script not found: $script${NC}" | tee -a "$LOG_FILE"
    DEPLOY_SCRIPT_ERRORS=$((DEPLOY_SCRIPT_ERRORS+1))
  fi
done

check_status $((DEPLOY_SCRIPT_ERRORS == 0)) "Deployment scripts check" "Deployment scripts lack proper theme validation"

# Check 5: Verify CSS builds correctly
echo -e "\n${YELLOW}Testing CSS build process...${NC}" | tee -a "$LOG_FILE"

if command -v npx &> /dev/null && [ -f "webpack.config.js" ]; then
  # Create a temporary directory for the build test
  TEST_BUILD_DIR=$(mktemp -d)
  
  # Try to build TBWA theme CSS
  if npx webpack --config webpack.config.js --env theme=tbwa --mode production --output-path "$TEST_BUILD_DIR" &> "$TEST_BUILD_DIR/build.log"; then
    if [ -f "$TEST_BUILD_DIR/tbwa.css" ]; then
      # Check if built CSS contains the rollback styles
      if grep -q "rollback-dashboard" "$TEST_BUILD_DIR/tbwa.css"; then
        check_status 0 "CSS build process" ""
      else
        check_status 1 "CSS build process" "Built CSS is missing rollback component styles"
        echo -e "${YELLOW}Inspect build output at $TEST_BUILD_DIR/tbwa.css${NC}" | tee -a "$LOG_FILE"
      fi
    else
      check_status 1 "CSS build process" "Build completed but no CSS file was generated"
      echo -e "${YELLOW}Check build logs at $TEST_BUILD_DIR/build.log${NC}" | tee -a "$LOG_FILE"
    fi
  else
    check_status 1 "CSS build process" "Build failed"
    echo -e "${YELLOW}Check build logs at $TEST_BUILD_DIR/build.log${NC}" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${YELLOW}⚠️ WARNING: Cannot test CSS build - webpack not found${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}Skipping CSS build verification. This should be addressed.${NC}" | tee -a "$LOG_FILE"
fi

# Check 6: Verify Azure credentials and environment
echo -e "\n${YELLOW}Checking Azure credentials...${NC}" | tee -a "$LOG_FILE"

# Check if .azure_deploy_key exists
if [ -f ".azure_deploy_key" ]; then
  check_status 0 "Azure deployment key file found" ""
else
  check_status 1 "Azure credentials check" "No .azure_deploy_key file found"
fi

# Check if Azure CLI is logged in
if az account show &> /dev/null; then
  check_status 0 "Azure CLI authentication" ""
else
  check_status 1 "Azure credentials check" "Not logged in to Azure CLI"
fi

# Check 7: Verify deploy directory structure
echo -e "\n${YELLOW}Checking deploy directory structure...${NC}" | tee -a "$LOG_FILE"

if [ -d "deploy" ]; then
  # Minimum required files
  REQUIRED_FILES=(
    "staticwebapp.config.json"
    "index.html"
  )
  
  DEPLOY_ERRORS=0
  for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "deploy/$file" ]; then
      echo -e "- Found required file: $file" | tee -a "$LOG_FILE"
    else
      echo -e "${RED}✗ Missing required file: $file${NC}" | tee -a "$LOG_FILE"
      DEPLOY_ERRORS=$((DEPLOY_ERRORS+1))
    fi
  done
  
  # Check for CSS files
  if find "deploy" -name "*.css" | grep -q .; then
    echo -e "- Found CSS files in deploy directory" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}✗ No CSS files found in deploy directory${NC}" | tee -a "$LOG_FILE"
    DEPLOY_ERRORS=$((DEPLOY_ERRORS+1))
  fi
  
  check_status $((DEPLOY_ERRORS == 0)) "Deploy directory structure" "Deploy directory is missing critical files"
else
  check_status 1 "Deploy directory check" "Deploy directory not found"
fi

# Summary of checks
echo -e "\n${YELLOW}===== Deployment Verification Summary =====${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Time: $(date)${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Log file: $LOG_FILE${NC}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Create a verification report
REPORT_FILE="reports/deployment_verification_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# Deployment Verification Report

**Date:** $(date)
**Report ID:** ${TIMESTAMP}
**Log file:** $LOG_FILE

## Summary
This report contains the results of pre-deployment verification checks for the Client360 Dashboard.

## Checks Performed

1. **TBWA Theme Files** - Verifies that TBWA theme files exist and contain correct brand colors
2. **Rollback Component Styles** - Verifies that rollback component styles are properly included
3. **TBWA Logo Resources** - Checks for existence of TBWA logo files
4. **Deployment Scripts** - Validates that deployment scripts include proper theme validation
5. **CSS Build Process** - Tests the CSS build process to ensure it generates correct output
6. **Azure Credentials** - Verifies Azure deployment credentials are available
7. **Deploy Directory** - Checks the deploy directory structure for required files

## Next Steps

- Review any failed checks and address the issues
- Run this verification script again after fixing issues
- Proceed with deployment once all checks pass

## Notes

This verification was performed automatically by the \`verify_deployment.sh\` script.
EOF

echo -e "${GREEN}✅ Verification report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"

# Final success/failure determination
if grep -q "FAIL" "$LOG_FILE"; then
  echo -e "\n${RED}❌ Deployment verification FAILED. Please fix the issues before deploying.${NC}" | tee -a "$LOG_FILE"
  exit 1
else
  echo -e "\n${GREEN}✅ Deployment verification PASSED. Safe to proceed with deployment.${NC}" | tee -a "$LOG_FILE"
  exit 0
fi