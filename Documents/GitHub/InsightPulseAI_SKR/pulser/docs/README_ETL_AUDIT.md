# Scout ETL Audit Framework

A comprehensive quality assurance and auditing framework for the Scout ETL pipeline, integrating with Caca, Tide, and Claudia for complete monitoring and reporting.

## Overview

The Scout ETL Audit Framework provides end-to-end quality assurance for the entire data pipeline, from bronze to gold layers. It implements:

- **Quality Checks**: Comprehensive validation of data quality, transformation integrity, and schema stability
- **Automatic Monitoring**: CI/CD integration for continuous validation
- **Historical Tracking**: Trend analysis and drift detection
- **Interactive Dashboard**: Visual monitoring of ETL health
- **Notification System**: Alerts for critical issues
- **Traceability**: Full audit trail through Tide tracing

## Getting Started

### Prerequisites

- Scout ETL Pipeline (DLT/dbt)
- Node.js 14+ for dashboard and auditing tools
- Caca quality framework
- Tide tracing framework
- Claudia for report generation

### Installation

1. Add the ETL audit job to your CI/CD pipeline:

```bash
# Add to your CI/CD configuration
cat ci_cd_etl_audit.yaml >> .github/workflows/etl_pipeline.yml
```

2. Configure quality checks for your medallion layers:

```bash
# Review and customize checks
vi etl_quality_checks.yaml
```

3. Set up the dashboard:

```bash
# Create dashboard directory
mkdir -p dashboards/etl_quality/data
cp -r dashboards/etl_quality/* /path/to/web/server/etl_quality/
```

## Usage

### Running Manual Audits

```bash
# Run a comprehensive ETL audit
caca run --config etl_quality_checks.yaml --output logs/etl_audit.json

# Audit schema stability
node scripts/etl_schema_validator.js --schema-dir=dbt_project/models --baseline=schema_registry/baseline --output=logs/schema_diff.json

# Update dashboard with latest results
node scripts/update_etl_dashboard.js --data-dir=logs/etl_audit/$(date +%Y-%m-%d) --output=dashboards/etl_quality
```

### Adding Custom Checks

Edit `etl_quality_checks.yaml` to add new quality checks:

```yaml
silver_checks:
  # Add a custom check
  - id: my_custom_check
    description: "Verify my custom logic"
    query: |
      SELECT COUNT(*) AS my_metric
      FROM my_custom_table
      WHERE condition_x > threshold_y
    severity: ERROR
    threshold: 0
    message: "Custom check failed with {my_metric} violations"
```

### Setting Up Weekly Reports

Create a cron job to generate weekly reports:

```bash
# Add to crontab
0 8 * * MON /usr/bin/env bash -c 'cd /path/to/project && node tools/js/scripts/generate_weekly_report.js'
```

## Component Documentation

### 1. ETL Quality Checks

The `etl_quality_checks.yaml` file defines checks across all medallion layers:

- **Bronze Checks**: Data completeness, ingestion latency, schema compliance
- **Silver Checks**: Transformation quality, enrichment validation
- **Gold Checks**: Aggregation accuracy, business rule validation
- **Cross-Layer Checks**: End-to-end consistency and traceability

### 2. CI/CD Integration

The `ci_cd_etl_audit.yaml` file provides:

- Automated test execution after ETL runs
- Quality gate enforcement
- Artifact collection and storage
- Notification routing
- Dashboard updates

### 3. Schema Validation

The `etl_schema_validator.js` script provides:

- Schema fingerprinting and drift detection
- Column-level change tracking
- Integration with schema registry
- Markdown report generation

### 4. ETL Quality Dashboard

The dashboard provides visual monitoring of:

- Overall pipeline health
- Layer-specific metrics
- Schema stability trends
- Row count monitoring
- Data quality scores
- Recent issues

## Integration with Scout System

### Tide Tracing Integration

Every ETL run is traced through Tide:

```javascript
// Record ETL execution in Tide
tide record-trace \
  --operation "etl_pipeline_run" \
  --components "bronze,silver,gold" \
  --artifacts "logs/etl_audit.json,logs/schema_diff.json" \
  --out logs/tide_trace.json
```

### Claudia Integration

Claudia generates comprehensive reports:

```bash
# Generate weekly report
claudia run etl-health-report \
  --lookback 7 \
  --output-dir reports/etl_health/$(date +%Y-%m-%d) \
  --format html,pdf,md
```

### Caca Integration

Caca provides the quality assurance engine:

```bash
# Run quality checks
caca run --config etl_quality_checks.yaml --output logs/etl_audit.json
```

## Advanced Features

### Row Count Anomaly Detection

The framework includes statistical anomaly detection for row counts:

```yaml
# In etl_quality_checks.yaml
- id: row_count_anomaly_detection
  type: anomaly_detection
  tables:
    - silver_annotated_events
    - gold_insight_aggregates
  lookback_days: 30
  confidence: 0.95
  severity: WARNING
```

### Business Logic Validation

Validate complex business rules:

```yaml
# In etl_quality_checks.yaml
- id: business_logic_validation
  description: "Verify KPI calculation logic"
  query: |
    WITH raw_metrics AS (
      SELECT sale_amount, discount_amount FROM gold_sales
    ),
    calculated_metrics AS (
      SELECT
        SUM(sale_amount) AS total_sales,
        SUM(discount_amount) / SUM(sale_amount) * 100 AS discount_pct
      FROM raw_metrics
    )
    SELECT
      CASE WHEN discount_pct > 40 THEN 'High discount ratio'
           WHEN total_sales < 1000 THEN 'Low sales volume'
           ELSE 'OK' END AS status
    FROM calculated_metrics
  severity: WARNING
  condition: "status != 'OK'"
  message: "Business logic validation failed: {status}"
```

## Troubleshooting

Common issues and solutions:

1. **Missing Data Files**: Ensure ETL pipeline output directories exist
   ```bash
   mkdir -p logs/etl_audit/$(date +%Y-%m-%d)
   ```

2. **Dashboard Not Updating**: Check file permissions
   ```bash
   chmod -R 755 dashboards/etl_quality/
   ```

3. **Schema Validation Errors**: Ensure schema registry is up to date
   ```bash
   node scripts/update_schema_registry.js
   ```

## Best Practices

1. **Start Small**: Begin with critical metrics, then expand
2. **Layer Separation**: Keep checks organized by medallion layer
3. **Threshold Tuning**: Gradually tighten thresholds as pipeline stabilizes
4. **Alert Management**: Use severity levels to prevent alert fatigue
5. **Historical Analysis**: Maintain long-term audit history for trend analysis

## Contributing

Guidelines for contributing to the ETL audit framework:

1. Add new checks to appropriate layer sections
2. Include clear descriptions and meaningful error messages
3. Test new checks on development pipeline first
4. Document thresholds and reasoning
5. Update this README with significant changes

## License

This Scout ETL Audit Framework is proprietary to InsightPulseAI.