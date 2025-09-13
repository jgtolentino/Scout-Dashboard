# Scout Edge Choropleth Map Component

The Scout Edge Choropleth Map is a powerful geospatial visualization component that displays brand intelligence and sales distribution across different geographic regions in the Philippines. This document provides an overview of the component, its functionality, and how to integrate it with your data.

## 1. Overview

The choropleth map renders geographic areas (regions, cities, barangays) colored by data intensity to visualize various metrics:

- **Store Density**: Distribution of retail locations across geographic areas
- **Sales Volume**: Transaction amounts and sales performance by location
- **Brand Mentions**: Brand popularity and market penetration across regions
- **Product Combinations**: Frequency of brand/product combinations by area

## 2. Key Features

- **Multi-level Geographic Drill-down**: View data at region, city, or barangay level
- **Multiple Visualization Modes**: Switch between different metrics (store density, sales, brands, combos)
- **Interactive Tooltips**: Hover over areas to see detailed metrics
- **Filtering Capabilities**: Filter by brand, time period, and geographic level
- **Responsive Design**: Adapts to different screen sizes and dark mode
- **Real/Simulated Data Toggle**: Works with both real API data and simulated data

## 3. Technical Implementation

The choropleth map consists of several integrated components:

### 3.1 ChoroplethMap Class

The core rendering component implemented in `choropleth_map.js`:

```javascript
// Create a new choropleth map
const map = new ChoroplethMap({
  containerId: 'geo-map',
  mode: 'brands',
  geoLevel: 'barangay',
  data: geojsonData,
  darkMode: false,
  onMapClick: (e, feature) => handleMapClick(e, feature)
});
```

### 3.2 Data Integration

The map connects to the **SalesInteractionBrands** table via the MedallionDataConnector:

```javascript
// Fetch choropleth data
const geojsonData = await medallionConnector.getChoroplethData({
  geoLevel: 'barangay',
  brandId: 'all',
  days: 30,
  mode: 'brands'
});
```

### 3.3 Dashboard Integration

The map is integrated with the dashboard via the DashboardIntegrator:

```javascript
// Load choropleth map data based on dashboard filters
await dashboardIntegrator.loadChoroplethMapData(filters);
```

## 4. Data Requirements

The choropleth map requires GeoJSON data with the following structure:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "generated": "2025-05-14T08:30:45Z",
    "source": "brand_mentions",
    "mode": "geo_brand_mentions",
    "timeRange": "last_30_days"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "region": "NCR",
        "city": "Pasig",
        "barangay": "San Miguel",
        "value": 542,
        "rank": 1,
        "storeCount": 12,
        "topBrand": "Sugarcola",
        "brandID": 101,
        "brandPercentage": 42,
        "secondBrand": "Crunch Snacks",
        "secondBrandID": 103,
        "secondPercentage": 28,
        "transactionCount": 4873
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[121.0642, 14.5731], [121.0742, 14.5731], [121.0742, 14.5831], [121.0642, 14.5831], [121.0642, 14.5731]]]
      }
    }
  ]
}
```

## 5. Database Integration

The map connects to the `SalesInteractionBrands` table, which provides:

- Transaction-to-brand mapping
- Geographic metadata (region, city, barangay)
- Brand popularity metrics
- Transaction volumes

The table structure and ETL process are documented in `sales_interaction_brands_schema.sql`.

## 6. Usage Guide

### 6.1 HTML Integration

Include the choropleth map component in your HTML:

```html
<!-- Choropleth Map Container -->
<div class="card">
  <div class="card-header">
    <h5 class="card-title mb-0">
      <i class="fas fa-map-marked-alt text-primary me-2"></i>
      Geospatial Retail Intelligence
    </h5>
    <div class="btn-group" role="group">
      <button type="button" class="btn btn-sm btn-outline-primary active" data-map-mode="stores">
        <i class="fas fa-store me-1"></i> Store Density
      </button>
      <button type="button" class="btn btn-sm btn-outline-primary" data-map-mode="sales">
        <i class="fas fa-hand-holding-usd me-1"></i> Sales Volume
      </button>
      <button type="button" class="btn btn-sm btn-outline-primary" data-map-mode="brands">
        <i class="fas fa-trademark me-1"></i> Top Brands
      </button>
      <button type="button" class="btn btn-sm btn-outline-primary" data-map-mode="combos">
        <i class="fas fa-shopping-basket me-1"></i> Top Combos
      </button>
    </div>
  </div>
  <div class="card-body">
    <div class="row mb-3">
      <div class="col-md-4">
        <label for="geoLevel" class="form-label">Geographic Level</label>
        <select class="form-select form-select-sm" id="geoLevel">
          <option value="region">Region</option>
          <option value="city">City</option>
          <option value="barangay" selected>Barangay</option>
        </select>
      </div>
      <div class="col-md-4">
        <label for="brandFilter" class="form-label">Brand Filter</label>
        <select class="form-select form-select-sm" id="brandFilter">
          <option value="all" selected>All Brands</option>
          <!-- Brand options will be populated dynamically -->
        </select>
      </div>
      <div class="col-md-4">
        <label for="timeFilter" class="form-label">Time Period</label>
        <select class="form-select form-select-sm" id="timeFilter">
          <option value="7">Last 7 Days</option>
          <option value="30" selected>Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>
    </div>
    <div id="geo-map" class="choropleth-container">
      <!-- Map will be rendered here -->
      <div class="map-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading map data...</p>
      </div>
    </div>
    <div class="map-legend mt-2">
      <div class="d-flex justify-content-between">
        <small class="text-muted">Low</small>
        <small class="text-muted">High</small>
      </div>
      <div class="legend-gradient"></div>
    </div>
    <div class="map-info mt-2">
      <p class="text-muted small mb-0">
        <i class="fas fa-info-circle me-1"></i>
        Hover over areas to see detailed metrics. Click to drill down.
        <span class="data-source-indicator float-end"></span>
      </p>
    </div>
  </div>
