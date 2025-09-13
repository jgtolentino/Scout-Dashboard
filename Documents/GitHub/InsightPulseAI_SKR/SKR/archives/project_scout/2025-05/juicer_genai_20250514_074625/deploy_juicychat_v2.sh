#!/bin/bash
# Improved script to deploy JuicyChat integration across all dashboards

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARDS_DIR="$BASE_DIR/dashboards"
CLIENT_DASHBOARDS_DIR="$BASE_DIR/client-facing/output/dashboards"
CLIENT_RETAIL_DASHBOARDS_DIR="$BASE_DIR/client-facing/output/retail-advisor/dashboards"

# Path to script and snippet files
BUNDLE_JS="$DASHBOARDS_DIR/juicy-chat-bundle.js"
SNIPPET="<!-- JuicyChat Integration -->
<div id=\"juicy-chat-container\"></div>
<script>
// JuicyChat Configuration
window.JuicyChatConfig = {
  apiEndpoint: '/api/juicer/query',
  position: 'bottom-right',
  autoInit: true,
  model: 'claude',
  dashboardContext: {
    type: \"DASHBOARD_TYPE\",
    dashboard: \"DASHBOARD_NAME\"
  }
};
</script>
<script src=\"juicy-chat-bundle.js\"></script>
<!-- End JuicyChat Integration -->"

# Create API directory if it doesn't exist
mkdir -p "$BASE_DIR/api"

# Copy demo API for deployment
echo -e "${YELLOW}Setting up API endpoint...${NC}"
cp "$BASE_DIR/demo_endpoint.py" "$BASE_DIR/api/juicer_query_api.py"

# Create deployment directories
mkdir -p "$DASHBOARDS_DIR/deploy"
mkdir -p "$CLIENT_DASHBOARDS_DIR/deploy"
mkdir -p "$CLIENT_RETAIL_DASHBOARDS_DIR/deploy"

# Function to add JuicyChat to a dashboard
add_juicychat() {
    local dashboard_file="$1"
    local dashboard_name="$(basename "$dashboard_file")"
    local dashboard_type="$(echo "$dashboard_name" | cut -d '_' -f 1)"
    local output_file="$(dirname "$dashboard_file")/deploy/$dashboard_name"
    
    echo -e "${BLUE}Processing dashboard: $dashboard_name${NC}"
    
    # Update dashboard context in snippet
    local dashboard_snippet="${SNIPPET/DASHBOARD_TYPE/$dashboard_type}"
    dashboard_snippet="${dashboard_snippet/DASHBOARD_NAME/$dashboard_name}"
    
    # Copy bundle.js to deployment directory
    cp "$BUNDLE_JS" "$(dirname "$output_file")/juicy-chat-bundle.js"
    
    # Create the output directory if it doesn't exist
    mkdir -p "$(dirname "$output_file")"
    
    # Check if </body> tag exists
    if grep -q "</body>" "$dashboard_file"; then
        # Add JuicyChat before </body> tag
        awk -v snippet="$dashboard_snippet" '{ if (match($0, /<\/body>/)) { printf "%s\n%s\n", snippet, $0 } else { print $0 } }' "$dashboard_file" > "$output_file"
    else
        # Append JuicyChat to the end
        cp "$dashboard_file" "$output_file"
        echo -e "\n$dashboard_snippet" >> "$output_file"
    fi
    
    echo -e "${GREEN}Successfully added JuicyChat to: $dashboard_name${NC}"
    echo -e "${GREEN}Output: $output_file${NC}"
}

