# TBWA Client 360 Dashboard: DLT Pipeline Integration Guide

This guide provides detailed instructions for integrating the TBWA Client 360 Dashboard with the Scout Delta Live Tables (DLT) Pipeline, enabling real-time data flow from edge devices in Sari-Sari stores to interactive dashboards.

## Overview

The integration connects these key components:

1. **Scout DLT Pipeline**
   - Bronze layer: Raw data from Raspberry Pi devices
   - Silver layer: Validated and enriched data
   - Gold layer: Aggregated metrics and analytics
   - Platinum layer (dbt): Business-ready datasets

2. **TBWA Client 360 Dashboard**
   - High-level KPI tiles
   - Business performance visuals
   - AI-powered insights
   - Drill-down analytics

## Architecture

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Edge Devices │    │  Event Hubs   │    │ Databricks DLT│    │    Client     │
│ (Raspberry Pi)│──▶ │ (Data Stream) │──▶ │  (Processing) │──▶ │ 360 Dashboard │
└───────────────┘    └───────────────┘    └───────────────┘    └───────────────┘
```

## Prerequisites

1. **Deployed Scout DLT Pipeline**
   - Ensure all DLT tables are defined and populated
   - Verify that audio files are accessible (with rollback-dashboard-2025-05-19)
   - Check that the data connection has appropriate permissions

2. **Dashboard Components**
   - Static assets (HTML, CSS, JS)
   - SQL queries for data integration
   - Authentication configuration
   - Dashboard deployment target (Azure, Vercel, etc.)

## Integration Steps

### 1. Configure Database Connection

Edit `/data/dlt_connector.js` to set up the connection to your Databricks SQL endpoint:

```javascript
// Database connection
database: {
    user: process.env.DB_USER || 'your_databricks_user',
    host: process.env.DB_HOST || 'your_databricks_sql_endpoint.azuredatabricks.net',
    database: process.env.DB_NAME || 'scout_lakehouse',
    password: process.env.DB_PASSWORD || 'your_databricks_password',
    port: process.env.DB_PORT || 443,
    ssl: true
}
```

### 2. Verify SQL Queries

Review the SQL queries in `/data/sql_queries.js` to ensure they match your data model:

- Table names should match your DLT tables
- Column names should align with your schema
- Date and timestamp functions should work with your database
- Filters should use the correct syntax for your database

### 3. Set Up Authentication (Optional)

If your Databricks SQL endpoint requires authentication:

1. Create an Azure Key Vault secret for the database credentials
2. Configure the dashboard to use Azure Managed Identity
3. Update the `dlt_connector.js` file to use secure authentication

```javascript
// In dlt_connector.js
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Use managed identity to get database credentials
const credential = new DefaultAzureCredential();
const vaultUrl = "https://your-keyvault.vault.azure.net/";
const secretClient = new SecretClient(vaultUrl, credential);
const dbSecret = await secretClient.getSecret('databricks-sql-password');

// Use the secret in the connection
this.pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: dbSecret.value,
    port: process.env.DB_PORT,
    ssl: true
});
```

### 4. Deploy the Dashboard

Use the provided deployment script to deploy the dashboard:

```bash
./scripts/deploy.sh --env production --target azure
```

Available targets:
- `azure`: Azure Static Web Apps
- `vercel`: Vercel hosting
- `netlify`: Netlify hosting

### 5. Customize the Dashboard

Modify the dashboard to fit your specific needs:

1. Update branding in `static/index.html`
2. Customize KPIs in `static/js/dashboard.js`
3. Adjust visualization styles in `static/css/dashboard.css`
4. Add or remove sections based on your requirements

### 6. Set Up Continuous Integration

Configure CI/CD for automatic updates:

1. Create a GitHub Actions workflow in `.github/workflows/deploy-dashboard.yml`
2. Set up automated testing for dashboard components
3. Configure automatic deployment on merge to main branch

Example workflow:

```yaml
name: Deploy Dashboard

on:
  push:
    branches:
      - main
    paths:
      - 'client360_dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: cd client360_dashboard && npm install
      - name: Run tests
        run: cd client360_dashboard && npm test
      - name: Deploy dashboard
        run: cd client360_dashboard && ./scripts/deploy.sh --env production --target azure
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

