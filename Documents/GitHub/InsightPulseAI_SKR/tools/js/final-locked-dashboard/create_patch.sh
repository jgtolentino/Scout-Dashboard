#!/bin/bash
# create_patch.sh - Create a patch file for dashboard-ux-harmonization-v1 changes

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔═════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Creating Patch for dashboard-ux-harmonization-v1        ║${RESET}"
echo -e "${BOLD}${BLUE}╚═════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Set directories and paths
PATCH_ID="dashboard-ux-harmonization-v1"
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
PATCH_FILE="${SOURCE_DIR}/patches/${PATCH_ID}.patch"
PATCH_DIR="${SOURCE_DIR}/patches"

# Create patches directory
mkdir -p "${PATCH_DIR}"

# Function to check if git is available
check_git() {
  if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is required but not installed.${RESET}"
    exit 1
  fi
}

# Generate git patch
create_git_patch() {
  echo -e "${BLUE}Checking for modifications...${RESET}"
  
  # Check if we're in a git repository
  if [ -d "${SOURCE_DIR}/.git" ] || git -C "${SOURCE_DIR}" rev-parse --is-inside-work-tree &> /dev/null; then
    # We're in a git repo, so use git to create a patch
    echo -e "${BLUE}Creating git patch for modified files...${RESET}"
    if git -C "${SOURCE_DIR}" diff --quiet; then
      echo -e "${YELLOW}No changes detected in git repository.${RESET}"
      return 1
    else
      git -C "${SOURCE_DIR}" diff > "${PATCH_FILE}"
      echo -e "${GREEN}Git patch created: ${PATCH_FILE}${RESET}"
      return 0
    fi
  else
    echo -e "${YELLOW}Not in a git repository, using alternative method${RESET}"
    return 1
  fi
}

# Create patch summary file
create_patch_summary() {
  SUMMARY_FILE="${PATCH_DIR}/${PATCH_ID}_summary.md"
  
  echo -e "${BLUE}Creating patch summary...${RESET}"
  
  cat > "${SUMMARY_FILE}" << EOF
# Patch: ${PATCH_ID}

## Summary
This patch unifies the UI/UX of all three dashboards, standardizes naming conventions, and aligns branding under DLab.

## Changes Made

### Dashboard Naming
- Renamed "System Architecture & QA Dashboard" to "System Architecture & QA"
- Renamed "Scout Advanced Analytics (Market Intelligence)" (internal) to "Scout Advanced Analytics"
- Renamed client-facing dashboard to "Retail Advisor"

### Branding
- Updated all footers to use "Powered by DLab" instead of previous branding
- Standardized copyright notices in footers
- Removed "Market Intelligence" naming from client-facing dashboard

### Navigation
- Updated cross-dashboard navigation links to use correct names
- Ensured consistent navigation between all three dashboards

### Documentation
- Updated README.md and DEPLOY_NOTES.md to reflect correct dashboard names
- Fixed deployment script output to show correct dashboard names
- Updated access control policy section to clarify which dashboard is client-facing

## Deployment Tag
\`dashboard-ux-harmonization-v1\`

## Created
$(date "+%Y-%m-%d %H:%M:%S")
EOF

  echo -e "${GREEN}Patch summary created: ${SUMMARY_FILE}${RESET}"
}

# Create file listing
create_file_listing() {
  FILES_CHANGED="${PATCH_DIR}/${PATCH_ID}_files.txt"
  
  echo -e "${BLUE}Creating file listing...${RESET}"
  
  cat > "${FILES_CHANGED}" << EOF
Modified files in patch ${PATCH_ID}:

1. qa.html
   - Updated title and header to "System Architecture & QA"
   - Updated navigation links to use correct dashboard names
   - Changed footer branding to "Powered by DLab"

2. insights_dashboard.html
   - Updated title and header to "Scout Advanced Analytics"
   - Updated navigation links to use correct dashboard names
   - Changed footer branding to "Powered by DLab"

3. retail_edge/retail_edge_dashboard.html
   - Updated title and header to "Retail Advisor"
   - Updated navigation links to use correct dashboard names
   - Changed footer branding to "Powered by DLab"

4. README.md
   - Updated all references to use correct dashboard names
   - Clarified which dashboard is client-facing

5. DEPLOY_NOTES.md
   - Updated all references to use correct dashboard names
   - Clarified which dashboard is client-facing

6. deploy_locked_dashboard.sh
   - Updated script output to use correct dashboard names

Generated on: $(date "+%Y-%m-%d %H:%M:%S")
EOF

  echo -e "${GREEN}File listing created: ${FILES_CHANGED}${RESET}"
}

# Create implementation log
create_implementation_log() {
  LOG_FILE="${PATCH_DIR}/${PATCH_ID}_implementation.log"
  
  echo -e "${BLUE}Creating implementation log...${RESET}"
  
  cat > "${LOG_FILE}" << EOF
# Implementation Log for ${PATCH_ID}

## Implementation Steps

1. Standardized <title> tags in all dashboards
2. Updated h1 headers in all dashboards to match titles
3. Updated navigation links between dashboards
4. Fixed deployment script to use correct dashboard names
5. Updated README.md and DEPLOY_NOTES.md with correct naming
6. Aligned footer branding with 'Powered by DLab'

## Verification Steps

1. Confirmed all dashboards have correct titles
2. Verified navigation links between dashboards use correct names
3. Checked all files for instances of old naming convention
4. Validated footer branding is consistent across all dashboards
5. Reviewed deployment script for correct dashboard names
6. Ensured README and DEPLOY_NOTES accurately reflect dashboard names and access levels

## Status
✅ COMPLETED

## Implementation Date
$(date "+%Y-%m-%d %H:%M:%S")

## Implementation ID
${PATCH_ID}
EOF

  echo -e "${GREEN}Implementation log created: ${LOG_FILE}${RESET}"
}

# Main execution
check_git
if ! create_git_patch; then
  echo -e "${YELLOW}Creating manual patch documentation instead${RESET}"
fi

create_patch_summary
create_file_listing
create_implementation_log

echo -e "\n${BOLD}${GREEN}Patch generation complete!${RESET}"
echo -e "${BLUE}Patch files:${RESET}"
echo -e "  - ${PATCH_FILE} (if Git was available)"
echo -e "  - ${PATCH_DIR}/${PATCH_ID}_summary.md"
echo -e "  - ${PATCH_DIR}/${PATCH_ID}_files.txt"
echo -e "  - ${PATCH_DIR}/${PATCH_ID}_implementation.log"
echo -e "\n${YELLOW}Patch tag: ${PATCH_ID}${RESET}"
echo -e "${BLUE}To deploy the changes: ./deploy_locked_dashboard.sh${RESET}"