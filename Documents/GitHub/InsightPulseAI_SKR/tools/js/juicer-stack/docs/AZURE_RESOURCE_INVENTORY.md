# Project Scout: Azure Resource Inventory

**Date:** May 12, 2025  
**Project:** Juicer GenAI Insights  
**Environment:** Production

## Resource Overview

| Category | Count |
|----------|-------|
| Resource Groups | 1 |
| Storage Accounts | 1 |
| Databricks Workspaces | 1 |
| Static Web Apps | 1 |
| Key Vaults | 1 |
| Storage Containers | 4 |
| Databricks Clusters | 1 |
| Databricks Jobs | 2 |
| GitHub Workflows | 3 |

## Detailed Inventory

### Resource Group
- **Name:** RG-TBWA-ProjectScout-Juicer
- **Region:** East US
- **Tags:** Project=Scout, Environment=Production
- **Status:** Active

### Storage Account
- **Name:** tbwajuicerstorage
- **Type:** General Purpose v2
- **Replication:** Locally Redundant Storage (LRS)
- **Performance Tier:** Standard
- **Resource Group:** RG-TBWA-ProjectScout-Juicer
- **Status:** Active
- **Hierarchy Namespace:** Enabled (for Delta Lake)

#### Storage Containers
1. **bronze**
   - Purpose: Raw transcript data
   - Access Level: Private

2. **silver**
   - Purpose: Enriched data with brand mentions
   - Access Level: Private

3. **gold**
   - Purpose: Analysis-ready data
   - Access Level: Private

4. **platinum**
   - Purpose: GenAI insights
   - Access Level: Private

### Databricks Workspace
- **Name:** tbwa-juicer-databricks
- **SKU:** Premium
- **Resource Group:** RG-TBWA-ProjectScout-Juicer
- **Status:** Active
- **URL:** https://adb-[workspace-id].azuredatabricks.net

#### Databricks Cluster
- **Name:** JuicerProcessing
- **Type:** Standard
- **VM Size:** Standard_D4s_v3
- **Workers:** 2
- **Runtime:** 11.3.x-scala2.12
- **Auto-termination:** 60 minutes

#### Databricks Jobs
1. **Juicer Daily Insights Generation**
   - Schedule: Daily at 6:00 UTC
   - Notebook: /Shared/InsightPulseAI/Juicer/juicer_gold_insights
   - Parameters: date=1d, env=prod, model=claude, generate_dashboard=true

2. **Juicer Weekly Insights Summary**
   - Schedule: Mondays at 7:00 UTC
   - Notebook: /Shared/InsightPulseAI/Juicer/juicer_gold_insights
   - Parameters: date=7d, env=prod, model=auto, generate_dashboard=true

#### Databricks Notebooks
1. **/Shared/InsightPulseAI/Juicer/juicer_gold_insights**
   - Language: Python
   - Purpose: GenAI insights generation
   
2. **/Shared/InsightPulseAI/Juicer/juicer_setup_insights_tables**
   - Language: SQL
   - Purpose: Database schema creation
   
3. **/Shared/InsightPulseAI/Juicer/juicer_enrich_silver**
   - Language: Python
   - Purpose: Silver layer data enrichment

4. **/Shared/InsightPulseAI/Juicer/juicer_ingest_bronze**
   - Language: SQL
   - Purpose: Bronze layer data ingestion

5. **/Shared/InsightPulseAI/Juicer/juicer_setup_storage**
   - Language: Python
   - Purpose: Storage mounts configuration

### Static Web App
- **Name:** tbwa-juicer-insights-dashboard
- **SKU:** Standard
- **Resource Group:** RG-TBWA-ProjectScout-Juicer
- **Status:** Active
- **URL:** https://gentle-rock-04e54f40f.6.azurestaticapps.net
- **GitHub Integration:** Enabled

### Key Vault
- **Name:** kv-tbwa-juicer-insights2
- **SKU:** Standard
- **Resource Group:** RG-TBWA-ProjectScout-Juicer
- **Status:** Active

#### Key Vault Secrets
1. **DATABRICKS-TOKEN**
   - Purpose: Databricks API authentication
   - Type: Access token

2. **CLAUDE-API-KEY**
   - Purpose: Claude API authentication
   - Type: API key

3. **OPENAI-API-KEY**
   - Purpose: OpenAI API authentication
   - Type: API key

4. **AZURE-STATIC-WEB-APPS-API-TOKEN**
   - Purpose: Static Web App deployment
   - Type: API token

5. **STORAGE-ACCOUNT-KEY**
   - Purpose: Storage account access
   - Type: Access key

### GitHub Workflows
1. **deploy-insights.yml**
   - Purpose: Deploy GenAI Insights components
   - Trigger: Push to specific paths or manual workflow dispatch
   - Actions: Validate, build, deploy dashboards and notebooks

2. **deploy-juicer.yml**
   - Purpose: Deploy core Juicer components
   - Trigger: Push to specific paths or manual workflow dispatch
   - Actions: Build and deploy backend components

3. **visual-qa-workflow.yml**
   - Purpose: Visual quality assurance testing
   - Trigger: Manual workflow dispatch
   - Actions: Run visual regression tests on dashboards

## Networking & Access

- **Databricks Network Security:** Private endpoint disabled, using workspace firewall
- **Storage Account Firewall:** Allowed from specific networks
- **Key Vault Access Policy:** Role-based access control (RBAC)
- **Static Web App Authentication:** None (publicly accessible dashboard)

## Cost Estimation

| Resource | Monthly Est. Cost (USD) |
|----------|------------------------|
| Databricks Workspace | $500-750 |
| Storage Account | $50-75 |
| Key Vault | $5 |
| Static Web App | $10 |
| **Total Estimated Monthly Cost** | **$565-840** |

## Monitoring & Alerts

- **Databricks Job Alerts:** Email on failure to designated admin
- **Metrics Collection:** Azure Monitor
- **Log Analytics:** Not configured
- **Custom Alerts:** None configured

## Backup & Disaster Recovery

- **Storage Account:** No backup configured (raw data exists in source systems)
- **Databricks Workspace:** No specific backup (notebooks in GitHub)
- **Recovery Point Objective (RPO):** Not defined
- **Recovery Time Objective (RTO):** Not defined

## Compliance & Security

- **Data Encryption:** Enabled at rest and in transit
- **Private Endpoints:** Not configured
- **RBAC Implementation:** Standard resource group roles
- **Sensitive Data Handling:** All API keys in Key Vault

## Integration Points

- **Pulser CLI Integration:** Via insights_hook.yaml and juicer_hook.yaml
- **GitHub Actions:** CI/CD integration with Azure Static Web Apps
- **Claude API:** Used for primary GenAI processing
- **OpenAI API:** Used as fallback GenAI processing
- **DeepSeek API:** Used as secondary fallback GenAI processing

## Notes & Recommendations

1. **Recommended Enhancements:**
   - Enable Azure Monitor for comprehensive resource monitoring
   - Implement backup strategy for critical data
   - Configure alerting for resource utilization thresholds

2. **Cost Optimization:**
   - Review Databricks cluster auto-termination settings
   - Consider reserved instances for VM-based resources
   - Monitor storage utilization and implement lifecycle management

3. **Security Improvements:**
   - Implement private endpoints for Key Vault and Storage
   - Enhance RBAC with more granular permissions
   - Regular rotation of API keys and secrets

---

*This inventory was generated on May 12, 2025 and represents the current state of Azure resources for Project Scout. Resources may change over time as the project evolves.*