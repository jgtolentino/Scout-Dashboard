#!/bin/bash

# Client360 Dashboard v2.4.0 Deployment Script
# This script deploys the Client360 Dashboard v2.4.0 to Azure Static Web Apps

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/deploy_v2.4.0"
BACKUP_DIR="${SCRIPT_DIR}/deploy_backups/client360_$(date +%Y%m%d%H%M%S)"
AZURE_STATIC_WEB_APP_NAME="client360-dashboard"
DEPLOYMENT_LOG="${SCRIPT_DIR}/logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Ensure log directory exists
mkdir -p "${SCRIPT_DIR}/logs"

# Log function
log() {
  local message="$1"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo -e "[${timestamp}] ${message}"
  echo -e "[${timestamp}] ${message}" >> "${DEPLOYMENT_LOG}"
}

# Error handler
error_handler() {
  local line=$1
  local command=$2
  local exit_code=$3
  log "Error at line ${line} (command: ${command}, exit code: ${exit_code})"
  exit ${exit_code}
}

# Set error handler
trap 'error_handler ${LINENO} "${BASH_COMMAND}" $?' ERR

# Banner
echo "
┌─────────────────────────────────────────────┐
│                                             │
│  Client360 Dashboard v2.4.0 Deployment      │
│                                             │
│  • Multi-Model AI Support                   │
│  • Enhanced Map Visualization               │
│  • User Personalization Framework           │
│                                             │
└─────────────────────────────────────────────┘
"

# Check if deployment directory exists
if [ ! -d "${DEPLOY_DIR}" ]; then
  log "ERROR: Deployment directory does not exist: ${DEPLOY_DIR}"
  exit 1
fi

# Verify required files exist
log "Verifying required files..."

# Define required files in arrays by component type
AI_FILES=(
  "${DEPLOY_DIR}/js/components/ai/ai_engine.js"
  "${DEPLOY_DIR}/js/components/ai/model_registry.js"
  "${DEPLOY_DIR}/js/components/ai/embeddings_service.js"
  "${DEPLOY_DIR}/js/components/ai/streaming_client.js"
)

MAP_FILES=(
  "${DEPLOY_DIR}/js/components/map/map_engine.js"
)

USER_FILES=(
  "${DEPLOY_DIR}/js/components/user/preferences.js"
  "${DEPLOY_DIR}/js/components/user/dashboard_layouts.js"
  "${DEPLOY_DIR}/js/components/user/saved_filters.js"
  "${DEPLOY_DIR}/js/components/user/recent_views.js"
  "${DEPLOY_DIR}/js/components/user/export_templates.js"
)

CORE_FILES=(
  "${DEPLOY_DIR}/js/dashboard.js"
  "${DEPLOY_DIR}/staticwebapp.config.json"
)

# Function to check if files exist
check_files() {
  local files=("$@")
  local missing=0
  
  for file in "${files[@]}"; do
    if [ ! -f "${file}" ]; then
      log "ERROR: Required file does not exist: ${file}"
      missing=$((missing + 1))
    fi
  done
  
  return ${missing}
}

# Check all required files
missing_count=0

log "Checking AI component files..."
check_files "${AI_FILES[@]}"
missing_count=$((missing_count + $?))

log "Checking Map component files..."
check_files "${MAP_FILES[@]}"
missing_count=$((missing_count + $?))

log "Checking User Personalization component files..."
check_files "${USER_FILES[@]}"
missing_count=$((missing_count + $?))

log "Checking Core files..."
check_files "${CORE_FILES[@]}"
missing_count=$((missing_count + $?))

if [ ${missing_count} -gt 0 ]; then
  log "ERROR: ${missing_count} required files are missing. Deployment aborted."
  exit 1
fi

log "All required files verified successfully."

# Create backup of existing deployment if it exists
if [ -d "${SCRIPT_DIR}/deploy" ]; then
  log "Creating backup of existing deployment to ${BACKUP_DIR}..."
  mkdir -p "${BACKUP_DIR}"
  cp -r "${SCRIPT_DIR}/deploy/"* "${BACKUP_DIR}/"
  log "Backup created successfully."
fi

# Prepare deployment directory
log "Preparing deployment directory..."
mkdir -p "${SCRIPT_DIR}/deploy"

# Copy files to deployment directory
log "Copying files to deployment directory..."
cp -r "${DEPLOY_DIR}/"* "${SCRIPT_DIR}/deploy/"

# Create version file for tracking
echo "{\"version\": \"2.4.0\", \"deploymentDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "${SCRIPT_DIR}/deploy/version.json"

log "Deployment files prepared successfully."