</div>
```

### 6.2 JavaScript Integration

Include the required JavaScript files:

```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="js/choropleth_map.js"></script>
<script src="js/medallion_data_connector.js"></script>
<script src="js/dashboard_integrator.js"></script>
```

### 6.3 CSS Integration

Include the required CSS files:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="css/shared-theme.css" />
```

## 7. API Reference

### 7.1 ChoroplethMap Class

#### Constructor Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| containerId | string | ID of the HTML container | 'geo-map' |
| mode | string | Visualization mode ('stores', 'sales', 'brands', 'combos') | 'stores' |
| geoLevel | string | Geographic level ('region', 'city', 'barangay') | 'barangay' |
| data | Object | GeoJSON data | null |
| geojsonPath | string | Path to GeoJSON file | '../assets/data/geo/barangay_boundaries.geojson' |
| onMapClick | function | Click handler function | default handler |
| darkMode | boolean | Dark mode enable/disable | false |
| colorScheme | string[] | Array of colors for gradient | blue-green gradient |

#### Methods

| Method | Description |
|--------|-------------|
| updateData(data) | Update map with new data |
| updateMode(mode) | Change visualization mode |
| updateGeoLevel(level) | Change geographic level |
| updateDarkMode(darkMode) | Toggle dark mode |

### 7.2 MedallionDataConnector Methods

| Method | Description |
|--------|-------------|
| getChoroplethData(params) | Fetch choropleth data with filters |
| getBrandMentionsByGeo(params) | Fetch brand mentions data |
| getStoreDensityByGeo(params) | Fetch store density data |
| getSalesVolumeByGeo(params) | Fetch sales volume data |
| getComboFrequencyByGeo(params) | Fetch combo frequency data |

## 8. Troubleshooting

### Common Issues

1. **Map not rendering**: Check if the container ID exists and Leaflet.js is loaded
2. **No data displayed**: Verify the GeoJSON structure is correct
3. **Dark mode not working**: Ensure the `dark-mode` class is properly toggled on the body element
4. **Filters not working**: Check if filter IDs match the expected IDs in the JavaScript

### Debugging

Use the browser console to check for errors and logs:

```javascript
// Enable debug mode
window.choroplethMapDebug = true;
```

## 9. Examples

### 9.1 Brand Distribution Analysis

To analyze brand distribution across regions:

1. Select "Top Brands" mode
2. Choose "Region" geographic level
3. Select "All Brands" in the brand filter
4. Set time period to "Last 30 Days"

This will display a map showing which brands are dominant in each region.

### 9.2 Store Performance Analysis

To analyze store performance:

1. Select "Sales Volume" mode
2. Choose "City" geographic level
3. Filter by a specific brand if needed
4. Set time period to "Last 90 Days"

This will display a map showing which cities have the highest sales volume.