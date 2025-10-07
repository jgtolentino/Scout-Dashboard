# FMCG Sample Data for Client360 Dashboard

This document describes the FMCG (Fast-Moving Consumer Goods) sample data designed for the Client360 Dashboard, featuring TBWA\SMP's key FMCG clients.

## Overview

The `fmcg_sample_data.json` file contains a comprehensive dataset featuring four major TBWA\SMP FMCG clients:

1. **Del Monte Philippines**
2. **Oishi (Liwayway Marketing)**
3. **Alaska Milk Corporation**
4. **Peerless Products**

This data is designed to showcase realistic FMCG metrics and insights across various dimensions to power the Client360 Dashboard.

## Data Structure

### Top-Level Categories

The sample data is organized into several key dimensions:

- **KPIs**: High-level performance metrics for the entire portfolio
- **Brands**: Brand-level performance metrics
- **Categories**: Category-level metrics across the FMCG portfolio
- **Regions**: Geographic performance across the Philippines
- **Products**: Individual product details and metrics
- **Recommendations**: AI-generated business insights
- **BrandDictionary**: Brand associations and perceptions
- **EmotionalAnalysis**: Customer sentiment patterns
- **Bundling**: Product bundling opportunities
- **TimeOfDay**: Hourly performance patterns by category
- **StoreTypes**: Store type performance analysis

### Included FMCG Categories

The data includes five main FMCG categories:

1. **Beverage**: Fruit juices, vitamin drinks
2. **Snack**: Chips, crackers, pasta, sauces
3. **Dairy**: Milk products, creamers
4. **Household**: Detergents, cleaning products
5. **Personal Care**: Body wash, shampoo

### Brand Portfolio

#### Del Monte Philippines
- Del Monte Pineapple Juice
- Fit 'n Right Juice Drink
- Del Monte Fruit Cocktail
- Today's Pasta
- Del Monte Spaghetti Sauce

#### Oishi (Liwayway Marketing)
- Oishi Prawn Crackers
- Oishi Ridges
- Oishi Pillows
- Smart C+ Vitamin Drink
- Oishi Gourmet Picks

#### Alaska Milk Corporation
- Alaska Evaporated Milk
- Alaska Condensed Milk
- Alaska Powdered Milk
- Krem-Top Creamer
- Alpine Creamer

#### Peerless Products
- Champion Detergent
- Cyclone Bleach
- Calla Body Wash
- Hana Shampoo
- Pride Dishwashing Liquid

## Usage in Dashboard

### Data Filtering

The sample data supports filtering by:

- **Brand**: Filter metrics by specific FMCG brands
- **Category**: Filter by product categories (Beverage, Snack, etc.)
- **Region**: Filter by geographic regions (NCR, Luzon, Visayas, Mindanao)
- **Time Period**: Historical trend data for time-based analysis

### Insights Generation

The data powers several types of insights:

1. **Product Recommendations**: Strategic product placement suggestions
2. **Marketing Optimization**: Budget allocation recommendations
3. **Regional Opportunities**: Location-specific tactical recommendations
4. **Bundling Insights**: Product pairing opportunities
5. **Brand Associations**: Brand perception and emotional connections

### Store Type Analysis

The data includes analysis across different store formats:

- Sari-Sari Stores
- Mini Marts
- Groceries
- Supermarkets
- Convenience Stores

## Implementation Notes

### Data Access

This sample data is accessed through the `sample_data_loader.js` module, which provides SQL-like query capabilities against the JSON data.

### Supported Queries

The following SQL-like query patterns are supported:

- KPI queries (total sales, conversion rates, etc.)
- Brand performance metrics
- Product-specific metrics
- Category and regional analysis
- Store type performance
- Hourly performance patterns
- Insight and recommendation queries

### Extending the Data

To extend the sample data:

1. Modify the `fmcg_sample_data.json` file
2. Add new data dimensions or metrics
3. Update the `sample_data_loader.js` if needed to support new query patterns

## Integration with Client360 Dashboard

This FMCG sample data is automatically prioritized by the data loader, ensuring that the dashboard displays FMCG-specific visualizations when available.

To switch to different sample data, modify the data loading sequence in `sample_data_loader.js`.