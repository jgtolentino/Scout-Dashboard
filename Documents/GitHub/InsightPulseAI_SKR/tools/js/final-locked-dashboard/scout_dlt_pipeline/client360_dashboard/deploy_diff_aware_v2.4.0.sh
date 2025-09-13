#!/usr/bin/env bash
# deploy_diff_aware_v2.4.0.sh
# Script to deploy Client360 Dashboard v2.4.0 updates using diff-aware deployment

set -euo pipefail

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="output"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/diff_aware_deployment_v2.4.0_$TIMESTAMP.log"
SOURCE_DIR="deploy_v2.4.0"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "${BLUE}=======================================================${NC}"
log "${BLUE}= Client360 Dashboard v2.4.0 Diff-Aware Deployment    =${NC}"
log "${BLUE}=======================================================${NC}"
log "Started at: $(date)"
log "Source directory: $SOURCE_DIR"
log ""

# Parse command line arguments
FROM_TAG=""
TO_TAG=""
FORCE=false
USE_STDIN=false  # Whether to read changed files from stdin

while [[ $# -gt 0 ]]; do
  case $1 in
    --from-tag)
      FROM_TAG="$2"
      shift 2
      ;;
    --to-tag)
      TO_TAG="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --stdin)
      USE_STDIN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--from-tag TAG] [--to-tag TAG] [--force] [--stdin]"
      exit 1
      ;;
  esac
done

# 1. Ensure deployment directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  log "${RED}Error: Source directory $SOURCE_DIR does not exist${NC}"
  exit 1
fi

# 2. Verify deployment files
log "${YELLOW}Verifying deployment files...${NC}"
if ! ./verify_v2.4.0_deployment.sh; then
  log "${RED}Verification failed. Aborting deployment.${NC}"
  exit 1
fi

# 3. Determine list of changed files
log "${YELLOW}Identifying changed files...${NC}"

if [ "$USE_STDIN" = true ]; then
  # Read changed files from stdin (piped input)
  CHANGED_FILES=$(cat)
  if [ -z "$CHANGED_FILES" ]; then
    log "${YELLOW}No files received from stdin.${NC}"
  else
    log "${GREEN}Received file list from stdin.${NC}"
  fi
else
  # Determine comparison base
  if [ -n "$FROM_TAG" ]; then
    COMPARE_BASE=$FROM_TAG
    log "${YELLOW}Using specified from-tag: $COMPARE_BASE${NC}"
  else
    # Try to find the most recent v* tag
    LAST_TAG=$(git tag --list 'v*' --sort=-creatordate | head -n1)
    if [ -n "$LAST_TAG" ]; then
      log "${YELLOW}Using most recent tag: $LAST_TAG${NC}"
      COMPARE_BASE=$LAST_TAG
    else
      log "${YELLOW}No tags found. Using HEAD~10 as base.${NC}"
      COMPARE_BASE="HEAD~10"
    fi
  fi

  # Determine comparison target
  if [ -n "$TO_TAG" ]; then
    COMPARE_TARGET=$TO_TAG
    log "${YELLOW}Using specified to-tag: $COMPARE_TARGET${NC}"
  else
    COMPARE_TARGET="HEAD"
    log "${YELLOW}Using current HEAD as target${NC}"
  fi

  # Get changed files
  log "${YELLOW}Detecting changes from $COMPARE_BASE to $COMPARE_TARGET...${NC}"
  
  # Try git diff (will fail if tags don't exist)
  CHANGED_FILES=$(git diff --name-only "$COMPARE_BASE" "$COMPARE_TARGET" 2>/dev/null | sort)
  
  # If git diff fails or finds no changes
  if [ -z "$CHANGED_FILES" ]; then
    if [ "$FORCE" = true ]; then
      log "${YELLOW}No changes detected but --force flag used. Will deploy all files in $SOURCE_DIR.${NC}"
      # If --force is used and no specific files changed, include all files in the directory
      CHANGED_FILES=$(find "$SOURCE_DIR" -type f -not -path "*/\.*" | sort)
    else
      log "${YELLOW}No changes detected. Use --force to deploy anyway.${NC}"
      exit 0
    fi
  fi
fi

# Filter changed files to only include those in the $SOURCE_DIR
log "${YELLOW}Filtering changes to only include files in $SOURCE_DIR...${NC}"
FILTERED_FILES=""
while read -r file; do
  if [[ -n "$file" && "$file" == *"$SOURCE_DIR"* ]]; then
    FILTERED_FILES+="$file"$'\n'
  fi
done <<< "$CHANGED_FILES"

