# Client360 Dashboard Sample Data SQL Guide

This document explains how the Client360 Dashboard handles SQL queries using sample data when deployed in standalone mode without a live database connection.

## Overview

The Client360 Dashboard is designed to work in two modes:

1. **Connected Mode**: Queries real SQL databases for live data (production environment)
2. **Standalone Mode**: Uses sample data files to simulate SQL database responses (development and demo environments)

This guide focuses on the standalone mode and explains how SQL queries are simulated using local JSON files.

## Configuration

### Sample Data Files

Sample data is stored in the `data/sample_data/` directory within the dashboard deployment:

- `minimal_sample.json`: Contains the minimum required data for the dashboard to function
- Additional JSON files for specific data types (optional)

### SQL Query Files

SQL queries are defined in:

- `data/sql_queries.js`: Contains all SQL query strings used by the dashboard

## How SQL Simulation Works

The system uses the `sample_data_loader.js` module to:

1. Parse SQL-like query strings
2. Determine the type of data being requested
3. Load appropriate sample data from JSON files
4. Transform the data to match the expected SQL query results format
5. Return the results in a format compatible with database responses

### Query Processing

Sample data processing follows these steps:

1. Dashboard component requests data using a SQL query string
2. The sample data loader parses the query to identify key tables and fields
3. The loader fetches appropriate sample data from JSON files
4. Data is transformed to match the expected result schema
5. Results are returned in a format similar to a database response

## Adding Custom Sample Data

To add custom sample data for specific SQL queries:

1. Create a JSON file in the `data/sample_data/` directory
2. Structure the data to match the expected query results format
3. Update `sample_data_loader.js` if necessary to handle the new data type

Example custom data file structure:

```json
{
  "metadata": {
    "simulated": true,
    "version": "1.0.0",
    "created": "2025-05-19T00:00:00Z",
    "source": "custom_data"
  },
  "data": {
    "custom_metrics": [
      {
        "metric_name": "Custom Metric 1",
        "value": 1234.5,
        "trend": [1000, 1100, 1200, 1300, 1400]
      },
      {
        "metric_name": "Custom Metric 2",
        "value": 5678.9,
        "trend": [5000, 5200, 5400, 5600, 5800]
      }
    ]
  }
}
```

## Integration with Dashboard Components

### Using Sample Data in Components

To use sample data in dashboard components:

```javascript
// Import the sample data loader
import { executeQuery } from './js/sample_data_loader.js';

// Define a SQL query
const query = `
  SELECT
    metric_name,
    value,
    trend
  FROM custom_metrics
  ORDER BY value DESC
  LIMIT 5
`;

// Execute the query with sample data
async function loadData() {
  try {
    const result = await executeQuery(query);
    
    // Process the results
    if (result.rows && result.rows.length > 0) {
      // Use the data to update the UI
      updateChart(result.rows);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}
```

## Deployment Process

During deployment, the following steps ensure sample data is properly included:

1. `deploy_tbwa_theme.sh`: Copies sample data files to the correct location in the deployment package
2. `deploy_to_azure.sh`: Verifies sample data is included and adds minimal sample data if missing

## Testing Sample Data

You can test the sample data integration using the provided test script:

```bash
./test_deployment.sh
```

This script:
1. Verifies sample data exists
2. Tests SQL query simulation
3. Verifies the deployment scripts correctly handle sample data

## Troubleshooting

If dashboard components are not displaying data in standalone mode:

1. Check browser console for errors from the sample data loader
2. Verify sample data files are present in the `/data/sample_data/` directory
3. Ensure the SQL query strings used by components match those expected by the sample data loader
4. If adding custom queries, update the sample data loader to handle the new query patterns

## Additional Resources

- [Client360 Dashboard README.md](./README.md): Main dashboard documentation
- [Sample Data README.md](./sample_data/README.md): Details about available sample data files