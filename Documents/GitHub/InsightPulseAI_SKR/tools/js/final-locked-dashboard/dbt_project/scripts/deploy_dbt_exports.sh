#!/bin/bash
# Script to deploy dbt model exports to Azure Static Web App
# This script automates the process of:
# 1. Running dbt models
# 2. Exporting data to JSON
# 3. Uploading to Azure Blob Storage
# 4. Triggering a Static Web App rebuild

set -e

# Directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
DASHBOARD_DIR="$( cd "$PROJECT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

# Parse command line arguments
SAMPLE_DATA=false
DAYS=30
RESOURCE_GROUP=""
STORAGE_ACCOUNT=""
CONTAINER_NAME="data"
STATIC_WEBAPP_NAME=""
ENVIRONMENT="production"
REBUILD_WEBAPP=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sample)
      SAMPLE_DATA=true
      shift
      ;;
    --days=*)
      DAYS="${1#*=}"
      shift
      ;;
    --resource-group=*)
      RESOURCE_GROUP="${1#*=}"
      shift
      ;;
    --storage-account=*)
      STORAGE_ACCOUNT="${1#*=}"
      shift
      ;;
    --container=*)
      CONTAINER_NAME="${1#*=}"
      shift
      ;;
    --static-webapp=*)
      STATIC_WEBAPP_NAME="${1#*=}"
      shift
      ;;
    --environment=*)
      ENVIRONMENT="${1#*=}"
      shift
      ;;
    --no-rebuild)
      REBUILD_WEBAPP=false
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --sample              Generate sample data instead of using real database"
      echo "  --days=DAYS           Number of days of data to include (default: 30)"
      echo "  --resource-group=RG   Azure Resource Group for the static web app"
      echo "  --storage-account=SA  Azure Storage Account name"
      echo "  --container=CONT      Azure Blob Container name (default: data)"
      echo "  --static-webapp=SWA   Azure Static Web App name"
      echo "  --environment=ENV     Deployment environment (default: production)"
      echo "  --no-rebuild          Skip the static web app rebuild step"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "=== Scout Edge dbt Deployment ==="
echo "Sample data: $SAMPLE_DATA"
echo "Days: $DAYS"
echo "Azure Storage Account: $STORAGE_ACCOUNT"
echo "Azure Blob Container: $CONTAINER_NAME"
echo "Static Web App: $STATIC_WEBAPP_NAME"
echo "Environment: $ENVIRONMENT"
echo "Rebuild Web App: $REBUILD_WEBAPP"
echo ""

# Check for required Azure CLI
if ! command -v az &> /dev/null; then
  echo "Error: Azure CLI (az) is required but not installed"
  echo "Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check Azure CLI login status
echo "Checking Azure CLI login status..."
ACCOUNT_JSON=$(az account show 2>/dev/null || echo "")
if [ -z "$ACCOUNT_JSON" ]; then
  echo "Not logged in to Azure CLI. Please run 'az login' first."
  exit 1
fi

# Step 1: Run dbt models and export data
echo "=== Running dbt models and exporting data ==="
if [ "$SAMPLE_DATA" = true ]; then
  ./run_and_export.sh --sample --days="$DAYS"
else
  ./run_and_export.sh --days="$DAYS"
fi

# Make sure the data directory exists
DATA_DIR="$DASHBOARD_DIR/assets/data"
if [ ! -d "$DATA_DIR" ]; then
  echo "Error: Data directory not found at $DATA_DIR"
  exit 1
fi

# Check that data files exist
JSON_FILES=$(find "$DATA_DIR" -name "*.json" | wc -l)
if [ "$JSON_FILES" -eq 0 ]; then
  echo "Error: No JSON files found in $DATA_DIR"
  exit 1
fi

# Step 2: Upload to Azure Blob Storage (if storage account provided)
if [ -n "$STORAGE_ACCOUNT" ]; then
  echo "=== Uploading data to Azure Blob Storage ==="
  
  # Create container if it doesn't exist
  echo "Checking if container '$CONTAINER_NAME' exists..."
  CONTAINER_EXISTS=$(az storage container exists --account-name "$STORAGE_ACCOUNT" --name "$CONTAINER_NAME" --query "exists" -o tsv 2>/dev/null || echo "false")
  
  if [ "$CONTAINER_EXISTS" = "false" ]; then
    echo "Creating container '$CONTAINER_NAME'..."
    az storage container create --account-name "$STORAGE_ACCOUNT" --name "$CONTAINER_NAME" --public-access blob
  fi
  
  echo "Uploading files to blob storage..."
  az storage blob upload-batch \
    --account-name "$STORAGE_ACCOUNT" \
    --destination "$CONTAINER_NAME" \
    --source "$DATA_DIR" \
    --content-cache-control "max-age=3600" \
    --overwrite true
    
  echo "Files uploaded to Azure Blob Storage"
  
  # Generate SAS token for the dashboard
  END_DATE=$(date -v+1d +%Y-%m-%d)  # 1 day from now
  SAS_TOKEN=$(az storage container generate-sas \
    --account-name "$STORAGE_ACCOUNT" \
    --name "$CONTAINER_NAME" \
    --permissions r \
    --expiry "$END_DATE" \
    --output tsv)
    
  echo "Generated SAS token for dashboard access"
  
  # Save the Blob Storage configuration
  BLOB_CONFIG_FILE="$DASHBOARD_DIR/js/blob_storage_config.js"
  echo "Saving Blob Storage configuration to $BLOB_CONFIG_FILE..."
  
  cat > "$BLOB_CONFIG_FILE" << EOF
/**
 * Azure Blob Storage configuration for Scout Edge Dashboard
 * Auto-generated by deploy_dbt_exports.sh on $(date)
 */
window.SCOUT_EDGE_BLOB_CONFIG = {
  storageAccount: '$STORAGE_ACCOUNT',
  containerName: '$CONTAINER_NAME',
  sasToken: '$SAS_TOKEN',
  baseUrl: 'https://$STORAGE_ACCOUNT.blob.core.windows.net/$CONTAINER_NAME'
};
EOF

  echo "Blob Storage configuration saved"
fi

# Step 3: Trigger Static Web App rebuild (if static web app name provided)
if [ "$REBUILD_WEBAPP" = true ] && [ -n "$STATIC_WEBAPP_NAME" ] && [ -n "$RESOURCE_GROUP" ]; then
  echo "=== Triggering Azure Static Web App rebuild ==="
  
  # Get the Static Web App resource ID
  STATIC_WEBAPP_ID=$(az staticwebapp show \
    --name "$STATIC_WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "id" \
    --output tsv)
    
  if [ -z "$STATIC_WEBAPP_ID" ]; then
    echo "Error: Could not find Static Web App '$STATIC_WEBAPP_NAME' in Resource Group '$RESOURCE_GROUP'"
    exit 1
  fi
  
  # Trigger a rebuild
  echo "Triggering rebuild for environment '$ENVIRONMENT'..."
  az staticwebapp rebuild \
    --name "$STATIC_WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT"
    
  echo "Static Web App rebuild triggered"
fi

echo ""
echo "=== Deployment Complete ==="
if [ -n "$STORAGE_ACCOUNT" ]; then
  echo "Data files available at: https://$STORAGE_ACCOUNT.blob.core.windows.net/$CONTAINER_NAME"
fi
echo "JSON files in local directory: $DATA_DIR"
echo ""
echo "Next steps:"
echo "1. Check the quality of your exported data files"
echo "2. Verify that the dashboard is loading the data correctly"
echo "3. Update your documentation if you've made any changes to the models"