#!/bin/bash
# deploy_to_project_scout.sh - Deploy GenAI insights dashboards to Project Scout repo
# Automates the deployment process following dual repo push policy

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${MAGENTA}║  Project Scout Deployment: GenAI Insights Dashboards       ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check that we're in the juicer-stack directory
if [[ ! $(basename "$PWD") == "juicer-stack" ]]; then
  echo -e "${RED}Error: This script must be run from the juicer-stack directory${RESET}"
  exit 1
fi

# Function to check production readiness
check_production_readiness() {
  echo -e "${BLUE}${BOLD}Checking production readiness...${RESET}"
  
  if [[ -f "./verify_commit_readiness.sh" ]]; then
    chmod +x ./verify_commit_readiness.sh
    ./verify_commit_readiness.sh
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✓ Code is production-ready!${RESET}"
      return 0
    else
      echo -e "${RED}✗ Code is not production-ready. Please fix issues before proceeding.${RESET}"
      return 1
    fi
  else
    echo -e "${YELLOW}Warning: verify_commit_readiness.sh not found. Performing manual checks...${RESET}"
    
    # Manual checks
    missing_files=0
    
    # Check for essential files
    for file in "notebooks/juicer_gold_insights.py" "dashboards/insights_dashboard.html" "GENAI_INSIGHTS_INTEGRATION.md"; do
      if [[ ! -f "$file" ]]; then
        echo -e "${RED}Missing file: $file${RESET}"
        missing_files=$((missing_files + 1))
      fi
    done
    
    if [[ $missing_files -gt 0 ]]; then
      echo -e "${RED}✗ Found $missing_files missing files. Code is not production-ready.${RESET}"
      return 1
    else
      echo -e "${GREEN}✓ All essential files present.${RESET}"
      return 0
    fi
  fi
}

# Function to prepare deployment files
prepare_deployment_files() {
  echo -e "${BLUE}${BOLD}Preparing deployment files...${RESET}"
  
  # Get environment from user
  echo -e "${YELLOW}Select deployment environment:${RESET}"
  echo "1) dev"
  echo "2) staging"
  echo "3) prod"
  read -p "Enter your choice (1-3): " env_choice
  
  case $env_choice in
    1) ENV="dev" ;;
    2) ENV="staging" ;;
    3) ENV="prod" ;;
    *) ENV="staging" ;;
  esac
  
  echo -e "${YELLOW}Using environment: ${ENV}${RESET}"
  
  # Create deployment directory
  DEPLOY_DIR="../deploy"
  if [[ -d "$DEPLOY_DIR" ]]; then
    echo -e "${YELLOW}Cleaning existing deployment directory...${RESET}"
    rm -rf "$DEPLOY_DIR"
  fi
  
  # Run deployment script
  if [[ -f "./tools/deploy_insights_all_dashboards.js" ]]; then
    echo -e "${YELLOW}Running deployment script...${RESET}"
    node tools/deploy_insights_all_dashboards.js --env $ENV
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✓ Deployment files prepared successfully!${RESET}"
      return 0
    else
      echo -e "${RED}✗ Failed to prepare deployment files.${RESET}"
      return 1
    fi
  else
    echo -e "${RED}Error: deployment script not found.${RESET}"
    return 1
  fi
}

# Function to white-label code
whitelabel_code() {
  echo -e "${BLUE}${BOLD}White-labeling code for Project Scout...${RESET}"
  
  if [[ -f "./whitelabel.sh" ]]; then
    echo -e "${YELLOW}Running white-labeling process...${RESET}"
    chmod +x ./whitelabel.sh
    ./whitelabel.sh
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✓ Code white-labeled successfully!${RESET}"
      echo -e "${GREEN}✓ White-labeled files available in client-facing/output/${RESET}"
      return 0
    else
      echo -e "${RED}✗ Failed to white-label code.${RESET}"
      return 1
    fi
  else
    echo -e "${RED}Error: white-labeling script not found.${RESET}"
    return 1
  fi
}

# Function to run dual repo push
run_dual_repo_push() {
  echo -e "${BLUE}${BOLD}Running dual repo push...${RESET}"
  
  if [[ -f "./dual_repo_push.sh" ]]; then
    echo -e "${YELLOW}Proceeding with dual repo push...${RESET}"
    chmod +x ./dual_repo_push.sh
    SKR_TAG=prod-ready ./dual_repo_push.sh
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✓ Dual repo push completed successfully!${RESET}"
      return 0
    else
      echo -e "${RED}✗ Dual repo push failed.${RESET}"
      return 1
    fi
  else
    echo -e "${RED}Error: dual_repo_push.sh not found.${RESET}"
    return 1
  fi
}

# Function to capture screenshots for deployment verification
capture_screenshots() {
  echo -e "${BLUE}${BOLD}Capturing deployment verification screenshots...${RESET}"
  
  # Check if shogun_dashboard_capture.sh exists
  if [[ ! -f "./tools/shogun_dashboard_capture.sh" ]]; then
    echo -e "${YELLOW}Warning: Dashboard capture script not found. Skipping screenshot capture.${RESET}"
    return 1
  fi
  
  # Create directories if they don't exist
  mkdir -p assets/screenshots
  mkdir -p assets/thumbnails
  mkdir -p assets/reports
  
  # Ask for dashboard URL
  echo -e "${YELLOW}Enter the deployment URL:${RESET}"
  read -p "> " DASHBOARD_URL
  
  if [[ -z "$DASHBOARD_URL" ]]; then
    DASHBOARD_URL="https://gentle-rock-04e54f40f.6.azurestaticapps.net"
    echo -e "${YELLOW}Using default URL: ${DASHBOARD_URL}${RESET}"
  fi
  
  # Run screenshot capture
  echo -e "${YELLOW}Capturing screenshots...${RESET}"
  chmod +x ./tools/shogun_dashboard_capture.sh
  (cd ./tools && ./shogun_dashboard_capture.sh "$DASHBOARD_URL")
  
  # Check if screenshots were captured
  if [[ -d "./assets/screenshots" && $(ls -1 ./assets/screenshots/*.png 2>/dev/null | wc -l) -gt 0 ]]; then
    echo -e "${GREEN}✓ Screenshots captured successfully!${RESET}"
    return 0
  else
    echo -e "${RED}✗ Failed to capture screenshots.${RESET}"
    return 1
  fi
}

# Function to update documentation
update_documentation() {
  echo -e "${BLUE}${BOLD}Updating documentation...${RESET}"
  
  # Record the deployment
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Update IMPLEMENTATION_COMPLETE.md
  if [[ -f "./IMPLEMENTATION_COMPLETE.md" ]]; then
    echo -e "${YELLOW}Updating implementation status...${RESET}"
    DEPLOYMENT_SUMMARY="
## Deployment Completed: $TIMESTAMP

GenAI Insights Dashboard components have been successfully deployed to Project Scout.

- **Environment**: $ENV
- **Deployment URL**: $DASHBOARD_URL
- **Deployed Components**:
  - Main Insights Dashboard
  - Retail Edge Dashboard
  - Operations Dashboard
  - Visualization components
  - Data pipeline scripts

The components have been white-labeled according to the dual push policy.
"
    echo "$DEPLOYMENT_SUMMARY" >> ./IMPLEMENTATION_COMPLETE.md
  fi
  
  # Update DEPLOYMENT_COMPLETE.md
  if [[ -f "./DEPLOYMENT_COMPLETE.md" ]]; then
    echo -e "${YELLOW}Updating deployment documentation...${RESET}"
    echo "$DEPLOYMENT_SUMMARY" >> ./DEPLOYMENT_COMPLETE.md
  else
    echo -e "${YELLOW}Creating deployment documentation...${RESET}"
    echo "# Deployment Status

$DEPLOYMENT_SUMMARY" > ./DEPLOYMENT_COMPLETE.md
  fi
  
  echo -e "${GREEN}✓ Documentation updated successfully!${RESET}"
  return 0
}

# Main execution flow
echo -e "${YELLOW}Starting deployment process...${RESET}"

# Step 1: Check production readiness
check_production_readiness
if [[ $? -ne 0 ]]; then
  echo -e "${RED}Deployment aborted: Code is not production-ready${RESET}"
  exit 1
fi

# Step 2: Prepare deployment files
prepare_deployment_files
if [[ $? -ne 0 ]]; then
  echo -e "${RED}Deployment aborted: Failed to prepare deployment files${RESET}"
  exit 1
fi

# Step 3: White-label code
whitelabel_code
if [[ $? -ne 0 ]]; then
  echo -e "${RED}Deployment aborted: Failed to white-label code${RESET}"
  exit 1
fi

# Step 4: Run dual repo push
run_dual_repo_push
if [[ $? -ne 0 ]]; then
  echo -e "${RED}Deployment aborted: Failed to run dual repo push${RESET}"
  exit 1
fi

# Step 5: Ask if deployed
echo -e "${YELLOW}Have the dashboards been deployed to Azure via GitHub Actions? (y/n)${RESET}"
read -p "> " is_deployed

if [[ "$is_deployed" =~ ^[Yy]$ ]]; then
  # Step 6: Capture screenshots
  capture_screenshots
  
  # Step 7: Update documentation
  update_documentation
fi

# Summary
echo -e "\n${MAGENTA}${BOLD}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  Deployment Process Complete!                               ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚════════════════════════════════════════════════════════════╝${RESET}"

echo -e "\n${GREEN}${BOLD}Deployment Summary:${RESET}"
echo -e "  Environment: ${CYAN}${ENV}${RESET}"
echo -e "  Production Ready: ${GREEN}Yes${RESET}"
echo -e "  White-labeled: ${GREEN}Yes${RESET}"
echo -e "  SKR Archive: ${GREEN}Complete${RESET}"
echo -e "  Project Scout Repo: ${GREEN}Files Prepared${RESET}"
echo -e "  Date: $(date)"

if [[ "$is_deployed" =~ ^[Yy]$ ]]; then
  echo -e "  Screenshots: ${GREEN}Captured${RESET}"
  echo -e "  Documentation: ${GREEN}Updated${RESET}"
else
  echo -e "\n${BLUE}Next Steps:${RESET}"
  echo -e "  1. Complete GitHub PR in Project Scout repository"
  echo -e "  2. Deploy using GitHub Actions workflow"
  echo -e "  3. Run this script again to capture screenshots and update documentation"
fi

echo -e "\n${YELLOW}Thank you for using the Project Scout deployment script!${RESET}"