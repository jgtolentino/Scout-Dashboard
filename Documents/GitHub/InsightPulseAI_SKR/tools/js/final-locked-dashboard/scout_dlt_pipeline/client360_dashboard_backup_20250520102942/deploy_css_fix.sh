#!/bin/bash

# Deploy CSS Fix for Client360 Dashboard
# This script deploys the updated staticwebapp.config.json to fix the CSS styling issue

echo "==== TBWA Client360 Dashboard - CSS Fix Deployment ===="
echo "Starting deployment process..."

# Create a backup of the current deployment
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="deploy_css_fix_backup_${TIMESTAMP}"
DEPLOY_DIR="deploy"
OUTPUT_DIR="output"
ZIP_FILE="${OUTPUT_DIR}/client360_dashboard_css_fix.zip"

# Create backup directory
echo "Creating backup in ${BACKUP_DIR}..."
mkdir -p "${BACKUP_DIR}"
cp -r "${DEPLOY_DIR}"/* "${BACKUP_DIR}"
echo "Backup created successfully."

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Create the deployment package
echo "Creating deployment package..."
cd "${DEPLOY_DIR}" && zip -r "../${ZIP_FILE}" * && cd ..
echo "Deployment package created at ${ZIP_FILE}"

echo "=== Deployment Options ==="
echo "1. Deploy using Azure CLI (requires authentication)"
echo "2. Manual deployment instructions"
echo "Please choose an option (1 or 2):"
read -r DEPLOY_OPTION

if [ "$DEPLOY_OPTION" == "1" ]; then
    # Deploy using Azure CLI
    echo "Deploying using Azure CLI..."
    echo "Please enter your Azure Static Web App name:"
    read -r WEBAPP_NAME
    
    echo "Uploading deployment package..."
    az staticwebapp upload --name "$WEBAPP_NAME" --source "${ZIP_FILE}" --verbose
    
    if [ $? -eq 0 ]; then
        echo "Deployment successful!"
    else
        echo "Deployment failed. Please check Azure CLI authentication and permissions."
        echo "You can try manual deployment option instead."
    fi
else
    # Manual deployment instructions
    echo ""
    echo "==== Manual Deployment Instructions ===="
    echo "1. Log in to the Azure Portal: https://portal.azure.com"
    echo "2. Navigate to your Static Web App resource"
    echo "3. In the left menu, select 'Deployments'"
    echo "4. Click on 'Manual Deploy'"
    echo "5. Upload the ZIP file created at: ${ZIP_FILE}"
    echo "6. Wait for the deployment to complete (usually takes a few minutes)"
    echo ""
    echo "After deployment, verify that CSS is loading correctly by:"
    echo "- Checking the network requests in browser dev tools"
    echo "- Confirming TBWA styling (yellow #ffc300 and blue #005bbb) is applied"
    echo ""
fi

echo "==== Deployment process completed ===="