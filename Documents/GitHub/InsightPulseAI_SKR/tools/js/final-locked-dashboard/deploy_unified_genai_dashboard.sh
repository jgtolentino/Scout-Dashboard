#!/bin/bash
# Deploy Unified GenAI Dashboard
# Version: 2.2.1

set -e

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
PACKAGE_ONLY=false
DEPLOY_TO_AZURE=false
AZURE_ENV=""

# Process command line options
while [[ $# -gt 0 ]]; do
  case $1 in
    --package-only)
      PACKAGE_ONLY=true
      shift
      ;;
    --deploy-to-azure)
      DEPLOY_TO_AZURE=true
      shift
      ;;
    --env)
      AZURE_ENV="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Unified GenAI Dashboard Deployment   ${NC}"
echo -e "${BLUE}   Version: 2.2.1                       ${NC}"
echo -e "${BLUE}========================================${NC}"

# Configuration
DEPLOY_DIR="deployment-v2"
OUTPUT_DIR="output"
PACKAGE_NAME="scout_unified_genai_dashboard"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Verify required files exist
echo -e "\n${YELLOW}Verifying required files...${NC}"

REQUIRED_FILES=(
  "${DEPLOY_DIR}/public/js/unified_genai_insights.js"
  "${DEPLOY_DIR}/public/css/unified-genai.css"
  "${DEPLOY_DIR}/public/insights_dashboard.html"
  "assets/data/insights_data.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "✅ $file"
  else
    echo -e "${RED}❌ Missing required file: $file${NC}"
    exit 1
  fi
done

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}"

# Check if Azure CLI is available for deployment
if command -v az &> /dev/null; then
  AZURE_AVAILABLE=true
  echo -e "\n${GREEN}Azure CLI detected. Deployment to Azure will be available.${NC}"
else
  AZURE_AVAILABLE=false
  echo -e "\n${YELLOW}Azure CLI not detected. Deployment will be local only.${NC}"
fi

# Copy files to output package
echo -e "\n${YELLOW}Building deployment package...${NC}"

# Create target directories
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}/css"
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}/js"
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}/assets/data"
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}/docs"

# Copy HTML files
cp "${DEPLOY_DIR}/public/insights_dashboard.html" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${DEPLOY_DIR}/public/insights_dashboard_v2.html" "${OUTPUT_DIR}/${PACKAGE_NAME}/" 2>/dev/null || echo -e "${YELLOW}Info: insights_dashboard_v2.html not found, skipping${NC}"

# Copy CSS files
cp "${DEPLOY_DIR}/public/css/shared-theme.css" "${OUTPUT_DIR}/${PACKAGE_NAME}/css/" 2>/dev/null || echo -e "${YELLOW}Info: shared-theme.css not found, skipping${NC}"
cp "${DEPLOY_DIR}/public/css/mockify-style.css" "${OUTPUT_DIR}/${PACKAGE_NAME}/css/"
cp "${DEPLOY_DIR}/public/css/retail_edge_style_patch.css" "${OUTPUT_DIR}/${PACKAGE_NAME}/css/"
cp "${DEPLOY_DIR}/public/css/unified-genai.css" "${OUTPUT_DIR}/${PACKAGE_NAME}/css/"

# Copy JS files
cp "${DEPLOY_DIR}/public/js/insights_visualizer.js" "${OUTPUT_DIR}/${PACKAGE_NAME}/js/"
cp "${DEPLOY_DIR}/public/js/unified_genai_insights.js" "${OUTPUT_DIR}/${PACKAGE_NAME}/js/"
cp "${DEPLOY_DIR}/public/dashboard_sql_component.js" "${OUTPUT_DIR}/${PACKAGE_NAME}/" 2>/dev/null || echo -e "${YELLOW}Info: dashboard_sql_component.js not found, skipping${NC}"

# Copy data files
cp "assets/data/insights_data.json" "${OUTPUT_DIR}/${PACKAGE_NAME}/assets/data/"

# Copy documentation
cp "POWER_BI_STYLE_GUIDE.md" "${OUTPUT_DIR}/${PACKAGE_NAME}/docs/" 2>/dev/null || echo -e "${YELLOW}Info: POWER_BI_STYLE_GUIDE.md not found, skipping${NC}"
cp "README_GENAI_INTEGRATION.md" "${OUTPUT_DIR}/${PACKAGE_NAME}/docs/" 2>/dev/null || echo -e "${YELLOW}Info: README_GENAI_INTEGRATION.md not found, skipping${NC}"

# Create a README file
cat > "${OUTPUT_DIR}/${PACKAGE_NAME}/README.md" << EOF
# Scout Advanced Analytics - Unified GenAI Dashboard

Version: 2.2.1
Deployment Date: $(date "+%Y-%m-%d %H:%M:%S")

## Overview

