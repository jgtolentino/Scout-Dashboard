#!/bin/bash
# Verify that rollback styles are properly included in the theme CSS

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
LOGFILE=logs/verify_rollback_styles.log
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create logs directory if it doesn't exist
mkdir -p logs

echo -e "${YELLOW}Verifying rollback styles in the theme...${NC}" | tee -a "$LOGFILE"

# Check if the theme file exists in src directory
if [ ! -f "src/themes/tbwa.scss" ]; then
  echo -e "${RED}ERROR: Could not find src/themes/tbwa.scss${NC}" | tee -a "$LOGFILE"
  exit 1
fi

# Check if rollback styles exist in the theme source
if ! grep -q "rollback-dashboard" src/themes/tbwa.scss; then
  echo -e "${RED}ERROR: rollback-dashboard styles not found in source theme${NC}" | tee -a "$LOGFILE"
  echo -e "${YELLOW}Try running scripts/build-tbwa-theme.sh to add them${NC}" | tee -a "$LOGFILE"
  exit 1
else 
  echo -e "${GREEN}✅ rollback-dashboard styles found in source theme${NC}" | tee -a "$LOGFILE"
fi

# Check if the compiled CSS exists
if [ ! -f "dist/tbwa.css" ]; then
  echo -e "${YELLOW}WARNING: dist/tbwa.css not found. Attempting to compile theme...${NC}" | tee -a "$LOGFILE"
  if [ -f "scripts/build-tbwa-theme.sh" ]; then
    bash scripts/build-tbwa-theme.sh | tee -a "$LOGFILE"
  else
    echo -e "${YELLOW}Trying to compile with webpack directly...${NC}" | tee -a "$LOGFILE"
    if command -v npx &> /dev/null && [ -f "webpack.config.js" ]; then
      npx webpack --config webpack.config.js --env theme=tbwa --mode production | tee -a "$LOGFILE"
    else
      echo -e "${RED}ERROR: Cannot compile theme. Neither build script nor webpack available.${NC}" | tee -a "$LOGFILE"
      exit 1
    fi
  fi
fi

# Check again if the compiled CSS exists
if [ ! -f "dist/tbwa.css" ]; then
  echo -e "${RED}ERROR: Failed to compile theme. dist/tbwa.css still not found.${NC}" | tee -a "$LOGFILE"
  exit 1
fi

# Check if rollback styles exist in the compiled CSS
if ! grep -q "rollback-dashboard" dist/tbwa.css; then
  echo -e "${RED}ERROR: rollback-dashboard styles not found in compiled CSS${NC}" | tee -a "$LOGFILE"
  echo -e "${YELLOW}Creating emergency rollback styles file...${NC}" | tee -a "$LOGFILE"
  
  # Create a directory for the CSS
  mkdir -p css
  
  # Create a separate rollback styles CSS file
  cat > css/rollback-styles.css << EOF
/* Emergency Rollback Styles - Generated on $(date) */
.rollback-dashboard {
  background-color: #FFFFFF;
  border: 3px solid #00C3EC;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}
.rollback-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  height: 32px;
}
.rollback-dashboard-header h3 {
  color: #002B80;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  padding-bottom: 0;
  border-bottom: none;
  position: relative;
}
.rollback-dashboard-header h3:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #00C3EC;
  border-radius: 1.5px;
}
.rollback-dashboard-content {
  margin-bottom: 16px;
  margin-top: 16px;
}
.rollback-dashboard-content p {
  color: #777777;
  margin-bottom: 8px;
  font-size: 14px;
}
.rollback-dashboard-content .version-info {
  display: flex;
  justify-content: space-between;
  background-color: rgba(0, 195, 236, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  margin-top: 8px;
  border-left: 3px solid #00C3EC;
}
.rollback-dashboard-actions {
  display: flex;
  gap: 16px;
}
.rollback-dashboard-actions .btn-rollback {
  background-color: #002B80;
  color: white;
  border: none;
  padding: 8px 24px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 14px;
}
.rollback-dashboard-actions .btn-verify {
  background-color: #00C3EC;
  color: #002B80;
  border: none;
  padding: 8px 24px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 14px;
}
.rollback-dashboard-log {
  margin-top: 24px;
  background-color: #E9EBEE;
  border-radius: 8px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  border-left: 3px solid #00C3EC;
}
.rollback-dashboard-log pre {
  margin: 0;
  white-space: pre-wrap;
}
EOF
  echo -e "${GREEN}✅ Emergency rollback styles created at css/rollback-styles.css${NC}" | tee -a "$LOGFILE"
  echo -e "${YELLOW}Include this file in your HTML with: <link rel=\"stylesheet\" href=\"/css/rollback-styles.css\">${NC}" | tee -a "$LOGFILE"
  
  # Create a verification report
  mkdir -p reports
  REPORT_FILE="reports/rollback_styles_verification_${TIMESTAMP}.md"
  
  cat > "$REPORT_FILE" << EOF
# Rollback Styles Verification Report

## Summary
- **Date**: $(date)
- **Status**: ❌ FAILED
- **Issue**: Rollback dashboard styles not found in compiled CSS

## Details
- Source theme file contains rollback styles: ✅ YES
- Compiled CSS contains rollback styles: ❌ NO
- Emergency fallback created: ✅ YES (css/rollback-styles.css)

## Resolution
An emergency CSS file with rollback styles has been created. To use this file:

1. Include it in your HTML:
   \`\`\`html
   <link rel="stylesheet" href="/css/rollback-styles.css">
   \`\`\`

2. Copy this file to your deployment package:
   \`\`\`bash
   mkdir -p deploy/css
   cp css/rollback-styles.css deploy/css/
   \`\`\`

## Next Steps
1. Fix the build process to properly include rollback styles
2. Verify in future deployments that styles are correctly included
EOF
  
  echo -e "${GREEN}✅ Verification report created at: $REPORT_FILE${NC}" | tee -a "$LOGFILE"
  exit 1
else
  echo -e "${GREEN}✅ rollback-dashboard styles found in compiled CSS${NC}" | tee -a "$LOGFILE"
  
  # Create a success verification report
  mkdir -p reports
  REPORT_FILE="reports/rollback_styles_verification_${TIMESTAMP}.md"
  
  cat > "$REPORT_FILE" << EOF
# Rollback Styles Verification Report

## Summary
- **Date**: $(date)
- **Status**: ✅ SUCCESS
- **Issue**: None - Rollback dashboard styles correctly included

## Details
- Source theme file contains rollback styles: ✅ YES
- Compiled CSS contains rollback styles: ✅ YES

## Next Steps
1. Continue with deployment as planned
2. Monitor for any styling issues after deployment
EOF
  
  echo -e "${GREEN}✅ Success verification report created at: $REPORT_FILE${NC}" | tee -a "$LOGFILE"
fi

echo -e "${GREEN}✅ Verification completed successfully${NC}" | tee -a "$LOGFILE"