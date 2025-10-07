#!/bin/bash
set -e

# This script prepares the deployment package and outputs a ZIP file
# for manual deployment to Azure

# Set up directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
OUTPUT_DIR="$SCRIPT_DIR/deploy-output"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Clean up previous output directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/frontend"
mkdir -p "$OUTPUT_DIR/backend"

# Build frontend
echo "Building frontend..."
cd "$FRONTEND_DIR"
npm run build
cp -r dist/* "$OUTPUT_DIR/frontend/"
cp "$SCRIPT_DIR/staticwebapp.config.json" "$OUTPUT_DIR/frontend/"

# Prepare backend
echo "Preparing backend..."
cd "$BACKEND_DIR"
cp -r * "$OUTPUT_DIR/backend/"
cp .env.azure "$OUTPUT_DIR/backend/.env"

# Create ZIP archives
echo "Creating deployment packages..."
cd "$OUTPUT_DIR"
zip -r frontend-deploy.zip frontend/
zip -r backend-deploy.zip backend/

echo "====================================="
echo "Deployment packages are ready!"
echo "====================================="
echo "Frontend package: $OUTPUT_DIR/frontend-deploy.zip"
echo "Backend package: $OUTPUT_DIR/backend-deploy.zip"
echo ""
echo "To deploy manually:"
echo "1. Create an Azure Static Web App and upload frontend-deploy.zip"
echo "2. Create an Azure App Service and upload backend-deploy.zip"
echo "3. Configure the frontend to use the backend API URL"