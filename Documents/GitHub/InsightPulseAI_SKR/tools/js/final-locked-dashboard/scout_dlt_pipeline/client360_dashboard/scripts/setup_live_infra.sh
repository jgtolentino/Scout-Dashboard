#!/usr/bin/env bash
set -euo pipefail

# 1. Databricks CLI config
echo "Configuring Databricks CLI..."
databricks configure --token <<EOF
https://adb-123456789012345.6.azuredatabricks.net
${DATABRICKS_SQL_TOKEN}
EOF

# 2. Create / Configure Event Hub
echo "Creating Event Hub namespace and hub..."
az eventhubs namespace create \
  --resource-group tbwa-client360-dashboard \
  --name eh-namespace-client360 \
  --location eastus

az eventhubs eventhub create \
  --resource-group tbwa-client360-dashboard \
  --namespace-name eh-namespace-client360 \
  --name client360-stream \
  --message-retention 1 \
  --partition-count 4

CONN_STR=$(az eventhubs namespace authorization-rule keys list \
  --resource-group tbwa-client360-dashboard \
  --namespace-name eh-namespace-client360 \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

# 3. Store secrets in Key Vault
echo "Storing secrets in Key Vault..."
az keyvault secret set \
  --vault-name kv-client360 \
  --name "DATABRICKS-SQL-TOKEN" \
  --value "${DATABRICKS_SQL_TOKEN}"

az keyvault secret set \
  --vault-name kv-client360 \
  --name "EVENTHUB-CONN-STRING" \
  --value "${CONN_STR}"

echo "✅ Databricks CLI, Event Hub and Key Vault configured."