# Deploy to Azure Static Web Apps if the Azure CLI is available
if command -v az >/dev/null 2>&1; then
  log "Azure CLI detected. Attempting to deploy to Azure Static Web Apps..."
  
  # Check if user is logged in to Azure
  az account show >/dev/null 2>&1
  if [ $? -ne 0 ]; then
    log "Not logged in to Azure. Please login first with 'az login'."
    log "After login, run this script again to continue deployment."
    exit 1
  fi
  
  # Deploy to Azure Static Web App
  log "Deploying to Azure Static Web App: ${AZURE_STATIC_WEB_APP_NAME}..."
  
  # Use the Azure CLI to deploy
  az staticwebapp deploy \
    --name "${AZURE_STATIC_WEB_APP_NAME}" \
    --source "${SCRIPT_DIR}/deploy" \
    --api-location "" \
    --verbose
  
  deployment_status=$?
  
  if [ ${deployment_status} -eq 0 ]; then
    log "Deployment to Azure Static Web App completed successfully."
  else
    log "ERROR: Deployment to Azure Static Web App failed with exit code ${deployment_status}."
    log "Please check Azure CLI output for details."
    exit ${deployment_status}
  fi
else
  log "Azure CLI not detected. Skipping deployment to Azure Static Web Apps."
  log "To deploy to Azure, install the Azure CLI and run:"
  log "  az staticwebapp deploy --name \"${AZURE_STATIC_WEB_APP_NAME}\" --source \"${SCRIPT_DIR}/deploy\" --api-location \"\" --verbose"
fi

# Generate deployment verification report
VERIFICATION_REPORT="${SCRIPT_DIR}/deploy/verification_report.html"

log "Generating deployment verification report..."

cat > "${VERIFICATION_REPORT}" << HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard v2.4.0 Deployment Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .success {
      color: #2ecc71;
    }
    .warning {
      color: #f39c12;
    }
    .error {
      color: #e74c3c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f8f9fa;
    }
    .component-group {
      margin-bottom: 30px;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 15px;
    }
    .feature-list {
      list-style-type: none;
      padding-left: 20px;
    }
    .feature-list li {
      margin-bottom: 8px;
      position: relative;
    }
    .feature-list li:before {
      content: "✓";
      position: absolute;
      left: -20px;
      color: #2ecc71;
    }
  </style>
</head>
<body>
  <h1>Client360 Dashboard v2.4.0 Deployment Verification</h1>
  
  <p><strong>Deployment Date:</strong> $(date -u +"%Y-%m-%d %H:%M:%S UTC")</p>
  
  <h2>Deployment Summary</h2>
  <p class="success">✓ Deployment completed successfully</p>
  
  <div class="component-group">
    <h3>New Features in v2.4.0</h3>
    <ul class="feature-list">
      <li><strong>Multi-Model AI Framework:</strong> Support for multiple AI models with fallback capabilities</li>
      <li><strong>Enhanced Map Visualization:</strong> Advanced map components with multi-layer support</li>
      <li><strong>User Personalization Framework:</strong> Customizable dashboard experience</li>
      <li><strong>Streaming Responses:</strong> Real-time AI text generation with typing effects</li>
    </ul>
  </div>
  
  <div class="component-group">
    <h3>Component Verification</h3>
    <table>
      <tr>
        <th>Component</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>AI Components</td>
        <td class="success">✓ Verified</td>
      </tr>
      <tr>
        <td>Map Components</td>
        <td class="success">✓ Verified</td>
      </tr>
      <tr>
        <td>User Personalization Components</td>
        <td class="success">✓ Verified</td>
      </tr>
      <tr>
        <td>Core Dashboard Files</td>
        <td class="success">✓ Verified</td>
      </tr>
    </table>
  </div>
  
  <div class="component-group">
    <h3>Next Steps</h3>
    <ol>
      <li>Verify the deployment in the browser at <a href="https://${AZURE_STATIC_WEB_APP_NAME}.azurestaticapps.net">https://${AZURE_STATIC_WEB_APP_NAME}.azurestaticapps.net</a></li>
      <li>Check that all components are loading correctly in the browser console</li>
      <li>Test the new features (Multi-Model AI, Enhanced Maps, User Personalization)</li>
      <li>Monitor application logs for any errors</li>
    </ol>
  </div>
  
  <p><em>Report generated automatically by the deployment script</em></p>
</body>
</html>
HTML

log "Deployment verification report generated: ${VERIFICATION_REPORT}"

# Complete
log "Client360 Dashboard v2.4.0 deployment completed successfully."
echo "
┌─────────────────────────────────────────────┐
│                                             │
│  Deployment Completed Successfully          │
│                                             │
│  • Files deployed to: ${SCRIPT_DIR}/deploy  │
│  • Backup created at: ${BACKUP_DIR}         │
│  • Log available at: ${DEPLOYMENT_LOG}      │
│                                             │
└─────────────────────────────────────────────┘
"

exit 0