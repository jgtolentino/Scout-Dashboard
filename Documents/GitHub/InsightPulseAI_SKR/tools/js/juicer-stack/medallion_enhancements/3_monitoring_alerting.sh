#!/bin/bash
# 3_monitoring_alerting.sh - Setup monitoring and alerting for Juicer GenAI Insights

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
STORAGE_ACCOUNT_NAME="tbwajuicerstorage"
KEYVAULT_NAME="kv-tbwa-juicer-insights2"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
LOG_ANALYTICS_WORKSPACE_NAME="juicer-log-analytics"
ACTION_GROUP_NAME="juicer-alerts-action-group"
ALERT_EMAIL="admin@insightpulseai.com"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Monitoring and Alerting Setup for Juicer GenAI Insights   ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Azure CLI
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${RESET}"
  exit 1
fi

# Check Azure CLI login
echo -e "${BLUE}Checking Azure CLI login...${RESET}"
ACCOUNT=$(az account show --query name -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Not logged in to Azure CLI. Please log in:${RESET}"
  az login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to log in to Azure CLI${RESET}"
    exit 1
  fi
fi
ACCOUNT=$(az account show --query name -o tsv)
echo -e "${GREEN}Logged in as: ${ACCOUNT}${RESET}"

# Create Log Analytics Workspace
echo -e "\n${BLUE}Creating Log Analytics Workspace...${RESET}"
az monitor log-analytics workspace create \
  --resource-group "${RESOURCE_GROUP}" \
  --workspace-name "${LOG_ANALYTICS_WORKSPACE_NAME}" \
  --sku "PerGB2018" \
  --retention-time 30
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Log Analytics Workspace${RESET}"
  exit 1
fi
echo -e "${GREEN}Log Analytics Workspace created successfully${RESET}"

# Create Action Group
echo -e "\n${BLUE}Creating Action Group...${RESET}"
az monitor action-group create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${ACTION_GROUP_NAME}" \
  --short-name "JuicerAlert" \
  --email-receiver name=AdminEmail email="${ALERT_EMAIL}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Action Group${RESET}"
  exit 1
fi
echo -e "${GREEN}Action Group created successfully${RESET}"

# Get Azure resource IDs
echo -e "\n${BLUE}Getting Azure resource IDs...${RESET}"
DATABRICKS_ID=$(az databricks workspace show \
  --name "${DATABRICKS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query id -o tsv)

STORAGE_ID=$(az storage account show \
  --name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query id -o tsv)

KEYVAULT_ID=$(az keyvault show \
  --name "${KEYVAULT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query id -o tsv)

STATIC_WEB_APP_ID=$(az staticwebapp show \
  --name "${STATIC_WEB_APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query id -o tsv)

# Configure diagnostic settings for Databricks
echo -e "\n${BLUE}Configuring diagnostic settings for Databricks...${RESET}"
az monitor diagnostic-settings create \
  --name "databricks-diagnostics" \
  --resource "${DATABRICKS_ID}" \
  --workspace "${LOG_ANALYTICS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --logs '[{"category":"dbfs","enabled":true},{"category":"clusters","enabled":true},{"category":"accounts","enabled":true},{"category":"jobs","enabled":true},{"category":"notebook","enabled":true},{"category":"ssh","enabled":true},{"category":"workspace","enabled":true},{"category":"secrets","enabled":true},{"category":"sqlPermissions","enabled":true},{"category":"instancePools","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure diagnostic settings for Databricks${RESET}"
  exit 1
fi
echo -e "${GREEN}Diagnostic settings for Databricks configured successfully${RESET}"

# Configure diagnostic settings for Storage Account
echo -e "\n${BLUE}Configuring diagnostic settings for Storage Account...${RESET}"
az monitor diagnostic-settings create \
  --name "storage-diagnostics" \
  --resource "${STORAGE_ID}" \
  --workspace "${LOG_ANALYTICS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --logs '[{"category":"StorageRead","enabled":true},{"category":"StorageWrite","enabled":true},{"category":"StorageDelete","enabled":true}]' \
  --metrics '[{"category":"Transaction","enabled":true},{"category":"Capacity","enabled":true}]'
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure diagnostic settings for Storage Account${RESET}"
  exit 1
fi
echo -e "${GREEN}Diagnostic settings for Storage Account configured successfully${RESET}"

# Configure diagnostic settings for Key Vault
echo -e "\n${BLUE}Configuring diagnostic settings for Key Vault...${RESET}"
az monitor diagnostic-settings create \
  --name "keyvault-diagnostics" \
  --resource "${KEYVAULT_ID}" \
  --workspace "${LOG_ANALYTICS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --logs '[{"category":"AuditEvent","enabled":true},{"category":"AzurePolicyEvaluationDetails","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure diagnostic settings for Key Vault${RESET}"
  exit 1
fi
echo -e "${GREEN}Diagnostic settings for Key Vault configured successfully${RESET}"

# Configure diagnostic settings for Static Web App
echo -e "\n${BLUE}Configuring diagnostic settings for Static Web App...${RESET}"
az monitor diagnostic-settings create \
  --name "staticwebapp-diagnostics" \
  --resource "${STATIC_WEB_APP_ID}" \
  --workspace "${LOG_ANALYTICS_WORKSPACE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --logs '[{"category":"HttpLogs","enabled":true},{"category":"BuildLogs","enabled":true},{"category":"ContainerLogs","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to configure diagnostic settings for Static Web App${RESET}"
  exit 1
fi
echo -e "${GREEN}Diagnostic settings for Static Web App configured successfully${RESET}"

# Create storage account capacity alert
echo -e "\n${BLUE}Creating storage account capacity alert...${RESET}"
az monitor metrics alert create \
  --name "Storage-Capacity-Alert" \
  --resource-group "${RESOURCE_GROUP}" \
  --scopes "${STORAGE_ID}" \
  --condition "avg UsedCapacity > 85" \
  --description "Alert when storage capacity exceeds 85%" \
  --evaluation-frequency 1h \
  --window-size 1h \
  --severity 2 \
  --action-group "${ACTION_GROUP_NAME}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create storage account capacity alert${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage account capacity alert created successfully${RESET}"

# Create Databricks job failure alert
echo -e "\n${BLUE}Creating Databricks job failure alert...${RESET}"
cat > job_failure_query.kql << EOF
ADBJobsRuns 
| where JobId != "" and Status == "Failed"
| where TimeGenerated > ago(1h)
| project TimeGenerated, JobId, JobName, RunId, Status, ErrorMessage
EOF

az monitor scheduled-query create \
  --name "Databricks-Job-Failure-Alert" \
  --resource-group "${RESOURCE_GROUP}" \
  --scopes "${DATABRICKS_ID}" \
  --location "eastus" \
  --action-groups "${ACTION_GROUP_NAME}" \
  --evaluation-frequency 10m \
  --query-time-range 1h \
  --severity 1 \
  --condition-type query \
  --description "Alert on Databricks job failures" \
  --query "$(cat job_failure_query.kql)" \
  --threshold-operator "GreaterThan" \
  --threshold 0
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Databricks job failure alert${RESET}"
  exit 1
fi
echo -e "${GREEN}Databricks job failure alert created successfully${RESET}"

# Create Key Vault access alert
echo -e "\n${BLUE}Creating Key Vault access alert...${RESET}"
cat > key_vault_access_query.kql << EOF
AzureDiagnostics
| where ResourceType == "VAULTS" and Category == "AuditEvent"
| where OperationName == "SecretGet" or OperationName == "KeyGet"
| where ResultSignature != "200"
| project TimeGenerated, OperationName, Resource, ResultSignature, CallerIPAddress
EOF

az monitor scheduled-query create \
  --name "KeyVault-Failed-Access-Alert" \
  --resource-group "${RESOURCE_GROUP}" \
  --scopes "${KEYVAULT_ID}" \
  --location "eastus" \
  --action-groups "${ACTION_GROUP_NAME}" \
  --evaluation-frequency 5m \
  --query-time-range 5m \
  --severity 1 \
  --condition-type query \
  --description "Alert on Key Vault failed access attempts" \
  --query "$(cat key_vault_access_query.kql)" \
  --threshold-operator "GreaterThan" \
  --threshold 3
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Key Vault access alert${RESET}"
  exit 1
fi
echo -e "${GREEN}Key Vault access alert created successfully${RESET}"

# Create Static Web App availability alert
echo -e "\n${BLUE}Creating Static Web App availability alert...${RESET}"
az monitor metrics alert create \
  --name "StaticApp-Availability-Alert" \
  --resource-group "${RESOURCE_GROUP}" \
  --scopes "${STATIC_WEB_APP_ID}" \
  --condition "avg Availability < 99" \
  --description "Alert when static web app availability falls below 99%" \
  --evaluation-frequency 5m \
  --window-size 5m \
  --severity 1 \
  --action-group "${ACTION_GROUP_NAME}"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Static Web App availability alert${RESET}"
  exit 1
fi
echo -e "${GREEN}Static Web App availability alert created successfully${RESET}"

# Create Azure Dashboard for monitoring
echo -e "\n${BLUE}Creating Azure Dashboard for monitoring...${RESET}"
DASHBOARD_NAME="juicer-insights-monitoring-dashboard"

cat > dashboard_template.json << EOF
{
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "isOptional": true,
                  "value": "workspace"
                },
                {
                  "name": "ComponentId",
                  "isOptional": true,
                  "value": {
                    "SubscriptionId": "${SUBSCRIPTION_ID}",
                    "ResourceGroup": "${RESOURCE_GROUP}",
                    "Name": "${LOG_ANALYTICS_WORKSPACE_NAME}"
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
              "settings": {
                "content": {
                  "Query": "ADBJobsRuns\\n| where TimeGenerated > ago(24h)\\n| summarize count() by Status, bin(TimeGenerated, 1h)\\n| render columnchart",
                  "Id": "LogsDashboardQuery",
                  "Title": "Databricks Job Status"
                }
              }
            }
          },
          "1": {
            "position": {
              "x": 6,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "isOptional": true,
                  "value": "workspace"
                },
                {
                  "name": "ComponentId",
                  "isOptional": true,
                  "value": {
                    "SubscriptionId": "${SUBSCRIPTION_ID}",
                    "ResourceGroup": "${RESOURCE_GROUP}",
                    "Name": "${LOG_ANALYTICS_WORKSPACE_NAME}"
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
              "settings": {
                "content": {
                  "Query": "AzureMetrics\\n| where ResourceProvider == 'MICROSOFT.STORAGE'\\n| where MetricName == 'UsedCapacity'\\n| summarize max(Maximum) by bin(TimeGenerated, 1h)\\n| render timechart",
                  "Id": "LogsDashboardQuery",
                  "Title": "Storage Account Capacity"
                }
              }
            }
          },
          "2": {
            "position": {
              "x": 0,
              "y": 4,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "isOptional": true,
                  "value": "workspace"
                },
                {
                  "name": "ComponentId",
                  "isOptional": true,
                  "value": {
                    "SubscriptionId": "${SUBSCRIPTION_ID}",
                    "ResourceGroup": "${RESOURCE_GROUP}",
                    "Name": "${LOG_ANALYTICS_WORKSPACE_NAME}"
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
              "settings": {
                "content": {
                  "Query": "AzureDiagnostics\\n| where ResourceType == 'VAULTS'\\n| where Category == 'AuditEvent'\\n| summarize count() by OperationName, bin(TimeGenerated, 1h)\\n| render barchart",
                  "Id": "LogsDashboardQuery",
                  "Title": "Key Vault Operations"
                }
              }
            }
          },
          "3": {
            "position": {
              "x": 6,
              "y": 4,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "isOptional": true,
                  "value": "workspace"
                },
                {
                  "name": "ComponentId",
                  "isOptional": true,
                  "value": {
                    "SubscriptionId": "${SUBSCRIPTION_ID}",
                    "ResourceGroup": "${RESOURCE_GROUP}",
                    "Name": "${LOG_ANALYTICS_WORKSPACE_NAME}"
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
              "settings": {
                "content": {
                  "Query": "AppServiceHTTPLogs\\n| where _ResourceId contains '${STATIC_WEB_APP_NAME}'\\n| summarize AvgRequestTime=avg(TimeTaken), RequestCount=count() by bin(TimeGenerated, 1h)\\n| render columnchart",
                  "Id": "LogsDashboardQuery",
                  "Title": "Static Web App Performance"
                }
              }
            }
          }
        }
      }
    },
    "metadata": {
      "model": {
        "timeRange": {
          "value": {
            "relative": {
              "duration": 24,
              "timeUnit": 1
            }
          },
          "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
      }
    }
  },
  "name": "${DASHBOARD_NAME}",
  "type": "Microsoft.Portal/dashboards",
  "location": "eastus",
  "tags": {
    "hidden-title": "Juicer GenAI Insights Monitoring"
  }
}
EOF

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
# Replace placeholder with actual subscription ID
sed -i "s/\${SUBSCRIPTION_ID}/${SUBSCRIPTION_ID}/g" dashboard_template.json

az portal dashboard create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${DASHBOARD_NAME}" \
  --input-path dashboard_template.json
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Azure Dashboard${RESET}"
  exit 1
fi
echo -e "${GREEN}Azure Dashboard created successfully${RESET}"

# Summary
echo -e "\n${BLUE}${BOLD}Monitoring and Alerting Setup Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Log Analytics Workspace: ${GREEN}${LOG_ANALYTICS_WORKSPACE_NAME}${RESET}"
echo -e "Action Group: ${GREEN}${ACTION_GROUP_NAME}${RESET}"
echo -e "Alert Email: ${GREEN}${ALERT_EMAIL}${RESET}"
echo -e "Monitoring Dashboard: ${GREEN}${DASHBOARD_NAME}${RESET}"

echo -e "\n${GREEN}Monitoring and alerting setup complete!${RESET}"
echo -e "${YELLOW}You can access the monitoring dashboard in the Azure Portal.${RESET}"