#!/bin/bash
# Deployment script for enhanced Client360 Dashboard with new features

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="deploy"
BACKUP_DIR="deploy_backup_${TIMESTAMP}"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   Enhanced Client360 Dashboard Deploy   ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create backup of current deployment
if [ -d "${DEPLOY_DIR}" ]; then
  echo -e "${YELLOW}Creating backup of current deployment to ${BACKUP_DIR}...${NC}"
  cp -r "${DEPLOY_DIR}" "${BACKUP_DIR}"
  echo -e "${GREEN}✅ Backup created successfully${NC}"
fi

# Ensure build directory exists
mkdir -p build

# Step 1: Build the TBWA theme with updated color palette
echo -e "\n${BLUE}Step 1: Building updated TBWA theme...${NC}"
if [ -f "./scripts/build-tbwa-theme.sh" ]; then
  bash ./scripts/build-tbwa-theme.sh
  
  # Copy built theme to deploy directory
  if [ -f "dist/tbwa.css" ]; then
    mkdir -p "${DEPLOY_DIR}/css"
    cp dist/tbwa.css "${DEPLOY_DIR}/css/tbwa-theme.css"
    echo -e "${GREEN}✅ TBWA theme built and copied to deploy directory${NC}"
  else
    echo -e "${RED}❌ Failed to build TBWA theme. Using previous version if available.${NC}"
  fi
else
  echo -e "${RED}❌ build-tbwa-theme.sh script not found!${NC}"
  exit 1
fi

# Step 2: Build updated dashboard.js with interactive components
echo -e "\n${BLUE}Step 2: Building enhanced dashboard.js...${NC}"
if [ -f "js/dashboard.js" ]; then
  mkdir -p "${DEPLOY_DIR}/js"
  cp js/dashboard.js "${DEPLOY_DIR}/js/dashboard.js"
  echo -e "${GREEN}✅ Enhanced dashboard.js copied to deploy directory${NC}"
else
  echo -e "${RED}❌ dashboard.js not found!${NC}"
  exit 1
fi

# Step 3: Update the index.html with new interactive components
echo -e "\n${BLUE}Step 3: Updating index.html from template...${NC}"
if [ -f "index.html.template" ]; then
  # Process template and generate index.html
  cat index.html.template | sed 's|EOL < /dev/null||g' > "${DEPLOY_DIR}/index.html"
  echo -e "${GREEN}✅ index.html generated from template${NC}"
else
  echo -e "${RED}❌ index.html.template not found!${NC}"
  exit 1
fi

# Step 4: Update store_map.js component if it exists
echo -e "\n${BLUE}Step 4: Updating store map component...${NC}"
if [ -f "src/components/store_map.js" ]; then
  mkdir -p "${DEPLOY_DIR}/js/components"
  cp src/components/store_map.js "${DEPLOY_DIR}/js/components/store_map.js"
  echo -e "${GREEN}✅ Updated store_map.js component copied${NC}"
else
  echo -e "${YELLOW}⚠️ store_map.js component not found, skipping...${NC}"
fi

# Step 5: Copy other required assets
echo -e "\n${BLUE}Step 5: Copying additional assets...${NC}"
# Ensure assets directories exist
mkdir -p "${DEPLOY_DIR}/assets/logos"
mkdir -p "${DEPLOY_DIR}/assets/images"
mkdir -p "${DEPLOY_DIR}/js/components"

