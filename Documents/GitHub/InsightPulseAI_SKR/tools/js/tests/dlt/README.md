# DLT Quality Checks and Schema Validation

This directory contains tests for validating the quality and schema of data in our DLT (Data Loading Tool) pipeline across the Bronze, Silver, and Gold layers of our medallion architecture.

## Overview

The quality and schema validation framework consists of:

1. A YAML configuration file that defines expectations for each table
2. PyTest-based test modules that validate these expectations
3. A schema validation utility for dynamically validating table schemas
4. CI/CD integration via GitHub Actions

## Configuration

Quality expectations are defined in `dlt_quality_checks.yaml` at the repo root. This file defines:

- Global settings (alerting, thresholds)
- Layer-specific expectations (Bronze, Silver, Gold)
- Cross-table relationships
- Data freshness requirements

### Configuration Structure

```yaml
# DLT Quality Checks Configuration
version: "1.0"
description: "Quality checks for Scout DLT pipeline"

# Global settings
settings:
  log_level: INFO
  alert_threshold: ERROR
  expectation_threshold: 0.99
  fail_pipeline_on_error: true
  notification_channel: "slack:scout-alerts"

# Layer expectations
bronze_expectations:
  bronze_events:
    table: "bronze_events"
    expectations:
      - name: "not_null_event_id"
        type: "column_values_not_null"
        column: "event_id"
        threshold: 1.0
        severity: "ERROR"
      # More expectations...

# Cross-table expectations
cross_table_expectations:
  bronze_to_silver_completeness:
    expectation: "table_a_ids_in_table_b"
    table_a: "bronze_events"
    table_b: "silver_enriched_events"
    id_column_a: "event_id"
    id_column_b: "source_event_id"
    threshold: 0.99
    severity: "ERROR"
  # More cross-table expectations...
```

## Test Files

### PyTest Fixtures (`conftest.py`)

Contains fixtures that load sample data for testing and define expected schemas:

- Spark session setup
- Fixed schema definitions for each table
- Fixtures for loading test data for each layer
- Quality check configuration loader

### Layer Tests

- `test_bronze.py`: Tests Bronze layer tables and expectations
- `test_silver.py`: Tests Silver layer tables and expectations
- `test_gold.py`: Tests Gold layer tables and expectations

Each layer test file contains:
- Schema validation tests
- Data quality tests
- Cross-layer relationship tests
- Data freshness tests

### Schema Validator (`schema_validator.py`)

Utility module for dynamically generating and validating schemas:

- Functions to parse quality check configurations into PySpark schemas
- Schema validation utilities for dataframes
- Helpers for extracting schema information from the quality check config

## Running Tests

### Local Testing

```bash
# From the repo root
cd tools/js
python -m pytest tests/dlt -v
```

### CI/CD Integration

Tests run automatically in the GitHub Actions workflow in `.github/workflows/unified-pipeline.yml`. This workflow:

1. Runs all DLT tests with reporting
2. Validates the quality check configuration
3. Performs schema validation checks
4. Combines test results into a consolidated report
5. Uploads artifacts for inspection
6. Notifies via Slack on failures

## Adding New Tests

To add tests for a new table:

1. Add expectations to `dlt_quality_checks.yaml`
2. Create test fixtures with sample data in `conftest.py`
3. Add test functions to the appropriate layer test file
4. Update cross-table expectations if needed

## Best Practices

- Always run schema validation before data validation
- Define clear expectations with appropriate thresholds
- Include cross-table relationship checks for data integrity
- Set severity levels appropriate to the business impact
- Prioritize critical fields with 100% validation (threshold: 1.0)