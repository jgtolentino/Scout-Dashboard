#!/bin/bash

# Storage Account Consolidation Script v1.0
# This script implements Azure storage account consolidation, 
# migrating data between accounts and optimizing storage costs

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
    echo "  -m, --mode MODE           Operation mode: analyze, plan, execute (default: analyze)"
    echo "  -s, --source NAME         Source storage account name"
    echo "  -d, --destination NAME    Destination storage account name"
    echo "  -r, --resource-group NAME Resource group name"
    echo "  -c, --containers LIST     Comma-separated list of containers to migrate"
    echo "  -p, --plan-file FILE      JSON plan file for execution mode"
    echo "  -f, --force               Force operation without prompting"
    echo "  -n, --dry-run             Show what would be done without actually doing it"
    echo "  -v, --verbose             Show more detailed output"
    echo ""
    echo "Examples:"
    echo "  $0 --mode analyze --resource-group RG-TBWA-ProjectScout-Juicer"
    echo "  $0 --mode plan --resource-group RG-TBWA-ProjectScout-Juicer --source retailedgedash0513 --destination tbwajuicerstorage"
    echo "  $0 --mode execute --plan-file storage-migration-plan.json"
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

# Function to analyze all storage accounts in a resource group
analyze_storage_accounts() {
    local resource_group=$1
    
    log "INFO" "Analyzing storage accounts in resource group: $resource_group"
    
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
    
    # Analyze storage accounts
    log "INFO" "Found $account_count storage accounts in resource group: $resource_group"
    
    # Create summary output file
    local summary_output=".storage-analysis/analysis-summary-$resource_group.md"
    
    echo "# Storage Account Analysis for Resource Group: $resource_group" > "$summary_output"
    echo "" >> "$summary_output"
    echo "Analysis Date: $(date)" >> "$summary_output"
    echo "" >> "$summary_output"
    echo "## Storage Accounts Overview" >> "$summary_output"
    echo "" >> "$summary_output"
    echo "| Account Name | SKU | Kind | Location | Creation Date | Last Modified |" >> "$summary_output"
    echo "| ------------ | --- | ---- | -------- | ------------ | ------------- |" >> "$summary_output"
    
    # Loop through accounts and gather basic info
    for account_name in $(jq -r '.[].name' "$accounts_output"); do
        local account_info=$(jq -r '.[] | select(.name=="'"$account_name"'")' "$accounts_output")
        
        local sku=$(echo "$account_info" | jq -r '.sku.name')
        local kind=$(echo "$account_info" | jq -r '.kind')
        local location=$(echo "$account_info" | jq -r '.location')
        local creation_date=$(echo "$account_info" | jq -r '.creationTime // "Unknown"')
        local last_modified=$(echo "$account_info" | jq -r '.lastModifiedTime // "Unknown"')
        
        echo "| $account_name | $sku | $kind | $location | $creation_date | $last_modified |" >> "$summary_output"
        
        # Gather detailed information per account
        log "INFO" "Analyzing account: $account_name"
        
        # Get account key
        local account_key=$(az storage account keys list --resource-group "$resource_group" --account-name "$account_name" --query "[0].value" -o tsv)
        
        # List containers
        local containers_output=".storage-analysis/containers-$account_name.json"
        az storage container list --account-name "$account_name" --account-key "$account_key" -o json > "$containers_output"
        
        # Get container count and sizes
        local container_count=$(jq length "$containers_output")
        
        # Create detailed account section
        echo "" >> "$summary_output"
        echo "### $account_name Details" >> "$summary_output"
        echo "" >> "$summary_output"
        echo "- **Container Count:** $container_count" >> "$summary_output"
        echo "- **Containers:**" >> "$summary_output"
        
        # Loop through containers and calculate sizes
        for container_name in $(jq -r '.[].name' "$containers_output"); do
            echo "  - $container_name" >> "$summary_output"
            
            # Get blob count and sizes (Note: This might be slow for large containers)
            if [ "$VERBOSE" = "true" ]; then
                log "INFO" "Calculating size for container: $container_name in $account_name"
                local blob_count=$(az storage blob list --account-name "$account_name" --account-key "$account_key" --container-name "$container_name" --query "length([])" -o tsv || echo "Error")
                
                if [ "$blob_count" != "Error" ]; then
                    echo "    - Blob Count: $blob_count" >> "$summary_output"
                else
                    echo "    - Blob Count: Unable to retrieve" >> "$summary_output"
                fi
            fi
        done
        
        # Get lifecycle management policy if one exists
        local lifecycle_output=""
        lifecycle_output=$(az storage account management-policy show --account-name "$account_name" --resource-group "$resource_group" -o json 2>/dev/null || echo "")
        
        if [ -n "$lifecycle_output" ]; then
            echo "- **Lifecycle Policy:** Configured" >> "$summary_output"
            echo "  - Rules: $(echo "$lifecycle_output" | jq '.policy.rules | length') rules defined" >> "$summary_output"
        else
            echo "- **Lifecycle Policy:** Not configured" >> "$summary_output"
        fi
        
        # Check if static website is enabled
        local static_website=""
        static_website=$(az storage blob service-properties show --account-name "$account_name" --query "staticWebsite" -o json 2>/dev/null || echo "")
        
        if [ -n "$static_website" ] && [ "$(echo "$static_website" | jq -r '.enabled')" = "true" ]; then
            echo "- **Static Website:** Enabled" >> "$summary_output"
            echo "  - Index Document: $(echo "$static_website" | jq -r '.indexDocument')" >> "$summary_output"
            echo "  - Error Document: $(echo "$static_website" | jq -r '.errorDocument404Path')" >> "$summary_output"
        else
            echo "- **Static Website:** Not enabled" >> "$summary_output"
        fi
    done
    
    # Add consolidation recommendations
    echo "" >> "$summary_output"
    echo "## Consolidation Recommendations" >> "$summary_output"
    echo "" >> "$summary_output"
    
    # 1. Identify accounts with similar purposes
    echo "### Potential Consolidation Opportunities" >> "$summary_output"
    echo "" >> "$summary_output"
    
    # Look for dashboard accounts
    local dashboard_accounts=$(jq -r '.[] | select(.name | contains("dash")) | .name' "$accounts_output")
    if [ -n "$dashboard_accounts" ]; then
        echo "#### Dashboard Storage Accounts" >> "$summary_output"
        echo "" >> "$summary_output"
        echo "Consider consolidating these dashboard-related accounts:" >> "$summary_output"
        echo "$dashboard_accounts" | sed 's/^/- /' >> "$summary_output"
        echo "" >> "$summary_output"
    fi
    
    # Look for similarly named accounts
    local juicer_accounts=$(jq -r '.[] | select(.name | contains("juicer")) | .name' "$accounts_output")
    if [ -n "$juicer_accounts" ]; then
        echo "#### Juicer-related Storage Accounts" >> "$summary_output"
        echo "" >> "$summary_output"
        echo "Consider consolidating these Juicer-related accounts:" >> "$summary_output"
        echo "$juicer_accounts" | sed 's/^/- /' >> "$summary_output"
        echo "" >> "$summary_output"
    fi
    
    # 2. Identify cost optimization opportunities
    echo "### Cost Optimization Opportunities" >> "$summary_output"
    echo "" >> "$summary_output"
    
    # Check for GRS accounts that could be downgraded
    local grs_accounts=$(jq -r '.[] | select(.sku.name | contains("GRS")) | .name' "$accounts_output")
    if [ -n "$grs_accounts" ]; then
        echo "#### Redundancy Optimization" >> "$summary_output"
        echo "" >> "$summary_output"
        echo "Consider downgrading redundancy level for these accounts (GRS → LRS) for non-critical data:" >> "$summary_output"
        echo "$grs_accounts" | sed 's/^/- /' >> "$summary_output"
        echo "" >> "$summary_output"
    fi
    
    # Check for accounts without lifecycle management
    local accounts_without_lifecycle=""
    for account_name in $(jq -r '.[].name' "$accounts_output"); do
        local has_lifecycle=$(az storage account management-policy show --account-name "$account_name" --resource-group "$resource_group" -o none 2>/dev/null && echo "yes" || echo "no")
        
        if [ "$has_lifecycle" = "no" ]; then
            accounts_without_lifecycle+="$account_name"$'\n'
        fi
    done
    
    if [ -n "$accounts_without_lifecycle" ]; then
        echo "#### Lifecycle Management" >> "$summary_output"
        echo "" >> "$summary_output"
        echo "Implement lifecycle management policies for these accounts:" >> "$summary_output"
        echo "$accounts_without_lifecycle" | sort | uniq | sed '/^$/d' | sed 's/^/- /' >> "$summary_output"
        echo "" >> "$summary_output"
    fi
    
    # Add next steps
    echo "## Next Steps" >> "$summary_output"
    echo "" >> "$summary_output"
    echo "1. Review the consolidation recommendations above" >> "$summary_output"
    echo "2. Generate a consolidation plan with:" >> "$summary_output"
    echo "   ```bash" >> "$summary_output"
    echo "   $0 --mode plan --resource-group $resource_group --source SOURCE_ACCOUNT --destination DESTINATION_ACCOUNT" >> "$summary_output"
    echo "   ```" >> "$summary_output"
    echo "3. Execute the consolidation plan after review" >> "$summary_output"
    
    log "SUCCESS" "Analysis completed. Report generated: $summary_output"
    
    if [ "$VERBOSE" = "true" ]; then
        echo ""
        echo "Analysis Summary:"
        cat "$summary_output"
    fi
    
    return 0
}

