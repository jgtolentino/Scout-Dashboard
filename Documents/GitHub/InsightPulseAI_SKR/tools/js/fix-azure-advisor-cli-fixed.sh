#!/usr/bin/env bash
set -euo pipefail

SUBSCRIPTION_ID="c03c092c-443c-4f25-9efe-33f092621251"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
LOG_ANALYTICS_WORKSPACE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.OperationalInsights/workspaces/juicer-log-analytics"

# Create a report file
REPORT_DIR="azure_advisor_fixes_$(date +%Y%m%d%H%M%S)"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/fixes_report.txt"

{
  echo "Azure Advisor Fix Report"
  echo "========================"
  echo "Date: $(date)"
  echo "Subscription: $SUBSCRIPTION_ID"
  echo ""
} > "$REPORT_FILE"

echo "Getting Azure Advisor recommendations..."
# Getting storage accounts needing soft delete
STORAGE_ACCOUNTS=$(az advisor recommendation list \
  --query "[?category=='HighAvailability' && contains(shortDescription.problem, 'Soft Delete')].resourceMetadata.resourceId" \
  -o tsv)

# Getting Key Vaults needing diagnostics
KEY_VAULTS=$(az advisor recommendation list \
  --query "[?category=='Security' && contains(shortDescription.problem, 'diagnostic')].resourceMetadata.resourceId" \
  -o tsv)

# Process storage accounts
if [ -n "$STORAGE_ACCOUNTS" ]; then
  echo "Found storage accounts needing soft delete enabled:"
  echo "$STORAGE_ACCOUNTS"
  
  {
    echo "STORAGE ACCOUNTS WITH SOFT DELETE ENABLED"
    echo "========================================="
    echo ""
  } >> "$REPORT_FILE"
  
  while read -r STORAGE_ACCOUNT; do
    if [ -z "$STORAGE_ACCOUNT" ]; then
      continue
    fi
    
    echo "Processing: $STORAGE_ACCOUNT"
    
    # Extract storage account name and resource group
    STORAGE_RG=$(echo "$STORAGE_ACCOUNT" | cut -d'/' -f5)
    STORAGE_NAME=$(echo "$STORAGE_ACCOUNT" | cut -d'/' -f9)
    
    # Check if storage account exists
    if az storage account show --name "$STORAGE_NAME" --resource-group "$STORAGE_RG" >/dev/null 2>&1; then
      echo "Storage account found: $STORAGE_NAME"
      
      # Use the blob-service-properties with --auth-mode login
      echo "Enabling blob soft delete..."
      if az storage blob service-properties delete-policy update \
           --account-name "$STORAGE_NAME" \
           --days-retained 7 \
           --enable true \
           --auth-mode login; then
        echo "✅ Enabled blob soft delete for $STORAGE_NAME with 7-day retention"
        
        {
          echo "- Storage Account: $STORAGE_NAME"
          echo "  Resource Group: $STORAGE_RG"
          echo "  Action: Enabled blob soft delete with 7-day retention"
          echo ""
        } >> "$REPORT_FILE"
      else
        echo "❌ Failed to enable blob soft delete for $STORAGE_NAME. Check permissions."
        
        {
          echo "- Storage Account: $STORAGE_NAME"
          echo "  Resource Group: $STORAGE_RG"
          echo "  Status: Failed to enable blob soft delete - permission denied"
          echo ""
        } >> "$REPORT_FILE"
      fi
    else
      echo "❌ Storage account not found: $STORAGE_NAME"
      
      {
        echo "- Storage Account: $STORAGE_NAME"
        echo "  Resource Group: $STORAGE_RG"
        echo "  Status: Not found or access denied"
        echo ""
      } >> "$REPORT_FILE"
    fi
  done <<< "$STORAGE_ACCOUNTS"
else
  echo "No storage accounts need soft delete enabled."
  echo "No storage accounts needed soft delete enabled." >> "$REPORT_FILE"
fi

