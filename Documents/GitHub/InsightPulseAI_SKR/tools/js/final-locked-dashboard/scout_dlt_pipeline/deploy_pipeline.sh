#!/bin/bash
# Deploy Scout DLT Pipeline to Databricks and Azure Event Hub Infrastructure

# Exit on error
set -e

# Configuration
DATABRICKS_HOST="${DATABRICKS_HOST:-"https://adb-xxxx.azuredatabricks.net"}"
DATABRICKS_TOKEN="${DATABRICKS_TOKEN:-"dapi_xxxxx"}"
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-"rg-scout-eventhub"}"
LOCATION="${LOCATION:-"eastus2"}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Scout DLT Pipeline Deployment${NC}"
echo "==============================="
echo ""

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Terraform is not installed. Please install Terraform and try again.${NC}"
    exit 1
fi

# Check if Databricks CLI is installed
if ! command -v databricks &> /dev/null; then
    echo -e "${YELLOW}Databricks CLI not found. Installing...${NC}"
    pip install databricks-cli
fi

# Confirm deployment
echo -e "${YELLOW}This script will deploy:"
echo "1. Azure Event Hub infrastructure via Terraform"
echo "2. Scout DLT Pipeline to Databricks"
echo ""
echo -e "Continue? (y/n)${NC}"
read -r confirm
if [[ "$confirm" != "y" ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Azure Login
echo -e "${GREEN}[1/6] Logging into Azure${NC}"
az login --use-device-code

# Terraform deployment
echo -e "${GREEN}[2/6] Deploying Event Hub infrastructure with Terraform${NC}"
cd terraform
terraform init
terraform plan -var="resource_group_name=$RESOURCE_GROUP_NAME" -var="location=$LOCATION" -out=tfplan
terraform apply tfplan

# Capture Event Hub connection strings
echo -e "${GREEN}[3/6] Retrieving Event Hub connection strings${NC}"
CONNECTION_STRINGS=$(terraform output -json databricks_connection_strings)

# Configure Databricks CLI
echo -e "${GREEN}[4/6] Configuring Databricks CLI${NC}"
databricks configure --host "$DATABRICKS_HOST" --token "$DATABRICKS_TOKEN"

# Create Databricks Secrets for Event Hub connections
echo -e "${GREEN}[5/6] Creating Databricks secrets for Event Hub connections${NC}"
# Check if secret scope exists, create if not
if ! databricks secrets list-scopes | grep -q "scout-eventhub"; then
    databricks secrets create-scope --scope scout-eventhub
fi

# Store connection strings in Databricks secrets
echo "$CONNECTION_STRINGS" | jq -r 'to_entries[] | "databricks secrets put --scope scout-eventhub --key \(.key) --string-value \(.value)"' | while read -r cmd; do
    eval "$cmd"
done

# Deploy DLT pipeline
echo -e "${GREEN}[6/6] Deploying Delta Live Tables pipeline to Databricks${NC}"
PIPELINE_NAME="ScoutDLT"
PIPELINE_JSON=$(cat <<EOF
{
  "name": "$PIPELINE_NAME",
  "continuous": true,
  "clusters": [
    {
      "label": "default",
      "autoscale": {
        "min_workers": 1,
        "max_workers": 5
      },
      "spark_conf": {
        "spark.databricks.delta.schema.autoMerge.enabled": "true",
        "spark.databricks.io.cache.enabled": "true"
      }
    }
  ],
  "development": false,
  "libraries": [
    {
      "file": {
        "path": "../scout_bronze_dlt.py"
      }
    },
    {
      "file": {
        "path": "../scout_silver_dlt.py"
      }
    },
    {
      "file": {
        "path": "../scout_gold_dlt.py"
      }
    }
  ],
  "target": "scout_lakehouse",
  "configuration": {
    "spark.databricks.delta.optimizeWrite.enabled": "true",
    "spark.databricks.delta.autoCompact.enabled": "true",
    "spark.eventhub.connectionString": "{{secrets/scout-eventhub/namespace}}",
    "pipelines.useMultiTaskRun": "true"
  }
}
EOF
)

# Save to temporary file
TEMP_FILE=$(mktemp)
echo "$PIPELINE_JSON" > "$TEMP_FILE"

# Create or update the pipeline
if databricks pipelines get --pipeline-name "$PIPELINE_NAME" &> /dev/null; then
    echo "Updating existing pipeline: $PIPELINE_NAME"
    databricks pipelines reset --pipeline-name "$PIPELINE_NAME" --json-file "$TEMP_FILE"
else
    echo "Creating new pipeline: $PIPELINE_NAME"
    databricks pipelines create --json-file "$TEMP_FILE"
fi

# Start the pipeline
PIPELINE_ID=$(databricks pipelines get --pipeline-name "$PIPELINE_NAME" | jq -r '.pipeline_id')
databricks pipelines start --pipeline-id "$PIPELINE_ID"

# Clean up
rm "$TEMP_FILE"

echo -e "${GREEN}Deployment complete!${NC}"
echo "Scout DLT Pipeline is now running in Databricks."
echo "Event Hub infrastructure is deployed in Azure."
echo ""
echo "Next steps:"
echo "1. Configure Raspberry Pi devices to publish to Event Hubs"
echo "2. Monitor the pipeline in Databricks"
echo "3. Connect the Retail Advisor dashboard to the Gold tables"
exit 0