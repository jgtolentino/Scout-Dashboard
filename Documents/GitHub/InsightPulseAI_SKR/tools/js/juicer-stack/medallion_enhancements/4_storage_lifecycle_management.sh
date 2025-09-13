#!/bin/bash
# 4_storage_lifecycle_management.sh - Configure storage lifecycle management for Juicer GenAI Insights

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STORAGE_ACCOUNT_NAME="tbwajuicerstorage"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Storage Lifecycle Management for Juicer GenAI Insights    ║${RESET}"
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

# Create lifecycle management policy
echo -e "\n${BLUE}Creating storage account lifecycle management policy...${RESET}"

# Create policy JSON file
cat > lifecycle_policy.json << EOF
{
  "rules": [
    {
      "enabled": true,
      "name": "BronzeToArchive",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 30
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "bronze/"
          ]
        }
      }
    },
    {
      "enabled": true,
      "name": "SilverToArchive",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 60
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 180
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "silver/"
          ]
        }
      }
    },
    {
      "enabled": true,
      "name": "GoldToCool",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "gold/"
          ]
        }
      }
    },
    {
      "enabled": true,
      "name": "PlatinumRetention",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 731
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "platinum/"
          ]
        }
      }
    },
    {
      "enabled": true,
      "name": "LogsRetention",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 30
            },
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "logs/",
            "data-quality/"
          ]
        }
      }
    },
    {
      "enabled": true,
      "name": "SnapshotRetention",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "snapshot": {
            "delete": {
              "daysAfterCreationGreaterThan": 90
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ]
        }
      }
    }
  ]
}
EOF

# Apply lifecycle policy to storage account
az storage account management-policy create \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --policy @lifecycle_policy.json

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to apply lifecycle management policy${RESET}"
  exit 1
fi
echo -e "${GREEN}Lifecycle management policy applied successfully${RESET}"

# Create daily blob inventory
echo -e "\n${BLUE}Setting up daily blob inventory...${RESET}"

cat > inventory_policy.json << EOF
{
  "format": "Csv",
  "schedule": "Daily",
  "schemaFields": [
    "Name",
    "Creation-Time",
    "Last-Modified",
    "Content-Length",
    "AccessTier",
    "AccessTierChangeTime",
    "BlobType"
  ],
  "destination": {
    "container": "inventories"
  },
  "enabled": true,
  "includeBlobVersions": false,
  "includeSnapshots": false
}
EOF

# Check if inventories container exists, if not create it
CONTAINER_EXISTS=$(az storage container exists --account-name "${STORAGE_ACCOUNT_NAME}" --name "inventories" --auth-mode login --query exists -o tsv)
if [ "${CONTAINER_EXISTS}" != "true" ]; then
  echo -e "${YELLOW}Creating inventories container...${RESET}"
  az storage container create --account-name "${STORAGE_ACCOUNT_NAME}" --name "inventories" --auth-mode login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create inventories container${RESET}"
    exit 1
  fi
  echo -e "${GREEN}Inventories container created successfully${RESET}"
fi

# Apply inventory policy to each container
for container in "bronze" "silver" "gold" "platinum"; do
  echo -e "${BLUE}Setting up inventory for ${container} container...${RESET}"
  
  az storage blob service-properties inventory-policy update \
    --account-name "${STORAGE_ACCOUNT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --container "${container}" \
    --policy @inventory_policy.json \
    --name "${container}-inventory"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to set up inventory for ${container} container${RESET}"
    continue
  fi
  echo -e "${GREEN}Inventory setup successful for ${container} container${RESET}"
done

# Create storage monitoring dashboard
echo -e "\n${BLUE}Creating storage monitoring dashboard...${RESET}"
DASHBOARD_NAME="juicer-storage-lifecycle-dashboard"

