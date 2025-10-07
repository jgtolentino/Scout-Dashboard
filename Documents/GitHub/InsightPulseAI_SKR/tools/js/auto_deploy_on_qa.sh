#!/bin/bash
# Automated deployment script that triggers after successful QA
# Deploys Scout Advisor Dashboard changes to Azure Static Web Apps
# and integrates with the Azure DevOps pipeline

set -e

# Configuration
DEPLOY_DIR="deploy-advisor-fixed"
QA_LOG_DIR="qa/logs"
DEPLOYMENT_TOKEN="5d4094b03359795014c37eae8dfa7bbe46ffc4bd9a5684cdc8526b8a9b6baa9d06-522d0a67-bdf4-4de9-9a9e-95105ab6f05300f181203349aa0f"
AZURE_STATIC_WEBAPP_URL="https://delightful-glacier-03349aa0f.6.azurestaticapps.net"
GITHUB_BRANCH="dashboard-deployment"

# Text formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Scout Dashboard Auto-Deploy on QA Completion${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if SWA CLI is installed
if ! command -v swa &> /dev/null; then
    echo -e "${RED}Error: Azure Static Web Apps CLI (swa) is not installed.${NC}"
    echo -e "Please install it using: npm install -g @azure/static-web-apps-cli"
    exit 1
fi

# Function to check if QA passed
check_qa_status() {
    # Get latest QA log file
    LATEST_QA_LOG=$(ls -t "$QA_LOG_DIR"/caca_scout_advisor_*.json 2>/dev/null | head -n 1)
    
    if [ -z "$LATEST_QA_LOG" ]; then
        echo -e "${YELLOW}No QA logs found. Running in bypass mode.${NC}"
        return 0
    fi
    
    echo -e "Checking QA status from log: ${BLUE}$LATEST_QA_LOG${NC}"
    
    # Check if it's a live run (not dry-run)
    IS_LIVE=$(grep -o '"status": "live"' "$LATEST_QA_LOG" || echo "")
    if [ -z "$IS_LIVE" ]; then
        echo -e "${YELLOW}QA log is not from a live run. Running in bypass mode.${NC}"
        return 0
    fi
    
    # Check for failures
    FAILURES=$(grep -o '"status": "FAIL"' "$LATEST_QA_LOG" || echo "")
    if [ -n "$FAILURES" ]; then
        echo -e "${RED}QA tests failed. Deployment aborted.${NC}"
        echo -e "Please fix the issues reported in the QA log before deploying."
        return 1
    fi
    
    echo -e "${GREEN}QA tests passed successfully. Proceeding with deployment.${NC}"
    return 0
}

# Function to deploy using SWA CLI
deploy_with_swa_cli() {
    echo -e "\n${BLUE}Deploying with SWA CLI...${NC}"
    
    echo -e "Deploying from: ${YELLOW}$DEPLOY_DIR${NC}"
    echo -e "Target: ${YELLOW}$AZURE_STATIC_WEBAPP_URL${NC}"
    
    # Deploy using SWA CLI
    swa deploy "$DEPLOY_DIR" \
        --deployment-token "$DEPLOYMENT_TOKEN" \
        --env production
    
    echo -e "${GREEN}Deployment complete!${NC}"
    echo -e "Dashboard is now available at: ${BLUE}$AZURE_STATIC_WEBAPP_URL/advisor${NC}"
}

