# SKR Integration for dbt Models

This directory contains the integration between dbt models and the SKR (Sales Knowledge Repository) system.

## How It Works

1. dbt generates artifacts (manifest.json and catalog.json) during the model run
2. The on_run_end hook triggers the dbt_to_skr.py script
3. The script extracts metadata from dbt artifacts and creates SKR metadata files
4. These metadata files are synchronized with the SKR system

## Usage

### Adding SKR Metadata to Models

Use the `skr_metadata` macro in your model SQL files:

```sql
{{
  config(
    materialized = 'table'
  )
}}

-- Apply SKR metadata
{{ skr_metadata(
    resource_type = "model",
    owner = "scout_edge",
    tags = ["brand_intelligence", "geo_analysis"],
    metrics = ["brand_count", "region_count"]
) }}

SELECT
  ...
```

### Exporting Metadata Manually

Run the export script:

```bash
cd <project_dir>
dbt run  # Generates the latest artifacts
python skr_integration/dbt_to_skr.py \
  --manifest target/manifest.json \
  --catalog target/catalog.json \
  --template skr_integration/dbt_model_meta.yaml \
  --output-dir skr_integration/metadata
```

## Files

- `dbt_to_skr.py`: Python script that converts dbt metadata to SKR format
- `dbt_model_meta.yaml`: Template for generating SKR metadata
- `metadata/`: Directory containing generated SKR metadata files
- `dbt_on_run_end.sql`: dbt hook that runs after dbt models complete
- `../macros/skr_integration.sql`: dbt macros for SKR integration

## Integration with Kalaw

The generated metadata files can be automatically synced with Kalaw using the SKR indexer.
