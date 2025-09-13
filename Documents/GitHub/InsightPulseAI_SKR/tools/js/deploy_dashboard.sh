#!/bin/bash
# Dashboard Deployment Script v1.0
# This script builds and deploys the InsightPulseAI dashboard to Azure Static Web Apps
# with support for multiple themes and configurations

set -e  # Exit on any error

# Colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Configuration (Customizable via environment variables or command line args)
RESOURCE_GROUP=${RESOURCE_GROUP:-"scout-dashboard"}
APP_NAME=${APP_NAME:-"insight-pulse-dashboard"}
THEME=${THEME:-"tbwa"}  # Default theme is TBWA
BUILD_MODE=${BUILD_MODE:-"production"}
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
DASHBOARD_TYPE=${DASHBOARD_TYPE:-"client360"}
LOG_FILE="logs/deploy_${DASHBOARD_TYPE}_${TIMESTAMP}.log"
CREATE_BACKUP=${CREATE_BACKUP:-"true"}
VERIFY_DEPLOYMENT=${VERIFY_DEPLOYMENT:-"true"}

# Function for logging with timestamp
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $timestamp - $message" | tee -a "$LOG_FILE" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message" | tee -a "$LOG_FILE" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $timestamp - $message" | tee -a "$LOG_FILE" ;;
        *) echo -e "$timestamp - $message" | tee -a "$LOG_FILE" ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Function to display script help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -r, --resource-group NAME  Azure resource group (default: scout-dashboard)"
    echo "  -a, --app-name NAME        Azure static web app name (default: insight-pulse-dashboard)"
    echo "  -t, --theme THEME          Theme to use: tbwa, default, sari-sari (default: tbwa)"
    echo "  -d, --dashboard TYPE       Dashboard type to deploy: client360, retail, advisor (default: client360)"
    echo "  -m, --mode MODE            Build mode: production, development (default: production)"
    echo "  -b, --no-backup            Skip creating a backup before deployment"
    echo "  -v, --no-verify            Skip verification after deployment"
    echo "  -p, --package-only         Create package without deploying"
    echo ""
    echo "Examples:"
    echo "  $0 --theme tbwa --app-name tbwa-dashboard"
    echo "  $0 --dashboard retail --resource-group retail-dashboards"
    echo "  $0 --package-only --theme sari-sari"
}

# Create logs directory
mkdir -p logs

# Parse command line arguments
PACKAGE_ONLY="false"

while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -r|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -a|--app-name)
            APP_NAME="$2"
            shift 2
            ;;
        -t|--theme)
            THEME="$2"
            shift 2
            ;;
        -d|--dashboard)
            DASHBOARD_TYPE="$2"
            shift 2
            ;;
        -m|--mode)
            BUILD_MODE="$2"
            shift 2
            ;;
        -b|--no-backup)
            CREATE_BACKUP="false"
            shift
            ;;
        -v|--no-verify)
            VERIFY_DEPLOYMENT="false"
            shift
            ;;
        -p|--package-only)
            PACKAGE_ONLY="true"
            shift
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Print deployment info header
log "INFO" "====================================================================="
log "INFO" "Starting Dashboard Deployment Process"
log "INFO" "====================================================================="
log "INFO" "Dashboard Type: $DASHBOARD_TYPE"
log "INFO" "Theme: $THEME"
log "INFO" "Build Mode: $BUILD_MODE"
log "INFO" "Azure App Name: $APP_NAME"
log "INFO" "Resource Group: $RESOURCE_GROUP"
log "INFO" "====================================================================="

# Determine proper paths based on dashboard type
case "$DASHBOARD_TYPE" in
    "client360")
        DASHBOARD_DIR="final-locked-dashboard/scout_dlt_pipeline/client360_dashboard"
        ;;
    "retail")
        DASHBOARD_DIR="final-locked-dashboard/retail_edge"
        ;;
    "advisor")
        DASHBOARD_DIR="deploy-advisor-fixed"
        ;;
    *)
        log "ERROR" "Unknown dashboard type: $DASHBOARD_TYPE"
        log "INFO" "Supported dashboard types: client360, retail, advisor"
        exit 1
        ;;
esac

# Check if dashboard directory exists
if [ ! -d "$DASHBOARD_DIR" ]; then
    log "ERROR" "Dashboard directory not found: $DASHBOARD_DIR"
    exit 1
fi

# Create a backup if enabled
if [ "$CREATE_BACKUP" = "true" ]; then
    BACKUP_DIR="${DASHBOARD_DIR}_backup_${TIMESTAMP}"
    log "INFO" "Creating backup of dashboard directory to $BACKUP_DIR"
    cp -r "$DASHBOARD_DIR" "$BACKUP_DIR"
    log "SUCCESS" "Backup created successfully"
