# Client360 Dashboard Implementation Guide

This document provides a comprehensive guide for implementing the Client360 Dashboard with full ETL pipeline integration.

## Overview

The Client360 Dashboard is a complete end-to-end solution that:

1. Ingests data from edge devices (Raspberry Pi) through Azure Event Hubs
2. Processes data through a medallion architecture (Bronze → Silver → Gold) using Databricks Delta Live Tables
3. Exposes the data through a Databricks SQL endpoint
4. Visualizes the data in an interactive dashboard hosted on Azure Static Web Apps

## Implementation Steps

### 1. Set Up Data Infrastructure

#### 1.1 Configure Event Hubs

Event Hubs are used to ingest real-time data from edge devices. To set up:

```bash
# Configure Event Hubs
./scripts/configure_event_hubs.sh
```

This script will:
- Create an Event Hub namespace if needed
- Create required Event Hubs (eh-pi-stt-raw, eh-pi-visual-stream, eh-device-heartbeat)
- Create consumer groups for different consumers
- Store the connection string in Azure Key Vault

#### 1.2 Set Up Databricks SQL Endpoint

Databricks SQL is used to query the processed data from the Delta tables:

```bash
# Set up Databricks SQL
./scripts/setup_databricks_sql.sh
```

This script will:
- Configure a Databricks SQL warehouse
- Create the necessary catalog and schema
- Generate and store access tokens in Key Vault
- Update environment configuration

#### 1.3 Deploy DLT Pipelines

Deploy the medallion architecture pipelines to Databricks:

```bash
# Deploy DLT pipelines
./scripts/deploy_dlt_pipelines.sh
```

This script will:
- Deploy the Bronze, Silver, and Gold layer pipelines
- Configure pipeline scheduling
- Upload and run a validation notebook
- Verify data flows through the layers correctly

### 2. Test Connectivity

#### 2.1 Test Databricks SQL Connectivity

Verify the SQL connector can connect to Databricks:

```bash
# Test SQL connectivity
./scripts/test_databricks_connectivity.sh
```

#### 2.2 Test End-to-End Dataflow

Test the complete data flow from Event Hub to Dashboard:

```bash
# Test end-to-end dataflow
./scripts/test_end_to_end_dataflow.sh
```

This script:
- Sends test events to Event Hub
- Verifies they appear in Bronze tables
- Checks transformation to Silver and Gold layers
- Tests SQL endpoint connectivity
- Validates dashboard connector functionality

### 3. Deploy the Dashboard

Deploy the dashboard to production:

```bash
# Deploy to production
./scripts/deploy-only-production.sh

# Verify deployment
./scripts/verify-production.sh
```

### 4. Production Go-Live

Execute the comprehensive go-live script:

```bash
# Full production go-live
./scripts/go_live_production.sh
```

This script orchestrates:
- Data infrastructure deployment
- Data connectivity testing
- Frontend dashboard deployment
- Monitoring and alerting setup
- Handover documentation creation

## Folder Structure

- `/data` - SQL connector and sample data
- `/scripts` - Deployment and testing scripts
- `/src` - Source code for the dashboard
  - `/src/connectors` - Event Hub and other connectors
  - `/src/components` - Dashboard UI components
- `/docs` - Documentation

## Key Files

- `data/sql_connector.js` - Databricks SQL connector with Key Vault integration
- `src/connectors/event_hub_connector.js` - Event Hub connector for real-time data
- `etl-deploy-kit.yaml` - Configuration for ETL deployment
- `scripts/go_live_production.sh` - Comprehensive go-live script

## Monitoring and Alerting

The deployment sets up:
- Azure Monitor alerts for the dashboard
- Data freshness monitoring
- Error rate monitoring

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify credentials in Key Vault
2. Check network connectivity
3. Ensure permissions are set correctly

### Data Flow Issues

If data is not flowing:

1. Check Event Hub connectivity
2. Verify DLT pipeline execution
3. Examine Databricks logs

## Next Steps

After successful implementation:

1. Set up regular monitoring
2. Schedule data freshness checks
3. Plan for scaling and optimization