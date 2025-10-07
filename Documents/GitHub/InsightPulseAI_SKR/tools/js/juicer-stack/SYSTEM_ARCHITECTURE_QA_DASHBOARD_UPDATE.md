# System Architecture & QA Dashboard Update

## Summary

The main dashboard has been successfully refactored to focus on System Architecture and QA monitoring, based on the Azure Well-Architected Framework. The client-focused insights have been moved to a separate dashboard.

## 🚀 Dashboard URLs

- **System Architecture & QA Dashboard**: [https://gentle-rock-04e54f40f.6.azurestaticapps.net](https://gentle-rock-04e54f40f.6.azurestaticapps.net) 
- **GenAI Insights Dashboard**: [https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html](https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html)
- **Retail Edge Dashboard**: [https://gentle-rock-04e54f40f.6.azurestaticapps.net/retail_edge/retail_edge_dashboard.html](https://gentle-rock-04e54f40f.6.azurestaticapps.net/retail_edge/retail_edge_dashboard.html)
- **Operations Dashboard**: [https://gentle-rock-04e54f40f.6.azurestaticapps.net/ops/system_dashboard.html](https://gentle-rock-04e54f40f.6.azurestaticapps.net/ops/system_dashboard.html)

## Changes Made

### 1. System Architecture & QA Dashboard (Main)

This dashboard now focuses exclusively on system architecture and QA metrics:

- **System Health Monitoring**: Shows KPIs aligned with Azure Well-Architected Framework
  - Model Reliability: 96.2%
  - Data Health: 94.8%
  - Infrastructure Uptime: 99.7%
  - Overall Health: 97.1%

- **Device Monitoring**: For edge/IoT device tracking
  - Total Devices: 156
  - Silent Devices: 3
  - Critical Alerts: 2
  - Data Quality: 98.7%

- **Anomaly Detection**: Added as requested
  - Drift Detection
  - Confidence Deviation
  - Outlier Rate

- **QA Dev Mode Toggle**: Added for QA testing and debugging

### 2. GenAI Insights Dashboard (Separate)

Created a separate dashboard focused on client-facing insights:

- Trending Tags
- Top Insights
- Brand Analysis
- Sentiment Analysis
- Actions & Recommendations

## Dashboard Structure

```
System Architecture & QA Dashboard (Main)
├── System Health Monitoring
│   ├── Model Reliability
│   ├── Data Health
│   └── Infrastructure Uptime
├── Device Monitoring
│   ├── Total Devices
│   ├── Silent Devices
│   └── Critical Alerts
├── Anomaly Detection
│   ├── Drift Detection
│   ├── Confidence Deviation
│   └── Outlier Rate
└── QA Developer Mode Toggle

GenAI Insights Dashboard (Separate)
├── Stats Cards
├── Charts
│   ├── Insights by Brand
│   └── Sentiment Trends
├── Trending Tags
└── Top Insights Cards
```

## Azure Well-Architected Framework Alignment

The System Architecture dashboard now aligns with Azure Well-Architected Framework principles:

- **Reliability**: Displayed via uptime metrics and silent device tracking
- **Security**: Implied through data quality and system health
- **Performance**: Tracked through model reliability metrics
- **Operational Excellence**: Supported by QA dev mode and anomaly detection

## Final Status

✅ **Fully Deployed**: All dashboards are successfully deployed to Azure
✅ **Well-Structured**: Clear separation of system architecture and client insights
✅ **White-Labeled**: All references properly converted (Pulser → OpsCore, etc.)
✅ **Cross-Navigation**: Links between dashboards for easy navigation