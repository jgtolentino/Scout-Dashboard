# Enhanced Brand and Product Schema Documentation

This documentation explains the enhanced database schema for BrandMaster and ProductMaster tables implemented in `enhanced_brand_product_schema.sql`. These enhancements add robust metadata, governance, and searchability capabilities to support more sophisticated data management.

## Schema Enhancements Overview

The enhanced schema adds:

1. **Audit & Stewardship Columns** - Track who created/modified records and when
2. **Source & Quality Metadata** - Record where data originated and assess its quality 
3. **Product Image References** - Store links to product imagery for UI displays
4. **Search Optimization** - Full-text indexes and computed columns for faster lookups
5. **Reference/Lookup Tables** - Controlled vocabularies for categories and units of measure

## Table Structure

### Reference Tables

#### BrandCategoryMaster
Provides a controlled vocabulary for categorizing brands with hierarchical relationships.

| Column           | Type          | Description                                  |
|------------------|---------------|----------------------------------------------|
| CategoryID       | INT           | Primary key                                  |
| CategoryName     | NVARCHAR(100) | Unique category name                         |
| ParentCategoryID | INT           | Self-referencing FK for hierarchical categories |
| Description      | NVARCHAR(500) | Category description                         |
| IsActive         | BIT           | Flag for active/inactive status              |
| CreatedAt        | DATETIME2     | Creation timestamp (UTC)                     |
| CreatedBy        | NVARCHAR(100) | User/system that created the record          |
| LastUpdatedAt    | DATETIME2     | Last update timestamp (UTC)                  |
| LastUpdatedBy    | NVARCHAR(100) | User/system that last updated the record     |

#### UnitOfMeasure
Standardizes quantity units with conversion capabilities.

| Column          | Type          | Description                                  |
|-----------------|---------------|----------------------------------------------|
| UnitID          | INT           | Primary key                                  |
| UnitCode        | VARCHAR(10)   | Unique code (e.g., "KG", "L")                |
| UnitName        | NVARCHAR(50)  | Full name (e.g., "Kilogram")                 |
| UnitType        | NVARCHAR(50)  | Category (Weight, Volume, Count, etc.)       |
| BaseMultiplier  | DECIMAL(18,6) | Conversion factor to base unit               |
| BaseUnitID      | INT           | Reference to base unit for conversions       |
| CreatedAt       | DATETIME2     | Creation timestamp (UTC)                     |
| CreatedBy       | NVARCHAR(100) | User/system that created the record          |
| LastUpdatedAt   | DATETIME2     | Last update timestamp (UTC)                  |
| LastUpdatedBy   | NVARCHAR(100) | User/system that last updated the record     |

### Enhanced Brand Master Table

#### BrandMaster
Comprehensive brand information with metadata, hierarchies, and quality tracking.

| Column           | Type           | Description                                |
|------------------|----------------|--------------------------------------------|
| BrandID          | INT            | Primary key                                |
| BrandName        | NVARCHAR(100)  | Brand name (unique)                        |
| CategoryID       | INT            | FK to BrandCategoryMaster                  |
| ParentBrandID    | INT            | Self-reference for brand hierarchies       |
| BrandOwner       | NVARCHAR(100)  | Company/entity that owns the brand         |
| BrandDescription | NVARCHAR(1000) | Detailed description                       |
| BrandAliases     | NVARCHAR(500)  | Alternative names, comma-separated         |
| ContextClues     | NVARCHAR(1000) | Keywords associated with this brand        |
| LogoURL          | NVARCHAR(500)  | URL to brand logo                          |
| BrandWebsite     | NVARCHAR(255)  | Official website URL                       |
| ActiveFrom       | DATE           | When brand became active                   |
| ActiveTo         | DATE           | When brand was discontinued (NULL if active) |
| BrandColor       | NVARCHAR(20)   | Hex color code for UI                      |
| SourceSystem     | NVARCHAR(50)   | System of origin (ERP, PIM, etc.)          |
| SourceRecordID   | NVARCHAR(100)  | ID in original system                      |
| DataQualityScore | DECIMAL(5,2)   | 0-100 score from quality rules             |
| CreatedAt        | DATETIME2      | Creation timestamp (UTC)                   |
| CreatedBy        | NVARCHAR(100)  | User/system that created the record        |
| LastUpdatedAt    | DATETIME2      | Last update timestamp (UTC)                |
| LastUpdatedBy    | NVARCHAR(100)  | User/system that last updated the record   |
| NormalizedName   | Computed       | Lowercase, no spaces/punctuation for search |

### Enhanced Product Master Table

#### ProductMaster
Detailed product information with rich metadata, brand relationships, and image references.

