#!/bin/bash

# Storage Account Lifecycle Management Script v1.0
# This script sets up and manages Azure storage account lifecycle policies
# to optimize storage costs and implement data retention strategies

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
    echo "  -m, --mode MODE           Operation mode: audit, apply, template (default: audit)"
    echo "  -a, --account NAME        Storage account name"
    echo "  -r, --resource-group NAME Resource group name"
    echo "  -t, --template NAME       Template name (medallion|dashboard|logs|default)"
    echo "  -p, --policy-file FILE    Custom policy file for apply mode"
    echo "  -d, --days-hot NUM        Days to keep data in Hot tier (default varies by template)"
    echo "  -c, --days-cool NUM       Days to keep data in Cool tier (default varies by template)"
    echo "  -a, --days-archive NUM    Days to keep data in Archive tier (default varies by template)"
    echo "  -x, --days-delete NUM     Days until deletion (default varies by template)"
    echo "  --dry-run                 Show what would be done without actually doing it"
    echo "  --verbose                 Show more detailed output"
    echo ""
    echo "Examples:"
    echo "  $0 --mode audit --resource-group RG-TBWA-ProjectScout-Juicer"
    echo "  $0 --mode apply --account tbwajuicerstorage --resource-group RG-TBWA-ProjectScout-Juicer --template medallion"
    echo "  $0 --mode template --template dashboard > dashboard-lifecycle-policy.json"
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

