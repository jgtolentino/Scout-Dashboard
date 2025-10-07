#!/bin/bash
# trigger_github_deployment.sh - Script to trigger GitHub Actions deployment

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
REPO_OWNER="tbwa" # Replace with your GitHub username or organization
REPO_NAME="InsightPulseAI_SKR" # Replace with your repository name
WORKFLOW_FILE="deploy-insights.yml"
ENVIRONMENT="staging" # Default environment

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  GitHub Actions Trigger for Juicer Insights                ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Select workflow to run
echo -e "${BLUE}Select workflow to trigger:${RESET}"
echo -e "1) Deploy Juicer GenAI Insights (deploy-insights.yml)"
echo -e "2) Capture Dashboard Screenshots (scheduled-dashboard-capture.yml)"
read -p "Enter your choice [1]: " workflow_choice

case $workflow_choice in
  2)
    WORKFLOW_FILE="scheduled-dashboard-capture.yml"
    WORKFLOW_NAME="Capture Dashboard Screenshots"
    ;;
  *)
    WORKFLOW_FILE="deploy-insights.yml"
    WORKFLOW_NAME="Deploy Juicer GenAI Insights"
    ;;
esac

echo -e "${GREEN}Selected workflow: ${WORKFLOW_NAME}${RESET}"

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
  echo -e "${YELLOW}GitHub CLI not found. You can install it with:${RESET}"
  echo -e "brew install gh (macOS)"
  echo -e "apt install gh (Ubuntu/Debian)"
  echo -e "See https://cli.github.com for other platforms"
  
  echo -e "\n${BLUE}Alternative: Trigger deployment manually${RESET}"
  echo -e "1. Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
  echo -e "2. Select the 'Deploy Juicer GenAI Insights' workflow"
  echo -e "3. Click 'Run workflow'"
  echo -e "4. Select the branch and environment, then click 'Run workflow'"
  
  exit 0
fi

# Check GitHub login
echo -e "${BLUE}Checking GitHub CLI login...${RESET}"
if ! gh auth status &> /dev/null; then
  echo -e "${YELLOW}Not logged in to GitHub CLI. Please log in:${RESET}"
  gh auth login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to log in to GitHub CLI${RESET}"
    exit 1
  fi
fi
echo -e "${GREEN}Logged in to GitHub CLI${RESET}"

# Get parameters based on selected workflow
if [[ "$WORKFLOW_FILE" == "deploy-insights.yml" ]]; then
  # Parameters for deploy-insights.yml

  # Select environment
  echo -e "\n${BLUE}Select deployment environment:${RESET}"
  echo -e "1) dev"
  echo -e "2) staging (recommended for testing)"
  echo -e "3) prod (only for final deployment)"
  read -p "Enter your choice [2]: " env_choice
  case $env_choice in
    1) ENVIRONMENT="dev" ;;
    3) ENVIRONMENT="prod" ;;
    *) ENVIRONMENT="staging" ;;
  esac

  # Ask about force generating insights
  echo -e "\n${BLUE}Force generate insights after deployment?${RESET}"
  echo -e "This will run the insights generation notebook immediately after deployment."
  read -p "Generate insights (y/n) [n]: " generate_insights
  case $generate_insights in
    [Yy]* ) FORCE_GENERATE="true" ;;
    * ) FORCE_GENERATE="false" ;;
  esac

  # Trigger workflow
  echo -e "\n${BLUE}Triggering GitHub Actions workflow...${RESET}"
  echo -e "Repository: ${REPO_OWNER}/${REPO_NAME}"
  echo -e "Workflow: ${WORKFLOW_FILE}"
  echo -e "Environment: ${ENVIRONMENT}"
  echo -e "Force Generate Insights: ${FORCE_GENERATE}"

  # Use GitHub CLI to trigger deploy-insights workflow
  gh workflow run "${WORKFLOW_FILE}" -R "${REPO_OWNER}/${REPO_NAME}" -f environment=${ENVIRONMENT} -f forceGenerateInsights=${FORCE_GENERATE}

else
  # Parameters for scheduled-dashboard-capture.yml

  # Select environment
  echo -e "\n${BLUE}Select dashboard environment to capture:${RESET}"
  echo -e "1) dev"
  echo -e "2) staging"
  echo -e "3) prod (default)"
  read -p "Enter your choice [3]: " env_choice
  case $env_choice in
    1) ENVIRONMENT="dev" ;;
    2) ENVIRONMENT="staging" ;;
    *) ENVIRONMENT="prod" ;;
  esac

  # Ask for custom dashboard URL
  echo -e "\n${BLUE}Provide a custom dashboard URL?${RESET}"
  echo -e "If left blank, the default URL for the selected environment will be used."
  read -p "Dashboard URL (optional): " DASHBOARD_URL

  # Trigger workflow
  echo -e "\n${BLUE}Triggering GitHub Actions workflow...${RESET}"
  echo -e "Repository: ${REPO_OWNER}/${REPO_NAME}"
  echo -e "Workflow: ${WORKFLOW_FILE}"
  echo -e "Environment: ${ENVIRONMENT}"
  if [[ -n "$DASHBOARD_URL" ]]; then
    echo -e "Dashboard URL: ${DASHBOARD_URL}"
    # Use GitHub CLI to trigger scheduled-dashboard-capture workflow with custom URL
    gh workflow run "${WORKFLOW_FILE}" -R "${REPO_OWNER}/${REPO_NAME}" -f environment=${ENVIRONMENT} -f dashboardUrl="${DASHBOARD_URL}"
  else
    # Use GitHub CLI to trigger scheduled-dashboard-capture workflow with default URL
    gh workflow run "${WORKFLOW_FILE}" -R "${REPO_OWNER}/${REPO_NAME}" -f environment=${ENVIRONMENT}
  fi
fi

if [ $? -ne 0 ]; then
  echo -e "\n${RED}Failed to trigger GitHub Actions workflow${RESET}"
  echo -e "${YELLOW}You can trigger the workflow manually:${RESET}"
  echo -e "1. Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
  echo -e "2. Select the 'Deploy Juicer GenAI Insights' workflow"
  echo -e "3. Click 'Run workflow'"
  echo -e "4. Select the branch and environment, then click 'Run workflow'"
else
  echo -e "\n${GREEN}Successfully triggered GitHub Actions workflow!${RESET}"
  echo -e "You can monitor the workflow at:"
  echo -e "https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
fi

# Check workflow status
echo -e "\n${BLUE}Checking workflow status...${RESET}"
sleep 5 # Wait for workflow to start
gh run list -R "${REPO_OWNER}/${REPO_NAME}" -w "${WORKFLOW_FILE}" -L 1

echo -e "\n${BLUE}${BOLD}Next Steps${RESET}"
echo -e "-----------------------------------"

if [[ "$WORKFLOW_FILE" == "deploy-insights.yml" ]]; then
  echo -e "1. Monitor the deployment workflow in GitHub Actions"
  echo -e "2. Once complete, verify the dashboard at: https://gentle-rock-04e54f40f.6.azurestaticapps.net"
  echo -e "3. Check Databricks workspace for the deployed notebooks"
  echo -e "4. Verify the scheduled jobs in Databricks"
else
  echo -e "1. Monitor the screenshot capture workflow in GitHub Actions"
  echo -e "2. Once complete, check the dashboard-screenshots artifact for captured images"
  echo -e "3. View the generated HTML gallery in assets/reports/dashboard_preview.html"
  echo -e "4. Verify the screenshots were added to documentation in README_FINAL.md"
fi