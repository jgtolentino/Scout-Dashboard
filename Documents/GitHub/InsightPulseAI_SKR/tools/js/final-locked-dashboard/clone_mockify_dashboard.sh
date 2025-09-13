#!/bin/bash
# clone_mockify_dashboard.sh - Clone mockify-creator repository and use it as the source for Retail Advisor

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔═════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Cloning mockify-creator for Retail Advisor              ║${RESET}"
echo -e "${BOLD}${BLUE}╚═════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Set directories and paths
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
MOCKIFY_REPO="https://github.com/jgtolentino/mockify-creator.git"
TEMP_DIR="/tmp/mockify-creator-clone"
RETAIL_EDGE_DIR="${SOURCE_DIR}/retail_edge"

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: Git is required but not installed.${RESET}"
  exit 1
fi

# Create temporary directory for clone
echo -e "${BLUE}Creating temporary directory...${RESET}"
mkdir -p "${TEMP_DIR}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create temporary directory.${RESET}"
  exit 1
fi

# Clone the repository
echo -e "${BLUE}Cloning mockify-creator repository...${RESET}"
git clone "${MOCKIFY_REPO}" "${TEMP_DIR}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to clone repository.${RESET}"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Backup current retail_edge directory
if [ -d "${RETAIL_EDGE_DIR}" ]; then
  echo -e "${BLUE}Backing up current retail_edge directory...${RESET}"
  BACKUP_DIR="${SOURCE_DIR}/retail_edge_backup_$(date +%Y%m%d%H%M%S)"
  mv "${RETAIL_EDGE_DIR}" "${BACKUP_DIR}"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to backup current retail_edge directory.${RESET}"
    rm -rf "${TEMP_DIR}"
    exit 1
  fi
  echo -e "${GREEN}Current retail_edge directory backed up to: ${BACKUP_DIR}${RESET}"
fi

# Create retail_edge directory
echo -e "${BLUE}Creating new retail_edge directory...${RESET}"
mkdir -p "${RETAIL_EDGE_DIR}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create retail_edge directory.${RESET}"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Copy main dashboard files
echo -e "${BLUE}Copying dashboard files from mockify-creator...${RESET}"
cp "${TEMP_DIR}/index.html" "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"
cp -r "${TEMP_DIR}/css" "${RETAIL_EDGE_DIR}/"
cp -r "${TEMP_DIR}/js" "${RETAIL_EDGE_DIR}/"
cp -r "${TEMP_DIR}/images" "${RETAIL_EDGE_DIR}/"
cp -r "${TEMP_DIR}/data" "${RETAIL_EDGE_DIR}/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy dashboard files.${RESET}"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Update the dashboard title and branding
echo -e "${BLUE}Updating dashboard title and branding...${RESET}"
sed -i '' 's|<title>.*</title>|<title>Retail Advisor</title>|' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"
sed -i '' 's|<h1 class="m-0 d-flex align-items-center">.*</h1>|<h1 class="m-0 d-flex align-items-center"><img src="../images/retail-advisor-logo.png" alt="Retail Advisor Logo" class="logo me-2"><span>Retail Advisor</span></h1>|' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"

# Add navigation links to other dashboards
echo -e "${BLUE}Adding navigation links to other dashboards...${RESET}"
NAVIGATION_CODE='<div class="text-center dashboard-nav mt-3">
  <a href="../qa.html" class="btn btn-outline-primary me-2">
    <i class="fas fa-chart-line me-1"></i> System Architecture & QA
  </a>
  <a href="../insights_dashboard.html" class="btn btn-outline-primary me-2">
    <i class="fas fa-external-link-alt me-1"></i> Scout Advanced Analytics
  </a>
</div>'

# Find the appropriate place to insert navigation and insert it
sed -i '' 's|<div class="container py-4">|<div class="container py-4">\n'"${NAVIGATION_CODE}"'|' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"

# Update footer branding
echo -e "${BLUE}Updating footer branding...${RESET}"
FOOTER_CODE='<footer class="footer">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <p class="mb-0">&copy; 2025 Retail Advisor</p>
      </div>
      <div class="col-md-6 text-end">
        <div class="analytics-powered">
          <span>Powered by DLab</span>
          <span class="analytics-version">2.1.2</span>
        </div>
      </div>
    </div>
  </div>
</footer>'

# Replace footer or add it if it doesn't exist
if grep -q '<footer' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"; then
  # Footer exists, replace it
  sed -i '' 's|<footer class="footer">.*</footer>|'"${FOOTER_CODE}"'|' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"
else
  # Footer doesn't exist, add it before closing body tag
  sed -i '' 's|</body>|'"${FOOTER_CODE}"'\n</body>|' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"
fi

# Update links to CSS and JS to use relative paths
echo -e "${BLUE}Updating CSS and JS links...${RESET}"
sed -i '' 's|href="css/|href="css/|g' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"
sed -i '' 's|src="js/|src="js/|g' "${RETAIL_EDGE_DIR}/retail_edge_dashboard.html"

# Clean up
echo -e "${BLUE}Cleaning up...${RESET}"
rm -rf "${TEMP_DIR}"

echo -e "\n${GREEN}mockify-creator dashboard successfully cloned and configured as Retail Advisor!${RESET}"
echo -e "${BLUE}Next steps:${RESET}"
echo -e "1. ${YELLOW}Review the updated dashboard at ${RETAIL_EDGE_DIR}/retail_edge_dashboard.html${RESET}"
echo -e "2. ${YELLOW}Run ./deploy_locked_dashboard.sh to deploy the updated dashboard${RESET}"
echo -e "3. ${YELLOW}Verify the deployed dashboard at https://gentle-rock-04e54f40f.6.azurestaticapps.net/retail_edge/retail_edge_dashboard.html${RESET}"