# Function to audit lifecycle policies for storage accounts in a resource group
audit_lifecycle_policies() {
    local resource_group=$1
    
    log "INFO" "Auditing lifecycle policies for storage accounts in resource group: $resource_group"
    
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
    
    # Create summary output file
    local lifecycle_report=".storage-analysis/lifecycle-audit-$resource_group.md"
    
    echo "# Storage Account Lifecycle Management Audit for Resource Group: $resource_group" > "$lifecycle_report"
    echo "" >> "$lifecycle_report"
    echo "Audit Date: $(date)" >> "$lifecycle_report"
    echo "" >> "$lifecycle_report"
    
    local accounts_with_policy=0
    local accounts_without_policy=0
    
    # Loop through accounts and check lifecycle policies
    for account_name in $(jq -r '.[].name' "$accounts_output"); do
        log "INFO" "Checking lifecycle policy for account: $account_name"
        
        # Create section for this account
        echo "## Storage Account: $account_name" >> "$lifecycle_report"
        echo "" >> "$lifecycle_report"
        
        # Check if the account has a lifecycle policy
        local policy_output=""
        if policy_output=$(az storage account management-policy show --account-name "$account_name" --resource-group "$resource_group" -o json 2>/dev/null); then
            accounts_with_policy=$((accounts_with_policy+1))
            
            # Parse policy for details
            local rule_count=$(echo "$policy_output" | jq '.policy.rules | length')
            
            echo "**Policy Status:** :white_check_mark: Configured" >> "$lifecycle_report"
            echo "**Rule Count:** $rule_count rules defined" >> "$lifecycle_report"
            echo "" >> "$lifecycle_report"
            
            # Save policy to file for reference
            local policy_file=".storage-analysis/policy-$account_name.json"
            echo "$policy_output" > "$policy_file"
            
            # Analyze each rule
            echo "### Policy Rules" >> "$lifecycle_report"
            echo "" >> "$lifecycle_report"
            
            for i in $(seq 0 $((rule_count-1))); do
                local rule=$(echo "$policy_output" | jq -r ".policy.rules[$i]")
                local rule_name=$(echo "$rule" | jq -r '.name')
                local rule_type=$(echo "$rule" | jq -r '.type')
                local filter_blob_types=$(echo "$rule" | jq -r '.definition.filters.blobTypes[]' 2>/dev/null || echo "All")
                local filter_prefix_match=$(echo "$rule" | jq -r '.definition.filters.prefixMatch[]' 2>/dev/null || echo "None")
                
                echo "#### Rule: $rule_name" >> "$lifecycle_report"
                echo "- **Type:** $rule_type" >> "$lifecycle_report"
                echo "- **Blob Types:** $filter_blob_types" >> "$lifecycle_report"
                echo "- **Prefix Filters:** $filter_prefix_match" >> "$lifecycle_report"
                echo "- **Actions:**" >> "$lifecycle_report"
                
                # Check for tierToCool action
                local cool_days=$(echo "$rule" | jq -r '.definition.actions.tierToCool.daysAfterModificationGreaterThan' 2>/dev/null || echo "Not set")
                if [ "$cool_days" != "Not set" ] && [ "$cool_days" != "null" ]; then
                    echo "  - Move to Cool tier after $cool_days days" >> "$lifecycle_report"
                fi
                
                # Check for tierToArchive action
                local archive_days=$(echo "$rule" | jq -r '.definition.actions.tierToArchive.daysAfterModificationGreaterThan' 2>/dev/null || echo "Not set")
                if [ "$archive_days" != "Not set" ] && [ "$archive_days" != "null" ]; then
                    echo "  - Move to Archive tier after $archive_days days" >> "$lifecycle_report"
                fi
                
                # Check for delete action
                local delete_days=$(echo "$rule" | jq -r '.definition.actions.delete.daysAfterModificationGreaterThan' 2>/dev/null || echo "Not set")
                if [ "$delete_days" != "Not set" ] && [ "$delete_days" != "null" ]; then
                    echo "  - Delete after $delete_days days" >> "$lifecycle_report"
                fi
                
                # Check for snapshot delete action
                local snapshot_delete_days=$(echo "$rule" | jq -r '.definition.actions.deleteSnapshot.daysAfterCreationGreaterThan' 2>/dev/null || echo "Not set")
                if [ "$snapshot_delete_days" != "Not set" ] && [ "$snapshot_delete_days" != "null" ]; then
                    echo "  - Delete snapshots after $snapshot_delete_days days" >> "$lifecycle_report"
                fi
                
                # Check for version delete action
                local version_delete_days=$(echo "$rule" | jq -r '.definition.actions.deleteVersion.daysAfterCreationGreaterThan' 2>/dev/null || echo "Not set")
                if [ "$version_delete_days" != "Not set" ] && [ "$version_delete_days" != "null" ]; then
                    echo "  - Delete versions after $version_delete_days days" >> "$lifecycle_report"
                fi
                
                echo "" >> "$lifecycle_report"
            done
            
            # Analyze policy effectiveness
            echo "### Policy Analysis" >> "$lifecycle_report"
            echo "" >> "$lifecycle_report"
            
            local has_cool=false
            local has_archive=false
            local has_delete=false
            local has_prefixes=false
            
            # Check for various actions across all rules
            if echo "$policy_output" | jq -e '.policy.rules[].definition.actions.tierToCool' &>/dev/null; then
                has_cool=true
            fi
            
            if echo "$policy_output" | jq -e '.policy.rules[].definition.actions.tierToArchive' &>/dev/null; then
                has_archive=true
            fi
            
            if echo "$policy_output" | jq -e '.policy.rules[].definition.actions.delete' &>/dev/null; then
                has_delete=true
            fi
            
            if echo "$policy_output" | jq -e '.policy.rules[].definition.filters.prefixMatch' &>/dev/null; then
                has_prefixes=true
            fi
            
            # Analyze completeness
            if $has_cool && $has_archive && $has_delete; then
                echo "- :white_check_mark: **Complete Policy:** This policy includes tiering to Cool, Archive, and deletion rules" >> "$lifecycle_report"
            else
                echo "- :warning: **Incomplete Policy:** This policy is missing some lifecycle actions:" >> "$lifecycle_report"
                
                if ! $has_cool; then
                    echo "  - No rules to move data to Cool tier" >> "$lifecycle_report"
                fi
                
                if ! $has_archive; then
                    echo "  - No rules to move data to Archive tier" >> "$lifecycle_report"
                fi
                
                if ! $has_delete; then
                    echo "  - No rules to delete old data" >> "$lifecycle_report"
                fi
            fi
            
            # Check for container/prefix specificity
            if $has_prefixes; then
                echo "- :white_check_mark: **Container-Specific:** This policy has targeted rules for specific containers or blob prefixes" >> "$lifecycle_report"
            else
                echo "- :information_source: **General Policy:** This policy applies the same rules to all blobs. Consider creating container-specific rules for better granularity." >> "$lifecycle_report"
            fi
            
            # Recommendations
            echo "" >> "$lifecycle_report"
            echo "### Recommendations" >> "$lifecycle_report"
            echo "" >> "$lifecycle_report"
            
            if ! $has_cool && ! $has_archive && ! $has_delete; then
                echo "- :warning: **Critical:** Define a complete lifecycle management policy with tiering and deletion rules" >> "$lifecycle_report"
            elif ! $has_delete; then
                echo "- :warning: **Important:** Add deletion rules to prevent indefinite data accumulation" >> "$lifecycle_report"
            elif ! $has_archive; then
                echo "- :information_source: **Suggested:** Consider adding Archive tier rules for infrequently accessed data" >> "$lifecycle_report"
            else
                echo "- :white_check_mark: **Good:** This storage account has a well-defined lifecycle policy" >> "$lifecycle_report"
            fi
            
            if ! $has_prefixes; then
                echo "- :information_source: **Suggested:** Consider adding container-specific rules for finer control" >> "$lifecycle_report"
            fi
            
            echo "" >> "$lifecycle_report"
        else
            accounts_without_policy=$((accounts_without_policy+1))
            
            echo "**Policy Status:** :x: Not configured" >> "$lifecycle_report"
            echo "" >> "$lifecycle_report"
            
            # Check account kind and provide recommendations
            local account_info=$(jq -r '.[] | select(.name=="'"$account_name"'")' "$accounts_output")
            local account_kind=$(echo "$account_info" | jq -r '.kind')
            local account_sku=$(echo "$account_info" | jq -r '.sku.name')
            
            echo "### Recommendations" >> "$lifecycle_report"
            echo "" >> "$lifecycle_report"
            echo "- :warning: **Critical:** Implement a lifecycle management policy to optimize storage costs" >> "$lifecycle_report"
            
            if [ "$account_kind" = "BlobStorage" ] || [ "$account_kind" = "StorageV2" ]; then
                echo "- This is a $account_kind account with $account_sku redundancy, which supports tiered storage" >> "$lifecycle_report"
                
                # Recommend a template based on name patterns
                if [[ "$account_name" == *"juicer"* ]]; then
                    echo "- :information_source: Recommended Template: **Medallion**" >> "$lifecycle_report"
                    echo "  - Use a medallion architecture policy with tiering for bronze, silver, and gold data" >> "$lifecycle_report"
                    echo "  ```bash" >> "$lifecycle_report"
                    echo "  $0 --mode apply --account $account_name --resource-group $resource_group --template medallion" >> "$lifecycle_report"
                    echo "  ```" >> "$lifecycle_report"
                elif [[ "$account_name" == *"dash"* ]]; then
                    echo "- :information_source: Recommended Template: **Dashboard**" >> "$lifecycle_report"
                    echo "  - Use a conservative policy suitable for dashboard data" >> "$lifecycle_report"
                    echo "  ```bash" >> "$lifecycle_report"
                    echo "  $0 --mode apply --account $account_name --resource-group $resource_group --template dashboard" >> "$lifecycle_report"
                    echo "  ```" >> "$lifecycle_report"
                elif [[ "$account_name" == *"log"* ]]; then
                    echo "- :information_source: Recommended Template: **Logs**" >> "$lifecycle_report"
                    echo "  - Use an aggressive policy suitable for log data with shorter retention" >> "$lifecycle_report"
                    echo "  ```bash" >> "$lifecycle_report"
                    echo "  $0 --mode apply --account $account_name --resource-group $resource_group --template logs" >> "$lifecycle_report"
                    echo "  ```" >> "$lifecycle_report"
                else
                    echo "- :information_source: Recommended Template: **Default**" >> "$lifecycle_report"
                    echo "  - Use a standard policy with balanced retention times" >> "$lifecycle_report"
                    echo "  ```bash" >> "$lifecycle_report"
                    echo "  $0 --mode apply --account $account_name --resource-group $resource_group --template default" >> "$lifecycle_report"
                    echo "  ```" >> "$lifecycle_report"
                fi
            else
                echo "- Note: This is a $account_kind account which might have limited support for tiered storage" >> "$lifecycle_report"
            fi
            
            echo "" >> "$lifecycle_report"
        fi
    done
    
    # Add summary section
    echo "## Summary" >> "$lifecycle_report"
    echo "" >> "$lifecycle_report"
    echo "- **Total Storage Accounts:** $account_count" >> "$lifecycle_report"
    echo "- **Accounts with Lifecycle Policy:** $accounts_with_policy" >> "$lifecycle_report"
    echo "- **Accounts without Lifecycle Policy:** $accounts_without_policy" >> "$lifecycle_report"
    echo "" >> "$lifecycle_report"
    
    local coverage_percentage=$((accounts_with_policy * 100 / account_count))
    
    if [ $coverage_percentage -eq 100 ]; then
        echo "**Excellent!** All storage accounts have lifecycle policies configured." >> "$lifecycle_report"
    elif [ $coverage_percentage -ge 75 ]; then
        echo "**Good.** Most storage accounts have lifecycle policies. Consider adding policies to the remaining accounts." >> "$lifecycle_report"
    elif [ $coverage_percentage -ge 50 ]; then
        echo "**Fair.** About half of the storage accounts have lifecycle policies. Add policies to the remaining accounts to optimize costs." >> "$lifecycle_report"
    else
        echo "**Warning!** Most storage accounts are missing lifecycle policies. This could lead to unnecessary storage costs." >> "$lifecycle_report"
    fi
    
    echo "" >> "$lifecycle_report"
    echo "## Next Steps" >> "$lifecycle_report"
    echo "" >> "$lifecycle_report"
    echo "1. Review the recommendations for each storage account" >> "$lifecycle_report"
    echo "2. Apply appropriate lifecycle policies to accounts missing them" >> "$lifecycle_report"
    echo "3. Consider optimizing existing policies for better cost management" >> "$lifecycle_report"
    echo "4. Re-run this audit after making changes to verify improvements" >> "$lifecycle_report"
    
    log "SUCCESS" "Lifecycle audit completed. Report generated: $lifecycle_report"
    
    if [ "$VERBOSE" = "true" ]; then
        echo ""
        echo "Lifecycle Audit Summary:"
        cat "$lifecycle_report"
    fi
    
    return 0
}

