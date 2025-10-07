# Storage Consolidation Project Guide

## Overview

This guide provides comprehensive instructions for the Azure Storage Consolidation project. The goal of this project is to consolidate multiple storage accounts, implement best practices for security and lifecycle management, and optimize costs across the InsightPulseAI environment.

## Table of Contents

1. [Project Goals](#project-goals)
2. [Scripts Overview](#scripts-overview)
3. [Prerequisites](#prerequisites)
4. [Storage Account Analysis](#storage-account-analysis)
5. [Migration and Consolidation](#migration-and-consolidation)
6. [Security Configuration](#security-configuration)
7. [Lifecycle Management](#lifecycle-management)
8. [Recommended Consolidation Plan](#recommended-consolidation-plan)
9. [Rollback Procedure](#rollback-procedure)
10. [Monitoring and Verification](#monitoring-and-verification)

## Project Goals

- **Cost Optimization**: Reduce storage costs through consolidation and proper tiering
- **Performance Improvement**: Optimize storage configuration for better performance
- **Security Enhancement**: Implement consistent security policies across all storage accounts
- **Lifecycle Management**: Apply standardized data lifecycle policies for all storage types
- **Operational Efficiency**: Reduce management overhead through standardization

## Scripts Overview

### 1. Storage Consolidation Script

The primary script for analyzing and consolidating storage accounts.

**File**: `scripts/storage-consolidation.sh`

**Modes**:
- `analyze`: Examine storage accounts in a resource group
- `plan`: Create a migration plan between two storage accounts
- `execute`: Execute a migration plan to consolidate accounts

**Features**:
- Storage account analysis
- Data migration planning
- Safe execution with validation
- Detailed reporting

### 2. Storage Security Script

Configure security settings for storage accounts.

**File**: `scripts/storage-security.sh`

**Modes**:
- `audit`: Audit security settings of storage accounts
- `configure`: Apply security configurations to an account
- `private-endpoint`: Create private endpoints for secure access
- `key-vault`: Set up Key Vault for storing access keys

**Features**:
- Security auditing and scoring
- Network access control configuration
- Private endpoint creation
- Key Vault integration

### 3. Storage Lifecycle Script

Implement data lifecycle management policies.

**File**: `scripts/storage-lifecycle.sh`

**Modes**:
- `audit`: Audit lifecycle policies of storage accounts
- `apply`: Apply lifecycle policy to an account
- `template`: Generate a policy template based on predefined patterns

**Templates**:
- `medallion`: For medallion architecture (bronze, silver, gold, platinum)
- `dashboard`: For dashboard-related storage (conservative policy)
- `logs`: For log data (aggressive tiering and retention)
- `default`: Standard balanced policy

## Prerequisites

Before starting the storage consolidation project, ensure you have:

1. **Azure CLI**: Latest version installed and configured
   ```bash
   az --version
   az login
   ```

2. **Required Permissions**:
   - Owner or Contributor role on the resource groups
   - Storage Account Contributor role on storage accounts
   - Network Contributor for private endpoint creation

3. **Azure Key Vault Access**: For secure key storage
   - Key Vault Administrator or Contributor role

4. **Working Directory**: For storing analysis and migration files
   ```bash
   mkdir -p storage-consolidation-project
   cd storage-consolidation-project
   ```

5. **Script Execution Rights**:
   ```bash
   chmod +x scripts/storage-consolidation.sh
   chmod +x scripts/storage-security.sh
   chmod +x scripts/storage-lifecycle.sh
   ```

## Storage Account Analysis

Start by analyzing existing storage accounts to identify consolidation opportunities:

```bash
# Analyze storage accounts in a resource group
./scripts/storage-consolidation.sh --mode analyze --resource-group RG-TBWA-ProjectScout-Juicer
```

This will generate a detailed report with:
- Account inventory and details
- Container mapping
- Size and usage analysis
- Consolidation recommendations

Complementary security and lifecycle analysis:

```bash
# Analyze security settings
./scripts/storage-security.sh --mode audit --resource-group RG-TBWA-ProjectScout-Juicer

# Analyze lifecycle policies
./scripts/storage-lifecycle.sh --mode audit --resource-group RG-TBWA-ProjectScout-Juicer
```

## Migration and Consolidation

Once you've identified accounts to consolidate, follow these steps:

### 1. Create a Migration Plan

```bash
# Create plan to consolidate retailedgedash0513 into tbwajuicerstorage
./scripts/storage-consolidation.sh --mode plan \
  --resource-group RG-TBWA-ProjectScout-Juicer \
  --source retailedgedash0513 \
  --destination tbwajuicerstorage
```

This generates a migration plan file with validation checks and action steps.

### 2. Review the Migration Plan

Examine the migration plan to ensure it correctly identifies:
- Containers to migrate
- Handling of duplicate container names
- Estimated data sizes
- Potential conflicts

### 3. Execute Migration

```bash
# Execute the migration plan
./scripts/storage-consolidation.sh --mode execute \
  --plan-file .storage-analysis/migration-plan-retailedgedash0513-to-tbwajuicerstorage.json
```

The migration process will:
1. Create containers in the destination account if needed
2. Copy blob data using AzCopy or Azure CLI
3. Copy configurations (lifecycle policies, security settings)
4. Generate a detailed migration report

### 4. Add the Source Account to Key Vault

After successful migration, store the access keys in Key Vault for reference:

```bash
./scripts/storage-security.sh --mode key-vault \
  --account retailedgedash0513 \
  --resource-group RG-TBWA-ProjectScout-Juicer \
  --key-vault kv-tbwa-juicer-insights2
```

## Security Configuration

After consolidation, apply consistent security settings to the destination accounts:

```bash
# Configure security settings with best practices
./scripts/storage-security.sh --mode configure \
  --account tbwajuicerstorage \
  --resource-group RG-TBWA-ProjectScout-Juicer \
  --enable-https \
  --network-rule denied
```

For sensitive data, create private endpoints:

```bash
# Set up private endpoint for secure access
./scripts/storage-security.sh --mode private-endpoint \
  --account tbwajuicerstorage \
  --resource-group RG-TBWA-ProjectScout-Juicer \
  --vnet tbwa-vnet \
  --subnet storage-subnet
```

Security configurations include:
- HTTPS-only traffic
- Minimum TLS version 1.2
- Network access rules
- Blob public access control
- Soft delete for blobs and containers

## Lifecycle Management

Apply appropriate lifecycle policies based on storage purpose:

### Medallion Architecture Pattern

For accounts following the medallion pattern (bronze → silver → gold → platinum):

```bash
# Apply medallion lifecycle policy
./scripts/storage-lifecycle.sh --mode apply \
  --account tbwajuicerstorage \
  --resource-group RG-TBWA-ProjectScout-Juicer \
  --template medallion
```

### Dashboard Data Pattern

For dashboard-related storage accounts:

```bash
# Apply dashboard lifecycle policy
./scripts/storage-lifecycle.sh --mode apply \
  --account retailadvisorstore \
  --resource-group RG-TBWA-ProjectScout-Juicer \
  --template dashboard
```

### Custom Retention Requirements

For special retention requirements:

```bash
# Apply custom lifecycle policy with specific retention times
./scripts/storage-lifecycle.sh --mode apply \
  --account projectscoutdata \
  --resource-group ProjectScout-ResourceGroup \
  --template default \
  --days-hot 45 \
  --days-cool 120 \
  --days-archive 365 \
  --days-delete 730
```

## Recommended Consolidation Plan

Based on our analysis of the existing environment, we recommend the following consolidation strategy:

### Phase 1: Dashboard Storage Consolidation

| Source Account | Destination Account | Resource Group | Priority |
|----------------|---------------------|----------------|----------|
| retailedgedash0513 | tbwajuicerstorage | RG-TBWA-ProjectScout-Juicer | High |
| retailperfdash0513 | tbwajuicerstorage | RG-TBWA-ProjectScout-Juicer | High |
| pscoutdash0513 | projectscoutdata | ProjectScout-ResourceGroup | Medium |

### Phase 2: Log Storage Consolidation

| Source Account | Destination Account | Resource Group | Priority |
|----------------|---------------------|----------------|----------|
| Various log containers across accounts | projectscout-logs | ProjectScout-ResourceGroup | Medium |

### Phase 3: Medallion Architecture Optimization

| Source Account | Destination Account | Resource Group | Priority |
|----------------|---------------------|----------------|----------|
| dbstoragehyx7ppequk63i | tbwajuicerstorage | RG-TBWA-ProjectScout-Juicer | Low |

## Rollback Procedure

If issues occur during migration, follow these rollback steps:

1. **Verify Original Data**: Ensure the source account data remains intact

2. **Revert Application Configuration**:
   ```bash
   # Example: Update application settings to point back to original storage
   az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP \
     --settings "STORAGE_ACCOUNT=retailedgedash0513"
   ```

3. **Document Rollback**:
   ```bash
   # Create rollback record with timestamp
   echo "Rollback performed on $(date)" > storage-migration-rollback-$(date +"%Y%m%d%H%M%S").log
   ```

## Monitoring and Verification

After consolidation, monitor the environment to ensure proper functioning:

### 1. Verify Data Integrity

Compare blob counts and checksums:

```bash
# Get source container blob count
az storage blob list --account-name sourceaccount --container-name mycontainer --query "length(@)" -o tsv

# Get destination container blob count
az storage blob list --account-name destinationaccount --container-name mycontainer --query "length(@)" -o tsv
```

### 2. Performance Monitoring

Track storage metrics for 1-2 weeks post-migration:

```bash
# Get storage account metrics
az monitor metrics list --resource $STORAGE_ACCOUNT_ID --metric "Transactions" --interval PT1H
```

### 3. Cost Analysis

Monitor storage costs to verify savings:

```bash
# Get cost analysis report
az costmanagement query --type Usage --timeperiod MonthToDate --dataset-aggregation total --dataset-grouping name=DimensionName value=ResourceType
```

### 4. Security Validation

Confirm security settings are properly applied:

```bash
# Verify security settings
./scripts/storage-security.sh --mode audit --resource-group RG-TBWA-ProjectScout-Juicer
```

## Conclusion

This storage consolidation project implements industry best practices for Azure storage management, ensuring cost-effective, secure, and properly governed data storage for the InsightPulseAI environment. Follow the procedures outlined in this guide to successfully consolidate your storage accounts and optimize your Azure environment.

---

**Project Contact**: TBWA InsightPulse AI Team  
**Last Updated**: May 19, 2025  
**Version**: 1.0