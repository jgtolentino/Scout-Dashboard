#!/bin/bash

# Manual deployment for CSS Fix for Client360 Dashboard
# This script prepares the package and gives manual steps

set -e  # Exit immediately if a command exits with a non-zero status

# Setup logging
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/deploy_manual_${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "==== TBWA Client360 Dashboard - CSS Fix Manual Deployment ===="
echo "Starting deployment process..."
echo "Timestamp: $(date)"

# Get the ZIP file from argument or use default
ZIP_FILE="$1"
if [[ -z "$ZIP_FILE" ]]; then
    # Default package location
    OUTPUT_DIR="output"
    ZIP_FILE="${OUTPUT_DIR}/client360_dashboard_css_fix.zip"
    
    # Verify the deployment package exists or create it
    if [ ! -f "${ZIP_FILE}" ]; then
        echo "Deployment package not found! Creating now..."
        
        # Directories
        DEPLOY_DIR="deploy"
        
        # Create backup directory
        BACKUP_DIR="deploy_css_fix_backup_${TIMESTAMP}"
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
    fi
fi

# Verify the package exists
if [ ! -f "${ZIP_FILE}" ]; then
    echo "ERROR: Deployment package not found at: ${ZIP_FILE}"
    exit 1
fi

# Display deployment instructions
echo ""
echo "==== Manual Deployment Steps ===="
echo "Package ready at: $(realpath "${ZIP_FILE}")"
echo ""
echo "Please deploy manually using the following steps:"
echo ""
echo "1. Log in to the Azure Portal: https://portal.azure.com"
echo "2. Navigate to your Static Web App resource: tbwa-client360-dashboard-production"
echo "3. In the left menu, select 'Deployment Center' → 'Manual Deploy'"
echo "4. Select 'Upload' and browse to the following file:"
echo "   $(realpath "${ZIP_FILE}")"
echo "5. Click 'Deploy' and wait for the deployment to complete (look for the green check mark)"
echo ""
echo "After deployment is complete, verify the fix using the verify_css_fix.sh script:"
echo "./verify_css_fix.sh https://blue-coast-0acb6880f.6.azurestaticapps.net"
echo ""
echo "==== Deployment preparation completed ===="