# Function to create a migration plan between two storage accounts
create_migration_plan() {
    local resource_group=$1
    local source_account=$2
    local destination_account=$3
    local containers=$4
    
    log "INFO" "Creating migration plan for $source_account → $destination_account"
    
    # Create output directory if it doesn't exist
    mkdir -p ".storage-analysis"
    
    # Confirm source and destination accounts exist
    if ! az storage account show --name "$source_account" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Source storage account $source_account not found in resource group $resource_group"
        return 1
    fi
    
    if ! az storage account show --name "$destination_account" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Destination storage account $destination_account not found in resource group $resource_group"
        return 1
    fi
    
    # Get account keys
    local source_key=$(az storage account keys list --resource-group "$resource_group" --account-name "$source_account" --query "[0].value" -o tsv)
    local destination_key=$(az storage account keys list --resource-group "$resource_group" --account-name "$destination_account" --query "[0].value" -o tsv)
    
    # List containers in source
    local source_containers_output=".storage-analysis/containers-$source_account.json"
    az storage container list --account-name "$source_account" --account-key "$source_key" -o json > "$source_containers_output"
    
    # List containers in destination to check for conflicts
    local destination_containers_output=".storage-analysis/containers-$destination_account.json"
    az storage container list --account-name "$destination_account" --account-key "$destination_key" -o json > "$destination_containers_output"
    
    # Create migration plan
    local plan_file=".storage-analysis/migration-plan-$source_account-to-$destination_account.json"
    
    # Initialize JSON structure
    local plan_json=$(cat <<EOF
{
  "source": {
    "resourceGroup": "$resource_group",
    "accountName": "$source_account"
  },
  "destination": {
    "resourceGroup": "$resource_group",
    "accountName": "$destination_account"
  },
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "containers": []
}
EOF
)
    
    # Parse container list if specified
    local container_list=()
    if [ -n "$containers" ]; then
        IFS=',' read -ra container_list <<< "$containers"
    else
        # If no containers specified, use all in the source account
        container_list=($(jq -r '.[].name' "$source_containers_output"))
    fi
    
    # Generate container migration plan
    local destination_containers=($(jq -r '.[].name' "$destination_containers_output"))
    local containers_to_migrate="[]"
    
    for container in "${container_list[@]}"; do
        # Check if container exists in source
        if ! jq -e '.[] | select(.name=="'"$container"'")' "$source_containers_output" &>/dev/null; then
            log "WARNING" "Container $container not found in source account"
            continue
        fi
        
        # Check if container already exists in destination
        local container_exists=false
        for dest_container in "${destination_containers[@]}"; do
            if [ "$dest_container" = "$container" ]; then
                container_exists=true
                break
            fi
        done
        
        local container_json=$(cat <<EOF
{
  "name": "$container",
  "existsInDestination": $container_exists,
  "action": "$(if $container_exists; then echo "merge"; else echo "create"; fi)",
  "accessLevel": "$(jq -r '.[] | select(.name=="'"$container"'") | .properties.publicAccess' "$source_containers_output")",
  "estimatedSize": "Unknown",
  "blobCount": "Unknown",
  "metadata": {}
}
EOF
)
        
        containers_to_migrate=$(echo "$containers_to_migrate" | jq '. + ['"$container_json"']')
    done
    
    # Update plan with containers
    plan_json=$(echo "$plan_json" | jq '.containers = '"$containers_to_migrate")
    
    # Add recommendations
    plan_json=$(echo "$plan_json" | jq '. + {
      "recommendations": {
        "lifecyclePolicy": "copy",
        "staticWebsite": "copy",
        "deleteSourceAfterMigration": false,
        "redirectTraffic": true
      }
    }')
    
    # Write plan to file
    echo "$plan_json" | jq '.' > "$plan_file"
    
    log "SUCCESS" "Migration plan created: $plan_file"
    
    if [ "$VERBOSE" = "true" ]; then
        echo ""
        echo "Migration Plan Summary:"
        jq '.' "$plan_file"
    fi
    
    return 0
}