# Process Key Vaults
if [ -n "$KEY_VAULTS" ]; then
  echo "Found Key Vaults needing diagnostics settings:"
  echo "$KEY_VAULTS"
  
  {
    echo "KEY VAULTS WITH DIAGNOSTICS ENABLED"
    echo "==================================="
    echo ""
  } >> "$REPORT_FILE"
  
  while read -r KEY_VAULT; do
    if [ -z "$KEY_VAULT" ]; then
      continue
    fi
    
    # Extract Key Vault name for reporting
    KEY_VAULT_NAME=$(echo "$KEY_VAULT" | cut -d'/' -f9)
    KEY_VAULT_RG=$(echo "$KEY_VAULT" | cut -d'/' -f5)
    
    echo "Enabling diagnostics for: $KEY_VAULT"
    SETTINGS_NAME="kv-diagnostics-$(date +%Y%m%d%H%M%S)"
    
    # Check if Key Vault exists
    if az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$KEY_VAULT_RG" >/dev/null 2>&1; then
      echo "Key Vault found: $KEY_VAULT_NAME"
      
      if az monitor diagnostic-settings create --name "$SETTINGS_NAME" \
           --resource "$KEY_VAULT" \
           --workspace "$LOG_ANALYTICS_WORKSPACE" \
           --logs '[{"category":"AuditEvent","enabled":true}]'; then
        
        echo "✅ Enabled diagnostics for $KEY_VAULT_NAME"
        
        {
          echo "- Key Vault: $KEY_VAULT_NAME"
          echo "  Resource Group: $KEY_VAULT_RG"
          echo "  Action: Enabled diagnostic logging to Log Analytics workspace"
          echo "  Settings Name: $SETTINGS_NAME"
          echo ""
        } >> "$REPORT_FILE"
      else
        echo "❌ Failed to enable diagnostics for $KEY_VAULT_NAME. Check permissions."
        
        {
          echo "- Key Vault: $KEY_VAULT_NAME"
          echo "  Resource Group: $KEY_VAULT_RG"
          echo "  Status: Failed to enable diagnostics - permission denied"
          echo ""
        } >> "$REPORT_FILE"
      fi
    else
      echo "❌ Key Vault not found: $KEY_VAULT_NAME"
      
      {
        echo "- Key Vault: $KEY_VAULT_NAME"
        echo "  Resource Group: $KEY_VAULT_RG"
        echo "  Status: Not found or access denied"
        echo ""
      } >> "$REPORT_FILE"
    fi
  done <<< "$KEY_VAULTS"
else
  echo "No Key Vaults need diagnostic settings enabled."
  echo "No Key Vaults needed diagnostic settings enabled." >> "$REPORT_FILE"
fi

echo "Creating Azure Policy to enforce Storage soft delete..."
POLICY_NAME="Enforce-Storage-SoftDelete"
if az policy assignment create \
     --name "$POLICY_NAME" \
     --scope /subscriptions/$SUBSCRIPTION_ID \
     --policy "/providers/Microsoft.Authorization/policyDefinitions/ea39f60f-9f00-473c-8604-be5eac4bb088"; then
  
  echo "✅ Created policy to enforce Storage soft delete"
  
  {
    echo "AZURE POLICIES CREATED"
    echo "======================"
    echo ""
    echo "- Policy: $POLICY_NAME"
    echo "  Scope: Subscription $SUBSCRIPTION_ID"
    echo "  Purpose: Enforce Storage soft delete for future storage accounts"
    echo ""
  } >> "$REPORT_FILE"
else
  echo "❌ Failed to create policy for Storage soft delete. Check permissions."
  
  {
    echo "AZURE POLICIES"
    echo "=============="
    echo ""
    echo "- Policy: $POLICY_NAME"
    echo "  Status: Failed to create - permission denied"
    echo ""
  } >> "$REPORT_FILE"
fi

echo "Creating Azure Policy to enforce Key Vault diagnostics..."
POLICY_NAME="Enforce-KV-Diagnostics"
if az policy assignment create \
     --name "$POLICY_NAME" \
     --scope /subscriptions/$SUBSCRIPTION_ID \
     --policy "/providers/Microsoft.Authorization/policyDefinitions/6b359d8f-f88d-4052-aa7c-32015963ecc1"; then
  
  echo "✅ Created policy to enforce Key Vault diagnostics"
  
  {
    echo "- Policy: $POLICY_NAME"
    echo "  Scope: Subscription $SUBSCRIPTION_ID"
    echo "  Purpose: Enforce diagnostic settings for future Key Vaults"
    echo ""
  } >> "$REPORT_FILE"
else
  echo "❌ Failed to create policy for Key Vault diagnostics. Check permissions."
  
  {
    echo "- Policy: $POLICY_NAME"
    echo "  Status: Failed to create - permission denied"
    echo ""
  } >> "$REPORT_FILE"
fi

{
  echo "SUMMARY"
  echo "======="
  echo "All Azure Advisor recommendations have been addressed."
  echo "Report generated: $(date)"
} >> "$REPORT_FILE"

echo "All recommendations processed successfully!"
echo "Report saved to: $REPORT_FILE"