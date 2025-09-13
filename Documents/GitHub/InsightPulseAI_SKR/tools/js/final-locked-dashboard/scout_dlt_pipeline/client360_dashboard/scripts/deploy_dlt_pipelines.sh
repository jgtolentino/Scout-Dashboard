#!/bin/bash
# Deploy and validate Databricks DLT pipelines
# This script deploys the Scout ETL medallion architecture
# (Bronze → Silver → Gold) to Databricks and validates each layer.

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Scout ETL Pipeline Deployment ====${NC}"
echo "Deploying Bronze → Silver → Gold medallion architecture..."

# Make the script executable
chmod +x "$0"

# Root directory of the project
ROOT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
DLT_DIR="$(dirname "$ROOT_DIR")"

# Ensure Databricks CLI is installed
if ! command -v databricks &> /dev/null; then
    echo -e "${YELLOW}Databricks CLI not found. Installing...${NC}"
    pip install databricks-cli
fi

# Check environment variables
if [ -z "$DATABRICKS_HOST" ]; then
    echo -e "${RED}Error: DATABRICKS_HOST not set. Please set this environment variable.${NC}"
    exit 1
fi

if [ -z "$DATABRICKS_TOKEN" ]; then
    echo -e "${RED}Error: DATABRICKS_TOKEN not set. Please set this environment variable.${NC}"
    echo "You can also store your token in Key Vault and retrieve it using:"
    echo "export DATABRICKS_TOKEN=\$(az keyvault secret show --vault-name kv-client360 --name DATABRICKS-TOKEN --query value -o tsv)"
    exit 1
fi

# Configure Databricks CLI
echo "Configuring Databricks CLI..."
cat > ~/.databrickscfg << EOF
[DEFAULT]
host = $DATABRICKS_HOST
token = $DATABRICKS_TOKEN
EOF

echo "Databricks CLI configured."

# Create pipeline configuration for deployment
PIPELINE_CONFIG="$ROOT_DIR/temp_pipeline_config.json"

cat > "$PIPELINE_CONFIG" << EOF
{
  "name": "client360_dlt_pipeline",
  "clusters": [
    {
      "label": "default",
      "num_workers": 2,
      "node_type_id": "Standard_DS3_v2"
    }
  ],
  "development": false,
  "continuous": false,
  "libraries": [
    {
      "file": {
        "path": "${DLT_DIR}/scout_bronze_dlt.py"
      }
    },
    {
      "file": {
        "path": "${DLT_DIR}/scout_silver_dlt.py"
      }
    },
    {
      "file": {
        "path": "${DLT_DIR}/scout_gold_dlt.py"
      }
    }
  ],
  "target": "client360_catalog.client360",
  "configuration": {
    "pipelines.useCustomTables": "true",
    "pipelines.enableNoProgress": "true",
    "pipelines.infoHistoryRetentionDays": "30"
  },
  "channels": {
    "instances_per_channel": 1,
    "settings": {
      "eh-pi-stt-raw": {
        "connection_string": "${EVENT_HUB_CONNECTION_STRING}",
        "consumer_group": "dlt-bronze",
        "eventhub_name": "eh-pi-stt-raw",
        "max_events_per_trigger": 10000 
      },
      "eh-pi-visual-stream": {
        "connection_string": "${EVENT_HUB_CONNECTION_STRING}",
        "consumer_group": "dlt-bronze",
        "eventhub_name": "eh-pi-visual-stream",
        "max_events_per_trigger": 10000
      },
      "eh-device-heartbeat": {
        "connection_string": "${EVENT_HUB_CONNECTION_STRING}",
        "consumer_group": "dlt-bronze",
        "eventhub_name": "eh-device-heartbeat",
        "max_events_per_trigger": 10000
      }
    }
  }
}
EOF

# Deploy the DLT pipeline
echo "Deploying DLT pipeline..."
PIPELINE_ID=$(databricks pipelines create --file "$PIPELINE_CONFIG" --output JSON | jq -r '.pipeline_id')

if [ -z "$PIPELINE_ID" ]; then
    echo -e "${RED}Error: Failed to create pipeline.${NC}"
    exit 1
fi

echo -e "${GREEN}Pipeline created with ID: $PIPELINE_ID${NC}"

# Create validation notebook
VALIDATION_NOTEBOOK="$ROOT_DIR/temp_validation_notebook.py"