# Function to execute a migration plan
execute_migration_plan() {
    local plan_file=$1
    
    # Verify plan file exists
    if [ ! -f "$plan_file" ]; then
        log "ERROR" "Plan file not found: $plan_file"
        return 1
    fi
    
    log "INFO" "Executing migration plan: $plan_file"
    
    # Parse plan
    local source_resource_group=$(jq -r '.source.resourceGroup' "$plan_file")
    local source_account=$(jq -r '.source.accountName' "$plan_file")
    local destination_resource_group=$(jq -r '.destination.resourceGroup' "$plan_file")
    local destination_account=$(jq -r '.destination.accountName' "$plan_file")
    local container_count=$(jq '.containers | length' "$plan_file")
    
    log "INFO" "Plan: Migrate from $source_account to $destination_account"
    log "INFO" "Containers to process: $container_count"
    
    # Confirm accounts exist
    if ! az storage account show --name "$source_account" --resource-group "$source_resource_group" --output none 2>/dev/null; then
        log "ERROR" "Source storage account $source_account not found in resource group $source_resource_group"
        return 1
    fi
    
    if ! az storage account show --name "$destination_account" --resource-group "$destination_resource_group" --output none 2>/dev/null; then
        log "ERROR" "Destination storage account $destination_account not found in resource group $destination_resource_group"
        return 1
    fi
    
    # Get account keys
    local source_key=$(az storage account keys list --resource-group "$source_resource_group" --account-name "$source_account" --query "[0].value" -o tsv)
    local destination_key=$(az storage account keys list --resource-group "$destination_resource_group" --account-name "$destination_account" --query "[0].value" -o tsv)
    
    # Confirm execution
    if [ "$FORCE" != "true" ]; then
        echo ""
        echo "WARNING: You are about to migrate data between storage accounts."
        echo "This operation may take a long time and can potentially impact production systems."
        echo ""
        echo "Migration Details:"
        echo "Source:      $source_account ($source_resource_group)"
        echo "Destination: $destination_account ($destination_resource_group)"
        echo "Containers:  $container_count"
        echo ""
        
        read -p "Do you want to continue? (y/n) " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Migration cancelled."
            return 0
        fi
    fi
    
    # Create operation logs directory
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local log_dir=".storage-analysis/migration-logs-$timestamp"
    mkdir -p "$log_dir"
    
    # Initialize migration log
    local migration_log="$log_dir/migration.log"
    echo "Storage Account Migration Log" > "$migration_log"
    echo "Started: $(date)" >> "$migration_log"
    echo "Source: $source_account" >> "$migration_log"
    echo "Destination: $destination_account" >> "$migration_log"
    echo "" >> "$migration_log"
    
    # Process containers
    for i in $(seq 0 $((container_count-1))); do
        local container=$(jq -r ".containers[$i].name" "$plan_file")
        local action=$(jq -r ".containers[$i].action" "$plan_file")
        local exists_in_destination=$(jq -r ".containers[$i].existsInDestination" "$plan_file")
        local access_level=$(jq -r ".containers[$i].accessLevel" "$plan_file")
        
        log "INFO" "Processing container [$((i+1))/$container_count]: $container (Action: $action)"
        echo "## Container: $container" >> "$migration_log"
        echo "Action: $action" >> "$migration_log"
        
        # If dry run, skip actual operations
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "[DRY RUN] Would migrate container: $container"
            echo "[DRY RUN] Would migrate container" >> "$migration_log"
            continue
        fi
        
        # Create container in destination if it doesn't exist
        if [ "$exists_in_destination" = "false" ]; then
            log "INFO" "Creating container in destination: $container"
            
            # Convert access level to az CLI parameter
            local access_param="off"
            if [ "$access_level" = "container" ]; then
                access_param="container"
            elif [ "$access_level" = "blob" ]; then
                access_param="blob"
            fi
            
            # Create the container
            if az storage container create --name "$container" --account-name "$destination_account" --account-key "$destination_key" --public-access "$access_param" --output none; then
                log "SUCCESS" "Container created: $container"
                echo "Created container with public-access: $access_level" >> "$migration_log"
            else
                log "ERROR" "Failed to create container: $container"
                echo "ERROR: Failed to create container" >> "$migration_log"
                continue
            fi
        else
            log "INFO" "Container already exists in destination: $container"
            echo "Container already exists in destination" >> "$migration_log"
        fi
        
        # Copy blobs from source to destination
        log "INFO" "Copying blobs for container: $container"
        echo "Copying blobs..." >> "$migration_log"
        
        # Create SAS tokens for the copy operation
        local end_time=$(date -u -d "1 hour" '+%Y-%m-%dT%H:%MZ')
        local source_sas=$(az storage container generate-sas --name "$container" --account-name "$source_account" --account-key "$source_key" --permissions r --expiry "$end_time" --https-only --output tsv)
        
        # Use azcopy for efficient data transfer
        if command_exists azcopy; then
            log "INFO" "Using azcopy for data transfer"
            
            # Generate source URL with SAS token
            local source_url="https://$source_account.blob.core.windows.net/$container?$source_sas"
            local dest_url="https://$destination_account.blob.core.windows.net/$container"
            
            # Generate SAS token for destination
            local dest_sas=$(az storage container generate-sas --name "$container" --account-name "$destination_account" --account-key "$destination_key" --permissions rwl --expiry "$end_time" --https-only --output tsv)
            dest_url="$dest_url?$dest_sas"
            
            # Run azcopy
            local azcopy_log="$log_dir/azcopy-$container.log"
            if azcopy copy "$source_url" "$dest_url" --recursive > "$azcopy_log" 2>&1; then
                log "SUCCESS" "Blob copy completed for container: $container"
                echo "AzCopy completed successfully" >> "$migration_log"
            else
                log "ERROR" "Blob copy failed for container: $container"
                echo "ERROR: AzCopy failed. See log: $azcopy_log" >> "$migration_log"
                continue
            fi
        else
            log "WARNING" "AzCopy not found, using Azure CLI for data transfer (slower)"
            echo "Using Azure CLI for data transfer" >> "$migration_log"
            
            # List blobs in source container
            local blob_list="$log_dir/blobs-$container.json"
            az storage blob list --container-name "$container" --account-name "$source_account" --account-key "$source_key" -o json > "$blob_list"
            
            local blob_count=$(jq length "$blob_list")
            log "INFO" "Found $blob_count blobs to copy in container: $container"
            echo "Found $blob_count blobs to copy" >> "$migration_log"
            
            # Copy each blob
            for j in $(seq 0 $((blob_count-1))); do
                local blob_name=$(jq -r ".[$j].name" "$blob_list")
                local blob_size=$(jq -r ".[$j].properties.contentLength" "$blob_list")
                
                # Generate source URL with SAS token
                local blob_url="https://$source_account.blob.core.windows.net/$container/$blob_name?$source_sas"
                
                # Copy blob
                log "INFO" "Copying blob [$((j+1))/$blob_count]: $blob_name ($blob_size bytes)"
                
                if az storage blob copy start --source-uri "$blob_url" --destination-container "$container" --destination-blob "$blob_name" --account-name "$destination_account" --account-key "$destination_key" --output none; then
                    echo "Started copy of: $blob_name" >> "$migration_log"
                else
                    log "ERROR" "Failed to start copy for blob: $blob_name"
                    echo "ERROR: Failed to start copy for: $blob_name" >> "$migration_log"
                fi
                
                # Don't overwhelm the system with too many parallel copies
                if (( j % 10 == 0 )) && (( j > 0 )); then
                    log "INFO" "Pausing briefly to avoid throttling..."
                    sleep 2
                fi
            done
            
            log "INFO" "All blob copies initiated for container: $container"
            echo "All blob copies initiated" >> "$migration_log"
        fi
        
        echo "" >> "$migration_log"
    done
    
    # Copy configuration if requested
    if [ "$(jq -r '.recommendations.lifecyclePolicy' "$plan_file")" = "copy" ]; then
        log "INFO" "Copying lifecycle policy from source to destination"
        
        # Get the source lifecycle policy
        local lifecycle_policy=""
        lifecycle_policy=$(az storage account management-policy show --account-name "$source_account" --resource-group "$source_resource_group" -o json 2>/dev/null || echo "")
        
        if [ -n "$lifecycle_policy" ]; then
            # Save policy to file
            local policy_file="$log_dir/lifecycle-policy.json"
            echo "$lifecycle_policy" > "$policy_file"
            
            if [ "$DRY_RUN" != "true" ]; then
                # Apply to destination
                if az storage account management-policy create --account-name "$destination_account" --resource-group "$destination_resource_group" --policy "$policy_file" --output none; then
                    log "SUCCESS" "Lifecycle policy copied to destination"
                    echo "Lifecycle policy copied successfully" >> "$migration_log"
                else
                    log "ERROR" "Failed to copy lifecycle policy"
                    echo "ERROR: Failed to copy lifecycle policy" >> "$migration_log"
                fi
            else
                log "INFO" "[DRY RUN] Would copy lifecycle policy"
                echo "[DRY RUN] Would copy lifecycle policy" >> "$migration_log"
            fi
        else
            log "INFO" "No lifecycle policy found on source account"
            echo "No lifecycle policy found on source account" >> "$migration_log"
        fi
    fi
    
    # Copy static website configuration if requested
    if [ "$(jq -r '.recommendations.staticWebsite' "$plan_file")" = "copy" ]; then
        log "INFO" "Copying static website configuration from source to destination"
        
        # Get the source static website config
        local website_config=""
        website_config=$(az storage blob service-properties show --account-name "$source_account" --query "staticWebsite" -o json 2>/dev/null || echo "")
        
        if [ -n "$website_config" ] && [ "$(echo "$website_config" | jq -r '.enabled')" = "true" ]; then
            local index_document=$(echo "$website_config" | jq -r '.indexDocument')
            local error_document=$(echo "$website_config" | jq -r '.errorDocument404Path')
            
            if [ "$DRY_RUN" != "true" ]; then
                # Apply to destination
                if az storage blob service-properties update --account-name "$destination_account" --account-key "$destination_key" --static-website --index-document "$index_document" --error-document404-path "$error_document" --output none; then
                    log "SUCCESS" "Static website configuration copied to destination"
                    echo "Static website configuration copied successfully" >> "$migration_log"
                else
                    log "ERROR" "Failed to copy static website configuration"
                    echo "ERROR: Failed to copy static website configuration" >> "$migration_log"
                fi
            else
                log "INFO" "[DRY RUN] Would copy static website configuration"
                echo "[DRY RUN] Would copy static website configuration" >> "$migration_log"
            fi
        else
            log "INFO" "No static website configuration found on source account"
            echo "No static website configuration found on source account" >> "$migration_log"
        fi
    fi
    
    # Finalize log
    echo "" >> "$migration_log"
    echo "Migration Completed: $(date)" >> "$migration_log"
    echo "Next Steps:" >> "$migration_log"
    echo "1. Verify data integrity in the destination account" >> "$migration_log"
    echo "2. Update application configurations to point to the new storage account" >> "$migration_log"
    if [ "$(jq -r '.recommendations.deleteSourceAfterMigration' "$plan_file")" = "true" ]; then
        echo "3. After verification, consider deleting the source account to save costs" >> "$migration_log"
    fi
    
    log "SUCCESS" "Migration execution completed. Log: $migration_log"
    return 0
}

