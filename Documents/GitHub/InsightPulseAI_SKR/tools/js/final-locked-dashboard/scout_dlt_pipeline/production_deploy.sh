#!/bin/bash
# Production Deployment Script for Scout DLT Pipeline

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP_NAME="rg-scout-eventhub"
LOCATION="eastus2"
STORAGE_ACCOUNT_NAME="scoutrawdata$(date +%s | sha256sum | head -c 8)"
CONTAINER_NAME="scout-raw-ingest"
EVENTHUB_NAMESPACE="scout-eh-namespace-$(date +%s | sha256sum | head -c 6)"
DATABRICKS_HOST=""
DATABRICKS_TOKEN=""
KEYVAULT_NAME="kv-scout-project"

print_header() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}   Scout DLT Production Deployment     ${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
}

check_prerequisites() {
    echo -e "${GREEN}[1/8] Checking prerequisites${NC}"
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        echo -e "${RED}Azure CLI not found. Please install Azure CLI:${NC}"
        echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Terraform not found. Please install Terraform:${NC}"
        echo "https://learn.hashicorp.com/tutorials/terraform/install-cli"
        echo -e "${YELLOW}Installing Terraform via brew...${NC}"
        brew install terraform || {
            echo -e "${RED}Failed to install Terraform. Please install manually.${NC}"
            exit 1
        }
    fi
    
    # Check if Databricks CLI is installed
    if ! command -v databricks &> /dev/null; then
        echo -e "${RED}Databricks CLI not found. Installing...${NC}"
        pip install databricks-cli || {
            echo -e "${RED}Failed to install Databricks CLI. Please install manually:${NC}"
            echo "pip install databricks-cli"
            exit 1
        }
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}jq not found. Installing...${NC}"
        brew install jq || {
            echo -e "${RED}Failed to install jq. Please install manually.${NC}"
            exit 1
        }
    fi
    
    echo -e "${GREEN}All prerequisites satisfied.${NC}"
}

azure_login() {
    echo -e "${GREEN}[2/8] Logging into Azure${NC}"
    
    # Check if already logged in
    az account show &> /dev/null || {
        echo "Please login to Azure..."
        az login --use-device-code
    }
    
    # Show current subscription
    SUBSCRIPTION=$(az account show --query name -o tsv)
    echo -e "Using subscription: ${YELLOW}$SUBSCRIPTION${NC}"
    
    # Ask user to confirm subscription
    read -p "Continue with this subscription? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please select the correct subscription using 'az account set --subscription <name or id>'"
        exit 1
    fi
}

setup_terraform() {
    echo -e "${GREEN}[3/8] Setting up Terraform${NC}"
    
    # Create terraform directory if it doesn't exist
    mkdir -p terraform_prod
    
    # Create terraform main.tf
    cat > terraform_prod/main.tf << 'EOF'
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "scout_rg" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# Event Hub Namespace
resource "azurerm_eventhub_namespace" "scout_namespace" {
  name                = var.eventhub_namespace
  location            = azurerm_resource_group.scout_rg.location
  resource_group_name = azurerm_resource_group.scout_rg.name
  sku                 = "Standard"
  capacity            = 2
  auto_inflate_enabled = true
  maximum_throughput_units = 5
  tags                = var.tags
}

# Event Hubs
resource "azurerm_eventhub" "eventhubs" {
  for_each = {
    "eh-pi-stt-raw" = { partitions = 4, retention = 3 }
    "eh-pi-visual-stream" = { partitions = 8, retention = 3 }
    "eh-pi-annotated-events" = { partitions = 4, retention = 3 }
    "eh-device-heartbeat" = { partitions = 2, retention = 3 }
  }
  
  name                = each.key
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  partition_count     = each.value.partitions
  message_retention   = each.value.retention
}

# Consumer Group for Databricks DLT
resource "azurerm_eventhub_consumer_group" "dlt_consumer" {
  for_each = {
    "eh-pi-stt-raw" = "scout-dlt-consumer"
    "eh-pi-visual-stream" = "scout-dlt-consumer"
    "eh-pi-annotated-events" = "scout-dlt-consumer"
    "eh-device-heartbeat" = "scout-dlt-consumer"
  }
  
  name                = each.value
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = each.key
  resource_group_name = azurerm_resource_group.scout_rg.name
  
  depends_on = [azurerm_eventhub.eventhubs]
}

# Event Hub Send Authorization Rule for Raspberry Pi devices
resource "azurerm_eventhub_authorization_rule" "pi_device_send" {
  for_each = {
    "eh-pi-stt-raw" = "pi-device-send-rule"
    "eh-pi-visual-stream" = "pi-device-send-rule"
    "eh-pi-annotated-events" = "pi-device-send-rule" 
    "eh-device-heartbeat" = "pi-device-send-rule"
  }
  
  name                = each.value
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = each.key
  resource_group_name = azurerm_resource_group.scout_rg.name
  send                = true
  listen              = false
  manage              = false
  
  depends_on = [azurerm_eventhub.eventhubs]
}

# Event Hub Listen Authorization Rule for Databricks
resource "azurerm_eventhub_authorization_rule" "databricks_listen" {
  for_each = {
    "eh-pi-stt-raw" = "databricks-listen-rule"
    "eh-pi-visual-stream" = "databricks-listen-rule"
    "eh-pi-annotated-events" = "databricks-listen-rule"
    "eh-device-heartbeat" = "databricks-listen-rule"
  }
  
  name                = each.value
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = each.key
  resource_group_name = azurerm_resource_group.scout_rg.name
  send                = false
  listen              = true
  manage              = false
  
  depends_on = [azurerm_eventhub.eventhubs]
}

# Storage account for raw data
resource "azurerm_storage_account" "scout_storage" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.scout_rg.name
  location                 = azurerm_resource_group.scout_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  enable_https_traffic_only = true
  min_tls_version          = "TLS1_2"
  tags                     = var.tags
}

# Container for raw ingest data
resource "azurerm_storage_container" "raw_ingest" {
  name                  = var.container_name
  storage_account_name  = azurerm_storage_account.scout_storage.name
  container_access_type = "private"
}

# Key Vault for storing secrets
resource "azurerm_key_vault" "scout_kv" {
  name                        = var.keyvault_name
  location                    = azurerm_resource_group.scout_rg.location
  resource_group_name         = azurerm_resource_group.scout_rg.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  
  sku_name = "standard"
  
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    
    key_permissions = [
      "Get", "List", "Create", "Delete", "Purge"
    ]
    
    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge"
    ]
    
    certificate_permissions = [
      "Get", "List", "Create", "Delete", "Purge"
    ]
  }
  
  tags = var.tags
}

# Get current client config
data "azurerm_client_config" "current" {}

# Outputs
output "eventhub_namespace_name" {
  value = azurerm_eventhub_namespace.scout_namespace.name
  description = "The name of the Event Hub Namespace"
}

output "storage_account_name" {
  value = azurerm_storage_account.scout_storage.name
  description = "The name of the Storage Account"
}

output "key_vault_name" {
  value = azurerm_key_vault.scout_kv.name
  description = "The name of the Key Vault"
}

output "resource_group_name" {
  value = azurerm_resource_group.scout_rg.name
  description = "The name of the Resource Group"
}

output "eventhub_connection_strings" {
  value = {
    for key, value in azurerm_eventhub_authorization_rule.pi_device_send :
    key => value.primary_connection_string
  }
  sensitive = true
}

output "databricks_connection_strings" {
  value = {
    for key, value in azurerm_eventhub_authorization_rule.databricks_listen :
    key => value.primary_connection_string
  }
  sensitive = true
}

output "storage_connection_string" {
  value = azurerm_storage_account.scout_storage.primary_connection_string
  sensitive = true
}
EOF

    # Create terraform variables.tf
    cat > terraform_prod/variables.tf << EOF
variable "resource_group_name" {
  description = "Name of the resource group for Scout infrastructure"
  type        = string
  default     = "${RESOURCE_GROUP_NAME}"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "${LOCATION}"
}

variable "eventhub_namespace" {
  description = "Name of the Event Hub Namespace"
  type        = string
  default     = "${EVENTHUB_NAMESPACE}"
}

variable "storage_account_name" {
  description = "Name of the Storage Account"
  type        = string
  default     = "${STORAGE_ACCOUNT_NAME}"
}

variable "container_name" {
  description = "Name of the Blob Storage Container"
  type        = string
  default     = "${CONTAINER_NAME}"
}

variable "keyvault_name" {
  description = "Name of the Key Vault"
  type        = string
  default     = "${KEYVAULT_NAME}"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {
    Environment = "Production"
    Application = "ScoutRetailAdvisor"
    Project     = "ProjectScout"
    DeployedBy  = "Terraform"
  }
}
EOF

    echo -e "${GREEN}Terraform configuration created in terraform_prod directory.${NC}"
}

deploy_infrastructure() {
    echo -e "${GREEN}[4/8] Deploying Azure infrastructure with Terraform${NC}"
    cd terraform_prod
    
    # Initialize Terraform
    echo "Initializing Terraform..."
    terraform init
    
    # Create plan
    echo "Creating Terraform plan..."
    terraform plan -out=tfplan
    
    # Ask user to confirm
    echo -e "${YELLOW}Review the Terraform plan above. Do you want to proceed? (y/n)${NC}"
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Apply plan
    echo "Applying Terraform plan..."
    terraform apply tfplan
    
    # Extract and save outputs for later use
    RESOURCE_GROUP=$(terraform output -raw resource_group_name)
    STORAGE_ACCOUNT=$(terraform output -raw storage_account_name)
    EVENTHUB_NAMESPACE=$(terraform output -raw eventhub_namespace_name)
    KEY_VAULT=$(terraform output -raw key_vault_name)
    
    # Save connection strings to local file (for setup only)
    terraform output -json eventhub_connection_strings > eventhub_connections.json
    terraform output -json databricks_connection_strings > databricks_connections.json
    terraform output -raw storage_connection_string > storage_connection.txt
    
    echo -e "${GREEN}Infrastructure deployed successfully!${NC}"
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Event Hub Namespace: $EVENTHUB_NAMESPACE"
    echo "Storage Account: $STORAGE_ACCOUNT"
    echo "Key Vault: $KEY_VAULT"
    
    cd ..
}

store_secrets() {
    echo -e "${GREEN}[5/8] Storing connection strings in Key Vault${NC}"
    
    echo "Extracting connection strings from Terraform output..."
    cd terraform_prod
    
    # Store Event Hub connection strings
    for eventhub in $(jq -r 'keys[]' eventhub_connections.json); do
        connection_string=$(jq -r ".[\"$eventhub\"]" eventhub_connections.json)
        echo "Storing connection string for $eventhub in Key Vault..."
        az keyvault secret set --vault-name "$KEY_VAULT" --name "$eventhub-connection" --value "$connection_string"
    done
    
    # Store Databricks connection strings
    for eventhub in $(jq -r 'keys[]' databricks_connections.json); do
        connection_string=$(jq -r ".[\"$eventhub\"]" databricks_connections.json)
        echo "Storing Databricks connection string for $eventhub in Key Vault..."
        az keyvault secret set --vault-name "$KEY_VAULT" --name "databricks-$eventhub-connection" --value "$connection_string"
    done
    
    # Store storage connection string
    storage_connection=$(cat storage_connection.txt)
    echo "Storing storage connection string in Key Vault..."
    az keyvault secret set --vault-name "$KEY_VAULT" --name "storage-connection" --value "$storage_connection"
    
    echo -e "${GREEN}Connection strings stored in Key Vault successfully!${NC}"
    cd ..
}

setup_databricks() {
    echo -e "${GREEN}[6/8] Setting up Databricks connection${NC}"
    
    # Ask for Databricks workspace URL
    echo -e "${YELLOW}Please enter your Databricks workspace URL (e.g., https://adb-1234567890123456.7.azuredatabricks.net):${NC}"
    read -p "Databricks URL: " DATABRICKS_HOST
    
    # Ask for Databricks access token
    echo -e "${YELLOW}Please enter your Databricks access token:${NC}"
    read -s -p "Databricks Token: " DATABRICKS_TOKEN
    echo
    
    # Configure Databricks CLI
    echo "Configuring Databricks CLI..."
    databricks configure --host "$DATABRICKS_HOST" --token "$DATABRICKS_TOKEN"
    
    # Create Databricks secrets scope
    echo "Creating Databricks secrets scope for Event Hub connections..."
    databricks secrets create-scope --scope scout-eventhub || echo "Scope already exists"
    
    # Create script to load secrets from Key Vault to Databricks
    echo "Creating script to load secrets from Key Vault to Databricks..."
    cat > load_databricks_secrets.sh << EOF
#!/bin/bash
# Load secrets from Key Vault to Databricks

# Configuration
KEY_VAULT_NAME="$KEY_VAULT"
SECRET_SCOPE="scout-eventhub"

# Get the list of secrets in Key Vault
secrets=\$(az keyvault secret list --vault-name "\$KEY_VAULT_NAME" --query "[].name" -o tsv)

# Loop through each secret and set it in Databricks
for secret in \$secrets; do
    # Get the secret value
    secret_value=\$(az keyvault secret show --vault-name "\$KEY_VAULT_NAME" --name "\$secret" --query "value" -o tsv)
    
    # Set the secret in Databricks
    echo "Setting secret: \$secret"
    databricks secrets put --scope "\$SECRET_SCOPE" --key "\$secret" --string-value "\$secret_value"
done

echo "Secrets loaded successfully!"
EOF
    
    chmod +x load_databricks_secrets.sh
    
    # Run the script to load secrets
    echo "Loading secrets to Databricks..."
    ./load_databricks_secrets.sh
    
    echo -e "${GREEN}Databricks connection configured successfully!${NC}"
}