# Function to generate a template lifecycle policy
generate_policy_template() {
    local template=$1
    local days_hot=$2
    local days_cool=$3
    local days_archive=$4
    local days_delete=$5
    
    log "INFO" "Generating template policy: $template"
    
    local template_file=""
    
    case "$template" in
        "medallion")
            # Default values for medallion template
            [ -z "$days_hot" ] && days_hot=30
            [ -z "$days_cool" ] && days_cool=60
            [ -z "$days_archive" ] && days_archive=180
            [ -z "$days_delete" ] && days_delete=730
            
            # Generate medallion architecture policy
            template_file=$(cat <<EOF
{
  "policy": {
    "rules": [
      {
        "name": "bronze-tier-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["bronze/", "bronze-data/", "bronze_data/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      },
      {
        "name": "silver-tier-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["silver/", "silver-data/", "silver_data/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 60 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
            "delete": { "daysAfterModificationGreaterThan": 545 }
          }
        }
      },
      {
        "name": "gold-tier-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["gold/", "gold-data/", "gold_data/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 90 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 365 },
            "delete": { "daysAfterModificationGreaterThan": $days_delete }
          }
        }
      },
      {
        "name": "platinum-tier-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["platinum/", "platinum-data/", "platinum_data/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 180 },
            "delete": { "daysAfterModificationGreaterThan": 730 }
          }
        }
      },
      {
        "name": "logs-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["logs/", "log-data/", "log_data/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 7 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 30 },
            "delete": { "daysAfterModificationGreaterThan": 90 }
          }
        }
      },
      {
        "name": "snapshots-cleanup",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "deleteSnapshot": { "daysAfterCreationGreaterThan": 30 }
          }
        }
      },
      {
        "name": "default-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_cool },
            "delete": { "daysAfterModificationGreaterThan": $days_delete }
          }
        }
      }
    ]
  }
}
EOF
)
            ;;
            
        "dashboard")
            # Default values for dashboard template
            [ -z "$days_hot" ] && days_hot=60
            [ -z "$days_cool" ] && days_cool=180
            [ -z "$days_archive" ] && days_archive=365
            [ -z "$days_delete" ] && days_delete=730
            
            # Generate dashboard policy
            template_file=$(cat <<EOF
{
  "policy": {
    "rules": [
      {
        "name": "dashboard-assets-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["assets/", "js/", "css/", "images/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_cool }
          }
        }
      },
      {
        "name": "dashboard-data-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["data/", "datasets/", "json/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 90 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
            "delete": { "daysAfterModificationGreaterThan": 545 }
          }
        }
      },
      {
        "name": "dashboard-archives-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["archives/", "backups/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 60 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      },
      {
        "name": "dashboard-thumbnails-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["thumbnails/", "previews/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 45 },
            "delete": { "daysAfterModificationGreaterThan": 180 }
          }
        }
      },
      {
        "name": "dashboard-logs-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["logs/", "analytics/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 15 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 45 },
            "delete": { "daysAfterModificationGreaterThan": 90 }
          }
        }
      },
      {
        "name": "snapshots-cleanup",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "deleteSnapshot": { "daysAfterCreationGreaterThan": 60 }
          }
        }
      },
      {
        "name": "default-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_archive },
            "delete": { "daysAfterModificationGreaterThan": $days_delete }
          }
        }
      }
    ]
  }
}
EOF
)
            ;;
            
        "logs")
            # Default values for logs template
            [ -z "$days_hot" ] && days_hot=7
            [ -z "$days_cool" ] && days_cool=30
            [ -z "$days_archive" ] && days_archive=60
            [ -z "$days_delete" ] && days_delete=90
            
            # Generate logs policy
            template_file=$(cat <<EOF
{
  "policy": {
    "rules": [
      {
        "name": "application-logs-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["app-logs/", "application/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_cool },
            "delete": { "daysAfterModificationGreaterThan": $days_delete }
          }
        }
      },
      {
        "name": "system-logs-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["system-logs/", "syslog/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 3 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 14 },
            "delete": { "daysAfterModificationGreaterThan": 60 }
          }
        }
      },
      {
        "name": "audit-logs-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["audit-logs/", "security/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 15 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 45 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      },
      {
        "name": "debug-logs-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["debug/", "diagnostics/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 1 },
            "delete": { "daysAfterModificationGreaterThan": 14 }
          }
        }
      },
      {
        "name": "snapshots-cleanup",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "deleteSnapshot": { "daysAfterCreationGreaterThan": 7 }
          }
        }
      },
      {
        "name": "default-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_cool },
            "delete": { "daysAfterModificationGreaterThan": $days_delete }
          }
        }
      }
    ]
  }
}
EOF
)
            ;;
            
        "default"|*)
            # Default values for default template
            [ -z "$days_hot" ] && days_hot=30
            [ -z "$days_cool" ] && days_cool=90
            [ -z "$days_archive" ] && days_archive=180
            [ -z "$days_delete" ] && days_delete=365
            
            # Generate default policy
            template_file=$(cat <<EOF
{
  "policy": {
    "rules": [
      {
        "name": "frequently-accessed-data",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["frequent/", "hot/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_archive }
          }
        }
      },
      {
        "name": "infrequently-accessed-data",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["infrequent/", "archive/"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": 14 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 45 },
            "delete": { "daysAfterModificationGreaterThan": 180 }
          }
        }
      },
      {
        "name": "temporary-data",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"],
            "prefixMatch": ["temp/", "temporary/"]
          },
          "actions": {
            "delete": { "daysAfterModificationGreaterThan": 30 }
          }
        }
      },
      {
        "name": "snapshots-cleanup",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "deleteSnapshot": { "daysAfterCreationGreaterThan": 30 }
          }
        }
      },
      {
        "name": "default-lifecycle",
        "type": "Lifecycle",
        "definition": {
          "filters": {
            "blobTypes": ["blockBlob"]
          },
          "actions": {
            "tierToCool": { "daysAfterModificationGreaterThan": $days_hot },
            "tierToArchive": { "daysAfterModificationGreaterThan": $days_cool },
            "delete": { "daysAfterModificationGreaterThan": $days_delete }
          }
        }
      }
    ]
  }
}
EOF
)
            ;;
    esac
    
    # Output the template file
    echo "$template_file"
    
    return 0
}