if [ -z "$FILTERED_FILES" ]; then
  log "${YELLOW}No changes detected in $SOURCE_DIR.${NC}"
  if [ "$FORCE" = true ]; then
    log "${YELLOW}--force flag used. Will deploy all files in $SOURCE_DIR.${NC}"
    FILTERED_FILES=$(find "$SOURCE_DIR" -type f -not -path "*/\.*" | sort)
  else
    log "${YELLOW}Use --force to deploy anyway.${NC}"
    exit 0
  fi
fi

# 4. Analyze components affected by changes
log "${YELLOW}Analyzing components affected by changes...${NC}"

AI_CHANGES=$(echo -e "$FILTERED_FILES" | grep -E "ai|model|embedding|streaming" || echo "")
MAP_CHANGES=$(echo -e "$FILTERED_FILES" | grep -E "map|geo|region|heat|location" || echo "")
USER_CHANGES=$(echo -e "$FILTERED_FILES" | grep -E "user|preferences|layout|filter|recent|export" || echo "")
CORE_CHANGES=$(echo -e "$FILTERED_FILES" | grep -E "dashboard\.js|index\.html|staticwebapp\.config\.json" || echo "")

COMPONENTS_CHANGED=""
[ -n "$AI_CHANGES" ] && COMPONENTS_CHANGED+="Multi-Model AI, "
[ -n "$MAP_CHANGES" ] && COMPONENTS_CHANGED+="Enhanced Map, "
[ -n "$USER_CHANGES" ] && COMPONENTS_CHANGED+="User Personalization, "
[ -n "$CORE_CHANGES" ] && COMPONENTS_CHANGED+="Core Files, "
COMPONENTS_CHANGED=$(echo "$COMPONENTS_CHANGED" | sed 's/, $//')

log "${GREEN}Components affected: $COMPONENTS_CHANGED${NC}"

# 5. Create a temporary directory for deployment
TEMP_DIR="temp_diff_deploy_${TIMESTAMP}"
mkdir -p "$TEMP_DIR"

