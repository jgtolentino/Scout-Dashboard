# Dashboard Consolidation

## ✅ DASHBOARD CONSOLIDATION COMPLETE

The Project Scout system now officially supports only three AI-powered dashboards:

| Dashboard Name | URL Path | Access Level |
| -------------- | -------- | ------------ |
| System Architecture & QA | /qa.html | **INTERNAL ONLY** |
| Scout Advanced Analytics | /insights_dashboard.html | **INTERNAL ONLY** |
| Retail Advisor | /retail_edge/retail_edge_dashboard.html | **CLIENT-FACING** |

All deprecated dashboards (e.g., /ops/system_dashboard.html, index hubs) have been removed or redirected.  
Pulser versioning and QA developer toggles are isolated to internal-facing dashboards only.

## Access Policy

- **TBWA is our direct client**
- TBWA serves multiple retail brands and clients
- Only the `Retail Advisor` dashboard is intended for sharing with TBWA clients
- The `System Architecture & QA` and `Scout Advanced Analytics` dashboards are for internal use only and should never be exposed to TBWA clients or their downstream stakeholders

## Deployment Bookmark Tag

`dashboard_scope_locked_v3`

All future deploys must validate against this schema.

## Checklist Complete

- ✅ `System Architecture & QA` dashboard implemented at `/qa.html`
    - ✅ Removed client-facing elements
    - ✅ Added System Health KPIs
    - ✅ Added Device Monitoring
    - ✅ Added Anomaly Detection  
    - ✅ Added System Timeline
    - ✅ Added QA Developer Mode toggle
    - ✅ Added Pulser v2.1.2 versioning in footer

- ✅ `Scout Advanced Analytics` dashboard implemented at `/insights_dashboard.html`
    - ✅ Retained all client-centric analytics
    - ✅ Removed all QA/system metrics
    - ✅ Maintained Power BI-style CSS
    - ✅ Preserved AI-driven drilldown 

- ✅ `Retail Advisor` dashboard implemented at `/retail_edge/retail_edge_dashboard.html`
    - ✅ Maintained Brand Performance, Marketing ROI
    - ✅ Kept Scout AI Assistant + Action Cards
    - ✅ Retained Visual summaries

## Decommissioned

- ✅ `/ops/system_dashboard.html` → removed
- ✅ `/dashboards/index.html` → removed
- ✅ All dashboard mixing QA + client content → eliminated
- ✅ All placeholder .html files → eliminated

## Deployment Instructions

1. Deploy these dashboards to Azure Static Web App from the `final-locked-dashboard` directory
2. Use the following command:

```bash
swa deploy ./public \
  --deployment-token $(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv) \
  --env production
```

3. After deployment, add this bookmark tag `dashboard_scope_locked_v3` to your Pulser system
4. Log the deployment in Claudia + SKR under `patch_id: dashboard-final-alignment-v3`