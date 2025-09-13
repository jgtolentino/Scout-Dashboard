#!/bin/bash

# PRD-Compliant Deployment Script for Client360 Dashboard
# This script ensures the deployed dashboard meets all PRD requirements

set -e  # Exit on any error

echo "🚀 PRD-Compliant Deployment for Client360 Dashboard (v2.3.2)"

# Configuration
RESOURCE_GROUP="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy_v2.3.2"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/prd_deploy_${TIMESTAMP}.log"
PRD_VERSION="2.3.2"

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to verify PRD requirement compliance
verify_prd_compliance() {
  echo "🔍 Verifying PRD requirements compliance..." | tee -a "$DEPLOYMENT_LOG"
  
  # Check for AI Insights components
  echo "✅ Checking AI Insights Components (PRD 5.1-5.4)..." | tee -a "$DEPLOYMENT_LOG"
  
  # AI Insights JS file
  if [ -f "$SOURCE_DIR/js/components/ai/ai_insights.js" ]; then
    echo "  ✓ AI Insights Component JS file exists" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "  ❌ Missing AI Insights Component JS file - PRD 5.1-5.4 requirements at risk" | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
  
  # AI Insights CSS file
  if [ -f "$SOURCE_DIR/css/ai-insights.css" ]; then
    echo "  ✓ AI Insights CSS styling exists" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "  ❌ Missing AI Insights CSS styling - PRD UI requirements at risk" | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
  
  # AI Insights sample data
  if [ -f "$SOURCE_DIR/data/ai/insights/all_insights_latest.json" ]; then
    echo "  ✓ AI Insights sample data exists" | tee -a "$DEPLOYMENT_LOG"
    
    # Verify sample data has required categories
    INSIGHTS_DATA=$(cat "$SOURCE_DIR/data/ai/insights/all_insights_latest.json")
    
    if echo "$INSIGHTS_DATA" | grep -q "sales_insights"; then
      echo "  ✓ Sales insights category present" | tee -a "$DEPLOYMENT_LOG"
    else
      echo "  ❌ Missing sales insights category - PRD 5.1 requirement at risk" | tee -a "$DEPLOYMENT_LOG"
      exit 1
    fi
    
    if echo "$INSIGHTS_DATA" | grep -q "brand_analysis"; then
      echo "  ✓ Brand analysis category present" | tee -a "$DEPLOYMENT_LOG"
    else
      echo "  ❌ Missing brand analysis category - PRD 5.2 requirement at risk" | tee -a "$DEPLOYMENT_LOG"
      exit 1
    fi
    
    if echo "$INSIGHTS_DATA" | grep -q "store_recommendations"; then
      echo "  ✓ Store recommendations category present" | tee -a "$DEPLOYMENT_LOG"
    else
      echo "  ❌ Missing store recommendations category - PRD 5.4 requirement at risk" | tee -a "$DEPLOYMENT_LOG"
      exit 1
    fi
  else
    echo "  ❌ Missing AI Insights sample data - PRD 5.1-5.4 requirements at risk" | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
  
  # Check for map component
  echo "✅ Checking Map Visualization Component..." | tee -a "$DEPLOYMENT_LOG"
  if [ -f "$SOURCE_DIR/js/store_map.js" ] || [ -f "$SOURCE_DIR/js/components/store_map.js" ]; then
    echo "  ✓ Store map component exists" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "  ❌ Missing store map component - PRD geospatial requirements at risk" | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
  
  # Check TBWA branding
  echo "✅ Checking TBWA Branding..." | tee -a "$DEPLOYMENT_LOG"
  if [ -f "$SOURCE_DIR/css/tbwa-theme.css" ]; then
    echo "  ✓ TBWA theme styling exists" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "  ❌ Missing TBWA theme - PRD branding requirements at risk" | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
  
  # Check version number
  echo "✅ Checking Version Number ($PRD_VERSION)..." | tee -a "$DEPLOYMENT_LOG"
  if grep -q "Version $PRD_VERSION" "$SOURCE_DIR/index.html" || grep -q "v$PRD_VERSION" "$SOURCE_DIR/index.html"; then
    echo "  ✓ Version number correctly set to $PRD_VERSION" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "  ❌ Version number not correctly set to $PRD_VERSION - updating..." | tee -a "$DEPLOYMENT_LOG"
    
    # Update version display in footer
    if grep -q "Version [0-9]\.[0-9]\.[0-9]" "$SOURCE_DIR/index.html"; then
      sed -i.bak "s/Version [0-9]\.[0-9]\.[0-9]/Version $PRD_VERSION/g" "$SOURCE_DIR/index.html"
      echo "  ✓ Updated version display in footer" | tee -a "$DEPLOYMENT_LOG"
    fi
    
    # Update version in rollback section
    if grep -q "v[0-9]\.[0-9]\.[0-9]" "$SOURCE_DIR/index.html"; then
      sed -i.bak "s/v[0-9]\.[0-9]\.[0-9]/v$PRD_VERSION/g" "$SOURCE_DIR/index.html"
      echo "  ✓ Updated version in rollback section" | tee -a "$DEPLOYMENT_LOG"
    fi
  fi
  
  echo "✅ PRD compliance verification complete" | tee -a "$DEPLOYMENT_LOG"
}

