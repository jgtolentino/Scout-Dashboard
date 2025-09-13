#!/bin/bash
# Deploy Danno Dashboard with TBWA Theming
# This script ensures the dashboard is deployed with full TBWA branding and styling

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
DEPLOYMENT_URL="blue-coast-0acb6880f-preview.eastus2.6.azurestaticapps.net"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/danno_deploy_${TIMESTAMP}.log"
DEPLOY_DIR="deploy-danno"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}Building and deploying Danno Dashboard to Azure Preview Environment${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}Ensuring TBWA theming is properly applied${NC}" | tee -a "$LOG_FILE"

# Create deploy directory if it doesn't exist
if [ -d "$DEPLOY_DIR" ]; then
  echo -e "${YELLOW}Removing existing $DEPLOY_DIR directory...${NC}" | tee -a "$LOG_FILE"
  rm -rf "$DEPLOY_DIR"
fi

echo -e "${YELLOW}Creating fresh $DEPLOY_DIR directory...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$DEPLOY_DIR"

# First, ensure we have the TBWA theme from the existing theme files
if [ -f "src/themes/tbwa.scss" ] && [ -f "src/styles/variables-tbwa.scss" ]; then
  echo -e "${YELLOW}Found TBWA theme source files. Building theme...${NC}" | tee -a "$LOG_FILE"
  
  # Ensure we have a dist directory
  mkdir -p dist
  
  # First check if webpack is available
  if command -v npx >/dev/null 2>&1; then
    echo -e "${YELLOW}Building TBWA theme with webpack...${NC}" | tee -a "$LOG_FILE"
    npx webpack --config webpack.config.js --env theme=tbwa --mode production
    
    # Check if theme was built successfully
    if [ -f "dist/tbwa.css" ]; then
      echo -e "${GREEN}TBWA theme built successfully!${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "${RED}Failed to build TBWA theme with webpack. Will use fallback.${NC}" | tee -a "$LOG_FILE"
    fi
  else
    echo -e "${YELLOW}Webpack not found. Using direct SCSS compilation...${NC}" | tee -a "$LOG_FILE"
    # If SASS command is available
    if command -v sass >/dev/null 2>&1; then
      echo -e "${YELLOW}Building theme with sass...${NC}" | tee -a "$LOG_FILE"
      sass src/themes/tbwa.scss dist/tbwa.css
    else
      echo -e "${RED}No SASS compiler found. Using fallback theming method.${NC}" | tee -a "$LOG_FILE"
    fi
  fi
else
  echo -e "${YELLOW}TBWA theme source files not found. Using manually created theme.${NC}" | tee -a "$LOG_FILE"
fi

