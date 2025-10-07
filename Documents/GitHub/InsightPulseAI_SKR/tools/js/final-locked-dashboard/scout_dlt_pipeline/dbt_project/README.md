# Scout Retail Advisor dbt Project

This dbt (data build tool) project structures and transforms the Scout Retail Advisor data for the dashboard and analytics needs.

## Schema Improvements

The dbt project incorporates critical schema improvements to ensure:
- Pipeline integrity
- Future-proofing
- ML readiness
- Proper auditing and tracking

Key schema improvements:
1. Added timestamp fields for late-arriving data handling
2. Added soft delete capability with IsActive columns
3. Aligned foreign keys and added proper indexes
4. Added device mapping metadata
5. Added source tracking metadata
6. Added session anchoring fields

## Structure

The dbt project follows this structure:

```
models/
├── marts/                        # Business-level aggregated models
│   ├── sales_interactions_enriched.sql
│   ├── store_daily_metrics.sql
│   ├── brand_performance_metrics.sql
│   ├── device_performance_metrics.sql
│   └── customer_session_metrics.sql
├── staging/                      # Intermediate staging models (not shown)
└── schema.yml                    # Schema definitions with tests and documentation
```

## Usage

### Prerequisites

1. dbt Core or dbt Cloud
2. Access to a Scout Retail Advisor database
3. Apply the migration script first:
   ```bash
   # Apply the database schema improvements
   psql -d scout_retail_advisor < ../migrations/add_missing_columns.sql
   # For SQL Server
   # sqlcmd -S server -d scout_retail_advisor -i ../migrations/add_missing_columns.sql
   ```

### Setting Up

1. Configure your dbt profile in `~/.dbt/profiles.yml`:

```yaml
scout_retail_advisor:
  target: dev
  outputs:
    dev:
      type: sqlserver  # or postgresql, etc.
      driver: 'ODBC Driver 17 for SQL Server'
      server: your-server.database.windows.net
      database: RetailAdvisorDB
      schema: dbo
      user: dbt_user
      password: your_password
      port: 1433
      threads: 4
```

2. Install dependencies:

```bash
dbt deps
```

### Running dbt

```bash
# Run all models
dbt run

# Run specific mart models
dbt run --select marts.sales_interactions_enriched marts.store_daily_metrics

# Run models with tags
dbt run --select tag:dashboard

# Test the transformations
dbt test
```

## Integration with Delta Live Tables

This dbt project is designed to work as the transformation layer after the Scout DLT pipeline:

1. **Bronze Layer (DLT)** - Raw data ingestion from Event Hubs
2. **Silver Layer (DLT)** - Data validation and standardization
3. **Gold Layer (DLT)** - Initial business-level aggregations
4. **Platinum Layer (dbt)** - Final models for dashboards and analytics

## Exporting for Dashboards

To export data for the Retail Advisor dashboard:

```bash
# Export all dashboard models to JSON
./export_to_dashboard.sh

# Export specific models
./export_to_dashboard.sh --models marts.store_daily_metrics
```

## Testing

The project includes the following tests:

- Schema tests in `schema.yml` (not_null, unique, relationships)
- Custom data quality tests in `tests/`
- Performance tests for monitoring query execution

To run all tests:

```bash
dbt test
```

## Schema Documentation

To generate the schema documentation:

```bash
dbt docs generate
dbt docs serve
```

## Customization

- Edit `dbt_project.yml` to configure materialization strategies
- Adjust `schema.yml` for data quality tests and documentation