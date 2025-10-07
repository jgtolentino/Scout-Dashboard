# Databricks SQL Connector for Client360 Dashboard

This document provides information about the Databricks SQL connector implementation for the Client360 Dashboard.

## Overview

The SQL connector provides a connection to the Databricks SQL endpoint containing Gold layer tables from the medallion architecture. It supports:

- Secure credential management via Azure Key Vault
- Fallback to simulation mode for development and testing
- Query caching for improved performance
- Data freshness monitoring
- Comprehensive logging and telemetry

## Configuration

The connector can be configured using environment variables or through the options parameter when instantiating the `FMCGSQLConnector` class.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABRICKS_SQL_HOST` | Hostname of the Databricks SQL endpoint | adb-123456789012345.6.azuredatabricks.net |
| `DATABRICKS_SQL_PATH` | HTTP path for the SQL warehouse | /sql/1.0/warehouses/abcdefg1234567890 |
| `DATABRICKS_SQL_TOKEN` | Access token for Databricks SQL endpoint | Empty string (will attempt to retrieve from Key Vault) |
| `DATABRICKS_SQL_PORT` | Port for the SQL endpoint | 443 |
| `DATABRICKS_CATALOG` | Databricks Unity Catalog | client360_catalog |
| `DATABRICKS_SCHEMA` | Schema within the catalog | client360 |
| `KEY_VAULT_NAME` | Name of the Azure Key Vault | kv-client360 |
| `USE_MANAGED_IDENTITY` | Whether to use Azure managed identity for authentication | true |
| `SIMULATION_MODE` | Whether to use simulation mode (for development without database) | false |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | info |
| `ENABLE_TELEMETRY` | Whether to enable telemetry | true |

### Key Vault Integration

The connector can retrieve secrets from Azure Key Vault, specifically the `SQL-ENDPOINT-TOKEN` secret for Databricks SQL authentication. This approach is recommended for production environments to avoid storing sensitive credentials in code or environment variables.

To use Key Vault integration:
1. Ensure the application has access to the Key Vault (via managed identity or service principal)
2. Store the Databricks SQL token in Key Vault with the name `SQL-ENDPOINT-TOKEN`
3. Set `USE_MANAGED_IDENTITY=true` and provide the `KEY_VAULT_NAME`

## Usage

```javascript
const FMCGSQLConnector = require('../data/sql_connector');

// Create a connector instance
const connector = new FMCGSQLConnector();

// Example: Get dashboard KPIs
async function getDashboardData() {
  try {
    // Get KPIs
    const kpis = await connector.getDashboardKPIs();
    console.log('KPIs:', kpis);
    
    // Get regional performance
    const regions = await connector.getRegionalPerformance();
    console.log('Regions:', regions);
    
    // Get data freshness
    const freshness = await connector.getDataFreshness();
    console.log('Data freshness:', freshness);
  } catch (error) {
    console.error('Error retrieving dashboard data:', error);
  } finally {
    // Close the connection when done
    connector.close();
  }
}

getDashboardData();
```

## Available Methods

The connector provides the following methods for retrieving data:

- `getBrands(filters)` - Get brand data with optional filtering
- `getProducts(filters)` - Get product data with optional filtering
- `getStores(filters)` - Get store data (Sari-Sari stores only)
- `getStoreMetrics(filters)` - Get store performance metrics
- `getInteractions(filters)` - Get customer interaction data
- `getBrandDistribution(filters)` - Get brand distribution within stores
- `getRegionalPerformance(filters)` - Get performance metrics by region
- `getTranscriptSentiment(filters)` - Get sentiment analysis from customer transcripts
- `getDeviceHealth(filters)` - Get device health metrics
- `getDashboardKPIs()` - Get high-level KPIs for the dashboard
- `getDataFreshness()` - Get data freshness metrics

## Simulation Mode

For development and testing without a database connection, the connector supports simulation mode, which returns mock data based on the query type. This is useful for local development, demos, and UI testing.

To enable simulation mode:
- Set `SIMULATION_MODE=true` in your environment
- Or pass `simulation: { enabled: true }` in the options

Example simulated data files are located in the `data/sample_data/` directory.

## Testing Connectivity

A test script is provided to verify the Databricks SQL connection:

```bash
# Run the connectivity test
./scripts/test_databricks_connectivity.sh
```

This script will attempt to connect to the Databricks SQL endpoint and execute a basic query to verify the connection.

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Verify the Databricks SQL host and path are correct
   - Ensure the token has the proper permissions
   - Check network connectivity and firewall rules

2. **Authentication Errors**
   - Verify the token is valid and not expired
   - Ensure the managed identity has access to Key Vault

3. **Missing Tables**
   - Confirm the catalog and schema names are correct
   - Verify the Gold tables have been created by the DLT pipelines

4. **Simulation Mode Always Activating**
   - This indicates connection issues - check the logs for specific errors

### Logs

The connector outputs logs with timestamps and severity levels. To enable verbose logging, set `LOG_LEVEL=debug` in your environment.