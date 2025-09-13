#!/bin/bash
# Deploy static dashboard to Azure Static Web Apps
# Usage: ./deploy_static_dashboard.sh [environment]

# Exit on errors
set -e

# Script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default to production environment
ENVIRONMENT=${1:-production}
ENV_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    echo "Run setup_env_variables.sh first to create it"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Change to project directory
cd "$PROJECT_ROOT"

# Make sure we have the required Azure CLI extensions
echo "Checking Azure CLI extensions..."
az extension add --name static-web-apps --upgrade --yes || true

# Log file for deployment
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deployment_${TIMESTAMP}.log"

# Make sure logs directory exists
mkdir -p logs

# Start log entry
echo "=== Static Dashboard Deployment Started at $(date) ===" > "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"

# Step 1: Run the export script to generate fresh data
echo "Running metrics export script..." | tee -a "$LOG_FILE"
npm run export:metrics >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Export script failed" | tee -a "$LOG_FILE"
    exit 1
fi

# Step 2: Build the dashboard app (if needed)
if [ -f "package.json" ] && grep -q "\"build\"" "package.json"; then
    echo "Building the dashboard app..." | tee -a "$LOG_FILE"
    npm run build >> "$LOG_FILE" 2>&1
fi

# Step 3: Deploy to Azure Static Web Apps
echo "Deploying to Azure Static Web Apps..." | tee -a "$LOG_FILE"

# Check if SWA CLI is installed, install if needed
if ! command -v swa &> /dev/null; then
    echo "Installing Azure Static Web Apps CLI..." | tee -a "$LOG_FILE"
    npm install -g @azure/static-web-apps-cli
fi

# Deploy using the SWA CLI
SWA_NAME=${SWA_NAME:-"your-static-webapp-name"}
RESOURCE_GROUP=${RESOURCE_GROUP:-"your-resource-group"}

# Check if we're deploying with SWA CLI or Az CLI
if [ -n "$SWA_DEPLOYMENT_TOKEN" ]; then
    echo "Deploying with SWA CLI..." | tee -a "$LOG_FILE"
    swa deploy ./deploy --env production --deployment-token "$SWA_DEPLOYMENT_TOKEN" >> "$LOG_FILE" 2>&1
else
    echo "Deploying with Azure CLI..." | tee -a "$LOG_FILE"
    az staticwebapp deploy \
        --name "$SWA_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source ./deploy >> "$LOG_FILE" 2>&1
fi

# Check deployment result
if [ $? -eq 0 ]; then
    echo "Deployment completed successfully!" | tee -a "$LOG_FILE"
    # Get the URL of the static web app
    if [ -n "$SWA_NAME" ] && [ -n "$RESOURCE_GROUP" ]; then
        SWA_URL=$(az staticwebapp show --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)
        echo "Dashboard is available at: https://${SWA_URL}" | tee -a "$LOG_FILE"
    fi
else
    echo "Deployment failed. Check the log file for details: $LOG_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# Finish log
echo "=== Static Dashboard Deployment Completed at $(date) ===" >> "$LOG_FILE"
echo "Done!"