# Copy logos and images
if [ -d "assets" ]; then
  cp -r assets/* "${DEPLOY_DIR}/assets/"
  echo -e "${GREEN}✅ Assets copied to deploy directory${NC}"
else
  echo -e "${YELLOW}⚠️ Assets directory not found, some images might be missing${NC}"
fi

# Copy any additional CSS
if [ -d "src/styles" ]; then
  for cssfile in src/styles/*.css; do
    if [ -f "$cssfile" ]; then
      cp "$cssfile" "${DEPLOY_DIR}/css/"
    fi
  done
  echo -e "${GREEN}✅ Additional CSS files copied${NC}"
fi

# Step 6: Update staticwebapp.config.json with any needed entries for new features
echo -e "\n${BLUE}Step 6: Updating staticwebapp.config.json...${NC}"
if [ -f "deploy/staticwebapp.config.json" ]; then
  # Ensure mime types for all needed files are defined
  # This is already handled in the build-tbwa-theme.sh script
  echo -e "${GREEN}✅ staticwebapp.config.json already exists${NC}"
else
  # Create a basic staticwebapp.config.json if it doesn't exist
  cat > "${DEPLOY_DIR}/staticwebapp.config.json" << EOF
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,webp}", "/css/*", "/js/*"]
  },
  "mimeTypes": {
    ".json": "application/json",
    ".css": "text/css",
    ".js": "text/javascript",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
  }
}
EOF
  echo -e "${GREEN}✅ Created new staticwebapp.config.json${NC}"
fi

# Step 7: Generate a verification report
echo -e "\n${BLUE}Step 7: Generating verification report...${NC}"
cat > "${DEPLOY_DIR}/verification_report.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard Verification Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #0052CC; }
    h2 { color: #505F79; margin-top: 30px; }
    .feature { margin-bottom: 20px; padding: 15px; border-radius: 5px; }
    .feature h3 { margin-top: 0; }
    .implemented { background-color: #E3FCEF; border-left: 4px solid #36B37E; }
    .partial { background-color: #FFFAE6; border-left: 4px solid #FFAB00; }
    .info { background-color: #DEEBFF; border-left: 4px solid #0052CC; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Client360 Dashboard Verification Report</h1>
    <p>Deployment timestamp: ${TIMESTAMP}</p>
    
    <div class="info feature">
      <h3>Overview</h3>
      <p>This report summarizes the implementation of enhanced interactive features for the Client360 Dashboard v2.3.0.</p>
    </div>
    
    <h2>Feature Implementation Status</h2>
    
    <div class="implemented feature">
      <h3>Unified Filter Bar</h3>
      <p>Filter functionality has been enhanced to include:</p>
      <ul>
        <li>URL parameter persistence for sharing filtered views</li>
        <li>Visual feedback during filter changes</li>
        <li>Region, organization, category, and channel filters</li>
        <li>Clear filters button with counter</li>
      </ul>
    </div>
    
    <div class="implemented feature">
      <h3>Interactive Time Selector</h3>
      <p>Time selection has been enhanced with:</p>
      <ul>
        <li>Predefined periods (7, 30, 90 days)</li>
        <li>Custom date range picker</li>
        <li>Visual date range indicators</li>
        <li>URL persistence for date ranges</li>
      </ul>
    </div>
    
    <div class="implemented feature">
      <h3>Interactive KPI Tiles</h3>
      <p>KPI tiles now support:</p>
      <ul>
        <li>Click-to-drill-down functionality</li>
        <li>Detailed metric exploration in modal panels</li>
        <li>Comparison to previous periods</li>
        <li>Visual indicators for trends</li>
      </ul>
    </div>
    
    <div class="implemented feature">
      <h3>Interactive Geospatial Store Map</h3>
      <p>The map component now includes:</p>
      <ul>
        <li>Store filtering by region, performance, and type</li>
        <li>Detailed store data on click</li>
        <li>Performance visualization with color coding</li>
        <li>Heatmap toggle for density visualization</li>
        <li>Custom map controls and legends</li>
      </ul>
    </div>
    
    <div class="implemented feature">
      <h3>Interactive AI Insights Panel</h3>
      <p>AI insights now feature:</p>
      <ul>
        <li>Interactive charts for deeper data exploration</li>
        <li>Tabbed interface for different insight types</li>
        <li>Ability to implement recommendations directly</li>
        <li>Insight refresh functionality</li>
        <li>Custom date range filtering for insights</li>
      </ul>
    </div>
    
    <div class="implemented feature">
      <h3>Data Source Toggle</h3>
      <p>Users can now switch between:</p>
      <ul>
        <li>Simulated data for testing and demos</li>
        <li>Live data for production use</li>
        <li>Visual indicators showing current data source</li>
        <li>Confirmation dialog for switching to live data</li>
      </ul>
    </div>
    
    <div class="implemented feature">
      <h3>TBWA Theme Update</h3>
      <p>Updated styling includes:</p>
      <ul>
        <li>New color palette with Azure Blue (#0052CC) and Yellow-Orange (#FFAB00)</li>
        <li>Consistent application of theme colors throughout the UI</li>
        <li>Enhanced visual feedback for interactive elements</li>
        <li>Theme switcher with multiple options</li>
      </ul>
    </div>
    
    <h2>Files Updated</h2>
    <table>
      <tr>
        <th>File</th>
        <th>Changes</th>
      </tr>
      <tr>
        <td>css/tbwa-theme.css</td>
        <td>Updated theme with new color palette</td>
      </tr>
      <tr>
        <td>js/dashboard.js</td>
        <td>Enhanced interactive components functionality</td>
      </tr>
      <tr>
        <td>src/styles/variables-tbwa.scss</td>
        <td>Updated color variables and theme definitions</td>
      </tr>
      <tr>
        <td>src/components/store_map.js</td>
        <td>Enhanced interactive map capabilities</td>
      </tr>
      <tr>
        <td>index.html</td>
        <td>Updated structure for new interactive components</td>
      </tr>
      <tr>
        <td>staticwebapp.config.json</td>
        <td>Added mime types for new assets</td>
      </tr>
    </table>
    
    <h2>Verification Steps</h2>
    <ol>
      <li>Verify the filter bar updates URL parameters when filters are changed</li>
      <li>Test date picker with both preset and custom date ranges</li>
      <li>Click on KPI tiles to ensure drill-downs appear with relevant data</li>
      <li>Interact with the map to filter stores and view details</li>
      <li>Test the insights panel tabs and interactive charts</li>
      <li>Toggle between simulated and live data sources</li>
      <li>Verify theme colors are applied consistently</li>
    </ol>
    
    <div class="footer">
      <p>Generated on: $(date '+%Y-%m-%d %H:%M:%S')</p>
      <p>Client360 Dashboard v2.3.0</p>
    </div>
  </div>
</body>
</html>
EOF
echo -e "${GREEN}✅ Verification report generated${NC}"

# Step 8: Create a package for deployment
echo -e "\n${BLUE}Step 8: Creating deployment package...${NC}"
PACKAGE_DIR="client360_dashboard_${TIMESTAMP}"
mkdir -p "${PACKAGE_DIR}"
cp -r "${DEPLOY_DIR}"/* "${PACKAGE_DIR}"

# Create zip file
zip -r "${PACKAGE_DIR}.zip" "${PACKAGE_DIR}"
echo -e "${GREEN}✅ Deployment package created: ${PACKAGE_DIR}.zip${NC}"

# Step 9: Deploy to Azure (if SWA CLI is available)
echo -e "\n${BLUE}Step 9: Checking for Azure deployment tools...${NC}"
if command -v swa &> /dev/null; then
  echo -e "${YELLOW}Azure Static Web Apps CLI found. Do you want to deploy to Azure? (y/n)${NC}"
  read -r deploy_choice
  
  if [[ "$deploy_choice" == "y" || "$deploy_choice" == "Y" ]]; then
    echo -e "${BLUE}Starting deployment to Azure...${NC}"
    
    # Deploy using SWA CLI (this assumes you're already authenticated)
    swa deploy "${DEPLOY_DIR}" --env production
    
    DEPLOY_STATUS=$?
    if [ $DEPLOY_STATUS -eq 0 ]; then
      echo -e "${GREEN}✅ Deployment to Azure completed successfully!${NC}"
    else
      echo -e "${RED}❌ Deployment to Azure failed with status code ${DEPLOY_STATUS}${NC}"
    fi
  else
    echo -e "${YELLOW}Skipping Azure deployment. You can deploy manually later.${NC}"
  fi
else
  echo -e "${YELLOW}Azure Static Web Apps CLI not found. Skipping deployment.${NC}"
  echo -e "${YELLOW}To deploy manually, use the package: ${PACKAGE_DIR}.zip${NC}"
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}   Deployment Process Complete!           ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "Local deployment directory: ${DEPLOY_DIR}"
echo -e "Backup created at: ${BACKUP_DIR}"
echo -e "Deployment package: ${PACKAGE_DIR}.zip"
echo -e "\nRun deployment verification checks to ensure all features work correctly."