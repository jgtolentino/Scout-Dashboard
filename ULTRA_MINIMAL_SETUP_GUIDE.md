# 🚀 Ultra-Minimal Azure Setup Guide - $33/month

## ⚠️ PREREQUISITES
**Your subscription is currently DISABLED. You must re-enable it first:**
1. Go to Azure Portal → Subscriptions
2. Select "TBWA-ProjectScout-Prod"
3. Resolve billing issues
4. Wait for "Enabled" status

## 📋 QUICK SETUP (Once Enabled)

### Option 1: Automated Script
```bash
./ultra-minimal-azure-setup.sh
```

### Option 2: Manual Steps

#### 1️⃣ Create PostgreSQL Server
```bash
az postgres flexible-server create \
  --name "scout-unified-postgres" \
  --resource-group "minimal-rg" \
  --location "eastus" \
  --admin-user "scoutadmin" \
  --admin-password "YourSecurePass2025!" \
  --sku-name "Standard_B1ms" \
  --tier "Burstable" \
  --storage-size 32 \
  --version 15
```

#### 2️⃣ Export Key Vault Secrets
```bash
# Save all secrets before deletion
for vault in $(az keyvault list --query "[].name" -o tsv); do
  az keyvault secret list --vault-name $vault --query "[].{name:name,value:value}" > ${vault}_secrets.json
done
```

#### 3️⃣ Migrate SQL Databases
Use Azure Database Migration Service or pg_dump/restore

#### 4️⃣ Delete ALL Other Resources
```bash
# Keep only minimal-rg
for rg in $(az group list --query "[?name!='minimal-rg'].name" -o tsv); do
  az group delete --name $rg --yes --no-wait
done
```

## 💰 FINAL RESULT

| Before | After |
|--------|-------|
| 50+ resources | 1 PostgreSQL |
| $500+/month | $33/month |
| 20 resource groups | 1 resource group |
| Complex | Simple |

## 🔐 SECRETS BACKUP

**CRITICAL: Save this before deleting Key Vaults!**

```sql
-- PostgreSQL secrets table
CREATE TABLE app_secrets (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert your secrets
INSERT INTO app_secrets VALUES
('OPENAI_API_KEY', 'sk-...'),
('DATABASE_URL', 'postgresql://...'),
-- Add all your secrets here
```

## ✅ CHECKLIST

- [ ] Enable subscription
- [ ] Export Key Vault secrets
- [ ] Create PostgreSQL server
- [ ] Migrate databases
- [ ] Import secrets to PostgreSQL
- [ ] Test everything works
- [ ] Delete all other resources
- [ ] Verify $33/month billing

## 🆘 ROLLBACK PLAN

Keep these backups:
1. `keyvault_secrets_backup.enc` - Encrypted secrets
2. `azure_adls2_backup_*.zip` - File storage backup
3. Database export files

## 📞 SUPPORT

If subscription won't enable:
1. Azure Support: https://azure.microsoft.com/support
2. Billing: Check payment method
3. Spending limit: May need removal