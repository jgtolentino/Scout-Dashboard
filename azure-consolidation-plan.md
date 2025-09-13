# Azure Resource Consolidation Plan

## 🔒 CRITICAL RESOURCES TO RETAIN (Move to central-resources-rg)

### IoT Hubs (1)
- `ProjectScoutAutoRegHub` (ProjectScout-AutoReg-RG) → **RETAIN**

### Azure SQL Servers (3) + Databases (6)
- `sqltbwaprojectscoutserver` (RG-TBWA-ProjectScout-Compute) → **RETAIN**
- `scout-sql-server` (scout-dashboard-rg) → **RETAIN** 
- `sql-genie-server` (rg-databricks-genie-v2) → **RETAIN**

### ADLS Gen2 Storage Accounts (5)
- `dbstorage2frvvbjtz2gms` (databricks-rg-adsbot-ces-validator-databricks-awoh45hhbp4fw) → **RETAIN**
- `projectscoutbackupsadls` (ProjectScout-Backup-RG) → **RETAIN**
- `projectscoutdata` (RG-TBWA-ProjectScout-Data) → **RETAIN**
- `dbstoragehyx7ppequk63i` (databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5) → **RETAIN**
- `tbwajuicerstorage` (RG-TBWA-ProjectScout-Juicer) → **RETAIN**

### Key Vaults (6)
- `kv-projectscout-prod` (RG-TBWA-ProjectScout-Data) → **RETAIN**
- `ai-agency-secrets` (RG-TBWA-ProjectScout-Data) → **RETAIN**
- `kv-scout-tbwa-1750202017` (rg-scout-prod) → **RETAIN**
- `adsbot-ces-validator-kv` (adsbot-ces-validator-rg) → **RETAIN**
- `scout-analytics-vault` (scout-dashboard-rg) → **RETAIN**
- `kv-tbwa-juicer-insights2` (RG-TBWA-ProjectScout-Juicer) → **RETAIN**

## 🗑️ RESOURCES TO DELETE (After consolidation)

### Regular Storage Accounts (4) - No critical data
- `adsbot6rx46uxjg6k74` 
- `projectscoutautoregstr`
- `scoutanalytics1750085649`
- `scoutanalytics1750085799`

### Compute Resources (No persistent data)
- Web Apps (2): App Service plans, static sites
- Container Apps (1)
- Virtual Networks (3) 
- Network Security Groups (3)
- Public IP Addresses (2)
- NAT Gateways (1)
- Disks (1)

### Analytics/AI Resources
- Databricks workspaces (2)
- PostgreSQL flexible servers (2)
- Cognitive Services accounts (3)
- Log Analytics workspaces (4)
- Container Registry (1)
- Cosmos DB account (1)

### Monitoring Resources
- Action groups (4)
- Activity log alerts (1)
- Workbooks (1)

## 📋 RESOURCE GROUPS TO DELETE (After moving critical resources)

All 20 resource groups except `central-resources-rg`:
- RG-TBWA-ProjectScout-Data
- RG-TBWA-ProjectScout-Compute  
- NetworkWatcherRG
- ProjectScout-ResourceGroup
- DefaultResourceGroup-EUS
- ProjectScout-Restore-Temp
- ProjectScout-Backup-RG
- ProjectScout-AutoReg-RG
- Pulser
- scout-dashboard-rg
- scout-analytics-rg
- rg-scout-prod
- adsbot-ces-validator-rg
- databricks-rg-adsbot-ces-validator-databricks-awoh45hhbp4fw
- RG-Scout-BrandDetect-Prod-AUE
- LanguageResourceGroup
- RG-TBWA-ProjectScout-Juicer
- databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5
- rg-client-app
- rg-databricks-genie-v2

## ✅ RESULT
- **15 critical resources** preserved in `central-resources-rg`
- **All other resources** (50+) deleted
- **All data storage** safely retained
- **Significant cost savings** from removing unused compute/networking resources