deploy_dlt_pipeline() {
    echo -e "${GREEN}[7/8] Deploying Delta Live Tables pipeline${NC}"
    
    # Create DLT pipeline JSON
    PIPELINE_NAME="ScoutDLTPipeline"
    PIPELINE_JSON=$(cat <<EOF
{
  "name": "$PIPELINE_NAME",
  "catalog": "hive_metastore",
  "target": "scout_lakehouse",
  "continuous": true,
  "development": false,
  "configuration": {
    "pipelines.useMultiTaskRun": "true",
    "spark.databricks.delta.schema.autoMerge.enabled": "true",
    "spark.databricks.io.cache.enabled": "true"
  },
  "clusters": [
    {
      "label": "default",
      "autoscale": {
        "min_workers": 1,
        "max_workers": 5
      }
    }
  ],
  "libraries": [
    {
      "notebook": {
        "path": "/Workspace/Scout/scout_bronze_dlt"
      }
    },
    {
      "notebook": {
        "path": "/Workspace/Scout/scout_silver_dlt"
      }
    },
    {
      "notebook": {
        "path": "/Workspace/Scout/scout_gold_dlt"
      }
    }
  ]
}
EOF
)

    # Save pipeline JSON to file
    echo "$PIPELINE_JSON" > dlt_pipeline.json
    
    # Ask if user wants to create Databricks notebooks
    echo -e "${YELLOW}Do you want to create Databricks notebooks for the pipeline? (y/n)${NC}"
    read -p "Create notebooks? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create Workspace directory
        echo "Creating Scout directory in Databricks workspace..."
        databricks workspace mkdirs /Workspace/Scout
        
        # Create notebooks
        echo "Creating bronze layer notebook..."
        databricks workspace import --language PYTHON --format SOURCE scout_bronze_dlt.py /Workspace/Scout/scout_bronze_dlt
        
        echo "Creating silver layer notebook..."
        databricks workspace import --language PYTHON --format SOURCE scout_silver_dlt.py /Workspace/Scout/scout_silver_dlt
        
        echo "Creating gold layer notebook..."
        databricks workspace import --language PYTHON --format SOURCE scout_gold_dlt.py /Workspace/Scout/scout_gold_dlt
    fi
    
    # Create or update pipeline
    echo "Creating DLT pipeline..."
    pipeline_id=$(databricks pipelines create --json-file dlt_pipeline.json | jq -r '.pipeline_id')
    
    # Start the pipeline
    echo "Starting DLT pipeline..."
    databricks pipelines start --pipeline-id "$pipeline_id"
    
    echo -e "${GREEN}Delta Live Tables pipeline deployed and started successfully!${NC}"
    echo "Pipeline ID: $pipeline_id"
}

