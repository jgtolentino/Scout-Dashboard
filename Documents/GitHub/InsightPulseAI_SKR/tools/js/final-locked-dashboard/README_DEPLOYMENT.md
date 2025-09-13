# Scout Edge Dashboard with dbt Integration - Deployment Guide

The Scout Edge Dashboard has been successfully built with dbt integration. Follow the instructions below to deploy it to Azure Static Web Apps.

## Deployment Package

A deployment package has been created at:
`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_edge_dbt_deployment.zip`

This package includes:
- The Scout Edge retail dashboard
- dbt-generated JSON data files
- Data freshness monitoring
- Integration with Azure services

## Manual Deployment Steps

1. Log in to the [Azure Portal](https://portal.azure.com)

2. Navigate to the Static Web App "tbwa-juicer-insights-dashboard" in the resource group "RG-TBWA-ProjectScout-Juicer"

3. In the Static Web App, go to "Deployment" in the left menu

4. Click on "Manage deployment token" and copy the token

5. Click on "Browse" and navigate to the StaticWebApp URL:
   `https://gentle-rock-04e54f40f.6.azurestaticapps.net`

6. Access the retail dashboard directly at:
   `https://gentle-rock-04e54f40f.6.azurestaticapps.net/retail_edge/retail_edge_dashboard.html`

## Data Sources

The dashboard uses JSON data generated from dbt models:
- `top_brands.json` - Brand performance data
- `top_combos.json` - Brand combination analysis
- `store_metrics.json` - Store performance metrics
- `geo_brand_distribution.json` - Geographical brand distribution
- `geo_sales_volume.json` - Sales volume by region
- `geo_brand_mentions.json` - Brand mentions by region
- `metadata.json` - Data freshness information

## Data Refresh

To refresh the data:
1. Run the dbt models: `./dbt_project/run_and_export.sh`
2. Monitor data freshness: `python3 dbt_project/scripts/monitor_freshness.py`
3. Upload the data to Azure Blob Storage: `az storage blob upload-batch --account-name tbwajuicerstorage --destination data --source assets/data`

## Troubleshooting

If you encounter issues with the deployment:
1. Check the Azure Static Web App logs
2. Verify data freshness using `python3 dbt_project/scripts/monitor_freshness.py`
3. Ensure Azure Blob Storage container "data" exists
4. Check browser console for any JavaScript errors

## URLs

- Dashboard URL: `https://gentle-rock-04e54f40f.6.azurestaticapps.net/retail_edge/retail_edge_dashboard.html`
- Azure Static Web App: `https://portal.azure.com/#@/resource/subscriptions/c03c092c-443c-4f25-9efe-33f092621251/resourceGroups/RG-TBWA-ProjectScout-Juicer/providers/Microsoft.Web/staticSites/tbwa-juicer-insights-dashboard/overview`