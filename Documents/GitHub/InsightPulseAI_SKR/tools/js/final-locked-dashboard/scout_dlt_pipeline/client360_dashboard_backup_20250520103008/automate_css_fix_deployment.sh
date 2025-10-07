#!/bin/bash
# Automated Client360 Dashboard CSS Fix and Deployment Script
# This script automates the entire process of fixing CSS styling issues and deploying to Azure

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Configuration
BACKUP_SUFFIX=$(date +"%Y%m%d%H%M%S")
SOURCE_DIR="$BASE_DIR/deploy"
BACKUP_DIR="$BASE_DIR/deploy_backup_$BACKUP_SUFFIX"
OUTPUT_DIR="$BASE_DIR/output"
DEPLOY_ZIP="client360_dashboard_automated_fix_$BACKUP_SUFFIX.zip"
AZURE_URL="https://blue-coast-0acb6880f.6.azurestaticapps.net"

# Create a log file
LOG_FILE="$BASE_DIR/logs/automated_fix_$BACKUP_SUFFIX.log"
mkdir -p "$BASE_DIR/logs"
touch "$LOG_FILE"

# Function to log messages
log() {
    local message="$1"
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Function to verify required commands exist
verify_requirements() {
    log "${BLUE}Verifying requirements...${NC}"
    
    if ! command -v curl &> /dev/null; then
        log "${RED}Error: curl is required but not installed.${NC}"
        exit 1
    fi
    
    if ! command -v zip &> /dev/null; then
        log "${RED}Error: zip is required but not installed.${NC}"
        exit 1
    fi
    
    if ! command -v unzip &> /dev/null; then
        log "${RED}Error: unzip is required but not installed.${NC}"
        exit 1
    fi
    
    log "${GREEN}All requirements verified.${NC}"
}

# Step 1: Back up current deployment
backup_deployment() {
    log "${BLUE}Creating backup of current deployment...${NC}"
    
    if [ -d "$SOURCE_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$SOURCE_DIR/"* "$BACKUP_DIR/"
        log "${GREEN}Current deployment backed up to: $BACKUP_DIR${NC}"
    else
        log "${RED}Error: Source directory $SOURCE_DIR does not exist.${NC}"
        exit 1
    fi
}

# Step 2: Fix the HTML file to reference all CSS files
fix_html() {
    log "${BLUE}Updating HTML to include all CSS references...${NC}"
    
    # Create backup of the HTML file
    cp "$SOURCE_DIR/index.html" "$SOURCE_DIR/index.html.bak"
    
    # Update the HTML to include variables.css
    sed -i.bak 's#<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">#<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">\n    <link rel="stylesheet" href="css/variables.css">#' "$SOURCE_DIR/index.html"
    
    # Verify the changes
    if grep -q 'href="css/variables.css"' "$SOURCE_DIR/index.html"; then
        log "${GREEN}Successfully added variables.css reference to index.html${NC}"
    else
        log "${RED}Error: Failed to add variables.css reference to index.html${NC}"
        # Restore from backup
        mv "$SOURCE_DIR/index.html.bak" "$SOURCE_DIR/index.html"
        exit 1
    fi
}

# Step 3: Update the staticwebapp.config.json file
update_config() {
    log "${BLUE}Updating staticwebapp.config.json...${NC}"
    
    # Create backup of the config file
    cp "$SOURCE_DIR/staticwebapp.config.json" "$SOURCE_DIR/staticwebapp.config.json.bak"
    
    # Create a new config file with the required settings
    cat > "$SOURCE_DIR/staticwebapp.config.json" << EOF
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/css/*.css",
      "headers": {
        "content-type": "text/css"
      }
    },
    {
      "route": "/js/*.js",
      "headers": {
        "content-type": "application/javascript"
      }
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.azurewebsites.net https://unpkg.com https://fonts.googleapis.com https://fonts.gstatic.com;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Access-Control-Allow-Origin": "*"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".css": "text/css",
    ".js": "application/javascript",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".geojson": "application/json"
  }
}
EOF
    
    log "${GREEN}Successfully updated staticwebapp.config.json${NC}"
}

# Step 4: Verify CSS files exist
verify_css_files() {
    log "${BLUE}Verifying CSS files...${NC}"
    
    local missing_files=0
    
    # Check CSS files
    for css_file in "dashboard.css" "tbwa-theme.css" "variables.css"; do
        if [ ! -f "$SOURCE_DIR/css/$css_file" ]; then
            log "${RED}Warning: $css_file is missing!${NC}"
            missing_files=1
        else
            log "${GREEN}Found CSS file: $css_file${NC}"
        fi
    done
    
    if [ $missing_files -eq 1 ]; then
        log "${RED}Error: Some CSS files are missing!${NC}"
        exit 1
    else
        log "${GREEN}All CSS files verified!${NC}"
    fi
}

# Step 5: Create a deployment package
create_deployment_package() {
    log "${BLUE}Creating deployment package...${NC}"
    
    mkdir -p "$OUTPUT_DIR"
    
    (cd "$SOURCE_DIR" && zip -r "$OUTPUT_DIR/$DEPLOY_ZIP" .)
    
    log "${GREEN}Deployment package created: $OUTPUT_DIR/$DEPLOY_ZIP${NC}"
}

# Step 6: Create verification report
create_verification_report() {
    log "${BLUE}Creating verification report...${NC}"
    
    local report_file="$BASE_DIR/reports/verification_report_$BACKUP_SUFFIX.md"
    mkdir -p "$BASE_DIR/reports"
    
    cat > "$report_file" << EOF
# Client360 Dashboard CSS Fix Verification Report

**Date:** $(date +"%B %d, %Y %H:%M:%S")
**Package:** $DEPLOY_ZIP

## Changes Made

1. **HTML Updates**:
   - Added reference to variables.css in the HTML head section
   - Ensured proper CSS load order: variables.css → tbwa-theme.css → dashboard.css

2. **Configuration Updates**:
   - Added explicit routes for CSS files with proper content-type headers
   - Updated MIME type mappings for all file types
   - Enhanced Content Security Policy to allow necessary resources

## Verification Steps

To verify the fix after deployment:

1. Access the dashboard at: $AZURE_URL
2. Run the verification script:
   \`\`\`bash
   ./verify_css_fix_final.sh $AZURE_URL
   \`\`\`
3. Verify the TBWA branding visually:
   - Yellow (#ffc300) and blue (#005bbb) brand colors should be visible
   - KPI tiles should have yellow top borders
   - Components should use the TBWA theme styling

## CSS Files Verification

| File | Status | Notes |
|------|--------|-------|
| variables.css | ✅ Included | Defines CSS custom properties including TBWA brand colors |
| tbwa-theme.css | ✅ Included | Applies the theme using CSS variables |
| dashboard.css | ✅ Included | Applies additional styling based on the theme |

## Deployment Package

The deployment package is ready for upload to Azure Static Web Apps:
\`$OUTPUT_DIR/$DEPLOY_ZIP\`

## Post-Deployment Verification

After deploying to Azure, verify the content-type headers for CSS files:
\`\`\`bash
curl -I $AZURE_URL/css/variables.css | grep -i content-type
curl -I $AZURE_URL/css/tbwa-theme.css | grep -i content-type
curl -I $AZURE_URL/css/dashboard.css | grep -i content-type
\`\`\`

All should return: \`content-type: text/css\`
EOF
    
    log "${GREEN}Verification report created: $report_file${NC}"
}

# Step 7: Generate Azure deployment instructions
generate_deployment_instructions() {
    log "${BLUE}Generating Azure deployment instructions...${NC}"
    
    local instructions_file="$BASE_DIR/AZURE_DEPLOYMENT_INSTRUCTIONS.md"
    
    cat > "$instructions_file" << EOF
# Azure Static Web App Deployment Instructions

This document provides automated instructions for deploying the fixed Client360 Dashboard to Azure Static Web App.

## Prerequisites

- Azure CLI installed and authenticated
- Appropriate permissions to deploy to the Azure Static Web App

## Deployment Steps

1. **Log in to Azure (if not already logged in)**:
   \`\`\`bash
   az login
   \`\`\`

2. **Deploy using Azure CLI**:
   \`\`\`bash
   # Set variables
   RESOURCE_GROUP="InsightPulseAI-RG"
   STATIC_WEB_APP_NAME="tbwa-client360-dashboard"
   DEPLOYMENT_PACKAGE="$OUTPUT_DIR/$DEPLOY_ZIP"

   # Deploy to Azure Static Web App
   az staticwebapp deploy \\
     --name \$STATIC_WEB_APP_NAME \\
     --resource-group \$RESOURCE_GROUP \\
     --source-path "$SOURCE_DIR"
   \`\`\`

3. **Alternative: Azure Static Web Apps CLI**:
   If you have the SWA CLI installed, you can use:
   \`\`\`bash
   swa deploy "$SOURCE_DIR" --deployment-token <your-deployment-token>
   \`\`\`

4. **Alternative: Manual Upload via Azure Portal**:
   1. Log in to [Azure Portal](https://portal.azure.com)
   2. Navigate to the Static Web App resource
   3. Go to Deployment > Manual Deploy
   4. Upload the deployment package: \`$OUTPUT_DIR/$DEPLOY_ZIP\`

## Verification After Deployment

Run the verification script to check that CSS files are properly served:
\`\`\`bash
./verify_css_fix_final.sh $AZURE_URL
\`\`\`

View the verification report in:
\`$BASE_DIR/reports/verification_report_$BACKUP_SUFFIX.md\`
EOF
    
    log "${GREEN}Azure deployment instructions created: $instructions_file${NC}"
}

# Main function to run all steps
main() {
    log "${GREEN}Starting automated CSS fix and deployment preparation...${NC}"
    
    verify_requirements
    backup_deployment
    fix_html
    update_config
    verify_css_files
    create_deployment_package
    create_verification_report
    generate_deployment_instructions
    
    log "${GREEN}CSS fix and deployment preparation completed successfully!${NC}"
    log "${GREEN}The deployment package is ready: $OUTPUT_DIR/$DEPLOY_ZIP${NC}"
    log "${GREEN}Azure deployment instructions: $BASE_DIR/AZURE_DEPLOYMENT_INSTRUCTIONS.md${NC}"
    log "${GREEN}Verification report: $BASE_DIR/reports/verification_report_$BACKUP_SUFFIX.md${NC}"
    
    echo "-------------------------------------------------------------"
    echo "NEXT STEPS (Choose one method):"
    echo "-------------------------------------------------------------"
    echo "1. Deploy using Azure CLI:"
    echo "   az staticwebapp deploy \\"
    echo "     --name tbwa-client360-dashboard \\"
    echo "     --resource-group InsightPulseAI-RG \\"
    echo "     --source-path \"$SOURCE_DIR\""
    echo ""
    echo "2. Deploy using SWA CLI:"
    echo "   swa deploy \"$SOURCE_DIR\" --deployment-token <your-token>"
    echo ""
    echo "3. Deploy manually via Azure Portal:"
    echo "   a. Login to Azure Portal"
    echo "   b. Navigate to the Static Web App resource"
    echo "   c. Go to Deployment > Manual Deploy"
    echo "   d. Upload the package: $OUTPUT_DIR/$DEPLOY_ZIP"
    echo "-------------------------------------------------------------"
    echo "After deployment, verify using: ./verify_css_fix_final.sh $AZURE_URL"
    echo "-------------------------------------------------------------"
}

# Run the main function
main