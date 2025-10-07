#!/bin/bash

# Client360 Dashboard v2.4.0 Verification Script
# This script verifies the Client360 Dashboard v2.4.0 deployment

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/deploy_v2.4.0"
VERIFICATION_LOG="${SCRIPT_DIR}/logs/verification_$(date +%Y%m%d_%H%M%S).log"

# Ensure log directory exists
mkdir -p "${SCRIPT_DIR}/logs"

# Log function
log() {
  local message="$1"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo -e "[${timestamp}] ${message}"
  echo -e "[${timestamp}] ${message}" >> "${VERIFICATION_LOG}"
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
│  Client360 Dashboard v2.4.0 Verification    │
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
    else
      log "File verified: ${file}"
    fi
  done
  
  return ${missing}
}

# Function to check file content for version references
check_version_references() {
  local file="$1"
  local version="$2"
  
  log "Checking version references in ${file}..."
  
  if [ ! -f "${file}" ]; then
    log "ERROR: File does not exist: ${file}"
    return 1
  fi
  
  if grep -q "${version}" "${file}"; then
    log "Version reference found in ${file}"
    return 0
  else
    log "WARNING: No version reference found in ${file}"
    return 0  # Not a critical error, just a warning
  fi
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
  log "ERROR: ${missing_count} required files are missing."
  log "Verification failed."
  exit 1
fi

log "All required files verified successfully."

# Verify version references in key files
VERSION="2.4.0"
check_version_references "${DEPLOY_DIR}/js/dashboard.js" "${VERSION}"
check_version_references "${DEPLOY_DIR}/staticwebapp.config.json" "${VERSION}"

# Check file permissions
log "Checking file permissions..."
if [ ! -x "${SCRIPT_DIR}/deploy_v2.4.0.sh" ]; then
  log "WARNING: Deployment script is not executable: ${SCRIPT_DIR}/deploy_v2.4.0.sh"
  log "You may want to run: chmod +x ${SCRIPT_DIR}/deploy_v2.4.0.sh"
else
  log "Deployment script permissions verified: ${SCRIPT_DIR}/deploy_v2.4.0.sh"
fi

# Perform a simple static analysis on JavaScript files
log "Performing static analysis on JavaScript files..."

# Function to check JavaScript syntax
check_js_syntax() {
  local file="$1"
  
  if [ ! -f "${file}" ]; then
    log "ERROR: File does not exist: ${file}"
    return 1
  }
  
  # Check for missing semicolons at end of lines
  missing_semicolons=$(grep -n "^\s*\w.*[^;{}\[\])]$" "${file}" | wc -l)
  if [ ${missing_semicolons} -gt 0 ]; then
    log "WARNING: Potential missing semicolons in ${file}: ${missing_semicolons} lines"
  fi
  
  # Check for console.log statements (these should be removed in production)
  console_logs=$(grep -n "console\.log" "${file}" | wc -l)
  if [ ${console_logs} -gt 0 ]; then
    log "WARNING: Found ${console_logs} console.log statements in ${file}"
  fi
  
  return 0
}

# Check syntax of main dashboard file
check_js_syntax "${DEPLOY_DIR}/js/dashboard.js"

# Generate verification report
VERIFICATION_REPORT="${SCRIPT_DIR}/verification_report_$(date +%Y%m%d_%H%M%S).html"

log "Generating verification report: ${VERIFICATION_REPORT}"

cat > "${VERIFICATION_REPORT}" << HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard v2.4.0 Verification Report</title>
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
  </style>
</head>
<body>
  <h1>Client360 Dashboard v2.4.0 Verification Report</h1>
  
  <p><strong>Verification Date:</strong> $(date -u +"%Y-%m-%d %H:%M:%S UTC")</p>
  
  <h2>Verification Summary</h2>
  <p class="success">✓ All required files verified</p>
  
  <div class="component-group">
    <h3>Component Verification</h3>
    <table>
      <tr>
        <th>Component</th>
        <th>Files</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>AI Components</td>
        <td>${#AI_FILES[@]}</td>
        <td class="success">✓ Verified</td>
      </tr>
      <tr>
        <td>Map Components</td>
        <td>${#MAP_FILES[@]}</td>
        <td class="success">✓ Verified</td>
      </tr>
      <tr>
        <td>User Personalization Components</td>
        <td>${#USER_FILES[@]}</td>
        <td class="success">✓ Verified</td>
      </tr>
      <tr>
        <td>Core Dashboard Files</td>
        <td>${#CORE_FILES[@]}</td>
        <td class="success">✓ Verified</td>
      </tr>
    </table>
  </div>
  
  <div class="component-group">
    <h3>Deployment Readiness</h3>
    <p>The Client360 Dashboard v2.4.0 is ready for deployment.</p>
    <p>To deploy, run:</p>
    <pre>./deploy_v2.4.0.sh</pre>
  </div>
  
  <p><em>Report generated automatically by the verification script</em></p>
</body>
</html>
HTML

log "Verification report generated: ${VERIFICATION_REPORT}"

# Complete
log "Client360 Dashboard v2.4.0 verification completed successfully."
echo "
┌─────────────────────────────────────────────┐
│                                             │
│  Verification Completed Successfully        │
│                                             │
│  • All required files verified              │
│  • Report generated: ${VERIFICATION_REPORT} │
│  • Log available at: ${VERIFICATION_LOG}    │
│                                             │
└─────────────────────────────────────────────┘
"

exit 0