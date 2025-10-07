#!/bin/bash
# Deploy dashboard to Azure Static Web App using Azure CLI
# Usage: ./deploy_to_azure.sh [resource-group-name]

# Set variables
RESOURCE_GROUP=${1:-"Juicer-ResourceGroup"}
STATIC_WEB_APP="gentle-rock-04e54f40f"
SOURCE_DIR="../dashboards"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
  echo "❌ Azure CLI is not installed. Please install it first."
  echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Not logged in to Azure. Logging in..."
  az login
  if [ $? -ne 0 ]; then
    echo "❌ Failed to log in to Azure. Exiting."
    exit 1
  fi
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Source directory '$SOURCE_DIR' not found."
  exit 1
fi

# Check if the dashboard files exist
if [ ! -f "$SOURCE_DIR/insights_dashboard.html" ]; then
  echo "❌ Dashboard HTML file not found in '$SOURCE_DIR'."
  exit 1
fi

if [ ! -f "$SOURCE_DIR/staticwebapp.config.json" ]; then
  echo "⚠️ staticwebapp.config.json not found. This might affect routing."
fi

# Confirm deployment
echo "🔍 About to deploy files from '$SOURCE_DIR' to Azure Static Web App '$STATIC_WEB_APP'"
echo "📁 Files to be deployed:"
find "$SOURCE_DIR" -type f | sort

# When running non-interactively (e.g. from Claude), proceed automatically
if [ -n "$CLAUDE_CONTEXT" ] || [ -t 0 ]; then
  echo "Running in non-interactive mode, proceeding with deployment..."
  CONFIRM="y"
else
  read -p "Continue with deployment? (y/N) " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Deployment cancelled."
    exit 0
  fi
fi

# Deploy to Azure Static Web App
echo "📤 Deploying to Azure Static Web App..."
az staticwebapp upload \
  --name "$STATIC_WEB_APP" \
  --source "$SOURCE_DIR" \
  --output-location "." \
  --resource-group "$RESOURCE_GROUP" \
  --verbose

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  echo "🌐 Your dashboard should now be available at: https://$STATIC_WEB_APP.6.azurestaticapps.net/"
  echo "🌐 Direct link: https://$STATIC_WEB_APP.6.azurestaticapps.net/insights_dashboard.html"
else
  echo "❌ Deployment failed. Check the error messages above."
fi