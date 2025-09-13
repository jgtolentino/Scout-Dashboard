{{ config(
    materialized = 'table',
    sort = 'BrandRank',
    dist = 'BrandID',
    schema = 'marts',
    tags = ["scout_edge", "brands"]
) }}

WITH ranked_brands AS (
    SELECT
        sib.Region,
        sib.City,
        sib.Barangay, 
        sib.BrandID,
        b.BrandName,
        COUNT(DISTINCT sib.TransactionID) AS TransactionCount,
        SUM(sib.MentionCount) AS MentionCount,
        SUM(sib.TransactionAmount) AS TotalSales,
        COUNT(DISTINCT sib.CustomerID) AS UniqueCustomers,
        SUM(CASE WHEN sib.IsTopBrand THEN 1 ELSE 0 END) AS TopBrandTransactions,
        CAST(SUM(CASE WHEN sib.IsTopBrand THEN 1 ELSE 0 END) AS FLOAT) / 
            NULLIF(COUNT(DISTINCT sib.TransactionID), 0) * 100 AS TopBrandPercentage,
        ROW_NUMBER() OVER (
            PARTITION BY sib.Region, sib.City, sib.Barangay 
            ORDER BY COUNT(DISTINCT sib.TransactionID) DESC
        ) AS BrandRank,
        ROW_NUMBER() OVER (
            PARTITION BY sib.Region 
            ORDER BY COUNT(DISTINCT sib.TransactionID) DESC
        ) AS RegionalBrandRank,
        ROW_NUMBER() OVER (
            ORDER BY COUNT(DISTINCT sib.TransactionID) DESC
        ) AS OverallBrandRank
    FROM 
        {{ ref('sales_interaction_brands') }} sib
    INNER JOIN 
        {{ source('inventory', 'brands') }} b ON sib.BrandID = b.BrandID
    WHERE 
        sib.TransactionDate >= DATEADD(day, -90, CURRENT_DATE())
    GROUP BY 
        sib.Region, sib.City, sib.Barangay, sib.BrandID, b.BrandName
)

SELECT
    {{ dbt_utils.generate_surrogate_key(['BrandID', 'Region', 'City', 'Barangay']) }} AS TopBrandID,
    BrandID,
    BrandName,
    Region,
    City,
    Barangay,
    TransactionCount,
    MentionCount,
    TotalSales,
    UniqueCustomers,
    TopBrandTransactions,
    TopBrandPercentage,
    BrandRank,
    RegionalBrandRank,
    OverallBrandRank,
    CASE 
        WHEN BrandRank = 1 THEN TRUE 
        ELSE FALSE 
    END AS IsTopBrandInLocation,
    CASE 
        WHEN RegionalBrandRank = 1 THEN TRUE 
        ELSE FALSE 
    END AS IsTopBrandInRegion,
    CASE 
        WHEN OverallBrandRank <= 10 THEN TRUE 
        ELSE FALSE 
    END AS IsOverallTopTen,
    CURRENT_TIMESTAMP() AS GeneratedAt
FROM 
    ranked_brands
WHERE 
    BrandRank <= 10  -- Include top 10 brands per location