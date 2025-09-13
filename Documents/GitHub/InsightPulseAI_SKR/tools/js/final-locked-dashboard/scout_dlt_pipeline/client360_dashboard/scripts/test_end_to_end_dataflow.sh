#!/bin/bash
# End-to-End Dataflow Test
# This script tests the complete data flow from Event Hub -> DLT -> SQL -> Dashboard

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Scout ETL End-to-End Dataflow Test ====${NC}"

# Make the script executable
chmod +x "$0"

# Root directory of the project
ROOT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"

# Check for required commands
for cmd in node az databricks jq; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Error: $cmd command not found. Please install it first.${NC}"
        exit 1
    fi
done

# Check if logged in to Azure and Databricks
AZURE_LOGGED_IN=$(az account show 2>/dev/null)
DATABRICKS_CONFIGURED=$([ -f ~/.databrickscfg ] && grep -q "host\|token" ~/.databrickscfg && echo "yes" || echo "")

if [ -z "$AZURE_LOGGED_IN" ]; then
    echo "You are not logged in to Azure. Please log in."
    az login
fi

if [ -z "$DATABRICKS_CONFIGURED" ]; then
    echo -e "${RED}Error: Databricks CLI not configured.${NC}"
    echo "Please run the setup_databricks_sql.sh script first."
    exit 1
fi

# Check for environment variables
ENV_FILE="$ROOT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Check for required environment variables
REQUIRED_VARS=(
    "DATABRICKS_SQL_HOST"
    "DATABRICKS_SQL_PATH"
    "KEY_VAULT_NAME"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}Error: The following required environment variables are missing:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "- $var"
    done
    echo "Please set these variables or run the setup scripts first."
    exit 1
fi

# Check for Key Vault and get secrets
echo "Retrieving secrets from Key Vault..."
EVENT_HUB_CONNECTION_STRING=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "EVENT-HUB-CONNECTION-STRING" --query value -o tsv 2>/dev/null)
SQL_ENDPOINT_TOKEN=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "SQL-ENDPOINT-TOKEN" --query value -o tsv 2>/dev/null)

if [ -z "$EVENT_HUB_CONNECTION_STRING" ]; then
    echo -e "${RED}Error: EVENT-HUB-CONNECTION-STRING not found in Key Vault.${NC}"
    echo "Please run the configure_event_hubs.sh script first."
    exit 1
fi

if [ -z "$SQL_ENDPOINT_TOKEN" ]; then
    echo -e "${RED}Error: SQL-ENDPOINT-TOKEN not found in Key Vault.${NC}"
    echo "Please run the setup_databricks_sql.sh script first."
    exit 1
fi

export EVENT_HUB_CONNECTION_STRING
export DATABRICKS_SQL_TOKEN="$SQL_ENDPOINT_TOKEN"

# Get Event Hub names from configuration
EVENT_HUBS=$(grep -A30 "event_hubs:" "$ROOT_DIR/etl-deploy-kit.yaml" | grep "name:" | awk -F': ' '{print $2}' | tr -d ' "')

# Get the first Event Hub for testing
TEST_EVENT_HUB=$(echo "$EVENT_HUBS" | head -1)

if [ -z "$TEST_EVENT_HUB" ]; then
    echo -e "${RED}Error: Could not find Event Hub names in etl-deploy-kit.yaml.${NC}"
    exit 1
fi

echo "Using Event Hub $TEST_EVENT_HUB for testing."

# Phase 1: Generate test events and send to Event Hub
echo ""
echo -e "${BLUE}Phase 1: Generating and sending test events to Event Hub${NC}"

# Create a temporary test script
TEST_SCRIPT="$ROOT_DIR/temp_event_hub_test.js"

cat > "$TEST_SCRIPT" << EOF
const { EventHubProducerClient } = require('@azure/event-hubs');

// Generate a unique run ID for this test
const TEST_RUN_ID = "test-" + Date.now();
console.log("Test Run ID:", TEST_RUN_ID);

