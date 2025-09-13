# Project Scout Session Matching Enhancement

This document explains the schema enhancements implemented to support session matching and detailed transaction metrics for the Project Scout dashboard in Power BI.

## Overview

The enhancement adds several key capabilities:

1. **Explicit Session Matching** - Directly links audio transcriptions with visual detections
2. **Transaction Details** - Captures product quantities, values, and request methods
3. **Substitution Detection** - Identifies when customers switch products
4. **Data Quality Metrics** - Tracks confidence scores and match quality
5. **Power BI Optimization** - Includes views and materialized tables for analytics

## Key Tables Added

### 1. SessionMatches

Links sales interactions with transcriptions and visual detections:

| Column          | Type         | Description                              |
|-----------------|--------------|------------------------------------------|
| SessionMatchID  | INT          | Primary key                              |
| InteractionID   | VARCHAR(60)  | FK to SalesInteractions                  |
| TranscriptID    | INT          | FK to bronze_transcriptions              |
| DetectionID     | INT          | FK to bronze_vision_detections           |
| MatchConfidence | FLOAT        | 0.0-1.0 confidence score                 |
| TimeOffsetMs    | INT          | Time difference between events (ms)      |
| MatchMethod     | VARCHAR(50)  | How the match was established            |
| CreatedAt       | DATETIME     | When match was created                   |
| CreatedBy       | NVARCHAR(100)| User/system that created record          |
| LastUpdatedAt   | DATETIME     | When match was last updated              |
| LastUpdatedBy   | NVARCHAR(100)| User/system that last updated record     |

### 2. TransactionItems

Stores detailed product quantities for each transaction:

| Column            | Type         | Description                             |
|-------------------|--------------|----------------------------------------|
| TransactionItemID | INT          | Primary key                             |
| InteractionID     | VARCHAR(60)  | FK to SalesInteractions                 |
| ProductID         | INT          | FK to Products                          |
| Quantity          | INT          | Number of items                         |
| UnitPrice         | DECIMAL(10,2)| Price per unit                          |
| RequestSequence   | INT          | Order in which item was requested       |
| RequestMethod     | VARCHAR(50)  | How customer requested the product      |
| CreatedAt         | DATETIME     | When record was created                 |
| CreatedBy         | NVARCHAR(100)| User/system that created record         |
| LastUpdatedAt     | DATETIME     | When record was last updated            |
| LastUpdatedBy     | NVARCHAR(100)| User/system that last updated record    |
| SourceSystem      | NVARCHAR(50) | Origin system for data                  |
| SourceRecordID    | NVARCHAR(100)| Original ID in source system            |
| DataQualityScore  | DECIMAL(5,2) | Quality score (0-100)                   |

### 3. Reference Tables

**RequestMethods** - Classifies how customers request products:
- BrandSpecific (mentions brand)
- CategoryOnly (mentions only type)
- VisualPointing (indicates visually)
- Question (asks if available)
- UnbrandedCommodity (generic item)

**UnbrandedCommodities** - Filipino-specific common items without brands:
- Ice (yelo)
- Salt (asin)
- Rice (bigas/kanin)
- Etc.

## Enhancements to Existing Tables

### SalesInteractions

Added columns:
- TransactionDuration (seconds)
- ProductCount (distinct products)
- TotalItemCount (total quantity)
- TransactionValue (total value)
- RequestMethod (predominant method)
- HasSubstitution (product swap flag)
- FirstChoiceProductID (original product)
- SubstitutedProductID (replacement product)
- Plus audit and quality columns

## Stored Procedures

Several procedures were added to:

1. **PopulateSessionMatches** - Creates matches between existing transcriptions and detections
2. **CalculateTransactionMetrics** - Updates duration, counts and values
3. **DetectProductSubstitutions** - Identifies when customers switch products
4. **AnalyzeSessionMatchQuality** - Calculates data quality scores

## Power BI Optimization

### Views

1. **SalesInteractionDashboardView** - General-purpose dashboard view
2. **vw_SalesInteractionsForPowerBI** - Optimized for Power BI with standardized naming
3. **vw_PowerBI_SalesInteractions** - Materialized view for high performance (SQL Server 2019+)

### Sample Measures

The migration includes sample Power BI measure definitions:

```
-- Transaction Count
Count_Transactions = COUNTROWS(DISTINCT(SalesInteractions[InteractionID]))

-- Average Transaction Duration
Avg_TransactionDuration = AVERAGE(SalesInteractions[TransactionDuration])

-- Substitution Rate
Substitution_Rate = 
DIVIDE(
    COUNTROWS(FILTER(SalesInteractions, SalesInteractions[HasSubstitution] = "Yes")),
    COUNTROWS(SalesInteractions)
)
```

## Usage Examples

### Finding Transactions with Substitutions

```sql
SELECT 
    si.InteractionID,
    si.TransactionDate,
    fp.ProductName AS FirstChoiceProduct,
    sp.ProductName AS SubstitutedProduct,
    si.TransactionValue
FROM 
    dbo.SalesInteractions si
    JOIN dbo.Products fp ON si.FirstChoiceProductID = fp.ProductID
    JOIN dbo.Products sp ON si.SubstitutedProductID = sp.ProductID
WHERE 
    si.HasSubstitution = 1
ORDER BY 
    si.TransactionDate DESC;
```

### Analyzing Request Methods

```sql
SELECT 
    rm.MethodName,
    COUNT(*) AS TransactionCount,
    AVG(si.TransactionValue) AS AvgValue
FROM 
    dbo.SalesInteractions si
    JOIN dbo.RequestMethods rm ON si.RequestMethod = rm.MethodName
GROUP BY 
    rm.MethodName
ORDER BY 
    COUNT(*) DESC;
```

### Session Match Quality

```sql
SELECT 
    CASE 
        WHEN ABS(TimeOffsetMs) <= 1000 THEN 'Within 1 second'
        WHEN ABS(TimeOffsetMs) <= 5000 THEN '1-5 seconds'
        WHEN ABS(TimeOffsetMs) <= 10000 THEN '5-10 seconds'
        ELSE 'Over 10 seconds'
    END AS TimeOffset,
    COUNT(*) AS MatchCount,
    AVG(MatchConfidence) AS AvgConfidence
FROM 
    dbo.SessionMatches
GROUP BY 
    CASE 
        WHEN ABS(TimeOffsetMs) <= 1000 THEN 'Within 1 second'
        WHEN ABS(TimeOffsetMs) <= 5000 THEN '1-5 seconds'
        WHEN ABS(TimeOffsetMs) <= 10000 THEN '5-10 seconds'
        ELSE 'Over 10 seconds'
    END
ORDER BY 
    MIN(ABS(TimeOffsetMs));
```

## Implementation Notes

1. The migration script runs in a transaction for safety - all changes succeed or fail together
2. Backups of original tables are created before modifications
3. A verification procedure validates the migration was successful
4. Data quality scores are calculated based on completeness and match confidence
5. Existing data is automatically migrated to populate the new tables

## Power BI Dashboard Configuration

The enhanced schema supports both direct query and import modes in Power BI. For optimal performance with direct query:

1. Use `vw_PowerBI_SalesInteractions` for the base dataset
2. Create calculated columns for date and time intelligence
3. Set up the recommended relationships described in the migration script
4. Define the suggested measures at the dataset level
5. Use a date table connected to TransactionDate for time intelligence