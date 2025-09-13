# 🚀 Scout Real-Time BI Genie - Deployment Guide

## Overview

This guide walks you through deploying the **Scout Real-Time BI Genie** dashboard with CDC streaming from Azure SQL to Power BI.

## ✅ Prerequisites Completed

1. **CDC Enabled** on Azure SQL Database ✅
   - Database: `SQL-TBWA-ProjectScout-Reporting-Prod`
   - 11 tables with CDC tracking enabled
   
2. **POC Schema Created** ✅
   - Schema: `poc`
   - 980 rows loaded across 9 tables

3. **Configuration Files Generated** ✅
   - `scout_realtime_bi_genie.yaml` - Complete dashboard specification
   - `streaming_dataset_config.json` - Power BI dataset configuration
   - `eventstream_transform_config.json` - Transformation rules
   - `stream_monitoring_queries.kql` - KQL monitoring queries
   - `streaming_dax_measures.dax` - DAX measures for real-time KPIs

## 📋 Deployment Steps

### Step 1: Create Power BI Streaming Dataset

1. Go to [Power BI Service](https://app.powerbi.com)
2. Navigate to your **Scout** workspace
3. Click **+ New** → **Streaming dataset**
4. Choose **API** option
5. Use the schema from `streaming_dataset_config.json`
6. Save the Push URL for later use

### Step 2: Configure Eventstream

1. In Power BI Service, go to **Eventstream**
2. Click **+ New eventstream**
3. Name it: `scout_realtime_stream`
4. Add Source:
   - Type: **Azure SQL Database (CDC)**
   - Server: `sqltbwaprojectscoutserver.database.windows.net`
   - Database: `SQL-TBWA-ProjectScout-Reporting-Prod`
   - Tables: Select CDC-enabled tables
5. Add Transformations from `eventstream_transform_config.json`
6. Add Destination:
   - Type: **Power BI Dataset**
   - Dataset: `cdc_stream_sales_dataset`

### Step 3: Create Power BI Report

1. In Power BI Desktop:
   - Connect to streaming dataset
   - Import DAX measures from `streaming_dax_measures.dax`
   - Build visuals based on `scout_realtime_bi_genie.yaml`

2. Create Pages:
   - **Realtime Monitor** - Live KPIs and charts
   - **CDC Audit Trail** - Change tracking table
   - **Anomaly Detection** - Outlier visualization

### Step 4: Configure Auto-Refresh

1. Publish report to Scout workspace
2. Go to dataset settings
3. Enable:
   - **Automatic page refresh** (5 seconds for Realtime Monitor)
   - **DirectQuery** for live connection
   - **Keep your data up to date** toggle

### Step 5: Set Up Monitoring

1. In Azure Monitor:
   - Import KQL queries from `stream_monitoring_queries.kql`
   - Create alerts for:
     - Stream lag > 60 seconds
     - No data for 5 minutes
     - Anomaly detection threshold

2. Configure notifications:
   - Email alerts
   - Teams integration
   - Auto-restart on failure

## 🎯 Dashboard Features

### Real-Time Capabilities
- **Live Revenue Tracking** - 5-minute rolling window
- **Transaction Velocity** - Per-minute transaction count
- **CDC Lag Monitor** - Stream health indicator
- **Anomaly Detection** - 3-sigma outlier flagging

### Visual Components
- KPI Cards with live updates
- Streaming line charts
- Real-time bar charts for brand performance
- CDC audit trail table
- Store performance matrix

### Mobile Experience
- Responsive layout
- Touch-optimized controls
- Simplified KPI view
- Swipe navigation

## 🔧 Troubleshooting

### Stream Not Working
1. Check CDC is enabled: Run `enable_cdc_tables.py`
2. Verify Eventstream status in Power BI
3. Check firewall rules for SQL Server

### High Latency
1. Review transformation complexity
2. Check SQL Server performance
3. Optimize streaming dataset schema

### Missing Data
1. Verify CDC capture instance is active
2. Check SQL permissions
3. Review filter conditions in transforms

## 📊 Sample Queries

### Live Revenue Check
```sql
SELECT 
    SUM(total_amount) as live_revenue,
    COUNT(*) as transaction_count
FROM cdc_stream_sales_dataset
WHERE timestamp > DATEADD(minute, -5, GETUTCDATE())
```

### Stream Health Check
```sql
SELECT 
    MAX(timestamp) as last_record,
    DATEDIFF(second, MAX(timestamp), GETUTCDATE()) as lag_seconds
FROM cdc_stream_sales_dataset
```

## 🚀 Next Steps

1. **Enhance with AI**
   - Add Azure Cognitive Services for sentiment analysis
   - Implement ML-based anomaly detection
   - Create predictive sales forecasts

2. **Scale Out**
   - Add more CDC tables
   - Implement data archival strategy
   - Create historical comparison views

3. **Integrate with Teams**
   - Embed dashboard in Teams channel
   - Configure push notifications
   - Add collaborative annotations

## 📞 Support

For issues or enhancements:
- Workspace: Scout
- Dataset: cdc_stream_sales_dataset
- Stream: scout_realtime_stream

---

**Last Updated**: 2025-06-25
**Version**: 1.0
**Status**: Ready for Deployment