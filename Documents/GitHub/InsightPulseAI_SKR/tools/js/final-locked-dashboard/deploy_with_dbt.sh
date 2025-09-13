#!/bin/bash
# One-click deployment script for Scout Edge dashboard with dbt integration
# This script initializes the dbt project, generates sample data, and deploys to Azure

set -e

# Directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Parse command line arguments
SAMPLE_DATA=true
RESOURCE_GROUP=""
STORAGE_ACCOUNT=""
CONTAINER_NAME="data"
STATIC_WEBAPP_NAME=""
SETUP_SKR=false
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --live-data)
      SAMPLE_DATA=false
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
    --setup-skr)
      SETUP_SKR=true
      shift
      ;;
    --environment=*)
      ENVIRONMENT="${1#*=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --live-data           Use live data from database instead of sample data"
      echo "  --resource-group=RG   Azure Resource Group for the static web app"
      echo "  --storage-account=SA  Azure Storage Account name"
      echo "  --container=CONT      Azure Blob Container name (default: data)"
      echo "  --static-webapp=SWA   Azure Static Web App name"
      echo "  --setup-skr           Set up SKR integration for dbt metadata"
      echo "  --environment=ENV     Deployment environment (default: production)"
      echo "  --help                Show this help message"
      echo ""
      echo "Example:"
      echo "  $0 --resource-group=scout-edge-rg --storage-account=scoutedgestorage --static-webapp=scout-edge-app --setup-skr"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "=== Scout Edge Dashboard Deployment with dbt Integration ==="
echo "Sample data: $SAMPLE_DATA"
echo "Azure Resource Group: $RESOURCE_GROUP"
echo "Azure Storage Account: $STORAGE_ACCOUNT"
echo "Azure Blob Container: $CONTAINER_NAME"
echo "Static Web App: $STATIC_WEBAPP_NAME"
echo "Setup SKR: $SETUP_SKR"
echo "Environment: $ENVIRONMENT"
echo ""

# Check for required directories
if [ ! -d "dbt_project" ]; then
  echo "Error: dbt_project directory not found"
  exit 1
fi

# Ensure scripts are executable
chmod +x dbt_project/run_and_export.sh
chmod +x dbt_project/init_with_sample_data.sh
chmod +x dbt_project/scripts/deploy_dbt_exports.sh
chmod +x dbt_project/scripts/setup_skr_integration.sh
chmod +x dbt_project/scripts/monitor_freshness.py

# Step 1: Initialize dbt project with sample data
echo "=== Step 1: Initializing dbt project ==="
cd dbt_project
./init_with_sample_data.sh
cd "$SCRIPT_DIR"

# Step 2: Set up SKR integration if requested
if [ "$SETUP_SKR" = true ]; then
  echo "=== Step 2: Setting up SKR integration ==="
  cd dbt_project
  ./scripts/setup_skr_integration.sh
  cd "$SCRIPT_DIR"
fi

# Step 3: Create necessary directories for assets
echo "=== Step 3: Creating asset directories ==="
mkdir -p assets/data
mkdir -p js

# Step 4: Deploy dbt data
echo "=== Step 4: Deploying dbt data ==="
DEPLOY_CMD="cd dbt_project && ./scripts/deploy_dbt_exports.sh"

if [ "$SAMPLE_DATA" = true ]; then
  DEPLOY_CMD="$DEPLOY_CMD --sample"
fi

if [ -n "$RESOURCE_GROUP" ]; then
  DEPLOY_CMD="$DEPLOY_CMD --resource-group=$RESOURCE_GROUP"
fi

if [ -n "$STORAGE_ACCOUNT" ]; then
  DEPLOY_CMD="$DEPLOY_CMD --storage-account=$STORAGE_ACCOUNT"
fi

if [ -n "$CONTAINER_NAME" ]; then
  DEPLOY_CMD="$DEPLOY_CMD --container=$CONTAINER_NAME"
fi

if [ -n "$STATIC_WEBAPP_NAME" ]; then
  DEPLOY_CMD="$DEPLOY_CMD --static-webapp=$STATIC_WEBAPP_NAME"
fi

if [ -n "$ENVIRONMENT" ]; then
  DEPLOY_CMD="$DEPLOY_CMD --environment=$ENVIRONMENT"
fi

eval "$DEPLOY_CMD"

# Step 5: Monitor data freshness
echo "=== Step 5: Monitoring data freshness ==="
python3 dbt_project/scripts/monitor_freshness.py

# Step 6: Verify deployment
echo "=== Step 6: Verifying deployment ==="

# Check if metadata.json exists
if [ -f "assets/data/metadata.json" ]; then
  echo "✅ Metadata file created successfully"
else
  echo "❌ Metadata file not found"
fi

# Check if other JSON files exist
JSON_COUNT=$(find "assets/data" -name "*.json" | wc -l)
if [ "$JSON_COUNT" -gt 1 ]; then
  echo "✅ Found $JSON_COUNT JSON data files"
else
  echo "❌ Expected multiple JSON data files, but found $JSON_COUNT"
fi

# Check if dashboard integration files exist
if [ -f "js/data_freshness_badge.js" ] && [ -f "js/data_source_toggle.js" ]; then
  echo "✅ Dashboard integration components are present"
else
  echo "❌ Some dashboard integration components are missing"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""

if [ -n "$STATIC_WEBAPP_NAME" ] && [ -n "$RESOURCE_GROUP" ]; then
  # Get the static web app URL
  WEBAPP_URL=$(az staticwebapp show \
    --name "$STATIC_WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" \
    --output tsv 2>/dev/null)
    
  if [ -n "$WEBAPP_URL" ]; then
    echo "Your dashboard is available at: https://$WEBAPP_URL"
  fi
fi

echo ""
echo "Next steps:"
echo "1. Add the dashboard components to your HTML:"
echo "   - <script src=\"./js/data_source_toggle.js\"></script>"
echo "   - <script src=\"./js/data_freshness_badge.js\"></script>"
echo "2. Initialize the components in your JavaScript:"
echo "   - const dataSourceToggle = new DataSourceToggle();"
echo "   - const freshnessBadge = new DataFreshnessBadge();"
echo "3. Connect them to your dashboard with the MedallionDataConnector"
echo ""
echo "For more information, see the documentation in README_SQL_QUERIES.md"

# Make script executable
chmod +x "$0"