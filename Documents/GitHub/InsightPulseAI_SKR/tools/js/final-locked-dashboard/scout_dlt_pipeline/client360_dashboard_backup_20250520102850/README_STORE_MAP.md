# Geospatial Store Map Component

This document explains the geospatial store map component added to the TBWA Client 360 Dashboard.

## Overview

The store map component provides a visual representation of store locations across the Philippines with performance metrics displayed as a choropleth/bubble overlay. This allows users to quickly identify store performance patterns by region and drill down for detailed store information.

## Features

- **Interactive Map**: Pan, zoom, and click functionality
- **Multiple Metrics**: Toggle between different metrics (Sales, Stockouts, Uptime)
- **Visual Indicators**: Color coding and bubble size correspond to metric values
- **Tooltips**: Hover to see store details
- **Drill-Down**: Click on stores to see detailed performance data
- **Region Filtering**: Maps auto-zooms to selected region

## Technical Implementation

The map component is implemented using the following technologies:

- **Leaflet.js**: Open-source JavaScript library for interactive maps
- **GeoJSON**: For the Philippines country outline
- **DOM Events**: For communication with other dashboard components
- **DLT Integration**: Connects to the Scout DLT pipeline for store data

## Files

- `/static/js/components/store_map.js`: Main component implementation
- `/static/data/philippines_outline.geojson`: Philippines boundary data
- `/static/css/dashboard.css`: Includes map-specific styling

## Usage

The map component automatically initializes when the dashboard loads. It integrates with the dashboard's existing filter system:

- When a region filter is applied, the map automatically zooms to the selected region
- When data is refreshed, the map markers are updated with new metric values
- When a store marker is clicked, it triggers the dashboard's drill-down panel

## Metrics Visualization

The map supports three primary metrics:

1. **Sales**: Visualized with a green-to-orange color scale; larger bubbles represent higher sales values
2. **Stockouts**: Visualized with a blue color scale; larger bubbles represent more stockout items
3. **Uptime**: Visualized with a green color scale; larger bubbles represent higher uptime percentages

## Mobile Responsiveness

The map component is fully responsive and will resize appropriately on mobile devices. The height of the map container can be adjusted in the CSS for different screen sizes.

## Data Flow

1. Map initialization occurs in `dashboard.js` after the DashboardController is created
2. The StoreMap class fetches data from the same source as other dashboard components
3. When dashboard filters are updated, the map.filterStores() method is called
4. When a store marker is clicked, the dashboard.openStoreDetail() event is triggered

## Extending the Map

To add additional metrics or functionality:

1. Add new metrics to the `colorScales` object in the StoreMap constructor
2. Add the new metric option to the `mapMetricSelector` dropdown in the HTML
3. Implement any additional metric-specific formatting in the `_formatMetricValue` method

## Future Enhancements

Potential future improvements include:

- Heat map visualization for store density
- Clustering for areas with many stores
- Time-lapse animation to show metric changes over time
- Additional layers for competitor stores or demographics
- Integration with route planning for store visits