# 6. Copy changed files to temp directory (preserving directory structure)
log "${YELLOW}Preparing deployment package...${NC}"
echo -e "$FILTERED_FILES" | while read -r file; do
  if [ -n "$file" ] && [ -f "$file" ]; then
    # Extract relative path from source directory
    rel_path=${file#$SOURCE_DIR/}
    if [ "$rel_path" != "$file" ]; then
      # Create directory structure
      mkdir -p "$TEMP_DIR/$(dirname "$rel_path")"
      
      # Copy the file
      cp "$file" "$TEMP_DIR/$(dirname "$rel_path")/"
      log "${GREEN}✓ Prepared: $rel_path${NC}"
    fi
  fi
done

# 7. Create deployment package
log "${YELLOW}Creating deployment package...${NC}"
DEPLOY_PACKAGE="$LOG_DIR/client360_dashboard_v2.4.0_diff_${TIMESTAMP}.zip"
(cd "$TEMP_DIR" && zip -r "../$DEPLOY_PACKAGE" . -x "*/\.*" > /dev/null)
log "${GREEN}✓ Deployment package created: $DEPLOY_PACKAGE${NC}"

# 8. Check if we can use the patch-deploy-diff-aware.sh script
if [ -f "./patch-deploy-diff-aware.sh" ]; then
  log "${YELLOW}Using existing patch-deploy-diff-aware.sh script...${NC}"
  
  # Prepare file list for the script
  FILES_FOR_PATCH=$(echo -e "$FILTERED_FILES" | sed "s|^$SOURCE_DIR/|deploy_v2.3.2/|")
  
  # Pass the file list to the script
  echo -e "$FILES_FOR_PATCH" | ./patch-deploy-diff-aware.sh --from-tag v2.3.3 --to-tag v2.4.0
  
  DEPLOY_STATUS=$?
  
  if [ $DEPLOY_STATUS -eq 0 ]; then
    log "${GREEN}✓ Diff-aware deployment completed successfully using patch-deploy-diff-aware.sh${NC}"
  else
    log "${RED}✗ Diff-aware deployment failed using patch-deploy-diff-aware.sh${NC}"
    log "${YELLOW}Trying alternative deployment method...${NC}"
    # Fall back to local deployment
    LOCAL_DEPLOY_DIR="local_diff_deploy_v2.4.0_${TIMESTAMP}"
    mkdir -p "$LOCAL_DEPLOY_DIR"
    cp -R "$TEMP_DIR"/* "$LOCAL_DEPLOY_DIR"/
    
    # Create a simple server script
    cat > "$LOCAL_DEPLOY_DIR/start_server.sh" << 'EOF'
#!/bin/bash
PORT=${1:-8000}
echo "Starting local server on port $PORT..."
echo "Access the dashboard at: http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"

if command -v python3 &> /dev/null; then
  python3 -m http.server $PORT
elif command -v python &> /dev/null; then
  python -m SimpleHTTPServer $PORT
elif command -v npx &> /dev/null; then
  npx serve -l $PORT
else
  echo "Error: No suitable server found. Please install Python or Node.js."
  exit 1
fi
EOF
    chmod +x "$LOCAL_DEPLOY_DIR/start_server.sh"
    
    log "${GREEN}✓ Local deployment created at: $LOCAL_DEPLOY_DIR${NC}"
    log "${GREEN}✓ To start the server, run: cd $LOCAL_DEPLOY_DIR && ./start_server.sh${NC}"
  fi
else
  # Fall back to local deployment
  log "${YELLOW}patch-deploy-diff-aware.sh not found. Creating local deployment instead...${NC}"
  
  LOCAL_DEPLOY_DIR="local_diff_deploy_v2.4.0_${TIMESTAMP}"
  mkdir -p "$LOCAL_DEPLOY_DIR"
  cp -R "$TEMP_DIR"/* "$LOCAL_DEPLOY_DIR"/
  
  # Create a simple server script
  cat > "$LOCAL_DEPLOY_DIR/start_server.sh" << 'EOF'
#!/bin/bash
PORT=${1:-8000}
echo "Starting local server on port $PORT..."
echo "Access the dashboard at: http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"

if command -v python3 &> /dev/null; then
  python3 -m http.server $PORT
elif command -v python &> /dev/null; then
  python -m SimpleHTTPServer $PORT
elif command -v npx &> /dev/null; then
  npx serve -l $PORT
else
  echo "Error: No suitable server found. Please install Python or Node.js."
  exit 1
fi
EOF
  chmod +x "$LOCAL_DEPLOY_DIR/start_server.sh"
  
  log "${GREEN}✓ Local deployment created at: $LOCAL_DEPLOY_DIR${NC}"
  log "${GREEN}✓ To start the server, run: cd $LOCAL_DEPLOY_DIR && ./start_server.sh${NC}"
fi

# 9. Create deployment report
log "${YELLOW}Creating deployment report...${NC}"
REPORT_FILE="$LOG_DIR/diff_aware_deployment_report_v2.4.0_${TIMESTAMP}.md"

cat > "$REPORT_FILE" << EOF
# Client360 Dashboard v2.4.0 Diff-Aware Deployment Report

**Deployment Date:** $(date)
**Deployment ID:** diff_v2.4.0_${TIMESTAMP}
**Components Changed:** ${COMPONENTS_CHANGED:-"None"}

## Deployment Summary

The Client360 Dashboard v2.4.0 was updated using a diff-aware deployment approach, which only deployed the specific files that changed since the last release.

## Files Deployed

\`\`\`
$(find "$TEMP_DIR" -type f | sort | sed "s|$TEMP_DIR/||")
\`\`\`

## Components Affected

${COMPONENTS_CHANGED:-"None"}

## Deployment Method

$([ -f "./patch-deploy-diff-aware.sh" ] && [ $DEPLOY_STATUS -eq 0 ] && echo "- Azure Static Web App via patch-deploy-diff-aware.sh" || echo "- Local deployment for testing")

## Deployment Package

- Deployment package: \`$DEPLOY_PACKAGE\`
$([ -d "$LOCAL_DEPLOY_DIR" ] && echo "- Local deployment directory: \`$LOCAL_DEPLOY_DIR\`")

## Testing Instructions

1. Focus testing on the components that were modified: ${COMPONENTS_CHANGED:-"None"}
2. Verify that unchanged components still work correctly
3. Check for any integration issues between modified and unmodified components
$([ -d "$LOCAL_DEPLOY_DIR" ] && echo "4. To test locally: \`cd $LOCAL_DEPLOY_DIR && ./start_server.sh\`")

## Logs and References

- Deployment log: \`$LOG_FILE\`
- Deployment package: \`$DEPLOY_PACKAGE\`
EOF

log "${GREEN}✓ Deployment report created: $REPORT_FILE${NC}"

# 10. Clean up temp directory
rm -rf "$TEMP_DIR"

# 11. Final summary
log ""
log "${BLUE}=======================================================${NC}"
log "${BLUE}= Deployment Summary                                  =${NC}"
log "${BLUE}=======================================================${NC}"
log "Status: ${GREEN}SUCCESS${NC}"
log "Components Modified: ${COMPONENTS_CHANGED:-"None"}"
log "Deployment Log: $LOG_FILE"
log "Deployment Report: $REPORT_FILE"
log "Deployment Package: $DEPLOY_PACKAGE"
if [ -d "$LOCAL_DEPLOY_DIR" ]; then
  log ""
  log "${GREEN}Local deployment created at: $LOCAL_DEPLOY_DIR${NC}"
  log "To start the server, run:"
  log "${YELLOW}cd $LOCAL_DEPLOY_DIR && ./start_server.sh${NC}"
else
  log ""
  log "${GREEN}Diff-aware deployment completed using patch-deploy-diff-aware.sh${NC}"
fi