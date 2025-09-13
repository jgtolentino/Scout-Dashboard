# Static Dashboard Integration Guide

This guide explains how to convert your dynamic dashboard to a static version that uses pre-computed metrics from JSON files instead of making live database queries.

## Benefits

- **Improved Performance**: Dashboard loads instantly with pre-computed data
- **Cost Efficiency**: No runtime database compute resources needed
- **Enhanced Reliability**: No dependency on database availability
- **Simplified Deployment**: Deploy as a pure static website
- **Better Security**: No database credentials in client-side code

## Architecture

The static dashboard solution consists of three components:

1. **Static Metrics Export**: A Node.js script that connects to Databricks SQL, extracts data, and exports it as JSON files
2. **Static Data Connector**: A drop-in replacement for the MedallionDataConnector that loads data from static files
3. **Dashboard Integration**: Script that integrates the static connector with the existing dashboard

## Implementation Steps

### 1. Configure Environment Variables

Set up the necessary environment variables for connecting to Databricks SQL:

```bash
# Create environment-specific configuration
./scripts/setup_env_variables.sh production
```

This creates a `.env.production` file with the necessary configuration.

### 2. Export Static Metrics

Run the export script to generate static JSON files:

```bash
# Export metrics to deploy/data directory
npm run export:metrics
```

### 3. Schedule Regular Updates

Set up a recurring job to refresh the static data:

#### Option A: Cron Job

```bash
# Edit crontab
crontab -e

# Add the following line to run every 6 hours
0 */6 * * * /path/to/scripts/scheduled_export.sh production
```

#### Option B: Azure Function

Deploy the Azure Function for scheduled execution:

```bash
# Deploy the export function to Azure
cd scripts/azure-function-export
func azure functionapp publish YourFunctionAppName
```

### 4. Configure Static Web Hosting

Deploy the static dashboard to Azure Static Web Apps:

```bash
# Deploy to Azure Static Web Apps
./scripts/deploy_static_dashboard.sh production
```

## File Structure

```
/deploy/
  /data/          <- Static JSON files
    kpis.json
    top_stores.json
    regional_performance.json
    brands.json
    brand_distribution.json
    insights.json
    data_freshness.json
    metadata.json
  /js/
    static_data_connector.js
    dashboard_static_integration.js
  index.html      <- Sample dashboard
```

## Integration with Existing Dashboard

To integrate the static data connector with an existing dashboard:

1. Add the static data connector scripts to your dashboard:

```html
<script src="js/static_data_connector.js"></script>
<script src="js/dashboard_static_integration.js"></script>
```

2. Add configuration to your dashboard:

```html
<script>
  window.dashboardConfig = {
    useStaticData: true,
    staticDataPath: '/data',
    showDataSourceIndicator: true
  };
</script>
```

3. Update your dashboard code to use the connector:

```javascript
// The integration script automatically replaces the existing medallionConnector
// with the static connector. Your existing code will work without changes.

// Alternatively, you can use the static connector directly:
const data = await window.staticConnector.getDashboardKPIs();
```

## Data Refresh and Caching

- Static files are cached by the browser and CDN
- Set appropriate cache headers in `staticwebapp.config.json`
- The dashboard shows a data freshness indicator
- Implement auto-refresh by setting `autoRefresh: true` in the dashboard config

## Troubleshooting

- Check `metadata.json` for export timestamp and success status
- Verify data freshness in `data_freshness.json`
- Inspect browser console for errors loading static files
- Check export logs in the `logs` directory

## Production Considerations

- Use Azure CDN or similar for global distribution
- Implement retry logic in the export script
- Set up monitoring for the export process
- Add alerting for failed exports
- Consider A/B testing for the static dashboard

For more details, see:
- [Static Metrics Export README](./scripts/README_STATIC_METRICS.md)
- [Azure Function Export README](./scripts/azure-function-export/README.md)