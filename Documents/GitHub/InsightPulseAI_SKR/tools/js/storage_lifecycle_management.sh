#!/bin/bash
# Storage Lifecycle Management Implementation
# This script implements lifecycle management policies for Azure Storage accounts

echo "==== Storage Lifecycle Management Implementation ===="
echo "Implementing lifecycle management for storage accounts in TBWA-ProjectScout-Prod subscription"
echo ""

# Create output directory
OUTPUT_DIR="storage_lifecycle_$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

# Get all storage accounts
echo "Retrieving storage account information..."
az storage account list --query "[].{Name:name,ResourceGroup:resourceGroup,Location:location}" -o json > "$OUTPUT_DIR/storage_accounts.json"

# ETL Storage accounts - these likely have data that can benefit from tiering
ETL_STORAGE_ACCOUNTS=(
  "tbwajuicerstorage:RG-TBWA-ProjectScout-Juicer"
  "dbstoragehyx7ppequk63i:databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5"
  "projectscoutdata:RG-TBWA-ProjectScout-Data"
)

# Policy JSON template for lifecycle management
cat > "$OUTPUT_DIR/lifecycle_policy_template.json" << EOF
{
  "rules": [
    {
      "name": "MoveToCoolTier",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["etl/processed/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {"daysAfterModificationGreaterThan": 30},
            "tierToArchive": {"daysAfterModificationGreaterThan": 90},
            "delete": {"daysAfterModificationGreaterThan": 365}
          }
        }
      }
    },
    {
      "name": "CleanupLogFiles",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["logs/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {"daysAfterModificationGreaterThan": 7},
            "tierToArchive": {"daysAfterModificationGreaterThan": 30},
            "delete": {"daysAfterModificationGreaterThan": 90}
          }
        }
      }
    },
    {
      "name": "DeleteSnapshots",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
        "actions": {
          "snapshot": {
            "delete": {"daysAfterCreationGreaterThan": 30}
          }
        }
      }
    }
  ]
}
EOF

# Create customized policies and apply them to each ETL storage account
echo "Implementing lifecycle policies for ETL storage accounts..."
echo "=== Lifecycle Management Implementation Results ===" > "$OUTPUT_DIR/lifecycle_implementation_results.txt"

for ACCOUNT_INFO in "${ETL_STORAGE_ACCOUNTS[@]}"; do
  ACCOUNT_NAME=$(echo "$ACCOUNT_INFO" | cut -d':' -f1)
  RESOURCE_GROUP=$(echo "$ACCOUNT_INFO" | cut -d':' -f2)
  
  echo "Processing $ACCOUNT_NAME in $RESOURCE_GROUP..."
  echo "Storage Account: $ACCOUNT_NAME" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  echo "Resource Group: $RESOURCE_GROUP" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  
  # Create a customized policy file for this account
  POLICY_FILE="$OUTPUT_DIR/lifecycle_policy_${ACCOUNT_NAME}.json"
  cp "$OUTPUT_DIR/lifecycle_policy_template.json" "$POLICY_FILE"
  
  # Apply the lifecycle policy
  echo "Applying lifecycle policy to $ACCOUNT_NAME..."
  if az storage account management-policy create --account-name "$ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" --policy @"$POLICY_FILE"; then
    echo "✅ Successfully applied lifecycle policy" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  else
    echo "❌ Failed to apply lifecycle policy - may require manual implementation" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  fi
  echo "" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
done

# Create a more conservative policy for dashboard storage accounts
cat > "$OUTPUT_DIR/dashboard_lifecycle_policy.json" << EOF
{
  "rules": [
    {
      "name": "ArchiveOldData",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["archived/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {"daysAfterModificationGreaterThan": 60},
            "tierToArchive": {"daysAfterModificationGreaterThan": 180}
          }
        }
      }
    },
    {
      "name": "DeleteSnapshots",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
        "actions": {
          "snapshot": {
            "delete": {"daysAfterCreationGreaterThan": 60}
          }
        }
      }
    }
  ]
}
EOF

# Dashboard Storage accounts - more conservative policy
DASHBOARD_STORAGE_ACCOUNTS=(
  "retailedgedash0513:retail-dashboards-rg"
  "retailperfdash0513:retail-dashboards-rg"
  "pscoutdash0513:ProjectScout-ResourceGroup"
  "retailadvisorstore:RG-TBWA-ProjectScout-Juicer"
)

echo "" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
echo "Implementing lifecycle policies for dashboard storage accounts..." >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"

for ACCOUNT_INFO in "${DASHBOARD_STORAGE_ACCOUNTS[@]}"; do
  ACCOUNT_NAME=$(echo "$ACCOUNT_INFO" | cut -d':' -f1)
  RESOURCE_GROUP=$(echo "$ACCOUNT_INFO" | cut -d':' -f2)
  
  echo "Processing $ACCOUNT_NAME in $RESOURCE_GROUP..."
  echo "Storage Account: $ACCOUNT_NAME" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  echo "Resource Group: $RESOURCE_GROUP" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  
  # Apply the dashboard lifecycle policy
  echo "Applying dashboard lifecycle policy to $ACCOUNT_NAME..."
  if az storage account management-policy create --account-name "$ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" --policy @"$OUTPUT_DIR/dashboard_lifecycle_policy.json"; then
    echo "✅ Successfully applied lifecycle policy" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  else
    echo "❌ Failed to apply lifecycle policy - may require manual implementation" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
  fi
  echo "" >> "$OUTPUT_DIR/lifecycle_implementation_results.txt"
done

echo "Lifecycle management implementation complete. Results saved to $OUTPUT_DIR/lifecycle_implementation_results.txt"
echo ""
echo "Policies implemented:"
echo "1. ETL Storage: Moves data to cool tier after 30 days, archive after 90 days, delete after 365 days"
echo "2. Log files: Move to cool tier after 7 days, archive after 30 days, delete after 90 days"
echo "3. Dashboard Storage: More conservative policy for active dashboard data"
echo ""
echo "Next steps:"
echo "1. Monitor storage costs over the next 30-60 days to verify savings"
echo "2. Adjust policies as needed based on access patterns"
echo "3. Consider container-specific policies for finer-grained control"