# Comprehensive Implementation Guide for Scout DLT Pipeline

## Overview

This document provides a comprehensive guide to the implementation, deployment, and management of the Scout Delta Live Tables (DLT) Pipeline for FMCG Sari-Sari Store data integration with the Client360 Dashboard. The pipeline follows a Medallion architecture pattern to process data from edge devices through bronze, silver, and gold layers.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Flow](#data-flow)
- [Component Details](#component-details)
- [Deployment Instructions](#deployment-instructions)
- [Testing and Validation](#testing-and-validation)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Rollback Procedures](#rollback-procedures)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Appendix](#appendix)

## Architecture Overview

### Medallion Architecture

The Scout DLT Pipeline implements a three-layer Medallion architecture:

1. **Bronze Layer**: Raw data ingestion from edge devices
   - `bronze_stt_raw`: Raw speech-to-text data
   - `bronze_visual_stream`: Raw OpenCV detection data
   - `bronze_raw_events`: Legacy combined events table

2. **Silver Layer**: Validated and enriched data
   - `silver_annotated_events`: Semantic interaction events
   - `silver_device_heartbeat`: Device health data
   - `silver_multimodal_aligned`: Time-aligned speech and visual data

3. **Gold Layer**: Business-level metrics and analytics
   - `gold_insight_feedback`: Feedback on AI-generated insights
   - `gold_store_interaction_metrics`: Store-level interaction metrics
   - `gold_device_health_summary`: Device health summary
   - `gold_transcript_sentiment_analysis`: Sentiment analysis from transcripts

### Infrastructure Components

The solution utilizes the following Azure services:

- **Azure Event Hubs**: For real-time data ingestion from edge devices
- **Azure Databricks**: For data processing using Delta Live Tables
- **Azure Key Vault**: For secure credential storage
- **Azure SQL Database/PostgreSQL**: For the relational database
- **Azure Static Web Apps**: For hosting the Client360 Dashboard

## Data Flow

1. **Edge Collection**:
   - Raspberry Pi devices collect audio (speech) and visual (camera) data
   - Data is processed locally using Whisper (speech-to-text) and OpenCV (computer vision)
   - Processed data is sent to respective Event Hubs

2. **Data Ingestion**:
   - DLT Bronze layer ingests raw data from Event Hubs
   - Schema validation and initial transformations occur

3. **Data Processing**:
   - Silver layer aligns multimodal data and applies business logic
   - Quality checks ensure data integrity

4. **Analytics Generation**:
   - Gold layer generates business metrics and insights
   - Aggregated KPIs are created for dashboard visualization

5. **Dashboard Integration**:
   - Client360 Dashboard connects to the Gold layer via Databricks SQL
   - Real-time metrics are displayed with fallback to simulation mode

## Component Details

### DLT Pipeline Files

- **Bronze Layer** (`scout_bronze_dlt.py`):
  - Defines the schema for speech and visual data
  - Creates tables for raw data ingestion
  - Handles data type conversions and timestamp normalization

- **Silver Layer** (`scout_silver_dlt.py`):
  - Implements data validation with `@expect` annotations
  - Aligns multimodal data using windowing techniques
  - Processes device health information

- **Gold Layer** (`scout_gold_dlt.py`):
  - Aggregates metrics by store and time window
  - Performs sentiment analysis on transcripts
  - Generates actionable insights for advisors

### Database Components

- **Migration Scripts**:
  - `add_missing_columns.sql`: Ensures required fields exist
  - `restore_audio_url.sql`: Handles rollback of specific field removal
  - `sari_sari_schema_enhancements.sql`: Adds store-specific metrics

- **Core Tables**:
  - Store information and hierarchy (regions, provinces, cities, barangays)
  - Brand and product catalogs
  - Interaction events and transcripts
  - Device registry and health metrics

### Dashboard Integration

- **SQL Connector** (`sql_connector.js`):
  - Generic SQL connector for database access
  - Supports simulation mode for offline development

- **Databricks SQL Connector** (`databricks_sql_connector.js`):
  - Specialized connector for Databricks SQL endpoints
  - Integrates with Azure Key Vault for secure credential management
  - Includes caching and telemetry

## Deployment Instructions

### Prerequisites

- Azure account with appropriate permissions
- Terraform CLI (v1.0+)
- Databricks CLI
- Azure CLI
- Node.js and npm
- SQL Server tools (sqlcmd) or PostgreSQL tools (psql)

### End-to-End Deployment

The `deploy_end_to_end.sh` script automates the full deployment process:

```bash
# Make the script executable
chmod +x deploy_end_to_end.sh

# Run the deployment
./deploy_end_to_end.sh
```

This script:
1. Verifies required tools are installed
2. Creates necessary Azure resources
3. Deploys Event Hub infrastructure via Terraform
4. Configures Azure Key Vault and stores secrets
5. Deploys the DLT pipeline to Databricks
6. Runs database migrations
7. Deploys the Client360 Dashboard

### Manual Deployment Steps

If you prefer to deploy each component separately:

1. **Azure Resources**:
   ```bash
   az group create --name rg-scout-eventhub --location eastus2
   az keyvault create --name kv-client360 --resource-group rg-scout-eventhub --location eastus2
   ```

2. **Event Hub Infrastructure**:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

3. **Databricks DLT Pipeline**:
   ```bash
   ./deploy_pipeline.sh
   ```

4. **Database Migrations**:
   ```bash
   sqlcmd -S server -d RetailAdvisorDB -i migrations/add_missing_columns.sql
   ```

5. **Client360 Dashboard**:
   ```bash
   cd client360_dashboard
   ./deploy_to_azure.sh
   ```

## Testing and Validation

### DLT Pipeline Testing

1. **Event Hub Testing**:
   - Use the sample data generator in `sample_data/` to publish test events
   - Verify events are received in the respective Event Hubs

2. **Data Processing Validation**:
   - Check that bronze tables are correctly populated
   - Verify silver layer data validation is working
   - Confirm gold layer aggregations are accurate

3. **End-to-End Testing**:
   ```bash
   ./test_sari_sari_analytics.sh
   ```

### Dashboard Testing

1. **Connection Testing**:
   - Verify Databricks SQL connection
   - Test Key Vault integration
   - Validate simulation mode fallback

2. **UI Testing**:
   - Check responsive design
   - Verify KPI calculations
   - Test filter functionality

## Monitoring and Maintenance

### Databricks Monitoring

- Monitor DLT pipeline execution in Databricks UI
- Set up alerts for pipeline failures
- Review data quality metrics from `@expect` annotations

### Dashboard Monitoring

- Client360 Dashboard includes a built-in health check page
- Monitor API response times and error rates
- Set up Azure Application Insights for deeper monitoring

### Regular Maintenance Tasks

1. **Data Cleanup**:
   - Archive older data to control storage costs
   - Optimize Delta tables

2. **Security Updates**:
   - Rotate database credentials
   - Update dependencies

3. **Performance Optimization**:
   - Review query performance
   - Adjust data retention policies

## Rollback Procedures

### Automated Rollback

Use the provided rollback scripts in case of issues:

```bash
# Rollback DLT pipeline
./rollback_pipeline.sh

# Rollback dashboard
cd client360_dashboard
./execute_rollback.sh
```

### Manual Rollback Steps

1. **Pipeline Rollback**:
   - Pause the DLT pipeline in Databricks
   - Revert to the previous version
   - Restart the pipeline

2. **Database Rollback**:
   - Run `migrations/restore_audio_url.sql` to restore removed fields
   - Verify database integrity

3. **Dashboard Rollback**:
   - Deploy the previous version from backups
   - Verify functionality

## Security Considerations

### Data Protection

- Event Hub data encrypted in transit and at rest
- Databricks workspaces use workspace-level encryption
- SQL connectors use secure credential management

### Authentication

- Azure Key Vault for central secret management
- Managed Identities for Azure resources where possible
- Token-based authentication for Databricks SQL

### Network Security

- VNet integration for Databricks
- Private endpoints for Key Vault
- Network security groups for resource isolation

## Troubleshooting

### Common Issues

1. **Event Hub Connection Issues**:
   - Verify connection strings in Key Vault
   - Check network connectivity
   - Examine Event Hub logs

2. **DLT Pipeline Failures**:
   - Check data validation rules
   - Verify Event Hub connectivity
   - Examine cluster logs

3. **Dashboard Connectivity Issues**:
   - Verify Databricks SQL endpoint is active
   - Check Key Vault access policies
   - Test connection with simulation mode

### Diagnostic Tools

- Use `az monitor` commands to check Azure resource health
- Review Databricks logs for pipeline errors
- Check dashboard's built-in diagnostic page

## Appendix

### Environment Variables

Key environment variables used by the system:

```
DATABRICKS_HOST=https://adb-xxxx.azuredatabricks.net
DATABRICKS_TOKEN=dapi_xxxxx
RESOURCE_GROUP_NAME=rg-scout-eventhub
KEY_VAULT_NAME=kv-client360
SIMULATION_MODE=true|false
DB_SERVER=your-sql-server.database.windows.net
DB_NAME=RetailAdvisorDB
DB_USER=admin
DB_PASSWORD=your-password
```

### Related Documentation

- [Databricks Delta Live Tables Documentation](https://docs.databricks.com/delta-live-tables/index.html)
- [Azure Event Hubs Documentation](https://docs.microsoft.com/en-us/azure/event-hubs/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Client360 Dashboard Documentation](./client360_dashboard/README.md)
- [Raspberry Pi Client Documentation](./pi_client/README.md)

### Support and Contact

For issues or questions about this implementation:

- File an issue in the project repository
- Contact the Scout Data Engineering team
- Consult the project documentation

---

**Last Updated**: May 2025
**Version**: 2.3.0