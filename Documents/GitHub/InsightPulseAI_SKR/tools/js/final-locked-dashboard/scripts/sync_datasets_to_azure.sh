#!/bin/bash
# Scout Edge Dataset Exporter and Azure Blob Sync
# This script exports datasets to JSON and uploads them to Azure Blob Storage

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
LOG_FILE="${SCRIPT_DIR}/../logs/dataset_sync_$(date +%Y%m%d_%H%M%S).log"
DATASETS="geo_brand_mentions,geo_sales_volume,geo_store_density,geo_combo_frequency,top_brands"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  local message="$(date +"%Y-%m-%d %H:%M:%S") - $1"
  echo "$message" | tee -a "$LOG_FILE"
}

# Check if we're running in a CI/CD environment
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  log "Running in CI/CD environment"
  # Use environment variables for credentials
  sed -i "s/##DB_PASSWORD##/$DB_PASSWORD/g" "$CONFIG_FILE"
  sed -i "s|##AZURE_STORAGE_CONNECTION_STRING##|$AZURE_STORAGE_CONNECTION_STRING|g" "$CONFIG_FILE"
else
  log "Running in local environment"
  # Use Azure CLI for authentication
  if command -v az >/dev/null 2>&1; then
    # Check if logged in
    if ! az account show >/dev/null 2>&1; then
      log "Logging in to Azure..."
      az login --allow-no-subscriptions
    fi
    
    # Get storage account key
    STORAGE_ACCOUNT="scoutedgedata"
    RESOURCE_GROUP="project-scout-resources"
    ACCOUNT_KEY=$(az storage account keys list --account-name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --query '[0].value' -o tsv)
    CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=${STORAGE_ACCOUNT};AccountKey=${ACCOUNT_KEY};EndpointSuffix=core.windows.net"
    
    # Update config
    sed -i "s|##AZURE_STORAGE_CONNECTION_STRING##|${CONNECTION_STRING}|g" "$CONFIG_FILE"
    
    # Check for KeyVault for DB password
    if [ -n "$DB_PASSWORD_SECRET" ]; then
      log "Retrieving database password from KeyVault..."
      DB_PASSWORD=$(az keyvault secret show --name "$DB_PASSWORD_SECRET" --vault-name "scout-edge-vault" --query 'value' -o tsv)
      sed -i "s/##DB_PASSWORD##/$DB_PASSWORD/g" "$CONFIG_FILE"
    else
      log "Please set DB_PASSWORD in the configuration file"
    fi
  else
    log "Azure CLI not found. Please install it or set credentials manually."
    exit 1
  fi
fi

# Check for Python
if ! command -v python >/dev/null 2>&1; then
  log "Error: Python not found. Please install Python 3.x."
  exit 1
fi

# Check for required Python packages
REQUIRED_PACKAGES="pyodbc pandas numpy azure-storage-blob"
MISSING_PACKAGES=""

for package in $REQUIRED_PACKAGES; do
  if ! python -c "import $package" >/dev/null 2>&1; then
    MISSING_PACKAGES="$MISSING_PACKAGES $package"
  fi
done

if [ -n "$MISSING_PACKAGES" ]; then
  log "Installing missing Python packages:$MISSING_PACKAGES"
  pip install $MISSING_PACKAGES
fi

# Run the export script
log "Starting dataset export process..."

if [ "$1" == "--simulate" ]; then
  log "Generating simulated data..."
  python "${SCRIPT_DIR}/export_datasets_to_json.py" --config "$CONFIG_FILE" --datasets "$DATASETS" --upload --simulate
else
  log "Exporting data from database..."
  python "${SCRIPT_DIR}/export_datasets_to_json.py" --config "$CONFIG_FILE" --datasets "$DATASETS" --upload
fi

if [ $? -ne 0 ]; then
  log "Error: Dataset export failed. Check the log for details."
  exit 1
fi

log "Dataset export and upload completed successfully."

# Set cache headers on Azure Blob Storage
if command -v az >/dev/null 2>&1; then
  log "Setting cache headers on blob files..."
  
  CONTAINER="scout-edge-data"
  
  for dataset in ${DATASETS//,/ }; do
    BLOB_PATH="data/simulated/${dataset}.json"
    
    az storage blob update \
      --account-name "$STORAGE_ACCOUNT" \
      --container-name "$CONTAINER" \
      --name "$BLOB_PATH" \
      --content-cache-control "public, max-age=3600" \
      --content-type "application/json" \
      --content-encoding "gzip" \
      --output none
      
    if [ $? -eq 0 ]; then
      log "Set cache headers for $BLOB_PATH"
    else
      log "Failed to set cache headers for $BLOB_PATH"
    fi
  done
fi

log "Sync process completed."
exit 0