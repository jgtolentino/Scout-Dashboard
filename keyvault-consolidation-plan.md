# Key Vault Consolidation Plan

## 🔐 Current State: 6 Key Vaults

### By Resource Group:
1. **RG-TBWA-ProjectScout-Data** (2 vaults)
   - `kv-projectscout-prod`
   - `ai-agency-secrets`

2. **Individual Resource Groups** (4 vaults)
   - `kv-scout-tbwa-1750202017` (rg-scout-prod)
   - `adsbot-ces-validator-kv` (adsbot-ces-validator-rg)
   - `scout-analytics-vault` (scout-dashboard-rg)
   - `kv-tbwa-juicer-insights2` (RG-TBWA-ProjectScout-Juicer)

## 💰 Cost Analysis

| Scenario | Vaults | Monthly Cost |
|----------|--------|--------------|
| Current (6 vaults) | 6 | $18 ($3 each) |
| Consolidated (1 vault) | 1 | $3 |
| Minimal (0 vaults) | 0 | $0 |

## 🎯 Options

### Option 1: Keep 1 Primary Vault ($3/month)
```bash
# Keep: kv-projectscout-prod (primary)
# Migrate all secrets to this vault
# Delete other 5 vaults
```

**Benefits:**
- Centralized secret management
- Single access control point
- Still have secure storage
- $15/month savings

### Option 2: PostgreSQL-Only (No Key Vault)
```bash
# Store all secrets as:
# 1. PostgreSQL configuration
# 2. Environment variables
# 3. Application config files
```

**Benefits:**
- $18/month savings
- Simpler architecture
- No additional services

**Risks:**
- Less secure for API keys
- No central secret rotation
- Harder secret management

### Option 3: Export & Delete All ($0/month)
```bash
# 1. Export all secrets to secure file
# 2. Store in password manager
# 3. Delete all 6 Key Vaults
# 4. Use env vars for deployment
```

## 📋 What We Found

### Accessible Secrets (kv-tbwa-juicer-insights2):
- API Keys: OpenAI, Claude, Pinecone
- Database URLs
- Storage account keys
- Authentication tokens

### Migration Script (if subscription enabled):
```bash
# Export from old vaults
for secret in $(az keyvault secret list --vault-name SOURCE_VAULT --query "[].name" -o tsv); do
    value=$(az keyvault secret show --vault-name SOURCE_VAULT --name "$secret" --query "value" -o tsv)
    # Import to primary vault
    az keyvault secret set --vault-name kv-projectscout-prod --name "$secret" --value "$value"
done
```

## 🚀 Recommendations

### For $33/month total budget:
1. **Delete all Key Vaults** (save $18)
2. Use PostgreSQL for config storage
3. Environment variables for secrets

### For $36/month total budget:
1. **Keep 1 Key Vault** (kv-projectscout-prod)
2. Consolidate all secrets there
3. Delete other 5 vaults

### Security Best Practice ($36/month):
- PostgreSQL: $33
- 1 Key Vault: $3
- Total: $36/month

## 🔒 Final Architecture Options

| Budget | Services | Security Level |
|--------|----------|---------------|
| $33/mo | PostgreSQL only | Basic |
| $36/mo | PostgreSQL + 1 Key Vault | Good |
| $51/mo | PostgreSQL + All 6 Key Vaults | Excessive |