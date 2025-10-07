#!/bin/bash
# 1_compute_isolation.sh - Create dedicated compute clusters for each medallion layer

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
DATABRICKS_WORKSPACE_NAME="tbwa-juicer-databricks"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Medallion Architecture - Compute Isolation Setup          ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${RESET}"
  exit 1
fi

# Check for Databricks CLI
if ! command -v databricks &> /dev/null; then
  echo -e "${YELLOW}Databricks CLI not found. Installing...${RESET}"
  pip install databricks-cli
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Databricks CLI${RESET}"
    exit 1
  fi
  echo -e "${GREEN}Databricks CLI installed successfully${RESET}"
fi

# Get Databricks workspace URL
echo -e "\n${BLUE}Getting Databricks workspace URL...${RESET}"
DATABRICKS_URL=$(az databricks workspace show \
  --name "${DATABRICKS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "properties.workspaceUrl" -o tsv)
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Databricks workspace URL${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks URL: https://${DATABRICKS_URL}${RESET}"

# Get Databricks token from Key Vault
echo -e "\n${BLUE}Getting Databricks token from Key Vault...${RESET}"
DATABRICKS_TOKEN=$(az keyvault secret show \
  --vault-name "${KEYVAULT_NAME}" \
  --name "DATABRICKS-TOKEN" \
  --query "value" -o tsv)
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Databricks token from Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Retrieved Databricks token successfully${RESET}"

# Configure Databricks CLI
echo -e "\n${BLUE}Configuring Databricks CLI...${RESET}"
# Create config file
mkdir -p ~/.databrickscfg
cat > ~/.databrickscfg << EOF
[DEFAULT]
host = https://${DATABRICKS_URL}
token = ${DATABRICKS_TOKEN}
EOF
echo -e "${GREEN}Databricks CLI configured successfully${RESET}"

# Create Bronze Layer Cluster configuration
echo -e "\n${BLUE}Creating Bronze Layer Cluster configuration...${RESET}"
cat > bronze_cluster_config.json << EOF
{
  "cluster_name": "BronzeLayerProcessing",
  "spark_version": "11.3.x-scala2.12",
  "node_type_id": "Standard_D4s_v3",
  "spark_conf": {
    "spark.databricks.delta.preview.enabled": "true",
    "spark.sql.files.maxPartitionBytes": "134217728",
    "spark.sql.shuffle.partitions": "20"
  },
  "autoscale": {
    "min_workers": 2,
    "max_workers": 4
  },
  "autotermination_minutes": 30,
  "spark_env_vars": {
    "PYSPARK_PYTHON": "/databricks/python3/bin/python3"
  },
  "custom_tags": {
    "Layer": "Bronze",
    "Project": "ProjectScout",
    "Environment": "Production"
  }
}
EOF
echo -e "${GREEN}Bronze Layer Cluster configuration created${RESET}"

# Create Silver Layer Cluster configuration
echo -e "\n${BLUE}Creating Silver Layer Cluster configuration...${RESET}"
cat > silver_cluster_config.json << EOF
{
  "cluster_name": "SilverLayerProcessing",
  "spark_version": "11.3.x-scala2.12",
  "node_type_id": "Standard_D4s_v3",
  "spark_conf": {
    "spark.databricks.delta.preview.enabled": "true",
    "spark.sql.files.maxPartitionBytes": "134217728",
    "spark.sql.shuffle.partitions": "20"
  },
  "autoscale": {
    "min_workers": 2,
    "max_workers": 6
  },
  "autotermination_minutes": 30,
  "spark_env_vars": {
    "PYSPARK_PYTHON": "/databricks/python3/bin/python3"
  },
  "custom_tags": {
    "Layer": "Silver",
    "Project": "ProjectScout",
    "Environment": "Production"
  }
}
EOF
echo -e "${GREEN}Silver Layer Cluster configuration created${RESET}"

# Create Gold-Platinum Layer Cluster configuration
echo -e "\n${BLUE}Creating Gold-Platinum Layer Cluster configuration...${RESET}"
cat > gold_platinum_cluster_config.json << EOF
{
  "cluster_name": "GoldPlatinumLayerProcessing",
  "spark_version": "11.3.x-scala2.12",
  "node_type_id": "Standard_D8s_v3",
  "spark_conf": {
    "spark.databricks.delta.preview.enabled": "true",
    "spark.sql.files.maxPartitionBytes": "134217728",
    "spark.sql.shuffle.partitions": "40",
    "spark.databricks.io.cache.enabled": "true"
  },
  "autoscale": {
    "min_workers": 2,
    "max_workers": 8
  },
  "autotermination_minutes": 30,
  "spark_env_vars": {
    "PYSPARK_PYTHON": "/databricks/python3/bin/python3"
  },
  "custom_tags": {
    "Layer": "Gold-Platinum",
    "Project": "ProjectScout",
    "Environment": "Production"
  }
}
EOF
echo -e "${GREEN}Gold-Platinum Layer Cluster configuration created${RESET}"

# Create Bronze Layer Cluster
echo -e "\n${BLUE}Creating Bronze Layer Cluster...${RESET}"
BRONZE_CLUSTER_ID=$(databricks clusters create --json-file bronze_cluster_config.json | grep "cluster_id" | awk -F'"' '{print $4}')
if [ -z "$BRONZE_CLUSTER_ID" ]; then
  echo -e "${RED}Failed to create Bronze Layer Cluster${RESET}"
  exit 1
fi
echo -e "${GREEN}Bronze Layer Cluster created with ID: ${BRONZE_CLUSTER_ID}${RESET}"

# Create Silver Layer Cluster
echo -e "\n${BLUE}Creating Silver Layer Cluster...${RESET}"
SILVER_CLUSTER_ID=$(databricks clusters create --json-file silver_cluster_config.json | grep "cluster_id" | awk -F'"' '{print $4}')
if [ -z "$SILVER_CLUSTER_ID" ]; then
  echo -e "${RED}Failed to create Silver Layer Cluster${RESET}"
  exit 1
fi
echo -e "${GREEN}Silver Layer Cluster created with ID: ${SILVER_CLUSTER_ID}${RESET}"

# Create Gold-Platinum Layer Cluster
echo -e "\n${BLUE}Creating Gold-Platinum Layer Cluster...${RESET}"
GOLD_PLATINUM_CLUSTER_ID=$(databricks clusters create --json-file gold_platinum_cluster_config.json | grep "cluster_id" | awk -F'"' '{print $4}')
if [ -z "$GOLD_PLATINUM_CLUSTER_ID" ]; then
  echo -e "${RED}Failed to create Gold-Platinum Layer Cluster${RESET}"
  exit 1
fi
echo -e "${GREEN}Gold-Platinum Layer Cluster created with ID: ${GOLD_PLATINUM_CLUSTER_ID}${RESET}"

# Store cluster IDs in Key Vault
echo -e "\n${BLUE}Storing cluster IDs in Key Vault...${RESET}"
az keyvault secret set \
  --vault-name "${KEYVAULT_NAME}" \
  --name "BRONZE-CLUSTER-ID" \
  --value "${BRONZE_CLUSTER_ID}"

az keyvault secret set \
  --vault-name "${KEYVAULT_NAME}" \
  --name "SILVER-CLUSTER-ID" \
  --value "${SILVER_CLUSTER_ID}"

az keyvault secret set \
  --vault-name "${KEYVAULT_NAME}" \
  --name "GOLD-PLATINUM-CLUSTER-ID" \
  --value "${GOLD_PLATINUM_CLUSTER_ID}"

echo -e "${GREEN}Cluster IDs stored in Key Vault successfully${RESET}"

# Summary
echo -e "\n${BLUE}${BOLD}Compute Isolation Setup Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Bronze Layer Cluster ID: ${GREEN}${BRONZE_CLUSTER_ID}${RESET}"
echo -e "Silver Layer Cluster ID: ${GREEN}${SILVER_CLUSTER_ID}${RESET}"
echo -e "Gold-Platinum Layer Cluster ID: ${GREEN}${GOLD_PLATINUM_CLUSTER_ID}${RESET}"

echo -e "\n${GREEN}Compute isolation for Medallion Architecture setup complete!${RESET}"
echo -e "${YELLOW}Note: You'll need to update the job configurations to use the appropriate clusters.${RESET}"