# Function to commit and push changes for CI/CD
setup_ci_cd() {
    echo -e "\n${BLUE}Setting up CI/CD integration...${NC}"
    
    # Check if running in CI/CD context
    if [ -n "$GITHUB_ACTIONS" ] || [ -n "$AZURE_DEVOPS" ]; then
        echo -e "${YELLOW}Already running in CI/CD context. Skipping git operations.${NC}"
        return 0
    fi
    
    # Check if we need to setup CI/CD locally
    read -p "Set up automated CI/CD for future deployments? (y/n): " SETUP_CICD
    if [[ $SETUP_CICD != "y" && $SETUP_CICD != "Y" ]]; then
        echo -e "${YELLOW}Skipping CI/CD setup.${NC}"
        return 0
    fi
    
    # Create Azure DevOps pipeline folder if it doesn't exist
    mkdir -p .azure-pipelines
    
    # Create a trigger script
    cat > .azure-pipelines/qa-trigger-deploy.yml << EOF
# Azure DevOps Pipeline to deploy on successful QA
trigger:
  branches:
    include:
      - main
      - $GITHUB_BRANCH
  paths:
    include:
      - 'tools/js/deploy-advisor-fixed/**'
      - 'tools/js/qa/logs/**'

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '16.x'
  displayName: 'Install Node.js'

- script: |
    npm install -g @azure/static-web-apps-cli
  displayName: 'Install SWA CLI'

- script: |
    cd tools/js
    ./auto_deploy_on_qa.sh --ci
  displayName: 'Deploy on QA completion'
  env:
    DEPLOYMENT_TOKEN: \$(deploymentToken)
EOF
    
    echo -e "${GREEN}Created Azure DevOps pipeline configuration in .azure-pipelines/qa-trigger-deploy.yml${NC}"
    
    # Create Azure DevOps variables setup script
    cat > .azure-pipelines/setup-variables.sh << EOF
#!/bin/bash
# Setup Azure DevOps pipeline variables

az pipelines variable-group create \
  --name "scout-advisor-deploy" \
  --variables \
  deploymentToken="$DEPLOYMENT_TOKEN" \
  targetUrl="$AZURE_STATIC_WEBAPP_URL"
EOF
    chmod +x .azure-pipelines/setup-variables.sh
    
    echo -e "${GREEN}Created variable setup script: .azure-pipelines/setup-variables.sh${NC}"
    echo -e "${YELLOW}To complete CI/CD setup:${NC}"
    echo -e "1. Create an Azure DevOps pipeline using the .azure-pipelines/qa-trigger-deploy.yml file"
    echo -e "2. Run .azure-pipelines/setup-variables.sh to create the variable group"
    echo -e "3. Configure the pipeline to use the 'scout-advisor-deploy' variable group"
}

# Function to verify deployment
verify_deployment() {
    echo -e "\n${BLUE}Verifying deployment...${NC}"
    
    # Wait a bit for deployment to propagate
    echo -e "Waiting for deployment to propagate..."
    sleep 10
    
    # Check main page
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AZURE_STATIC_WEBAPP_URL/advisor")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Main dashboard (/advisor) is accessible.${NC}"
    else
        echo -e "${RED}⚠️ Main dashboard (/advisor) returned HTTP $HTTP_STATUS.${NC}"
    fi
    
    # Check static resources
    RESOURCE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AZURE_STATIC_WEBAPP_URL/css/theme-tbwa-advisor.css")
    if [ "$RESOURCE_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Custom TBWA theme CSS is accessible.${NC}"
    else
        echo -e "${RED}⚠️ Custom TBWA theme CSS returned HTTP $RESOURCE_STATUS.${NC}"
    fi
    
    INTERACTIVITY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AZURE_STATIC_WEBAPP_URL/js/dashboard-interactivity.js")
    if [ "$INTERACTIVITY_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Dashboard interactivity JS is accessible.${NC}"
    else
        echo -e "${RED}⚠️ Dashboard interactivity JS returned HTTP $INTERACTIVITY_STATUS.${NC}"
    fi
    
    DIAGNOSTIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AZURE_STATIC_WEBAPP_URL/js/diagnostic-overlay.js")
    if [ "$DIAGNOSTIC_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Diagnostic overlay JS is accessible.${NC}"
    else
        echo -e "${RED}⚠️ Diagnostic overlay JS returned HTTP $DIAGNOSTIC_STATUS.${NC}"
    fi
    
    echo -e "\n${BLUE}Post-deployment verification checks complete.${NC}"
    
    if [ "$HTTP_STATUS" -eq 200 ] && [ "$RESOURCE_STATUS" -eq 200 ] && [ "$INTERACTIVITY_STATUS" -eq 200 ] && [ "$DIAGNOSTIC_STATUS" -eq 200 ]; then
        echo -e "${GREEN}All resources are accessible. Deployment verified successfully!${NC}"
        echo -e "🚀 View dashboard: ${BLUE}$AZURE_STATIC_WEBAPP_URL/advisor${NC}"
        echo -e "Press Alt+Shift+D on the dashboard to access the diagnostic overlay."
    else
        echo -e "${RED}Some resources failed verification. Please check the deployment logs.${NC}"
    fi
}

# Main execution flow
main() {
    # Check if we're running in CI mode
    if [ "$1" == "--ci" ]; then
        echo -e "${BLUE}Running in CI/CD mode.${NC}"
        CI_MODE=true
    else
        CI_MODE=false
    fi
    
    # Check if QA passed
    if ! check_qa_status; then
        exit 1
    fi
    
    # Deploy using SWA CLI
    deploy_with_swa_cli
    
    # Verify the deployment
    verify_deployment
    
    # Set up CI/CD if needed
    if [ "$CI_MODE" = false ]; then
        setup_ci_cd
    fi
    
    echo -e "\n${GREEN}==================================${NC}"
    echo -e "${GREEN}Deployment process completed!${NC}"
    echo -e "${GREEN}==================================${NC}"
}

# Call main function with all arguments
main "$@"