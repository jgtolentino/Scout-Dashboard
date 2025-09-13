#!/bin/bash
# Setup Databricks SQL Warehouse and Key Vault Integration
# This script creates a Databricks SQL warehouse, generates a personal access token,
# and stores it in Azure Key Vault for secure access.

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Databricks SQL Warehouse Setup ====${NC}"

# Make the script executable
chmod +x "$0"

# Root directory of the project
ROOT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"

# Check for Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check for Databricks CLI
if ! command -v databricks &> /dev/null; then
    echo -e "${YELLOW}Databricks CLI not found. Installing...${NC}"
    pip install databricks-cli
fi

# Check if logged in to Azure
LOGGED_IN=$(az account show 2>/dev/null)
if [ -z "$LOGGED_IN" ]; then
    echo "You are not logged in to Azure. Please log in."
    az login
fi

# Get Databricks workspace info
echo ""
echo "Enter your Databricks workspace URL (e.g., https://adb-123456789012345.6.azuredatabricks.net):"
read -r DATABRICKS_HOST

# Extract the workspace ID from the URL
WORKSPACE_ID=$(echo "$DATABRICKS_HOST" | sed -n 's/.*adb-\([0-9]*\).*/\1/p')

if [ -z "$WORKSPACE_ID" ]; then
    echo -e "${YELLOW}Could not extract workspace ID from URL. Using the URL directly.${NC}"
fi

# Check for existing token or generate a new one
echo ""
echo "Do you have an existing Databricks personal access token? (y/n)"
read -r HAS_TOKEN

if [[ "$HAS_TOKEN" =~ ^[Yy]$ ]]; then
    echo "Enter your Databricks personal access token:"
    read -rs DATABRICKS_TOKEN
else
    echo -e "${YELLOW}You need to generate a personal access token manually from the Databricks UI.${NC}"
    echo "1. Go to your Databricks workspace"
    echo "2. Click on your username in the top-right corner"
    echo "3. Select 'User Settings'"
    echo "4. Go to the 'Access Tokens' tab"
    echo "5. Click 'Generate New Token'"
    echo "6. Provide a name (e.g., 'client360-dashboard') and expiration"
    echo "7. Copy the generated token"
    echo ""
    echo "Enter the generated token:"
    read -rs DATABRICKS_TOKEN
fi

if [ -z "$DATABRICKS_TOKEN" ]; then
    echo -e "${RED}Error: Databricks token cannot be empty.${NC}"
    exit 1
fi

# Configure Databricks CLI
echo ""
echo "Configuring Databricks CLI..."
cat > ~/.databrickscfg << EOF
[DEFAULT]
host = $DATABRICKS_HOST
token = $DATABRICKS_TOKEN
EOF

echo -e "${GREEN}✅ Databricks CLI configured successfully.${NC}"

# Check if Unity Catalog is enabled
echo ""
echo "Checking if Unity Catalog is enabled..."
UC_ENABLED=$(databricks unity-catalog metastores list 2>/dev/null | grep -v "^ERROR" || echo "")

if [ -z "$UC_ENABLED" ]; then
    echo -e "${YELLOW}Warning: Unity Catalog may not be enabled in this workspace.${NC}"
    echo "Using Hive Metastore instead of Unity Catalog."
    USE_UC=false
else
    echo -e "${GREEN}Unity Catalog is enabled.${NC}"
    USE_UC=true
fi

# Create catalog and schema if using Unity Catalog
if [ "$USE_UC" = true ]; then
    echo ""
    echo "Creating Unity Catalog resources..."
    
    # Create catalog if it doesn't exist
    CATALOG_NAME="client360_catalog"
    CATALOG_EXISTS=$(databricks unity-catalog catalogs list | grep "$CATALOG_NAME" || echo "")
    
    if [ -z "$CATALOG_EXISTS" ]; then
        echo "Creating catalog: $CATALOG_NAME"
        databricks unity-catalog catalogs create --name "$CATALOG_NAME"
        echo -e "${GREEN}✅ Catalog created successfully.${NC}"
    else
        echo "Catalog $CATALOG_NAME already exists."
    fi
    
    # Create schema if it doesn't exist
    SCHEMA_NAME="client360"
    SCHEMA_EXISTS=$(databricks unity-catalog schemas list --catalog "$CATALOG_NAME" | grep "$SCHEMA_NAME" || echo "")
    
    if [ -z "$SCHEMA_EXISTS" ]; then
        echo "Creating schema: $SCHEMA_NAME"
        databricks unity-catalog schemas create --catalog "$CATALOG_NAME" --name "$SCHEMA_NAME"
        echo -e "${GREEN}✅ Schema created successfully.${NC}"
    else
        echo "Schema $SCHEMA_NAME already exists."
    fi
    
    FULL_SCHEMA="$CATALOG_NAME.$SCHEMA_NAME"
