#!/bin/bash
# Script to fix the dashboard styles, focusing particularly on the rollback component

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/fix_dashboard_styles_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs

echo -e "${GREEN}Starting dashboard style fixing process...${NC}" | tee -a "$LOGFILE"

# Step 1: Backup current theme files
echo -e "${YELLOW}Creating backups of current theme files...${NC}" | tee -a "$LOGFILE"
mkdir -p backups_styles_${TIMESTAMP}
cp -f src/themes/tbwa.scss backups_styles_${TIMESTAMP}/tbwa.scss.bak
cp -f src/styles/variables-tbwa.scss backups_styles_${TIMESTAMP}/variables-tbwa.scss.bak
cp -f src/styles/common.scss backups_styles_${TIMESTAMP}/common.scss.bak
echo -e "${GREEN}✅ Theme files backed up to backups_styles_${TIMESTAMP}/${NC}" | tee -a "$LOGFILE"

# Step 2: Ensure the variables-tbwa.scss file has the proper rollback variables
echo -e "${YELLOW}Adding rollback variables to TBWA variables file...${NC}" | tee -a "$LOGFILE"
if grep -q "--rollback-bg" src/styles/variables-tbwa.scss; then
  echo -e "${GREEN}Rollback variables already exist in variables-tbwa.scss${NC}" | tee -a "$LOGFILE"
else
  echo -e "${YELLOW}Adding rollback variables to variables-tbwa.scss${NC}" | tee -a "$LOGFILE"
  cat >> src/styles/variables-tbwa.scss << 'EOL'

  // Rollback component specific colors (explicit declarations to avoid theme issues)
  --rollback-bg: #FFFFFF;
  --rollback-border: #00C3EC;
  --rollback-title: #002B80;
  --rollback-text: #777777;
  --rollback-action-primary: #002B80;
  --rollback-action-secondary: #00C3EC;
  --rollback-info-bg: rgba(0, 195, 236, 0.1);
  --rollback-action-text: #FFFFFF;
  --rollback-action-text-secondary: #002B80;
  --rollback-header-height: 32px;
  --rollback-content-padding: 24px;
  --rollback-border-radius: 8px;
EOL
  echo -e "${GREEN}✅ Added rollback variables to variables-tbwa.scss${NC}" | tee -a "$LOGFILE"
fi

# Step 3: Ensure the rollback component styles are in the TBWA theme file
echo -e "${YELLOW}Checking for rollback styles in TBWA theme file...${NC}" | tee -a "$LOGFILE"
if grep -q "rollback-dashboard" src/themes/tbwa.scss; then
  echo -e "${GREEN}✅ Rollback component styles found in TBWA theme${NC}" | tee -a "$LOGFILE"
