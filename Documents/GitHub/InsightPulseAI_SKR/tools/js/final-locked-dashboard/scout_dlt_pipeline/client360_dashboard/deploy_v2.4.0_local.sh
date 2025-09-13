#!/bin/bash
# deploy_v2.4.0_local.sh
# Script to deploy Client360 Dashboard v2.4.0 to a local environment for testing

set -e  # Exit on any error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define directories and paths
DEPLOY_DIR="deploy_v2.4.0"
LOCAL_DEPLOY_DIR="local_deploy_v2.4.0"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="output"
LOG_FILE="$LOG_DIR/local_deployment_v2.4.0_$TIMESTAMP.log"
CHECKSUM_FILE="$LOG_DIR/checksums_v2.4.0_$TIMESTAMP.md5"

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Function to log messages
log() {
  echo -e "$1" | tee -a $LOG_FILE
}

log "${BLUE}=======================================================${NC}"
log "${BLUE}= Client360 Dashboard v2.4.0 Local Deployment         =${NC}"
log "${BLUE}=======================================================${NC}"
log "Started at: $(date)"
log "Deployment directory: $DEPLOY_DIR"
log "Local deployment target: $LOCAL_DEPLOY_DIR"
log ""

# Verify deployment files
log "${YELLOW}Verifying deployment files...${NC}"
if ! ./verify_v2.4.0_deployment.sh; then
  log "${RED}Verification failed. Aborting deployment.${NC}"
  exit 1
fi

# Generate version file
log "${YELLOW}Generating version file...${NC}"
mkdir -p "$DEPLOY_DIR"
cat > "$DEPLOY_DIR/version.json" << EOF
{
  "version": "v2.4.0",
  "buildTimestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deploymentId": "client360_local_$TIMESTAMP",
  "environment": "local"
}
EOF

# Create local deployment directory
log "${YELLOW}Creating local deployment directory...${NC}"
rm -rf $LOCAL_DEPLOY_DIR
mkdir -p $LOCAL_DEPLOY_DIR

# Copy deployment files
log "${YELLOW}Copying deployment files...${NC}"
cp -R $DEPLOY_DIR/* $LOCAL_DEPLOY_DIR/

# Create deployment package for backup/archiving
log "${YELLOW}Creating deployment package...${NC}"
DEPLOY_PACKAGE="client360_dashboard_v2.4.0_local_$TIMESTAMP.zip"
zip -r "$LOG_DIR/$DEPLOY_PACKAGE" "$DEPLOY_DIR" > /dev/null
log "${GREEN}Deployment package created: $LOG_DIR/$DEPLOY_PACKAGE${NC}"

# Generate file checksums
log "${YELLOW}Generating file integrity checksums...${NC}"
echo "# Client360 Dashboard v2.4.0 Deployment Checksums" > $CHECKSUM_FILE
echo "# Generated: $(date)" >> $CHECKSUM_FILE
echo "" >> $CHECKSUM_FILE

# Generate checksums for all files in the deployment directory
find "$LOCAL_DEPLOY_DIR" -type f | while read file; do
  shasum -a 256 "$file" | cut -d ' ' -f 1 >> $CHECKSUM_FILE
done
log "${GREEN}Checksums generated: $CHECKSUM_FILE${NC}"

# Create simple server script for testing
log "${YELLOW}Creating local server script...${NC}"
cat > "$LOCAL_DEPLOY_DIR/start_server.sh" << 'EOF'
#!/bin/bash
# Simple HTTP server for testing the dashboard
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

# Create deployment verification report
log "${YELLOW}Generating deployment verification report...${NC}"
REPORT_FILE="$LOG_DIR/local_deployment_verification_v2.4.0_$TIMESTAMP.md"

cat > $REPORT_FILE << EOF
# Client360 Dashboard v2.4.0 Local Deployment Verification Report

**Deployment Date:** $(date)
**Deployment ID:** client360_local_$TIMESTAMP
**Deployment Path:** $LOCAL_DEPLOY_DIR
**Deployment Package:** $DEPLOY_PACKAGE

## Deployment Summary

The Client360 Dashboard v2.4.0 has been successfully deployed to a local environment.

## Features Included

- **Multi-Model AI Framework**: Enhanced AI insights with multiple model support and fallback capabilities
- **Enhanced Map Visualization**: Improved geographical visualizations with heat mapping and region selection
- **User Personalization Framework**: User-specific dashboard layouts, saved filters, and preferences

## Local Testing Instructions

1. Navigate to the deployment directory:
   \`\`\`bash
   cd $LOCAL_DEPLOY_DIR
   \`\`\`

2. Start the local server:
   \`\`\`bash
   ./start_server.sh
   \`\`\`

3. Access the dashboard at:
   http://localhost:8000

## Verification Checklist

- [ ] Verify dashboard loads correctly in browser
- [ ] Verify AI components functionality
- [ ] Verify Enhanced Map components
- [ ] Verify User Personalization features
- [ ] Verify data connections

## References

- Checksums: \`$CHECKSUM_FILE\`
- Deployment Log: \`$LOG_FILE\`
- Version File: \`$LOCAL_DEPLOY_DIR/version.json\`
EOF

log "${GREEN}Deployment verification report generated: $REPORT_FILE${NC}"

# Final summary
log ""
log "${BLUE}=======================================================${NC}"
log "${BLUE}= Deployment Summary                                  =${NC}"
log "${BLUE}=======================================================${NC}"
log "Deployment Status: ${GREEN}SUCCESS${NC}"
log "Deployed Version: v2.4.0"
log "Deployment Path: $LOCAL_DEPLOY_DIR"
log "Deployment Timestamp: $TIMESTAMP"
log "Deployment Log: $LOG_FILE"
log "Checksums: $CHECKSUM_FILE"
log "Verification Report: $REPORT_FILE"
log ""
log "${GREEN}Client360 Dashboard v2.4.0 has been successfully deployed locally.${NC}"
log "To start the local server, run:"
log "${YELLOW}cd $LOCAL_DEPLOY_DIR && ./start_server.sh${NC}"
log "Then access the dashboard at: ${YELLOW}http://localhost:8000${NC}"