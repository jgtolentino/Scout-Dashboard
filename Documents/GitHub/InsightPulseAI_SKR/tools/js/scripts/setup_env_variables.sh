#!/bin/bash
# Setup Environment Variables for Static Metrics Export
# Usage: ./setup_env_variables.sh [production|staging|development]

# Default to production if no argument provided
ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

echo "Setting up environment variables for ${ENVIRONMENT} environment..."

# Create environment-specific .env file
case $ENVIRONMENT in
  production)
    cat > $ENV_FILE << EOL
# Production Databricks SQL Connection
DATABRICKS_SQL_HOST=adb-your-production-host.azuredatabricks.net
DATABRICKS_SQL_PATH=/sql/1.0/warehouses/your-production-warehouse-id
DATABRICKS_SQL_PORT=443
DATABRICKS_CATALOG=client360_catalog
DATABRICKS_SCHEMA=client360_prod

# Azure Key Vault Configuration
KEY_VAULT_NAME=kv-client360-prod
USE_MANAGED_IDENTITY=true

# Production Settings
SIMULATION_MODE=false
LOG_LEVEL=info

# Export Configuration
EXPORT_OUTPUT_DIR=./deploy/data
EOL
    ;;
  
  staging)
    cat > $ENV_FILE << EOL
# Staging Databricks SQL Connection
DATABRICKS_SQL_HOST=adb-your-staging-host.azuredatabricks.net
DATABRICKS_SQL_PATH=/sql/1.0/warehouses/your-staging-warehouse-id
DATABRICKS_SQL_PORT=443
DATABRICKS_CATALOG=client360_catalog
DATABRICKS_SCHEMA=client360_staging

# Azure Key Vault Configuration
KEY_VAULT_NAME=kv-client360-staging
USE_MANAGED_IDENTITY=true

# Staging Settings
SIMULATION_MODE=false
LOG_LEVEL=debug

# Export Configuration
EXPORT_OUTPUT_DIR=./deploy/data
EOL
    ;;
  
  development)
    cat > $ENV_FILE << EOL
# Development Databricks SQL Connection
DATABRICKS_SQL_HOST=adb-your-dev-host.azuredatabricks.net
DATABRICKS_SQL_PATH=/sql/1.0/warehouses/your-dev-warehouse-id
DATABRICKS_SQL_PORT=443
DATABRICKS_CATALOG=client360_catalog
DATABRICKS_SCHEMA=client360_dev

# Azure Key Vault Configuration
KEY_VAULT_NAME=kv-client360-dev
USE_MANAGED_IDENTITY=true

# Development Settings
SIMULATION_MODE=false
LOG_LEVEL=debug

# Export Configuration
EXPORT_OUTPUT_DIR=./deploy/data
EOL
    ;;
  
  *)
    echo "Error: Unknown environment '${ENVIRONMENT}'"
    echo "Usage: ./setup_env_variables.sh [production|staging|development]"
    exit 1
    ;;
esac

echo "Created ${ENV_FILE} with environment-specific settings"
echo "To use these settings, run: export $(grep -v '^#' $ENV_FILE | xargs)"
echo "Or source the file: source ${ENV_FILE}"

# For Azure Functions, you'd need to upload these as Application Settings
if [ "$ENVIRONMENT" == "production" ]; then
  echo "For Azure Functions, run these commands to set app settings:"
  echo ""
  echo "az functionapp config appsettings set --name YourFunctionAppName --resource-group YourResourceGroup \\"
  cat $ENV_FILE | grep -v "^#" | sed 's/\(.*\)=\(.*\)/  --settings "\1=\2" \\/g'
  echo "  --query '[].name'"
fi

echo "Done!"