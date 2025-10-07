#!/bin/bash
# Deploy the TBWA-themed Client360 Dashboard with FMCG sample data

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/fmcg_deploy_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs

echo -e "${GREEN}Deploying FMCG-focused Client360 Dashboard...${NC}" | tee -a "$LOG_FILE"

# 1. First ensure we have the FMCG sample data
if [ ! -f "data/sample_data/fmcg_sample_data.json" ]; then
  echo -e "${RED}Error: FMCG sample data not found at data/sample_data/fmcg_sample_data.json${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}Please run the deployment again after creating the FMCG sample data.${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# 2. Build the dashboard using the TBWA theme
echo -e "${YELLOW}Building dashboard with TBWA theme...${NC}" | tee -a "$LOG_FILE"
./scripts/deploy_tbwa_theme.sh 2>&1 | tee -a "$LOG_FILE"

# 3. Update the index.html to indicate FMCG focus
echo -e "${YELLOW}Updating index.html with FMCG branding...${NC}" | tee -a "$LOG_FILE"

# Update dashboard title in client360/public/index.html
if [ -f "client360/public/index.html" ]; then
  # Update the title to include FMCG
  sed -i '' 's|<title>Client360 Dashboard</title>|<title>FMCG Client360 Dashboard</title>|g' "client360/public/index.html"
  
  # Find and replace the dashboard heading if it exists
  if grep -q "<h1.*>Client360 Dashboard</h1>" "client360/public/index.html"; then
    sed -i '' 's|<h1.*>Client360 Dashboard</h1>|<h1 class="dashboard-title">FMCG Client360 Dashboard</h1>|g' "client360/public/index.html"
  fi
  
  # Add FMCG sample data loader script before closing body tag
  if ! grep -q "sample_data_loader.js" "client360/public/index.html"; then
    sed -i '' 's|</body>|<script src="/js/sample_data_loader.js"></script></body>|g' "client360/public/index.html"
  fi
  
  echo -e "${GREEN}✅ Updated index.html with FMCG branding${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${RED}Error: client360/public/index.html not found${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# 4. Copy FMCG README to client360 public directory
echo -e "${YELLOW}Copying FMCG documentation...${NC}" | tee -a "$LOG_FILE"
mkdir -p "client360/public/docs"
cp "data/sample_data/README_FMCG.md" "client360/public/docs/"

# 5. Ensure the sample data loader is in the public/js directory
echo -e "${YELLOW}Copying sample data loader...${NC}" | tee -a "$LOG_FILE"
mkdir -p "client360/public/js"
cp "js/sample_data_loader.js" "client360/public/js/"

# 6. Ensure FMCG sample data is in the public/data directory
echo -e "${YELLOW}Copying FMCG sample data...${NC}" | tee -a "$LOG_FILE"
mkdir -p "client360/public/data/sample_data"
cp "data/sample_data/fmcg_sample_data.json" "client360/public/data/sample_data/"

# 7. Build the final client360 dashboard with FMCG focus
echo -e "${YELLOW}Building final FMCG dashboard...${NC}" | tee -a "$LOG_FILE"
cd client360
mkdir -p build
cp -r public/* build/
cd ..

# 8. Create a deployment package
echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
mkdir -p output
ZIPFILE="output/fmcg_dashboard_${TIMESTAMP}.zip"
cd client360/build
zip -r "../../$ZIPFILE" * | tee -a "../../$LOG_FILE"
cd ../..

echo -e "${GREEN}✅ FMCG Dashboard deployment package created: $ZIPFILE${NC}" | tee -a "$LOG_FILE"

# 9. Create deployment report
REPORT_FILE="reports/fmcg_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# FMCG-Focused Client360 Dashboard Deployment

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA
- **Focus**: FMCG (Fast-Moving Consumer Goods)
- **Featured Brands**: Del Monte, Oishi, Alaska, Peerless
- **Deployment Package**: $ZIPFILE

## FMCG Sample Data Details
- 20 FMCG products across 4 brands
- 5 product categories (Beverage, Snack, Dairy, Household, Personal Care)
- Regional data across Philippines (NCR, Luzon, Visayas, Mindanao)
- Store type analysis for 5 retail formats
- AI-generated FMCG-specific insights and recommendations

## Deployment Process
1. Built TBWA-themed dashboard
2. Updated index.html with FMCG branding
3. Included FMCG-specific sample data loader
4. Created deployment package

## Deployment Instructions
To deploy to Azure Static Web Apps, run:

\`\`\`bash
az staticwebapp deploy --name tbwa-client360-dashboard-production --resource-group scout-dashboard --source $ZIPFILE --token YOUR_API_TOKEN
\`\`\`

Replace YOUR_API_TOKEN with your Azure Static Web App deployment token.

## Documentation
See \`docs/README_FMCG.md\` in the deployed dashboard for detailed information about the FMCG sample data.
EOF

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"

echo -e "${GREEN}FMCG Dashboard deployment complete!${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}To deploy to Azure, run:${NC}" | tee -a "$LOG_FILE"
echo -e "az staticwebapp deploy --name tbwa-client360-dashboard-production --resource-group scout-dashboard --source $ZIPFILE --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"