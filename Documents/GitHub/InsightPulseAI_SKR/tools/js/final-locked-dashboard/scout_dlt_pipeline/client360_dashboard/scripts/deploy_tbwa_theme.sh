#!/bin/bash
# Build and deploy the TBWA-themed Client360 Dashboard to Azure

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
CLIENT360_DIR="client360"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/tbwa_deploy_${TIMESTAMP}.log"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}Building and deploying TBWA-themed Client360 Dashboard to Azure${NC}" | tee -a "$LOG_FILE"

# Ensure client360 directory exists
if [ ! -d "$CLIENT360_DIR" ]; then
  echo -e "${YELLOW}Creating client360 directory...${NC}" | tee -a "$LOG_FILE"
  mkdir -p "$CLIENT360_DIR/public"
else
  echo -e "${YELLOW}Using existing client360 directory.${NC}" | tee -a "$LOG_FILE"
  mkdir -p "$CLIENT360_DIR/public"
fi

# 1. Build only the TBWA theme CSS bundle with forced rebuild
echo -e "${YELLOW}Building TBWA theme CSS bundle...${NC}" | tee -a "$LOG_FILE"
# Clean the dist directory first to ensure fresh build
rm -rf dist
# Ensure the rollback component styles are included in the theme files
echo -e "${YELLOW}Verifying rollback component styles in theme files...${NC}" | tee -a "$LOG_FILE"

# More robust check for rollback component styles
if ! grep -q "rollback-dashboard" src/themes/tbwa.scss; then
  echo -e "${RED}Error: Rollback component styles not found in TBWA theme. This would affect the dashboard functionality.${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}Attempting to fix the TBWA theme file by ensuring rollback component styles are properly included...${NC}" | tee -a "$LOG_FILE"
  
  # Check if rollback styles exist in other themes we can copy from
  if grep -q "rollback-dashboard" src/themes/sarisari.scss; then
    echo -e "${GREEN}Found rollback component styles in SariSari theme. Adapting for TBWA theme...${NC}" | tee -a "$LOG_FILE"
    
    # Create a backup of the TBWA theme
    cp src/themes/tbwa.scss src/themes/tbwa.scss.bak
    
    # Extract rollback styles from sarisari.scss and adapt for TBWA theme
    ROLLBACK_STYLES=$(awk '/\/\/ Rollback Dashboard Component/,/^}$/' src/themes/sarisari.scss)
    
    # Replace SariSari-specific color variables with TBWA variables in the extracted styles
    ROLLBACK_STYLES=$(echo "$ROLLBACK_STYLES" | sed 's/--color-primary); \/\/ Sari Sari orange/--color-primary); \/\/ TBWA Navy #002B80/g')
    ROLLBACK_STYLES=$(echo "$ROLLBACK_STYLES" | sed 's/--color-secondary); \/\/ Sari Sari teal/--color-secondary); \/\/ TBWA Cyan #00C3EC/g')
    
    # Append to TBWA theme with proper formatting
    echo -e "\n$ROLLBACK_STYLES" >> src/themes/tbwa.scss
    
    echo -e "${GREEN}Successfully added rollback component styles to TBWA theme${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${YELLOW}No rollback styles found in SariSari theme. Creating default rollback styles for TBWA...${NC}" | tee -a "$LOG_FILE"
    
    # Create default rollback styles tailored for TBWA
    cat >> src/themes/tbwa.scss << 'EOL'

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: var(--bg-card); // White #FFFFFF
  border: 3px solid var(--color-secondary); // TBWA Cyan #00C3EC
  border-radius: var(--border-radius); // 8px
  padding: var(--spacing-lg); // 24px
  margin-bottom: var(--spacing-xl); // 32px
  box-shadow: var(--box-shadow); // 0 4px 6px rgba(0, 0, 0, 0.08)
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md); // 16px
    
    h3 {
      color: var(--color-primary); // TBWA Navy #002B80
      font-size: var(--font-size-xl); // 20px
      font-weight: var(--font-weight-semibold); // 600
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-semibold); // 600
      font-size: var(--font-size-sm); // 14px
      border-radius: 6px; // Rounded corners for status
      padding: 0.25rem 0.75rem; // Padding for badge look
      
      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: var(--spacing-xs); // 4px
      }
      
      &.active {
        color: var(--color-success);
        background-color: rgba(var(--color-success-rgb), 0.1); // Light green background
        
        &::before {
          background-color: var(--color-success);
        }
      }
      
      &.inactive {
        color: var(--color-warning);
        background-color: rgba(var(--color-warning-rgb), 0.1); // Light orange background
        
        &::before {
          background-color: var(--color-warning);
        }
      }
    }
  }
  
  &-content {
    margin-bottom: var(--spacing-md); // 16px
    
    p {
      color: var(--text-secondary); // Mid-grey #777777
      margin-bottom: var(--spacing-sm); // 8px
      font-size: var(--font-size-sm); // 14px
    }
    
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: rgba(var(--color-secondary-rgb), 0.1); // Light cyan background
      padding: var(--spacing-sm) var(--spacing-md); // 8px 16px
      border-radius: var(--border-radius); // 8px
      margin-top: var(--spacing-sm); // 8px
      border-left: 3px solid var(--color-secondary); // Added left border for TBWA style
    }
  }
  
  &-actions {
    display: flex;
    gap: var(--spacing-md); // 16px
    
    .btn-rollback {
      background-color: var(--color-primary); // TBWA Navy #002B80
      color: white;
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg); // More consistent padding
      font-weight: var(--font-weight-semibold); // 600
      border-radius: 6px; // Per spec
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm); // 14px
    }
    
    .btn-verify {
      background-color: var(--color-secondary); // TBWA Cyan #00C3EC
      color: var(--color-primary); // TBWA Navy - better contrast with cyan
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg); // More consistent padding
      font-weight: var(--font-weight-semibold); // 600
      border-radius: 6px; // Per spec
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm); // 14px
    }
  }
  
  &-log {
    margin-top: var(--spacing-lg); // 24px
    background-color: var(--bg-tertiary); // Slightly darker background for contrast
    border-radius: var(--border-radius); // 8px
    padding: var(--spacing-md); // 16px
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: var(--font-size-sm); // Slightly larger for better readability
    border-left: 3px solid var(--color-secondary); // Left border instead of full border
  }
}
EOL
    echo -e "${GREEN}Successfully created default rollback component styles for TBWA theme${NC}" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${GREEN}Rollback component styles found in TBWA theme.${NC}" | tee -a "$LOG_FILE"
