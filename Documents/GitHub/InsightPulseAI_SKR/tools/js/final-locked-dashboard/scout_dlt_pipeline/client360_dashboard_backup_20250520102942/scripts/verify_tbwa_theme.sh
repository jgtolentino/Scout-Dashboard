#!/bin/bash
# Verification script for TBWA-themed Client360 Dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/verify_tbwa_${TIMESTAMP}.log"
REPORT_FILE="reports/tbwa_verification_${TIMESTAMP}.md"

# Make sure directories exist
mkdir -p logs reports

echo -e "${GREEN}Starting TBWA theme verification process...${NC}" | tee -a "$LOG_FILE"

# List of required files and directories
REQUIRED_FILES=(
  "dist/tbwa.css"
  "dist/assets/tbwa-logo.svg"
  "static/js/theme-selector.js"
  "src/themes/tbwa.scss"
  "src/styles/variables-tbwa.scss"
  "scripts/build-tbwa-theme.sh"
  "scripts/deploy_tbwa_dashboard.sh"
)

# Step 1: Check that all required files exist
echo -e "${YELLOW}Checking required files...${NC}" | tee -a "$LOG_FILE"
MISSING_FILES=0

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}❌ Missing file: $file${NC}" | tee -a "$LOG_FILE"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo -e "${GREEN}✓ Found file: $file${NC}" | tee -a "$LOG_FILE"
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo -e "${RED}❌ Missing $MISSING_FILES required files. Please create these files before proceeding.${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${GREEN}✅ All required files found!${NC}" | tee -a "$LOG_FILE"
fi

# Step 2: Verify TBWA theme CSS content
echo -e "${YELLOW}Verifying TBWA theme CSS content...${NC}" | tee -a "$LOG_FILE"

if [ -f "dist/tbwa.css" ]; then
  # Check for essential TBWA brand styles
  TBWA_YELLOW_CHECK=$(grep -c "#ffc300" dist/tbwa.css || echo "0")
  TBWA_COMPONENTS_CHECK=$(grep -c "tbwa-disruption-banner\|btn-tbwa\|tbwa-callout" dist/tbwa.css || echo "0")
  
  if [ "$TBWA_YELLOW_CHECK" -gt 0 ] && [ "$TBWA_COMPONENTS_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ TBWA theme CSS contains expected brand styles!${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}❌ TBWA theme CSS is missing essential brand styles.${NC}" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${YELLOW}⚠️ Cannot verify TBWA theme CSS as the file doesn't exist.${NC}" | tee -a "$LOG_FILE"
fi

# Step 3: Verify TBWA logo SVG content
echo -e "${YELLOW}Verifying TBWA logo...${NC}" | tee -a "$LOG_FILE"

if [ -f "dist/assets/tbwa-logo.svg" ]; then
  # Check SVG file size
  LOGO_SIZE=$(stat -f%z "dist/assets/tbwa-logo.svg")
  
  if [ "$LOGO_SIZE" -gt 100 ]; then
    echo -e "${GREEN}✅ TBWA logo SVG appears to be valid!${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}❌ TBWA logo SVG may be empty or corrupted.${NC}" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${YELLOW}⚠️ Cannot verify TBWA logo as the file doesn't exist.${NC}" | tee -a "$LOG_FILE"
fi

# Step 4: Run webpack in dry-run mode to verify build configuration
echo -e "${YELLOW}Verifying webpack build configuration...${NC}" | tee -a "$LOG_FILE"

if command -v npx &> /dev/null; then
  # Use --dry-run if supported
  if npx webpack --help | grep -q "\-\-dry-run"; then
    npx webpack --config webpack.config.js --env theme=tbwa --dry-run 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
      echo -e "${GREEN}✅ Webpack build configuration for TBWA theme is valid!${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "${RED}❌ Webpack build configuration for TBWA theme has errors.${NC}" | tee -a "$LOG_FILE"
    fi
  else
    echo -e "${YELLOW}⚠️ Webpack dry-run not available, skipping build configuration verification.${NC}" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${YELLOW}⚠️ npx command not found, skipping webpack verification.${NC}" | tee -a "$LOG_FILE"
fi

# Step 5: Create verification report
echo -e "${YELLOW}Creating verification report...${NC}" | tee -a "$LOG_FILE"

cat > "${REPORT_FILE}" << EOF
# TBWA-themed Client360 Dashboard Verification Report

## Verification Summary
- **Date**: $(date)
- **Theme**: TBWA
- **Log File**: ${LOG_FILE}

## Files Verification
EOF

# Add file verification results to the report
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "- ✅ ${file}: Present" >> "${REPORT_FILE}"
  else
    echo "- ❌ ${file}: Missing" >> "${REPORT_FILE}"
  fi
done

# Add CSS verification results
if [ -f "dist/tbwa.css" ]; then
  if [ "$TBWA_YELLOW_CHECK" -gt 0 ] && [ "$TBWA_COMPONENTS_CHECK" -gt 0 ]; then
    echo -e "\n## CSS Verification\n- ✅ TBWA theme CSS contains expected brand styles" >> "${REPORT_FILE}"
  else
    echo -e "\n## CSS Verification\n- ❌ TBWA theme CSS is missing essential brand styles" >> "${REPORT_FILE}"
  fi
fi

# Add next steps
cat >> "${REPORT_FILE}" << EOF

## Next Steps
1. Run the full build and deployment process:
   \`\`\`bash
   ./scripts/build-tbwa-theme.sh
   ./scripts/deploy_tbwa_dashboard.sh
   \`\`\`

2. Verify the final deployed dashboard for:
   - Correct TBWA branding and colors
   - Interactive map functionality
   - Responsive design on different screen sizes
   - Proper display of all dashboard components

3. To deploy to Azure Static Web Apps:
   \`\`\`bash
   az staticwebapp deploy --name <app-name> --resource-group <resource-group> --source <zip-file> --token <deployment-token>
   \`\`\`
EOF

echo -e "${GREEN}✅ Verification report created: ${REPORT_FILE}${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ TBWA theme verification process completed!${NC}" | tee -a "$LOG_FILE"

# Final status check
if [ $MISSING_FILES -gt 0 ]; then
  echo -e "${RED}❌ Verification failed due to missing files.${NC}" | tee -a "$LOG_FILE"
  exit 1
else
  echo -e "${GREEN}✅ Verification passed! The TBWA theme implementation appears to be correct.${NC}" | tee -a "$LOG_FILE"
  exit 0
fi