# Process all HTML files in dashboards directory
echo -e "${BLUE}Updating main dashboards...${NC}"
for dashboard in "$DASHBOARDS_DIR"/*.html; do
    if [ -f "$dashboard" ]; then
        # Skip snippet file
        if [[ "$dashboard" == *"juicy-chat-snippet.html" ]]; then
            continue
        fi
        add_juicychat "$dashboard"
    fi
done

# Process all HTML files in client-facing dashboards directory
echo -e "${BLUE}Updating client-facing dashboards...${NC}"
for dashboard in "$CLIENT_DASHBOARDS_DIR"/*.html; do
    if [ -f "$dashboard" ]; then
        add_juicychat "$dashboard"
    fi
done

# Process all HTML files in client-facing retail-advisor dashboards directory
echo -e "${BLUE}Updating client-facing retail-advisor dashboards...${NC}"
for dashboard in "$CLIENT_RETAIL_DASHBOARDS_DIR"/*.html; do
    if [ -f "$dashboard" ]; then
        add_juicychat "$dashboard"
    fi
done

# Create a simple launch script for running the API
echo -e "${YELLOW}Creating API launch script...${NC}"
cat > "$BASE_DIR/run_juicychat_api.sh" << 'EOF'
#!/bin/bash
# Script to run the JuicyChat API

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_FILE="$BASE_DIR/api/juicer_query_api.py"

# Check if python3 is available
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python is not installed or not in the PATH.${NC}"
    exit 1
fi

# Check if port is specified
PORT=${1:-8000}

echo -e "${BLUE}Starting JuicyChat API on port ${PORT}...${NC}"
echo -e "${GREEN}API will be available at http://localhost:${PORT}/api/juicer/query${NC}"
echo -e "${GREEN}API docs will be available at http://localhost:${PORT}/docs${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"

$PYTHON_CMD "$API_FILE" $PORT
EOF

chmod +x "$BASE_DIR/run_juicychat_api.sh"

# Create deployment script for Azure Blob Storage
echo -e "${YELLOW}Creating dashboard deployment script...${NC}"
cat > "$BASE_DIR/deploy_dashboards_with_chat.sh" << 'EOF'
#!/bin/bash
# Script to deploy dashboards with JuicyChat to Azure Blob Storage

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARDS_DIR="$BASE_DIR/dashboards/deploy"

# Azure Storage configuration
STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-"insightpulseaistorage"}
RESOURCE_GROUP=${RESOURCE_GROUP:-"insight-pulse-ai-rg"}
CONTAINER_NAME=${CONTAINER_NAME:-"$web"}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo -e "${YELLOW}Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if logged in to Azure
echo -e "${BLUE}Checking Azure login status...${NC}"
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure. Please login:${NC}"
    az login
fi

# Deploy dashboard files to Azure Blob Storage
echo -e "${BLUE}Deploying dashboards to Azure Blob Storage...${NC}"

# Get storage key
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query '[0].value' -o tsv)

if [ -z "$STORAGE_KEY" ]; then
    echo -e "${RED}Error: Could not retrieve storage key.${NC}"
    exit 1
fi

# Upload all files in deploy directory with proper MIME types
for file in "$DASHBOARDS_DIR"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Determine content type
        content_type="text/plain"
        if [[ "$filename" == *.html ]]; then
            content_type="text/html"
        elif [[ "$filename" == *.js ]]; then
            content_type="application/javascript"
        elif [[ "$filename" == *.css ]]; then
            content_type="text/css"
        elif [[ "$filename" == *.json ]]; then
            content_type="application/json"
        elif [[ "$filename" == *.png ]]; then
            content_type="image/png"
        elif [[ "$filename" == *.jpg || "$filename" == *.jpeg ]]; then
            content_type="image/jpeg"
        fi
        
        echo -e "${BLUE}Uploading ${filename} (${content_type})...${NC}"
        
        # Upload file with overwrite flag
        az storage blob upload \
            --account-name $STORAGE_ACCOUNT \
            --account-key $STORAGE_KEY \
            --container-name $CONTAINER_NAME \
            --file "$file" \
            --name "$filename" \
            --content-type "$content_type" \
            --overwrite true
            
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Successfully uploaded: $filename${NC}"
        else
            echo -e "${RED}Failed to upload: $filename${NC}"
        fi
    fi
done

# Get the public URL of the storage account
PUBLIC_URL=$(az storage account show -n $STORAGE_ACCOUNT -g $RESOURCE_GROUP --query "primaryEndpoints.web" -o tsv)
PUBLIC_URL=${PUBLIC_URL%/}  # Remove trailing slash

echo -e "\n${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Dashboards are available at: $PUBLIC_URL${NC}"
echo -e "${YELLOW}Note: Make sure to set up the API endpoint at /api/juicer/query for JuicyChat to work.${NC}"
EOF

chmod +x "$BASE_DIR/deploy_dashboards_with_chat.sh"

echo -e "\n${GREEN}Successfully updated all dashboards with JuicyChat integration!${NC}"
echo -e "${YELLOW}To deploy dashboards to Azure:${NC}"
echo -e "  ${BLUE}./deploy_dashboards_with_chat.sh${NC}"
echo -e "${YELLOW}To run the JuicyChat API:${NC}"
echo -e "  ${BLUE}./run_juicychat_api.sh${NC}\n"
echo -e "${YELLOW}The updated dashboards are available in:${NC}"
echo -e "  ${BLUE}${DASHBOARDS_DIR}/deploy/${NC}"
echo -e "  ${BLUE}${CLIENT_DASHBOARDS_DIR}/deploy/${NC}"
echo -e "  ${BLUE}${CLIENT_RETAIL_DASHBOARDS_DIR}/deploy/${NC}\n"