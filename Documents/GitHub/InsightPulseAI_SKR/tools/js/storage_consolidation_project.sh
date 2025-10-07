#!/bin/bash
# Storage Account Consolidation Project Implementation
# This script implements the storage account consolidation recommendations

echo "==== Storage Account Consolidation Project ===="
echo "Implementing the recommended storage account consolidations"
echo ""

# Create output directory
PROJECT_DIR="storage_consolidation_project_$(date +%Y%m%d)"
mkdir -p "$PROJECT_DIR"

# Log file
LOG_FILE="$PROJECT_DIR/consolidation_log.txt"
{
  echo "Storage Account Consolidation Project Log"
  echo "Date: $(date)"
  echo "=========================================="
  echo ""
} > "$LOG_FILE"

# Function to log steps
log_step() {
  local message="$1"
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $message" >> "$LOG_FILE"
}

# Function to create an AzCopy command file for copying data
create_azcopy_script() {
  local source_account="$1"
  local dest_account="$2"
  local script_file="$PROJECT_DIR/azcopy_${source_account}_to_${dest_account}.sh"
  
  cat > "$script_file" << EOF
#!/bin/bash
# AzCopy script to migrate data from $source_account to $dest_account

# 1. Get SAS tokens for source and destination (valid for 12 hours)
SOURCE_SAS=\$(az storage account generate-sas --account-name $source_account \\
  --permissions rl --resource-types co --services b --expiry \$(date -v+12H -u +%Y-%m-%dT%H:%MZ) -o tsv)

DEST_SAS=\$(az storage account generate-sas --account-name $dest_account \\
  --permissions wla --resource-types co --services b --expiry \$(date -v+12H -u +%Y-%m-%dT%H:%MZ) -o tsv)

# 2. List containers in source account
echo "Listing containers in $source_account..."
CONTAINERS=\$(az storage container list --account-name $source_account --sas-token "\$SOURCE_SAS" \\
  --query "[].name" -o tsv)

# 3. Copy each container
for CONTAINER in \$CONTAINERS; do
  echo "Creating container \$CONTAINER in destination account if it doesn't exist..."
  az storage container create --name "\$CONTAINER" --account-name $dest_account \\
    --sas-token "\$DEST_SAS" --fail-on-exist --output none || true
  
  echo "Copying container \$CONTAINER from $source_account to $dest_account..."
  azcopy copy \\
    "https://$source_account.blob.core.windows.net/\$CONTAINER?sv=2023-11-03&ss=b&srt=co&sp=rl&\$SOURCE_SAS" \\
    "https://$dest_account.blob.core.windows.net/\$CONTAINER?sv=2023-11-03&ss=b&srt=co&sp=wla&\$DEST_SAS" \\
    --recursive
done

echo "Migration of data from $source_account to $dest_account completed."
EOF

  chmod +x "$script_file"
  echo "Created AzCopy script: $script_file"
}

# Function to create a validation script
create_validation_script() {
  local source_account="$1"
  local dest_account="$2"
  local script_file="$PROJECT_DIR/validate_${source_account}_to_${dest_account}.sh"
  
  cat > "$script_file" << EOF
#!/bin/bash
# Validation script to compare blobs between $source_account and $dest_account

# 1. Get SAS tokens
SOURCE_SAS=\$(az storage account generate-sas --account-name $source_account \\
  --permissions r --resource-types co --services b --expiry \$(date -v+12H -u +%Y-%m-%dT%H:%MZ) -o tsv)

DEST_SAS=\$(az storage account generate-sas --account-name $dest_account \\
  --permissions r --resource-types co --services b --expiry \$(date -v+12H -u +%Y-%m-%dT%H:%MZ) -o tsv)

# 2. List containers in source account
echo "Listing containers in $source_account..."
CONTAINERS=\$(az storage container list --account-name $source_account --sas-token "\$SOURCE_SAS" \\
  --query "[].name" -o tsv)

# 3. Compare each container
for CONTAINER in \$CONTAINERS; do
  echo "Comparing container \$CONTAINER..."
  
  # Count blobs in source
  SOURCE_COUNT=\$(az storage blob list --account-name $source_account \\
    --container-name "\$CONTAINER" --sas-token "\$SOURCE_SAS" \\
    --query "length(@)" -o tsv)
  
  # Count blobs in destination
  DEST_COUNT=\$(az storage blob list --account-name $dest_account \\
    --container-name "\$CONTAINER" --sas-token "\$DEST_SAS" \\
    --query "length(@)" -o tsv)
  
  echo "Container \$CONTAINER: Source=$SOURCE_COUNT blobs, Destination=$DEST_COUNT blobs"
  
  if [ "\$SOURCE_COUNT" == "\$DEST_COUNT" ]; then
    echo "✓ Container \$CONTAINER validated successfully"
  else
    echo "✗ Container \$CONTAINER has different blob counts"
  fi
done

echo "Validation completed."
EOF

  chmod +x "$script_file"
  echo "Created validation script: $script_file"
}

