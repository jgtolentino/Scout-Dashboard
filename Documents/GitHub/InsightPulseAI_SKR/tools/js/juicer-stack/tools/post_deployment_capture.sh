#!/bin/bash
# post_deployment_capture.sh - Automatically captures screenshots after dashboard deployment
# Usage: ./post_deployment_capture.sh [dashboard_url]

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Post-Deployment Dashboard Capture                         ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_URL="https://gentle-rock-04e54f40f.6.azurestaticapps.net"
SHOGUN_SCRIPT="${SCRIPT_DIR}/shogun_dashboard_capture.sh"
DEPLOY_LOG="${PROJECT_ROOT}/deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Handle arguments
DASHBOARD_URL=${1:-$DEFAULT_URL}

# Check if shogun_dashboard_capture.sh exists
if [ ! -f "${SHOGUN_SCRIPT}" ]; then
    echo -e "${RED}Error: shogun_dashboard_capture.sh not found at ${SHOGUN_SCRIPT}${RESET}"
    exit 1
fi

# Make sure shogun_dashboard_capture.sh is executable
chmod +x "${SHOGUN_SCRIPT}"

# Log deployment start
echo -e "${BLUE}Starting post-deployment screenshot capture at $(date)${RESET}"
echo "Deployment Screenshot Capture - $(date)" >> "${DEPLOY_LOG}"
echo "Dashboard URL: ${DASHBOARD_URL}" >> "${DEPLOY_LOG}"

# Wait for the deployment to fully complete
echo -e "${YELLOW}Waiting 30 seconds for deployment to stabilize...${RESET}"
sleep 30

# Capture screenshot
echo -e "${BLUE}Capturing screenshot of deployed dashboard...${RESET}"
"${SHOGUN_SCRIPT}" "${DASHBOARD_URL}"

# Check if capture was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Post-deployment screenshot capture completed successfully${RESET}"
    echo "Screenshot capture completed successfully at $(date)" >> "${DEPLOY_LOG}"
else
    echo -e "${RED}Post-deployment screenshot capture failed${RESET}"
    echo "Screenshot capture failed at $(date)" >> "${DEPLOY_LOG}"
    exit 1
fi

# For CI/CD integration or GitHub Actions
echo -e "\n${BLUE}This script can be integrated into CI/CD pipelines with:${RESET}"
echo -e "- GitHub Actions workflow (add to deploy-insights.yml)"
echo -e "- Azure DevOps pipeline"
echo -e "- Manual execution after deployment"

echo -e "\n${GREEN}Post-deployment process complete!${RESET}"

# Sample GitHub Actions workflow step:
cat << "EOL"

# Sample GitHub Actions Workflow Step:
      - name: Capture Dashboard Screenshot
        run: |
          chmod +x ./tools/post_deployment_capture.sh
          ./tools/post_deployment_capture.sh ${{ env.DEPLOYED_DASHBOARD_URL }}
EOL