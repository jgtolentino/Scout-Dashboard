# Enhanced Geospatial Store Map Component

This document explains the enhanced geospatial store map component for the TBWA Client 360 Dashboard.

## Overview

The store map component provides a visual representation of store locations across the Philippines with performance metrics displayed as interactive bubble overlays. This allows users to quickly identify store performance patterns by region and drill down for detailed store information.

## Features

- **Interactive Map**: Smooth pan, zoom, and click functionality
- **Multiple Metrics**: Toggle between different metrics (Sales, Stockouts, Customer Count, Basket Size, Growth Rate)
- **Visual Indicators**: Color gradients and bubble size correspond to metric values
- **Enhanced Tooltips**: Improved hover tooltips with detailed store metrics
- **Detailed Drill-Down**: Click on stores to see performance history and category breakdown
- **Advanced Filtering**: Filter by region, store type, and other criteria with auto-zooming
- **Theme Support**: Seamless integration with TBWA and Sari-Sari themes
- **Responsive Design**: Optimized for mobile and desktop viewing

## Technical Implementation

The enhanced map component is implemented using:

- **Leaflet.js**: Industry-standard JavaScript library for interactive maps
- **GeoJSON**: For the Philippines country outline and store location data
- **DOM Events**: For bidirectional communication with other dashboard components
- **Chart.js**: For drill-down visualizations
- **Theme Variables**: CSS variables for consistent theming
- **DLT Integration**: Connects to the Scout DLT pipeline for real-time store data

## Files

- `/src/components/store_map.js`: Enhanced component implementation
- `/src/styles/store-map.scss`: Component-specific styling
- `/data/philippines_outline.geojson`: Philippines boundary data
- `/data/sample_data/enhanced_store_locations.json`: Sample store location data

## Usage

The map component automatically initializes when the dashboard loads:

```javascript
// Initialize map in dashboard.js
function initializeStoreMap(data) {
  // If the map is already initialized, just update the data
  if (window.storeMap) {
    window.storeMap.loadData();
    return;
  }
  
  // Create new instance
  window.storeMap = new StoreMap('store-map', {
    metricKey: document.getElementById('map-metric-selector')?.value || 'sales_30d'
  });
  
  // Load data
  window.storeMap.loadData();
}
```

## Configuration Options

The component accepts the following options:

```javascript
const options = {
  center: [12.8797, 121.7740], // Default center (Philippines)
  zoom: 6,                     // Initial zoom level
  maxZoom: 18,                 // Maximum zoom level
  minZoom: 5,                  // Minimum zoom level
  metricKey: 'sales_30d',      // Initial metric to display
  bubbleMinRadius: 5,          // Minimum marker size
  bubbleMaxRadius: 25,         // Maximum marker size
  colorScales: {               // Color scales for metrics
    sales_30d: ['#e8f5e9', '#66bb6a', '#2e7d32'],     // Green scale
    stockouts: ['#fff3e0', '#ff9800', '#e65100'],     // Orange scale
    customer_count_30d: ['#f3e5f5', '#ab47bc', '#6a1b9a'] // Purple scale
    // Add more metrics here
  }
};
```

## Metrics Visualization

The enhanced map supports multiple metrics:

1. **Monthly Sales (sales_30d)**: Green scale; larger bubbles = higher sales
2. **Weekly Sales (sales_7d)**: Green scale variant
3. **Customer Count (customer_count_30d)**: Purple scale; larger bubbles = more customers
4. **Average Basket Size (average_basket_size)**: Blue scale; larger bubbles = higher average
5. **Growth Rate (growth_rate)**: Teal scale; larger bubbles = higher growth
6. **Stockouts (stockouts)**: Orange/amber scale; larger bubbles = more stockouts

## Data Flow

1. Dashboard initialization triggers the map component
2. StoreMap loads data from the API or falls back to sample data
3. User interactions (filter changes, metric selection) update the visualization
4. Store selection triggers detailed drill-down view
5. Map legends dynamically update to reflect current metric and value range

## Public Methods

```javascript
// Change the displayed metric
storeMap.setMetric('customer_count_30d');

// Apply filters from the dashboard
storeMap.applyFilters({
  region: 'ncr',
  storeType: 'sari-sari'
});

// Force map resize (useful after container size changes)
storeMap.resize();

// Set view to specific region
storeMap.setRegionView('visayas');
```

## Mobile Responsiveness

The map component is fully responsive with:

- Adaptive height based on container size
- Touch-friendly controls for mobile devices
- Responsive tooltips and drill-down views
- Performance optimizations for mobile browsers

## Extending the Map

To add additional metrics or functionality:

1. Add the new metric to the `colorScales` object in options
2. Add formatting logic to the `_formatMetricValue` method
3. Add the new metric option to the HTML dropdown
4. Update the component to handle the new metric type

## Future Enhancements

Planned future improvements include:

- Marker clustering for dense regions
- Heatmap visualization mode
- Time-based animation of metrics
- Comparative analysis between stores
- Custom region polygon highlighting
- Export capabilities for map snapshots
- Route optimization between stores