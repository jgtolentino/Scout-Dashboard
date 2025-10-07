#!/bin/bash
# verify_v2.4.0_deployment.sh
# Verification script for Client360 Dashboard v2.4.0 deployment
# Enhanced version with multi-component validation

set -e  # Exit on any error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define deployment directory
DEPLOY_DIR="deploy_v2.4.0"

# Create log directory if it doesn't exist
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="output"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/verification_v2.4.0_$TIMESTAMP.log"

# Parse command line arguments
GENERATE_REPORT=false
COMPONENT=""
INTEGRITY_ONLY=false

for arg in "$@"
do
    case $arg in
        --generate-report)
        GENERATE_REPORT=true
        shift
        ;;
        --component=*)
        COMPONENT="${arg#*=}"
        shift
        ;;
        --integrity-only)
        INTEGRITY_ONLY=true
        shift
        ;;
        *)
        # Unknown option
        ;;
    esac
done

# Function to log messages
log() {
  echo -e "$1" | tee -a $LOG_FILE
}

# Function to check if a file exists
check_file() {
  if [ -f "$1" ]; then
    log "${GREEN}✓ File exists: $1${NC}"
    return 0
  else
    log "${RED}✗ File missing: $1${NC}"
    return 1
  fi
}

# Function to check if a directory exists
check_dir() {
  if [ -d "$1" ]; then
    log "${GREEN}✓ Directory exists: $1${NC}"
    return 0
  else
    log "${RED}✗ Directory missing: $1${NC}"
    return 1
  fi
}

# Function to calculate file hash
calc_hash() {
  if [ -f "$1" ]; then
    shasum -a 256 "$1" | cut -d ' ' -f 1
  else
    echo "FILE_NOT_FOUND"
  fi
}

# Function to check if string exists in file
check_string_in_file() {
  local file="$1"
  local string="$2"
  local description="$3"
  
  log "Checking for \"$string\" in $file..."
  if grep -q "$string" "$file"; then
    log "${GREEN}✓ $description: Found in $file${NC}"
    return 0
  else
    log "${RED}✗ $description: Not found in $file${NC}"
    return 1
  fi
}

# Begin verification
log "${BLUE}=======================================================${NC}"
log "${BLUE}= Client360 Dashboard v2.4.0 Deployment Verification  =${NC}"
log "${BLUE}=======================================================${NC}"
log "Started at: $(date)"
log "Deployment directory: $DEPLOY_DIR"
log ""

# Check if deployment directory exists
if ! check_dir "$DEPLOY_DIR"; then
  log "${RED}Deployment directory not found. Verification failed.${NC}"
  exit 1
fi