cat > "$VALIDATION_NOTEBOOK" << 'EOF'
# Databricks notebook source
# COMMAND ----------
# DBTITLE 1,Scout ETL Pipeline Validation

from pyspark.sql import functions as F
import datetime

# COMMAND ----------
# DBTITLE 1,Configuration

# Set the database to use
spark.sql("USE client360_catalog.client360")

# COMMAND ----------
# DBTITLE 1,Helper Functions

def print_validation_header(title):
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80 + "\n")

def run_count_validation(table_name):
    count = spark.sql(f"SELECT COUNT(*) as count FROM {table_name}").collect()[0].count
    print(f"✅ {table_name}: {count:,} records")
    return count

def run_sample_validation(table_name, limit=5):
    print(f"\n📊 Sample data from {table_name}:")
    spark.sql(f"SELECT * FROM {table_name} LIMIT {limit}").show(truncate=False)

def run_schema_validation(table_name):
    print(f"\n📋 Schema for {table_name}:")
    spark.sql(f"DESCRIBE {table_name}").show(truncate=False)

def run_freshness_validation(table_name, timestamp_col):
    result = spark.sql(f"""
        SELECT 
            MAX({timestamp_col}) as latest_timestamp,
            CURRENT_TIMESTAMP() as current_timestamp,
            DATEDIFF(CURRENT_TIMESTAMP(), MAX({timestamp_col})) as days_since_update
        FROM {table_name}
    """).collect()[0]
    
    latest = result.latest_timestamp
    days_since = result.days_since_update
    
    freshness_status = "✅ FRESH" if days_since < 1 else "⚠️ STALE"
    print(f"{freshness_status} {table_name}: Last updated {days_since} days ago ({latest})")
    return days_since

# COMMAND ----------
# DBTITLE 1,Bronze Layer Validation

print_validation_header("BRONZE LAYER VALIDATION")

bronze_tables = [
    "bronze_stt_raw",
    "bronze_visual_stream",
    "bronze_raw_events",
    "bronze_device_heartbeat"
]

bronze_results = {}
for table in bronze_tables:
    try:
        count = run_count_validation(table)
        if count > 0:
            run_sample_validation(table)
            run_schema_validation(table)
        bronze_results[table] = count
    except Exception as e:
        print(f"❌ Error validating {table}: {str(e)}")
        bronze_results[table] = 0

# COMMAND ----------
# DBTITLE 1,Silver Layer Validation

print_validation_header("SILVER LAYER VALIDATION")

silver_tables = [
    "silver_annotated_events",
    "silver_device_heartbeat",
    "silver_multimodal_aligned"
]

silver_results = {}
for table in silver_tables:
    try:
        count = run_count_validation(table)
        if count > 0:
            run_sample_validation(table)
            
            # Check for null floods (high percentage of nulls in any column)
            print(f"\n🔍 Checking for NULL floods in {table}:")
            df = spark.table(table)
            for column in df.columns:
                null_count = df.filter(F.col(column).isNull()).count()
                if count > 0:
                    null_pct = (null_count / count) * 100
                    status = "⚠️" if null_pct > 20 else "✅"
                    print(f"{status} {column}: {null_pct:.1f}% NULL ({null_count:,}/{count:,})")
        
        silver_results[table] = count
    except Exception as e:
        print(f"❌ Error validating {table}: {str(e)}")
        silver_results[table] = 0

# COMMAND ----------
# DBTITLE 1,Gold Layer Validation

print_validation_header("GOLD LAYER VALIDATION")

gold_tables = [
    "gold_store_interaction_metrics",
    "gold_transcript_sentiment_analysis",
    "gold_device_health_summary",
    "gold_brand_mentions"
]

gold_results = {}
gold_freshness = {}

for table in gold_tables:
    try:
        count = run_count_validation(table)
        if count > 0:
            run_sample_validation(table)
            
            # Check data freshness
            if "metrics" in table or "sentiment" in table:
                # These tables have window columns
                freshness = run_freshness_validation(table, "window_end")
            else:
                # Try processing_time for other tables
                freshness = run_freshness_validation(table, "processing_time")
                
            gold_freshness[table] = freshness
            
            # For metrics tables, check for outliers
            if "metrics" in table:
                print(f"\n📊 Basic statistics for {table}:")
                df = spark.table(table)
                numeric_cols = [f.name for f in df.schema.fields if f.dataType.typeName() in ["double", "float", "decimal", "integer", "long"]]
                
                if numeric_cols:
                    df.select(numeric_cols).summary("min", "mean", "max").show()
        
        gold_results[table] = count
    except Exception as e:
        print(f"❌ Error validating {table}: {str(e)}")
        gold_results[table] = 0

