# Scout Edge dbt Project

This project contains dbt models for the Scout Edge dashboard data pipeline.

## Models

### SalesInteractionBrands

This is the core model that connects sales transactions to brand data with geographical context.
It's used for brand intelligence analytics and choropleth map visualization.

### TopBrands

Provides brand performance metrics by geographic region with market share and rankings.
This model powers the brand performance visualizations in the dashboard.

### TopCombos

Brand combination analytics showing which brands are purchased together.
This helps identify cross-selling opportunities and brand affinities.

### StoreMetrics

Comprehensive store performance metrics with regional benchmarking.
Used for the store performance dashboard and map visualizations.

## Project Structure

```
dbt_project/
├── dbt_project.yml       # Main dbt project configuration
├── profiles.yml          # Connection profiles for different environments
├── README.md             # This file
├── requirements.txt      # Python dependencies for dbt and data export
│
├── models/               # dbt models organized by layer
│   ├── sources.yml       # Defines source tables from the data warehouse
│   ├── staging/          # Staging models (minimal transformations)
│   │   ├── schema.yml    # Documentation for staging models
│   │   ├── stg_*.sql     # Staging model SQL definitions
│   ├── intermediate/     # Intermediate models (business logic)
│   │   ├── schema.yml    # Documentation for intermediate models
│   │   ├── int_*.sql     # Intermediate model SQL definitions
│   ├── marts/            # Final analytical models (business outputs)
│       ├── schema.yml    # Documentation for mart models
│       ├── *.sql         # Mart model SQL definitions
│       ├── scout_edge/   # Scout Edge specific models
│           ├── schema.yml  # Documentation for Scout Edge models
│           ├── *.sql      # Scout Edge model SQL definitions
│
├── scripts/              # Utility scripts
│   ├── export_to_json.py # Script to export dbt model data to JSON
│   ├── generate_sample_data.py # Generate sample data for testing
│   ├── monitor_freshness.py # Monitor data freshness
│   ├── update_timestamps.py # Update timestamps for testing
│   ├── audit_databricks_data.py # Audit Databricks data quality
│   └── dashboard_integration.js # Script to integrate with the dashboard
│
├── DATABRICKS_DATA_AUDIT.md # Data quality audit report
├── test_full_pipeline.sh    # End-to-end pipeline test script
├── run_and_export.sh        # Main script to run models and export data
└── init_with_sample_data.sh # Script to initialize the project with sample data
```

## Getting Started

### Setup

1. Install dbt:
   ```
   pip install dbt-databricks
   ```

2. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your Databricks connection details
   ```

### Running the Models

To run the models and export data:

```
./run_and_export.sh
```

For sample data:

```
./run_and_export.sh --sample
```

### Initializing the Project

If you're setting up for the first time, run:

```
./init_with_sample_data.sh
```

This will:
1. Generate sample data
2. Create an initial `.env` file
3. Set up the necessary directory structure

## Integration with Scout Edge Dashboard

The exported JSON files in `../assets/data/` are loaded by the dashboard through the
`MedallionDataConnector` and displayed using the dashboard visualization components.

### Data Sources Toggle

The dashboard includes a toggle component (`DataSourceToggle`) that allows switching between:
- Static data files
- dbt model exports
- API endpoints
- Simulated data

To add this toggle to your dashboard, add the following to your HTML:

```html
<script src="./js/data_source_toggle.js"></script>
<script src="./js/medallion_data_connector.js"></script>
<script>
  // Initialize the data source toggle
  const dataSourceToggle = new DataSourceToggle({
    containerId: 'data-toggle-container',
    defaultSource: 'dbt'
  });
  
  // Get configuration from the toggle
  const config = dataSourceToggle.getConfig();
  
  // Initialize the data connector with the config
  const dataConnector = new MedallionDataConnector({
    useSimulatedData: config.useSimulatedData,
    dataPath: config.dataPath
  });
  
  // Load data when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    // Use the data connector to load data
    // Example: dataConnector.loadTopBrands().then(data => renderBrandChart(data));
  });
</script>
```

## GitHub Actions Integration

This project includes a GitHub Actions workflow (`dbt-data-sync.yml`) that:
1. Runs daily to generate fresh data
2. Can be manually triggered from the GitHub UI
3. Uploads the data to Azure Blob Storage
4. Creates a PR with updated data files

To set this up, add the following secrets to your GitHub repository:
- `DBT_DATABRICKS_HOST`
- `DBT_DATABRICKS_HTTP_PATH`
- `DBT_DATABRICKS_TOKEN`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_KEY`
- `AZURE_BLOB_CONTAINER`

## Adapting the Models

When adapting these models to your specific needs:

1. Update the `sources.yml` file to match your database schema
2. Modify the staging models to align with your source tables
3. Adjust the intermediate and mart models as needed
4. Update the `export_to_json.py` script if you need different export formats

## Data Quality & Testing

This project includes tools for ensuring data quality and testing the pipeline:

### Databricks Data Audit

The `audit_databricks_data.py` script performs a comprehensive audit of the Databricks data sources used by the Scout Edge dashboard. It checks:

- Table existence and schema validation
- Data volumes and completeness
- Foreign key relationships
- Data quality issues (duplicate transactions, negative prices, etc.)

To run the audit:

```bash
python scripts/audit_databricks_data.py
```

Or with sample data:

```bash
python scripts/audit_databricks_data.py --sample
```

The audit generates both JSON and Markdown reports.

### Data Freshness Monitoring

The `monitor_freshness.py` script checks the freshness of exported datasets and generates a metadata.json file that can be used to display freshness indicators in the dashboard.

```bash
python scripts/monitor_freshness.py
```

### Full Pipeline Testing

The `test_full_pipeline.sh` script tests the entire data pipeline from dbt model execution to dashboard data availability. It:

1. Runs a data audit
2. Exports data
3. Updates timestamps to simulate different freshness scenarios
4. Monitors data freshness
5. Validates data structure
6. Tests dashboard integration
7. Generates a test summary

To run the full pipeline test:

```bash
./test_full_pipeline.sh
```

Or with sample data:

```bash
./test_full_pipeline.sh --sample
```

## Troubleshooting

If you encounter issues:

1. Check that your Databricks connection details are correct in `.env`
2. Verify that dbt can connect to your database with `dbt debug`
3. Run `dbt compile` to check for SQL syntax errors without executing queries
4. Run the Databricks data audit script to identify data quality issues
5. For export issues, run the export script directly with debug flags: