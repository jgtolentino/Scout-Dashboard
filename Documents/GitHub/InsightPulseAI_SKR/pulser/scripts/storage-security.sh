#!/bin/bash

# Storage Account Security Configuration Script v1.0
# This script implements Azure storage account security and access control configurations
# for use with the storage consolidation project

set -e  # Exit on any error

# Color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function for logging with timestamp
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $timestamp - $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $timestamp - $message" ;;
        *) echo -e "$timestamp - $message" ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Function to display script help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -m, --mode MODE           Operation mode: audit, configure, private-endpoint (default: audit)"
    echo "  -a, --account NAME        Storage account name"
    echo "  -r, --resource-group NAME Resource group name"
    echo "  -n, --network-rule MODE   Network access rule (allowed|denied|default)"
    echo "  -e, --enable-https        Enable HTTPS traffic only"
    echo "  -v, --vnet NAME           Virtual network name for private endpoint"
    echo "  -s, --subnet NAME         Subnet name for private endpoint"
    echo "  -k, --key-vault NAME      Key Vault for storing access keys"
    echo "  -f, --plan-file FILE      Security plan file for configuration mode"
    echo "  --dry-run                 Show what would be done without actually doing it"
    echo "  --verbose                 Show more detailed output"
    echo ""
    echo "Examples:"
    echo "  $0 --mode audit --resource-group RG-TBWA-ProjectScout-Juicer"
    echo "  $0 --mode configure --account tbwajuicerstorage --resource-group RG-TBWA-ProjectScout-Juicer --enable-https --network-rule allowed"
    echo "  $0 --mode private-endpoint --account tbwajuicerstorage --resource-group RG-TBWA-ProjectScout-Juicer --vnet tbwa-vnet --subnet storage-subnet"
}

# Function to verify Azure CLI is installed and logged in
verify_azure_cli() {
    log "INFO" "Verifying Azure CLI installation..."
    
    if ! command_exists az; then
        log "ERROR" "Azure CLI not found. Please install it and try again."
        echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    log "INFO" "Checking Azure CLI login status..."
    
    if ! az account show &> /dev/null; then
        log "WARNING" "Not logged in to Azure CLI. Please log in first."
        read -p "Login to Azure CLI now? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Logging in to Azure CLI..."
            az login
        else
            log "ERROR" "Azure login required. Exiting."
            exit 1
        fi
    fi
    
    log "SUCCESS" "Azure CLI verified."
}

