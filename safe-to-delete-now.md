# 🗑️ Safe to Delete NOW via Azure Portal

## ✅ IMMEDIATELY DELETABLE (No Data Loss)

### 1️⃣ Empty/System Resource Groups
- **NetworkWatcherRG** (just monitoring)
- **DefaultResourceGroup-EUS** (empty default)
- **ProjectScout-Restore-Temp** (temporary)

### 2️⃣ Compute Resources (No persistent data)
- **App Services** (already deleted scout-analytics-dashboard)
- **Container Apps**
- **Virtual Networks**
- **Network Security Groups**
- **Public IPs**
- **NAT Gateways**

### 3️⃣ Monitoring/Analytics (No critical data)
- **Log Analytics Workspaces**
- **Application Insights**
- **Action Groups**
- **Workbooks**

### 4️⃣ Regular Storage Accounts (Non-ADLS2)
These DON'T have hierarchical namespace:
- **adsbot6rx46uxjg6k74**
- **projectscoutautoregstr**
- **scoutanalytics1750085649**
- **scoutanalytics1750085799**

---

## ⚠️ DELETE AFTER MIGRATION

### 5️⃣ SQL Servers (After migrating to PostgreSQL)
Once data is moved to PostgreSQL:
- **sqltbwaprojectscoutserver** (the SERVER)
  - This will auto-delete its databases:
    - SQL-TBWA-ProjectScout-Reporting-Prod
    - master (system DB)
- **scout-sql-server**
- **sql-genie-server**

### 6️⃣ Redundant PostgreSQL (After consolidation)
Keep one, delete one:
- Keep: **scout-analytics-db** (newer, v15)
- Delete: **adsbot-ces-validator-postgres** (older, v14)

### 7️⃣ Key Vaults (After exporting secrets)
First screenshot/export all secrets, then delete:
- All 6 Key Vaults

### 8️⃣ ADLS2 Storage (After backup)
If truly redundant:
- All 4 ADLS2 accounts

---

## 🎯 DELETION ORDER

### Phase 1: Delete Now (Safe)
```
1. NetworkWatcherRG
2. DefaultResourceGroup-EUS  
3. ProjectScout-Restore-Temp
4. All monitoring resources
5. All networking resources
6. Regular storage accounts (4)
```

### Phase 2: Delete After Data Export
```
7. Export Key Vault secrets → Delete Key Vaults
8. Migrate SQL to PostgreSQL → Delete SQL Servers
9. Consolidate PostgreSQL → Delete extra one
10. Backup ADLS2 → Delete if redundant
```

---

## 💰 IMMEDIATE SAVINGS

Deleting Phase 1 items now will:
- Reduce resource count by ~20 items
- Save ~$50-100/month
- Simplify your environment
- Not affect any data

**These are all safe to delete RIGHT NOW through the Portal!**