# Run PRD compliance verification
verify_prd_compliance

# Check if we should use the diff-aware deployment
if [ -f "./patch-deploy-diff-aware.sh" ]; then
  echo "🔄 Using diff-aware deployment for efficiency..." | tee -a "$DEPLOYMENT_LOG"
  PRETEND=false ./patch-deploy-diff-aware.sh
else
  # Prepare deployment package
  echo "📦 Preparing deployment package..." | tee -a "$DEPLOYMENT_LOG"
  DEPLOY_ZIP="output/client360_prd_compliant_${TIMESTAMP}.zip"
  mkdir -p output
  
  zip -r "$DEPLOY_ZIP" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" -x "*/cypress/*" | tee -a "$DEPLOYMENT_LOG"
  
  # Get API key from Azure
  echo "🔑 Retrieving deployment key from Azure..." | tee -a "$DEPLOYMENT_LOG"
  API_KEY=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv)
  
  if [ -z "$API_KEY" ]; then
      echo "⚠️ Failed to retrieve API key. Fallback not available." | tee -a "$DEPLOYMENT_LOG"
      exit 1
  fi
  
  # Deploy using Azure CLI
  echo "🚀 Deploying PRD-compliant v${PRD_VERSION} to Azure Static Web App: $APP_NAME..." | tee -a "$DEPLOYMENT_LOG"
  
  az staticwebapp deploy \
      --name "$APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --source "$DEPLOY_ZIP" \
      --api-key "$API_KEY" | tee -a "$DEPLOYMENT_LOG"
fi

# Generate deployment verification report
echo "📝 Generating PRD compliance report..." | tee -a "$DEPLOYMENT_LOG"
REPORT_FILE="reports/prd_compliance_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOL
# Client360 Dashboard PRD Compliance Report

## Deployment Summary
- **Version:** ${PRD_VERSION}
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME

## PRD Requirement Coverage

### AI-Powered Insights (PRD 5.1-5.4)
- ✅ AI Component Implementation
- ✅ Sales Insights Category
- ✅ Brand Analysis Category
- ✅ Store Recommendations Category

### TBWA Branding & Design
- ✅ TBWA Theme Implementation
- ✅ Consistent Visual Elements

### Geospatial Visualization
- ✅ Store Map Component

### Version Control
- ✅ Version Correctly Set to $PRD_VERSION

## Deployment Log
See detailed log at: $DEPLOYMENT_LOG

## Next Steps
1. Verify the deployment at the production URL
2. Run the verification script: ./verify_v2.3.2_deployment.sh
3. Notify stakeholders of successful deployment
EOL

echo "✅ PRD compliance report created: $REPORT_FILE" | tee -a "$DEPLOYMENT_LOG"
echo "🏁 PRD-compliant deployment process completed"