# Function to audit security settings for storage accounts in a resource group
audit_security_settings() {
    local resource_group=$1
    
    log "INFO" "Auditing security settings for storage accounts in resource group: $resource_group"
    
    # Create output directory if it doesn't exist
    mkdir -p ".storage-analysis"
    
    # List all storage accounts in the resource group
    local accounts_output=".storage-analysis/storage-accounts-$resource_group.json"
    az storage account list --resource-group "$resource_group" --output json > "$accounts_output"
    
    # Check if any accounts were found
    local account_count=$(jq length "$accounts_output")
    
    if [ "$account_count" -eq 0 ]; then
        log "WARNING" "No storage accounts found in resource group: $resource_group"
        return 1
    fi
    
    # Create security audit report
    local audit_report=".storage-analysis/security-audit-$resource_group.md"
    
    echo "# Storage Account Security Audit Report for Resource Group: $resource_group" > "$audit_report"
    echo "" >> "$audit_report"
    echo "Audit Date: $(date)" >> "$audit_report"
    echo "" >> "$audit_report"
    
    # Loop through accounts and audit security settings
    for account_name in $(jq -r '.[].name' "$accounts_output"); do
        log "INFO" "Auditing security for account: $account_name"
        
        # Get account details
        local account_info=$(az storage account show --name "$account_name" --resource-group "$resource_group" -o json)
        
        echo "## Storage Account: $account_name" >> "$audit_report"
        echo "" >> "$audit_report"
        
        # Check HTTPS enforcement
        local https_only=$(echo "$account_info" | jq -r '.enableHttpsTrafficOnly')
        
        echo "### Data Protection" >> "$audit_report"
        echo "" >> "$audit_report"
        echo "- **HTTPS Only:** $https_only" >> "$audit_report"
        
        if [ "$https_only" = "false" ]; then
            echo "  - :warning: **Security Risk:** HTTP traffic is allowed. Enable HTTPS only." >> "$audit_report"
        else
            echo "  - :white_check_mark: HTTPS requirement properly enforced." >> "$audit_report"
        fi
        
        # Check Secure Transfer requirement
        local secure_transfer=$(echo "$account_info" | jq -r '.enableHttpsTrafficOnly')
        echo "- **Secure Transfer Required:** $secure_transfer" >> "$audit_report"
        
        if [ "$secure_transfer" = "false" ]; then
            echo "  - :warning: **Security Risk:** Secure transfer not required." >> "$audit_report"
        else
            echo "  - :white_check_mark: Secure transfer required." >> "$audit_report"
        fi
        
        # Check Minimum TLS Version
        local min_tls_version=$(echo "$account_info" | jq -r '.minimumTlsVersion')
        echo "- **Minimum TLS Version:** $min_tls_version" >> "$audit_report"
        
        if [ "$min_tls_version" = "TLS1_0" ] || [ "$min_tls_version" = "TLS1_1" ]; then
            echo "  - :warning: **Security Risk:** Using outdated TLS version. Upgrade to TLS1_2." >> "$audit_report"
        else
            echo "  - :white_check_mark: Using modern TLS version." >> "$audit_report"
        fi
        
        # Check Blob Public Access
        local allow_blob_public_access=$(echo "$account_info" | jq -r '.allowBlobPublicAccess')
        echo "- **Public Blob Access:** $allow_blob_public_access" >> "$audit_report"
        
        if [ "$allow_blob_public_access" = "true" ]; then
            echo "  - :warning: **Security Risk:** Public blob access is allowed." >> "$audit_report"
        else
            echo "  - :white_check_mark: Public blob access is disabled." >> "$audit_report"
        fi
        
        # Check Network Access Rules
        echo "" >> "$audit_report"
        echo "### Network Security" >> "$audit_report"
        echo "" >> "$audit_report"
        
        local default_action=$(echo "$account_info" | jq -r '.networkRuleSet.defaultAction')
        echo "- **Default Network Access:** $default_action" >> "$audit_report"
        
        if [ "$default_action" = "Allow" ]; then
            echo "  - :warning: **Security Risk:** Default network access is set to Allow." >> "$audit_report"
        else
            echo "  - :white_check_mark: Default network access is restricted." >> "$audit_report"
        fi
        
        # Check IP rules
        local ip_rules=$(echo "$account_info" | jq -r '.networkRuleSet.ipRules')
        local ip_rule_count=$(echo "$ip_rules" | jq 'length')
        
        echo "- **IP Rules:** $ip_rule_count rule(s)" >> "$audit_report"
        
        if [ "$ip_rule_count" -gt 0 ]; then
            echo "  - IP Rules:" >> "$audit_report"
            for ip_rule in $(echo "$ip_rules" | jq -c '.[]'); do
                local ip_address=$(echo "$ip_rule" | jq -r '.value')
                echo "    - $ip_address" >> "$audit_report"
            done
        elif [ "$default_action" = "Allow" ]; then
            echo "  - :warning: **Security Risk:** No IP rules and default access is Allow." >> "$audit_report"
        fi
        
        # Check VNet rules
        local vnet_rules=$(echo "$account_info" | jq -r '.networkRuleSet.virtualNetworkRules')
        local vnet_rule_count=$(echo "$vnet_rules" | jq 'length')
        
        echo "- **VNet Rules:** $vnet_rule_count rule(s)" >> "$audit_report"
        
        if [ "$vnet_rule_count" -gt 0 ]; then
            echo "  - VNet Rules:" >> "$audit_report"
            for vnet_rule in $(echo "$vnet_rules" | jq -c '.[]'); do
                local vnet_id=$(echo "$vnet_rule" | jq -r '.id')
                local vnet_name=$(echo "$vnet_id" | awk -F'/' '{print $(NF-2)}')
                local subnet_name=$(echo "$vnet_id" | awk -F'/' '{print $NF}')
                echo "    - VNet: $vnet_name, Subnet: $subnet_name" >> "$audit_report"
            done
        elif [ "$default_action" = "Deny" ] && [ "$ip_rule_count" -eq 0 ]; then
            echo "  - :warning: **Security Risk:** No VNet rules, no IP rules, and default action is Deny. This could block all access." >> "$audit_report"
        fi
        
        # Check Private Endpoints
        local private_endpoints=$(az network private-endpoint list --resource-group "$resource_group" --query "[?privateLinkServiceConnections[?contains(privateLinkServiceId, '$account_name')]].name" -o json 2>/dev/null || echo "[]")
        local pe_count=$(echo "$private_endpoints" | jq 'length')
        
        echo "- **Private Endpoints:** $pe_count endpoint(s)" >> "$audit_report"
        
        if [ "$pe_count" -gt 0 ]; then
            echo "  - Private Endpoints:" >> "$audit_report"
            for pe_name in $(echo "$private_endpoints" | jq -r '.[]'); do
                echo "    - $pe_name" >> "$audit_report"
            done
            echo "  - :white_check_mark: Using private endpoints for secure connectivity." >> "$audit_report"
        elif [ "$default_action" = "Deny" ]; then
            echo "  - :warning: Consider using private endpoints for secure connectivity." >> "$audit_report"
        fi
        
        # Check encryption settings
        echo "" >> "$audit_report"
        echo "### Encryption" >> "$audit_report"
        echo "" >> "$audit_report"
        
        local encryption_services=$(echo "$account_info" | jq -r '.encryption.services')
        local blob_encryption=$(echo "$encryption_services" | jq -r '.blob.enabled')
        local file_encryption=$(echo "$encryption_services" | jq -r '.file.enabled')
        local queue_encryption=$(echo "$encryption_services" | jq -r '.queue.enabled')
        local table_encryption=$(echo "$encryption_services" | jq -r '.table.enabled')
        
        echo "- **Encryption Settings:**" >> "$audit_report"
        echo "  - Blob Encryption: $blob_encryption" >> "$audit_report"
        echo "  - File Encryption: $file_encryption" >> "$audit_report"
        echo "  - Queue Encryption: $queue_encryption" >> "$audit_report"
        echo "  - Table Encryption: $table_encryption" >> "$audit_report"
        
        if [ "$blob_encryption" = "true" ] && [ "$file_encryption" = "true" ]; then
            echo "  - :white_check_mark: Storage is properly encrypted." >> "$audit_report"
        else
            echo "  - :warning: **Security Risk:** Some storage types are not encrypted." >> "$audit_report"
        fi
        
        # Check key source
        local key_source=$(echo "$account_info" | jq -r '.encryption.keySource')
        echo "- **Encryption Key Source:** $key_source" >> "$audit_report"
        
        if [ "$key_source" = "Microsoft.Storage" ]; then
            echo "  - Using Microsoft-managed keys." >> "$audit_report"
            echo "  - :information_source: Consider using customer-managed keys for higher security." >> "$audit_report"
        elif [ "$key_source" = "Microsoft.KeyVault" ]; then
            local key_vault_uri=$(echo "$account_info" | jq -r '.encryption.keyVaultProperties.keyVaultUri')
            local key_name=$(echo "$account_info" | jq -r '.encryption.keyVaultProperties.keyName')
            
            echo "  - :white_check_mark: Using customer-managed keys from Key Vault." >> "$audit_report"
            echo "  - Key Vault: $key_vault_uri" >> "$audit_report"
            echo "  - Key Name: $key_name" >> "$audit_report"
        fi
        
        # Check infrastructure encryption
        local infrastructure_encryption=$(echo "$account_info" | jq -r '.encryption.requireInfrastructureEncryption')
        echo "- **Infrastructure Encryption:** $infrastructure_encryption" >> "$audit_report"
        
        if [ "$infrastructure_encryption" = "true" ]; then
            echo "  - :white_check_mark: Infrastructure encryption is enabled (double encryption)." >> "$audit_report"
        else
            echo "  - :information_source: Infrastructure encryption not enabled. Consider enabling for sensitive data." >> "$audit_report"
        fi
        
        # Overall security score
        echo "" >> "$audit_report"
        echo "### Security Score" >> "$audit_report"
        echo "" >> "$audit_report"
        
        local score=0
        local max_score=6
        
        [ "$https_only" = "true" ] && ((score++))
        [ "$min_tls_version" = "TLS1_2" ] && ((score++))
        [ "$allow_blob_public_access" = "false" ] && ((score++))
        [ "$default_action" = "Deny" ] && ((score++))
        [ "$pe_count" -gt 0 ] && ((score++))
        [ "$blob_encryption" = "true" ] && [ "$file_encryption" = "true" ] && ((score++))
        
        local percentage=$((score * 100 / max_score))
        
        echo "- **Overall Security Score:** $score/$max_score ($percentage%)" >> "$audit_report"
        
        if [ $percentage -ge 80 ]; then
            echo "  - :white_check_mark: **Good:** This storage account has strong security settings." >> "$audit_report"
        elif [ $percentage -ge 50 ]; then
            echo "  - :warning: **Fair:** This storage account has moderate security settings. Consider improvements." >> "$audit_report"
        else
            echo "  - :x: **Poor:** This storage account has weak security settings. Immediate action recommended." >> "$audit_report"
        fi
        
        # Security recommendations
        echo "" >> "$audit_report"
        echo "### Security Recommendations" >> "$audit_report"
        echo "" >> "$audit_report"
        
        local recommendations=()
        
        [ "$https_only" = "false" ] && recommendations+=("Enable HTTPS-only traffic")
        [ "$min_tls_version" != "TLS1_2" ] && recommendations+=("Upgrade minimum TLS version to 1.2")
        [ "$allow_blob_public_access" = "true" ] && recommendations+=("Disable public blob access if not specifically required")
        [ "$default_action" = "Allow" ] && recommendations+=("Change default network action to Deny and use specific allow rules")
        [ "$pe_count" -eq 0 ] && [ "$default_action" = "Deny" ] && recommendations+=("Implement private endpoints for secure connectivity")
        [ "$key_source" = "Microsoft.Storage" ] && recommendations+=("Consider using customer-managed keys for encryption")
        [ "$infrastructure_encryption" = "false" ] && recommendations+=("Enable infrastructure encryption for sensitive data")
        
        if [ ${#recommendations[@]} -eq 0 ]; then
            echo "- :white_check_mark: **No critical recommendations.** This storage account is well-secured." >> "$audit_report"
        else
            echo "Recommended security improvements:" >> "$audit_report"
            
            for rec in "${recommendations[@]}"; do
                echo "- $rec" >> "$audit_report"
            done
            
            # Provide command examples
            echo "" >> "$audit_report"
            echo "Example commands to implement recommendations:" >> "$audit_report"
            echo '```bash' >> "$audit_report"
            
            if [ "$https_only" = "false" ]; then
                echo "# Enable HTTPS-only traffic" >> "$audit_report"
                echo "az storage account update --name $account_name --resource-group $resource_group --https-only true" >> "$audit_report"
                echo "" >> "$audit_report"
            fi
            
            if [ "$min_tls_version" != "TLS1_2" ]; then
                echo "# Upgrade minimum TLS version" >> "$audit_report"
                echo "az storage account update --name $account_name --resource-group $resource_group --min-tls-version TLS1_2" >> "$audit_report"
                echo "" >> "$audit_report"
            fi
            
            if [ "$allow_blob_public_access" = "true" ]; then
                echo "# Disable public blob access" >> "$audit_report"
                echo "az storage account update --name $account_name --resource-group $resource_group --allow-blob-public-access false" >> "$audit_report"
                echo "" >> "$audit_report"
            fi
            
            if [ "$default_action" = "Allow" ]; then
                echo "# Change default network action to Deny" >> "$audit_report"
                echo "az storage account update --name $account_name --resource-group $resource_group --default-action Deny" >> "$audit_report"
                echo "" >> "$audit_report"
            fi
            
            if [ "$pe_count" -eq 0 ] && [ "$default_action" = "Deny" ]; then
                echo "# Create a private endpoint" >> "$audit_report"
                echo "# First create a VNet and subnet if needed" >> "$audit_report"
                echo "az network vnet create --resource-group $resource_group --name example-vnet --address-prefix 10.0.0.0/16 --subnet-name storage-subnet --subnet-prefix 10.0.0.0/24" >> "$audit_report"
                echo "" >> "$audit_report"
                echo "# Then create the private endpoint" >> "$audit_report"
                echo "az network private-endpoint create --resource-group $resource_group --name $account_name-pe --vnet-name example-vnet --subnet storage-subnet --private-connection-resource-id \$(az storage account show --name $account_name --resource-group $resource_group --query id -o tsv) --group-id blob --connection-name $account_name-connection" >> "$audit_report"
                echo "" >> "$audit_report"
            fi
            
            echo '```' >> "$audit_report"
        fi
        
        echo "" >> "$audit_report"
    done
    
    # Add summary section
    echo "## Overall Resource Group Security Summary" >> "$audit_report"
    echo "" >> "$audit_report"
    
    # Count critical issues
    local critical_count=0
    while IFS= read -r line; do
        [ -n "$line" ] && ((critical_count++))
    done < <(grep -o ":warning:" "$audit_report")
    
    echo "- Storage Accounts Analyzed: $account_count" >> "$audit_report"
    echo "- Critical Security Issues: $critical_count" >> "$audit_report"
    echo "" >> "$audit_report"
    
    if [ $critical_count -eq 0 ]; then
        echo "**Excellent!** No critical security issues were detected in the storage accounts." >> "$audit_report"
    elif [ $critical_count -lt 5 ]; then
        echo "**Good.** Only a few security issues were detected. Address the recommendations to improve security." >> "$audit_report"
    else
        echo "**Warning!** Multiple security issues were detected. Please address the critical recommendations as soon as possible." >> "$audit_report"
    fi
    
    log "SUCCESS" "Security audit completed. Report generated: $audit_report"
    
    if [ "$VERBOSE" = "true" ]; then
        echo ""
        echo "Security Audit Summary:"
        cat "$audit_report"
    fi
    
    return 0
}

# Function to configure security settings for a specific storage account
configure_security_settings() {
    local account_name=$1
    local resource_group=$2
    local network_rule=$3
    local enable_https=$4
    
    log "INFO" "Configuring security settings for account: $account_name"
    
    # Verify account exists
    if ! az storage account show --name "$account_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Storage account not found: $account_name"
        return 1
    fi
    
    local update_command="az storage account update --name $account_name --resource-group $resource_group"
    local dry_run_suffix=""
    
    if [ "$DRY_RUN" = "true" ]; then
        dry_run_suffix=" [DRY RUN]"
        log "INFO" "Dry run mode enabled, no changes will be made"
    fi
    
    # Configure HTTPS setting
    if [ "$enable_https" = "true" ]; then
        log "INFO" "Enabling HTTPS-only traffic$dry_run_suffix"
        
        if [ "$DRY_RUN" != "true" ]; then
            if az storage account update --name "$account_name" --resource-group "$resource_group" --https-only true --output none; then
                log "SUCCESS" "HTTPS-only traffic enabled"
            else
                log "ERROR" "Failed to enable HTTPS-only traffic"
            fi
        fi
    fi
    
    # Configure TLS version
    log "INFO" "Setting minimum TLS version to 1.2$dry_run_suffix"
    
    if [ "$DRY_RUN" != "true" ]; then
        if az storage account update --name "$account_name" --resource-group "$resource_group" --min-tls-version TLS1_2 --output none; then
            log "SUCCESS" "Minimum TLS version set to 1.2"
        else
            log "ERROR" "Failed to set minimum TLS version"
        fi
    fi
    
    # Configure public blob access
    log "INFO" "Disabling public blob access$dry_run_suffix"
    
    if [ "$DRY_RUN" != "true" ]; then
        if az storage account update --name "$account_name" --resource-group "$resource_group" --allow-blob-public-access false --output none; then
            log "SUCCESS" "Public blob access disabled"
        else
            log "ERROR" "Failed to disable public blob access"
        fi
    fi
    
    # Configure network rules
    if [ -n "$network_rule" ]; then
        if [ "$network_rule" = "denied" ]; then
            log "INFO" "Setting default network action to Deny$dry_run_suffix"
            
            if [ "$DRY_RUN" != "true" ]; then
                if az storage account update --name "$account_name" --resource-group "$resource_group" --default-action Deny --output none; then
                    log "SUCCESS" "Default network action set to Deny"
                else
                    log "ERROR" "Failed to set default network action"
                fi
            fi
        elif [ "$network_rule" = "allowed" ]; then
            log "INFO" "Setting default network action to Allow$dry_run_suffix"
            
            if [ "$DRY_RUN" != "true" ]; then
                if az storage account update --name "$account_name" --resource-group "$resource_group" --default-action Allow --output none; then
                    log "SUCCESS" "Default network action set to Allow"
                else
                    log "ERROR" "Failed to set default network action"
                fi
            fi
        fi
    fi
    
    # Enable soft delete for blobs
    log "INFO" "Enabling soft delete for blobs (retention: 14 days)$dry_run_suffix"
    
    if [ "$DRY_RUN" != "true" ]; then
        if az storage blob service-properties delete-policy update --account-name "$account_name" --enable true --days-retained 14 --output none; then
            log "SUCCESS" "Soft delete enabled for blobs"
        else
            log "ERROR" "Failed to enable soft delete for blobs"
        fi
    fi
    
    # Enable soft delete for containers
    log "INFO" "Enabling soft delete for containers (retention: 14 days)$dry_run_suffix"
    
    if [ "$DRY_RUN" != "true" ]; then
        if az storage container service-properties delete-policy update --account-name "$account_name" --enable true --days-retained 14 --output none; then
            log "SUCCESS" "Soft delete enabled for containers"
        else
            log "ERROR" "Failed to enable soft delete for containers"
        fi
    fi
    
    log "SUCCESS" "Security settings configured for account: $account_name"
    return 0
}

# Function to create a private endpoint for a storage account
create_private_endpoint() {
    local account_name=$1
    local resource_group=$2
    local vnet_name=$3
    local subnet_name=$4
    
    log "INFO" "Creating private endpoint for account: $account_name"
    
    # Verify account exists
    if ! az storage account show --name "$account_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Storage account not found: $account_name"
        return 1
    fi
    
    # Verify VNet exists
    if ! az network vnet show --name "$vnet_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "VNet not found: $vnet_name"
        return 1
    fi
    
    # Verify subnet exists
    if ! az network vnet subnet show --name "$subnet_name" --vnet-name "$vnet_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Subnet not found: $subnet_name in VNet $vnet_name"
        return 1
    fi
    
    # Check if private endpoint already exists
    local pe_name="${account_name}-pe"
    if az network private-endpoint show --name "$pe_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "WARNING" "Private endpoint already exists: $pe_name"
        return 0
    fi
    
    # Get storage account ID
    local account_id=$(az storage account show --name "$account_name" --resource-group "$resource_group" --query "id" -o tsv)
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "[DRY RUN] Would create private endpoint: $pe_name"
        return 0
    fi
    
    # Create private endpoint for blob service
    log "INFO" "Creating private endpoint for blob service..."
    
    if az network private-endpoint create \
        --resource-group "$resource_group" \
        --name "$pe_name-blob" \
        --vnet-name "$vnet_name" \
        --subnet "$subnet_name" \
        --private-connection-resource-id "$account_id" \
        --group-id "blob" \
        --connection-name "$account_name-blob-connection" \
        --output none; then
        
        log "SUCCESS" "Private endpoint created for blob service"
    else
        log "ERROR" "Failed to create private endpoint for blob service"
        return 1
    fi
    
    # Create private endpoint for file service if needed
    read -p "Create private endpoint for file service as well? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Creating private endpoint for file service..."
        
        if az network private-endpoint create \
            --resource-group "$resource_group" \
            --name "$pe_name-file" \
            --vnet-name "$vnet_name" \
            --subnet "$subnet_name" \
            --private-connection-resource-id "$account_id" \
            --group-id "file" \
            --connection-name "$account_name-file-connection" \
            --output none; then
            
            log "SUCCESS" "Private endpoint created for file service"
        else
            log "ERROR" "Failed to create private endpoint for file service"
        fi
    fi
    
    # Create DNS zone group for blob service
    log "INFO" "Creating private DNS zone group for blob service..."
    
    if az network private-endpoint dns-zone-group create \
        --resource-group "$resource_group" \
        --endpoint-name "$pe_name-blob" \
        --name "default" \
        --private-dns-zone "privatelink.blob.core.windows.net" \
        --zone-name "blob" \
        --output none; then
        
        log "SUCCESS" "DNS zone group created for blob service"
    else
        log "WARNING" "Failed to create DNS zone group for blob service"
    fi
    
    # Update storage account to disable public access if needed
    read -p "Disable public network access for this storage account? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Disabling public network access..."
        
        if az storage account update \
            --name "$account_name" \
            --resource-group "$resource_group" \
            --default-action Deny \
            --output none; then
            
            log "SUCCESS" "Public network access disabled"
        else
            log "ERROR" "Failed to disable public network access"
        fi
    fi
    
    log "SUCCESS" "Private endpoint setup completed for account: $account_name"
    return 0
}

# Function to create Key Vault and store storage access keys
setup_key_vault_storage() {
    local account_name=$1
    local resource_group=$2
    local key_vault_name=$3
    
    log "INFO" "Setting up Key Vault for storage account: $account_name"
    
    # Verify account exists
    if ! az storage account show --name "$account_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Storage account not found: $account_name"
        return 1
    fi
    
    # Create Key Vault if it doesn't exist
    if ! az keyvault show --name "$key_vault_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "INFO" "Creating Key Vault: $key_vault_name"
        
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "[DRY RUN] Would create Key Vault: $key_vault_name"
        else
            if az keyvault create \
                --name "$key_vault_name" \
                --resource-group "$resource_group" \
                --enable-rbac-authorization false \
                --sku standard \
                --output none; then
                
                log "SUCCESS" "Key Vault created: $key_vault_name"
            else
                log "ERROR" "Failed to create Key Vault"
                return 1
            fi
        fi
    else
        log "INFO" "Key Vault already exists: $key_vault_name"
    fi
    
    # Get storage account keys
    local keys=$(az storage account keys list --resource-group "$resource_group" --account-name "$account_name" -o json)
    local key1=$(echo "$keys" | jq -r '.[0].value')
    local key2=$(echo "$keys" | jq -r '.[1].value')
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "[DRY RUN] Would store storage account keys in Key Vault"
        return 0
    fi
    
    # Store keys in Key Vault
    log "INFO" "Storing storage account keys in Key Vault..."
    
    if az keyvault secret set \
        --vault-name "$key_vault_name" \
        --name "${account_name}-key1" \
        --value "$key1" \
        --output none; then
        
        log "SUCCESS" "Key 1 stored in Key Vault"
    else
        log "ERROR" "Failed to store key 1 in Key Vault"
    fi
    
    if az keyvault secret set \
        --vault-name "$key_vault_name" \
        --name "${account_name}-key2" \
        --value "$key2" \
        --output none; then
        
        log "SUCCESS" "Key 2 stored in Key Vault"
    else
        log "ERROR" "Failed to store key 2 in Key Vault"
    fi
    
    # Create a secret with the connection string
    local connection_string=$(az storage account show-connection-string \
        --name "$account_name" \
        --resource-group "$resource_group" \
        --query connectionString \
        --output tsv)
    
    if az keyvault secret set \
        --vault-name "$key_vault_name" \
        --name "${account_name}-connection-string" \
        --value "$connection_string" \
        --output none; then
        
        log "SUCCESS" "Connection string stored in Key Vault"
    else
        log "ERROR" "Failed to store connection string in Key Vault"
    fi
    
    # Create rotation policy for the keys
    log "INFO" "Setting up 90-day key rotation reminder..."
    
    # Get current date and add 90 days
    local expiry_date=$(date -d "+90 days" +"%Y-%m-%d")
    
    if az keyvault secret set-attributes \
        --vault-name "$key_vault_name" \
        --name "${account_name}-key1" \
        --expires "$expiry_date" \
        --output none; then
        
        log "SUCCESS" "Key rotation reminder set for key 1 (Expires: $expiry_date)"
    else
        log "ERROR" "Failed to set key rotation reminder for key 1"
    fi
    
    if az keyvault secret set-attributes \
        --vault-name "$key_vault_name" \
        --name "${account_name}-key2" \
        --expires "$expiry_date" \
        --output none; then
        
        log "SUCCESS" "Key rotation reminder set for key 2 (Expires: $expiry_date)"
    else
        log "ERROR" "Failed to set key rotation reminder for key 2"
    fi
    
    log "SUCCESS" "Key Vault setup completed for account: $account_name"
    
    # Output instructions for accessing keys
    echo ""
    echo "To access the storage account keys from Key Vault, use the following commands:"
    echo ""
    echo "# Get Key 1"
    echo "az keyvault secret show --vault-name $key_vault_name --name ${account_name}-key1 --query value -o tsv"
    echo ""
    echo "# Get Key 2"
    echo "az keyvault secret show --vault-name $key_vault_name --name ${account_name}-key2 --query value -o tsv"
    echo ""
    echo "# Get Connection String"
    echo "az keyvault secret show --vault-name $key_vault_name --name ${account_name}-connection-string --query value -o tsv"
    echo ""
    
    return 0
}

# Parse command line arguments
MODE="audit"
RESOURCE_GROUP=""
ACCOUNT_NAME=""
NETWORK_RULE=""
ENABLE_HTTPS=""
VNET_NAME=""
SUBNET_NAME=""
KEY_VAULT_NAME=""
PLAN_FILE=""
DRY_RUN="false"
VERBOSE="false"

while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -r|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -a|--account)
            ACCOUNT_NAME="$2"
            shift 2
            ;;
        -n|--network-rule)
            NETWORK_RULE="$2"
            shift 2
            ;;
        -e|--enable-https)
            ENABLE_HTTPS="true"
            shift
            ;;
        -v|--vnet)
            VNET_NAME="$2"
            shift 2
            ;;
        -s|--subnet)
            SUBNET_NAME="$2"
            shift 2
            ;;
        -k|--key-vault)
            KEY_VAULT_NAME="$2"
            shift 2
            ;;
        -f|--plan-file)
            PLAN_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate mode