# Function to generate application update instructions
generate_update_instructions() {
  local source_account="$1"
  local dest_account="$2"
  local instructions_file="$PROJECT_DIR/update_instructions_${source_account}.md"
  
  cat > "$instructions_file" << EOF
# Application Update Instructions

## Overview
This document provides instructions for updating application references from \`$source_account\` to \`$dest_account\` as part of the storage account consolidation project.

## Storage Account Reference Changes

Original Storage Account: \`$source_account\`
New Storage Account: \`$dest_account\`

## Steps to Update Applications

1. **Identify all applications using \`$source_account\`**:
   - Search for connection strings in code and configuration files
   - Look for hardcoded URLs with \`$source_account.blob.core.windows.net\`
   - Check application settings in App Services
   - Check deployment scripts and CI/CD pipelines

2. **Update connection strings**:
   ```
   # Old connection string
   DefaultEndpointsProtocol=https;AccountName=$source_account;...
   
   # New connection string
   DefaultEndpointsProtocol=https;AccountName=$dest_account;...
   ```

3. **Update URL references**:
   - Replace \`$source_account.blob.core.windows.net\` with \`$dest_account.blob.core.windows.net\`
   - Replace \`$source_account.file.core.windows.net\` with \`$dest_account.file.core.windows.net\`
   - Replace \`$source_account.table.core.windows.net\` with \`$dest_account.table.core.windows.net\`
   - Replace \`$source_account.queue.core.windows.net\` with \`$dest_account.queue.core.windows.net\`

4. **Update application settings**:
   ```bash
   # For App Services
   az webapp config appsettings set --name <app-name> --resource-group <resource-group> --settings "STORAGE_ACCOUNT=$dest_account"
   ```

5. **Update CI/CD pipelines**:
   - Update any Azure DevOps pipelines or GitHub Actions that reference \`$source_account\`
   - Update deployment scripts or templates

6. **Test thoroughly**:
   - Deploy changes to a test environment first
   - Verify all functionality that uses storage
   - Check for any errors or warnings related to storage

## Rollback Plan
If issues are encountered during the transition:

1. Revert code changes that reference \`$dest_account\`
2. Restore application settings to use \`$source_account\`
3. Report issues to the storage consolidation project team
EOF

  echo "Created application update instructions: $instructions_file"
}

# Create decommissioning plan template
cat > "$PROJECT_DIR/decommissioning_plan_template.md" << EOF
# Storage Account Decommissioning Plan

## Overview
This document outlines the plan to safely decommission the storage account after its data has been migrated to the consolidated storage account.

## Storage Account Details
- **Name**: [SOURCE_ACCOUNT]
- **Resource Group**: [RESOURCE_GROUP]
- **Consolidation Target**: [DEST_ACCOUNT]

## Prerequisites
- [ ] All data successfully migrated to [DEST_ACCOUNT]
- [ ] Validation scripts show 100% data consistency
- [ ] All applications updated to use [DEST_ACCOUNT]
- [ ] Applications verified in test/staging with new storage account
- [ ] Applications verified in production with new storage account
- [ ] Monitoring period of at least 1 week with no issues

## Decommissioning Steps

### 1. Preparation (1 week before decommissioning)
- [ ] Set storage account to read-only mode
  \`\`\`bash
  az storage account update --name [SOURCE_ACCOUNT] --resource-group [RESOURCE_GROUP] --allow-blob-public-access false
  \`\`\`
- [ ] Monitor for any failed operations or errors
- [ ] Verify no critical dependencies are broken

### 2. Create Final Backup (day of decommissioning)
- [ ] Generate a final backup of any critical containers
  \`\`\`bash
  azcopy copy "https://[SOURCE_ACCOUNT].blob.core.windows.net/container?SAS_TOKEN" "/path/to/backup/location"
  \`\`\`

### 3. Decommissioning (execution day)
- [ ] Generate storage account inventory for records
  \`\`\`bash
  az storage container list --account-name [SOURCE_ACCOUNT] --output json > [SOURCE_ACCOUNT]_container_inventory.json
  \`\`\`
- [ ] Delete storage account
  \`\`\`bash
  az storage account delete --name [SOURCE_ACCOUNT] --resource-group [RESOURCE_GROUP] --yes
  \`\`\`

### 4. Post-Decommissioning Verification
- [ ] Verify storage account no longer exists
- [ ] Verify applications continue to function with new storage account
- [ ] Update documentation to remove references to old storage account
- [ ] Notify stakeholders of successful decommissioning

## Rollback Plan
If issues are discovered after decommissioning but within the Azure recovery window (soft delete period):

1. Restore the storage account
  \`\`\`bash
  az storage account restore --deleted-account-name [SOURCE_ACCOUNT] --restore-location [LOCATION] --resource-group [RESOURCE_GROUP]
  \`\`\`
2. Update applications back to original storage account
3. Investigate and resolve issues with the consolidated storage account

## Timeline
- Preparation start date: [DATE]
- Validation period: [DATE] to [DATE]
- Decommissioning date: [DATE]
- Post-decommissioning monitoring: [DATE] to [DATE]
EOF

echo "Created decommissioning plan template"

# Implement the consolidation projects
log_step "Starting consolidation project implementation"

echo "=== Implementing Retail Dashboards Consolidation ===" | tee -a "$LOG_FILE"
echo "Consolidating 'retailperfdash0513' into 'retailedgedash0513'" | tee -a "$LOG_FILE"

# 1. Create AzCopy script for retail dashboards
create_azcopy_script "retailperfdash0513" "retailedgedash0513"
log_step "Created AzCopy script for retail dashboards consolidation"

# 2. Create validation script for retail dashboards
create_validation_script "retailperfdash0513" "retailedgedash0513"
log_step "Created validation script for retail dashboards consolidation"

# 3. Create application update instructions for retail dashboards
generate_update_instructions "retailperfdash0513" "retailedgedash0513"
log_step "Created application update instructions for retail dashboards consolidation"

# 4. Create decommissioning plan for retailperfdash0513
DECOM_PLAN="$PROJECT_DIR/decommissioning_plan_retailperfdash0513.md"
sed -e "s/\[SOURCE_ACCOUNT\]/retailperfdash0513/g" \
    -e "s/\[RESOURCE_GROUP\]/retail-dashboards-rg/g" \
    -e "s/\[DEST_ACCOUNT\]/retailedgedash0513/g" \
    -e "s/\[LOCATION\]/eastus/g" \
    "$PROJECT_DIR/decommissioning_plan_template.md" > "$DECOM_PLAN"
log_step "Created decommissioning plan for retailperfdash0513"

echo -e "\n=== Implementing Project Scout Storage Consolidation ===" | tee -a "$LOG_FILE"
echo "Consolidating 'pscoutdash0513' into 'projectscoutstorage20250'" | tee -a "$LOG_FILE"

# 1. Create AzCopy script for project scout storage
create_azcopy_script "pscoutdash0513" "projectscoutstorage20250"
log_step "Created AzCopy script for project scout storage consolidation"

# 2. Create validation script for project scout storage
create_validation_script "pscoutdash0513" "projectscoutstorage20250"
log_step "Created validation script for project scout storage consolidation"

# 3. Create application update instructions for project scout storage
generate_update_instructions "pscoutdash0513" "projectscoutstorage20250"
log_step "Created application update instructions for project scout storage consolidation"

# 4. Create decommissioning plan for pscoutdash0513
DECOM_PLAN="$PROJECT_DIR/decommissioning_plan_pscoutdash0513.md"
sed -e "s/\[SOURCE_ACCOUNT\]/pscoutdash0513/g" \
    -e "s/\[RESOURCE_GROUP\]/ProjectScout-ResourceGroup/g" \
    -e "s/\[DEST_ACCOUNT\]/projectscoutstorage20250/g" \
    -e "s/\[LOCATION\]/eastus/g" \
    "$PROJECT_DIR/decommissioning_plan_template.md" > "$DECOM_PLAN"
log_step "Created decommissioning plan for pscoutdash0513"

echo -e "\n=== Implementing Juicer Storage Analysis ===" | tee -a "$LOG_FILE"
echo "Creating analysis plan for 'retailadvisorstore' and 'tbwajuicerstorage'" | tee -a "$LOG_FILE"

# Create analysis plan for Juicer storage
ANALYSIS_PLAN="$PROJECT_DIR/juicer_storage_analysis_plan.md"
cat > "$ANALYSIS_PLAN" << EOF
# Juicer Storage Analysis Plan

## Overview
This document outlines the plan to analyze the 'retailadvisorstore' and 'tbwajuicerstorage' accounts to determine if consolidation is appropriate.

## Storage Accounts to Analyze
- **retailadvisorstore** (Resource Group: RG-TBWA-ProjectScout-Juicer)
- **tbwajuicerstorage** (Resource Group: RG-TBWA-ProjectScout-Juicer)

## Analysis Steps

### 1. Inventory Current Usage
- [ ] List all containers and their sizes in both storage accounts
  \`\`\`bash
  # For retailadvisorstore
  az storage container list --account-name retailadvisorstore --query "[].name" -o tsv > retailadvisorstore_containers.txt
  
  # For tbwajuicerstorage
  az storage container list --account-name tbwajuicerstorage --query "[].name" -o tsv > tbwajuicerstorage_containers.txt
  \`\`\`

- [ ] Compare container names to identify overlap or distinct purposes
  \`\`\`bash
  comm -12 <(sort retailadvisorstore_containers.txt) <(sort tbwajuicerstorage_containers.txt) > common_containers.txt
  comm -23 <(sort retailadvisorstore_containers.txt) <(sort tbwajuicerstorage_containers.txt) > retailadvisorstore_unique.txt
  comm -13 <(sort retailadvisorstore_containers.txt) <(sort tbwajuicerstorage_containers.txt) > tbwajuicerstorage_unique.txt
  \`\`\`

### 2. Analyze Access Patterns
- [ ] Review CORS settings in both accounts
  \`\`\`bash
  az storage cors list --account-name retailadvisorstore -o json > retailadvisorstore_cors.json
  az storage cors list --account-name tbwajuicerstorage -o json > tbwajuicerstorage_cors.json
  \`\`\`

- [ ] Review storage metrics to understand usage patterns
  \`\`\`bash
  # Analyze storage metrics for past 7 days
  az monitor metrics list --resource "/subscriptions/c03c092c-443c-4f25-9efe-33f092621251/resourceGroups/RG-TBWA-ProjectScout-Juicer/providers/Microsoft.Storage/storageAccounts/retailadvisorstore" --metric "Transactions" --interval PT1H --time-grain PT1H --start-time $(date -v-7d "+%Y-%m-%dT%H:%M:%SZ") --end-time $(date "+%Y-%m-%dT%H:%M:%SZ") -o json > retailadvisorstore_metrics.json
  
  az monitor metrics list --resource "/subscriptions/c03c092c-443c-4f25-9efe-33f092621251/resourceGroups/RG-TBWA-ProjectScout-Juicer/providers/Microsoft.Storage/storageAccounts/tbwajuicerstorage" --metric "Transactions" --interval PT1H --time-grain PT1H --start-time $(date -v-7d "+%Y-%m-%dT%H:%M:%SZ") --end-time $(date "+%Y-%m-%dT%H:%M:%SZ") -o json > tbwajuicerstorage_metrics.json
  \`\`\`

### 3. Identify Application Dependencies
- [ ] List all Azure services that access each storage account
  - Check App Services for connection strings
  - Check Function Apps for bindings
  - Check Logic Apps for connections
  - Review Azure DevOps pipelines for references

- [ ] Search codebase for direct references to storage accounts
  \`\`\`bash
  grep -r "retailadvisorstore" --include="*.js" --include="*.json" --include="*.html" /path/to/codebase > retailadvisorstore_code_refs.txt
  grep -r "tbwajuicerstorage" --include="*.js" --include="*.json" --include="*.html" /path/to/codebase > tbwajuicerstorage_code_refs.txt
  \`\`\`

### 4. Decision Matrix
Create a decision matrix with the following criteria:

| Criteria | Weight | retailadvisorstore | tbwajuicerstorage | Notes |
|----------|--------|--------------------|--------------------|-------|
| Storage size | 3 | | | |
| Access frequency | 4 | | | |
| Number of dependent apps | 5 | | | |
| Special configurations | 3 | | | |
| Data sensitivity | 4 | | | |
| Performance requirements | 3 | | | |

### 5. Recommendation Development
Based on the analysis, develop one of these recommendations:

1. **Full Consolidation**: Migrate all data from one account to the other and decommission
2. **Partial Consolidation**: Migrate specific containers and keep both accounts
3. **No Consolidation**: Keep accounts separate due to distinct purposes or dependencies

## Timeline
- Analysis start date: [DATE]
- Stakeholder review: [DATE]
- Recommendation delivery: [DATE]
- Implementation planning: [DATE]
EOF

log_step "Created Juicer storage analysis plan"

# Create redundancy optimization plan
REDUNDANCY_PLAN="$PROJECT_DIR/storage_redundancy_optimization_plan.md"
cat > "$REDUNDANCY_PLAN" << EOF
# Storage Redundancy Optimization Plan

## Overview
This document outlines the plan to optimize redundancy levels for storage accounts that may have excessive redundancy based on their purpose and criticality.

## Storage Accounts to Optimize

### 1. projectscoutdata (Standard_RAGRS → Standard_LRS)
- **Current SKU**: Standard_RAGRS (Geo-redundant with read access)
- **Resource Group**: RG-TBWA-ProjectScout-Data
- **Proposed SKU**: Standard_LRS (Locally redundant)

### 2. dbstoragehyx7ppequk63i (Standard_GRS → Standard_LRS)
- **Current SKU**: Standard_GRS (Geo-redundant)
- **Resource Group**: databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5
- **Proposed SKU**: Standard_LRS (Locally redundant)

## Risk Assessment

Before changing redundancy levels, assess the following risks:

1. **Data Criticality**
   - [ ] Is this data business critical?
   - [ ] Would loss of this data cause significant business impact?
   - [ ] Is this the only copy of the data or is it derived/processed data?

2. **Recovery Requirements**
   - [ ] What is the RTO (Recovery Time Objective) for this data?
   - [ ] What is the RPO (Recovery Point Objective) for this data?
   - [ ] Is regional failover capability required?

3. **Compliance Requirements**
   - [ ] Are there any compliance requirements mandating geo-redundancy?
   - [ ] Is this data subject to data residency requirements?

## Implementation Steps

### For projectscoutdata:

1. **Preparation**
   - [ ] Verify all critical data is backed up
   - [ ] Notify stakeholders of planned change
   - [ ] Schedule change during low-usage period

2. **Implementation**
   \`\`\`bash
   # Update storage account redundancy
   az storage account update --name projectscoutdata --resource-group RG-TBWA-ProjectScout-Data --sku Standard_LRS
   \`\`\`

3. **Verification**
   - [ ] Verify storage account is functioning correctly
   - [ ] Verify applications can still access the storage account
   - [ ] Monitor for any errors or issues

### For dbstoragehyx7ppequk63i:

1. **Preparation**
   - [ ] Coordinate with Databricks administrators
   - [ ] Determine if this is a Databricks-managed storage account
   - [ ] Back up any important data
   - [ ] Notify stakeholders of planned change
   - [ ] Schedule change during low-usage period

2. **Implementation**
   \`\`\`bash
   # Update storage account redundancy
   az storage account update --name dbstoragehyx7ppequk63i --resource-group databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5 --sku Standard_LRS
   \`\`\`

3. **Verification**
   - [ ] Verify Databricks workspace is functioning correctly
   - [ ] Monitor for any errors or issues
   - [ ] Verify clusters can still start and access data

## Cost Savings Analysis

| Storage Account | Current SKU | Proposed SKU | Monthly Cost Difference | Annual Savings |
|-----------------|------------|--------------|------------------------|---------------|
| projectscoutdata | Standard_RAGRS | Standard_LRS | ~50% reduction | \$XXX.XX |
| dbstoragehyx7ppequk63i | Standard_GRS | Standard_LRS | ~65% reduction | \$XXX.XX |

## Rollback Plan

If issues are encountered, follow these steps to revert:

1. **For projectscoutdata**:
   \`\`\`bash
   az storage account update --name projectscoutdata --resource-group RG-TBWA-ProjectScout-Data --sku Standard_RAGRS
   \`\`\`

2. **For dbstoragehyx7ppequk63i**:
   \`\`\`bash
   az storage account update --name dbstoragehyx7ppequk63i --resource-group databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5 --sku Standard_GRS
   \`\`\`

## Timeline
- Risk assessment completion: [DATE]
- Stakeholder approval: [DATE]
- Implementation date: [DATE]
- Post-implementation verification: [DATE]
EOF

log_step "Created storage redundancy optimization plan"

# Create project README
cat > "$PROJECT_DIR/README.md" << EOF
# Storage Account Consolidation Project

## Overview
This project implements the storage account consolidation recommendations from the Azure resource inventory. The goal is to reduce the number of storage accounts, optimize redundancy levels, and improve overall manageability of the storage resources.

## Consolidation Projects

### 1. Retail Dashboards Consolidation
- **Source**: retailperfdash0513
- **Target**: retailedgedash0513
- **Resource Group**: retail-dashboards-rg
- **Files**:
  - azcopy_retailperfdash0513_to_retailedgedash0513.sh
  - validate_retailperfdash0513_to_retailedgedash0513.sh
  - update_instructions_retailperfdash0513.md
  - decommissioning_plan_retailperfdash0513.md

### 2. Project Scout Storage Consolidation
- **Source**: pscoutdash0513
- **Target**: projectscoutstorage20250
- **Resource Group**: ProjectScout-ResourceGroup
- **Files**:
  - azcopy_pscoutdash0513_to_projectscoutstorage20250.sh
  - validate_pscoutdash0513_to_projectscoutstorage20250.sh
  - update_instructions_pscoutdash0513.md
  - decommissioning_plan_pscoutdash0513.md

### 3. Juicer Storage Analysis
- **Storage Accounts**: retailadvisorstore, tbwajuicerstorage
- **Resource Group**: RG-TBWA-ProjectScout-Juicer
- **Files**:
  - juicer_storage_analysis_plan.md

### 4. Storage Redundancy Optimization
- **Storage Accounts**: projectscoutdata, dbstoragehyx7ppequk63i
- **Files**:
  - storage_redundancy_optimization_plan.md

## Implementation Process

### Phase 1: Preparation and Analysis
1. Review the consolidation plan documents
2. Identify stakeholders for each consolidation project
3. Schedule implementation windows
4. Conduct the Juicer Storage Analysis

### Phase 2: Implementation
For each consolidation project:
1. Run the AzCopy script to migrate data
2. Run the validation script to ensure successful migration
3. Update application references using the provided instructions
4. Test applications thoroughly with the new storage account
5. Implement storage redundancy optimizations

### Phase 3: Decommissioning
After successful migration and verification:
1. Follow the decommissioning plan for each source storage account
2. Document the completion of each consolidation project
3. Monitor applications for any issues

## Project Timeline
- Project start: [DATE]
- Juicer Storage Analysis completion: [DATE]
- Retail Dashboards Consolidation: [DATE]
- Project Scout Storage Consolidation: [DATE]
- Storage Redundancy Optimization: [DATE]
- Project completion: [DATE]

## Contact
For questions or issues related to this project, contact the Cloud Infrastructure team.
EOF

log_step "Created project README"

echo -e "\n=== Storage Account Consolidation Project Implementation Complete ===" | tee -a "$LOG_FILE"
echo "All necessary scripts and plans have been created in the $PROJECT_DIR directory" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Next steps:" | tee -a "$LOG_FILE"
echo "1. Review the README.md file for project overview" | tee -a "$LOG_FILE"
echo "2. Start with the Juicer Storage Analysis to determine if those accounts should be consolidated" | tee -a "$LOG_FILE"
echo "3. Schedule and implement the Retail Dashboards and Project Scout Storage consolidations" | tee -a "$LOG_FILE"
echo "4. Review and implement the storage redundancy optimizations" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Implementation files are in: $PROJECT_DIR" | tee -a "$LOG_FILE"