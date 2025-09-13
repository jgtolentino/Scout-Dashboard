# Client360 Dashboard Handover Documentation

## Overview

The Client360 Dashboard is now live and fully operational. This document provides essential information for maintaining and extending the system.

## Dashboard Access

- **Production URL**: [https://proud-forest-0224c7a0f.6.azurestaticapps.net/](https://proud-forest-0224c7a0f.6.azurestaticapps.net/)
- **Resource Group**: `tbwa-client360-dashboard`
- **Static Web App**: `tbwa-client360-dashboard-production`
- **Databricks Workspace**: `adb-123456789012345.6.azuredatabricks.net`

## Architecture Components

### Frontend
- **Technology**: HTML/CSS/JavaScript with TBWA theme integration
- **Hosting**: Azure Static Web App with custom routing
- **Features**: Geospatial store mapping, brand analysis, transaction metrics
- **Rollback Component**: Built-in rollback functionality for quick recovery

### Backend
- **Data Processing**: Databricks Delta Live Tables (DLT)
- **Data Flow**: Bronze → Silver → Gold medallion architecture
- **Real-time Stream**: Azure Event Hubs integration (namespace: `eh-namespace-client360`)
- **Security**: Azure Key Vault for credential management (vault: `kv-client360`)

### Monitoring
- **Azure Monitor**: Metrics and alerts for dashboard performance
- **Data Freshness**: Automatic verification of data currency
- **Uptime Tests**: Periodic testing of dashboard availability

## Deployment Scripts

The following scripts are available for management and deployment:

- `./scripts/go_live_production.sh`: Full end-to-end deployment
- `./scripts/deploy-only-production.sh`: Deploy dashboard UI only
- `./scripts/verify-production.sh`: Verify deployment health
- `./scripts/test_end_to_end_dataflow.sh`: Test data flow
- `./scripts/setup_databricks_sql.sh`: Configure Databricks SQL
- `./scripts/cleanup-static-webapps.sh`: Remove orphaned resources
- `./scripts/enable_monitoring.sh`: Set up monitoring and alerts

## Data Sources

The dashboard connects to the following data sources:

1. **Databricks Gold Tables**:
   - `gold_store_interaction_metrics`
   - `gold_transcript_sentiment_analysis`
   - `gold_device_health_summary`
   - `gold_brand_mentions`

2. **Geospatial Data**:
   - Philippines regional outlines
   - Store location coordinates

3. **Simulation Mode**:
   - Sample data for development/testing
   - Toggle between simulation and live data

## Operations & Maintenance

### Regular Maintenance Tasks

1. **Monitor Data Freshness**:
   ```bash
   ./scripts/check_kpi_freshness.sh
   ```

2. **Verify System Health**:
   ```bash
   ./scripts/verify-production.sh
   ```

3. **Clean Up Orphaned Resources**:
   ```bash
   ./scripts/cleanup-static-webapps.sh
   ```

### Troubleshooting

If issues occur:

1. **Check Dashboard Logs**:
   - Azure Portal > Static Web Apps > tbwa-client360-dashboard-production > Logs

2. **Verify Databricks Connectivity**:
   ```bash
   ./scripts/test_databricks_connectivity.sh
   ```

3. **Rollback if Necessary**:
   - Use the built-in rollback component on the dashboard
   - Or execute: `./scripts/rollback_dashboard.sh`

### Updating the Dashboard

1. **Update Dashboard UI**:
   - Modify files in `/deploy` directory
   - Run `./scripts/deploy-only-production.sh`

2. **Update DLT Pipelines**:
   - Modify `.py` files in project root
   - Run `./scripts/deploy_dlt_pipelines.sh`

## Security & Access Control

- **Key Vault**: All credentials stored in Azure Key Vault
- **Managed Identity**: Used for secure access to resources
- **Databricks Tokens**: Rotated every 90 days

## Next Steps & Roadmap

1. **Enable Real-time Notifications**
2. **Integrate AI-generated Insights**
3. **Add New Visualization Components**
4. **Expand Regional Coverage**

## Contact Information

For support or questions:
- **Dashboard Team**: dashboard-support@tbwa.com
- **Data Engineering Team**: data-engineering@tbwa.com
- **Operations**: cloud-ops@tbwa.com

---

*Last updated: May 21, 2025*