This package contains the Scout Advanced Analytics dashboard with Unified GenAI insights integration.
The dashboard provides AI-powered insights for retail analytics, combining SQL data analysis with
advanced natural language insights.

## Components

- \`insights_dashboard.html\`: Main dashboard interface
- \`js/unified_genai_insights.js\`: GenAI insights integration client
- \`css/unified-genai.css\`: Unified styling for GenAI components
- \`assets/data/insights_data.json\`: Sample insights data

## Quick Start

1. Deploy all files to a web server
2. Access insights_dashboard.html in a web browser
3. The dashboard will automatically load insights data from assets/data/insights_data.json

## Notes

- Dark mode is supported
- Responsive design for all device sizes
- Filter insights by type (General, Brand, Sentiment, Trend)

## Deployment

For Azure Static Web Apps deployment:
\`\`\`
az staticwebapp create --name <app-name> --resource-group <resource-group> --source <source-location> --location <region>
\`\`\`

For local testing:
\`\`\`
python -m http.server 8000
\`\`\`

Then navigate to http://localhost:8000/insights_dashboard.html
EOF

# Create deployment script for the package
cat > "${OUTPUT_DIR}/${PACKAGE_NAME}/deploy.sh" << EOF
#!/bin/bash
# Quick deployment script for Scout Unified GenAI Dashboard

# Check for local Python server
if command -v python3 &> /dev/null; then
  echo "Starting local HTTP server on port 8000..."
  python3 -m http.server 8000
elif command -v python &> /dev/null; then
  echo "Starting local HTTP server on port 8000..."
  python -m http.server 8000
else
  echo "Python not found. Please deploy these files to a web server."
fi
EOF

chmod +x "${OUTPUT_DIR}/${PACKAGE_NAME}/deploy.sh"

# Create a deployment package zip file
echo -e "\n${YELLOW}Creating deployment package...${NC}"
cd "${OUTPUT_DIR}"
zip -r "${PACKAGE_NAME}_${TIMESTAMP}.zip" "${PACKAGE_NAME}"
cd ..

echo -e "\n${GREEN}Deployment package created: ${OUTPUT_DIR}/${PACKAGE_NAME}_${TIMESTAMP}.zip${NC}"

# Handle Azure deployment if requested
if [ "$DEPLOY_TO_AZURE" = true ]; then
  if [ -z "$AZURE_ENV" ]; then
    AZURE_ENV="staging"
  fi

  echo -e "\n${YELLOW}Deploying to Azure environment: ${AZURE_ENV}...${NC}"

  if command -v az &> /dev/null; then
    # Determine the app name based on environment
    if [ "$AZURE_ENV" = "production" ]; then
      APP_NAME="scout-analytics-production"
    else
      APP_NAME="scout-analytics-staging"
    fi

    # Deploy to Azure Static Web Apps
    echo -e "${YELLOW}Deploying to Azure Static Web App: ${APP_NAME}...${NC}"
    az staticwebapp deploy \
      --name "$APP_NAME" \
      --source "${OUTPUT_DIR}/${PACKAGE_NAME}" \
      --env "$AZURE_ENV" \
      --no-wait

    echo -e "${GREEN}Deployment initiated to Azure Static Web App: ${APP_NAME}${NC}"
    echo -e "${GREEN}Environment: ${AZURE_ENV}${NC}"
    echo -e "${YELLOW}Note: Deployment may take a few minutes to complete in Azure.${NC}"
  else
    echo -e "${RED}Azure CLI not found. Cannot deploy to Azure.${NC}"
    exit 1
  fi

  echo -e "\n${GREEN}Deployment package creation and Azure deployment initiated successfully!${NC}"
  exit 0
fi

# Skip local deployment if package-only mode is enabled
if [ "$PACKAGE_ONLY" = true ]; then
  echo -e "\n${GREEN}Deployment package created: ${OUTPUT_DIR}/${PACKAGE_NAME}_${TIMESTAMP}.zip${NC}"
  echo -e "${YELLOW}Package-only mode enabled. Skipping local deployment.${NC}"
  exit 0
fi

# Deploy to local test server if available
echo -e "\n${YELLOW}Setting up local test server...${NC}"
if command -v python3 &> /dev/null; then
  PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
  PYTHON_CMD="python"
else
  echo -e "${RED}Python not found. Skipping local deployment.${NC}"
  PYTHON_CMD=""
fi

if [ -n "$PYTHON_CMD" ]; then
  echo -e "${GREEN}Starting local HTTP server for testing...${NC}"
  echo -e "${GREEN}Dashboard URL: http://localhost:8080/insights_dashboard.html${NC}"
  echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"

  # Start a Python HTTP server in the background
  cd "${OUTPUT_DIR}/${PACKAGE_NAME}"
  $PYTHON_CMD -m http.server 8080
fi

echo -e "\n${GREEN}Deployment completed successfully!${NC}"