# Scout Edge Dashboard Deployment Notes

## Overview

These deployment notes provide a concise guide for the final deployment of the Scout Edge dashboard to Azure Static Web App. The dashboard uses dbt-generated data stored in Azure Blob Storage.

## Deployment Steps

### 1. Environment Setup

Before deployment, ensure you have:
- Azure CLI installed and authenticated
- dbt installed (if using live data)
- Node.js installed (for running local tests)

### 2. Configuration

Set the following environment variables or use the deployment script parameters:

```bash
# Azure Resources
export RESOURCE_GROUP="scout-edge-rg"
export STORAGE_ACCOUNT="scoutedgestorage"
export STATIC_WEBAPP="scoutedge-ui"
export CONTAINER_NAME="data"

# dbt Configuration (for live data)
export DBT_DATABRICKS_HOST="your-databricks-workspace.cloud.databricks.com"
export DBT_DATABRICKS_HTTP_PATH="/sql/1.0/warehouses/your-warehouse-id"
export DBT_DATABRICKS_TOKEN="your-databricks-token"
```

### 3. Deploy Using Script

The quickest way to deploy is using the provided deployment script:

```bash
# For sample data deployment
./deploy_with_dbt.sh \
  --resource-group=scout-edge-rg \
  --storage-account=scoutedgestorage \
  --static-webapp=scoutedge-ui \
  --container=data

# For live data deployment
./deploy_with_dbt.sh \
  --live-data \
  --resource-group=scout-edge-rg \
  --storage-account=scoutedgestorage \
  --static-webapp=scoutedge-ui \
  --container=data
```

### 4. Manual Deployment Steps

If you need to deploy manually, follow these steps:

1. Initialize dbt project and generate data:
   ```bash
   cd dbt_project
   ./init_with_sample.sh  # For sample data
   # OR
   ./run_and_export.sh    # For live data
   ```

2. Upload data to Azure Blob Storage:
   ```bash
   az storage blob upload-batch \
     --account-name $STORAGE_ACCOUNT \
     --destination $CONTAINER_NAME \
     --source assets/data \
     --content-cache-control "max-age=3600" \
     --overwrite true
   ```

3. Deploy to Azure Static Web App:
   ```bash
   az staticwebapp create \
     --name $STATIC_WEBAPP \
     --resource-group $RESOURCE_GROUP \
     --source . \
     --branch main \
     --app-location "/"
   ```

4. Monitor data freshness:
   ```bash
   python dbt_project/scripts/monitor_freshness.py
   ```

### 5. GitHub Actions Setup

For automated deployments, configure GitHub Actions:

1. Add the following secrets to your GitHub repository:
   - `AZURE_CREDENTIALS`
   - `AZURE_STORAGE_ACCOUNT`
   - `AZURE_STORAGE_KEY`
   - `AZURE_BLOB_CONTAINER`
   - `DBT_DATABRICKS_HOST` (for live data)
   - `DBT_DATABRICKS_HTTP_PATH` (for live data)
   - `DBT_DATABRICKS_TOKEN` (for live data)

2. The workflow will automatically run daily or can be triggered manually.

## Files and Configuration

### Key Configuration Files

- `web.config`: IIS configuration for Azure Static Web App
- `staticwebapp.config.json`: Azure Static Web App configuration
- `.env.example`: Example environment variables for dbt

### Important Static Files

- `/assets/data/*.json`: Pre-generated data files
- `/js/dashboard_integrator.js`: Integrates dashboard with data source
- `/js/medallion_data_connector.js`: Connects to data sources
- `/js/data_source_toggle.js`: Toggles between data sources
- `/js/data_freshness_badge.js`: Displays data freshness information

## Troubleshooting

### Common Issues

1. **Data files not loading**:
   - Check Azure Blob Storage permissions
   - Verify CORS configuration in staticwebapp.config.json
   - Check browser console for errors

2. **Dashboard not rendering**:
   - Check if data files are accessible
   - Verify that the dashboard is using the correct data path
   - Check JavaScript console for errors

3. **dbt model errors**:
   - Check dbt logs for SQL syntax errors
   - Verify Databricks connection details
   - Run `dbt compile` to check for errors without executing

### Deployment Verification

After deployment, verify:
1. Dashboard loads at `https://scoutedge-ui.azurewebsites.net/`
2. Data files are accessible at `https://scoutedgestorage.blob.core.windows.net/data/`
3. Data is correctly displayed in the dashboard
4. Data freshness badge shows accurate information
5. Data source toggle functions correctly

## Contact

For deployment issues, contact:
- Technical Support: `scout-edge-support@example.com`
- DevOps Team: `devops@example.com`