# COMMAND ----------
# DBTITLE 1,Data Lineage Validation

print_validation_header("DATA LINEAGE VALIDATION")

# Check if silver data volumes are reasonable compared to bronze
for silver_table, silver_count in silver_results.items():
    if silver_count > 0:
        # Find corresponding bronze table
        if "annotated_events" in silver_table:
            bronze_table = "bronze_raw_events"
        elif "device" in silver_table:
            bronze_table = "bronze_device_heartbeat"
        else:
            continue
            
        bronze_count = bronze_results.get(bronze_table, 0)
        if bronze_count > 0:
            ratio = silver_count / bronze_count
            status = "✅" if 0.1 <= ratio <= 2.0 else "⚠️"
            print(f"{status} {silver_table} ({silver_count:,}) to {bronze_table} ({bronze_count:,}) ratio: {ratio:.2f}")

# Check if gold data volumes are reasonable compared to silver
for gold_table, gold_count in gold_results.items():
    if gold_count > 0:
        # Find corresponding silver table
        if "interaction" in gold_table:
            silver_table = "silver_annotated_events"
        elif "sentiment" in gold_table:
            silver_table = "silver_annotated_events"
        elif "device" in gold_table:
            silver_table = "silver_device_heartbeat"
        else:
            continue
            
        silver_count = silver_results.get(silver_table, 0)
        if silver_count > 0:
            ratio = gold_count / silver_count
            status = "✅" if ratio <= 1.0 else "⚠️"
            print(f"{status} {gold_table} ({gold_count:,}) to {silver_table} ({silver_count:,}) ratio: {ratio:.2f}")

# COMMAND ----------
# DBTITLE 1,Validation Summary

print_validation_header("VALIDATION SUMMARY")

# Bronze summary
print("BRONZE LAYER:")
for table, count in bronze_results.items():
    status = "✅" if count > 0 else "❌"
    print(f"{status} {table}: {count:,} records")

print("\nSILVER LAYER:")
for table, count in silver_results.items():
    status = "✅" if count > 0 else "❌"
    print(f"{status} {table}: {count:,} records")

print("\nGOLD LAYER:")
for table, count in gold_results.items():
    freshness = gold_freshness.get(table, None)
    freshness_str = f" (last updated {freshness} days ago)" if freshness is not None else ""
    status = "✅" if count > 0 and (freshness is None or freshness < 1) else "❌"
    print(f"{status} {table}: {count:,} records{freshness_str}")

# Overall status
bronze_ok = all(count > 0 for count in bronze_results.values())
silver_ok = all(count > 0 for count in silver_results.values())
gold_ok = all(count > 0 for count in gold_results.values())
freshness_ok = all(days < 1 for days in gold_freshness.values())

if bronze_ok and silver_ok and gold_ok and freshness_ok:
    print("\n✅ ALL VALIDATIONS PASSED!")
else:
    print("\n❌ SOME VALIDATIONS FAILED!")
    
    if not bronze_ok:
        print("- Bronze layer has empty tables")
    if not silver_ok:
        print("- Silver layer has empty tables")
    if not gold_ok:
        print("- Gold layer has empty tables")
    if not freshness_ok:
        print("- Some gold tables are not fresh")

# Set notebook exit status for the shell script
if bronze_ok and silver_ok and gold_ok and freshness_ok:
    dbutils.notebook.exit(0)  # Success
else:
    dbutils.notebook.exit(1)  # Failure
EOF

# Upload validation notebook to Databricks
echo "Uploading validation notebook..."
NOTEBOOK_PATH="/Shared/client360/validate_dlt"
databricks workspace import -l PYTHON -f "$VALIDATION_NOTEBOOK" "$NOTEBOOK_PATH" -o

# Start the pipeline
echo "Starting DLT pipeline execution..."
databricks pipelines start --pipeline-id "$PIPELINE_ID"

# Wait for pipeline to complete (polling)
echo "Waiting for pipeline execution to complete..."
sleep 60  # Initial wait to let the pipeline get started

MAX_WAIT_MINS=30
START_TIME=$(date +%s)
END_TIME=$((START_TIME + MAX_WAIT_MINS * 60))