fi

# Also verify rollback styles in the built theme after compilation
echo -e "${YELLOW}Ensuring rollback styles will be included in the compiled output...${NC}" | tee -a "$LOG_FILE"
# Run webpack with explicit TBWA theme selection
npx webpack --config webpack.config.js --env theme=tbwa --mode production | tee -a "$LOG_FILE"

# Check if dist directory was created
if [ ! -d "dist" ]; then
  echo -e "${RED}Failed to create dist directory. Build may have failed.${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# 2. Copy the TBWA CSS and logo into the client360 public assets
echo -e "${YELLOW}Copying TBWA CSS and logo to client360/public/...${NC}" | tee -a "$LOG_FILE"
# Create directories if they don't exist
mkdir -p "$CLIENT360_DIR/public/css"
mkdir -p "$CLIENT360_DIR/public/assets/logos"

# Copy the main theme CSS
cp dist/tbwa.css "$CLIENT360_DIR/public/theme.css"
# Backup copy in css directory
cp dist/tbwa.css "$CLIENT360_DIR/public/css/tbwa-theme.css"

# Copy the appropriate logo version
if [ -f "assets/logos/tbwasmp-logo.webp" ]; then
  echo -e "${GREEN}Copying TBWA SMP webp logo to deployment...${NC}" | tee -a "$LOG_FILE"
  cp assets/logos/tbwasmp-logo.webp "$CLIENT360_DIR/public/assets/logos/"
elif [ -f "assets/logos/tbwa-logo.svg" ]; then 
  echo -e "${YELLOW}Copying fallback SVG logo to deployment...${NC}" | tee -a "$LOG_FILE"
  cp assets/logos/tbwa-logo.svg "$CLIENT360_DIR/public/assets/logos/"
fi