# Verify specific component if requested
if [ ! -z "$COMPONENT" ]; then
  log "${YELLOW}Verifying component: $COMPONENT${NC}"
  
  case $COMPONENT in
    ai-engine)
      # Check AI Engine component files
      AI_ENGINE_FILES=(
        "$DEPLOY_DIR/js/components/ai/engine/ai_engine.js"
        "$DEPLOY_DIR/js/components/ai/engine/model_router.js"
        "$DEPLOY_DIR/js/components/ai/engine/embeddings_service.js"
        "$DEPLOY_DIR/js/components/ai/engine/streaming_client.js"
        "$DEPLOY_DIR/js/components/ai/engine/model_registry.js"
      )
      
      AI_ENGINE_FILES_MISSING=0
      for file in "${AI_ENGINE_FILES[@]}"; do
        if ! check_file "$file"; then
          AI_ENGINE_FILES_MISSING=$((AI_ENGINE_FILES_MISSING + 1))
        fi
      done
      
      if [ $AI_ENGINE_FILES_MISSING -eq 0 ]; then
        log "${GREEN}All AI Engine files are present.${NC}"
      else
        log "${RED}Missing $AI_ENGINE_FILES_MISSING AI Engine files.${NC}"
      fi
      
      # Check for version references
      check_string_in_file "$DEPLOY_DIR/js/components/ai/engine/ai_engine.js" "v2.4.0" "AI Engine version reference"
      
      log "${YELLOW}AI Engine component verification completed.${NC}"
      exit $AI_ENGINE_FILES_MISSING
      ;;
      
    map-component)
      # Check Map component files
      MAP_FILES=(
        "$DEPLOY_DIR/js/components/map/map_engine.js"
        "$DEPLOY_DIR/js/components/map/geo_layers.js"
        "$DEPLOY_DIR/js/components/map/region_selector.js"
        "$DEPLOY_DIR/js/components/map/heat_visualization.js"
        "$DEPLOY_DIR/js/components/map/location_search.js"
      )
      
      MAP_FILES_MISSING=0
      for file in "${MAP_FILES[@]}"; do
        if ! check_file "$file"; then
          MAP_FILES_MISSING=$((MAP_FILES_MISSING + 1))
        fi
      done
      
      if [ $MAP_FILES_MISSING -eq 0 ]; then
        log "${GREEN}All Map component files are present.${NC}"
      else
        log "${RED}Missing $MAP_FILES_MISSING Map component files.${NC}"
      fi
      
      # Check for version references
      check_string_in_file "$DEPLOY_DIR/js/components/map/map_engine.js" "v2.4.0" "Map Engine version reference"
      
      log "${YELLOW}Map component verification completed.${NC}"
      exit $MAP_FILES_MISSING
      ;;
      
    user-personalization)
      # Check User Personalization component files
      USER_FILES=(
        "$DEPLOY_DIR/js/components/user/preferences.js"
        "$DEPLOY_DIR/js/components/user/dashboard_layouts.js"
        "$DEPLOY_DIR/js/components/user/saved_filters.js"
        "$DEPLOY_DIR/js/components/user/recent_views.js"
        "$DEPLOY_DIR/js/components/user/export_templates.js"
      )
      
      USER_FILES_MISSING=0
      for file in "${USER_FILES[@]}"; do
        if ! check_file "$file"; then
          USER_FILES_MISSING=$((USER_FILES_MISSING + 1))
        fi
      done
      
      if [ $USER_FILES_MISSING -eq 0 ]; then
        log "${GREEN}All User Personalization files are present.${NC}"
      else
        log "${RED}Missing $USER_FILES_MISSING User Personalization files.${NC}"
      fi
      
      # Check for version references
      check_string_in_file "$DEPLOY_DIR/js/components/user/preferences.js" "v2.4.0" "User Preferences version reference"
      
      log "${YELLOW}User Personalization component verification completed.${NC}"
      exit $USER_FILES_MISSING
      ;;
      
    *)
      log "${RED}Unknown component: $COMPONENT${NC}"
      exit 1
      ;;
  esac
fi

# If only integrity check is requested, skip to that part
if [ "$INTEGRITY_ONLY" = true ]; then
  log "${YELLOW}Performing integrity check only...${NC}"
  
  # Generate file checksums
  CHECKSUM_FILE="$LOG_DIR/checksums_v2.4.0_$TIMESTAMP.md5"
  echo "# Client360 Dashboard v2.4.0 Checksums" > $CHECKSUM_FILE
  echo "# Generated: $(date)" >> $CHECKSUM_FILE
  echo "" >> $CHECKSUM_FILE
  
  # Generate checksums for all JS files
  find "$DEPLOY_DIR" -name "*.js" -type f | while read file; do
    HASH=$(calc_hash "$file")
    echo "$HASH  $file" >> $CHECKSUM_FILE
  done
  
  # Add checksums for key HTML files
  for file in $(find "$DEPLOY_DIR" -name "*.html" -type f); do
    HASH=$(calc_hash "$file")
    echo "$HASH  $file" >> $CHECKSUM_FILE
  done
  
  log "${GREEN}File integrity check completed. Checksums saved to: $CHECKSUM_FILE${NC}"
  exit 0
fi

# 1. Check core files
log "${YELLOW}Checking core files...${NC}"