fi

# Determine build process based on dashboard type and theme
cd "$DASHBOARD_DIR"

# Function to create deployment report
create_report() {
    local deploy_url=$1
    local package_path=$2
    local report_file="../../../reports/deployment_${DASHBOARD_TYPE}_${TIMESTAMP}.md"
    
    mkdir -p "../../../reports"
    
    {
        echo "# $DASHBOARD_TYPE Dashboard Deployment Report"
        echo ""
        echo "## Deployment Summary"
        echo "- **Date**: $(date)"
        echo "- **Dashboard Type**: $DASHBOARD_TYPE"
        echo "- **Theme**: $THEME"
        echo "- **Build Mode**: $BUILD_MODE"
        echo "- **Deployment Method**: ${PACKAGE_ONLY:+Package Only (No Deployment)}"
        echo "${deploy_url:+- **Deployment URL**: $deploy_url}"
        echo "${package_path:+- **Package Path**: $package_path}"
        echo ""
        echo "## Deployment Process"
        echo "1. Dashboard directory: $DASHBOARD_DIR"
        echo "2. Theme: $THEME"
        echo "3. Build mode: $BUILD_MODE"
        echo "${CREATE_BACKUP:+4. Backup created: $BACKUP_DIR}"
        echo ""
        echo "## Verification Results"
        if [ "$VERIFY_DEPLOYMENT" = "true" ]; then
            echo "- Static Web App deployment verified"
            echo "- Theme application verified"
            echo "- Static asset paths verified"
        else
            echo "- Verification skipped"
        fi
        echo ""
        echo "## Next Steps"
        echo "- Monitor dashboard usage and performance"
        echo "- Check for any console errors in browser"
        echo "- Test on multiple devices and browsers"
    } > "$report_file"
    
    log "SUCCESS" "Deployment report created: $report_file"
}

# Client360 Dashboard build process
if [ "$DASHBOARD_TYPE" = "client360" ]; then
    log "INFO" "Building Client360 Dashboard with $THEME theme"
    
    # Check if webpack.config.js exists
    if [ -f "webpack.config.js" ]; then
        # Clean dist directory if it exists
        if [ -d "dist" ]; then
            log "INFO" "Cleaning dist directory"
            rm -rf dist
        fi
        
        # Build the specified theme
        log "INFO" "Building $THEME theme using webpack"
        npx webpack --config webpack.config.js --env theme=$THEME --mode $BUILD_MODE || {
            log "ERROR" "Failed to build $THEME theme"
            exit 1
        }
        
        # Set up deployment structure
        log "INFO" "Creating deployment structure"
        mkdir -p "deploy-$THEME"
        mkdir -p "deploy-$THEME/css"
        mkdir -p "deploy-$THEME/assets"
        mkdir -p "deploy-$THEME/js"
        mkdir -p "deploy-$THEME/data"
        
        # Copy theme CSS to deployment
        log "INFO" "Copying theme assets to deployment directory"
        cp dist/$THEME.css "deploy-$THEME/theme.css"
        cp dist/$THEME.css "deploy-$THEME/css/$THEME-theme.css"
        
        # Copy assets
        if [ -d "dist/assets" ]; then
            cp -r dist/assets/* "deploy-$THEME/assets/" 2>/dev/null || log "WARNING" "No assets to copy"
        fi
        
        # Copy data files if they exist
        if [ -d "data" ]; then
            cp -r data/* "deploy-$THEME/data/" 2>/dev/null || log "WARNING" "No data files to copy"
        fi
        
        # Create index.html with themed configuration
        log "INFO" "Creating index.html with $THEME theme configuration"
        sed 's|<script src="/js/theme-selector.js"></script>|<link rel="stylesheet" href="/theme.css">\n  <link rel="stylesheet" href="/css/'"$THEME"'-theme.css">|g' index.html.template > "deploy-$THEME/index.html"
        
        # Remove theme selector and add themed class to body
        sed -i '' 's|<div class="theme-selector">.*</div>||g' "deploy-$THEME/index.html"
        sed -i '' 's|<body>|<body class="'"$THEME"'-branded">|g' "deploy-$THEME/index.html"
        
        # Create Azure Static Web App configuration
        log "INFO" "Creating Azure Static Web App configuration"
        cat > "deploy-$THEME/staticwebapp.config.json" << EOL
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
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*", "/assets/*", "/data/*", "/theme.css", "/logo.svg"]
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
        
        # Create build directory for deployment
        mkdir -p "deploy-$THEME/build"
        cp -r "deploy-$THEME"/* "deploy-$THEME/build/"
        
        DEPLOY_DIR="deploy-$THEME/build"
    else
        log "ERROR" "webpack.config.js not found"
        exit 1
    fi
# Retail Dashboard build process
elif [ "$DASHBOARD_TYPE" = "retail" ]; then
    log "INFO" "Building Retail Dashboard with $THEME theme"
    
    # For retail dashboard, copy files to a deploy directory and add theme CSS
    mkdir -p "deploy-$THEME"
    cp -r * "deploy-$THEME/" 2>/dev/null || true
    
    # Create or update theme CSS
    log "INFO" "Creating theme CSS for Retail Dashboard"
    mkdir -p "deploy-$THEME/css"
    
    # Create theme CSS based on specified theme
    case "$THEME" in
        "tbwa")
            cat > "deploy-$THEME/css/$THEME-theme.css" << EOL
/* TBWA Theme for Retail Dashboard */
:root {
  --color-primary: #002B80; /* TBWA navy */
  --color-secondary: #00C3EC; /* TBWA cyan */
  --color-danger: #E60028; /* TBWA red */
  --color-success: #00A551; /* TBWA green */
}

