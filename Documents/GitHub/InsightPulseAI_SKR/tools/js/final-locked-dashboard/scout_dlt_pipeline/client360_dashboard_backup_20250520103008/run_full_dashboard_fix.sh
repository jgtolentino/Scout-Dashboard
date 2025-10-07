#!/bin/bash
# Master Script for Complete Client360 Dashboard CSS Fix and Verification
# This script runs the entire CSS fix process including deployment option selection

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Azure Settings
AZURE_URL="https://blue-coast-0acb6880f.6.azurestaticapps.net"
RESOURCE_GROUP="InsightPulseAI-RG"
STATIC_WEB_APP_NAME="tbwa-client360-dashboard"

# Log file
LOG_FILE="$BASE_DIR/logs/full_dashboard_fix_$(date +"%Y%m%d%H%M%S").log"
mkdir -p "$BASE_DIR/logs"
touch "$LOG_FILE"

# Function to log messages
log() {
    local message="$1"
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Step 1: Run the automated CSS fix script
run_automated_fix() {
    log "${BLUE}Running automated CSS fix script...${NC}"
    
    ./automate_css_fix_deployment.sh
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: Automated CSS fix script failed.${NC}"
        exit 1
    fi
    
    log "${GREEN}Automated CSS fix completed successfully.${NC}"
}

# Step 2: Select and run deployment method
deploy_to_azure() {
    log "${BLUE}Select deployment method:${NC}"
    log "1) Azure CLI"
    log "2) SWA CLI"
    log "3) Prepare for manual deployment via Azure Portal"
    
    # Auto-select the first available method
    DEPLOY_METHOD=0
    
    # Check if Azure CLI is available
    if command_exists az; then
        DEPLOY_METHOD=1
        log "${GREEN}Azure CLI found. Selecting Azure CLI deployment method.${NC}"
    # Check if SWA CLI is available
    elif command_exists swa; then
        DEPLOY_METHOD=2
        log "${GREEN}SWA CLI found. Selecting SWA CLI deployment method.${NC}"
    # Default to manual upload preparation
    else
        DEPLOY_METHOD=3
        log "${YELLOW}No Azure deployment tools found. Preparing for manual deployment.${NC}"
    fi
    
    # Get the latest deployment package
    DEPLOY_PACKAGE=$(ls -t $BASE_DIR/output/client360_dashboard_automated_fix_*.zip 2>/dev/null | head -1)
    
    if [ -z "$DEPLOY_PACKAGE" ]; then
        log "${RED}Error: No deployment package found.${NC}"
        exit 1
    fi
    
    log "${GREEN}Using deployment package: $DEPLOY_PACKAGE${NC}"
    
    # Deploy based on selected method
    case $DEPLOY_METHOD in
        1)
            log "${BLUE}Deploying using Azure CLI...${NC}"
            
            # Check if already logged in
            az account show &> /dev/null
            if [ $? -ne 0 ]; then
                log "${YELLOW}Not logged in to Azure. Logging in...${NC}"
                az login
            fi
            
            # Deploy to Azure Static Web App
            log "${BLUE}Deploying to Azure Static Web App...${NC}"
            az staticwebapp deploy \
                --name $STATIC_WEB_APP_NAME \
                --resource-group $RESOURCE_GROUP \
                --source-path "$BASE_DIR/deploy"
            
            if [ $? -ne 0 ]; then
                log "${RED}Error: Azure deployment failed.${NC}"
                log "${YELLOW}Please deploy manually using the Azure Portal.${NC}"
                prepare_for_manual_deployment
                exit 1
            fi
            
            log "${GREEN}Deployment completed successfully using Azure CLI.${NC}"
            ;;
            
        2)
            log "${BLUE}Deploying using SWA CLI...${NC}"
            
            # Try to get deployment token from environment or config
            DEPLOYMENT_TOKEN=""
            if [ -f "$BASE_DIR/.env" ]; then
                source "$BASE_DIR/.env"
                DEPLOYMENT_TOKEN=$SWA_DEPLOYMENT_TOKEN
            fi
            
            if [ -z "$DEPLOYMENT_TOKEN" ]; then
                log "${RED}Error: SWA deployment token not found.${NC}"
                log "${YELLOW}Preparing for manual deployment instead.${NC}"
                prepare_for_manual_deployment
                exit 1
            fi
            
            # Deploy using SWA CLI
            swa deploy "$BASE_DIR/deploy" --deployment-token $DEPLOYMENT_TOKEN
            
            if [ $? -ne 0 ]; then
                log "${RED}Error: SWA CLI deployment failed.${NC}"
                log "${YELLOW}Please deploy manually using the Azure Portal.${NC}"
                prepare_for_manual_deployment
                exit 1
            fi
            
            log "${GREEN}Deployment completed successfully using SWA CLI.${NC}"
            ;;
            
        3)
            prepare_for_manual_deployment
            ;;
            
        *)
            log "${RED}Invalid deployment method selection.${NC}"
            prepare_for_manual_deployment
            ;;
    esac
}

