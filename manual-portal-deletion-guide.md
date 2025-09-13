# Manual Azure Portal Deletion Guide

## ✅ YES - You Can Delete Through Portal!

Even with a disabled subscription, the Azure Portal often allows **deletion** operations (just not creation/modification).

## 🖱️ Step-by-Step Portal Deletion

### 1️⃣ Access Azure Portal
1. Go to https://portal.azure.com
2. Sign in with your credentials

### 2️⃣ Delete Resource Groups (Easiest Method)
1. Navigate to **Resource Groups**
2. For each resource group:
   - Click on the resource group name
   - Click **Delete resource group** button (top menu)
   - Type the resource group name to confirm
   - Click **Delete**

**Resource Groups to Delete:**
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

### 3️⃣ Alternative: Delete Individual Resources
If resource group deletion fails:

1. **SQL Databases**
   - All Resources → Filter by "SQL database"
   - Select all → Delete

2. **Storage Accounts**
   - All Resources → Filter by "Storage account"
   - Select all → Delete

3. **Key Vaults**
   - All Resources → Filter by "Key vault"
   - Select all → Delete

### 4️⃣ Bulk Deletion Shortcut
1. Go to **All Resources**
2. Use filters:
   - Subscription: "TBWA-ProjectScout-Prod"
   - Resource type: (select types to delete)
3. **Select all** checkbox
4. Click **Delete** button
5. Confirm deletion

## ⚠️ IMPORTANT NOTES

### What Works in Disabled Subscription:
- ✅ **Delete** operations (usually)
- ✅ **View** resources
- ✅ **Export** data
- ✅ **Download** configurations

### What Doesn't Work:
- ❌ Create new resources
- ❌ Modify existing resources
- ❌ Start/stop services
- ❌ Generate new keys

### Portal Deletion Advantages:
1. **Visual confirmation** of what you're deleting
2. **Bulk selection** capabilities
3. **No CLI access needed**
4. **Works with disabled subscriptions** (usually)

## 🎯 Deletion Strategy

### Phase 1: Export Critical Data
Before deleting through portal:
1. **Download** any important files from Storage Accounts
2. **Copy** Key Vault secrets (view and save manually)
3. **Export** database schemas if needed

### Phase 2: Delete Non-Critical First
1. Delete empty resource groups
2. Delete test/dev resources
3. Delete networking resources

### Phase 3: Delete Storage Last
1. Verify backups complete
2. Delete storage accounts
3. Delete key vaults

## 💡 Portal Tips

### Speed Up Deletion:
1. Open multiple browser tabs
2. Start deletion on different resource groups simultaneously
3. Deletions run in background

### If "Delete" is Grayed Out:
- Resource may have dependencies
- Delete child resources first
- Try deleting the parent resource group instead

### Track Progress:
- Azure Portal → Notifications (bell icon)
- Shows deletion progress
- Confirms when complete

## 🔐 Before You Delete

**Manual Backup Checklist:**
- [ ] Screenshot all Key Vault secrets
- [ ] Download critical files from Storage
- [ ] Export database connection strings
- [ ] Save any custom configurations

## 🚨 Final Warning

Once deleted through portal:
- Resources are gone immediately
- No recovery possible
- Billing stops for deleted resources

**Deletion is permanent even in disabled subscriptions!**