cat > storage_dashboard_template.json << EOF
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
                  "name": "options",
                  "isOptional": true,
                  "value": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
                          },
                          "name": "UsedCapacity",
                          "aggregationType": 4,
                          "namespace": "microsoft.storage/storageaccounts",
                          "metricVisualization": {
                            "displayName": "Used capacity"
                          }
                        }
                      ],
                      "title": "Storage capacity by tier",
                      "visualization": {
                        "chartType": 2,
                        "legendVisualization": {
                          "isVisible": true,
                          "position": 2,
                          "hideSubtitle": false
                        },
                        "axisVisualization": {
                          "x": {
                            "isVisible": true,
                            "axisType": 2
                          },
                          "y": {
                            "isVisible": true,
                            "axisType": 1
                          }
                        }
                      }
                    }
                  }
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart"
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
                  "name": "options",
                  "isOptional": true,
                  "value": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
                          },
                          "name": "Transactions",
                          "aggregationType": 1,
                          "namespace": "microsoft.storage/storageaccounts",
                          "metricVisualization": {
                            "displayName": "Transactions"
                          }
                        }
                      ],
                      "title": "Transactions by container",
                      "visualization": {
                        "chartType": 2,
                        "legendVisualization": {
                          "isVisible": true,
                          "position": 2,
                          "hideSubtitle": false
                        },
                        "axisVisualization": {
                          "x": {
                            "isVisible": true,
                            "axisType": 2
                          },
                          "y": {
                            "isVisible": true,
                            "axisType": 1
                          }
                        }
                      }
                    }
                  }
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart"
            }
          },
          "2": {
            "position": {
              "x": 0,
              "y": 4,
              "colSpan": 12,
              "rowSpan": 3
            },
            "metadata": {
              "inputs": [
                {
                  "name": "sharedTimeRange",
                  "isOptional": true
                },
                {
                  "name": "options",
                  "value": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
                          },
                          "name": "BlobCount",
                          "aggregationType": 3,
                          "namespace": "microsoft.storage/storageaccounts/blobservices",
                          "metricVisualization": {
                            "displayName": "Blob Count",
                            "color": "#00BCF2"
                          }
                        },
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
                          },
                          "name": "BlobCapacity",
                          "aggregationType": 3,
                          "namespace": "microsoft.storage/storageaccounts/blobservices",
                          "metricVisualization": {
                            "displayName": "Blob Capacity",
                            "color": "#F8C016"
                          }
                        }
                      ],
                      "title": "Blob count and capacity",
                      "visualization": {
                        "chartType": 2,
                        "legendVisualization": {
                          "isVisible": true,
                          "position": 2,
                          "hideSubtitle": false
                        },
                        "axisVisualization": {
                          "x": {
                            "isVisible": true,
                            "axisType": 2
                          },
                          "y": {
                            "isVisible": true,
                            "axisType": 1
                          }
                        }
                      }
                    }
                  }
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart"
            }
          },
          "3": {
            "position": {
              "x": 0,
              "y": 7,
              "colSpan": 12,
              "rowSpan": 3
            },
            "metadata": {
              "inputs": [
                {
                  "name": "options",
                  "value": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
                          },
                          "name": "SuccessE2ELatency",
                          "aggregationType": 4,
                          "namespace": "microsoft.storage/storageaccounts",
                          "metricVisualization": {
                            "displayName": "Success E2E Latency",
                            "color": "#00BCF2"
                          }
                        },
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
                          },
                          "name": "SuccessServerLatency",
                          "aggregationType": 4,
                          "namespace": "microsoft.storage/storageaccounts",
                          "metricVisualization": {
                            "displayName": "Success Server Latency",
                            "color": "#F8C016"
                          }
                        }
                      ],
                      "title": "Storage latency",
                      "visualization": {
                        "chartType": 2,
                        "legendVisualization": {
                          "isVisible": true,
                          "position": 2,
                          "hideSubtitle": false
                        },
                        "axisVisualization": {
                          "x": {
                            "isVisible": true,
                            "axisType": 2
                          },
                          "y": {
                            "isVisible": true,
                            "axisType": 1
                          }
                        }
                      }
                    }
                  }
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart"
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
    "hidden-title": "Juicer Storage Lifecycle Management"
  }
}
EOF

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
# Replace placeholder with actual subscription ID
sed -i "s/\${SUBSCRIPTION_ID}/${SUBSCRIPTION_ID}/g" storage_dashboard_template.json

az portal dashboard create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${DASHBOARD_NAME}" \
  --input-path storage_dashboard_template.json
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create Storage Monitoring Dashboard${RESET}"
  exit 1
fi
echo -e "${GREEN}Storage Monitoring Dashboard created successfully${RESET}"

# Enable soft delete for blobs and containers
echo -e "\n${BLUE}Enabling soft delete for blobs and containers...${RESET}"
az storage blob service-properties update \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --enable-delete-retention true \
  --delete-retention-days 14 \
  --enable-container-delete-retention true \
  --container-delete-retention-days 14

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to enable soft delete${RESET}"
  exit 1
fi
echo -e "${GREEN}Soft delete enabled successfully${RESET}"

# Summary
echo -e "\n${BLUE}${BOLD}Storage Lifecycle Management Setup Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Storage Account: ${GREEN}${STORAGE_ACCOUNT_NAME}${RESET}"
echo -e "Lifecycle Policy:"
echo -e "  • ${GREEN}Bronze: Hot → Cool (30 days) → Archive (90 days)${RESET}"
echo -e "  • ${GREEN}Silver: Hot → Cool (60 days) → Archive (180 days)${RESET}"
echo -e "  • ${GREEN}Gold: Hot → Cool (90 days)${RESET}"
echo -e "  • ${GREEN}Platinum: 2-year retention policy${RESET}"
echo -e "  • ${GREEN}Logs: Archive (30 days) → Delete (365 days)${RESET}"
echo -e "  • ${GREEN}Snapshots: Delete after 90 days${RESET}"
echo -e "Blob Inventory:"
echo -e "  • ${GREEN}Daily inventory reports for all containers${RESET}"
echo -e "Soft Delete:"
echo -e "  • ${GREEN}14-day retention for blobs and containers${RESET}"
echo -e "Dashboard: ${GREEN}${DASHBOARD_NAME}${RESET}"

echo -e "\n${GREEN}Storage lifecycle management setup complete!${RESET}"
echo -e "${YELLOW}You can access the storage dashboard in the Azure Portal.${RESET}"