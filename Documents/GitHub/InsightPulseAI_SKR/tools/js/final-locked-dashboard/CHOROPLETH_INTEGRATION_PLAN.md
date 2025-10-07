# Scout Edge Choropleth Map Integration Plan

This document outlines the implementation plan for integrating the Scout Edge choropleth map with the new `SalesInteractionBrands` table. This integration enables geospatial visualization of brand mentions, store density, sales volume, and product combinations.

## 1. Database Changes

### 1.1 New Table: SalesInteractionBrands

The foundational component is the new `SalesInteractionBrands` table which provides an exploded view of transactions with brand-level granularity. This table:

- Connects transactions to brands with geographic metadata
- Supports multiple brand mentions per transaction
- Includes metadata for filtering and analysis

```sql
CREATE TABLE [dbo].[SalesInteractionBrands] (
    [InteractionBrandID] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TransactionID] BIGINT NOT NULL,
    [BrandID] INT NOT NULL,
    [MentionCount] INT NOT NULL DEFAULT(1),
    [StoreID] VARCHAR(50) NOT NULL,
    [RegionID] VARCHAR(50) NOT NULL,
    [Region] NVARCHAR(100) NOT NULL,
    [City] NVARCHAR(100) NOT NULL,
    [Barangay] NVARCHAR(100) NOT NULL,
    [TransactionDate] DATE NOT NULL,
    [CustomerID] VARCHAR(50) NULL,
    [TransactionAmount] DECIMAL(18,2) NOT NULL,
    [AttributedAmount] DECIMAL(18,2) NULL,
    [IsTopBrand] BIT NOT NULL DEFAULT(0),
    [MentionSource] VARCHAR(20) NOT NULL DEFAULT('product'),
    [CreatedAt] DATETIME NOT NULL DEFAULT(GETDATE()),
    [UpdatedAt] DATETIME NOT NULL DEFAULT(GETDATE())
);
```

### 1.2 ETL Process

The ETL process populates the `SalesInteractionBrands` table from various sources:

1. **Product Transactions**: Extract brand mentions from purchased products
2. **Transcript Analysis** (future): Extract brand mentions from conversation transcripts
3. **Bundle Analysis** (future): Extract brand mentions from product bundles

The ETL runs on a scheduled basis to keep the table updated with the latest data.

### 1.3 Views for Analysis

Several views have been created to facilitate analysis:

- `vw_BrandMentionsByGeo`: Brand mentions aggregated by geographic areas
- `vw_TopBrandsByRegion`: Top brands per region with ranking
- `vw_StoreBrandPerformance`: Brand performance metrics by store
- `vw_BrandMentionsOverTime`: Time-series analysis of brand mentions

## 2. API Integration

### 2.1 Stored Procedures

A stored procedure `GetChoroplethData` provides the data for the choropleth map with support for different visualization modes:

- Brands mode (brand mentions)
- Sales mode (transaction amounts)
- Stores mode (store distribution)
- Combos mode (brand combinations)

The procedure returns GeoJSON-formatted data compatible with the choropleth map component.

### 2.2 MedallionDataConnector Updates

The MedallionDataConnector has been enhanced with new methods to fetch data from the `SalesInteractionBrands` table:

```javascript
// New methods
getBrandMentionsByGeo(params = {})
getStoreDensityByGeo(params = {})
getSalesVolumeByGeo(params = {})
getComboFrequencyByGeo(params = {})
```

These methods handle the appropriate API calls and parameter formatting.

## 3. UI Integration

### 3.1 Choropleth Map Component

The existing choropleth map component (`ChoroplethMap` class) is already equipped to render geographic data with different visualization modes. Updates to the data loading process ensure it works with the new data source.

### 3.2 DashboardIntegrator Updates

The `DashboardIntegrator` class has been updated to:

- Load choropleth data from the appropriate endpoint based on selected mode
- Handle filter changes (geography level, brand, time period)
- Update the map visualization when parameters change
- Support drill-down functionality

## 4. Implementation Steps

### 4.1 Database Implementation

1. Execute `sales_interaction_brands_schema.sql` to create the table, ETL procedure, views, and stored procedures
2. Run the initial ETL to populate the table with historical data:
   ```sql
   EXEC [dbo].[PopulateSalesInteractionBrands] @DaysToProcess = 90;
   ```
3. Set up a scheduled job to run the ETL procedure periodically:
   ```sql
   EXEC [dbo].[ScheduledUpdateSalesInteractionBrands];
   ```

### 4.2 API Implementation

1. Add new API endpoints to support choropleth data:
   - `GET /choropleth?geoLevel={level}&brandID={id}&days={days}&mode={mode}`
   - Endpoints should call the `GetChoroplethData` stored procedure

2. Update the API controllers to handle parameters and format responses correctly

### 4.3 Frontend Implementation

1. Update `medallion_data_connector.js` to include the new methods for choropleth data
2. Update `dashboard_integrator.js` to use the new data loading methods
3. Test the choropleth map with different visualization modes and filters

## 5. Testing Plan

### 5.1 Database Testing

- Verify table structure and indexes
- Test ETL process with sample data
- Validate view results against expected aggregations
- Test stored procedures with different parameter combinations

### 5.2 API Testing

- Test API endpoints with different parameters
- Verify GeoJSON output format compatibility
- Test edge cases (empty data, invalid parameters)
- Measure performance and optimize as needed

### 5.3 UI Testing

- Test choropleth map with different visualization modes
- Test filtering by geographic level, brand, and time period
- Test drill-down functionality by clicking on map areas
- Verify map visualization in both light and dark modes

## 6. Implementation Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Database implementation | 1 day | None |
| 2 | ETL testing and optimization | 1 day | Database implementation |
| 3 | API endpoint implementation | 1 day | Database implementation |
| 4 | Frontend integration | 2 days | API implementation |
| 5 | Testing and bug fixes | 2 days | Frontend integration |
| 6 | Documentation | 1 day | All phases complete |

Total estimated time: 8 working days

## 7. Maintenance Considerations

- Schedule regular ETL runs to keep data fresh
- Monitor table size and performance as data grows
- Implement archiving strategy for historical data
- Add observability metrics to track API performance

## 8. Future Enhancements

- Add support for transcript-based brand mentions
- Implement market basket analysis integration
- Add predictive analytics for brand growth trends
- Enhance visualization with animation for time-series data

## Appendix: SQL Scripts

Refer to the following files for implementation details:

- `sql/sales_interaction_brands_schema.sql`: Database schema and procedures
- `sql/medallion_data_connector_integration.js`: Frontend integration code