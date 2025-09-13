# Device Health Dashboard

A responsive dashboard component for monitoring device health, model performance, and Azure architecture metrics.

## Features

- **Real-time Device Monitoring**: Track the status of all connected devices, silent devices, and critical alerts
- **Model Performance Metrics**: Monitor NLP, vision, and speech model performance metrics
- **Azure Architecture Health**: Track infrastructure reliability, security, and cost optimization
- **System Status Overview**: Comprehensive view of all system components with status indicators
- **Interactive Visualization**: Charts and graphs for monitoring trends and patterns
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Installation

1. Copy the following files to your project:
   - `DeviceHealthDashboard.js`
   - `device-health-dashboard.css`

2. Include the files in your HTML:
   ```html
   <link rel="stylesheet" href="components/analysis-overview/device-health-dashboard.css">
   <script src="components/analysis-overview/DeviceHealthDashboard.js"></script>
   ```

3. Chart.js is required for the visualizations. Include it if not already in your project:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
   ```

## Usage

1. Create a container element in your HTML:
   ```html
   <div id="dashboard"></div>
   ```

2. Initialize the dashboard with JavaScript:
   ```javascript
   document.addEventListener('DOMContentLoaded', function() {
     const dashboard = new DeviceHealthDashboard('#dashboard', {
       // Optional: customize metrics and data
       deviceMetrics: {
         totalDevices: 156,
         silentDevices: 3,
         criticalAlerts: 2,
         dataQuality: 98.7
       }
     });
   });
   ```

## Configuration Options

The dashboard can be customized with the following options:

```javascript
const dashboard = new DeviceHealthDashboard('#dashboardContainer', {
  // Main title of the dashboard
  title: 'Device Health Monitoring',
  
  // Device health metrics
  deviceMetrics: {
    totalDevices: 156,       // Number of registered devices
    silentDevices: 3,        // Devices that haven't reported recently
    criticalAlerts: 2,       // Number of critical alerts
    dataQuality: 98.7        // Data quality percentage
  },
  
  // Model performance metrics
  modelMetrics: {
    transcriptionAccuracy: 94.2,      // Speech-to-text accuracy percentage
    brandMentionPrecision: 92.5,      // Brand mention detection precision
    brandMentionRecall: 88.9,         // Brand mention detection recall
    visionModelMAP: 90.1,             // Vision model mean Average Precision
    averageLatency: 267               // Average inference latency in ms
  },
  
  // Azure architecture health metrics
  azureMetrics: {
    reliability: 99.8,                // Reliability percentage
    security: 97.2,                   // Security score
    functionPerformance: 93.5,        // Azure Functions performance score
    costOptimization: 91.4            // Cost optimization score
  },
  
  // System component status
  functionalityStatus: [
    { 
      name: 'Speech-to-Text Pipeline', 
      status: 'operational',          // 'operational', 'degraded', or 'down'
      lastChecked: '2025-05-13 08:45'
    },
    // Additional components...
  ]
});
```

## Events and Interactivity

The dashboard includes the following interactive features:

- **Tab Navigation**: Switch between different monitoring views (Device Health, Model Performance, Azure Architecture)
- **Chart Interactivity**: Hover over charts to see detailed metrics
- **Status Updates**: Real-time status indicators for all system components

## Integration with Azure Monitoring

To connect this dashboard to real Azure monitoring data:

1. Create an Azure Function that retrieves metrics from Azure Monitor
2. Set up an API endpoint to provide the metrics in the format expected by the dashboard
3. Update the dashboard initialization to fetch data from your API endpoint

Example of fetching real-time data:

```javascript
// Fetch metrics from your API endpoint
fetch('/api/device-health-metrics')
  .then(response => response.json())
  .then(data => {
    // Initialize dashboard with real data
    const dashboard = new DeviceHealthDashboard('#dashboard', data);
  })
  .catch(error => {
    console.error('Failed to fetch metrics:', error);
    // Initialize with fallback data
    const dashboard = new DeviceHealthDashboard('#dashboard');
  });
```

## Browser Compatibility

- Chrome: 60+
- Firefox: 60+
- Safari: 12+
- Edge: 79+
- Opera: 47+

## Demo

A demo is available at `device-health-dashboard-demo.html`.