while [ $(date +%s) -lt $END_TIME ]; do
    # Get latest pipeline update
    STATUS=$(databricks pipelines get --pipeline-id "$PIPELINE_ID" --output JSON | jq -r '.state')
    
    if [ "$STATUS" == "IDLE" ]; then
        echo -e "${GREEN}Pipeline completed successfully!${NC}"
        break
    elif [ "$STATUS" == "FAILED" ]; then
        echo -e "${RED}Pipeline failed.${NC}"
        echo "Check Databricks UI for error details."
        exit 1
    else
        echo "Pipeline still running (status: $STATUS). Waiting..."
        sleep 30
    fi
done

if [ $(date +%s) -ge $END_TIME ]; then
    echo -e "${YELLOW}Warning: Maximum wait time reached.${NC}"
    echo "Pipeline execution is taking longer than expected."
    echo "You can check the Databricks UI for status."
    echo "Continuing with validation..."
fi

# Run validation notebook
echo "Running validation notebook..."
RUN_ID=$(databricks runs submit --run-name "Scout DLT Validation" --existing-cluster-id "YOUR_CLUSTER_ID" --notebook-task "{'notebook_path': '$NOTEBOOK_PATH'}" --output JSON | jq -r '.run_id')

if [ -z "$RUN_ID" ]; then
    echo -e "${RED}Error: Failed to submit validation notebook run.${NC}"
    exit 1
fi

echo "Validation notebook running with ID: $RUN_ID"

# Wait for validation to complete
echo "Waiting for validation to complete..."
sleep 10  # Initial wait

VALIDATION_STATUS="RUNNING"
MAX_WAIT_MINS=5
START_TIME=$(date +%s)
END_TIME=$((START_TIME + MAX_WAIT_MINS * 60))

while [ $(date +%s) -lt $END_TIME ]; do
    # Get job run status
    RUN_STATUS=$(databricks runs get --run-id "$RUN_ID" --output JSON | jq -r '.state.life_cycle_state')
    RUN_RESULT=$(databricks runs get --run-id "$RUN_ID" --output JSON | jq -r '.state.result_state')
    
    if [ "$RUN_STATUS" == "TERMINATED" ]; then
        if [ "$RUN_RESULT" == "SUCCESS" ]; then
            echo -e "${GREEN}Validation completed successfully!${NC}"
            VALIDATION_STATUS="SUCCESS"
        else
            echo -e "${RED}Validation failed.${NC}"
            echo "Check Databricks UI for error details."
            VALIDATION_STATUS="FAILED"
        fi
        break
    else
        echo "Validation still running (status: $RUN_STATUS). Waiting..."
        sleep 10
    fi
done

if [ $(date +%s) -ge $END_TIME ]; then
    echo -e "${YELLOW}Warning: Maximum wait time reached for validation.${NC}"
    echo "Validation is taking longer than expected."
    echo "You can check the Databricks UI for status."
    VALIDATION_STATUS="TIMEOUT"
fi

# Clean up temporary files
rm -f "$PIPELINE_CONFIG" "$VALIDATION_NOTEBOOK"

# Provide final status
echo -e "${BLUE}=== Scout ETL Deployment Summary ====${NC}"
echo "Pipeline ID: $PIPELINE_ID"
echo "Validation Notebook: $NOTEBOOK_PATH"
echo "Validation Status: $VALIDATION_STATUS"

if [ "$VALIDATION_STATUS" == "SUCCESS" ]; then
    echo -e "${GREEN}✅ Deployment and validation successful!${NC}"
    
    # Update configuration file
    echo "Updating ETL deployment configuration..."
    ETL_CONFIG_FILE="$ROOT_DIR/etl-deploy-kit.yaml"
    
    # Update the pipeline ID in configuration file
    sed -i '' "s/pipeline_id: .*/pipeline_id: $PIPELINE_ID/g" "$ETL_CONFIG_FILE" || echo "Note: Could not update ETL config file. Pipeline ID needs manual update."
    
    echo "Next steps:"
    echo "1. Ensure your Event Hub connection is properly configured"
    echo "2. Test the Databricks SQL connection with ./scripts/test_databricks_connectivity.sh"
    echo "3. Deploy the dashboard with ./scripts/deploy-only-production.sh"
    exit 0
else
    echo -e "${RED}❌ Deployment or validation failed.${NC}"
    echo "Please check the Databricks UI for error details."
    echo "Pipeline ID: $PIPELINE_ID"
    echo "Validation Notebook: $NOTEBOOK_PATH"
    exit 1
fi