## Data Flow Details

### Bronze Layer Integration

The dashboard connects to bronze layer tables for:
- Raw transcript data (customer interactions in Filipino/Tagalog)
- Visual detection events (customer presence, product interaction)
- Device health metrics (Raspberry Pi status, performance)

Example query:
```sql
-- Access bronze_transcriptions for raw speech data
SELECT 
  device_id, timestamp, session_id, transcript, confidence
FROM 
  bronze_transcriptions
WHERE 
  date_trunc('day', timestamp) >= current_date - interval '7 days'
```

### Silver Layer Integration

The dashboard uses silver layer tables for:
- Annotated customer interactions
- Device performance metrics
- Multimodal aligned data (speech + visual)

Example query:
```sql
-- Access silver_annotated_events for semantic interactions
SELECT 
  device_id, timestamp, session_id, interaction_type, transcript
FROM 
  silver_annotated_events
WHERE 
  date_trunc('day', timestamp) >= current_date - interval '7 days'
```

### Gold Layer Integration

The dashboard leverages gold layer tables for:
- Store-level metrics and KPIs
- Device health summaries
- Sentiment analysis and trends

Example query:
```sql
-- Access gold_store_interaction_metrics for KPIs
SELECT 
  store_id, window_start, window_end, total_interactions,
  checkout_count, purchase_intent_count, checkout_conversion_rate
FROM 
  gold_store_interaction_metrics
WHERE 
  window_start >= current_date - interval '7 days'
```

### Platinum Layer Integration (dbt)

The dashboard connects to platinum layer tables for:
- Business-specific KPIs and metrics
- AI-generated insights and recommendations
- Product bundling opportunities

Example query:
```sql
-- Access platinum_insight_recommendations for AI insights
SELECT 
  insight_id, insight_text, confidence_score, insight_category
FROM 
  platinum_insight_recommendations
WHERE 
  timestamp >= current_date - interval '7 days'
ORDER BY 
  confidence_score DESC
LIMIT 3
```

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Verify connection string parameters
   - Check network permissions and firewall rules
   - Ensure the service account has appropriate permissions

2. **Missing or Incomplete Data**
   - Verify that the DLT pipeline is running successfully
   - Check for errors in the DLT job logs
   - Ensure that the query is targeting the correct tables

3. **Dashboard Performance Issues**
   - Optimize SQL queries with proper indexing
   - Implement caching for frequently accessed data
   - Use the browser's performance tools to identify bottlenecks

4. **Authentication Errors**
   - Verify that the credentials are correct
   - Check that the service principal has appropriate permissions
   - Ensure that the Key Vault access policy is properly configured

### Logs and Diagnostics

Access diagnostic information by pressing `Alt + Shift + D` while viewing the dashboard. This displays:
- Current data connection status
- Filter state
- Data refresh timestamps
- Component render status

## Maintenance and Updates

### Regular Maintenance

1. **Data Validation**
   - Periodically validate data accuracy using the QA tools
   - Verify that metrics match expectations from source systems

2. **Schema Updates**
   - When the DLT schema changes, update SQL queries in `sql_queries.js`
   - Test query changes in Databricks SQL before deploying

3. **Performance Optimization**
   - Monitor dashboard performance and response times
   - Optimize poorly performing queries
   - Consider materialized views for complex aggregations

### Feature Updates

To add new visualization components:

1. Add the HTML component to `index.html`
2. Create supporting JavaScript in `dashboard.js`
3. Add styles in `dashboard.css`
4. Create the necessary SQL query in `sql_queries.js`
5. Update the connector in `dlt_connector.js`

## Support and Resources

- **Documentation**: Full technical documentation is available in the `docs` folder
- **Troubleshooting**: For issues, refer to the troubleshooting section above
- **Support**: Contact the Scout DLT team for additional assistance
- **Updates**: Check the GitHub repository for the latest updates and improvements

## Conclusion

By following this integration guide, you'll establish a seamless connection between the Scout DLT Pipeline and the TBWA Client 360 Dashboard, providing real-time analytics and insights from Sari-Sari stores across the Philippines. This integration powers both high-level executive dashboards and detailed operational views, all driven by the same unified data platform.