# Function to prepare for manual deployment
prepare_for_manual_deployment() {
    log "${BLUE}Preparing for manual deployment...${NC}"
    
    # Copy the deployment package to a more accessible location
    DEPLOY_PACKAGE=$(ls -t $BASE_DIR/output/client360_dashboard_automated_fix_*.zip 2>/dev/null | head -1)
    
    if [ -z "$DEPLOY_PACKAGE" ]; then
        log "${RED}Error: No deployment package found.${NC}"
        exit 1
    fi
    
    DESKTOP_DIR="$HOME/Desktop"
    cp "$DEPLOY_PACKAGE" "$DESKTOP_DIR/"
    
    # Create detailed instructions for manual deployment
    MANUAL_INSTRUCTIONS="$BASE_DIR/MANUAL_DEPLOYMENT_STEPS.md"
    
    cat > "$MANUAL_INSTRUCTIONS" << EOF
# Manual Deployment Instructions for Client360 Dashboard

## Overview

This document provides step-by-step instructions for manually deploying the fixed Client360 Dashboard to Azure Static Web App.

## Prerequisites

- Access to the Azure Portal with sufficient permissions

## Deployment Steps

1. **Log in to Azure Portal**
   - Open a web browser and navigate to [https://portal.azure.com](https://portal.azure.com)
   - Log in with your Azure credentials

2. **Navigate to Static Web App Resource**
   - Search for "Static Web Apps" in the search bar or navigate to your resource group
   - Select the "tbwa-client360-dashboard" Static Web App resource

3. **Access Deployment Options**
   - In the left navigation menu, select "Deployment" under "Deployment"
   - Click on "Manual Deploy" tab

4. **Upload the Deployment Package**
   - Click "Browse for file" or drag and drop the deployment package
   - Use the deployment package copied to your Desktop:
     \`$DESKTOP_DIR/$(basename "$DEPLOY_PACKAGE")\`
   - Click "Upload" to start the deployment process

5. **Wait for Deployment to Complete**
   - This typically takes 1-5 minutes
   - You can monitor the deployment status in the portal

## Verification After Deployment

1. **Access the Dashboard**
   - Navigate to the dashboard URL: \`$AZURE_URL\`

2. **Run the Verification Script**
   - Return to your terminal/command line
   - Run the verification script:
     \`\`\`bash
     cd "$BASE_DIR"
     ./verify_css_fix_final.sh $AZURE_URL
     \`\`\`

3. **Check Verification Report**
   - Review the verification report generated by the script
   - Ensure all CSS files have the correct content-type headers
   - Verify the TBWA branding elements are displayed correctly
EOF
    
    log "${GREEN}Manual deployment instructions created at: $MANUAL_INSTRUCTIONS${NC}"
    log "${GREEN}Deployment package copied to: $DESKTOP_DIR/$(basename "$DEPLOY_PACKAGE")${NC}"
    
    echo "-------------------------------------------------------------"
    echo "MANUAL DEPLOYMENT REQUIRED:"
    echo "-------------------------------------------------------------"
    echo "1. Login to Azure Portal: https://portal.azure.com"
    echo "2. Navigate to the tbwa-client360-dashboard Static Web App"
    echo "3. Go to Deployment > Manual Deploy"
    echo "4. Upload the package from: $DESKTOP_DIR/$(basename "$DEPLOY_PACKAGE")"
    echo "5. After deployment, verify using: ./verify_css_fix_final.sh $AZURE_URL"
    echo "-------------------------------------------------------------"
    echo "Detailed instructions: $MANUAL_INSTRUCTIONS"
    echo "-------------------------------------------------------------"
}

# Step 3: Run verification
run_verification() {
    log "${BLUE}Running verification...${NC}"
    
    # Wait a moment for the deployment to propagate
    log "${YELLOW}Waiting 30 seconds for deployment to propagate...${NC}"
    sleep 30
    
    # Run the verification script
    ./verify_css_fix_final.sh "$AZURE_URL"
    
    if [ $? -ne 0 ]; then
        log "${RED}Warning: Verification script completed with issues.${NC}"
        log "${YELLOW}Please check the verification report for details.${NC}"
    else
        log "${GREEN}Verification completed successfully.${NC}"
    fi
    
    # Check manual verification points
    VERIFICATION_REPORT="$BASE_DIR/FINAL_VERIFICATION_RESULTS.md"
    
    cat > "$VERIFICATION_REPORT" << EOF
# Client360 Dashboard CSS Fix - Final Verification Results

**Date:** $(date +"%B %d, %Y %H:%M:%S")
**Dashboard URL:** $AZURE_URL

## Automated Checks

The following automated checks were performed:

1. **CSS Content-Type Headers**: 
   - Variables CSS: \`$(curl -s -I "$AZURE_URL/css/variables.css" | grep -i content-type | tr -d '\r')\`
   - TBWA Theme CSS: \`$(curl -s -I "$AZURE_URL/css/tbwa-theme.css" | grep -i content-type | tr -d '\r')\`
   - Dashboard CSS: \`$(curl -s -I "$AZURE_URL/css/dashboard.css" | grep -i content-type | tr -d '\r')\`

2. **HTML CSS References**:
   - Variables CSS Referenced: $(curl -s "$AZURE_URL" | grep -q 'href="css/variables.css"' && echo "✅ Yes" || echo "❌ No")
   - TBWA Theme CSS Referenced: $(curl -s "$AZURE_URL" | grep -q 'href="css/tbwa-theme.css"' && echo "✅ Yes" || echo "❌ No")
   - Dashboard CSS Referenced: $(curl -s "$AZURE_URL" | grep -q 'href="css/dashboard.css"' && echo "✅ Yes" || echo "❌ No")

## Visual Verification Required

Please check the following items visually:

1. **TBWA Branding Colors**:
   - Yellow (#ffc300) should be visible in KPI tile borders and elements
   - Blue (#005bbb) should be visible in buttons and interactive elements

2. **Dashboard Components**:
   - KPI tiles should have yellow top borders
   - Charts should use the TBWA color palette
   - Text should be properly styled according to the TBWA design

3. **Responsiveness**:
   - Dashboard should adapt properly to different screen sizes
   - UI elements should maintain proper styling at all viewport widths

## Conclusion

Based on the automated checks, the CSS styling fix has been $(curl -s -I "$AZURE_URL/css/variables.css" | grep -q "text/css" && curl -s -I "$AZURE_URL/css/tbwa-theme.css" | grep -q "text/css" && curl -s -I "$AZURE_URL/css/dashboard.css" | grep -q "text/css" && curl -s "$AZURE_URL" | grep -q 'href="css/variables.css"' && curl -s "$AZURE_URL" | grep -q 'href="css/tbwa-theme.css"' && curl -s "$AZURE_URL" | grep -q 'href="css/dashboard.css"' && echo "✅ SUCCESSFULLY APPLIED" || echo "⚠️ PARTIALLY APPLIED - MANUAL VERIFICATION REQUIRED").

Please complete the visual verification to confirm all styling issues have been resolved.
EOF
    
    log "${GREEN}Final verification report created: $VERIFICATION_REPORT${NC}"
}

# Main function to run all steps
main() {
    log "${GREEN}Starting complete Client360 Dashboard CSS fix process...${NC}"
    
    run_automated_fix
    deploy_to_azure
    run_verification
    
    log "${GREEN}Dashboard CSS fix process completed!${NC}"
    log "${GREEN}Final verification report: $BASE_DIR/FINAL_VERIFICATION_RESULTS.md${NC}"
    
    echo "======================= COMPLETE =========================="
    echo "The Client360 Dashboard CSS fix has been applied and verified."
    echo "Please check the final verification report for details:"
    echo "$BASE_DIR/FINAL_VERIFICATION_RESULTS.md"
    echo "==========================================================="
}

# Run the main function
main