else
    # Using Hive Metastore
    FULL_SCHEMA="client360"
    echo ""
    echo "Creating Hive Metastore schema..."
    
    # Create a temporary notebook to create the schema
    TEMP_NOTEBOOK="$ROOT_DIR/temp_create_schema.py"
    cat > "$TEMP_NOTEBOOK" << EOF
# Databricks notebook source
# Create the client360 schema if it doesn't exist
spark.sql("CREATE DATABASE IF NOT EXISTS client360")
print("Schema client360 created or already exists.")
EOF
    
    # Upload and run the notebook
    NOTEBOOK_PATH="/tmp/create_schema"
    databricks workspace import -l PYTHON -f "$TEMP_NOTEBOOK" "$NOTEBOOK_PATH" -o
    
    # Get cluster ID
    CLUSTER_ID=$(databricks clusters list | grep -i "running" | head -1 | awk '{print $1}')
    
    if [ -z "$CLUSTER_ID" ]; then
        echo -e "${YELLOW}No running cluster found. Creating a temporary cluster...${NC}"
        CLUSTER_ID=$(databricks clusters create --json "{\"cluster_name\":\"temp-setup-cluster\",\"spark_version\":\"11.3.x-scala2.12\",\"node_type_id\":\"Standard_DS3_v2\",\"num_workers\":1,\"autotermination_minutes\":30}" | jq -r '.cluster_id')
        
        echo "Waiting for cluster to start..."
        while [ "$(databricks clusters get --cluster-id "$CLUSTER_ID" | jq -r '.state')" != "RUNNING" ]; do
            echo "."
            sleep 10
        done
    fi
    
    # Run the notebook
    echo "Running notebook to create schema..."
    databricks runs submit --run-name "Create Schema" --existing-cluster-id "$CLUSTER_ID" --notebook-task "{\"notebook_path\":\"$NOTEBOOK_PATH\"}"
    
    # Clean up
    rm -f "$TEMP_NOTEBOOK"
    databricks workspace delete "$NOTEBOOK_PATH"
    
    echo -e "${GREEN}✅ Schema created successfully.${NC}"
fi

# Create SQL warehouse if it doesn't exist
echo ""
echo "Creating SQL warehouse..."

# Check for existing warehouses
WAREHOUSES=$(databricks sql warehouses list --output JSON)
WAREHOUSE_NAME="client360-sql-endpoint"
WAREHOUSE_EXISTS=$(echo "$WAREHOUSES" | jq -r ".[] | select(.name == \"$WAREHOUSE_NAME\") | .id" || echo "")

if [ -z "$WAREHOUSE_EXISTS" ]; then
    echo "Creating SQL warehouse: $WAREHOUSE_NAME"
    WAREHOUSE_JSON=$(databricks sql warehouses create \
        --name "$WAREHOUSE_NAME" \
        --size "Medium" \
        --min-num-clusters 1 \
        --max-num-clusters 1 \
        --auto-stop-mins 30 \
        --enable-photon true \
        --spot-instance-policy "COST_OPTIMIZED" \
        --output JSON)
    
    WAREHOUSE_ID=$(echo "$WAREHOUSE_JSON" | jq -r '.id')
    
    if [ -z "$WAREHOUSE_ID" ]; then
        echo -e "${RED}Error: Failed to create SQL warehouse.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ SQL warehouse created successfully with ID: $WAREHOUSE_ID${NC}"
else
    echo "SQL warehouse $WAREHOUSE_NAME already exists."
    WAREHOUSE_ID=$WAREHOUSE_EXISTS
    echo "Warehouse ID: $WAREHOUSE_ID"
fi

# Get the SQL warehouse HTTP path
SQL_WAREHOUSE_INFO=$(databricks sql warehouses get --id "$WAREHOUSE_ID" --output JSON)
SQL_HTTP_PATH=$(echo "$SQL_WAREHOUSE_INFO" | jq -r '.odbc_params.path')

echo "SQL HTTP Path: $SQL_HTTP_PATH"

# Store the SQL token in Key Vault
echo ""
echo "Enter the Key Vault name to store the SQL token:"
read -r KEY_VAULT_NAME

