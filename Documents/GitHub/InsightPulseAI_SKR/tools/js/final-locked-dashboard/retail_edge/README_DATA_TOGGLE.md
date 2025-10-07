# Data Source Toggle and Medallion Architecture Integration

This document provides information about the data source toggle and Medallion data architecture integration in the Retail Edge dashboard.

## Overview

The data source toggle allows switching between real API data and simulated data for development, testing, and demonstration purposes. The Medallion data architecture provides a structured approach to data access, with four layers:

- **Bronze Layer**: Raw, unprocessed data
- **Silver Layer**: Cleaned and standardized data
- **Gold Layer**: Enriched and aggregated data
- **Platinum Layer**: AI-generated insights and analytics

## Features

- Toggle between real API data and simulated local data
- Consistent visual indicators showing the current data source
- Persistent user preference using localStorage
- Automatic data refresh when toggling data sources
- Support for filters (time range, region, store type)
- Integration with dashboard charts and KPIs

## Files Structure

- `js/data_source_toggle.js` - Toggle UI component
- `js/medallion_data_connector.js` - Data connector for Bronze/Silver/Gold/Platinum layers
- `js/dashboard_integrator.js` - Dashboard integration layer
- `assets/data/simulated/*.json` - Simulated data files:
  - `bronze_events.json` - Raw events data
  - `silver_brand_mentions.json` - Brand mentions data
  - `gold_topic_analysis.json` - Topic analysis data
  - `platinum_insights.json` - AI-generated insights
  - `dashboard_summary.json` - Dashboard summary data

## Usage

1. The toggle is automatically initialized when the dashboard loads
2. Click the toggle switch to change between real and simulated data
3. The dashboard will immediately refresh with the new data source
4. Visual indicators (LIVE/DEMO badges) show the current data source
5. Your preference is saved and will persist between sessions

## Adding to New Dashboards

To add this functionality to additional dashboards:

1. Include the required JS files:
```html
<script src="js/data_source_toggle.js"></script>
<script src="js/medallion_data_connector.js"></script>
<script src="js/dashboard_integrator.js"></script>
```

2. Create a container element for the toggle:
```html
<div id="data-source-toggle-container"></div>
```

3. Initialize the dashboard integrator:
```javascript
document.addEventListener('DOMContentLoaded', function() {
  window.dashboardIntegrator = new DashboardIntegrator({
    // Optional configuration parameters
    defaultUseRealData: false,
    dataToggleContainerId: 'data-source-toggle-container'
  });
});
```

## Configuration Options

### DataSourceToggle

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| containerId | string | 'data-source-toggle-container' | The ID of the container element |
| defaultUseRealData | boolean | false | Whether to use real data by default |
| onToggle | function | | Callback when toggle state changes |
| dataSourceConfig | object | | Configuration for data sources |

### MedallionDataConnector

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| useRealData | boolean | false | Whether to use real data |
| cacheDuration | number | 900000 | Cache duration in milliseconds (15 minutes) |
| apiBaseUrl | string | 'https://retail-advisor-api.tbwa.com/api' | Base URL for API |
| simulatedDataPath | string | '/retail_edge/assets/data/simulated' | Path to simulated data |
| onDataSourceChange | function | | Callback when data source changes |
| onError | function | | Callback when error occurs |

### DashboardIntegrator

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| dataToggleContainerId | string | 'data-source-toggle-container' | The ID of the container element |
| defaultUseRealData | boolean | false | Whether to use real data by default |
| onDataSourceChange | function | | Callback when data source changes |
| onError | function | | Callback when error occurs |
| enableConsoleMessages | boolean | true | Whether to log messages to console |
| medallionConfig | object | | Configuration for the Medallion connector |

## Custom Data Sources

You can customize the data sources by providing a `dataSourceConfig` option to the DataSourceToggle constructor:

```javascript
new DataSourceToggle({
  dataSourceConfig: {
    real: {
      bronzeLayer: '/api/events/realtime',
      silverLayer: '/api/silver/brand-mentions',
      goldLayer: '/api/gold/topic-analysis',
      platinumLayer: '/api/insights',
      unified: '/api/dashboard/summary'
    },
    simulated: {
      bronzeLayer: '/retail_edge/assets/data/simulated/bronze_events.json',
      silverLayer: '/retail_edge/assets/data/simulated/silver_brand_mentions.json',
      goldLayer: '/retail_edge/assets/data/simulated/gold_topic_analysis.json',
      platinumLayer: '/retail_edge/assets/data/simulated/platinum_insights.json',
      unified: '/retail_edge/assets/data/simulated/dashboard_summary.json'
    }
  }
});
```