#!/bin/bash

# Deploy CSS Fix for Client360 Dashboard via Azure Storage
# This script deploys the updated staticwebapp.config.json to fix the CSS styling issue
# using Azure Storage as an intermediary

set -e  # Exit immediately if a command exits with a non-zero status

# Parse arguments
STORAGE_ACCOUNT=""
CONTAINER_NAME=""
PACKAGE_PATH=""

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --storage-account)
      STORAGE_ACCOUNT="$2"
      shift 2
      ;;
    --container)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --package)
      PACKAGE_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$STORAGE_ACCOUNT" || -z "$CONTAINER_NAME" || -z "$PACKAGE_PATH" ]]; then
  echo "ERROR: Missing required parameters"
  echo "Usage: $0 --storage-account <account> --container <container> --package <path>"
  exit 1
fi

# Setup logging
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "==== TBWA Client360 Dashboard - CSS Fix Deployment via Azure Storage ===="
echo "Starting deployment process..."
echo "Timestamp: $(date)"
echo "Storage Account: ${STORAGE_ACCOUNT}"
echo "Container: ${CONTAINER_NAME}"
echo "Package: ${PACKAGE_PATH}"

# Verify the deployment package exists
if [ ! -f "${PACKAGE_PATH}" ]; then
    echo "ERROR: Deployment package not found at ${PACKAGE_PATH}"
    exit 1
fi

# Log in to Azure (if not already logged in)
echo "Verifying Azure login..."
az account show &> /dev/null || az login

# Upload to Azure Storage
BLOB_NAME="client360_dashboard_css_fix_${TIMESTAMP}.zip"
echo "Uploading deployment package to Azure Storage..."
az storage blob upload \
    --account-name "${STORAGE_ACCOUNT}" \
    --container-name "${CONTAINER_NAME}" \
    --name "${BLOB_NAME}" \
    --file "${PACKAGE_PATH}" \
    --auth-mode login

# Generate SAS token for the blob
echo "Generating SAS token for the blob..."
END_DATE=$(date -v+1d +%Y-%m-%dT%H:%MZ)

SAS_TOKEN=$(az storage blob generate-sas \
    --account-name "${STORAGE_ACCOUNT}" \
    --container-name "${CONTAINER_NAME}" \
    --name "${BLOB_NAME}" \
    --permissions r \
    --expiry "${END_DATE}" \
    --auth-mode login \
    --output tsv)

BLOB_URL="https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER_NAME}/${BLOB_NAME}?${SAS_TOKEN}"
echo ""
echo "==== DEPLOYMENT URL ===="
echo "${BLOB_URL}"
echo ""

echo "==== Manual Deployment Instructions ===="
echo "1. Log in to the Azure Portal: https://portal.azure.com"
echo "2. Navigate to your Static Web App resource"
echo "3. In the left menu, select 'Deployment Center'"
echo "4. Click on 'Manual Deploy'"
echo "5. Paste the SAS URL above when prompted"
echo "6. Click 'Deploy' and wait for the deployment to complete"
echo ""
echo "==== Deployment process completed ===="
echo "To verify the fix, use the verify_css_fix.sh script after deployment."
echo "Example: ./verify_css_fix.sh https://your-site.azurestaticapps.net"