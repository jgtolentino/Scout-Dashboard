# Static Metrics Export for Scout Dashboard

This tool exports metrics from Databricks SQL into static JSON files that can be deployed with a static dashboard application. It allows you to create a fully static version of the dashboard that doesn't require real-time SQL connections at runtime.

## Overview

The static metrics export script connects to Databricks SQL, extracts all necessary data for the dashboard, and exports it as static JSON files. These files can then be deployed with your static web app, allowing the dashboard to load pre-computed metrics rather than making SQL queries on each page load.

## Benefits

- **Faster Load Times**: Pre-computed metrics load instantly
- **Reduced Backend Costs**: No runtime SQL compute resources needed
- **Simplified Deployment**: Pure static site deployment with no backend
- **Better Reliability**: No dependency on SQL endpoint availability
- **Improved Security**: No client-side SQL credentials needed

## Usage

### Prerequisites

```bash
npm install
```

### Running the Export

```bash
# Export metrics using environment variables for configuration
npm run export:metrics

# Or with specific environment variables
DATABRICKS_SQL_HOST=your-host DATABRICKS_SQL_TOKEN=your-token npm run export:metrics
```

### Testing

The tool includes a test script that runs in simulation mode:

```bash
npm run test:export
```

### Output

The script creates the following files in the `deploy/data/` directory:

- `kpis.json` - Key performance indicators
- `top_stores.json` - Top performing stores
- `regional_performance.json` - Performance by region
- `brands.json` - Brand data with sentiment scores
- `brand_distribution.json` - Brand distribution in stores
- `insights.json` - GenAI-generated insights
- `data_freshness.json` - Data freshness metrics
- `metadata.json` - Export process metadata

## CI/CD Integration

To integrate with your CI/CD pipeline, use the provided `ci_export_and_deploy.sh` script:

```bash
# In your CI/CD pipeline
./scripts/ci_export_and_deploy.sh
```

This script:
1. Installs dependencies
2. Exports static metrics
3. Verifies exported files
4. Commits changes to Git
5. Pushes to the repository
6. Deploys to Azure Static Web App

## Configuration

Configure the export process using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABRICKS_SQL_HOST` | Databricks SQL endpoint hostname | adb-123456789012345.6.azuredatabricks.net |
| `DATABRICKS_SQL_PATH` | Databricks SQL endpoint path | /sql/1.0/warehouses/abcdefg1234567890 |
| `DATABRICKS_SQL_TOKEN` | Databricks SQL access token | (empty) |
| `DATABRICKS_CATALOG` | Databricks catalog name | client360_catalog |
| `DATABRICKS_SCHEMA` | Databricks schema name | client360 |
| `KEY_VAULT_NAME` | Azure Key Vault name for secrets | kv-client360 |
| `USE_MANAGED_IDENTITY` | Use Azure managed identity | true |
| `SIMULATION_MODE` | Use simulated data instead of real data | false |

## Troubleshooting

If you encounter issues with the export process:

1. Ensure your Databricks SQL endpoint is accessible
2. Verify you have the correct permissions and token
3. Check that all required tables exist in the specified schema
4. Run in simulation mode to test the export process
5. Check the error logs for specific issues

For Azure Key Vault access issues, ensure you have the appropriate RBAC permissions and that the managed identity is correctly configured.

## Next Steps

After exporting static metrics:

1. Test the dashboard with the static data
2. Set up a scheduled job to refresh the static data on a regular basis
3. Implement CI/CD to automatically update the static site when data changes
4. Add data freshness indicators to your UI so users know when data was last updated