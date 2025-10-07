# Scout Delta Live Tables (DLT) Pipeline for Edge Device Integration

## ⚠️ ROLLBACK NOTICE (May 19, 2025)

This branch (`rollback-dashboard-2025-05-19`) contains a rollback of the AudioURL field deprecation. The AudioURL field has been restored to maintain dashboard compatibility and functionality.

- See [DASHBOARD_ROLLBACK_SUMMARY.md](./DASHBOARD_ROLLBACK_SUMMARY.md) for details
- See [DASHBOARD_ROLLBACK_GUIDE.md](./DASHBOARD_ROLLBACK_GUIDE.md) for implementation steps
- Run `./rollback_demo.sh` for a demonstration of the rollback process

This package contains a real-time Medallion architecture implementation for the Scout system using Databricks Delta Live Tables with dbt integration. It is specifically designed to process data from Raspberry Pi edge devices equipped with STT (speech-to-text) and OpenCV (visual signals) capabilities.

## Table of Contents

- [Rollback Information](#-rollback-notice-may-19-2025)

- [Contents](#contents)
- [Event Hub Architecture](#event-hub-architecture)
- [Medallion Architecture](#medallion-architecture)
- [Database Schema Improvements](#database-schema-improvements)
- [DLT and dbt Integration](#dlt-and-dbt-integration)
- [Deployment Instructions](#deployment-instructions)
- [Data Flow](#data-flow)
- [Raspberry Pi Client](#raspberry-pi-client)
- [Azure Infrastructure](#azure-infrastructure)
- [Pulser Integration](#pulser-integration)
- [Notes](#notes)

## Contents

### DLT Pipeline
- `scout_bronze_dlt.py`: Ingests raw speech-to-text and OpenCV visual data from Raspberry Pi devices via Event Hubs
- `scout_silver_dlt.py`: Processes and validates data, creating semantic interaction events and device health monitoring
- `scout_gold_dlt.py`: Aggregates insights, metrics, and analytics for dashboards and feedback loops

### Database Migrations
- `migrations/add_missing_columns.sql`: SQL script to add required columns for pipeline integrity

### dbt Project
- `dbt_project/`: Contains the dbt models for transforming data for the dashboard
  - `models/`: SQL transformation models
  - `macros/`: Helper functions for exporting data
  - `dbt_project.yml`: Project configuration

### Deployment
- `terraform/`: Infrastructure as Code for Event Hub provisioning
- `pi_client/`: Raspberry Pi edge device client code
- `deploy_pipeline.sh`: Deployment script for the DLT pipeline
- `pulser_config.yaml`: Configuration for Pulser task automation

## Event Hub Architecture

| Event Hub Name           | Purpose                                          | Tier       | Notes                                               |
| ------------------------ | ------------------------------------------------ | ---------- | --------------------------------------------------- |
| `eh-pi-stt-raw`          | Raw speech-to-text transcripts                   | **Bronze** | Raw Whisper output, unprocessed                     |
| `eh-pi-visual-stream`    | OpenCV detections (face, gestures, zones)        | **Bronze** | Bounding boxes, motion, timestamped signal metadata |
| `eh-pi-annotated-events` | Combined signal events (e.g., "Greeted + Asked") | **Silver** | Semantic signal fusion (multimodal context)         |
| `eh-insight-feedback`    | Generated insight feedback from advisors         | **Gold**   | Includes GPT-based actions taken or dismissed       |
| `eh-device-heartbeat`    | Device health, uptime, location                  | **Silver** | Optional for remote monitoring and diagnostics      |

## Medallion Architecture

### Bronze Layer
- `bronze_stt_raw`: Raw speech-to-text data from Raspberry Pi devices
- `bronze_visual_stream`: Raw OpenCV detection data from Raspberry Pi devices

### Silver Layer
- `silver_annotated_events`: Semantically meaningful interaction events
- `silver_device_heartbeat`: Device health and diagnostic data
- `silver_multimodal_aligned`: Aligned speech and visual data (when not pre-annotated)

### Gold Layer
- `gold_insight_feedback`: Feedback from advisor interactions with AI insights
- `gold_store_interaction_metrics`: Aggregated interaction metrics by store
- `gold_device_health_summary`: Aggregated device health metrics
- `gold_transcript_sentiment_analysis`: Sentiment analysis of customer transcripts

### Platinum Layer (dbt)
- `sales_interactions_enriched`: Enriched sales interactions with brand and transcript data
- `store_daily_metrics`: Daily store performance metrics
- `brand_performance_metrics`: Brand performance analysis
- `device_performance_metrics`: Device health and performance metrics
- `customer_session_metrics`: Customer session analysis

## Database Schema Improvements

The following improvements have been made to the database schema to ensure pipeline integrity:

1. **Added Missing Timestamp Fields**
   - `SalesInteractionBrands.CreatedAtUtc`
   - `SalesInteractions.IngestedAt`
   - `bronze_device_logs.IngestedAt`

2. **Added IsActive Fields for Soft Delete**
   - `Customers.IsActive`
   - `Products.IsActive`
   - `Stores.IsActive`

3. **Added Foreign Key Alignments**
   - Created proper indexes for all join relationships

4. **Added Device Mapping Metadata**
   - Created new `EdgeDeviceRegistry` table

5. **Added Source Tracking**
   - `bronze_transcriptions.SourceFile`
   - `bronze_vision_detections.ZoneID` and `CameraAngle`
   - `SalesInteractions.SessionID`

6. **Added Session Anchoring**
   - `SalesInteractions.SessionStart` and `SessionEnd`

7. **Added NLP Optimization Fields**
   - `SalesInteractionTranscripts.WordCount` and `LangCode`
   - Created `TranscriptChunkAudit` table for quality scoring

## DLT and dbt Integration

This project demonstrates a complete end-to-end data pipeline using:

1. **DLT (Delta Live Tables)** for:
   - Real-time data ingestion from Event Hubs
   - Data validation and quality checks
   - Initial transformations and aggregations

2. **dbt (data build tool)** for:
   - Business-level transformations
   - Complex analytics models
   - Dashboard-ready datasets
   - Data exports for visualization

The integration works as follows:
- DLT tables are registered in the Databricks metastore
- dbt models reference these tables using the `ref()` function
- dbt transformations create final marts layer tables
- Export scripts convert these tables to JSON for the dashboard

## Deployment Instructions

### DLT Pipeline Deployment

1. Open Databricks Workspace and navigate to Delta Live Tables.
2. Click "Create Pipeline" and name it `ScoutDLT`.
3. Choose "Continuous" mode and select a cluster with Photon enabled.
4. Attach this repo or upload all Python files.
5. Configure Event Hub connection details in your Databricks cluster:
   - Set `spark.eventhub.connectionString` in your cluster configuration
   - Or use Azure Key Vault-backed secret scopes
6. Set target schema/database to: `scout_lakehouse`

### Schema Migration

Before running the pipeline, apply the necessary schema changes:

```bash
# For SQL Server
sqlcmd -S server -d RetailAdvisorDB -i migrations/add_missing_columns.sql

# For PostgreSQL
psql -d RetailAdvisorDB -f migrations/add_missing_columns.sql
```

### dbt Deployment

1. Configure your dbt profile:

```yaml
# ~/.dbt/profiles.yml
scout_retail_advisor:
  target: dev
  outputs:
    dev:
      type: sqlserver
      driver: 'ODBC Driver 17 for SQL Server'
      server: your-server.database.windows.net
      database: RetailAdvisorDB
      schema: dbo
      user: dbt_user
      password: your_password
```

2. Run the dbt models:

```bash
cd dbt_project
dbt deps
dbt run
```

3. Export data for the dashboard:

```bash
./export_to_dashboard.sh
```

## Data Flow

1. **Edge Processing**: Raspberry Pi devices process audio via STT and video via OpenCV
2. **Event Publishing**: Devices publish events to respective Event Hubs
3. **Bronze Ingestion**: DLT pipeline ingests raw events
4. **Silver Processing**: Events are validated, aligned, and semantically processed
5. **Gold Analytics**: Business-level metrics and insights are generated
6. **Platinum Processing**: dbt models transform data for specific business needs
7. **Dashboard Integration**: Exported JSON files feed directly into the Retail Advisor dashboard

## Raspberry Pi Client

The `pi_client/` directory contains:
- `stt_visual_client.py`: Client code for audio/video processing and event publishing
- `install_requirements.sh`: Script to install required dependencies
- `README.md`: Instructions for setting up and running the client

## Azure Infrastructure

The `terraform/` directory contains Infrastructure as Code for:
- Event Hub namespace and Event Hubs
- Authorization rules and consumer groups
- Storage accounts for Event Hub capture
- Required Azure resources

## Pulser Integration

To deploy this pipeline through Pulser task automation:

```bash
# Deploy everything
:deploy scout-dlt

# Deploy only infrastructure
:deploy scout-dlt-infra

# Deploy only pipeline
:deploy scout-dlt-pipeline
```

## Notes

- The pipeline uses `@expect` annotations for data quality validation and monitoring
- For high-volume deployments, consider enabling Auto Scaling on your DLT cluster
- Implement proper security measures around Event Hub connection strings
- For device management, consider using Azure IoT Hub alongside Event Hubs
- The dbt models are configured for incremental processing to handle real-time data
- The migration script includes checks to prevent re-adding columns that already exist

## Rollback Tools and Files

- `rollback_pipeline.sh`: Script to automate the rollback process
- `migrations/restore_audio_url.sql`: SQL script to restore the AudioURL field in the database
- `pi_deployment_sim/update_pi_clients.sh`: Script to update Raspberry Pi clients
- `sample_data/rollback_test_data.json`: Test data with AudioURL field for validation
- `rollback_demo.sh`: Demonstration script showing the rollback process