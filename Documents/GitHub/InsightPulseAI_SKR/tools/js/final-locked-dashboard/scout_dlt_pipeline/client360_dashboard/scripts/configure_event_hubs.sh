#!/bin/bash
# Configure Event Hubs for Scout ETL Pipeline
# This script sets up Event Hub namespaces, hubs, and consumer groups
# required for the Scout ETL Pipeline.

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Scout ETL Event Hub Configuration ====${NC}"

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

# Check if logged in to Azure
LOGGED_IN=$(az account show 2>/dev/null)
if [ -z "$LOGGED_IN" ]; then
    echo "You are not logged in to Azure. Please log in."
    az login
fi

# Get subscription and resource group
echo "Available subscriptions:"
az account list --output table

echo ""
echo "Enter the subscription ID to use (or press Enter to use the current one):"
read -r SUBSCRIPTION_ID

if [ -n "$SUBSCRIPTION_ID" ]; then
    echo "Setting subscription to $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
else
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    echo "Using current subscription: $SUBSCRIPTION_ID"
fi

# Get resource group
echo ""
echo "Available resource groups:"
az group list --query "[].name" -o tsv

echo ""
echo "Enter the resource group name to use:"
read -r RESOURCE_GROUP

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    echo -e "${RED}Error: Resource group $RESOURCE_GROUP does not exist.${NC}"
    exit 1
fi

# Get or create Event Hubs namespace
echo ""
echo "Event Hubs namespace to use (enter a name to create a new one, or existing one):"
read -r EH_NAMESPACE

# Check if namespace exists
NAMESPACE_EXISTS=$(az eventhubs namespace show --name "$EH_NAMESPACE" --resource-group "$RESOURCE_GROUP" 2>/dev/null)

if [ -z "$NAMESPACE_EXISTS" ]; then
    echo "Creating new Event Hubs namespace: $EH_NAMESPACE"
    LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
    az eventhubs namespace create \
        --name "$EH_NAMESPACE" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard
    
    echo -e "${GREEN}✅ Event Hubs namespace created successfully.${NC}"
else
    echo "Using existing Event Hubs namespace: $EH_NAMESPACE"
fi

# Load the required Event Hubs from etl-deploy-kit.yaml
echo "Reading Event Hubs configuration from etl-deploy-kit.yaml..."
EVENT_HUBS=$(grep -A30 "event_hubs:" "$ROOT_DIR/etl-deploy-kit.yaml" | grep "name:" | awk -F': ' '{print $2}' | tr -d ' "')

# Create Event Hubs and consumer groups
for HUB in $EVENT_HUBS; do
    echo ""
    echo "Checking Event Hub: $HUB"
    
    # Check if hub exists
    HUB_EXISTS=$(az eventhubs eventhub show --name "$HUB" --namespace-name "$EH_NAMESPACE" --resource-group "$RESOURCE_GROUP" 2>/dev/null)
    
    if [ -z "$HUB_EXISTS" ]; then
        echo "Creating Event Hub: $HUB"
        az eventhubs eventhub create \
            --name "$HUB" \
            --namespace-name "$EH_NAMESPACE" \
            --resource-group "$RESOURCE_GROUP" \
            --partition-count 4 \
            --message-retention 7
        
        echo -e "${GREEN}✅ Event Hub $HUB created successfully.${NC}"
    else
        echo "Event Hub $HUB already exists."
    fi
    
    # Create consumer groups
    # Default consumer group always exists, so we create these additional ones:
    CONSUMER_GROUPS=("dlt-bronze" "monitoring" "dashboard-live")
    
    for CG in "${CONSUMER_GROUPS[@]}"; do
        echo "Checking consumer group: $CG"
        
        # Check if consumer group exists
        CG_EXISTS=$(az eventhubs eventhub consumer-group show \
            --eventhub-name "$HUB" \
            --name "$CG" \
            --namespace-name "$EH_NAMESPACE" \
            --resource-group "$RESOURCE_GROUP" 2>/dev/null)
        
        if [ -z "$CG_EXISTS" ]; then
            echo "Creating consumer group: $CG"
            az eventhubs eventhub consumer-group create \
                --eventhub-name "$HUB" \
                --name "$CG" \
                --namespace-name "$EH_NAMESPACE" \
                --resource-group "$RESOURCE_GROUP"
            
            echo -e "${GREEN}✅ Consumer group $CG created successfully.${NC}"
        else
            echo "Consumer group $CG already exists."
        fi
    done
done

