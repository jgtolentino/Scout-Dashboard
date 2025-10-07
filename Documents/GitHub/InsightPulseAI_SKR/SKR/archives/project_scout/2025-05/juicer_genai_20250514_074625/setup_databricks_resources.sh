#!/bin/bash
# setup_databricks_resources.sh - Setup Databricks resources for Juicer GenAI Insights

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
DATABRICKS_WORKSPACE_NAME="tbwa-juicer-databricks"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
NOTEBOOKS_SRC_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/notebooks"
NOTEBOOK_DEST_PATH="/Shared/InsightPulseAI/Juicer"
CLUSTER_NAME="JuicerProcessing"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Databricks Resources Setup for Juicer GenAI Insights      ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

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

# Prompt for Databricks token
echo -e "\n${YELLOW}Please create a Databricks access token by visiting:${RESET}"
echo -e "${YELLOW}https://${DATABRICKS_URL}/#secrets/createToken${RESET}"
echo -e "${YELLOW}Then enter the token below:${RESET}"
read -s -p "Databricks Token: " DATABRICKS_TOKEN
echo ""

if [ -z "$DATABRICKS_TOKEN" ]; then
  echo -e "${RED}Token cannot be empty${RESET}"
  exit 1
fi

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

# Store token in Key Vault
echo -e "\n${BLUE}Storing Databricks token in Key Vault...${RESET}"
az keyvault secret set \
  --vault-name "kv-tbwa-juicer-insights2" \
  --name "DATABRICKS-TOKEN" \
  --value "${DATABRICKS_TOKEN}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to store Databricks token in Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks token stored in Key Vault successfully${RESET}"

# Create Databricks cluster configuration
echo -e "\n${BLUE}Creating Databricks cluster configuration...${RESET}"
cat > cluster_config.json << EOF
{
  "cluster_name": "${CLUSTER_NAME}",
  "spark_version": "11.3.x-scala2.12",
  "node_type_id": "Standard_D4s_v3",
  "spark_conf": {
    "spark.databricks.delta.preview.enabled": "true"
  },
  "autotermination_minutes": 60,
  "num_workers": 2,
  "spark_env_vars": {
    "PYSPARK_PYTHON": "/databricks/python3/bin/python3"
  }
}
EOF
echo -e "${GREEN}Cluster configuration created${RESET}"

# Create Databricks cluster
echo -e "\n${BLUE}Creating Databricks cluster...${RESET}"
CLUSTER_ID=$(databricks clusters create --json-file cluster_config.json | grep "cluster_id" | awk -F'"' '{print $4}')
if [ -z "$CLUSTER_ID" ]; then
  echo -e "${RED}Failed to create Databricks cluster${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks cluster created with ID: ${CLUSTER_ID}${RESET}"

# Create directory for notebooks
echo -e "\n${BLUE}Creating directories in Databricks workspace...${RESET}"
databricks workspace mkdirs "${NOTEBOOK_DEST_PATH}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create directory in Databricks workspace${RESET}"
  exit 1
fi
echo -e "${GREEN}Directory created successfully${RESET}"

# Import notebooks
echo -e "\n${BLUE}Importing notebooks to Databricks workspace...${RESET}"

# Check if source directory exists
if [ ! -d "${NOTEBOOKS_SRC_DIR}" ]; then
  echo -e "${RED}Source directory for notebooks not found: ${NOTEBOOKS_SRC_DIR}${RESET}"
  exit 1
fi

