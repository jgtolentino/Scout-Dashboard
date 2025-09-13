#!/bin/bash
# Rollback UAT Checklist Generator
# This script generates a UAT checklist for the dashboard rollback feature

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for required arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <golden_tag> <output_file>"
  echo "Example: $0 golden-20250519 rollback_uat_checklist.md"
  exit 1
fi

GOLDEN_TAG=$1
OUTPUT_FILE=$2
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEMPLATE_FILE="../templates/ROLLBACK_UAT_TEMPLATE.md"

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo -e "${RED}Error: Template file '$TEMPLATE_FILE' not found${NC}"
  exit 1
fi

# Check if golden tag is valid
if ! git tag -l | grep -q "^${GOLDEN_TAG}$"; then
  echo -e "${RED}Error: Golden tag '$GOLDEN_TAG' does not exist.${NC}"
  echo "Available golden tags:"
  git tag -l "golden-*" | sort -r | head -n 10
  exit 1
fi

# Get git information about the golden tag
COMMIT_HASH=$(git rev-list -n 1 "${GOLDEN_TAG}")
COMMIT_DATE=$(git show -s --format=%ci "${GOLDEN_TAG}")
COMMIT_AUTHOR=$(git show -s --format=%an "${GOLDEN_TAG}")
COMMIT_MESSAGE=$(git show -s --format=%s "${GOLDEN_TAG}")

# Get current branch/version information
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_DATE=$(git show -s --format=%ci HEAD)

# Generate the UAT checklist from template
echo -e "${YELLOW}Generating UAT checklist for rollback from template...${NC}"

# Create UAT checklist output directory if it doesn't exist
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Copy template and perform substitutions
cp "$TEMPLATE_FILE" "$OUTPUT_FILE"

# Replace placeholders in the template
sed -i '' "s/\[Rollback Name\]/Rollback to ${GOLDEN_TAG}/g" "$OUTPUT_FILE"
sed -i '' "s/\[Golden Tag\]/${GOLDEN_TAG} (${COMMIT_HASH:0:8})/g" "$OUTPUT_FILE"
sed -i '' "s/\[Original Deployment Date\]/$(date -j -f "%Y-%m-%d %H:%M:%S %z" "$COMMIT_DATE" +"%Y-%m-%d")/g" "$OUTPUT_FILE"
sed -i '' "s/\[Rollback Date\]/$(date +"%Y-%m-%d")/g" "$OUTPUT_FILE"
sed -i '' "s/\[UAT Environment\]/https:\/\/uat-client360-dashboard.azurestaticapps.net/g" "$OUTPUT_FILE"
sed -i '' "s/\[Start Date\]/$(date +"%Y-%m-%d")/g" "$OUTPUT_FILE"
sed -i '' "s/\[End Date\]/$(date -v+2d +"%Y-%m-%d")/g" "$OUTPUT_FILE"

# Add executive summary with relevant details
EXEC_SUMMARY="This UAT report focuses on testing the dashboard rollback feature that restores the application to the known good version ${GOLDEN_TAG}. The golden version was created on $(date -j -f "%Y-%m-%d %H:%M:%S %z" "$COMMIT_DATE" +"%B %d, %Y") with the message: \"${COMMIT_MESSAGE}\". The rollback feature should successfully restore all dashboard components to this version while maintaining TBWA branding and theme consistency."

sed -i '' "s/\[Brief summary of UAT results, key findings, and recommendation for the rollback feature\]/${EXEC_SUMMARY}/g" "$OUTPUT_FILE"

# Extract theme information from golden tag
echo -e "${YELLOW}Extracting theme information from golden tag...${NC}"

# Get stylesheet information from the golden tag
THEME_INFO=$(git show "${GOLDEN_TAG}:src/themes/tbwa.scss" 2>/dev/null || echo "Theme file not found in golden tag")

# Check if we found theme information
if [[ "$THEME_INFO" == *"--color-primary: #002B80"* ]]; then
  echo -e "${GREEN}Found TBWA theme information in golden tag${NC}"
  # The theme file contains the expected TBWA colors
  HAS_THEME=true
else
  echo -e "${YELLOW}Warning: Could not confirm TBWA theme in golden tag${NC}"
  HAS_THEME=false
fi

# Check if rollback component exists in golden tag
if [[ "$THEME_INFO" == *"rollback-dashboard"* ]]; then
  echo -e "${GREEN}Found rollback component styles in golden tag theme${NC}"
  HAS_ROLLBACK_COMPONENT=true