# Get Event Hubs connection string
echo ""
echo "Getting Event Hubs connection string..."
CONNECTION_STRING=$(az eventhubs namespace authorization-rule keys list \
    --resource-group "$RESOURCE_GROUP" \
    --namespace-name "$EH_NAMESPACE" \
    --name RootManageSharedAccessKey \
    --query primaryConnectionString -o tsv)

# Store connection string in Key Vault
echo ""
echo "Enter the Key Vault name to store the connection string:"
read -r KEY_VAULT_NAME

# Check if Key Vault exists
KV_EXISTS=$(az keyvault show --name "$KEY_VAULT_NAME" 2>/dev/null)

if [ -z "$KV_EXISTS" ]; then
    echo -e "${RED}Error: Key Vault $KEY_VAULT_NAME does not exist.${NC}"
    echo "Please create the Key Vault first or enter an existing one."
    exit 1
fi

# Store connection string in Key Vault
echo "Storing Event Hubs connection string in Key Vault..."
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "EVENT-HUB-CONNECTION-STRING" \
    --value "$CONNECTION_STRING"

echo -e "${GREEN}✅ Event Hubs connection string stored in Key Vault successfully.${NC}"

# Test Event Hub connectivity
echo ""
echo "Would you like to run a test event sender to verify connectivity? (y/n)"
read -r RUN_TEST

if [[ "$RUN_TEST" =~ ^[Yy]$ ]]; then
    # Create a temporary test script
    TEST_SCRIPT="$ROOT_DIR/temp_event_hub_test.js"
    
    cat > "$TEST_SCRIPT" << EOF
const { EventHubProducerClient } = require('@azure/event-hubs');

async function main() {
    const connectionString = "$CONNECTION_STRING";
    const eventHubName = "${EVENT_HUBS[0]}";
    
    console.log("Connecting to Event Hub:", eventHubName);
    const producer = new EventHubProducerClient(connectionString, eventHubName);
    
    try {
        // Create a batch of test events
        const batchOptions = { };
        const batch = await producer.createBatch(batchOptions);
        
        // Add 10 test events to the batch
        for (let i = 1; i <= 10; i++) {
            const timestamp = new Date().toISOString();
            const testEvent = {
                id: \`test-\${i}-\${Date.now()}\`,
                type: "test-event",
                source: "event-hub-configuration-script",
                timestamp: timestamp,
                data: {
                    message: \`Test event #\${i}\`,
                    timestamp: timestamp
                }
            };
            
            if (!batch.tryAdd({ body: testEvent })) {
                console.log("Batch is full, sending current batch...");
                break;
            }
            
            console.log(\`Added event #\${i} to batch\`);
        }
        
        // Send the batch
        console.log(\`Sending batch of \${batch.count} events...\`);
        await producer.sendBatch(batch);
        console.log("Batch sent successfully!");
        
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
    if ! npm list @azure/event-hubs --silent; then
        echo "Installing @azure/event-hubs package..."
        npm install --no-save @azure/event-hubs
    fi
    
    # Run the test script
    echo "Running Event Hub test sender..."
    node "$TEST_SCRIPT"
    
    # Clean up
    rm "$TEST_SCRIPT"
    
    echo -e "${GREEN}✅ Event Hub test completed.${NC}"
else
    echo "Skipping Event Hub connectivity test."
fi

# Summary
echo ""
echo -e "${BLUE}=== Scout ETL Event Hub Configuration Summary ====${NC}"
echo "Event Hubs Namespace: $EH_NAMESPACE"
echo "Event Hubs:"
for HUB in $EVENT_HUBS; do
    echo "- $HUB"
done
echo "Consumer Groups:"
for CG in "${CONSUMER_GROUPS[@]}"; do
    echo "- $CG"
done
echo "Connection String: Stored in Key Vault $KEY_VAULT_NAME as EVENT-HUB-CONNECTION-STRING"

echo ""
echo -e "${GREEN}Event Hub configuration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your environment variables with:"
echo "   export EVENT_HUB_NAMESPACE=$EH_NAMESPACE"
echo "   export EVENT_HUB_CONNECTION_STRING=\$(az keyvault secret show --vault-name $KEY_VAULT_NAME --name EVENT-HUB-CONNECTION-STRING --query value -o tsv)"
echo ""
echo "2. Deploy the DLT pipelines with:"
echo "   ./scripts/deploy_dlt_pipelines.sh"
echo ""
echo "3. Test Databricks SQL connectivity with:"
echo "   ./scripts/test_databricks_connectivity.sh"