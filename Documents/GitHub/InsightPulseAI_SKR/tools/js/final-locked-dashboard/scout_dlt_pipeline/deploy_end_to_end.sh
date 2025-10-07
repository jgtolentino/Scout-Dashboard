#!/bin/bash
# End-to-End Deployment Script for Scout DLT Pipeline
# This script automates the full deployment process of the Scout DLT Pipeline
# including infrastructure, pipeline, and dashboard components

# Exit on error
set -e

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
DATABRICKS_HOST="${DATABRICKS_HOST:-"https://adb-xxxx.azuredatabricks.net"}"
DATABRICKS_TOKEN="${DATABRICKS_TOKEN:-"dapi_xxxxx"}"
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-"rg-scout-eventhub"}"
LOCATION="${LOCATION:-"eastus2"}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-"kv-client360"}"
STATIC_WEB_APP_NAME="${STATIC_WEB_APP_NAME:-"client360-dashboard"}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="deploy_$(date +%Y%m%d%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${GREEN}Scout DLT Pipeline End-to-End Deployment${NC}"
echo "==========================================="
echo "$(date): Starting deployment process"
echo ""

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it and try again.${NC}"
        exit 1
    fi
}

# Check required tools
echo -e "${BLUE}[1/9] Checking required tools${NC}"
check_command "az"
check_command "terraform"
check_command "databricks"
check_command "jq"
check_command "npm"

# Confirm deployment
echo -e "${YELLOW}This script will deploy:"
echo "1. Azure Event Hub infrastructure via Terraform"
echo "2. Azure Key Vault and secrets"
echo "3. Scout DLT Pipeline to Databricks"
echo "4. Database migrations"
echo "5. Client360 Dashboard"
echo ""
echo "Ensure you have set the following environment variables:"
echo "- DATABRICKS_HOST"
echo "- DATABRICKS_TOKEN"
echo "- RESOURCE_GROUP_NAME"
echo "- KEY_VAULT_NAME"
echo -e "Continue? (y/n)${NC}"
read -r confirm
if [[ "$confirm" != "y" ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}Creating .env file with default values${NC}"
    cat > .env << EOF
DATABRICKS_HOST=$DATABRICKS_HOST
DATABRICKS_TOKEN=$DATABRICKS_TOKEN
RESOURCE_GROUP_NAME=$RESOURCE_GROUP_NAME
LOCATION=$LOCATION
KEY_VAULT_NAME=$KEY_VAULT_NAME
STATIC_WEB_APP_NAME=$STATIC_WEB_APP_NAME
SIMULATION_MODE=true
EOF
    echo -e "${YELLOW}Created .env file. Please edit it with your actual values then rerun this script.${NC}"
    exit 0
fi

# Load environment variables
echo -e "${BLUE}[2/9] Loading environment variables${NC}"
set -a
source .env
set +a

# Azure Login
echo -e "${BLUE}[3/9] Logging into Azure${NC}"
az login --use-device-code
az account show

# Create Resource Group if it doesn't exist
echo -e "${BLUE}[4/9] Creating/Verifying Resource Group${NC}"
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "Creating resource group $RESOURCE_GROUP_NAME in $LOCATION"
    az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION"
else
    echo "Resource group $RESOURCE_GROUP_NAME already exists"
fi

# Create Key Vault if it doesn't exist
echo -e "${BLUE}[5/9] Setting up Azure Key Vault${NC}"
if ! az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "Creating Key Vault $KEY_VAULT_NAME"
    az keyvault create --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP_NAME" --location "$LOCATION"
else
    echo "Key Vault $KEY_VAULT_NAME already exists"
fi

# Deploy Event Hub infrastructure with Terraform
echo -e "${BLUE}[6/9] Deploying Event Hub infrastructure with Terraform${NC}"
cd terraform
terraform init
terraform plan -var="resource_group_name=$RESOURCE_GROUP_NAME" -var="location=$LOCATION" -out=tfplan
terraform apply tfplan

# Capture Event Hub connection strings and store in Key Vault
echo "Retrieving Event Hub connection strings and storing in Key Vault"
CONNECTION_STRINGS=$(terraform output -json databricks_connection_strings)
echo "$CONNECTION_STRINGS" | jq -r 'to_entries[] | "az keyvault secret set --vault-name '"$KEY_VAULT_NAME"' --name \(.key) --value \(.value)"' | while read -r cmd; do
    eval "$cmd"
done

# Store Databricks token in Key Vault
echo "Storing Databricks token in Key Vault"
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "SQL-ENDPOINT-TOKEN" --value "$DATABRICKS_TOKEN"

# Return to script directory
cd "$SCRIPT_DIR"

# Configure Databricks CLI
echo -e "${BLUE}[7/9] Configuring Databricks CLI and deploying DLT Pipeline${NC}"
databricks configure --host "$DATABRICKS_HOST" --token "$DATABRICKS_TOKEN"

# Deploy DLT pipeline using the deploy_pipeline.sh script
echo "Deploying DLT pipeline"
./deploy_pipeline.sh

# Apply database migrations
echo -e "${BLUE}[8/9] Applying database migrations${NC}"
echo "Applying schema migrations for pipeline integrity"
# Check if sqlcmd is available
if command -v sqlcmd &> /dev/null; then
    echo "Using sqlcmd for SQL Server migrations"
    sqlcmd -S "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -P "$DB_PASSWORD" -i migrations/add_missing_columns.sql
    sqlcmd -S "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -P "$DB_PASSWORD" -i migrations/restore_audio_url.sql
    sqlcmd -S "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -P "$DB_PASSWORD" -i migrations/sari_sari_schema_enhancements.sql
elif command -v psql &> /dev/null; then
    echo "Using psql for PostgreSQL migrations"
    # Uncomment PostgreSQL sections in migration scripts for PostgreSQL compatibility
    sed -i 's/^\/\*//' migrations/restore_audio_url.sql
    sed -i 's/\*\///' migrations/restore_audio_url.sql
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -f migrations/add_missing_columns.sql
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -f migrations/restore_audio_url.sql
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -f migrations/sari_sari_schema_enhancements.sql
else
    echo -e "${YELLOW}Warning: Neither sqlcmd nor psql found. Skipping SQL migrations.${NC}"
    echo "You'll need to run these migrations manually."
fi

# Deploy Client360 Dashboard
echo -e "${BLUE}[9/9] Deploying Client360 Dashboard${NC}"
cd client360_dashboard
echo "Running dashboard deployment"
./deploy_to_azure.sh

# Return to script directory
cd "$SCRIPT_DIR"

# Post-deployment steps
echo -e "${GREEN}Deployment complete!${NC}"
echo "Scout DLT Pipeline and Client360 Dashboard successfully deployed."
echo ""
echo "Next steps:"
echo "1. Configure Raspberry Pi devices to publish to Event Hubs (see pi_client/README.md)"
echo "2. Monitor the DLT pipeline in Databricks"
echo "3. Access the Client360 Dashboard"
echo "4. Set up monitoring and alerts (see client360_dashboard/NEXT_STEPS.md)"
echo ""
echo "For more information, refer to the following documentation:"
echo "- Scout DLT Pipeline: README.md"
echo "- Client360 Dashboard: client360_dashboard/README.md"
echo "- Raspberry Pi Client: pi_client/README.md"
echo ""
echo "Deployment log saved to: $LOG_FILE"
exit 0