else
  echo -e "${YELLOW}Warning: Could not find rollback component styles in golden tag theme${NC}"
  HAS_ROLLBACK_COMPONENT=false
fi

# Add verification notes based on theme findings
if [ "$HAS_THEME" = true ] && [ "$HAS_ROLLBACK_COMPONENT" = true ]; then
  THEME_NOTE="Golden tag includes TBWA theme with rollback component styles. Theme verification should pass."
elif [ "$HAS_THEME" = true ] && [ "$HAS_ROLLBACK_COMPONENT" = false ]; then
  THEME_NOTE="Golden tag includes TBWA theme but is missing rollback component styles. May require additional CSS fixes."
else
  THEME_NOTE="Golden tag may not include proper TBWA theme. Verify theme consistency carefully."
fi

# Add note to the RT1 theme consistency requirement
sed -i '' "s/| RT1 | TBWA colors (Navy #002B80, Cyan #00C3EC) are preserved | Check rollback component and dashboard | All brand colors match specification | | PASS\/FAIL\/CONDITIONAL | |/| RT1 | TBWA colors (Navy #002B80, Cyan #00C3EC) are preserved | Check rollback component and dashboard | All brand colors match specification | | PASS\/FAIL\/CONDITIONAL | ${THEME_NOTE} |/g" "$OUTPUT_FILE"

# Add post-rollback verification items based on golden tag content
echo -e "${YELLOW}Adding post-rollback verification items...${NC}"

# Generate a unique file with relevant verification items
VERIFICATION_ITEMS_FILE=$(mktemp)

# Check if geospatial map exists in golden tag
if git show "${GOLDEN_TAG}:src/components/store_map.js" &>/dev/null || \
   git show "${GOLDEN_TAG}:js/components/store_map.js" &>/dev/null; then
  echo "| Geospatial Map | VERIFY | Confirm map loads with store locations |" >> "$VERIFICATION_ITEMS_FILE"
else
  echo "| Geospatial Map | WARN | Map component not found in golden tag |" >> "$VERIFICATION_ITEMS_FILE"
fi

# Check if data source toggle exists
if git show "${GOLDEN_TAG}:src/components/data_source_toggle.js" &>/dev/null || \
   git show "${GOLDEN_TAG}:js/data_source_toggle.js" &>/dev/null; then
  echo "| Data source toggle | VERIFY | Confirm toggle between real/simulated data |" >> "$VERIFICATION_ITEMS_FILE"
else
  echo "| Data source toggle | WARN | Toggle component not found in golden tag |" >> "$VERIFICATION_ITEMS_FILE"
fi

# Add a timestamp and signature to the UAT document
echo -e "\n## UAT Checklist Generation Information\n" >> "$OUTPUT_FILE"
echo -e "This UAT checklist was automatically generated on $(date) from the rollback UAT template." >> "$OUTPUT_FILE"
echo -e "- Current branch: ${CURRENT_BRANCH}" >> "$OUTPUT_FILE"
echo -e "- Current commit: ${CURRENT_COMMIT:0:8}" >> "$OUTPUT_FILE"
echo -e "- Golden tag: ${GOLDEN_TAG}" >> "$OUTPUT_FILE"
echo -e "- Golden commit: ${COMMIT_HASH:0:8}" >> "$OUTPUT_FILE"
echo -e "- Golden commit date: $(date -j -f "%Y-%m-%d %H:%M:%S %z" "$COMMIT_DATE" +"%B %d, %Y")" >> "$OUTPUT_FILE"
echo -e "- Golden commit author: ${COMMIT_AUTHOR}" >> "$OUTPUT_FILE"
echo -e "- Golden commit message: ${COMMIT_MESSAGE}" >> "$OUTPUT_FILE"
echo -e "\nIMPORTANT: This UAT checklist should be completed after performing a rollback to the golden tag ${GOLDEN_TAG}." >> "$OUTPUT_FILE"

echo -e "${GREEN}UAT checklist for rollback generated: $OUTPUT_FILE${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Review and customize the generated UAT checklist"
echo -e "2. Perform the rollback to golden tag ${GOLDEN_TAG}"
echo -e "3. Complete the UAT checklist with stakeholders"
echo -e "4. Document any issues in the issues section"
echo -e "5. Get sign-off from all required parties"
exit 0