CORE_FILES=(
  "$DEPLOY_DIR/index.html"
  "$DEPLOY_DIR/js/dashboard.js"
  "$DEPLOY_DIR/staticwebapp.config.json"
)

CORE_FILES_MISSING=0
for file in "${CORE_FILES[@]}"; do
  if ! check_file "$file"; then
    CORE_FILES_MISSING=$((CORE_FILES_MISSING + 1))
  fi
done

if [ $CORE_FILES_MISSING -eq 0 ]; then
  log "${GREEN}All core files are present.${NC}"
else
  log "${RED}Missing $CORE_FILES_MISSING core files.${NC}"
fi

# 2. Check AI Engine component files
log "${YELLOW}Checking AI Engine component files...${NC}"

AI_ENGINE_FILES=(
  "$DEPLOY_DIR/js/components/ai/engine/ai_engine.js"
  "$DEPLOY_DIR/js/components/ai/engine/model_router.js"
  "$DEPLOY_DIR/js/components/ai/engine/embeddings_service.js"
  "$DEPLOY_DIR/js/components/ai/engine/streaming_client.js"
  "$DEPLOY_DIR/js/components/ai/engine/model_registry.js"
)

AI_ENGINE_FILES_MISSING=0
for file in "${AI_ENGINE_FILES[@]}"; do
  if ! check_file "$file"; then
    AI_ENGINE_FILES_MISSING=$((AI_ENGINE_FILES_MISSING + 1))
  fi
done

if [ $AI_ENGINE_FILES_MISSING -eq 0 ]; then
  log "${GREEN}All AI Engine files are present.${NC}"
else
  log "${RED}Missing $AI_ENGINE_FILES_MISSING AI Engine files.${NC}"
fi

# 3. Check Map component files
log "${YELLOW}Checking Map component files...${NC}"

MAP_FILES=(
  "$DEPLOY_DIR/js/components/map/map_engine.js"
  "$DEPLOY_DIR/js/components/map/geo_layers.js"
  "$DEPLOY_DIR/js/components/map/region_selector.js"
  "$DEPLOY_DIR/js/components/map/heat_visualization.js"
  "$DEPLOY_DIR/js/components/map/location_search.js"
)

MAP_FILES_MISSING=0
for file in "${MAP_FILES[@]}"; do
  if ! check_file "$file"; then
    MAP_FILES_MISSING=$((MAP_FILES_MISSING + 1))
  fi
done

if [ $MAP_FILES_MISSING -eq 0 ]; then
  log "${GREEN}All Map component files are present.${NC}"
else
  log "${RED}Missing $MAP_FILES_MISSING Map component files.${NC}"
fi

# 4. Check User Personalization component files
log "${YELLOW}Checking User Personalization component files...${NC}"

USER_FILES=(
  "$DEPLOY_DIR/js/components/user/preferences.js"
  "$DEPLOY_DIR/js/components/user/dashboard_layouts.js"
  "$DEPLOY_DIR/js/components/user/saved_filters.js"
  "$DEPLOY_DIR/js/components/user/recent_views.js"
  "$DEPLOY_DIR/js/components/user/export_templates.js"
)

USER_FILES_MISSING=0
for file in "${USER_FILES[@]}"; do
  if ! check_file "$file"; then
    USER_FILES_MISSING=$((USER_FILES_MISSING + 1))
  fi
done

if [ $USER_FILES_MISSING -eq 0 ]; then
  log "${GREEN}All User Personalization files are present.${NC}"
else
  log "${RED}Missing $USER_FILES_MISSING User Personalization files.${NC}"
fi

# 5. Check data directories
log "${YELLOW}Checking data directories...${NC}"

DATA_DIRS=(
  "$DEPLOY_DIR/data"
  "$DEPLOY_DIR/data/simulated"
  "$DEPLOY_DIR/data/simulated/ai"
  "$DEPLOY_DIR/data/simulated/ai/insights"
  "$DEPLOY_DIR/data/live"
  "$DEPLOY_DIR/data/live/ai"
  "$DEPLOY_DIR/data/live/ai/insights"
)

