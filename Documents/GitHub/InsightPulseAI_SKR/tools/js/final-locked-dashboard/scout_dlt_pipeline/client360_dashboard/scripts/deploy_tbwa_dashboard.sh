#!/bin/bash
# Deploy the TBWA-themed Client360 Dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="output"
DEPLOY_DIR="deploy_tbwa_${TIMESTAMP}"
LOG_FILE="logs/tbwa_deploy_${TIMESTAMP}.log"
REPORT_FILE="reports/tbwa_deployment_${TIMESTAMP}.md"
ZIP_FILE="${OUTPUT_DIR}/tbwa_client360_dashboard_v2.3.0_${TIMESTAMP}.zip"

# Make sure directories exist
mkdir -p logs reports ${OUTPUT_DIR} ${DEPLOY_DIR}/css ${DEPLOY_DIR}/js/components ${DEPLOY_DIR}/data

echo -e "${GREEN}Starting TBWA-themed dashboard deployment process...${NC}" | tee -a "$LOG_FILE"

# Step 1: Build the TBWA theme
echo -e "${YELLOW}Building TBWA theme...${NC}" | tee -a "$LOG_FILE"
./scripts/build-tbwa-theme.sh | tee -a "$LOG_FILE"

# Step 2: Copy theme files to deployment directory
echo -e "${YELLOW}Copying theme files to deployment directory...${NC}" | tee -a "$LOG_FILE"
cp dist/tbwa.css "${DEPLOY_DIR}/css/tbwa-theme.css"
cp dist/assets/tbwa-logo.svg "${DEPLOY_DIR}/assets/tbwa-logo.svg" 2>/dev/null || mkdir -p "${DEPLOY_DIR}/assets" && cp dist/assets/tbwa-logo.svg "${DEPLOY_DIR}/assets/tbwa-logo.svg"

