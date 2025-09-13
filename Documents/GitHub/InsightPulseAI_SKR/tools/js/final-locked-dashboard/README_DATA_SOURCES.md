# Data Source Integration Guide

This guide explains how to work with the Medallion Data Architecture integration in the Scout Edge Dashboard. The implementation provides a seamless way to toggle between real and simulated data sources for development, testing, and demonstration purposes.

## Overview

The Medallion Data Architecture follows a layered approach to data management:

1. **Bronze Layer** - Raw data with minimal processing
2. **Silver Layer** - Cleaned and validated data
3. **Gold Layer** - Enriched business-ready data
4. **Platinum Layer** - AI-generated insights and analysis

Our dashboard integration allows switching between real API endpoints for these layers and locally-stored simulated data while maintaining the same visual experience.

## Files and Components

The integration consists of these key components:

- **`data_source_toggle.js`** - UI toggle switch for data sources
- **`medallion_data_connector.js`** - Connector to the Medallion data architecture
- **`dashboard_integrator.js`** - Integration with the dashboard UI
- **`choropleth_map.js`** - Interactive geospatial visualization component
- **`assets/data/simulated/`** - Static JSON files for simulated data
- **`assets/data/geo/`** - GeoJSON boundary files for geospatial visualizations
- **Style additions** in `shared-theme.css`
- **`scripts/export_datasets_to_json.py`** - Data export script for generating JSON files
- **`scripts/sync_datasets_to_azure.sh`** - Script for uploading data to Azure Blob Storage

## Usage

### Toggle Switch

The dashboard includes a toggle switch in the header that allows users to switch between real and simulated data. This toggle:

- Persists the user's preference in localStorage
- Provides visual indication of the current data source
- Triggers data reload when switched

### Data Filters

Use the data filters at the top of the dashboard to refine the data displayed:

- **Time Period** - Filter data by time range
- **Store** - Filter data by specific store or view all stores
- **Category** - Filter by product category
- **Brand** - Filter by specific brand

For geospatial visualizations, additional filters include:
- **Geographic Level** - Filter by region, city, or barangay
- **Map Mode** - Switch between store density, sales volume, brand mentions, and combo frequency

### Visual Indicators

Data source indicators appear throughout the dashboard:

- **LIVE** badge (green) - When using real data
- **DEMO** badge (yellow) - When using simulated data

Each chart and data container includes an indicator showing the current data source.

## Development

### Adding New Data Sources

To add a new data endpoint:

1. Update the data source configuration in `data_source_toggle.js`:

```javascript
this.dataSourceConfig = {
  real: {
    // Add new endpoint
    newEndpoint: '/api/new-endpoint'
  },
  simulated: {
    // Add corresponding simulated data path
    newEndpoint: '/assets/data/simulated/new_endpoint.json'
  }
};
```

2. Create a simulated data file in `assets/data/simulated/`
3. Add a method to `medallion_data_connector.js` to access the data
4. Update the export script to include the new dataset:

```python
# Add to the DATASET_QUERIES dictionary in export_datasets_to_json.py
"new_endpoint": """
    SELECT ...
    FROM ...
    WHERE ...
    FOR JSON PATH
"""
```

### Error Handling

The system includes robust error handling:

- Automatic fallback to simulated data if real data API fails
- Visual error notifications with clear messages
- Cached data to minimize API requests
- Loading indicators during data fetching

## Static Data Generation

The Scout Edge dashboard now uses pre-generated static JSON files for all data visualizations. These files are:

1. Generated from SQL database queries
2. Stored in Azure Blob Storage
3. Served as static assets via Azure Static Web App
4. Processed client-side for filtering and visualization

### Data Generation Process

To generate the static JSON files:

1. Run the export script:

```bash
cd scripts
python export_datasets_to_json.py --config config.json
```

2. For simulated data generation only:

```bash
python export_datasets_to_json.py --config config.json --simulate
```

3. To upload to Azure Blob Storage:

```bash
bash sync_datasets_to_azure.sh
```

### Automated Data Updates

The data files are automatically updated through a GitHub Actions workflow:

1. Scheduled daily runs
2. On-demand manual triggers
3. Configurable parameters for data range and simulation

## Simulated Data Structure

The simulated data files follow the same structure as the real API responses to ensure seamless toggling. Each file includes:

- **data** - The main data array
- **metadata** - Information about the data source and timestamp

### Available Datasets

The following datasets are available as static JSON files:

| Dataset | File | Description |
|---------|------|-------------|
| Brand Mentions | `geo_brand_mentions.json` | Brand popularity by geographic location |
| Top Brands | `top_brands.json` | Overall brand ranking and metrics |
| Sales Volume | `geo_sales_volume.json` | Sales performance by geographic area |
| Store Density | `geo_store_density.json` | Store distribution across regions |
| Combo Frequency | `geo_combo_frequency.json` | Product combination frequency by area |

### Geospatial Data

Geospatial data follows the GeoJSON standard format with these endpoints:

- **geoStores** - `/assets/data/simulated/geo_store_density.json` - Store locations and density
- **geoSales** - `/assets/data/simulated/geo_sales_volume.json` - Sales volumes by geographic area
- **geoBrandMentions** - `/assets/data/simulated/geo_brand_mentions.json` - Brand popularity by location
- **geoCombos** - `/assets/data/simulated/geo_combo_frequency.json` - Product combinations by area

Each GeoJSON feature includes these standard properties:
- `region` - Region name
- `city` - City name
- `barangay` - Barangay name
- `value` - Numeric value for choropleth coloring
- `rank` - Ranking position (optional)
- `topBrand` - Most popular brand in the area (optional)
- `storeCount` - Number of stores in the area (when available)
- `transactionCount` - Number of transactions (when available)

The choropleth map automatically adjusts its color scale based on the data range.

## Client-Side Filtering

All data filtering now occurs client-side:

1. Data is loaded from static JSON files
2. The `dashboard_integrator.js` handles filter changes
3. Data is filtered in memory based on user selections
4. Visualizations are updated with the filtered data
5. This approach provides fast, responsive filtering without server roundtrips

## Data Refresh Process

The static data files are refreshed through an automated process:

1. Database queries are executed on a schedule
2. Results are transformed to JSON format
3. Files are uploaded to Azure Blob Storage
4. Azure Static Web App serves the files with appropriate cache headers
5. Client-side code loads the latest data

## Running the Example

To run the Scout Edge dashboard locally:

```bash
# Generate simulated data
cd scripts
bash sync_datasets_to_azure.sh --simulate

# Serve the dashboard locally
cd ..
npx http-server -p 8080
```

## For more information

- See `SUPERSET_TO_STATIC_MIGRATION.md` for details on the migration from Superset
- See `README_SQL_INTEGRATION.md` for SQL connectivity details
- See `README_SQL_QUERIES.md` for available SQL queries
- See `README_CHOROPLETH_MAP.md` for geospatial visualization details