# Function to apply a lifecycle policy to a storage account
apply_lifecycle_policy() {
    local account_name=$1
    local resource_group=$2
    local template=$3
    local days_hot=$4
    local days_cool=$5
    local days_archive=$6
    local days_delete=$7
    local policy_file=$8
    
    log "INFO" "Applying lifecycle policy to account: $account_name"
    
    # Verify account exists
    if ! az storage account show --name "$account_name" --resource-group "$resource_group" --output none 2>/dev/null; then
        log "ERROR" "Storage account not found: $account_name"
        return 1
    fi
    
    # Create policy file path if using a template
    local policy_path=""
    
    if [ -n "$template" ]; then
        log "INFO" "Generating policy from template: $template"
        
        # Generate policy from template
        local policy_content=$(generate_policy_template "$template" "$days_hot" "$days_cool" "$days_archive" "$days_delete")
        
        # Create a temporary policy file
        policy_path=".storage-analysis/policy-$account_name-$template.json"
        mkdir -p ".storage-analysis"
        echo "$policy_content" > "$policy_path"
        
        log "INFO" "Template policy file generated: $policy_path"
    elif [ -n "$policy_file" ]; then
        # Verify custom policy file exists
        if [ ! -f "$policy_file" ]; then
            log "ERROR" "Policy file not found: $policy_file"
            return 1
        fi
        
        policy_path="$policy_file"
        log "INFO" "Using custom policy file: $policy_path"
    else
        log "ERROR" "Either a template or policy file must be specified"
        return 1
    fi
    
    # Apply policy to storage account
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "[DRY RUN] Would apply policy from $policy_path to account $account_name"
    else
        log "INFO" "Applying policy to account $account_name..."
        
        if az storage account management-policy create \
            --account-name "$account_name" \
            --resource-group "$resource_group" \
            --policy "@$policy_path" \
            --output none; then
            
            log "SUCCESS" "Lifecycle policy applied to account: $account_name"
            
            # Save a copy of the applied policy for reference
            local applied_policy=".storage-analysis/applied-policy-$account_name-$(date +"%Y%m%d%H%M%S").json"
            az storage account management-policy show \
                --account-name "$account_name" \
                --resource-group "$resource_group" \
                --output json > "$applied_policy"
            
            log "INFO" "Applied policy saved for reference: $applied_policy"
        else
            log "ERROR" "Failed to apply lifecycle policy"
            return 1
        fi
    fi
    
    return 0
}