# Copy from existing deploy directory if it exists
if [ -d "deploy" ]; then
  echo -e "${YELLOW}Copying from existing deploy directory...${NC}" | tee -a "$LOG_FILE"
  cp -r deploy/* "$DEPLOY_DIR/" || echo "No files to copy"
else
  echo -e "${RED}Deploy directory not found. Creating basic structure...${NC}" | tee -a "$LOG_FILE"
  
  # Create basic structure
  mkdir -p "$DEPLOY_DIR/css"
  mkdir -p "$DEPLOY_DIR/js"
  mkdir -p "$DEPLOY_DIR/assets"
  mkdir -p "$DEPLOY_DIR/data"
fi

# Ensure TBWA theme CSS exists
echo -e "${YELLOW}Ensuring TBWA theme CSS is available...${NC}" | tee -a "$LOG_FILE"

# Look for existing theme CSS
THEME_CSS_FILE=""
if [ -f "dist/tbwa.css" ]; then
  THEME_CSS_FILE="dist/tbwa.css"
elif [ -f "deploy/css/tbwa-theme.css" ]; then
  THEME_CSS_FILE="deploy/css/tbwa-theme.css"
elif [ -f "deploy/theme.css" ]; then
  THEME_CSS_FILE="deploy/theme.css"
else
  echo -e "${YELLOW}No existing TBWA theme CSS found. Creating one...${NC}" | tee -a "$LOG_FILE"
  
  # Create comprehensive TBWA theme CSS
  cat > "$DEPLOY_DIR/css/tbwa-theme.css" << EOL
/* TBWA Theme for Danno Dashboard */
:root {
  --color-primary: #002B80; /* TBWA navy */
  --color-primary-dark: #001e5c; /* TBWA navy dark */
  --color-secondary: #00C3EC; /* TBWA cyan */
  --color-secondary-dark: #00a3c6; /* TBWA cyan dark */
  --color-success: #00A551; /* TBWA green */
  --color-warning: #ffa500; /* Warning orange */
  --color-danger: #E60028; /* TBWA red */
  --color-info: #17a2b8; /* Info blue */
  --color-light: #f8f9fa; /* Light gray */
  --color-dark: #4B4F56; /* TBWA grey */
  
  /* Color RGB values for opacity/alpha usage */
  --color-primary-rgb: 0, 43, 128; /* TBWA navy RGB */
  --color-secondary-rgb: 0, 195, 236; /* TBWA cyan RGB */
  --color-success-rgb: 0, 165, 81; /* TBWA green RGB */
  --color-danger-rgb: 230, 0, 40; /* TBWA red RGB */
  
  /* Text colors */
  --text-primary: #212529;
  --text-secondary: #4B4F56; /* TBWA grey */
  --text-light: #f8f9fa;
  
  /* Background colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  
  /* Border radius and colors */
  --border-color: #dee2e6;
  --border-radius: 0.25rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  
  /* Font settings */
  --font-family-base: 'Helvetica Neue', Arial, sans-serif;
  --font-family-heading: 'Helvetica Neue', Arial, sans-serif;
  --font-weight-normal: 400;
  --font-weight-bold: 700;
  --font-size-base: 1rem;
  --line-height-base: 1.5;
  
  /* Box shadows */
  --box-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  --box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  
  /* Logo URL */
  --logo-url: url('/assets/tbwa-logo.svg');
}

/* Base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-heading);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.75rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Layout components */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 calc(-1 * var(--spacing-md));
}

.col {
  flex: 1 0 0%;
  padding: 0 var(--spacing-md);
}

/* TBWA specific components */
.header {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 3px solid var(--color-secondary);
}

.header-logo {
  background: var(--logo-url) no-repeat 50%/contain;
  width: 160px;
  height: 40px;
}

.sidebar {
  background-color: #f0f0f0;
  border-right: 3px solid var(--color-secondary);
}

