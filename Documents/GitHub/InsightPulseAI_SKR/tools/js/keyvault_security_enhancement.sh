#!/bin/bash
# Key Vault Security Enhancement Script
# Implements security best practices for Azure Key Vaults

echo "==== Key Vault Security Enhancement ===="
echo "Implementing security best practices for Azure Key Vaults in TBWA-ProjectScout-Prod subscription"
echo ""

# Create output directory
OUTPUT_DIR="keyvault_security_$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

# Get all Key Vaults
echo "Retrieving Key Vault information..."
az keyvault list --query "[].{Name:name,ResourceGroup:resourceGroup,Location:location}" -o json > "$OUTPUT_DIR/keyvaults.json"

# Key Vaults identified in inventory
KEY_VAULTS=(
  "kv-projectscout-prod:RG-TBWA-ProjectScout-Data"
  "mymlworkkeyvault3441b156:RG-TBWA-ProjectScout-Data"
  "mymlworkkeyvault47ce10d1:RG-Scout-BrandDetect-Prod-AUE"
  "kv-tbwa-juicer-insights2:RG-TBWA-ProjectScout-Juicer"
)

echo "=== Key Vault Security Enhancement Results ===" > "$OUTPUT_DIR/keyvault_security_results.txt"

# Process each Key Vault
for VAULT_INFO in "${KEY_VAULTS[@]}"; do
  VAULT_NAME=$(echo "$VAULT_INFO" | cut -d':' -f1)
  RESOURCE_GROUP=$(echo "$VAULT_INFO" | cut -d':' -f2)
  
  echo "Processing Key Vault: $VAULT_NAME in resource group: $RESOURCE_GROUP..."
  echo "" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  echo "Key Vault: $VAULT_NAME" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  echo "Resource Group: $RESOURCE_GROUP" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  echo "---------------------------------" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  
  # Check if Key Vault exists
  if ! az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo "❌ Key Vault $VAULT_NAME not found or access denied." >> "$OUTPUT_DIR/keyvault_security_results.txt"
    continue
  fi
  
  # 1. Enable soft delete and purge protection if not already enabled
  echo "Checking soft delete and purge protection..."
  SOFT_DELETE=$(az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.enableSoftDelete" -o tsv)
  PURGE_PROTECTION=$(az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.enablePurgeProtection" -o tsv)
  
  if [ "$SOFT_DELETE" != "true" ]; then
    echo "Enabling soft delete..."
    if az keyvault update --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --enable-soft-delete true; then
      echo "✅ Enabled soft delete" >> "$OUTPUT_DIR/keyvault_security_results.txt"
    else
      echo "❌ Failed to enable soft delete" >> "$OUTPUT_DIR/keyvault_security_results.txt"
    fi
  else
    echo "✅ Soft delete already enabled" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  fi
  
  if [ "$PURGE_PROTECTION" != "true" ]; then
    echo "Enabling purge protection..."
    if az keyvault update --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --enable-purge-protection true; then
      echo "✅ Enabled purge protection" >> "$OUTPUT_DIR/keyvault_security_results.txt"
    else
      echo "❌ Failed to enable purge protection (may require manual action)" >> "$OUTPUT_DIR/keyvault_security_results.txt"
    fi
  else
    echo "✅ Purge protection already enabled" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  fi
  
  # 2. Enable diagnostic settings
  echo "Setting up Key Vault diagnostic logging..."
  
  # Find Log Analytics workspace
  LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace list --query "[?name=='juicer-log-analytics'].id" -o tsv)
  
  if [ -n "$LOG_ANALYTICS_WORKSPACE_ID" ]; then
    # Create a unique name for diagnostic settings
    DIAG_SETTINGS_NAME="KeyVaultAuditLogs-$(date +%Y%m%d)"
    
    echo "Creating diagnostic setting $DIAG_SETTINGS_NAME..."
    if az monitor diagnostic-settings create \
      --name "$DIAG_SETTINGS_NAME" \
      --resource "$VAULT_NAME" \
      --resource-type "Microsoft.KeyVault/vaults" \
      --resource-group "$RESOURCE_GROUP" \
      --workspace "$LOG_ANALYTICS_WORKSPACE_ID" \
      --logs '[{"category":"AuditEvent","enabled":true},{"category":"AzurePolicyEvaluationDetails","enabled":true}]'; then
      echo "✅ Created diagnostic setting $DIAG_SETTINGS_NAME" >> "$OUTPUT_DIR/keyvault_security_results.txt"
    else
      echo "❌ Failed to create diagnostic setting" >> "$OUTPUT_DIR/keyvault_security_results.txt"
    fi
  else
    echo "❌ Log Analytics workspace not found. Diagnostic settings must be created manually." >> "$OUTPUT_DIR/keyvault_security_results.txt"
  fi
  
  # 3. Enable Azure Defender for Key Vault
  echo "Enabling Azure Defender for Key Vault..."
  if az security pricing create --name "KeyVaults" --tier "standard"; then
    echo "✅ Enabled Azure Defender for Key Vault" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  else
    echo "❌ Failed to enable Azure Defender for Key Vault (may require higher permissions)" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  fi
  
  # 4. Create a networking security policy for the Key Vault (restrict network access)
  echo "Checking network access policies..."
  NETWORK_ACLS=$(az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.networkAcls.defaultAction" -o tsv)
  
  if [ "$NETWORK_ACLS" == "Allow" ]; then
    echo "⚠️ Key Vault has unrestricted network access. Consider restricting to specific networks." >> "$OUTPUT_DIR/keyvault_security_results.txt"
    echo "  Command to restrict: az keyvault update --name $VAULT_NAME --resource-group $RESOURCE_GROUP --default-action Deny" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  else
    echo "✅ Network access is already restricted ($NETWORK_ACLS)" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  fi
  
  # 5. Review Access Policies
  echo "Retrieving access policies..."
  ACCESS_POLICIES=$(az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.accessPolicies[].{ObjectId:objectId,Permissions:permissions}" -o json)
  
  # Save access policies to a file for review
  echo "$ACCESS_POLICIES" > "$OUTPUT_DIR/${VAULT_NAME}_access_policies.json"
  echo "✅ Access policies exported to ${VAULT_NAME}_access_policies.json for review" >> "$OUTPUT_DIR/keyvault_security_results.txt"
  echo "  Review and remove any unnecessary access policies manually" >> "$OUTPUT_DIR/keyvault_security_results.txt"
done

# Create recommendations for remaining manual actions
echo "" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "=== Manual Actions Required ===" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "The following actions should be performed manually:" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "1. Review access policies exported to the files in $OUTPUT_DIR" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Remove unnecessary access policies" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Ensure least privilege principle is followed" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "2. For Key Vaults with unrestricted network access:" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Identify which networks need access to the Key Vault" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Update the Key Vault to allow only those networks" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Example: az keyvault update --name <vault-name> --resource-group <resource-group> --default-action Deny --ip-address <allowed-ip>" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "3. Review Key Vault secrets and certificates:" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Identify and remove any expired or unused secrets" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "   - Ensure all secrets have appropriate expiration dates" >> "$OUTPUT_DIR/keyvault_security_results.txt"
echo "" >> "$OUTPUT_DIR/keyvault_security_results.txt"

echo "Key Vault security enhancement complete. Results saved to $OUTPUT_DIR/keyvault_security_results.txt"
echo ""
echo "Implemented enhancements:"
echo "1. Enabled soft delete and purge protection when possible"
echo "2. Set up diagnostic logging to Log Analytics"
echo "3. Enabled Azure Defender for Key Vault where permissions allowed"
echo ""
echo "Manual review required for:"
echo "1. Access policies - review $OUTPUT_DIR/<vault-name>_access_policies.json files"
echo "2. Network access restrictions - consider implementing for all vaults"
echo "3. Key rotation and expiration policies"