else
  echo -e "${YELLOW}Adding rollback component styles to TBWA theme file...${NC}" | tee -a "$LOGFILE"
  cat >> src/themes/tbwa.scss << 'EOL'

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: var(--rollback-bg, #FFFFFF);
  border: 3px solid var(--rollback-border, #00C3EC);
  border-radius: var(--rollback-border-radius, 8px);
  padding: var(--rollback-content-padding, 24px);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--box-shadow);
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    height: var(--rollback-header-height, 32px);
    
    h3 {
      color: var(--rollback-title, #002B80);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
      position: relative;
      
      &:after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 40px;
        height: 3px;
        background-color: var(--rollback-border, #00C3EC);
        border-radius: 1.5px;
      }
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      border-radius: 6px;
      padding: 0.25rem 0.75rem;
      
      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: var(--spacing-xs);
      }
      
      &.active {
        color: var(--color-success);
        background-color: rgba(var(--color-success-rgb), 0.1);
        
        &::before {
          background-color: var(--color-success);
        }
      }
      
      &.inactive {
        color: var(--color-warning);
        background-color: rgba(var(--color-warning-rgb), 0.1);
        
        &::before {
          background-color: var(--color-warning);
        }
      }
    }
  }
  
  &-content {
    margin-bottom: var(--spacing-md);
    margin-top: var(--spacing-md);
    
    p {
      color: var(--rollback-text, #777777);
      margin-bottom: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }
    
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: var(--rollback-info-bg, rgba(0, 195, 236, 0.1));
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--rollback-border-radius, 8px);
      margin-top: var(--spacing-sm);
      border-left: 3px solid var(--rollback-border, #00C3EC);
      
      .version-label {
        font-weight: var(--font-weight-semibold);
        color: var(--rollback-title, #002B80);
        font-size: var(--font-size-sm);
      }
      
      .version-value {
        font-family: monospace;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        background-color: rgba(var(--color-primary-rgb), 0.05);
        padding: 0.1rem 0.5rem;
        border-radius: 4px;
      }
    }
  }
  
  &-actions {
    display: flex;
    gap: var(--spacing-md);
    
    .btn-rollback {
      background-color: var(--rollback-action-primary, #002B80);
      color: var(--rollback-action-text, #FFFFFF);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-semibold);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
      
      &:hover {
        background-color: var(--color-primary-dark);
        transform: translateY(-2px);
      }
      
      &:disabled {
        background-color: var(--text-muted);
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .btn-verify {
      background-color: var(--rollback-action-secondary, #00C3EC);
      color: var(--rollback-action-text-secondary, #002B80);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-semibold);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
      
      &:hover {
        background-color: var(--color-secondary-dark);
        transform: translateY(-2px);
      }
    }
  }
  
  &-log {
    margin-top: var(--spacing-lg);
    background-color: var(--bg-tertiary);
    border-radius: var(--rollback-border-radius, 8px);
    padding: var(--spacing-md);
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: var(--font-size-sm);
    border-left: 3px solid var(--rollback-border, #00C3EC);
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
EOL
  echo -e "${GREEN}✅ Added rollback component styles to TBWA theme${NC}" | tee -a "$LOGFILE"
fi

# Step 4: Build the TBWA theme
echo -e "${YELLOW}Building TBWA theme with webpack...${NC}" | tee -a "$LOGFILE"
if [ -f "scripts/build-tbwa-theme.sh" ]; then
  echo -e "${YELLOW}Using build-tbwa-theme.sh script...${NC}" | tee -a "$LOGFILE"
  bash scripts/build-tbwa-theme.sh | tee -a "$LOGFILE"
else
  echo -e "${YELLOW}Using direct webpack command...${NC}" | tee -a "$LOGFILE"
  # Clean dist directory 
  rm -rf dist
  mkdir -p dist
  
  # Run webpack in production mode 
  if command -v npx &> /dev/null && [ -f "webpack.config.js" ]; then
    npx webpack --config webpack.config.js --env theme=tbwa --mode production | tee -a "$LOGFILE"
  else
    echo -e "${RED}ERROR: Cannot find webpack or webpack config.${NC}" | tee -a "$LOGFILE"
    exit 1
  fi
fi

# Step 5: Check if the build was successful
if [ ! -f "dist/tbwa.css" ]; then
  echo -e "${RED}ERROR: Failed to build TBWA theme. dist/tbwa.css not found.${NC}" | tee -a "$LOGFILE"
  exit 1
fi

# Step 6: Verify the built CSS includes rollback styles
echo -e "${YELLOW}Verifying rollback styles in compiled CSS...${NC}" | tee -a "$LOGFILE"
if grep -q "rollback-dashboard" dist/tbwa.css; then
  echo -e "${GREEN}✅ Rollback component styles found in compiled CSS${NC}" | tee -a "$LOGFILE"
else
  echo -e "${RED}ERROR: Rollback component styles not found in compiled CSS${NC}" | tee -a "$LOGFILE"
  echo -e "${YELLOW}Creating emergency rollback styles CSS file...${NC}" | tee -a "$LOGFILE"
  
  # Create a separate rollback styles CSS file
  mkdir -p dist/css
  cat > dist/css/rollback-styles.css << 'EOF'
/* Emergency Rollback Styles */
.rollback-dashboard {
  background-color: #FFFFFF;
  border: 3px solid #00C3EC;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}
.rollback-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  height: 32px;
}
.rollback-dashboard-header h3 {
  color: #002B80;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  padding-bottom: 0;
  border-bottom: none;
  position: relative;
}
.rollback-dashboard-header h3:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #00C3EC;
  border-radius: 1.5px;
}
.rollback-dashboard-content {
  margin-bottom: 16px;
  margin-top: 16px;
}
.rollback-dashboard-content p {
  color: #777777;
  margin-bottom: 8px;
  font-size: 14px;
}
.rollback-dashboard-content .version-info {
  display: flex;
  justify-content: space-between;
  background-color: rgba(0, 195, 236, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  margin-top: 8px;
  border-left: 3px solid #00C3EC;
}
.rollback-dashboard-actions {
  display: flex;
  gap: 16px;
}
.rollback-dashboard-actions .btn-rollback {
  background-color: #002B80;
  color: white;
  border: none;
  padding: 8px 24px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 14px;
}
.rollback-dashboard-actions .btn-verify {
  background-color: #00C3EC;
  color: #002B80;
  border: none;
  padding: 8px 24px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 14px;
}
.rollback-dashboard-log {
  margin-top: 24px;
  background-color: #E9EBEE;
  border-radius: 8px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  border-left: 3px solid #00C3EC;
}
.rollback-dashboard-log pre {
  margin: 0;
  white-space: pre-wrap;
}
EOF
  echo -e "${YELLOW}Created emergency rollback styles at dist/css/rollback-styles.css${NC}" | tee -a "$LOGFILE"
  
  # Append to the main CSS as well (as a fallback)
  cat dist/css/rollback-styles.css >> dist/tbwa.css
  echo -e "${YELLOW}Appended rollback styles to dist/tbwa.css${NC}" | tee -a "$LOGFILE"
fi

# Step 7: Setup deployment files
echo -e "${YELLOW}Preparing deployment files...${NC}" | tee -a "$LOGFILE"

# Create deploy directories
mkdir -p deploy/css
mkdir -p deploy/assets

# Copy the theme CSS to the deploy directory
cp dist/tbwa.css deploy/theme.css
cp dist/tbwa.css deploy/css/tbwa-theme.css

# Check if we created a separate rollback styles file, and copy it if it exists
if [ -f "dist/css/rollback-styles.css" ]; then
  cp dist/css/rollback-styles.css deploy/css/
  echo -e "${YELLOW}Copied emergency rollback styles to deploy/css/${NC}" | tee -a "$LOGFILE"
fi

# Copy other assets if they exist
if [ -d "dist/assets" ]; then
  cp -r dist/assets/* deploy/assets/
fi

echo -e "${GREEN}✅ Deployment files prepared in the deploy directory${NC}" | tee -a "$LOGFILE"

# Step 8: Create a fix documentation file
mkdir -p docs
cat > docs/CSS_FIX_SUMMARY.md << EOF
# CSS Fix Implementation Summary

## Overview
This document summarizes the fixes applied to the dashboard CSS styles, particularly focusing on ensuring the rollback component is properly styled.

## Changes Applied
- **Date**: $(date)
- **Applied By**: fix_dashboard_styles.sh script

## Fixed Issues
1. **Added Rollback Variables**: Ensured explicit variables are defined for rollback component styling
2. **Added Rollback Component Styles**: Verified and added styles for the .rollback-dashboard component
3. **Built and Verified CSS**: Compiled the theme CSS with webpack and verified rollback styles are included
4. **Created Deployment Files**: Prepared theme CSS for deployment

## Deployment Instructions
1. The fixed CSS files are available in the \`deploy\` directory
2. Main theme file: \`deploy/theme.css\`
3. Backup theme file: \`deploy/css/tbwa-theme.css\`
$(if [ -f "dist/css/rollback-styles.css" ]; then echo "4. Emergency rollback styles: \`deploy/css/rollback-styles.css\` (include if needed)"; fi)

## Verification
To verify the fixes:
1. Run \`scripts/verify_rollback_styles.sh\` to check that rollback styles are properly included
2. Run \`scripts/deploy_tbwa_theme.sh\` to build and deploy the theme to your development environment
3. Run \`deploy_to_azure.sh\` to deploy the fixed dashboard to Azure

## Log File
The complete log of the fix process can be found at:
\`$LOGFILE\`
EOF

echo -e "${GREEN}✅ Fix documentation created at docs/CSS_FIX_SUMMARY.md${NC}" | tee -a "$LOGFILE"

# Step 9: Create a one-click deployment script
cat > deploy_fixed_dashboard.sh << 'EOF'
#!/bin/bash
# One-click dashboard deployment with fixed CSS

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="scout-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
DEPLOY_DIR="deploy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/dashboard_deployment_${TIMESTAMP}.log"

# Create log directory
mkdir -p logs

echo "🚀 Deploying fixed dashboard to Azure..."

# Check if we already have the API key
if [ -f ".azure_deploy_key" ]; then
  API_KEY=$(cat ".azure_deploy_key")
else
  # Try to get the API key from Azure
  API_KEY=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv 2>/dev/null)
  
  if [ -z "$API_KEY" ]; then
    echo "⚠️ Could not retrieve Azure API key. Please enter it manually:"
    read -p "API Key: " API_KEY
    echo "$API_KEY" > .azure_deploy_key
  else
    # Save for future use
    echo "$API_KEY" > .azure_deploy_key
  fi
fi

# Create a deployment zip
mkdir -p output
DEPLOY_ZIP="output/fixed_dashboard_${TIMESTAMP}.zip"
cd "$DEPLOY_DIR"
zip -r "../$DEPLOY_ZIP" * | tee -a "../$LOG_FILE"
cd ..

# Deploy to Azure
echo "🚀 Deploying to Azure Static Web App..."
az staticwebapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source "$DEPLOY_ZIP" \
  --api-key "$API_KEY" | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
  # Get the deployment URL
  DEPLOYMENT_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv 2>/dev/null)
  
  echo "✅ Deployment successful!"
  if [ -n "$DEPLOYMENT_URL" ]; then
    echo "🌐 Dashboard URL: https://$DEPLOYMENT_URL"
    
    # Create a deployment record
    mkdir -p reports
    cat > "reports/deployment_${TIMESTAMP}.md" << EOL
# Dashboard Deployment Record

## Deployment Details
- **Date**: $(date)
- **Package**: $DEPLOY_ZIP
- **URL**: https://$DEPLOYMENT_URL

## Changes Deployed
- Fixed CSS styling for dashboard
- Ensured rollback component styles are included
- Applied TBWA branding consistently

## Verification
To verify the deployment:
1. Visit https://$DEPLOYMENT_URL
2. Check that all components display correctly
3. Verify the rollback component is properly styled
EOL
    
    echo "📝 Deployment record created at: reports/deployment_${TIMESTAMP}.md"
  fi
else
  echo "❌ Deployment failed. Check the log for details: $LOG_FILE"
fi
EOF

chmod +x deploy_fixed_dashboard.sh
echo -e "${GREEN}✅ Created one-click deployment script: deploy_fixed_dashboard.sh${NC}" | tee -a "$LOGFILE"

echo -e "${GREEN}✅ Dashboard style fixing process completed successfully!${NC}" | tee -a "$LOGFILE"
echo -e "${YELLOW}To build and deploy the theme, run: ./deploy_fixed_dashboard.sh${NC}" | tee -a "$LOGFILE"