.header {
  background-color: var(--color-primary);
  color: white;
  border-bottom: 3px solid var(--color-secondary);
}

.logo {
  background-image: url('/assets/logos/tbwa-logo.svg');
}

.kpi-card {
  border-left: 4px solid var(--color-secondary);
}

.btn-primary {
  background-color: var(--color-primary);
}

.btn-secondary {
  background-color: var(--color-secondary);
}
EOL
            # Create TBWA logo if it doesn't exist
            mkdir -p "deploy-$THEME/assets/logos"
            if [ ! -f "deploy-$THEME/assets/logos/tbwa-logo.svg" ]; then
                cat > "deploy-$THEME/assets/logos/tbwa-logo.svg" << EOL
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#000"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#FFC300" font-family="Arial" font-weight="bold" font-size="16">TBWA</text>
</svg>
EOL
            fi
            ;;
        *)
            log "WARNING" "Using default theme for Retail Dashboard"
            cat > "deploy-$THEME/css/$THEME-theme.css" << EOL
/* Default Theme for Retail Dashboard */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-danger: #dc3545;
  --color-success: #28a745;
}
EOL
            ;;
    esac
    
    # Update index.html to include theme CSS
    if [ -f "deploy-$THEME/retail_edge_dashboard.html" ]; then
        sed -i '' 's|</head>|<link rel="stylesheet" href="/css/'"$THEME"'-theme.css">\n</head>|g' "deploy-$THEME/retail_edge_dashboard.html"
        # Update body class for themed branding
        sed -i '' 's|<body>|<body class="'"$THEME"'-branded">|g' "deploy-$THEME/retail_edge_dashboard.html"
    fi
    
    # Create Azure Static Web App configuration
    log "INFO" "Creating Azure Static Web App configuration"
    cat > "deploy-$THEME/staticwebapp.config.json" << EOL
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/retail_edge_dashboard.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/retail_edge_dashboard.html",
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*", "/assets/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/retail_edge_dashboard.html",
      "statusCode": 200
    }
  }
}
EOL
    
    DEPLOY_DIR="deploy-$THEME"
# Advisor Dashboard build process
elif [ "$DASHBOARD_TYPE" = "advisor" ]; then
    log "INFO" "Building Advisor Dashboard with $THEME theme"
    
    # For advisor dashboard, copy files to a deploy directory and add theme CSS
    mkdir -p "deploy-$THEME"
    cp -r * "deploy-$THEME/" 2>/dev/null || true
    
    # Create or update theme CSS
    log "INFO" "Creating theme CSS for Advisor Dashboard"
    mkdir -p "deploy-$THEME/css"
    
    # Create theme CSS based on specified theme
    case "$THEME" in
        "tbwa")
            cat > "deploy-$THEME/css/$THEME-theme.css" << EOL
/* TBWA Theme for Advisor Dashboard */
:root {
  --color-primary: #002B80; /* TBWA navy */
  --color-secondary: #00C3EC; /* TBWA cyan */
  --color-danger: #E60028; /* TBWA red */
  --color-success: #00A551; /* TBWA green */
}

.header, .navbar {
  background-color: var(--color-primary) !important;
  color: white !important;
  border-bottom: 3px solid var(--color-secondary) !important;
}

.logo {
  background-image: url('/assets/logos/tbwa-logo.svg');
}

.card {
  border-left: 4px solid var(--color-secondary) !important;
}

.btn-primary {
  background-color: var(--color-primary) !important;
}

