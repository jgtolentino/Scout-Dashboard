# Azure Resource Inventory for TBWA Project Scout

## Overview
This report provides a comprehensive inventory of all Azure resources in the TBWA-ProjectScout-Prod subscription. The resources are organized by type and resource group to give a clear picture of the environment.

## Resource Groups
| Name | Location |
|------|----------|
| RG-TBWA-ProjectScout-Data | eastus |
| RG-TBWA-ProjectScout-Compute | eastus |
| NetworkWatcherRG | eastus |
| ProjectScout-ResourceGroup | eastus |
| retail-dashboards-rg | eastus |
| ProjectScoutDashboards | westus2 |
| RG-Scout-BrandDetect-Prod-AUE | australiaeast |
| LanguageResourceGroup | australiaeast |
| RG-TBWA-ProjectScout-Juicer | eastus2 |
| databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5 | eastus2 |
| scout-dashboard | eastus2 |

## Resource Counts by Type
| Resource Type | Count |
|---------------|-------|
| Microsoft.Storage/storageAccounts | 10 |
| Microsoft.Sql/servers/databases | 6 |
| Microsoft.Web/staticSites | 4 |
| Microsoft.KeyVault/vaults | 4 |
| Microsoft.OperationalInsights/workspaces | 3 |
| Microsoft.Network/networkWatchers | 3 |
| Microsoft.ManagedIdentity/userAssignedIdentities | 3 |
| Microsoft.Insights/actiongroups | 3 |
| Microsoft.Sql/servers | 2 |
| Microsoft.Network/virtualNetworks | 2 |
| Microsoft.Network/publicIPAddresses | 2 |
| Microsoft.Network/networkSecurityGroups | 2 |
| Microsoft.MachineLearningServices/workspaces | 2 |
| Microsoft.Insights/components | 2 |
| Other resources | 13 |

## Storage Accounts
| Name | Resource Group | Location | Kind | SKU | Encryption |
|------|---------------|----------|------|-----|------------|
| mymlworkstorage89365eba1 | RG-TBWA-ProjectScout-Data | eastus | StorageV2 | Standard_LRS | True |
| mymlworkstoragef442bd96a | RG-Scout-BrandDetect-Prod-AUE | eastus | StorageV2 | Standard_LRS | True |
| projectscoutdata | RG-TBWA-ProjectScout-Data | eastus | StorageV2 | Standard_RAGRS | True |
| projectscoutstorage20250 | ProjectScout-ResourceGroup | eastus | StorageV2 | Standard_LRS | True |
| pscoutdash0513 | ProjectScout-ResourceGroup | eastus | StorageV2 | Standard_LRS | True |
| retailedgedash0513 | retail-dashboards-rg | eastus | StorageV2 | Standard_LRS | True |
| retailperfdash0513 | retail-dashboards-rg | eastus | StorageV2 | Standard_LRS | True |
| dbstoragehyx7ppequk63i | databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5 | eastus2 | StorageV2 | Standard_GRS | True |
| retailadvisorstore | RG-TBWA-ProjectScout-Juicer | eastus2 | StorageV2 | Standard_LRS | True |
| tbwajuicerstorage | RG-TBWA-ProjectScout-Juicer | eastus2 | StorageV2 | Standard_LRS | True |

## Compute Resources
### App Services
| Name | Resource Group | Location | App Service Plan | State |
|------|---------------|----------|------------------|-------|
| retail-advisor-app | RG-TBWA-ProjectScout-Juicer | East US 2 | AppServicePlan-RG-TBWA-ProjectScout-Juicer | Running |

### SQL Servers
| Name | Resource Group | Location |
|------|---------------|----------|
| sqltbwaprojectscoutserver | RG-TBWA-ProjectScout-Compute | australiaeast |
| tbwa-ces-model-server | RG-TBWA-ProjectScout-Data | australiaeast |

### Databricks Workspaces
| Name | Resource Group | Location | Tier |
|------|---------------|----------|------|
| tbwa-juicer-databricks | RG-TBWA-ProjectScout-Juicer | eastus2 | standard |

## ETL Pipeline Components