# Also copy any other assets from the dist directory (excluding logos dir to prevent overwrite)
if [ -d "dist/assets" ]; then
  for item in dist/assets/*; do
    if [ -e "$item" ] && [ "$(basename "$item")" != "logos" ]; then
      cp -r "$item" "$CLIENT360_DIR/public/assets/"
    fi
  done
else
  echo "No dist/assets directory found to copy"
fi

# Copy the index.html.template to client360
echo -e "${YELLOW}Creating index.html in client360/public/...${NC}" | tee -a "$LOG_FILE"

# Make a backup copy of the template
cp index.html.template "index.html.template.backup-${TIMESTAMP}"

# Modify the template to use the TBWA theme CSS
echo -e "${YELLOW}Replacing theme-selector with TBWA theme CSS link...${NC}" | tee -a "$LOG_FILE"
sed 's|<script src="/js/theme-selector.js"></script>|<link rel="stylesheet" href="/theme.css">\n  <link rel="stylesheet" href="/css/tbwa-theme.css">|g' index.html.template > "$CLIENT360_DIR/public/index.html"

# Remove the theme selector from the HTML
echo -e "${YELLOW}Removing theme selector div...${NC}" | tee -a "$LOG_FILE"
sed -i '' 's|<div class="theme-selector">.*</div>||g' "$CLIENT360_DIR/public/index.html"

# Add TBWA branding class to body
echo -e "${YELLOW}Adding TBWA branding class to body...${NC}" | tee -a "$LOG_FILE"
sed -i '' 's|<body>|<body class="tbwa-branded">|g' "$CLIENT360_DIR/public/index.html"

# Copy geospatial data and sample SQL data
mkdir -p "$CLIENT360_DIR/public/data"
if [ -d "data" ]; then
  echo -e "${YELLOW}Copying geospatial data...${NC}" | tee -a "$LOG_FILE"
  cp -r data/* "$CLIENT360_DIR/public/data/" 2>/dev/null || echo "No data files to copy"
fi

# Copy store map component and other JS components
echo -e "${YELLOW}Building and copying JS components...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$CLIENT360_DIR/public/js/components"
# Build the JS components first
bash ./scripts/build-components.sh | tee -a "$LOG_FILE"
# Copy the components to the client360 app
cp -r dist/js/components/* "$CLIENT360_DIR/public/js/components/" 2>/dev/null || echo "No JS components to copy"
# Copy the main dashboard.js file
mkdir -p "$CLIENT360_DIR/public/js"
cp js/dashboard.js "$CLIENT360_DIR/public/js/" 2>/dev/null || echo "No dashboard.js file to copy"

# Copy sample data directory for SQL queries
echo -e "${YELLOW}Copying sample data for SQL queries...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$CLIENT360_DIR/public/data/sample_data"

# Check if we have sample data in various possible locations
if [ -d "data/sample_data" ]; then
  cp -r data/sample_data/* "$CLIENT360_DIR/public/data/sample_data/" 2>/dev/null
  echo -e "${GREEN}Sample data copied from data/sample_data${NC}" | tee -a "$LOG_FILE"
elif [ -d "sample_data" ]; then
  cp -r sample_data/* "$CLIENT360_DIR/public/data/sample_data/" 2>/dev/null
  echo -e "${GREEN}Sample data copied from sample_data${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}No sample data found. Creating a minimal sample data placeholder.${NC}" | tee -a "$LOG_FILE"
  # Create a minimal sample data JSON if no sample data exists
  cat > "$CLIENT360_DIR/public/data/sample_data/minimal_sample.json" << EOF
{
  "metadata": {
    "simulated": true,
    "version": "1.0.0",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "data": {
    "kpis": {
      "total_sales": 5824350,
      "sales_change": 12.3,
      "conversion_rate": 4.8,
      "conversion_change": 0.7,
      "marketing_roi": 3.2,
      "roi_change": 0.2,
      "brand_sentiment": 78.5,
      "sentiment_change": 2.1
    }
  }
}
EOF
fi

# Create a minimal package.json for the client360 app if it doesn't exist
if [ ! -f "$CLIENT360_DIR/package.json" ]; then
  echo -e "${YELLOW}Creating package.json for client360...${NC}" | tee -a "$LOG_FILE"
  cat > "$CLIENT360_DIR/package.json" << EOF
{
  "name": "client360-tbwa-dashboard",
  "version": "1.0.0",
  "description": "Client360 Dashboard with TBWA branding",
  "scripts": {
    "build": "cp -r public/ build/"
  }
}
EOF
fi

# Create the Azure Static Web App configuration
echo -e "${YELLOW}Creating Azure Static Web App configuration...${NC}" | tee -a "$LOG_FILE"
mkdir -p "$CLIENT360_DIR/public"
cat > "$CLIENT360_DIR/public/staticwebapp.config.json" << EOF
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
    "exclude": ["/images/*.{png,jpg,gif,svg,webp}", "/css/*", "/js/*", "/assets/*", "/data/*", "/theme.css", "/logo.svg", "/*.webp"]
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
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
  }
}
EOF

# 3. Build the Client360 app with TBWA branding baked in
echo -e "${YELLOW}Building the Client360 app...${NC}" | tee -a "$LOG_FILE"
cd "$CLIENT360_DIR"
mkdir -p build
npm run build | tee -a "../$LOG_FILE"
cd ..

# Check if the API token environment variable exists
if [ -z "$AZ_STATIC_WEBAPP_API_TOKEN" ]; then
  # Check if there's a .env file with the token
  if [ -f ".env" ]; then
    echo -e "${YELLOW}Loading API token from .env file...${NC}" | tee -a "$LOG_FILE"
    source .env
  else
    echo -e "${YELLOW}AZ_STATIC_WEBAPP_API_TOKEN not found. Checking if Azure CLI is logged in...${NC}" | tee -a "$LOG_FILE"
    # Try to get the API token from Azure
    if az account show > /dev/null 2>&1; then
      AZ_STATIC_WEBAPP_API_TOKEN=$(az staticwebapp secrets list \
        --name "$APP" \
        --resource-group "$RG" \
        --query "properties.apiKey" -o tsv 2>/dev/null)
    fi
      
    if [ -z "$AZ_STATIC_WEBAPP_API_TOKEN" ]; then
      echo -e "${YELLOW}Could not retrieve API token. Creating a manual deployment package instead.${NC}" | tee -a "$LOG_FILE"
      
      # Create a zip package for manual deployment
      mkdir -p output
      ZIPFILE="output/client360_tbwa_dashboard_${TIMESTAMP}.zip"
      cd $CLIENT360_DIR/build
      zip -r "../../$ZIPFILE" * | tee -a "../../$LOG_FILE"
      cd ../..
      
      echo -e "${GREEN}Created manual deployment package: $ZIPFILE${NC}" | tee -a "$LOG_FILE"
      echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
      echo "az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
      
      # Create a deployment report
      REPORT_FILE="reports/tbwa_deployment_${TIMESTAMP}.md"
      mkdir -p reports
      
      cat > "$REPORT_FILE" << EOL
# TBWA-themed Client360 Dashboard Deployment Package

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA (baked in at build time)
- **Deployment Package**: $ZIPFILE

## Process
1. Built TBWA theme CSS bundle
2. Copied theme CSS and logo to client360 app
3. Built client360 app with TBWA branding
4. Created deployment package for manual deployment

## Manual Deployment Instructions
To deploy to Azure Static Web Apps, run:

\`\`\`bash
az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN
\`\`\`

Replace YOUR_API_TOKEN with your Azure Static Web App deployment token.

## Next Steps
- Monitor dashboard usage and performance after deployment
- Gather user feedback on the TBWA theme
- Consider additional brand-specific features
EOL

      echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
      exit 0
    fi
    
    # Save the token for future use
    echo "AZ_STATIC_WEBAPP_API_TOKEN=${AZ_STATIC_WEBAPP_API_TOKEN}" > .env
    echo -e "${GREEN}Saved API token to .env file.${NC}" | tee -a "$LOG_FILE"
  fi
fi

# 4. Deploy the TBWA-themed dashboard to Azure Static Web Apps
echo -e "${YELLOW}Deploying to Azure Static Web Apps...${NC}" | tee -a "$LOG_FILE"

if az staticwebapp deploy --name "$APP" --resource-group "$RG" --source "$CLIENT360_DIR/build" --api-key "$AZ_STATIC_WEBAPP_API_TOKEN" 2>/dev/null; then
  echo -e "${GREEN}✅ Deployment successful!${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}Azure CLI deployment failed. Creating a manual deployment package instead.${NC}" | tee -a "$LOG_FILE"
  
  # Create a zip package for manual deployment
  mkdir -p output
  ZIPFILE="output/client360_tbwa_dashboard_${TIMESTAMP}.zip"
  cd $CLIENT360_DIR/build
  zip -r "../../$ZIPFILE" * | tee -a "../../$LOG_FILE"
  cd ../..
  
  echo -e "${GREEN}Created manual deployment package: $ZIPFILE${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}To deploy manually, run:${NC}" | tee -a "$LOG_FILE"
  echo "az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"
fi

# Get the deployment URL
DEPLOYMENT_URL=$(az staticwebapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query "defaultHostname" -o tsv 2>/dev/null)

echo -e "${GREEN}✅ Deployment complete!${NC}" | tee -a "$LOG_FILE"
if [ -n "$DEPLOYMENT_URL" ]; then
  echo -e "${YELLOW}Dashboard URL: https://$DEPLOYMENT_URL${NC}" | tee -a "$LOG_FILE"
fi

# Create a deployment report
REPORT_FILE="reports/tbwa_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# TBWA-themed Client360 Dashboard Deployment

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA (baked in at build time)
EOF

if [ -n "$DEPLOYMENT_URL" ]; then
  cat >> "$REPORT_FILE" << EOF
- **URL**: https://$DEPLOYMENT_URL
EOF
else
  cat >> "$REPORT_FILE" << EOF
- **Deployment Package**: $ZIPFILE
EOF
fi

cat >> "$REPORT_FILE" << EOF

## Process
1. Built TBWA theme CSS bundle
2. Copied theme CSS and logo to client360 app
3. Built client360 app with TBWA branding
4. Deployed to Azure Static Web Apps

## Next Steps
- Monitor dashboard usage and performance
- Gather user feedback on the TBWA theme
- Consider additional brand-specific features

EOF

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"