# Parse command line arguments
MODE="audit"
RESOURCE_GROUP=""
ACCOUNT_NAME=""
TEMPLATE=""
POLICY_FILE=""
DAYS_HOT=""
DAYS_COOL=""
DAYS_ARCHIVE=""
DAYS_DELETE=""
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
        -t|--template)
            TEMPLATE="$2"
            shift 2
            ;;
        -p|--policy-file)
            POLICY_FILE="$2"
            shift 2
            ;;
        -d|--days-hot)
            DAYS_HOT="$2"
            shift 2
            ;;
        -c|--days-cool)
            DAYS_COOL="$2"
            shift 2
            ;;
        -a|--days-archive)
            DAYS_ARCHIVE="$2"
            shift 2
            ;;
        -x|--days-delete)
            DAYS_DELETE="$2"
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
if [ "$MODE" != "audit" ] && [ "$MODE" != "apply" ] && [ "$MODE" != "template" ]; then
    log "ERROR" "Invalid mode: $MODE"
    log "INFO" "Valid modes: audit, apply, template"
    exit 1
fi

# Validate required parameters
if [ "$MODE" = "audit" ] && [ -z "$RESOURCE_GROUP" ]; then
    log "ERROR" "Resource group is required for audit mode"
    exit 1
fi

if [ "$MODE" = "apply" ] && ([ -z "$ACCOUNT_NAME" ] || [ -z "$RESOURCE_GROUP" ] || ([ -z "$TEMPLATE" ] && [ -z "$POLICY_FILE" ])); then
    log "ERROR" "Account name, resource group, and either template or policy file are required for apply mode"
    exit 1