# Import Python notebooks
for notebook in "${NOTEBOOKS_SRC_DIR}"/*.py; do
  if [ -f "$notebook" ]; then
    filename=$(basename "$notebook")
    notebook_name="${filename%.*}"
    echo -e "${BLUE}Importing ${filename}...${RESET}"
    databricks workspace import "$notebook" "${NOTEBOOK_DEST_PATH}/${notebook_name}" -l PYTHON -o
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to import notebook: ${filename}${RESET}"
      continue
    fi
    echo -e "${GREEN}Notebook ${filename} imported successfully${RESET}"
  fi
done

# Import SQL notebooks
for notebook in "${NOTEBOOKS_SRC_DIR}"/*.sql; do
  if [ -f "$notebook" ]; then
    filename=$(basename "$notebook")
    notebook_name="${filename%.*}"
    echo -e "${BLUE}Importing ${filename}...${RESET}"
    databricks workspace import "$notebook" "${NOTEBOOK_DEST_PATH}/${notebook_name}" -l SQL -o
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to import notebook: ${filename}${RESET}"
      continue
    fi
    echo -e "${GREEN}Notebook ${filename} imported successfully${RESET}"
  fi
done

# Create daily job configuration
echo -e "\n${BLUE}Creating daily job configuration...${RESET}"
cat > daily_job_config.json << EOF
{
  "name": "Juicer Daily Insights Generation",
  "existing_cluster_id": "${CLUSTER_ID}",
  "email_notifications": {},
  "schedule": {
    "quartz_cron_expression": "0 0 6 * * ?",
    "timezone_id": "UTC"
  },
  "notebook_task": {
    "notebook_path": "${NOTEBOOK_DEST_PATH}/juicer_gold_insights",
    "base_parameters": {
      "date": "1d",
      "env": "prod",
      "model": "claude",
      "generate_dashboard": "true"
    }
  },
  "max_concurrent_runs": 1
}
EOF
echo -e "${GREEN}Daily job configuration created${RESET}"

# Create weekly job configuration
echo -e "\n${BLUE}Creating weekly job configuration...${RESET}"
cat > weekly_job_config.json << EOF
{
  "name": "Juicer Weekly Insights Summary",
  "existing_cluster_id": "${CLUSTER_ID}",
  "email_notifications": {},
  "schedule": {
    "quartz_cron_expression": "0 0 7 ? * MON",
    "timezone_id": "UTC"
  },
  "notebook_task": {
    "notebook_path": "${NOTEBOOK_DEST_PATH}/juicer_gold_insights",
    "base_parameters": {
      "date": "7d",
      "env": "prod",
      "model": "auto",
      "generate_dashboard": "true"
    }
  },
  "max_concurrent_runs": 1
}
EOF
echo -e "${GREEN}Weekly job configuration created${RESET}"

# Create daily job
echo -e "\n${BLUE}Creating daily insights job...${RESET}"
DAILY_JOB_ID=$(databricks jobs create --json-file daily_job_config.json | grep "job_id" | awk -F': ' '{print $2}' | tr -d ',')
if [ -z "$DAILY_JOB_ID" ]; then
  echo -e "${RED}Failed to create daily job${RESET}"
else
  echo -e "${GREEN}Daily job created with ID: ${DAILY_JOB_ID}${RESET}"
fi

# Create weekly job
echo -e "\n${BLUE}Creating weekly insights job...${RESET}"
WEEKLY_JOB_ID=$(databricks jobs create --json-file weekly_job_config.json | grep "job_id" | awk -F': ' '{print $2}' | tr -d ',')
if [ -z "$WEEKLY_JOB_ID" ]; then
  echo -e "${RED}Failed to create weekly job${RESET}"
else
  echo -e "${GREEN}Weekly job created with ID: ${WEEKLY_JOB_ID}${RESET}"
fi

# Summary
echo -e "\n${BLUE}${BOLD}Databricks Resources Setup Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Databricks URL: ${GREEN}https://${DATABRICKS_URL}${RESET}"
echo -e "Cluster Name: ${GREEN}${CLUSTER_NAME}${RESET}"
echo -e "Cluster ID: ${GREEN}${CLUSTER_ID}${RESET}"
echo -e "Notebooks Path: ${GREEN}${NOTEBOOK_DEST_PATH}${RESET}"
echo -e "Daily Job ID: ${GREEN}${DAILY_JOB_ID}${RESET}"
echo -e "Weekly Job ID: ${GREEN}${WEEKLY_JOB_ID}${RESET}"

echo -e "\n${GREEN}Databricks resources setup complete!${RESET}"