# Pulser Data Toggle Integration Guide

## Overview

This guide explains how to integrate the data toggle framework into Pulser agent-managed applications and dashboards. The data toggle framework allows seamless switching between real production data and simulated data across all layers of the Medallion architecture (Bronze, Silver, Gold, and Platinum).

**Version:** 1.0  
**Last Updated:** 2025-05-14  
**Maintainer:** InsightPulseAI Dev Team

## Table of Contents

1. [Introduction](#introduction)
2. [Key Components](#key-components)
3. [Medallion Architecture Integration](#medallion-architecture-integration)
4. [Implementation Steps](#implementation-steps)
5. [Agent Configuration Examples](#agent-configuration-examples)
6. [Customization Options](#customization-options)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Introduction

The Pulser Data Toggle framework provides a standardized way to switch between real and simulated data sources across all Pulser-managed applications. This is particularly useful for:

- Development and testing without accessing production data
- Demonstrations and presentations with consistent, predictable data
- Training and onboarding without risk to production systems
- Fallback options when production APIs are unavailable
- A/B testing of different data processing pipelines

The framework is fully integrated with the Medallion data architecture (Bronze, Silver, Gold, and Platinum layers) and includes UI components that provide clear visual indicators of the current data source.

## Key Components

The data toggle framework consists of three main JavaScript components:

### 1. DataSourceToggle

**File:** `js/data_source_toggle.js`

This component provides the user interface for toggling between real and simulated data sources. It includes:

- A toggle switch UI element
- Visual indicators of the current data source
- Persistent state management via localStorage
- Event handling for toggle state changes

```javascript
// Example initialization
const dataToggle = new DataSourceToggle({
  containerId: 'data-source-toggle-container',
  defaultUseRealData: false,
  onToggle: (useRealData, endpoints) => {
    console.log(`Using ${useRealData ? 'real' : 'simulated'} data`);
    // Refresh dashboard with new data source
  },
  dataSourceConfig: {
    real: {
      // Production API endpoints for each Medallion layer
      bronzeLayer: '/api/events/realtime',
      silverLayer: '/api/silver/brand-mentions',
      goldLayer: '/api/gold/topic-analysis',
      platinumLayer: '/api/insights'
    },
    simulated: {
      // Simulated data file paths for each Medallion layer
      bronzeLayer: '/assets/data/simulated/events.json',
      silverLayer: '/assets/data/simulated/brand_mentions.json',
      goldLayer: '/assets/data/simulated/topic_analysis.json',
      platinumLayer: '/assets/data/insights_data.json'
    }
  }
});
```

### 2. MedallionDataConnector

**File:** `js/medallion_data_connector.js`

This component connects to the Medallion data architecture and provides methods for accessing data from each layer. It integrates with the DataSourceToggle to route requests to either real or simulated data sources. Features include:

- Authentication with real data APIs
- Data caching for improved performance
- Layer-specific data access methods
- Automatic fallback to simulated data when real data is unavailable
- Comprehensive error handling

```javascript
// Example initialization
const medallionConnector = new MedallionDataConnector({
  useRealData: false, // Start with simulated data
  cacheDuration: 15 * 60 * 1000, // 15 minutes
  apiBaseUrl: 'https://retail-advisor-api.tbwa.com/api',
  simulatedDataPath: '/assets/data/simulated',
  onDataSourceChange: (useRealData, endpoints) => {
    console.log(`Data source changed to ${useRealData ? 'real' : 'simulated'}`);
    // Update UI to reflect data source change
  },
  onError: (error) => {
    console.error('Data connector error:', error);
    // Handle error in UI
  }
});

// Usage examples
// Access Bronze layer data
const events = await medallionConnector.getBronzeData('events', { days: 30 });

// Access Silver layer data
const brandMentions = await medallionConnector.getSilverData('brand-mentions', { brandId: 123 });

// Access Gold layer data
const topicAnalysis = await medallionConnector.getGoldData('topic-analysis', { category: 'electronics' });

// Access Platinum layer data (GenAI insights)
const insights = await medallionConnector.getPlatinumData('insights', { storeId: 'all' });
```

### 3. DashboardIntegrator

**File:** `js/dashboard_integrator.js`

This component integrates the toggle and connector with the dashboard UI, ensuring that all charts, tables, and KPIs update correctly when the data source changes. Features include:

- Automatic initialization of DataSourceToggle and MedallionDataConnector
- Dashboard data loading and visualization management
- Loading state handling during data source transitions
- Error message display
- Data source indicators for all visualizations

```javascript
// Example initialization
const dashboardIntegrator = new DashboardIntegrator({
  dataToggleContainerId: 'data-source-toggle-container',
  defaultUseRealData: false,
  onDataSourceChange: (useRealData, endpoints) => {
    console.log(`Dashboard using ${useRealData ? 'real' : 'simulated'} data`);
    // Additional custom handling
  },
  onError: (error) => {
    console.error('Dashboard error:', error);
    // Custom error handling
  },
  dashboardElements: {
    loadingIndicators: '.loading-indicator',
    dataContainers: '.data-container',
    kpiElements: '.kpi-value',
    charts: '.chart-container',
    statusBadges: '.status-badge'
  },
  medallionConfig: {
    // MedallionDataConnector configuration
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  }
});
```

## Medallion Architecture Integration

The data toggle framework is designed to work with the four layers of the Medallion architecture:

### Bronze Layer (Raw Data)

- **Description:** Raw, unprocessed data directly from source systems
- **Real Data Source:** Direct API connections to transaction systems, event streams, IoT devices
- **Simulated Data Source:** Static JSON files with representative raw data samples
- **Examples:** Raw transactions, device events, customer sessions, hourly traffic data

### Silver Layer (Cleaned Data)

- **Description:** Cleaned, validated, and standardized data
- **Real Data Source:** APIs connected to data lakes or warehouses with validated data
- **Simulated Data Source:** Static JSON files with cleaned and consistent data
- **Examples:** Brand mentions, validated transactions, inventory status, customer profiles

### Gold Layer (Enriched Data)

- **Description:** Enriched, aggregated, and business-ready data
- **Real Data Source:** APIs connected to data marts or BI systems
- **Simulated Data Source:** Static JSON files with aggregated and enriched data
- **Examples:** Sales performance, product metrics, customer segmentation, topic analysis

### Platinum Layer (Insights)

- **Description:** AI-generated insights and recommendations
- **Real Data Source:** GenAI APIs that process real-time data
- **Simulated Data Source:** Pre-generated insights stored as static JSON
- **Examples:** Executive summaries, trend detection, strategic recommendations, competitor analysis

## Implementation Steps

Follow these steps to integrate the data toggle framework into your application:

### 1. Copy Core Components

Copy the three core JavaScript files to your project:

```bash
mkdir -p js
cp /path/to/templates/data_source_toggle.js js/
cp /path/to/templates/medallion_data_connector.js js/
cp /path/to/templates/dashboard_integrator.js js/
```

### 2. Create Simulated Data Directory Structure

Create directories for simulated data with the standard Medallion layer structure:

```bash
mkdir -p assets/data/simulated/{bronze,silver,gold,platinum}
```

### 3. Generate Simulated Data

Generate simulated data files for each Medallion layer:

```bash
# Use the Pulser CLI tool to generate simulated data
pulser generate test-data --app YOUR_APP_NAME

# Or run the script directly
node tools/generate_test_data.js --output-dir assets/data/simulated
```

### 4. Add Required HTML Structure

Add the toggle container to your HTML:

```html
<!-- Add this where you want the toggle to appear -->
<div id="data-source-toggle-container"></div>

<!-- Include the required scripts at the end of your body tag -->
<script src="js/data_source_toggle.js"></script>
<script src="js/medallion_data_connector.js"></script>
<script src="js/dashboard_integrator.js"></script>
```

### 5. Configure Endpoints

Update the data source configuration in your application's initialization code:

```javascript
// Either customize directly in data_source_toggle.js or use this approach
window.addEventListener('DOMContentLoaded', () => {
  // Initialize with custom configuration
  window.dataSourceToggle = new DataSourceToggle({
    containerId: 'data-source-toggle-container',
    defaultUseRealData: false,
    dataSourceConfig: {
      real: {
        // Production endpoints for your application
        bronzeLayer: '/api/your-app/events',
        silverLayer: '/api/your-app/silver/data',
        goldLayer: '/api/your-app/gold/metrics',
        platinumLayer: '/api/your-app/insights'
      },
      simulated: {
        // Paths to your simulated data files
        bronzeLayer: '/assets/data/simulated/bronze_events.json',
        silverLayer: '/assets/data/simulated/silver_data.json',
        goldLayer: '/assets/data/simulated/gold_metrics.json',
        platinumLayer: '/assets/data/simulated/platinum_insights.json'
      }
    }
  });
});
```

### 6. Test Integration

Test the toggle functionality to ensure it works correctly:

```bash
# Use the Pulser CLI to test
pulser test toggle --app YOUR_APP_NAME

# Or manually test in the browser
# 1. Load the application
# 2. Toggle between real and simulated data
# 3. Verify all visualizations update correctly
# 4. Check console for any errors
```

## Agent Configuration Examples

### Example 1: Basic Dashboard Integration (Caca Agent)

This configuration is used by the Caca QA agent to validate data toggle functionality:

```yaml
# caca_data_toggle_qa.yaml
agent:
  name: "Caca"
  role: "QA Agent"
  description: "QA verification for data toggle functionality"
  
tasks:
  - id: "verify_data_toggle"
    description: "Verify data toggle functionality"
    steps:
      - "Load dashboard in simulated mode"
      - "Verify all visualizations load correctly"
      - "Toggle to real data mode"
      - "Verify all visualizations update correctly"
      - "Toggle back to simulated mode"
      - "Verify persistence of toggle state"
    
  - id: "verify_data_layers"
    description: "Verify all Medallion layers are accessible"
    steps:
      - "Verify Bronze layer data loading"
      - "Verify Silver layer data loading"
      - "Verify Gold layer data loading"
      - "Verify Platinum layer data loading"
      - "Verify layer indicators are visible"

automation:
  scripts:
    - path: "tools/verify_data_toggle.js"
      description: "Automated test script for data toggle verification"
    - path: "tools/verify_medallion_layers.js"
      description: "Automated test script for Medallion layer verification"
```

### Example 2: Comprehensive Retail Dashboard Integration (RetailEdge)

This configuration demonstrates a complete implementation for the RetailEdge dashboard:

```yaml
# retail_edge_data_toggle.yaml
agent:
  name: "RetailEdge"
  role: "Retail Dashboard"
  description: "Retail Advisor Intelligence Dashboard with data toggle support"
  
data_toggle:
  default_mode: "simulated"
  toggle_position: "header-right"
  toggle_labels:
    real: "LIVE RETAIL DATA"
    simulated: "DEMO RETAIL DATA"
  
medallion_layers:
  bronze:
    real: "/api/retail/bronze/{endpoint}"
    simulated: "/assets/data/simulated/retail/bronze_{endpoint}.json"
    endpoints:
      - "transactions"
      - "events"
      - "inventory"
      - "customer-visits"
  
  silver:
    real: "/api/retail/silver/{endpoint}"
    simulated: "/assets/data/simulated/retail/silver_{endpoint}.json"
    endpoints:
      - "sales"
      - "customer-profiles"
      - "inventory-status" 
      - "staff-schedules"
  
  gold:
    real: "/api/retail/gold/{endpoint}"
    simulated: "/assets/data/simulated/retail/gold_{endpoint}.json"
    endpoints:
      - "performance-metrics"
      - "sales-forecasts"
      - "category-analysis"
      - "staff-performance"
  
  platinum:
    real: "/api/retail/platinum/{endpoint}"
    simulated: "/assets/data/simulated/retail/platinum_{endpoint}.json"
    endpoints:
      - "executive-insights"
      - "strategic-recommendations"
      - "competitive-analysis"
      - "market-trends"

visualizations:
  kpis:
    - id: "total-sales"
      description: "Total sales amount"
      data_source: "gold/performance-metrics"
      data_field: "totalSales"
    
    - id: "avg-basket"
      description: "Average basket value"
      data_source: "gold/performance-metrics"
      data_field: "avgBasketValue"
    
    - id: "conversion-rate"
      description: "Visitor to buyer conversion rate"
      data_source: "gold/performance-metrics"
      data_field: "conversionRate"
    
  charts:
    - id: "sales-by-category"
      description: "Sales by product category"
      data_source: "gold/category-analysis"
      chart_type: "pie"
    
    - id: "daily-sales-trend"
      description: "Daily sales trend"
      data_source: "gold/sales-forecasts"
      chart_type: "line"
    
    - id: "staff-performance"
      description: "Staff performance metrics"
      data_source: "gold/staff-performance"
      chart_type: "bar"
    
  tables:
    - id: "top-products-table"
      description: "Top selling products"
      data_source: "gold/performance-metrics"
      data_field: "topProducts"
    
    - id: "store-performance-table"
      description: "Store performance comparison"
      data_source: "gold/performance-metrics"
      data_field: "storePerformance"
  
  insights:
    - id: "executive-insights"
      description: "AI-generated executive insights"
      data_source: "platinum/executive-insights"
    
    - id: "market-trends"
      description: "Market trend analysis"
      data_source: "platinum/market-trends"
```

### Example 3: ML Model Integration (Surf Agent)

This configuration shows how to integrate data toggle with ML model predictions:

```yaml
# surf_ml_data_toggle.yaml
agent:
  name: "Surf"
  role: "ML Model Integration"
  description: "Integrates ML models with data toggle support"
  
data_toggle:
  default_mode: "simulated"
  toggle_position: "sidebar-top"
  toggle_labels:
    real: "LIVE MODEL PREDICTIONS"
    simulated: "CACHED PREDICTIONS"
  
medallion_layers:
  bronze:
    real: "/api/ml/input/{endpoint}"
    simulated: "/assets/data/simulated/ml/bronze_{endpoint}.json"
    endpoints:
      - "features"
      - "raw-inputs"
  
  silver:
    real: "/api/ml/preprocessed/{endpoint}"
    simulated: "/assets/data/simulated/ml/silver_{endpoint}.json"
    endpoints:
      - "normalized-features"
      - "encoded-features"
  
  gold:
    real: "/api/ml/predictions/{endpoint}"
    simulated: "/assets/data/simulated/ml/gold_{endpoint}.json"
    endpoints:
      - "model-predictions"
      - "ensemble-results"
  
  platinum:
    real: "/api/ml/insights/{endpoint}"
    simulated: "/assets/data/simulated/ml/platinum_{endpoint}.json"
    endpoints:
      - "prediction-explanations"
      - "feature-importance"
      - "confidence-analysis"

ml_models:
  - id: "demand-forecast"
    description: "Demand forecasting model"
    input_endpoint: "bronze/features"
    output_endpoint: "gold/model-predictions"
    explanation_endpoint: "platinum/prediction-explanations"
  
  - id: "customer-segmentation"
    description: "Customer segmentation model"
    input_endpoint: "bronze/features"
    output_endpoint: "gold/model-predictions"
    explanation_endpoint: "platinum/feature-importance"
```

## Customization Options

The data toggle framework can be customized in several ways:

### Toggle Appearance

The toggle UI can be customized using CSS:

```css
/* Custom colors for the toggle */
.switch input:checked + .slider {
  background-color: #1cc88a; /* Green for real data */
}

.switch + .slider {
  background-color: #f6c23e; /* Yellow for simulated data */
}

/* Custom positioning */
.data-source-toggle {
  position: absolute;
  top: 10px;
  right: 20px;
}
```

### Toggle Labels

The labels displayed in the toggle can be customized:

```javascript
const dataToggle = new DataSourceToggle({
  containerId: 'data-source-toggle-container',
  defaultUseRealData: false,
  labels: {
    real: "PRODUCTION DATA",
    simulated: "DEMO MODE"
  }
});
```

### Data Source Indicators

Data source indicators can be customized to match your application's design:

```css
/* Custom styles for data source indicators */
.data-source-real {
  background-color: rgba(28, 200, 138, 0.1);
  color: #1cc88a;
  border: 1px solid #1cc88a;
}

.data-source-simulated {
  background-color: rgba(246, 194, 62, 0.1);
  color: #f6c23e;
  border: 1px solid #f6c23e;
}
```

### Medallion Layer Configuration

You can customize the endpoints for each Medallion layer:

```javascript
const medallionConnector = new MedallionDataConnector({
  dataSourceConfig: {
    real: {
      // Custom real data endpoints
      bronzeLayer: 'https://api.example.com/events',
      silverLayer: 'https://api.example.com/processed-data',
      goldLayer: 'https://api.example.com/metrics',
      platinumLayer: 'https://api.example.com/ai-insights'
    },
    simulated: {
      // Custom simulated data file paths
      bronzeLayer: '/custom/path/to/events.json',
      silverLayer: '/custom/path/to/processed_data.json',
      goldLayer: '/custom/path/to/metrics.json',
      platinumLayer: '/custom/path/to/ai_insights.json'
    }
  }
});
```

### Authentication

You can customize the authentication method for real data APIs:

```javascript
// Override the default authenticate method
MedallionDataConnector.prototype.authenticate = async function() {
  // Custom authentication logic
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    })
  });
  
  const authData = await response.json();
  this.authToken = authData.access_token;
  
  return true;
};
```

## Troubleshooting

### Common Issues and Solutions

#### Toggle Not Appearing

**Symptoms:** The data toggle is not visible in the UI.
**Possible Causes:**
- Container element is missing
- JavaScript files not loaded
- JavaScript errors preventing initialization

**Solutions:**
1. Check the browser console for errors
2. Verify the container element exists with the correct ID
3. Ensure all JavaScript files are loaded in the correct order
4. Try manually initializing the toggle in the console:
   ```javascript
   new DataSourceToggle({containerId: 'data-source-toggle-container'});
   ```

#### Data Not Loading

**Symptoms:** No data appears in visualizations after toggling.
**Possible Causes:**
- Incorrect API endpoints or file paths
- Missing simulated data files
- Authentication failures for real data
- CORS issues with API requests

**Solutions:**
1. Check the browser console for API errors
2. Verify all simulated data files exist and contain valid JSON
3. Check network requests to see if they're being made correctly
4. Verify authentication is working for real data endpoints
5. Test API endpoints directly using tools like Postman

#### Toggle State Not Persisting

**Symptoms:** Toggle state resets on page reload.
**Possible Causes:**
- localStorage issues
- JavaScript errors in the save logic

**Solutions:**
1. Check if localStorage is available and working
2. Manually test localStorage in the console:
   ```javascript
   localStorage.setItem('test', 'value');
   console.log(localStorage.getItem('test'));
   ```
3. Check for errors in the savePreference method

#### Visualizations Not Updating

**Symptoms:** Data toggle changes but visualizations don't update.
**Possible Causes:**
- Missing update handlers
- Chart library issues
- Data format differences between real and simulated data

**Solutions:**
1. Check if the onToggle callback is being called
2. Verify the visualization update methods are being called
3. Check for errors in the chart update methods
4. Ensure simulated data has the same structure as real data

### Debugging Tools

The framework includes built-in debugging tools:

```javascript
// Enable verbose logging
const dashboardIntegrator = new DashboardIntegrator({
  enableConsoleMessages: true,
  // other options...
});

// Debug data loading
medallionConnector.debugMode = true;

// Force data source
dataSourceToggle.useRealData = false; // Force simulated data
dataSourceToggle.updateUI();
medallionConnector.clearCache(); // Clear cache to reload all data
```

## Best Practices

### Architecture Design

1. **Layer Consistency**: Ensure all Medallion layers have both real and simulated data sources
2. **Schema Alignment**: Keep the same data schema between real and simulated data
3. **Clear Separation**: Maintain clear boundaries between UI, data connectivity, and visualization logic
4. **Progressive Enhancement**: Build features that work with simulated data first, then add real data support

### Data Management

1. **Representative Data**: Ensure simulated data is representative of real production data
2. **Data Volume**: Include enough simulated data to test pagination and performance
3. **Edge Cases**: Include edge cases in simulated data to test error handling
4. **Sensitive Data**: Never include real customer data in simulated data files
5. **Versioning**: Version your simulated data files alongside your code

### UI Design

1. **Clear Indicators**: Always include clear visual indicators of the current data source
2. **Consistent Placement**: Place the data toggle in a consistent location across applications
3. **Responsive Design**: Ensure the toggle works well on all screen sizes
4. **Accessibility**: Make the toggle accessible with keyboard navigation and screen readers
5. **User Feedback**: Provide clear feedback when data source changes

### Performance Considerations

1. **Caching**: Cache data to minimize API calls, especially for real data
2. **Loading States**: Show loading indicators during data source transitions
3. **Progressive Loading**: Load critical data first, then supplementary data
4. **Lazy Loading**: Load data for off-screen visualizations only when needed
5. **Resource Management**: Clean up resources (e.g., event listeners) when components are destroyed

By following these guidelines, you can successfully integrate the data toggle framework into your Pulser agent-managed applications, providing a seamless experience for switching between real and simulated data across all Medallion architecture layers.