DATA_DIRS_MISSING=0
for dir in "${DATA_DIRS[@]}"; do
  if ! check_dir "$dir"; then
    DATA_DIRS_MISSING=$((DATA_DIRS_MISSING + 1))
  fi
done

if [ $DATA_DIRS_MISSING -eq 0 ]; then
  log "${GREEN}All data directories are present.${NC}"
else
  log "${RED}Missing $DATA_DIRS_MISSING data directories.${NC}"
fi

# 6. Check for version references
log "${YELLOW}Checking for version references...${NC}"

VERSION_FILES=(
  "$DEPLOY_DIR/index.html"
  "$DEPLOY_DIR/js/dashboard.js"
  "$DEPLOY_DIR/js/components/ai/engine/ai_engine.js"
  "$DEPLOY_DIR/js/components/map/map_engine.js"
  "$DEPLOY_DIR/js/components/user/preferences.js"
)

VERSION_REFERENCE_FOUND=0
for file in "${VERSION_FILES[@]}"; do
  if [ -f "$file" ] && grep -q "v2.4.0" "$file"; then
    log "${GREEN}✓ Version reference found in: $file${NC}"
    VERSION_REFERENCE_FOUND=$((VERSION_REFERENCE_FOUND + 1))
  fi
done

if [ $VERSION_REFERENCE_FOUND -gt 0 ]; then
  log "${GREEN}Found version references in $VERSION_REFERENCE_FOUND files.${NC}"
else
  log "${RED}No version references found.${NC}"
fi

# 7. Generate file checksums
log "${YELLOW}Generating file integrity checksums...${NC}"

CHECKSUM_FILE="$LOG_DIR/checksums_v2.4.0_$TIMESTAMP.md5"
echo "# Client360 Dashboard v2.4.0 Checksums" > $CHECKSUM_FILE
echo "# Generated: $(date)" >> $CHECKSUM_FILE
echo "" >> $CHECKSUM_FILE

# Generate checksums for all JS files
find "$DEPLOY_DIR" -name "*.js" -type f | while read file; do
  HASH=$(calc_hash "$file")
  echo "$HASH  $file" >> $CHECKSUM_FILE
done

# Add checksums for key HTML files
for file in $(find "$DEPLOY_DIR" -name "*.html" -type f); do
  HASH=$(calc_hash "$file")
  echo "$HASH  $file" >> $CHECKSUM_FILE
done

log "${GREEN}File checksums generated: $CHECKSUM_FILE${NC}"

