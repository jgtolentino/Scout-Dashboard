# 🚀 Scout Dashboard v4.0 Azure - Production Launch Checklist

**Complete pre-flight checklist before running the automation in production**

---

## ✅ Pre-Launch Verification Steps

| Step | Action | Command/Notes | Status |
|------|--------|---------------|--------|
| **1. Git Hygiene** | Commit and push the azure-data-pipeline folder | `git status` → commit/push to feature branch | ⬜ |
| **2. Key Vault Secrets** | Verify all required secrets exist in Azure Key Vault | `az keyvault secret list --vault-name kv-scout-prod -o table` | ⬜ |
| **3. Repository Secrets** | Set GitHub repository secrets and variables | Configure in GitHub Settings → Secrets | ⬜ |
| **4. Databricks CLI Auth** | Test Databricks authentication | `databricks workspace list` | ⬜ |
| **5. Storage Mount Test** | Dry-run ADLS mounting | `bash link_adls_databricks.sh --dry-run` | ⬜ |
| **6. Bootstrap Script** | Run the main automation | `./create-scout-dashboard-azure.sh` | ⬜ |
| **7. CI First Pass** | Monitor GitHub Actions pipeline | Watch lock-verify → build-test-deploy → deploy-etl | ⬜ |
| **8. Percy Approval** | Approve visual baseline snapshots | Open Percy dashboard and approve changes | ⬜ |
| **9. Production Deploy** | Merge PR for production deployment | Merge → Vercel auto-promotes to production | ⬜ |
| **10. Daily Verification** | Verify scheduled jobs and AI insights | Check 09:00 Manila time Databricks job | ⬜ |

---

## 🔐 Required Azure Key Vault Secrets

Verify these secrets exist in `kv-scout-prod`:

```bash
az keyvault secret list --vault-name kv-scout-prod -o table
```

**Required Secrets:**
- `pg-password` - PostgreSQL admin password
- `storage-key` - Azure Storage account key
- `sp-client-id` - Service principal client ID
- `sp-secret` - Service principal secret
- `sp-tenant` - Azure tenant ID
- `aoai-endpoint` - Azure OpenAI endpoint URL
- `aoai-key` - Azure OpenAI API key
- `aoai-deployment` - Azure OpenAI deployment name (e.g., gpt-4o-32k)

---

## ⚙️ Required GitHub Repository Configuration

### Repository Secrets
```
AZURE_CLIENT_ID=<service-principal-client-id>
AZURE_CLIENT_SECRET=<service-principal-secret>
AZURE_SUBSCRIPTION_ID=<azure-subscription-id>
AZURE_TENANT_ID=<azure-tenant-id>
DATABRICKS_TOKEN=<databricks-personal-access-token>
VERCEL_TOKEN=<vercel-deployment-token>
```

### Repository Variables
```
KEY_VAULT=kv-scout-prod
PG_SERVER=pg-scout-prod
AZ_RG=rg-scout-prod
PG_FQDN=pg-scout-prod.postgres.database.azure.com
```

---

## 🧪 Pre-Flight Testing Commands

### 1. Test Azure CLI Authentication
```bash
az account show
az keyvault secret list --vault-name kv-scout-prod -o table
```

### 2. Test Databricks CLI Authentication
```bash
databricks workspace list
databricks clusters list
```

### 3. Test Storage Access
```bash
az storage account show -n stscoutprod -g rg-scout-prod
```

### 4. Dry-Run ADLS Mount (Optional)
```bash
# Add --dry-run flag to the script for testing
bash link_adls_databricks.sh --dry-run
```

---

## 🚀 Launch Sequence

### Step 1: Git Preparation
```bash
cd /Users/tbwa/Documents/GitHub/scout-mvp/azure-data-pipeline
git add .
git commit -m "feat: add Scout Dashboard v4.0 Azure data pipeline package"
git push -u origin feature/azure-data-pipeline
```

**Repository:** https://github.com/jgtolentino/scout-mvp-v1.git

### Step 2: Run Main Automation
```bash
./create-scout-dashboard-azure.sh
```

**Expected Output:**
- Creates `scout-dashboard-v4-azure/` project directory
- Converts Cruip template to Next.js 15
- Sets up Azure PostgreSQL integration
- Configures CI/CD pipeline
- Optionally sets up Azure data pipeline

### Step 3: Monitor CI Pipeline
Watch GitHub Actions for:
1. **lock-verify** - Agent hash verification
2. **build-test-deploy** - Application build and test
3. **deploy-etl** - Databricks job deployment

### Step 4: Manual Genie StockBot Test (Optional)
```bash
# Trigger immediate AI insights generation
databricks runs submit \
  --python-file dbfs:/FileStore/code/genie_stockbot.py \
  --cluster-id <interactive-cluster-id>
```

---

## 📊 Expected Results

### Dashboard
- **Development URL**: http://localhost:3000
- **Production URL**: https://scout-dashboard-v4-azure.vercel.app
- **Performance**: <150ms API responses, 90+ Lighthouse score

### Data Pipeline
- **ETL Schedule**: Daily at 15:15 Manila time
- **AI Insights**: Daily at 09:00 Manila time
- **Data Latency**: 30-second dashboard refresh

### Database Tables
- `public.transactions` - Raw transaction data
- `public.daily_kpis` - Aggregated KPIs
- `public.product_performance` - Product analytics
- `public.regional_performance` - Regional analytics
- `public.ai_recommendations` - AI insights
- `public.ai_insights_summary` - Dashboard summaries

---

## 🔍 Verification Commands

### Check Dashboard Health
```bash
curl -s http://localhost:3000/api/kpi | jq
curl -s http://localhost:3000/api/trends | jq
```

### Check Database Connection
```bash
# From the generated project directory
cd scout-dashboard-v4-azure
npx prisma studio
```

### Check Databricks Jobs
```bash
databricks jobs list
databricks runs list --limit 10
```

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Verify connection string format
echo $DATABASE_URL
# Test with Prisma
npx prisma db pull
```

**Databricks Authentication Error:**
```bash
# Reconfigure Databricks CLI
databricks configure --token
```

**Build Errors:**
```bash
# Clear caches and reinstall
rm -rf .next node_modules package-lock.json
npm install
```

**Secret Access Error:**
```bash
# Verify Key Vault permissions
az keyvault show --name kv-scout-prod
az role assignment list --assignee <service-principal-id>
```

---

## 🎯 Success Criteria

### ✅ Launch Complete When:
- [ ] Dashboard loads with live data
- [ ] KPI cards display real metrics
- [ ] Charts render correctly
- [ ] AI panel shows recommendations
- [ ] ETL jobs run successfully
- [ ] CI/CD pipeline is green
- [ ] Production deployment is live

### 📈 Ongoing Monitoring:
- Daily ETL job success rate >95%
- API response times <150ms p95
- Dashboard uptime >99.9%
- AI insights generated daily
- No secret rotation failures

---

## 🎉 Post-Launch Actions

1. **Monitor first 24 hours** of automated jobs
2. **Verify AI recommendations** appear in dashboard
3. **Check performance metrics** in Vercel analytics
4. **Review error logs** for any issues
5. **Document any customizations** needed

---

**🚀 Ready for launch! Follow this checklist step-by-step for a smooth deployment.**

---

*Created: June 18, 2025*  
*Location: `/Users/tbwa/Documents/GitHub/scout-mvp/azure-data-pipeline/`*