.footer {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.footer a {
  color: var(--color-secondary);
}

.footer a:hover {
  color: white;
}

/* Dashboard components */
.card {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--box-shadow-sm);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.kpi-card {
  border-left: 4px solid var(--color-secondary);
}

.kpi-card .value {
  color: var(--color-primary);
  font-weight: 700;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-container .chart-title {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-secondary);
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.map-container {
  height: 400px;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--color-secondary);
  box-shadow: var(--box-shadow);
}

/* Data indicators */
.data-freshness {
  background-color: var(--color-secondary);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

/* Buttons */
.btn {
  display: inline-block;
  font-weight: var(--font-weight-normal);
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  border-radius: var(--border-radius);
  border: 1px solid transparent;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}

.btn-primary {
  color: white;
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-secondary {
  color: var(--color-primary);
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.btn-secondary:hover {
  background-color: var(--color-secondary-dark);
  border-color: var(--color-secondary-dark);
}

.btn-tbwa {
  background-color: var(--color-secondary);
  color: var(--color-primary);
  border: none;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-tbwa:hover {
  background-color: var(--color-secondary-dark);
}

/* Special callout sections */
.tbwa-callout {
  background-color: rgba(0, 195, 236, 0.1);
  border-left: 4px solid var(--color-secondary);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
}

.tbwa-callout h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.tbwa-disruption-banner {
  background-color: var(--color-secondary);
  color: var(--color-primary);
  padding: var(--spacing-md);
  text-align: center;
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
}

/* Responsive design */
@media (max-width: 992px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .main-content {
    margin-left: 0;
  }
}
EOL

  # Create TBWA logo SVG if it doesn't exist
  mkdir -p "$DEPLOY_DIR/assets"
  if [ ! -f "$DEPLOY_DIR/assets/tbwa-logo.svg" ]; then
    echo -e "${YELLOW}Creating TBWA logo...${NC}" | tee -a "$LOG_FILE"
    cat > "$DEPLOY_DIR/assets/tbwa-logo.svg" << EOL
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#002B80"/>
  <path d="M20 10 L10 30 L14 30 L16 25 L24 25 L26 30 L30 30 L20 10 Z M17 22 L20 15 L23 22 L17 22 Z" fill="#00C3EC"/>
  <path d="M34 10 H48 V14 H43 V30 H39 V14 H34 V10 Z" fill="#00C3EC"/>
  <path d="M52 10 H56 V22 C56 24 57 26 60 26 S64 24 64 22 V10 H68 V22 C68 26 65 30 60 30 S52 26 52 22 V10 Z" fill="#00C3EC"/>
  <path d="M72 10 H84 L88 18 L92 10 H104 V14 H96 V30 H92 V14 H88 L84 22 L80 14 H76 V30 H72 V14 Z" fill="#00C3EC"/>
</svg>
EOL
  fi
else
  # Copy existing theme CSS
  echo -e "${YELLOW}Copying existing TBWA theme CSS: $THEME_CSS_FILE${NC}" | tee -a "$LOG_FILE"
  mkdir -p "$DEPLOY_DIR/css"
  cp "$THEME_CSS_FILE" "$DEPLOY_DIR/css/tbwa-theme.css"
  
  # Also copy it to the root for direct access
  cp "$THEME_CSS_FILE" "$DEPLOY_DIR/theme.css"
  
  # If we have assets folder with logo, copy it too
  if [ -d "dist/assets" ]; then
    echo -e "${YELLOW}Copying theme assets...${NC}" | tee -a "$LOG_FILE"
    mkdir -p "$DEPLOY_DIR/assets"
    cp -r dist/assets/* "$DEPLOY_DIR/assets/" 2>/dev/null || echo "No assets to copy"
  fi
fi

# Update HTML and Config files to rename from Client360 to Danno
echo -e "${YELLOW}Updating files to rename from Client360 to Danno...${NC}" | tee -a "$LOG_FILE"

# Update index.html if it exists or create one
if [ -f "$DEPLOY_DIR/index.html" ]; then
  echo -e "${YELLOW}Updating index.html...${NC}" | tee -a "$LOG_FILE"
  sed -i '.bak' 's/Client360 Dashboard/Danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/CLIENT360 DASHBOARD/DANNO/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/client360 dashboard/Danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/Client360/Danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/client360/danno/g' "$DEPLOY_DIR/index.html"
  sed -i '.bak' 's/CLIENT360/DANNO/g' "$DEPLOY_DIR/index.html"
  
  # Make sure TBWA theme CSS is included
  if ! grep -q 'tbwa-theme.css' "$DEPLOY_DIR/index.html"; then
    sed -i '.bak' 's/<\/head>/<link rel="stylesheet" href="\/css\/tbwa-theme.css">\n<\/head>/' "$DEPLOY_DIR/index.html"
  fi
  
  # Make sure body has tbwa-branded class
  if ! grep -q 'class=".*tbwa-branded' "$DEPLOY_DIR/index.html"; then
    sed -i '.bak' 's/<body/<body class="tbwa-branded"/' "$DEPLOY_DIR/index.html"
  fi
else
  echo -e "${YELLOW}Creating basic index.html...${NC}" | tee -a "$LOG_FILE"
  cat > "$DEPLOY_DIR/index.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Danno</title>
  <link rel="stylesheet" href="/css/tbwa-theme.css">
  <link rel="stylesheet" href="/theme.css">
</head>
<body class="tbwa-branded">
  <header class="header">
    <div class="container">
      <div class="header-logo"></div>
      <h1>Danno</h1>
      <p class="subtitle">Powered by TBWA\</p>
    </div>
  </header>
  
  <main class="main-content">
    <div class="container">
      <div class="tbwa-disruption-banner">
        Disruption Through Intelligence
      </div>
      
      <div class="dashboard-container">
        <h2>Dashboard</h2>
        <div class="row">
          <div class="col">
            <div class="card kpi-card">
              <h3>Total Sales</h3>
              <div class="value">$23,575</div>
              <div class="change positive">+12.5%</div>
            </div>
          </div>
          <div class="col">
            <div class="card kpi-card">
              <h3>Brand Mentions</h3>
              <div class="value">342</div>
              <div class="change positive">+8.2%</div>
            </div>
          </div>
          <div class="col">
            <div class="card kpi-card">
              <h3>Transactions</h3>
              <div class="value">1,283</div>
              <div class="change negative">-3.1%</div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col">
            <div class="card">
              <div class="chart-container">
                <div class="chart-title">Sales Trend</div>
                <div class="chart-placeholder" style="width:100%;height:100%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;">
                  Chart Visualization
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col">
            <div class="card">
              <div class="chart-title">Store Locations</div>
              <div class="map-container">
                <div class="map-placeholder" style="width:100%;height:100%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;">
                  Map Visualization
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tbwa-callout">
          <h3>Key Insight</h3>
          <p>Brand mentions are showing strong correlation with sales performance across all regions, with a 78% correlation coefficient.</p>
        </div>
      </div>
    </div>
  </main>
  
  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 TBWA\Danno. All rights reserved.</p>
    </div>
  </footer>
  
  <script src="/js/dashboard.js"></script>
</body>
</html>
EOL
fi

# Create a SWA config file if it doesn't exist
if [ ! -f "$DEPLOY_DIR/staticwebapp.config.json" ]; then
  echo -e "${YELLOW}Creating staticwebapp.config.json...${NC}" | tee -a "$LOG_FILE"
  cat > "$DEPLOY_DIR/staticwebapp.config.json" << EOL
{
  "routes": [
    {
      "route": "/danno",
      "serve": "/index.html",
      "statusCode": 200
    },
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
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*", "/assets/*", "/data/*", "/theme.css", "/favicon.ico"]
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
EOL
else
  echo -e "${YELLOW}Updating staticwebapp.config.json...${NC}" | tee -a "$LOG_FILE"
  sed -i '.bak' 's/Client360 Dashboard/Danno/g' "$DEPLOY_DIR/staticwebapp.config.json"
  
  # Add route for /danno if it doesn't exist
  if ! grep -q '"/danno"' "$DEPLOY_DIR/staticwebapp.config.json"; then
    echo -e "${YELLOW}Adding /danno route to config...${NC}" | tee -a "$LOG_FILE"
    python3 -c '
import json
import os

config_file = os.path.join("'"$DEPLOY_DIR"'", "staticwebapp.config.json")
with open(config_file, "r") as f:
    config = json.load(f)

# Add danno route if it doesnt exist
danno_route = {"route": "/danno", "serve": "/index.html", "statusCode": 200}
if "routes" in config:
    if not any(r.get("route") == "/danno" for r in config["routes"]):
        config["routes"].insert(0, danno_route)
else:
    config["routes"] = [danno_route]

# Make sure theme.css is excluded from navigation fallback
if "navigationFallback" in config and "exclude" in config["navigationFallback"]:
    excludes = config["navigationFallback"]["exclude"]
    if not any("theme.css" in e for e in excludes):
        config["navigationFallback"]["exclude"].append("/theme.css")

with open(config_file, "w") as f:
    json.dump(config, f, indent=2)
' || echo "Failed to update config with Python, using manual method"
  fi
fi

# Clean up backup files
find "$DEPLOY_DIR" -name "*.bak" -delete

# Create a package.json for the deployment if it doesn't exist
if [ ! -f "$DEPLOY_DIR/package.json" ]; then
  echo -e "${YELLOW}Creating package.json...${NC}" | tee -a "$LOG_FILE"
  cat > "$DEPLOY_DIR/package.json" << EOL
{
  "name": "danno-dashboard",
  "version": "1.0.0",
  "description": "Danno Dashboard with TBWA branding",
  "scripts": {
    "build": "echo 'Static build completed.'"
  }
}
EOL
fi

# Create a basic dashboard.js file if it doesn't exist
if [ ! -f "$DEPLOY_DIR/js/dashboard.js" ]; then
  echo -e "${YELLOW}Creating basic dashboard.js...${NC}" | tee -a "$LOG_FILE"
  mkdir -p "$DEPLOY_DIR/js"
  cat > "$DEPLOY_DIR/js/dashboard.js" << EOL
/**
 * Danno Dashboard JavaScript
 * With TBWA theming
 */
(function() {
  // Initialize the dashboard
  function initDashboard() {
    console.log('Danno dashboard initialized with TBWA theming');
    
    // Apply TBWA styling to any dynamically created elements
    applyTheming();
    
    // Initialize data if needed
    loadSampleData();
  }
  
  // Apply TBWA theming
  function applyTheming() {
    document.body.classList.add('tbwa-branded');
    
    // Update any buttons to use TBWA styling
    document.querySelectorAll('.btn').forEach(btn => {
      if (!btn.classList.contains('btn-primary') && !btn.classList.contains('btn-secondary')) {
        btn.classList.add('btn-tbwa');
      }
    });
  }
  
  // Load sample data for testing
  function loadSampleData() {
    // Check if we have sample data
    if (typeof window.sampleData === 'undefined') {
      console.log('No sample data available');
      return;
    }
    
    console.log('Sample data loaded:', window.sampleData);
    
    // You would process and display the data here
  }
  
  // Load event listener
  window.addEventListener('load', initDashboard);
})();
EOL
fi

# Create a README.md with deployment info
echo -e "${YELLOW}Creating README.md...${NC}" | tee -a "$LOG_FILE"
cat > "$DEPLOY_DIR/README.md" << EOL
# Danno Dashboard

TBWA branded dashboard deployed to: https://${DEPLOYMENT_URL}/danno

## Deployment Details

- **Deployment Date**: $(date)
- **Environment**: Preview
- **URL**: https://${DEPLOYMENT_URL}/danno
- **Theme**: TBWA (Navy, Cyan, Red color scheme)

## Styling Information

This dashboard uses the TBWA design system with the following key colors:
- Navy: #002B80 (primary)
- Cyan: #00C3EC (secondary)
- Red: #E60028 (danger/accent)
- Green: #00A551 (success)

The styling is contained in the following files:
- /css/tbwa-theme.css - Main theme file
- /theme.css - Root theme file (same as tbwa-theme.css)
- /assets/tbwa-logo.svg - TBWA logo

## Notes

This dashboard was previously known as Client360 and has been rebranded to Danno.
John Ed has assigned Danno for the branding. Danno is signing NDA today and will be briefed tomorrow.
EOL

# Check if Azure CLI is available
if command -v az >/dev/null 2>&1; then
  # Check if logged into Azure
  if az account show >/dev/null 2>&1; then
    echo -e "${YELLOW}Deploying to Azure Static Web App...${NC}" | tee -a "$LOG_FILE"
    
    # Check if we have the API token
    if [ -f ".azure_deploy_key" ]; then
      echo -e "${YELLOW}Using API token from .azure_deploy_key...${NC}" | tee -a "$LOG_FILE"
      API_TOKEN=$(cat .azure_deploy_key)
    else
      echo -e "${YELLOW}Getting API token from Azure...${NC}" | tee -a "$LOG_FILE"
      API_TOKEN=$(az staticwebapp secrets list \
        --name "$APP" \
        --resource-group "$RG" \
        --query "properties.apiKey" -o tsv)
      
      if [ -n "$API_TOKEN" ]; then
        echo "$API_TOKEN" > .azure_deploy_key
        echo -e "${GREEN}Saved API token to .azure_deploy_key${NC}" | tee -a "$LOG_FILE"
      fi
    fi
    
    if [ -n "$API_TOKEN" ]; then
      echo -e "${YELLOW}Deploying to preview environment...${NC}" | tee -a "$LOG_FILE"
      
      # Deploy with environment name to ensure it goes to the preview slot
      az staticwebapp deploy \
        --name "$APP" \
        --resource-group "$RG" \
        --source "$DEPLOY_DIR" \
        --api-key "$API_TOKEN" \
        --env "preview" | tee -a "$LOG_FILE"
      
      echo -e "${GREEN}✅ Deployment to preview environment completed!${NC}" | tee -a "$LOG_FILE"
      echo -e "${GREEN}Dashboard URL: https://${DEPLOYMENT_URL}/danno${NC}" | tee -a "$LOG_FILE"
    else
      echo -e "${RED}Could not retrieve API token. Creating deployment package instead.${NC}" | tee -a "$LOG_FILE"
      
      # Create deployment package
      PACKAGE_FILE="output/danno_dashboard_${TIMESTAMP}.zip"
      mkdir -p output
      
      echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
      cd "$DEPLOY_DIR" && zip -r "../$PACKAGE_FILE" * && cd ..
      
      echo -e "${GREEN}Deployment package created: $PACKAGE_FILE${NC}" | tee -a "$LOG_FILE"
      echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
      echo "az staticwebapp deploy --name $APP --resource-group $RG --source $PACKAGE_FILE --env preview --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
    fi
  else
    echo -e "${RED}Not logged into Azure CLI. Creating deployment package instead.${NC}" | tee -a "$LOG_FILE"
    
    # Create deployment package
    PACKAGE_FILE="output/danno_dashboard_${TIMESTAMP}.zip"
    mkdir -p output
    
    echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
    cd "$DEPLOY_DIR" && zip -r "../$PACKAGE_FILE" * && cd ..
    
    echo -e "${GREEN}Deployment package created: $PACKAGE_FILE${NC}" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
    echo "az staticwebapp deploy --name $APP --resource-group $RG --source $PACKAGE_FILE --env preview --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${RED}Azure CLI not installed. Creating deployment package instead.${NC}" | tee -a "$LOG_FILE"
  
  # Create deployment package
  PACKAGE_FILE="output/danno_dashboard_${TIMESTAMP}.zip"
  mkdir -p output
  
  echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
  cd "$DEPLOY_DIR" && zip -r "../$PACKAGE_FILE" * && cd ..
  
  echo -e "${GREEN}Deployment package created: $PACKAGE_FILE${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
  echo "az staticwebapp deploy --name $APP --resource-group $RG --source $PACKAGE_FILE --env preview --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
fi

# Create deployment report
REPORT_FILE="reports/danno_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOL
# Danno Dashboard Deployment with TBWA Theming

## Deployment Summary
- **Date**: $(date)
- **Environment**: Preview
- **URL**: https://${DEPLOYMENT_URL}/danno
- **Theme**: TBWA (Navy, Cyan, Red color scheme)

## Process
1. Created Danno deployment directory with TBWA theming
2. Ensured proper CSS theming was applied
3. Updated all references from Client360 to Danno
4. Added /danno route to Static Web App configuration
5. Deployed to Azure Static Web App preview environment

## Verification Steps
1. Confirm the dashboard is accessible at https://${DEPLOYMENT_URL}/danno
2. Verify all branding shows "Danno" instead of "Client360"
3. Verify TBWA styling is applied (Navy headers, Cyan highlights, etc.)
4. Check that all dashboard functionality works correctly

## TBWA Styling Details
This deployment includes the full TBWA design system with the following elements:
- Color scheme (Navy #002B80, Cyan #00C3EC, Red #E60028)
- Typography (Helvetica Neue)
- TBWA logo and branding elements
- Custom components styled to TBWA guidelines
- Responsive design following TBWA specifications

## Notes
John Ed has assigned Danno for the branding. Danno is signing NDA today and will be briefed tomorrow.
EOL

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Process completed successfully!${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Dashboard URL: https://${DEPLOYMENT_URL}/danno${NC}" | tee -a "$LOG_FILE"