# Copy main CSS files
cp -r static/css/* "${DEPLOY_DIR}/css/" 2>/dev/null || echo "No static CSS files to copy"

# Step 3: Copy JS files
echo -e "${YELLOW}Copying JavaScript files...${NC}" | tee -a "$LOG_FILE"
cp static/js/theme-selector.js "${DEPLOY_DIR}/js/"
cp -r static/js/components/* "${DEPLOY_DIR}/js/components/" 2>/dev/null || echo "No component JS files to copy"

# Step 4: Copy data files
echo -e "${YELLOW}Copying data files...${NC}" | tee -a "$LOG_FILE"
cp data/*.geojson "${DEPLOY_DIR}/data/" 2>/dev/null || echo "No GeoJSON files to copy"
cp data/*.js "${DEPLOY_DIR}/data/" 2>/dev/null || echo "No data JS files to copy"

# Step 5: Create index.html with TBWA theme
echo -e "${YELLOW}Creating index.html with TBWA theme...${NC}" | tee -a "$LOG_FILE"

cat > "${DEPLOY_DIR}/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>TBWA Client360 Dashboard</title>
  
  <!-- TBWA Theme CSS -->
  <link rel="stylesheet" href="/css/tbwa-theme.css">
  
  <!-- Map libraries -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <header class="header">
    <div class="header-logo"></div>
    <div class="tbwa-disruption-banner">Disruption® Dashboard</div>
  </header>
  
  <div class="container">
    <div class="data-freshness">Data: Simulated | Last updated: ${TIMESTAMP}</div>
    
    <h1>TBWA Client360 Dashboard</h1>
    
    <div class="row">
      <div class="col">
        <div class="card kpi-card">
          <h3>Total Sales</h3>
          <div class="value">₱ 1.24M</div>
          <div class="change positive">+8.5% vs prev month</div>
        </div>
      </div>
      <div class="col">
        <div class="card kpi-card">
          <h3>Active Stores</h3>
          <div class="value">487</div>
          <div class="change positive">+12 new stores</div>
        </div>
      </div>
      <div class="col">
        <div class="card kpi-card">
          <h3>Avg. Order Value</h3>
          <div class="value">₱ 752</div>
          <div class="change negative">-2.3% vs prev month</div>
        </div>
      </div>
      <div class="col">
        <div class="card kpi-card">
          <h3>Product Categories</h3>
          <div class="value">32</div>
          <div class="change positive">+3 new categories</div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="card">
          <h2 class="chart-title">Store Map</h2>
          <div id="store-map" class="map-container"></div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="card">
          <h2 class="chart-title">Sales by Region</h2>
          <div class="chart-container" id="sales-by-region-chart"></div>
          <div class="tbwa-callout">
            <h3>Key Insight</h3>
            <p>The NCR region shows 32% growth in Q2, outperforming all other regions combined.</p>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <h2 class="chart-title">Top Selling Products</h2>
          <div class="chart-container" id="top-products-chart"></div>
          <button class="btn btn-tbwa">Export Data</button>
        </div>
      </div>
    </div>
  </div>
  
  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 TBWA | Client360 Dashboard v2.3.0</p>
    </div>
  </footer>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      initializeMap();
    });
    
    function initializeMap() {
      // Create the map if the container exists
      var mapContainer = document.getElementById('store-map');
      if (!mapContainer) return;
      
      // Initialize the map
      var map = L.map('store-map').setView([12.8797, 121.7740], 6); // Philippines
      
      // Add the tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add sample store markers (simulated data)
      var stores = [
        { name: "Manila Store", lat: 14.5995, lng: 120.9842, sales: 120000 },
        { name: "Cebu Store", lat: 10.3157, lng: 123.8854, sales: 98000 },
        { name: "Davao Store", lat: 7.1907, lng: 125.4553, sales: 87000 },
        { name: "Quezon City Store", lat: 14.6760, lng: 121.0437, sales: 110000 },
        { name: "Baguio Store", lat: 16.4023, lng: 120.5960, sales: 76000 }
      ];
      
      // Add markers for each store
      stores.forEach(function(store) {
        var marker = L.marker([store.lat, store.lng]).addTo(map);
        marker.bindPopup("<b>" + store.name + "</b><br>Monthly Sales: ₱" + 
          (store.sales / 1000).toFixed(1) + "K");
      });
      
      // Add a simple polygon outline of the Philippines (simplified)
      fetch('/data/philippines_outline.geojson')
        .then(response => {
          if (!response.ok) {
            // If the file doesn't exist, use a simplified polygon
            var simplifiedPH = L.polygon([
              [18.5, 118.0], [18.2, 122.0], [7.0, 126.0], 
              [5.0, 125.0], [5.5, 120.0], [10.0, 117.5]
            ], {
              color: '#FF6B35',
              weight: 1,
              fillOpacity: 0.05
            }).addTo(map);
          } else {
            return response.json().then(data => {
              L.geoJSON(data, {
                style: {
                  color: '#FF6B35',
                  weight: 1,
                  fillOpacity: 0.05
                }
              }).addTo(map);
            });
          }
        })
        .catch(error => {
          console.error('Error loading Philippines outline:', error);
        });
    }
  </script>
</body>
</html>
EOF

# Step 6: Create staticwebapp.config.json
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}" | tee -a "$LOG_FILE"

cat > "${DEPLOY_DIR}/staticwebapp.config.json" << EOF
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*", "/assets/*", "/data/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.tile.openstreetmap.org https://*.azurestaticapps.net;",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".geojson": "application/json",
    ".css": "text/css",
    ".js": "text/javascript",
    ".html": "text/html",
    ".svg": "image/svg+xml"
  }
}
EOF

# Step 7: Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
mkdir -p "${OUTPUT_DIR}"
cd "${DEPLOY_DIR}"
zip -r "../${ZIP_FILE}" * | tee -a "../${LOG_FILE}"
cd ..

echo -e "${GREEN}✅ Deployment package created: ${ZIP_FILE}${NC}" | tee -a "$LOG_FILE"

# Step 8: Create deployment report
echo -e "${YELLOW}Creating deployment report...${NC}" | tee -a "$LOG_FILE"
mkdir -p reports

cat > "${REPORT_FILE}" << EOF
# TBWA-themed Client360 Dashboard Deployment

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA (baked in at build time)
- **Deployment Package**: ${ZIP_FILE}

## Files Included
- Custom TBWA theme CSS with branded styling
- TBWA logo and assets
- Geospatial data for store map
- Enhanced dashboard layout with TBWA branding elements
- Azure Static Web App configuration

## Deployment Instructions

To deploy to Azure Static Web Apps:

1. Upload the deployment package to Azure Static Web Apps
2. Use the staticwebapp.config.json for routing and configuration

### Manual Deployment
\`\`\`bash
az staticwebapp deploy --name <app-name> --resource-group <resource-group> --source ${ZIP_FILE} --token <deployment-token>
\`\`\`

## Features
- TBWA branded color scheme (primary yellow: #ffc300, black headers)
- Disruption® banner integration
- Enhanced KPI cards with TBWA styling
- Custom TBWA buttons and callout sections
- Interactive store map with Philippines data
- Responsive design for all device sizes

## Next Steps
- Monitor dashboard usage and performance after deployment
- Gather user feedback on the TBWA theme
- Consider adding additional brand-specific features in future updates
EOF

echo -e "${GREEN}✅ Deployment report created: ${REPORT_FILE}${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ TBWA-themed dashboard deployment process completed!${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}To deploy to Azure, run: az staticwebapp deploy --name <app-name> --resource-group <resource-group> --source ${ZIP_FILE} --token <deployment-token>${NC}" | tee -a "$LOG_FILE"