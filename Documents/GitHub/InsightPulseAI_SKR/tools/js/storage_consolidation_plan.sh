#!/bin/bash
# Storage Account Consolidation Plan
# This script analyzes storage accounts and recommends consolidation opportunities

echo "==== Storage Account Consolidation Plan ===="
echo "Creating a plan to consolidate storage accounts in the TBWA-ProjectScout-Prod subscription"
echo ""

# Define regions for analysis
REGIONS=("eastus" "eastus2" "australiaeast")

# Create output directory
OUTPUT_DIR="storage_consolidation_$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

# Get all storage accounts
echo "Retrieving storage account information..."
az storage account list --query "[].{Name:name,ResourceGroup:resourceGroup,Location:location,Kind:kind,SKU:sku.name,AccessTier:accessTier}" -o json > "$OUTPUT_DIR/storage_accounts.json"

# Group by resource group and region
echo "Analyzing storage accounts by resource group and region..."
echo "=== Storage Accounts by Resource Group and Region ===" > "$OUTPUT_DIR/consolidation_opportunities.txt"

for REGION in "${REGIONS[@]}"; do
  echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "Region: $REGION" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "--------------------" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  
  # Get resource groups in this region with multiple storage accounts
  RESOURCE_GROUPS=$(jq -r --arg REGION "$REGION" '.[] | select(.Location == $REGION) | .ResourceGroup' "$OUTPUT_DIR/storage_accounts.json" | sort | uniq -c | sort -nr | awk '$1 > 1 {print $2}')
  
  if [ -z "$RESOURCE_GROUPS" ]; then
    echo "No resource groups with multiple storage accounts in $REGION" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
    continue
  fi
  
  for RG in $RESOURCE_GROUPS; do
    echo "Resource Group: $RG" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
    jq -r --arg RG "$RG" --arg REGION "$REGION" '.[] | select(.ResourceGroup == $RG and .Location == $REGION) | "- " + .Name + " (SKU: " + .SKU + ", Kind: " + .Kind + ")"' "$OUTPUT_DIR/storage_accounts.json" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
    echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  done
done

# Analyze redundancy levels
echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "=== Storage Account Redundancy Analysis ===" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "Storage accounts with potentially excessive redundancy:" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
jq -r '.[] | select(.SKU | contains("GRS") or contains("ZRS")) | "- " + .Name + " (SKU: " + .SKU + ", Resource Group: " + .ResourceGroup + ")"' "$OUTPUT_DIR/storage_accounts.json" >> "$OUTPUT_DIR/consolidation_opportunities.txt"

echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "=== Consolidation Recommendations ===" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "Based on the analysis, the following consolidation actions are recommended:" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"

# Check for retail-dashboards-rg consolidation
if jq -r '.[] | select(.ResourceGroup == "retail-dashboards-rg") | .Name' "$OUTPUT_DIR/storage_accounts.json" | grep -q 'retailedgedash0513\|retailperfdash0513'; then
  echo "1. Consolidate 'retailedgedash0513' and 'retailperfdash0513' in 'retail-dashboards-rg'" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "   - These appear to be similar dashboard storage accounts in the same resource group" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "   - Action: Migrate data from 'retailperfdash0513' to 'retailedgedash0513' and decommission 'retailperfdash0513'" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
fi

# Check for ProjectScout-ResourceGroup consolidation
if jq -r '.[] | select(.ResourceGroup == "ProjectScout-ResourceGroup") | .Name' "$OUTPUT_DIR/storage_accounts.json" | grep -q 'projectscoutstorage20250\|pscoutdash0513'; then
  echo "2. Consolidate 'projectscoutstorage20250' and 'pscoutdash0513' in 'ProjectScout-ResourceGroup'" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "   - These appear to be similar storage accounts in the same resource group" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "   - Action: Evaluate usage patterns and consider migrating data to maintain only one storage account" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
fi

# Check for RG-TBWA-ProjectScout-Juicer consolidation
if jq -r '.[] | select(.ResourceGroup == "RG-TBWA-ProjectScout-Juicer") | .Name' "$OUTPUT_DIR/storage_accounts.json" | grep -q 'tbwajuicerstorage\|retailadvisorstore'; then
  echo "3. Review 'tbwajuicerstorage' and 'retailadvisorstore' in 'RG-TBWA-ProjectScout-Juicer'" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "   - Determine if these have different purposes or could be consolidated" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "   - Action: Review usage patterns and dependencies before considering consolidation" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
  echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
fi

# Recommend redundancy optimization
echo "4. Optimize redundancy levels:" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "   - Consider changing 'projectscoutdata' from Standard_RAGRS to Standard_LRS if geo-redundancy is not critical" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "   - Evaluate if 'dbstoragehyx7ppequk63i' requires Standard_GRS or could use a lower redundancy level" >> "$OUTPUT_DIR/consolidation_opportunities.txt"
echo "" >> "$OUTPUT_DIR/consolidation_opportunities.txt"

echo "Consolidation analysis complete. Results saved to $OUTPUT_DIR/consolidation_opportunities.txt"
echo ""
echo "Next steps:"
echo "1. Review the identified consolidation opportunities"
echo "2. Evaluate dependencies and usage patterns for each storage account"
echo "3. Create migration plans for approved consolidations"
echo "4. Implement the changes in a controlled manner"