deploy_raspberrypi() {
    echo -e "${GREEN}[8/8] Preparing Raspberry Pi deployment instructions${NC}"
    
    # Extract connection strings
    cd terraform_prod
    PI_CONNECTIONS=$(cat eventhub_connections.json)
    STORAGE_CONNECTION=$(cat storage_connection.txt)
    cd ..
    
    # Create Pi deployment script
    mkdir -p pi_deployment
    cat > pi_deployment/setup_pi_client.sh << EOF
#!/bin/bash
# Setup script for Raspberry Pi client

# Configuration
DEVICE_ID="\${DEVICE_ID:-pi-device-\$(hostname | md5sum | cut -c1-8)}"
STORE_ID="\${STORE_ID:-store-001}"
LOCATION_ZONE="\${LOCATION_ZONE:-entrance}"
CAMERA_POSITION="\${CAMERA_POSITION:-ceiling}"

# Create directories
mkdir -p ~/project-scout/audio_buffer/metadata
mkdir -p ~/project-scout/vision_log
mkdir -p ~/project-scout/matched_sessions
mkdir -p ~/project-scout/scripts

# Install dependencies
sudo apt-get update
sudo apt-get install -y python3-pip python3-opencv libatlas-base-dev portaudio19-dev
pip3 install azure-eventhub azure-storage-blob numpy opencv-python-headless pyaudio pydub

# Create environment file
cat > ~/project-scout/.env << EOL
# Device configuration
DEVICE_ID="\$DEVICE_ID"
STORE_ID="\$STORE_ID"
LOCATION_ZONE="\$LOCATION_ZONE"
CAMERA_POSITION="\$CAMERA_POSITION"

# Event Hub connection strings
EVENTHUB_STT="${PI_CONNECTIONS["eh-pi-stt-raw"]}"
EVENTHUB_VISUAL="${PI_CONNECTIONS["eh-pi-visual-stream"]}"
EVENTHUB_ANNOTATED="${PI_CONNECTIONS["eh-pi-annotated-events"]}"
EVENTHUB_HEARTBEAT="${PI_CONNECTIONS["eh-device-heartbeat"]}"

# Storage connection
STORAGE_CONNECTION="${STORAGE_CONNECTION}"
STORAGE_CONTAINER="${CONTAINER_NAME}"
EOL

# Copy client script
cp ../pi_client/stt_visual_client.py ~/project-scout/scripts/

# Create systemd service
cat > /tmp/scout-client.service << EOL
[Unit]
Description=Scout Raspberry Pi Client
After=network.target

[Service]
User=\$(whoami)
WorkingDirectory=~/project-scout
ExecStart=/usr/bin/python3 ~/project-scout/scripts/stt_visual_client.py
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1
EnvironmentFile=~/project-scout/.env

[Install]
WantedBy=multi-user.target
EOL

sudo mv /tmp/scout-client.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable scout-client
sudo systemctl start scout-client

echo "Scout Raspberry Pi client setup complete!"
echo "Service status: \$(sudo systemctl status scout-client | grep Active)"
EOF

    # Create README
    cat > pi_deployment/README.md << EOF
# Scout Raspberry Pi Client Deployment

This directory contains scripts and instructions for deploying the Scout client to Raspberry Pi devices.

## Directory Structure

Once deployed, each Raspberry Pi will have the following directory structure:

\`\`\`
/home/pi/project-scout/
├── audio_buffer/
│   ├── audio_<timestamp>.wav
│   └── metadata/
│       └── audio_<timestamp>.json
├── vision_log/
│   └── face_<timestamp>.json
├── matched_sessions/
│   └── session_<id>.json
├── scripts/
│   ├── record_audio.py
│   ├── vad_keyword_trigger.py
│   ├── generate_metadata.py
│   ├── analyze_transcript.py
│   ├── session_matcher.py
│   ├── filter_noise.sh
│   ├── pi_ui_display.py
│   └── batch_uploader.py
└── .env
\`\`\`

## Deployment Instructions

1. Copy the \`setup_pi_client.sh\` script to each Raspberry Pi device
2. SSH into each device and run:

   \`\`\`bash
   chmod +x setup_pi_client.sh
   ./setup_pi_client.sh
   \`\`\`

3. Configure the device by editing \`~/project-scout/.env\`

## Monitoring

- Check service status: \`sudo systemctl status scout-client\`
- View logs: \`journalctl -u scout-client -f\`
- Restart service: \`sudo systemctl restart scout-client\`

## Troubleshooting

- If camera or microphone permissions are denied, run: \`sudo usermod -a -G video,audio \$(whoami)\`
- If Event Hub connection fails, verify connection strings in \`.env\` file
- For performance issues, reduce resolution in \`stt_visual_client.py\`
EOF

    echo -e "${GREEN}Raspberry Pi deployment instructions created in pi_deployment directory!${NC}"
}

deployment_summary() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}   Scout DLT Deployment Summary        ${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
    echo -e "${GREEN}Deployment Status: COMPLETE${NC}"
    echo ""
    echo "Resources deployed:"
    echo "1. Azure Resource Group: $RESOURCE_GROUP_NAME"
    echo "2. Event Hub Namespace: $EVENTHUB_NAMESPACE"
    echo "3. 4 Event Hubs for data streams"
    echo "4. Storage Account: $STORAGE_ACCOUNT_NAME"
    echo "5. Storage Container: $CONTAINER_NAME"
    echo "6. Key Vault: $KEYVAULT_NAME"
    echo "7. Databricks DLT Pipeline: ScoutDLTPipeline"
    echo ""
    echo "Next Steps:"
    echo "1. Deploy clients to Raspberry Pi devices using the pi_deployment/setup_pi_client.sh script"
    echo "2. Monitor data flow in Databricks"
    echo "3. Connect Power BI or Superset to the gold tables"
    echo ""
    echo -e "${YELLOW}Deployment artifacts are stored in:${NC}"
    echo "- terraform_prod/ - Terraform configuration"
    echo "- pi_deployment/ - Raspberry Pi deployment scripts"
    echo ""
    echo "Production deployment completed successfully!"
}

# Main execution
print_header
check_prerequisites
azure_login
setup_terraform
deploy_infrastructure
store_secrets
setup_databricks
deploy_dlt_pipeline
deploy_raspberrypi
deployment_summary

# Update deployment status
echo "production_deployed" > deployment_status.txt