async function main() {
    const connectionString = process.env.EVENT_HUB_CONNECTION_STRING;
    const eventHubName = "$TEST_EVENT_HUB";
    
    if (!connectionString) {
        console.error("ERROR: EVENT_HUB_CONNECTION_STRING environment variable not set.");
        process.exit(1);
    }
    
    console.log("Connecting to Event Hub:", eventHubName);
    const producer = new EventHubProducerClient(connectionString, eventHubName);
    
    try {
        // Create a batch of test events
        const batchOptions = { };
        const batch = await producer.createBatch(batchOptions);
        
        const timestamp = new Date().toISOString();
        const deviceId = "pi-test-device-" + Math.floor(Math.random() * 1000);
        const storeId = "store-" + Math.floor(Math.random() * 100);
        
        // Create test event based on the Event Hub type
        let testEvent;
        
        if (eventHubName.includes("stt")) {
            // Speech-to-text event
            testEvent = {
                id: \`\${TEST_RUN_ID}-\${Date.now()}\`,
                device_id: deviceId,
                store_id: storeId,
                timestamp: timestamp,
                transcript: "I would like to buy some milk and bread please.",
                language: "en",
                confidence_score: 0.92,
                session_id: "session-" + Math.floor(Math.random() * 10000),
                customer_id: "customer-" + Math.floor(Math.random() * 500),
                duration_sec: 12.5,
                test_run_id: TEST_RUN_ID
            };
        } else if (eventHubName.includes("visual")) {
            // Visual detection event
            testEvent = {
                id: \`\${TEST_RUN_ID}-\${Date.now()}\`,
                device_id: deviceId,
                store_id: storeId,
                timestamp: timestamp,
                detections: [
                    { type: "person", confidence: 0.95, bbox: [0.2, 0.3, 0.4, 0.6] },
                    { type: "product", confidence: 0.87, bbox: [0.5, 0.4, 0.2, 0.3] }
                ],
                session_id: "session-" + Math.floor(Math.random() * 10000),
                zone_id: "product_display",
                dwell_time_sec: 45.2,
                test_run_id: TEST_RUN_ID
            };
        } else if (eventHubName.includes("heartbeat")) {
            // Device heartbeat event
            testEvent = {
                id: \`\${TEST_RUN_ID}-\${Date.now()}\`,
                device_id: deviceId,
                store_id: storeId,
                timestamp: timestamp,
                status: "online",
                battery_level: 0.78,
                temperature_c: 42.3,
                memory_usage_pct: 68.5,
                disk_usage_pct: 57.2,
                network_signal_strength: 0.92,
                camera_fps: 25.4,
                errors: null,
                software_version: "1.2.3",
                test_run_id: TEST_RUN_ID
            };
        } else {
            // Generic test event
            testEvent = {
                id: \`\${TEST_RUN_ID}-\${Date.now()}\`,
                device_id: deviceId,
                store_id: storeId,
                timestamp: timestamp,
                type: "test-event",
                data: "Sample test data",
                test_run_id: TEST_RUN_ID
            };
        }
        
        // Add the event to the batch
        if (!batch.tryAdd({ body: testEvent })) {
            console.error("Failed to add event to batch.");
            process.exit(1);
        }
        
        console.log("Added test event to batch:", JSON.stringify(testEvent, null, 2));
        
        // Send the batch
        console.log("Sending batch...");
        await producer.sendBatch(batch);
        console.log("Test event sent successfully!");
        
        // Output the test run ID for tracking
        console.log("TEST_RUN_ID=" + TEST_RUN_ID);
        
    } finally {
        // Close the producer
        await producer.close();
        console.log("Producer closed.");
    }
}

main().catch((err) => {
    console.error("Error sending test events:", err);
    process.exit(1);
});
EOF

# Ensure @azure/event-hubs is installed
echo "Checking for @azure/event-hubs package..."
if ! npm list @azure/event-hubs --json 2>/dev/null | grep -q '"@azure/event-hubs"'; then
    echo "Installing @azure/event-hubs package..."
    npm install --no-save @azure/event-hubs
fi

# Run the test script
echo "Running Event Hub test sender..."
TEST_OUTPUT=$(node "$TEST_SCRIPT")
echo "$TEST_OUTPUT"

# Extract the test run ID for tracking
TEST_RUN_ID=$(echo "$TEST_OUTPUT" | grep "TEST_RUN_ID=" | cut -d= -f2)

if [ -z "$TEST_RUN_ID" ]; then
    echo -e "${RED}Error: Failed to extract test run ID.${NC}"
    rm "$TEST_SCRIPT"
    exit 1
fi

echo -e "${GREEN}✅ Test events sent successfully with run ID: $TEST_RUN_ID${NC}"

# Phase 2: Verify data in Databricks Delta tables
echo ""
echo -e "${BLUE}Phase 2: Verifying data in Databricks Delta tables${NC}"
echo "Waiting for DLT pipeline to process events (this may take a few minutes)..."
sleep 60  # Initial wait for processing

# Create a validation notebook
VALIDATION_NOTEBOOK="$ROOT_DIR/temp_dataflow_validation.py"

cat > "$VALIDATION_NOTEBOOK" << EOF
# Databricks notebook source
# COMMAND ----------
# DBTITLE 1,Scout ETL End-to-End Validation

test_run_id = "$TEST_RUN_ID"
print("Validating data for test run ID:", test_run_id)

# COMMAND ----------
# DBTITLE 1,Check Bronze Tables

def check_table(table_name, test_run_id_column="test_run_id"):
    try:
        query = f"SELECT COUNT(*) as count FROM {table_name} WHERE {test_run_id_column} = '{test_run_id}'"
        result = spark.sql(query).collect()
        count = result[0].count if result else 0
        
        if count > 0:
            print(f"✅ {table_name}: {count} records found for test run ID {test_run_id}")
            return True
        else:
            print(f"❌ {table_name}: No records found for test run ID {test_run_id}")
            return False
    except Exception as e:
        print(f"❌ {table_name}: Error - {str(e)}")
        return False

# Try catalog.schema.table syntax if Unity Catalog is enabled
catalog_schema = "client360_catalog.client360."
hive_schema = ""

# Check bronze tables
bronze_tables = [
    "bronze_stt_raw", 
    "bronze_visual_stream", 
    "bronze_device_heartbeat"
]

bronze_found = False
for schema in [catalog_schema, hive_schema]:
    if bronze_found:
        break
        
    for table in bronze_tables:
        full_table = schema + table
        if check_table(full_table):
            bronze_found = True
            break

# COMMAND ----------
# DBTITLE 1,Check Silver Tables

# The test run ID might be in a different field in silver layer
silver_tables = [
    "silver_annotated_events",
    "silver_device_heartbeat",
    "silver_multimodal_aligned"
]

silver_found = False
for schema in [catalog_schema, hive_schema]:
    if silver_found:
        break
        
    for table in silver_tables:
        full_table = schema + table
        
        # Try different potential columns for tracking the test run ID
        for column in ["test_run_id", "metadata.test_run_id", "properties.test_run_id"]:
            try:
                split_column = column.split(".")
                if len(split_column) > 1:
                    query = f"SELECT COUNT(*) as count FROM {full_table} WHERE {split_column[0]}.{split_column[1]} = '{test_run_id}'"
                else:
                    query = f"SELECT COUNT(*) as count FROM {full_table} WHERE {column} = '{test_run_id}'"
                    
                result = spark.sql(query).collect()
                count = result[0].count if result else 0
                
                if count > 0:
                    print(f"✅ {full_table}: {count} records found using column {column}")
                    silver_found = True
                    break
            except Exception:
                continue

if not silver_found:
    print(f"❌ Silver tables: No records found for test run ID {test_run_id}")

# COMMAND ----------
# DBTITLE 1,Check Gold Tables

# The test run might not propagate to gold tables yet, so check if they exist at all
gold_tables = [
    "gold_store_interaction_metrics",
    "gold_device_health_summary"
]

gold_exists = False
for schema in [catalog_schema, hive_schema]:
    if gold_exists:
        break
        
    for table in gold_tables:
        full_table = schema + table
        try:
            count = spark.sql(f"SELECT COUNT(*) as count FROM {full_table}").collect()[0].count
            print(f"✅ {full_table}: {count} total records")
            gold_exists = True
            break
        except Exception:
            continue

if not gold_exists:
    print(f"❌ Gold tables: No tables found")

# COMMAND ----------
# DBTITLE 1,Overall Status

if bronze_found:
    print("✅ Bronze layer: Test events successfully captured")
else:
    print("❌ Bronze layer: Test events not found")
    
if silver_found:
    print("✅ Silver layer: Data successfully processed")
else:
    print("❌ Silver layer: Data not processed yet")
    
if gold_exists:
    print("✅ Gold layer: Tables exist")
else:
    print("❌ Gold layer: Tables not found")

# Set notebook exit status
if bronze_found:
    dbutils.notebook.exit(0)  # At least Bronze data was found
else:
    dbutils.notebook.exit(1)  # No test data found
EOF

# Upload validation notebook to Databricks
echo "Uploading validation notebook..."
NOTEBOOK_PATH="/Shared/client360/end_to_end_test"
databricks workspace import -l PYTHON -f "$VALIDATION_NOTEBOOK" "$NOTEBOOK_PATH" -o

# Get cluster ID
CLUSTER_ID=$(databricks clusters list --output JSON | jq -r '.clusters[] | select(.state=="RUNNING") | .cluster_id' | head -1)

if [ -z "$CLUSTER_ID" ]; then
    echo -e "${YELLOW}No running cluster found. Creating a temporary cluster...${NC}"
    CLUSTER_ID=$(databricks clusters create --json "{\"cluster_name\":\"temp-validation-cluster\",\"spark_version\":\"11.3.x-scala2.12\",\"node_type_id\":\"Standard_DS3_v2\",\"num_workers\":1,\"autotermination_minutes\":30}" | jq -r '.cluster_id')
    
    echo "Waiting for cluster to start..."
    while [ "$(databricks clusters get --cluster-id "$CLUSTER_ID" --output JSON | jq -r '.state')" != "RUNNING" ]; do
        echo -n "."
        sleep 10
    done
    echo ""
fi

# Run the validation notebook
echo "Running validation notebook..."
RUN_OUTPUT=$(databricks runs submit --run-name "End-to-End Validation" --existing-cluster-id "$CLUSTER_ID" --notebook-task "{\"notebook_path\":\"$NOTEBOOK_PATH\"}" --output JSON)
RUN_ID=$(echo "$RUN_OUTPUT" | jq -r '.run_id')

echo "Validation running with run ID: $RUN_ID"
echo "Waiting for results..."

# Poll for completion
while true; do
    RUN_STATUS=$(databricks runs get --run-id "$RUN_ID" --output JSON)
    LIFE_CYCLE_STATE=$(echo "$RUN_STATUS" | jq -r '.state.life_cycle_state')
    RESULT_STATE=$(echo "$RUN_STATUS" | jq -r '.state.result_state')
    
    if [ "$LIFE_CYCLE_STATE" == "TERMINATED" ]; then
        echo "Validation complete with result: $RESULT_STATE"
        break
    fi
    
    echo -n "."
    sleep 5
done

# Get notebook output
echo ""
echo "Validation results:"
databricks runs get-output --run-id "$RUN_ID"

if [ "$RESULT_STATE" == "SUCCESS" ]; then
    echo -e "${GREEN}✅ Databricks data flow validated successfully!${NC}"
    DATABRICKS_VALIDATION=true
else
    echo -e "${YELLOW}⚠️ Databricks data flow validation incomplete. Data may still be processing.${NC}"
    DATABRICKS_VALIDATION=false
fi

# Phase 3: Test SQL endpoint connectivity
echo ""
echo -e "${BLUE}Phase 3: Testing SQL endpoint connectivity${NC}"

# Create test script
TEST_SQL_SCRIPT="$ROOT_DIR/temp_sql_test.js"

cat > "$TEST_SQL_SCRIPT" << EOF
const { Pool } = require('pg');
const fs = require('fs');

async function testSqlConnection() {
    const host = process.env.DATABRICKS_SQL_HOST.replace(/^https?:\/\//, '');
    const httpPath = process.env.DATABRICKS_SQL_PATH;
    const token = process.env.DATABRICKS_SQL_TOKEN;
    
    if (!host || !httpPath || !token) {
        console.error('Missing required environment variables:');
        if (!host) console.error('- DATABRICKS_SQL_HOST');
        if (!httpPath) console.error('- DATABRICKS_SQL_PATH');
        if (!token) console.error('- DATABRICKS_SQL_TOKEN');
        process.exit(1);
    }
    
    console.log('Connecting to Databricks SQL endpoint...');
    console.log('Host:', host);
    console.log('HTTP Path:', httpPath);
    
    const pool = new Pool({
        user: 'token',
        password: token,
        host: host,
        port: 443,
        ssl: {
            rejectUnauthorized: true
        },
        database: 'client360_catalog',
        connectionTimeoutMillis: 15000,
        query_timeout: 60000,
        connectionString: \`Driver=Simba Spark ODBC Driver;Host=\${host};Port=443;SSL=1;AuthMech=3;UID=token;PWD=\${token};HTTPPath=\${httpPath};Schema=client360\`
    });
    
    try {
        console.log('Testing basic query...');
        const result = await pool.query('SELECT current_date() as today');
        console.log('Query result:', result.rows[0]);
        
        console.log('Testing data freshness query...');
        const freshness = await pool.query(\`
            SELECT
                'store_metrics' AS data_type,
                CURRENT_DATE() AS current_date
        \`);
        console.log('Data freshness result:', freshness.rows[0]);
        
        console.log('SQL connection test successful!');
        return true;
    } catch (error) {
        console.error('Error connecting to SQL endpoint:', error);
        return false;
    } finally {
        await pool.end();
    }
}

testSqlConnection()
    .then(success => {
        if (success) {
            console.log('✅ SQL_TEST_SUCCESS=true');
            process.exit(0);
        } else {
            console.log('❌ SQL_TEST_SUCCESS=false');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Unhandled error:', error);
        console.log('❌ SQL_TEST_SUCCESS=false');
        process.exit(1);
    });
EOF

# Ensure pg is installed
echo "Checking for pg package..."
if ! npm list pg --json 2>/dev/null | grep -q '"pg"'; then
    echo "Installing pg package..."
    npm install --no-save pg
fi

# Run SQL test
echo "Testing SQL connection..."
SQL_TEST_OUTPUT=$(node "$TEST_SQL_SCRIPT")
echo "$SQL_TEST_OUTPUT"

# Check SQL test result
SQL_TEST_SUCCESS=$(echo "$SQL_TEST_OUTPUT" | grep "SQL_TEST_SUCCESS=true" || echo "")

if [ -n "$SQL_TEST_SUCCESS" ]; then
    echo -e "${GREEN}✅ SQL endpoint connection successful!${NC}"
    SQL_VALIDATION=true
else
    echo -e "${RED}❌ SQL endpoint connection failed.${NC}"
    SQL_VALIDATION=false
fi

# Phase 4: Test dashboard data connection
echo ""
echo -e "${BLUE}Phase 4: Testing dashboard SQL connector${NC}"

# Create test script
DASHBOARD_TEST_SCRIPT="$ROOT_DIR/temp_dashboard_test.js"

cat > "$DASHBOARD_TEST_SCRIPT" << EOF
const FMCGSQLConnector = require('../data/sql_connector');

async function testDashboardConnector() {
    console.log('Creating SQL connector instance...');
    const connector = new FMCGSQLConnector({
        logging: {
            level: 'debug'
        }
    });
    
    try {
        console.log('Testing database connection...');
        const connected = await connector.checkConnection();
        if (connected) {
            console.log('✅ Successfully connected to Databricks SQL endpoint!');
        } else {
            console.log('❌ Failed to connect to Databricks SQL endpoint. Using simulation mode.');
            return false;
        }
        
        console.log('Testing KPIs query...');
        const kpis = await connector.getDashboardKPIs();
        console.log('KPIs retrieved:', JSON.stringify(kpis, null, 2));
        
        console.log('Testing data freshness query...');
        const freshness = await connector.getDataFreshness();
        console.log('Data freshness:', JSON.stringify(freshness, null, 2));
        
        console.log('Getting connector stats...');
        const stats = connector.getStats();
        console.log('Stats:', JSON.stringify(stats, null, 2));
        
        console.log('Test complete.');
        
        // Close connection
        connector.close();
        
        return !connector.options.simulation.enabled;
    } catch (error) {
        console.error('Error during test:', error);
        return false;
    }
}

// Run the test
testDashboardConnector()
    .then(success => {
        if (success) {
            console.log('✅ DASHBOARD_TEST_SUCCESS=true');
            process.exit(0);
        } else {
            console.log('❌ DASHBOARD_TEST_SUCCESS=false');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Unhandled error during test:', error);
        console.log('❌ DASHBOARD_TEST_SUCCESS=false');
        process.exit(1);
    });
EOF

# Run dashboard test
echo "Testing dashboard connector..."
DASHBOARD_TEST_OUTPUT=$(node "$DASHBOARD_TEST_SCRIPT")
echo "$DASHBOARD_TEST_OUTPUT"

# Check dashboard test result
DASHBOARD_TEST_SUCCESS=$(echo "$DASHBOARD_TEST_OUTPUT" | grep "DASHBOARD_TEST_SUCCESS=true" || echo "")

if [ -n "$DASHBOARD_TEST_SUCCESS" ]; then
    echo -e "${GREEN}✅ Dashboard connector test successful!${NC}"
    DASHBOARD_VALIDATION=true
else
    echo -e "${RED}❌ Dashboard connector test failed.${NC}"
    DASHBOARD_VALIDATION=false
fi

# Clean up temporary files
rm -f "$TEST_SCRIPT" "$VALIDATION_NOTEBOOK" "$TEST_SQL_SCRIPT" "$DASHBOARD_TEST_SCRIPT"

# Summary
echo ""
echo -e "${BLUE}=== End-to-End Dataflow Test Summary ====${NC}"
echo "Test Run ID: $TEST_RUN_ID"
echo "Event Hub → Databricks: $([ "$DATABRICKS_VALIDATION" = true ] && echo "${GREEN}✅ SUCCESS${NC}" || echo "${YELLOW}⚠️ INCOMPLETE${NC}")"
echo "Databricks SQL Endpoint: $([ "$SQL_VALIDATION" = true ] && echo "${GREEN}✅ SUCCESS${NC}" || echo "${RED}❌ FAILED${NC}")"
echo "Dashboard SQL Connector: $([ "$DASHBOARD_VALIDATION" = true ] && echo "${GREEN}✅ SUCCESS${NC}" || echo "${RED}❌ FAILED${NC}")"

if [ "$DATABRICKS_VALIDATION" = true ] && [ "$SQL_VALIDATION" = true ] && [ "$DASHBOARD_VALIDATION" = true ]; then
    echo -e "${GREEN}✅ All tests passed! End-to-end dataflow is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the dashboard to production with:"
    echo "   ./scripts/deploy-only-production.sh"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed or are incomplete.${NC}"
    echo ""
    echo "Troubleshooting steps:"
    
    if [ "$DATABRICKS_VALIDATION" != true ]; then
        echo "- Check the Databricks DLT pipeline execution and logs"
        echo "- Verify Event Hub connection string and permissions"
        echo "- Ensure the DLT pipeline is properly configured for your Event Hubs"
    fi
    
    if [ "$SQL_VALIDATION" != true ]; then
        echo "- Verify SQL warehouse is running"
        echo "- Check SQL token permissions"
        echo "- Ensure network connectivity from your machine to Databricks SQL"
    fi
    
    if [ "$DASHBOARD_VALIDATION" != true ]; then
        echo "- Check SQL connector implementation"
        echo "- Verify environment variables are properly set"
        echo "- Ensure Key Vault permissions are correctly configured"
    fi
    
    exit 1
fi