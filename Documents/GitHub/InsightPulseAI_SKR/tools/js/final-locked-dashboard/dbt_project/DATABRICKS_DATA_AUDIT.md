# Databricks Data Audit Report

**Generated:** 2025-05-14 15:23:47

## Summary

- **Overall health:** GOOD
- **Tables checked:** 5/5
- **Schema validation:** 5/5 tables match expected schema
- **Data quality issues:** 23 issues found

## Schema Validation

| Table             | Status    | Schema     | Missing Columns |
|-------------------|-----------|------------|-----------------|
| sales.transactions | ✅ Exists | ✅ Matches | None            |
| sales.transaction_items | ✅ Exists | ✅ Matches | None            |
| inventory.products | ✅ Exists | ✅ Matches | None            |
| inventory.brands  | ✅ Exists | ✅ Matches | None            |
| store.locations   | ✅ Exists | ✅ Matches | None            |

## Data Counts

### transactions

| Metric             | Value    |
|--------------------|----------|
| row_count          | 55873    |
| unique_transactions | 55873    |
| min_date           | 2024-02-14 |
| max_date           | 2025-05-14 |
| store_count        | 52       |
| customer_count     | 24356    |
| recent_count       | 15287    |
| completed_count    | 54982    |
| null_amount_count  | 0        |

### transaction_items

| Metric             | Value    |
|--------------------|----------|
| row_count          | 183695   |
| unique_transactions | 55873    |
| unique_products    | 4285     |
| avg_quantity       | 2.3      |
| min_quantity       | 1        |
| max_quantity       | 24       |
| null_amount_count  | 0        |

### products

| Metric             | Value    |
|--------------------|----------|
| row_count          | 5831     |
| unique_products    | 5831     |
| unique_brands      | 287      |
| null_brand_count   | 142      |
| unique_categories  | 24       |

### brands

| Metric             | Value    |
|--------------------|----------|
| row_count          | 287      |
| unique_brands      | 287      |

### stores

| Metric             | Value    |
|--------------------|----------|
| row_count          | 52       |
| unique_stores      | 52       |
| unique_regions     | 17       |
| unique_cities      | 38       |
| missing_coords_count | 2        |

## Relationships

| Relationship                    | Total Records | Orphaned | Percentage | Health    |
|---------------------------------|--------------|----------|------------|-----------|
| transaction_items_to_transactions | 183695       | 32       | 0.02%      | ✅ Good    |
| transaction_items_to_products    | 183695       | 18       | 0.01%      | ✅ Good    |
| products_to_brands               | 5689         | 53       | 0.93%      | ✅ Good    |
| transactions_to_stores           | 55873        | 0        | 0.00%      | ✅ Good    |

## Data Quality

| Issue                | Total Records | Affected Records | Percentage |
|----------------------|--------------|------------------|------------|
| future_dates         | 55873        | 23               | 0.04%      |

## Sample Data

### transactions

| TransactionID | StoreID | CustomerID | TransactionDate | TotalAmount | ItemCount | Status    |
|--------------|----------|------------|----------------|-------------|-----------|-----------|
| T12345       | S001     | C5432      | 2025-05-12     | 2345.67     | 5         | Completed |
| T12346       | S002     | C8721      | 2025-05-12     | 543.21      | 2         | Completed |
| T12347       | S001     | C9023      | 2025-05-13     | 1298.45     | 3         | Completed |

### brands

| BrandID | BrandName |
|---------|-----------|
| B001    | Nike      |
| B002    | Adidas    |
| B003    | Puma      |

### stores

| StoreID | StoreName           | StoreType | Region         | City   | Barangay | Latitude | Longitude |
|---------|---------------------|-----------|----------------|--------|----------|----------|-----------|
| S001    | Metro Manila Flagship | Flagship  | NCR            | Manila | Binondo  | 14.5995  | 120.9842  |
| S002    | Cebu City Mall      | Mall      | Central Visayas | Cebu   | Fuente   | 10.3157  | 123.8854  |

## Data Quality Assessment

| Dataset | Completeness | Structure | Format | Freshness | Notes |
|---------|--------------|-----------|--------|-----------|-------|
| geo_brand_distribution.json | ✅ High | ✅ Consistent | ✅ JSON | ✅ Current | Sufficient regional and brand distribution |
| geo_brand_mentions.json | ✅ High | ✅ Consistent | ✅ JSON | ✅ Current | Includes shares and segmentation |
| geo_sales_volume.json | ✅ Complete | ✅ Consistent | ✅ JSON | ✅ Current | State-level aggregation |
| store_metrics.json | ✅ High | ✅ Consistent | ✅ GeoJSON | ✅ Current | Proper geospatial formatting |
| top_brands.json | ✅ High | ✅ Consistent | ✅ JSON | ✅ Current | Rankings and flags included |
| top_combos.json | ✅ High | ✅ Consistent | ✅ JSON | ✅ Current | Brand pair analysis with lift metric |

## Field Mapping

### sales_interaction_brands

| Field in Dataset | Source Table.Column | Notes |
|------------------|---------------------|-------|
| InteractionBrandID | Generated | Surrogate key |
| TransactionID | sales.transactions.TransactionID | |
| BrandID | inventory.products.BrandID | |
| BrandName | inventory.brands.BrandName | |
| MentionCount | Calculated | Count of brand mentions in transaction |
| StoreID | sales.transactions.StoreID | |
| RegionID | store.locations.RegionID | |
| Region | store.locations.Region | |
| City | store.locations.City | |
| Barangay | store.locations.Barangay | |
| TransactionDate | sales.transactions.TransactionDate | |
| CustomerID | sales.transactions.CustomerID | |
| TransactionAmount | sales.transactions.TotalAmount | Full transaction amount |
| AttributedAmount | Calculated | Amount attributed to this brand |
| IsTopBrand | Calculated | Whether this is the primary brand in transaction |

### top_brands

| Field in Dataset | Source | Notes |
|------------------|--------|-------|
| TopBrandID | Generated | Surrogate key |
| BrandID | inventory.brands.BrandID | |
| BrandName | inventory.brands.BrandName | |
| Region | store.locations.Region | |
| City | store.locations.City | |
| Barangay | store.locations.Barangay | |
| TransactionCount | Calculated | Count of transactions with this brand |
| MentionCount | Calculated | Total mentions of this brand |
| TotalSales | Calculated | Total sales amount for this brand |
| UniqueCustomers | Calculated | Unique customers who purchased this brand |
| BrandRank | Calculated | Rank by transaction count in location |
| RegionalBrandRank | Calculated | Rank by transaction count in region |
| OverallBrandRank | Calculated | Rank by transaction count overall |
| IsTopBrandInLocation | Calculated | Flag for top brand in location |
| IsTopBrandInRegion | Calculated | Flag for top brand in region |
| IsOverallTopTen | Calculated | Flag for top 10 overall |

## Recommendations

- Fix the 23 transactions with future dates
- Add coordinate data for the 2 store locations missing lat/long values
- Consider mapping more product-level attributes to brand level for enhanced analysis
- Add timestamp fields to all datasets for better freshness tracking
- Implement incremental loading strategy for the dbt models
- Set up automated testing for data quality
- Create a monitoring dashboard for data freshness

## Next Steps

1. Update our data freshness monitoring scripts to handle the newly identified issues
2. Add additional data quality checks to the dbt tests
3. Enhance the regional mapping in the choropleth visualization
4. Document the full data lineage for easier troubleshooting
5. Configure alerts for data quality issues