# Check if Key Vault exists
KV_EXISTS=$(az keyvault show --name "$KEY_VAULT_NAME" 2>/dev/null)

if [ -z "$KV_EXISTS" ]; then
    echo -e "${RED}Error: Key Vault $KEY_VAULT_NAME does not exist.${NC}"
    echo "Please create the Key Vault first or enter an existing one."
    exit 1
fi

# Store token in Key Vault
echo "Storing Databricks SQL token in Key Vault..."
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "SQL-ENDPOINT-TOKEN" \
    --value "$DATABRICKS_TOKEN"

echo -e "${GREEN}✅ Databricks SQL token stored in Key Vault successfully.${NC}"

# Update environment configuration
echo ""
echo "Updating environment configuration..."

# Create a .env file for local development
ENV_FILE="$ROOT_DIR/.env.local"
cat > "$ENV_FILE" << EOF
# Databricks SQL configuration
DATABRICKS_SQL_HOST=$DATABRICKS_HOST
DATABRICKS_SQL_PATH=$SQL_HTTP_PATH
DATABRICKS_CATALOG=$([ "$USE_UC" = true ] && echo "$CATALOG_NAME" || echo "")
DATABRICKS_SCHEMA=$([ "$USE_UC" = true ] && echo "$SCHEMA_NAME" || echo "client360")

# Key Vault configuration
KEY_VAULT_NAME=$KEY_VAULT_NAME
USE_MANAGED_IDENTITY=true

# For local development only (not to be used in production)
# DATABRICKS_SQL_TOKEN=$DATABRICKS_TOKEN
EOF

echo -e "${GREEN}✅ Environment configuration updated in $ENV_FILE${NC}"
echo -e "${YELLOW}Note: For security, the token is not included in the .env file for production use.${NC}"

# Update ETL deployment configuration
ETL_CONFIG_FILE="$ROOT_DIR/etl-deploy-kit.yaml"
if [ -f "$ETL_CONFIG_FILE" ]; then
    echo "Updating SQL endpoint configuration in ETL deployment kit..."
    
    # Update using sed with macOS compatibility
    sed -i '' "s|name: client360-sql-endpoint|name: $WAREHOUSE_NAME|g" "$ETL_CONFIG_FILE" || echo "Note: Could not update SQL endpoint name."
    sed -i '' "s|warehouse_id: .*|warehouse_id: $WAREHOUSE_ID|g" "$ETL_CONFIG_FILE" || echo "Note: Could not update warehouse ID."
    
    echo -e "${GREEN}✅ ETL configuration updated.${NC}"
else
    echo -e "${YELLOW}Warning: ETL deployment configuration file not found.${NC}"
fi

# Test SQL connection
echo ""
echo "Would you like to test the SQL connection? (y/n)"
read -r TEST_CONNECTION

if [[ "$TEST_CONNECTION" =~ ^[Yy]$ ]]; then
    echo "Testing SQL connection..."
    
    # Create a test query
    TEST_QUERY="SELECT current_date() as today"
    
    # Run the query
    RESULT=$(databricks sql query -w "$WAREHOUSE_ID" "$TEST_QUERY" --output JSON)
    TODAY=$(echo "$RESULT" | jq -r '.[0].today')
    
    if [ -n "$TODAY" ]; then
        echo -e "${GREEN}✅ SQL connection test successful: Today is $TODAY${NC}"
    else
        echo -e "${RED}❌ SQL connection test failed.${NC}"
    fi
else
    echo "Skipping SQL connection test."
fi

# Summary
echo ""
echo -e "${BLUE}=== Databricks SQL Warehouse Setup Summary ====${NC}"
echo "Databricks Host: $DATABRICKS_HOST"
echo "SQL Warehouse: $WAREHOUSE_NAME (ID: $WAREHOUSE_ID)"
echo "SQL HTTP Path: $SQL_HTTP_PATH"
echo "Schema: $FULL_SCHEMA"
echo "Token: Stored in Key Vault $KEY_VAULT_NAME as SQL-ENDPOINT-TOKEN"

echo ""
echo -e "${GREEN}Databricks SQL Warehouse setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test Databricks SQL connectivity with:"
echo "   ./scripts/test_databricks_connectivity.sh"
echo ""
echo "2. Deploy your DLT pipelines with:"
echo "   ./scripts/deploy_dlt_pipelines.sh"
echo ""
echo "3. Deploy the dashboard with:"
echo "   ./scripts/deploy-only-production.sh"