| Column            | Type           | Description                                |
|-------------------|----------------|--------------------------------------------|
| ProductID         | INT            | Primary key                                |
| ProductName       | NVARCHAR(200)  | Product name                               |
| ProductDescription| NVARCHAR(2000) | Detailed description                       |
| SKU               | NVARCHAR(50)   | Stock Keeping Unit                         |
| BrandID           | INT            | FK to BrandMaster                          |
| CategoryID        | INT            | Product category (if separate from brand)  |
| UnitOfMeasureID   | INT            | FK to UnitOfMeasure                        |
| DefaultQuantity   | DECIMAL(18,6)  | Default quantity per unit                  |
| GTIN              | NVARCHAR(14)   | Global Trade Item Number                   |
| BarCode           | NVARCHAR(50)   | Product barcode                            |
| Price             | DECIMAL(18,2)  | Retail price                               |
| CostPrice         | DECIMAL(18,2)  | Cost price                                 |
| Weight            | DECIMAL(18,6)  | Product weight                             |
| WeightUnitID      | INT            | FK to UnitOfMeasure for weight             |
| Dimensions        | NVARCHAR(100)  | Format: LxWxH                              |
| Color             | NVARCHAR(50)   | Product color                              |
| Size              | NVARCHAR(50)   | Product size                               |
| IsActive          | BIT            | Flag for active/inactive status            |
| ActiveFrom        | DATE           | When product became active                 |
| ActiveTo          | DATE           | When product was discontinued (NULL if active) |
| ImageURL          | NVARCHAR(500)  | URL to product image                       |
| ThumbnailURL      | NVARCHAR(500)  | URL to product thumbnail                   |
| SourceSystem      | NVARCHAR(50)   | System of origin (ERP, PIM, etc.)          |
| SourceRecordID    | NVARCHAR(100)  | ID in original system                      |
| DataQualityScore  | DECIMAL(5,2)   | 0-100 score from quality rules             |
| CreatedAt         | DATETIME2      | Creation timestamp (UTC)                   |
| CreatedBy         | NVARCHAR(100)  | User/system that created the record        |
| LastUpdatedAt     | DATETIME2      | Last update timestamp (UTC)                |
| LastUpdatedBy     | NVARCHAR(100)  | User/system that last updated the record   |
| NormalizedName    | Computed       | Lowercase, no spaces/punctuation for search |

## Views and Stored Procedures

### Views

1. **vw_BrandDetails** - Provides brand information with category and parent brand details
2. **vw_ProductDetails** - Comprehensive product information including brand and unit details

### Stored Procedures

1. **CalculateBrandDataQuality** - Calculates and updates data quality scores based on completeness and consistency
2. **ImportBrandsFromExternalSystem** - Handles importing brand data from external systems with proper attribution

## Search Optimization

Full-text indexes are created on:

1. **BrandMaster** - BrandName, BrandAliases, ContextClues
2. **ProductMaster** - ProductName, ProductDescription, SKU, BarCode

This enables advanced search capabilities like:

```sql
-- Find brands or products containing specific terms
SELECT * FROM dbo.BrandMaster 
WHERE CONTAINS((BrandName, BrandAliases, ContextClues), 'cleaning AND household');

-- Find products with SKUs or names containing pattern
SELECT * FROM dbo.ProductMaster 
WHERE CONTAINS((ProductName, SKU), '"ABC*"');
```

## Data Quality Management

The schema includes a trigger on BrandMaster that automatically schedules data quality recalculation when key fields are modified. Quality scores range from 0-100 and are calculated based on:

- Field completeness (presence of required/important fields)
- Data consistency
- Field relationships

## Traceability and Governance

All tables include audit columns that track:

- Who created each record and when
- Who last modified each record and when
- Which system the data originated from
- Original record IDs from source systems

This provides complete traceability and supports data governance requirements.

## Implementation Notes

1. **Database Compatibility**: This schema is designed for SQL Server and uses SQL Server-specific features like computed columns and full-text search.
2. **Migration Path**: The script includes commented sections for adding audit columns to existing tables.
3. **Performance Considerations**: Proper indexing is included to optimize query performance.
4. **Data Governance**: The schema supports data lineage and quality assessment as part of a broader governance strategy.

## Usage with Power BI

This enhanced schema is optimized for integration with Power BI:

1. **Metadata & Quality**: Power BI can visualize data quality scores and metadata
2. **Brand Hierarchies**: Supports parent-child hierarchies for drill-down in Power BI
3. **Normalized Naming**: Improves matching and filtering in Power BI measures
4. **Image Integration**: The ImageURL columns enable Power BI to display product/brand images