fi

if [ "$MODE" = "template" ] && [ -z "$TEMPLATE" ]; then
    log "ERROR" "Template name is required for template mode"
    exit 1
fi

# Validate template name
if [ -n "$TEMPLATE" ] && [ "$TEMPLATE" != "medallion" ] && [ "$TEMPLATE" != "dashboard" ] && [ "$TEMPLATE" != "logs" ] && [ "$TEMPLATE" != "default" ]; then
    log "ERROR" "Invalid template name: $TEMPLATE"
    log "INFO" "Valid templates: medallion, dashboard, logs, default"
    exit 1
fi

# Check for proper number formats
if [ -n "$DAYS_HOT" ] && ! [[ "$DAYS_HOT" =~ ^[0-9]+$ ]]; then
    log "ERROR" "Days hot must be a number"
    exit 1
fi

if [ -n "$DAYS_COOL" ] && ! [[ "$DAYS_COOL" =~ ^[0-9]+$ ]]; then
    log "ERROR" "Days cool must be a number"
    exit 1
fi

if [ -n "$DAYS_ARCHIVE" ] && ! [[ "$DAYS_ARCHIVE" =~ ^[0-9]+$ ]]; then
    log "ERROR" "Days archive must be a number"
    exit 1
fi

if [ -n "$DAYS_DELETE" ] && ! [[ "$DAYS_DELETE" =~ ^[0-9]+$ ]]; then
    log "ERROR" "Days delete must be a number"
    exit 1
fi

# Verify Azure CLI if needed
if [ "$MODE" != "template" ]; then
    verify_azure_cli
fi

# Execute requested mode
case "$MODE" in
    "audit")
        audit_lifecycle_policies "$RESOURCE_GROUP"
        ;;
    "apply")
        apply_lifecycle_policy "$ACCOUNT_NAME" "$RESOURCE_GROUP" "$TEMPLATE" "$DAYS_HOT" "$DAYS_COOL" "$DAYS_ARCHIVE" "$DAYS_DELETE" "$POLICY_FILE"
        ;;
    "template")
        # Output template to stdout
        generate_policy_template "$TEMPLATE" "$DAYS_HOT" "$DAYS_COOL" "$DAYS_ARCHIVE" "$DAYS_DELETE"
        ;;
esac

exit 0