### Data Ingestion
| Service Type | Name | Resource Group | Location |
|--------------|------|---------------|----------|
| EventHub Namespace | EventHubs-TBWA-ProjectScout-Pi5-Prod | RG-TBWA-ProjectScout-Data | eastus |
| IoT Hub | Pi5 | (Not specified) | eastus |

### Data Processing
| Service Type | Name | Resource Group | Location |
|--------------|------|---------------|----------|
| Databricks Workspace | tbwa-juicer-databricks | RG-TBWA-ProjectScout-Juicer | eastus2 |
| Storage Account | tbwajuicerstorage | RG-TBWA-ProjectScout-Juicer | eastus2 |
| Storage Account | dbstoragehyx7ppequk63i | databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5 | eastus2 |

### Data Storage
| Service Type | Name | Resource Group | Location |
|--------------|------|---------------|----------|
| SQL Server | sqltbwaprojectscoutserver | RG-TBWA-ProjectScout-Compute | australiaeast |
| SQL Server | tbwa-ces-model-server | RG-TBWA-ProjectScout-Data | australiaeast |
| Storage Account | projectscoutdata | RG-TBWA-ProjectScout-Data | eastus |

### Data Visualization
| Service Type | Name | Resource Group | Location |
|--------------|------|---------------|----------|
| Static Site | ScoutDashboards | ProjectScoutDashboards | westus2 |
| Static Site | tbwa-juicer-insights-dashboard | RG-TBWA-ProjectScout-Juicer | eastasia |
| Static Site | scout-dashboard | RG-TBWA-ProjectScout-Juicer | eastus2 |
| Static Site | tbwa-client360-dashboard-production | scout-dashboard | eastus2 |
| Storage Account | pscoutdash0513 | ProjectScout-ResourceGroup | eastus |
| Storage Account | retailedgedash0513 | retail-dashboards-rg | eastus |
| Storage Account | retailperfdash0513 | retail-dashboards-rg | eastus |
| Storage Account | retailadvisorstore | RG-TBWA-ProjectScout-Juicer | eastus2 |

## End-to-End ETL Architecture

The TBWA Project Scout environment appears to have a comprehensive ETL architecture consisting of:

1. **Data Collection**: 
   - IoT Hub (Pi5) for device data collection
   - EventHub (EventHubs-TBWA-ProjectScout-Pi5-Prod) for event streaming

2. **Data Processing**:
   - Azure Databricks (tbwa-juicer-databricks) for data transformation and processing
   - Storage accounts for staging data between processing steps

3. **Data Storage**:
   - SQL Servers with multiple databases for structured data
   - Storage accounts with different redundancy levels for different data types

4. **Data Visualization**:
   - Multiple static web apps deployed in different regions
   - Client360 dashboard for unified data views

## Cost Optimization Recommendations

Based on the inventory, here are cost optimization opportunities:

1. **Storage Account Consolidation**: The environment has 10 storage accounts across different resource groups. Consider consolidating some of these where appropriate to reduce management overhead.

2. **Review Storage Redundancy**: Some storage accounts use GRS (Geo-Redundant Storage) which is more expensive. Evaluate whether this level of redundancy is required for all data.

3. **Regional Consolidation**: Resources are spread across multiple regions (eastus, eastus2, australiaeast, westus2, eastasia). Consider consolidating to fewer regions to reduce data transfer costs and simplify management.

4. **Right-size Databricks Cluster**: Review the Databricks workspace usage patterns and consider using auto-scaling clusters instead of fixed-size clusters.

5. **Implement Lifecycle Management**: For blob storage used in ETL processes, implement lifecycle management policies to automatically transition older data to cooler storage tiers.

## Security Enhancements

1. **Key Vault Utilization**: Ensure all 4 Key Vaults are being used to their full potential for secret management.

2. **Network Security**: Review the network security groups to ensure they have appropriate rules.

3. **SQL Server Security**: Review access policies and authentication methods for SQL Servers.

## Next Steps

1. Review the complete inventory and verify all resources are still needed
2. Analyze usage patterns for optimization opportunities
3. Implement recommended cost-saving measures
4. Document the full architecture in detail