if [ "$MODE" != "audit" ] && [ "$MODE" != "configure" ] && [ "$MODE" != "private-endpoint" ] && [ "$MODE" != "key-vault" ]; then
    log "ERROR" "Invalid mode: $MODE"
    log "INFO" "Valid modes: audit, configure, private-endpoint, key-vault"
    exit 1
fi

# Validate required parameters
if [ -z "$RESOURCE_GROUP" ]; then
    log "ERROR" "Resource group is required"
    exit 1
fi

if [ "$MODE" != "audit" ] && [ -z "$ACCOUNT_NAME" ]; then
    log "ERROR" "Storage account name is required for mode: $MODE"
    exit 1
fi

if [ "$MODE" = "private-endpoint" ] && ([ -z "$VNET_NAME" ] || [ -z "$SUBNET_NAME" ]); then
    log "ERROR" "VNet name and subnet name are required for private endpoint mode"
    exit 1
fi

if [ "$MODE" = "key-vault" ] && [ -z "$KEY_VAULT_NAME" ]; then
    log "ERROR" "Key Vault name is required for key-vault mode"
    exit 1
fi

# Verify Azure CLI
verify_azure_cli

# Execute requested mode
case "$MODE" in
    "audit")
        audit_security_settings "$RESOURCE_GROUP"
        ;;
    "configure")
        configure_security_settings "$ACCOUNT_NAME" "$RESOURCE_GROUP" "$NETWORK_RULE" "$ENABLE_HTTPS"
        ;;
    "private-endpoint")
        create_private_endpoint "$ACCOUNT_NAME" "$RESOURCE_GROUP" "$VNET_NAME" "$SUBNET_NAME"
        ;;
    "key-vault")
        setup_key_vault_storage "$ACCOUNT_NAME" "$RESOURCE_GROUP" "$KEY_VAULT_NAME"
        ;;
esac

exit 0