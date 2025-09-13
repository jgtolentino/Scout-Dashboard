#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="ui-genie-rg"
LOCATION="eastus2"
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"  # Active subscription

# Current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "======================================"
echo "UI-Genie Deployment Script"
echo "======================================"
echo ""

# Create resource group
echo "Step 1: Creating resource group..."
./deploy.sh

# Deploy backend API
echo ""
echo "Step 2: Setting up backend API..."
./setup-api-backend.sh

# Verify deployment
echo ""
echo "======================================"
echo "Deployment completed successfully!"
echo "======================================"
echo ""
echo "Frontend: https://ui-genie-app.azurestaticapps.net"
echo "Backend API: https://ui-genie-api.azurewebsites.net"
echo ""
echo "To add a custom domain, run:"
echo "./add-custom-domain.sh"
echo ""
echo "To purge the CDN cache, run:"
echo "./purge-cdn.sh"