#!/bin/bash
# One-Click Fix Script for Client360 Dashboard CSS Issues
# This script combines all steps into a single automated process

set -e

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Log file
LOG_FILE="$BASE_DIR/logs/one_click_fix_$(date +"%Y%m%d%H%M%S").log"
mkdir -p "$BASE_DIR/logs"
touch "$LOG_FILE"

# Function to log with timestamps
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Display banner
display_banner() {
    echo "========================================================"
    echo "  TBWA Client360 Dashboard CSS Fix - One-Click Solution "
    echo "========================================================"
    echo ""
    log "Starting One-Click Fix for Client360 Dashboard CSS Issues"
}

# Create temporary trap to ensure log is properly closed if script exits
exit_handler() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log "Script exited with an error (code: $exit_code)"
    else
        log "Script completed successfully"
    fi
    echo ""
    echo "========================================================"
    echo "  Fix process complete! Check the log for details:      "
    echo "  $LOG_FILE"
    echo "========================================================"
    exit $exit_code
}
trap exit_handler EXIT

# Check all scripts exist
check_scripts() {
    log "Checking if all required scripts exist..."
    local missing_scripts=false
    
    for script in "automate_css_fix_deployment.sh" "verify_css_fix_headless.sh"; do
        if [ ! -f "$BASE_DIR/$script" ]; then
            log "Error: Required script $script not found"
            missing_scripts=true
        fi
    done
    
    if [ "$missing_scripts" = true ]; then
        log "Error: Some required scripts are missing. Cannot continue."
        exit 1
    fi
    
    log "All required scripts exist"
}

# Ensure all scripts are executable
make_scripts_executable() {
    log "Making all scripts executable..."
    chmod +x "$BASE_DIR/automate_css_fix_deployment.sh"
    chmod +x "$BASE_DIR/verify_css_fix_headless.sh"
    log "All scripts are now executable"
}

# Run the automated CSS fix script
run_automated_fix() {
    log "Running automated CSS fix script..."
    "$BASE_DIR/automate_css_fix_deployment.sh"
    log "Automated CSS fix completed"
}

# Function to find the latest deployment package
find_latest_package() {
    ls -t "$BASE_DIR/output"/client360_dashboard_*_*.zip 2>/dev/null | head -1
}

# Copy deployment package to Desktop for easy access
copy_to_desktop() {
    log "Copying deployment package to Desktop..."
    
    local package=$(find_latest_package)
    if [ -z "$package" ]; then
        log "No deployment package found"
        return 1
    fi
    
    local desktop_dir="$HOME/Desktop"
    cp "$package" "$desktop_dir/"
    log "Deployment package copied to: $desktop_dir/$(basename "$package")"
}

# Create a detailed README for the fix
create_fix_readme() {
    log "Creating detailed README for the fix..."
    
    local package=$(find_latest_package)
    if [ -z "$package" ]; then
        log "No deployment package found"
        return 1
    fi
    
    local readme_file="$BASE_DIR/CSS_FIX_README.md"
    
    cat > "$readme_file" << EOF
# TBWA Client360 Dashboard CSS Fix

## Overview

This document provides a summary of the CSS styling fix applied to the TBWA Client360 Dashboard.

## Issues Fixed

1. **Missing CSS References**: Added the missing reference to variables.css in the HTML head
2. **Incorrect CSS Load Order**: Ensured proper load order (variables → theme → dashboard)
3. **Content-Type Headers**: Updated Azure configuration to serve CSS with proper headers
4. **Configuration Updates**: Enhanced staticwebapp.config.json with proper MIME types

## Deployment Package

A deployment package has been created and is ready for use:
\`$(basename "$package")\`

This package has been copied to your Desktop for easy access.

## Deployment Instructions

### Option 1: Azure CLI (Recommended)

If you have the Azure CLI installed and configured:

\`\`\`bash
# Set variables
RESOURCE_GROUP="InsightPulseAI-RG"
STATIC_WEB_APP_NAME="tbwa-client360-dashboard"

# Deploy to Azure Static Web App
az staticwebapp deploy \\
  --name \$STATIC_WEB_APP_NAME \\
  --resource-group \$RESOURCE_GROUP \\
  --source-path "$BASE_DIR/deploy"
\`\`\`

### Option 2: Azure Portal (Manual)

1. Log in to [Azure Portal](https://portal.azure.com)
2. Navigate to the "tbwa-client360-dashboard" Static Web App resource
3. Go to Deployment > Manual Deploy
4. Upload the deployment package from your Desktop

## Verification

After deployment, run the verification script:

\`\`\`bash
$BASE_DIR/verify_css_fix_headless.sh
\`\`\`

This will check if:
- CSS files are being served with the correct content-type headers
- HTML references all required CSS files
- Azure configuration is properly set up

## Visual Verification

After successful deployment, visually verify:
- TBWA branding colors (yellow #ffc300 and blue #005bbb) appear correctly
- KPI tiles have yellow top borders
- All dashboard components use the proper styling

## Support

If issues persist after deployment, please review the logs in the \`logs\` directory and the verification reports in the \`reports\` directory.
EOF
    
    log "Fix README created: $readme_file"
}

# Main function
main() {
    display_banner
    check_scripts
    make_scripts_executable
    run_automated_fix
    copy_to_desktop
    create_fix_readme
    
    local package=$(find_latest_package)
    
    # Final instructions
    echo ""
    echo "========================================================"
    echo "  NEXT STEPS:                                           "
    echo "========================================================"
    echo ""
    echo "  1. Deploy using Azure CLI (if available):             "
    echo "     az staticwebapp deploy \\                           "
    echo "       --name tbwa-client360-dashboard \\                "
    echo "       --resource-group InsightPulseAI-RG \\             "
    echo "       --source-path \"$BASE_DIR/deploy\"                 "
    echo ""
    echo "  2. OR Deploy manually via Azure Portal:               "
    echo "     - Login to Azure Portal                            "
    echo "     - Navigate to the Static Web App resource          "
    echo "     - Go to Deployment > Manual Deploy                 "
    echo "     - Upload: $HOME/Desktop/$(basename "$package")     "
    echo ""
    echo "  3. After deployment, verify the fix:                  "
    echo "     $BASE_DIR/verify_css_fix_headless.sh               "
    echo ""
    echo "  Detailed instructions available in:                   "
    echo "  $BASE_DIR/CSS_FIX_README.md                           "
    echo ""
    echo "========================================================"
}

# Run the main function
main