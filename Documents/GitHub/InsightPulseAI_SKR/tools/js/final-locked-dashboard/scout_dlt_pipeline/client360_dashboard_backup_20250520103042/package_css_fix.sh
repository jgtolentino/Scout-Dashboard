#!/bin/bash

# Package CSS Fix for Client360 Dashboard
# Creates a ZIP package of the fixed dashboard files

set -e  # Exit immediately if a command exits with a non-zero status

# Setup logging
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/package_${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "==== TBWA Client360 Dashboard - CSS Fix Packaging ===="
echo "Starting packaging process..."
echo "Timestamp: $(date)"

# Directories and files
DEPLOY_DIR="deploy"
OUTPUT_DIR="output"
ZIP_FILE="${OUTPUT_DIR}/client360_dashboard_css_fix.zip"

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

if [ $? -eq 0 ]; then
    echo "Deployment package created successfully at ${ZIP_FILE}"
    
    # Verify the package
    echo "Verifying package integrity..."
    unzip -t "${ZIP_FILE}" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Package verification passed!"
        echo "Package size: $(du -h "${ZIP_FILE}" | cut -f1)"
        echo "Files in package: $(unzip -l "${ZIP_FILE}" | tail -1 | awk '{print $2}')"
        echo ""
        echo "You can now deploy this package using:"
        echo "./deploy_via_storage.sh \\"
        echo "  --storage-account \$AZ_STORAGE_ACCOUNT \\"
        echo "  --container \$AZ_STORAGE_CONTAINER \\"
        echo "  --package ${ZIP_FILE}"
    else
        echo "❌ Package verification failed!"
        exit 1
    fi
else
    echo "❌ Package creation failed!"
    exit 1
fi