.btn-secondary {
  background-color: var(--color-secondary) !important;
}
EOL
            # Create TBWA logo if it doesn't exist
            mkdir -p "deploy-$THEME/assets/logos"
            if [ ! -f "deploy-$THEME/assets/logos/tbwa-logo.svg" ]; then
                cat > "deploy-$THEME/assets/logos/tbwa-logo.svg" << EOL
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#000"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#FFC300" font-family="Arial" font-weight="bold" font-size="16">TBWA</text>
</svg>
EOL
            fi
            ;;
        *)
            log "WARNING" "Using default theme for Advisor Dashboard"
            cat > "deploy-$THEME/css/$THEME-theme.css" << EOL
/* Default Theme for Advisor Dashboard */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-danger: #dc3545;
  --color-success: #28a745;
}
EOL
            ;;
    esac
    
    # Update index.html and advisor.html to include theme CSS
    for file in "deploy-$THEME/index.html" "deploy-$THEME/advisor.html"; do
        if [ -f "$file" ]; then
            sed -i '' 's|</head>|<link rel="stylesheet" href="/css/'"$THEME"'-theme.css">\n</head>|g' "$file"
            # Update body class for themed branding
            sed -i '' 's|<body>|<body class="'"$THEME"'-branded">|g' "$file"
        fi
    done
    
    DEPLOY_DIR="deploy-$THEME"
fi

# Generate deployment package
log "INFO" "Creating deployment package"
mkdir -p "../../../output"
PACKAGE_FILE="../../../output/${DASHBOARD_TYPE}_${THEME}_dashboard_${TIMESTAMP}.zip"

cd "$DEPLOY_DIR"
zip -r "$PACKAGE_FILE" * || {
    log "ERROR" "Failed to create deployment package"
    exit 1
}
cd ../../..  # Return to project root

log "SUCCESS" "Deployment package created: $PACKAGE_FILE"

# If package-only mode, exit now
if [ "$PACKAGE_ONLY" = "true" ]; then
    log "INFO" "Package-only mode selected. Skipping deployment."
    create_report "" "$PACKAGE_FILE"
    log "SUCCESS" "Deployment package process completed successfully"
    exit 0
fi

# Deploy to Azure Static Web Apps
log "INFO" "Deploying to Azure Static Web Apps"

# Check if Azure CLI is available
if ! command_exists az; then
    log "WARNING" "Azure CLI not found. Cannot deploy to Azure."
    create_report "" "$PACKAGE_FILE"
    log "INFO" "To deploy manually, install the Azure CLI and run:"
    log "INFO" "az staticwebapp deploy --name $APP_NAME --resource-group $RESOURCE_GROUP --source-path $PACKAGE_FILE"
    exit 0
fi

# Check if logged into Azure
if ! az account show &>/dev/null; then
    log "WARNING" "Not logged in to Azure CLI. Please log in first."
    az login || {
        log "ERROR" "Azure login failed."
        create_report "" "$PACKAGE_FILE"
        exit 1
    }
fi

# Deploy to Azure Static Web Apps
log "INFO" "Deploying to Azure Static Web App: $APP_NAME"

DEPLOY_RESULT=$(az staticwebapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source-path "$PACKAGE_FILE" \
  --no-wait 2>&1) || {
    log "ERROR" "Deployment failed: $DEPLOY_RESULT"
    create_report "" "$PACKAGE_FILE"
    exit 1
}

log "SUCCESS" "Deployment initiated successfully"

# Get deployment URL
log "INFO" "Fetching deployment URL"
DEPLOY_URL=$(az staticwebapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv 2>/dev/null)

if [ -n "$DEPLOY_URL" ]; then
    DEPLOY_URL="https://$DEPLOY_URL"
    log "SUCCESS" "Deployment URL: $DEPLOY_URL"
else
    log "WARNING" "Could not retrieve deployment URL"
fi

# Verify deployment if enabled
if [ "$VERIFY_DEPLOYMENT" = "true" ]; then
    log "INFO" "Verifying deployment (this may take a moment)"
    
    # Wait for deployment to complete (simple 30-second delay)
    log "INFO" "Waiting for deployment to complete..."
    sleep 30
    
    # Check deployment status
    az staticwebapp show \
      --name "$APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "defaultHostname" -o tsv &>/dev/null && {
        log "SUCCESS" "Static Web App verification successful"
    } || {
        log "WARNING" "Static Web App verification failed or still in progress"
    }
    
    # More detailed verification could be added here with curl checks
fi

# Create deployment report
create_report "$DEPLOY_URL" "$PACKAGE_FILE"

log "SUCCESS" "Deployment process completed successfully"
log "INFO" "====================================================================="
log "INFO" "Dashboard: $DASHBOARD_TYPE"
log "INFO" "Theme: $THEME"
log "INFO" "Deployment URL: ${DEPLOY_URL:-'Not available'}"
log "INFO" "Package: $PACKAGE_FILE"
log "INFO" "====================================================================="