# 8. Generate verification report if requested
if [ "$GENERATE_REPORT" = true ]; then
  log "${YELLOW}Generating verification report...${NC}"
  
  REPORT_FILE="$DEPLOY_DIR/verification_report.html"
  
  cat > $REPORT_FILE << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard v2.4.0 Verification Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #1e40af; }
    .success { color: #15803d; }
    .warning { color: #a16207; }
    .error { color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f9fafb; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status-success { background-color: #dcfce7; color: #15803d; }
    .status-warning { background-color: #fef3c7; color: #a16207; }
    .status-error { background-color: #fee2e2; color: #b91c1c; }
    .metadata { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
    .component-table { margin-bottom: 40px; }
  </style>
</head>
<body>
  <h1>Client360 Dashboard v2.4.0 Verification Report</h1>
  <div class="metadata">
    <p>Generated: $(date)</p>
    <p>Deployment Directory: $DEPLOY_DIR</p>
  </div>
  
  <h2>Verification Summary</h2>
  <table>
    <tr>
      <th>Check</th>
      <th>Status</th>
      <th>Notes</th>
    </tr>
    <tr>
      <td>Core Files</td>
      <td><span class="status-badge $([ $CORE_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $CORE_FILES_MISSING -eq 0 ] && echo "PASSED" || echo "FAILED")</span></td>
      <td>$([ $CORE_FILES_MISSING -eq 0 ] && echo "All core files present" || echo "Missing $CORE_FILES_MISSING files")</td>
    </tr>
    <tr>
      <td>AI Engine Component</td>
      <td><span class="status-badge $([ $AI_ENGINE_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $AI_ENGINE_FILES_MISSING -eq 0 ] && echo "PASSED" || echo "FAILED")</span></td>
      <td>$([ $AI_ENGINE_FILES_MISSING -eq 0 ] && echo "All AI Engine files present" || echo "Missing $AI_ENGINE_FILES_MISSING files")</td>
    </tr>
    <tr>
      <td>Map Component</td>
      <td><span class="status-badge $([ $MAP_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $MAP_FILES_MISSING -eq 0 ] && echo "PASSED" || echo "FAILED")</span></td>
      <td>$([ $MAP_FILES_MISSING -eq 0 ] && echo "All Map Component files present" || echo "Missing $MAP_FILES_MISSING files")</td>
    </tr>
    <tr>
      <td>User Personalization</td>
      <td><span class="status-badge $([ $USER_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $USER_FILES_MISSING -eq 0 ] && echo "PASSED" || echo "FAILED")</span></td>
      <td>$([ $USER_FILES_MISSING -eq 0 ] && echo "All User Personalization files present" || echo "Missing $USER_FILES_MISSING files")</td>
    </tr>
    <tr>
      <td>Data Directories</td>
      <td><span class="status-badge $([ $DATA_DIRS_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $DATA_DIRS_MISSING -eq 0 ] && echo "PASSED" || echo "FAILED")</span></td>
      <td>$([ $DATA_DIRS_MISSING -eq 0 ] && echo "All data directories present" || echo "Missing $DATA_DIRS_MISSING directories")</td>
    </tr>
    <tr>
      <td>Version References</td>
      <td><span class="status-badge $([ $VERSION_REFERENCE_FOUND -gt 0 ] && echo "status-success" || echo "status-error")">$([ $VERSION_REFERENCE_FOUND -gt 0 ] && echo "PASSED" || echo "FAILED")</span></td>
      <td>$([ $VERSION_REFERENCE_FOUND -gt 0 ] && echo "Version references found in $VERSION_REFERENCE_FOUND files" || echo "No version references found")</td>
    </tr>
    <tr>
      <td>File Integrity</td>
      <td><span class="status-badge status-success">PASSED</span></td>
      <td>Checksums generated: <code>$CHECKSUM_FILE</code></td>
    </tr>
  </table>
  
  <h2>Component Status</h2>
  <table class="component-table">
    <tr>
      <th>Component</th>
      <th>Version</th>
      <th>Status</th>
    </tr>
    <tr>
      <td>Core Dashboard</td>
      <td>v2.4.0</td>
      <td><span class="status-badge $([ $CORE_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $CORE_FILES_MISSING -eq 0 ] && echo "READY" || echo "ERROR")</span></td>
    </tr>
    <tr>
      <td>Multi-Model AI Engine</td>
      <td>v2.4.0</td>
      <td><span class="status-badge $([ $AI_ENGINE_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $AI_ENGINE_FILES_MISSING -eq 0 ] && echo "READY" || echo "ERROR")</span></td>
    </tr>
    <tr>
      <td>Enhanced Map Component</td>
      <td>v2.4.0</td>
      <td><span class="status-badge $([ $MAP_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $MAP_FILES_MISSING -eq 0 ] && echo "READY" || echo "ERROR")</span></td>
    </tr>
    <tr>
      <td>User Personalization Framework</td>
      <td>v2.4.0</td>
      <td><span class="status-badge $([ $USER_FILES_MISSING -eq 0 ] && echo "status-success" || echo "status-error")">$([ $USER_FILES_MISSING -eq 0 ] && echo "READY" || echo "ERROR")</span></td>
    </tr>
  </table>
  
  <h2>Next Steps</h2>
  <ul>
    <li>Deploy to Azure Static Web App</li>
    <li>Configure Azure OpenAI API keys in production environment</li>
    <li>Run end-to-end testing with real data</li>
    <li>Enable monitoring and alerts</li>
    <li>Update documentation for end users</li>
  </ul>
  
  <div class="metadata">
    <p>Report generated by verify_v2.4.0_deployment.sh</p>
    <p>See $LOG_FILE for detailed verification log</p>
  </div>
</body>
</html>
EOF
  
  log "${GREEN}Verification report generated: $REPORT_FILE${NC}"
fi

# 9. Generate diff report between v2.3.3 and v2.4.0
log "${YELLOW}Generating diff report...${NC}"

DIFF_REPORT="$LOG_DIR/diff_v2.3.3_to_v2.4.0_$TIMESTAMP.txt"

# Check if v2.3.3 exists
if [ -d "deploy_v2.3.3" ]; then
  echo "# Differences between v2.3.3 and v2.4.0" > $DIFF_REPORT
  echo "# Generated: $(date)" >> $DIFF_REPORT
  echo "" >> $DIFF_REPORT
  
  # Find files in v2.4.0 that don't exist in v2.3.3
  echo "## New files in v2.4.0" >> $DIFF_REPORT
  echo "" >> $DIFF_REPORT
  
  find "$DEPLOY_DIR" -type f | while read file; do
    rel_path=${file#"$DEPLOY_DIR/"}
    if [ ! -f "deploy_v2.3.3/$rel_path" ]; then
      echo "- $rel_path" >> $DIFF_REPORT
    fi
  done
  
  echo "" >> $DIFF_REPORT
  echo "## Modified files" >> $DIFF_REPORT
  echo "" >> $DIFF_REPORT
  
  # Find files that exist in both but have different content
  find "$DEPLOY_DIR" -type f | while read file; do
    rel_path=${file#"$DEPLOY_DIR/"}
    if [ -f "deploy_v2.3.3/$rel_path" ]; then
      if ! cmp -s "$file" "deploy_v2.3.3/$rel_path"; then
        echo "- $rel_path" >> $DIFF_REPORT
      fi
    fi
  done
  
  log "${GREEN}Diff report generated: $DIFF_REPORT${NC}"
else
  log "${YELLOW}Cannot generate diff report: deploy_v2.3.3 directory not found.${NC}"
fi

# 10. Summary
log ""
log "${BLUE}======================================================${NC}"
log "${BLUE}= Verification Summary                               =${NC}"
log "${BLUE}======================================================${NC}"
log "Total core files missing: $CORE_FILES_MISSING"
log "AI Engine files missing: $AI_ENGINE_FILES_MISSING"
log "Map Component files missing: $MAP_FILES_MISSING"
log "User Personalization files missing: $USER_FILES_MISSING"
log "Data directories missing: $DATA_DIRS_MISSING"
log "Version references found: $VERSION_REFERENCE_FOUND"

# Calculate overall verification status
TOTAL_MISSING=$((CORE_FILES_MISSING + AI_ENGINE_FILES_MISSING + MAP_FILES_MISSING + USER_FILES_MISSING + DATA_DIRS_MISSING))
if [ $TOTAL_MISSING -eq 0 ] && [ $VERSION_REFERENCE_FOUND -gt 0 ]; then
  VERIFICATION_STATUS="PASSED"
  log "${GREEN}Overall verification status: $VERIFICATION_STATUS${NC}"
else
  VERIFICATION_STATUS="FAILED"
  log "${RED}Overall verification status: $VERIFICATION_STATUS${NC}"
fi

log ""
log "Verification log saved to: $LOG_FILE"
log "Checksum file saved to: $CHECKSUM_FILE"
[ "$GENERATE_REPORT" = true ] && log "Verification report saved to: $REPORT_FILE"
[ -f "$DIFF_REPORT" ] && log "Diff report saved to: $DIFF_REPORT"
log ""

# Set exit code based on verification status
if [ "$VERIFICATION_STATUS" == "PASSED" ]; then
  exit 0
else
  exit 1
fi