# Parse command line arguments
MODE="analyze"
RESOURCE_GROUP=""
SOURCE_ACCOUNT=""
DESTINATION_ACCOUNT=""
CONTAINERS=""
PLAN_FILE=""
FORCE="false"
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
        -s|--source)
            SOURCE_ACCOUNT="$2"
            shift 2
            ;;
        -d|--destination)
            DESTINATION_ACCOUNT="$2"
            shift 2
            ;;
        -c|--containers)
            CONTAINERS="$2"
            shift 2
            ;;
        -p|--plan-file)
            PLAN_FILE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE="true"
            shift
            ;;
        -n|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        -v|--verbose)
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
if [ "$MODE" != "analyze" ] && [ "$MODE" != "plan" ] && [ "$MODE" != "execute" ]; then
    log "ERROR" "Invalid mode: $MODE"
    log "INFO" "Valid modes: analyze, plan, execute"
    exit 1
fi

# Validate required parameters
if [ "$MODE" = "analyze" ] && [ -z "$RESOURCE_GROUP" ]; then
    log "ERROR" "Resource group is required for analyze mode"
    exit 1
fi

if [ "$MODE" = "plan" ] && ([ -z "$RESOURCE_GROUP" ] || [ -z "$SOURCE_ACCOUNT" ] || [ -z "$DESTINATION_ACCOUNT" ]); then
    log "ERROR" "Resource group, source account, and destination account are required for plan mode"
    exit 1
fi

if [ "$MODE" = "execute" ] && [ -z "$PLAN_FILE" ]; then
    log "ERROR" "Plan file is required for execute mode"
    exit 1
fi

# Verify Azure CLI
verify_azure_cli

# Execute requested mode
case "$MODE" in
    "analyze")
        analyze_storage_accounts "$RESOURCE_GROUP"
        ;;
    "plan")
        create_migration_plan "$RESOURCE_GROUP" "$SOURCE_ACCOUNT" "$DESTINATION_ACCOUNT" "$CONTAINERS"
        ;;
    "execute")
        execute_migration_plan "$PLAN_FILE"
        ;;
esac

exit 0