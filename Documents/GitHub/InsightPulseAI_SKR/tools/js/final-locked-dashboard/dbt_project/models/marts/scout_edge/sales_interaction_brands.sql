{{ config(
    materialized = 'table',
    sort = 'TransactionDate',
    dist = 'BrandID',
    schema = 'marts',
    tags = ["scout_edge", "sales", "brands"]
) }}

WITH transaction_brand_data AS (
    SELECT 
        ti.TransactionID,
        p.BrandID,
        COUNT(*) AS MentionCount,
        SUM(ti.Quantity) AS ProductCount,
        SUM(ti.LineTotal) AS TotalAmount,
        ROW_NUMBER() OVER (PARTITION BY ti.TransactionID ORDER BY COUNT(*) DESC) AS BrandRank
    FROM 
        {{ source('sales', 'transaction_items') }} ti
    INNER JOIN 
        {{ source('inventory', 'products') }} p ON ti.ProductID = p.ProductID
    INNER JOIN 
        {{ source('sales', 'transactions') }} t ON ti.TransactionID = t.TransactionID
    WHERE 
        t.TransactionDate >= DATEADD(day, -90, CURRENT_DATE())
        AND t.Status = 'Completed'
        AND p.BrandID IS NOT NULL
    GROUP BY 
        ti.TransactionID, p.BrandID
),

transaction_geos AS (
    SELECT
        t.TransactionID,
        t.StoreID,
        s.RegionID,
        s.Region,
        s.City,
        s.Barangay,
        t.TransactionDate,
        t.CustomerID,
        t.TotalAmount
    FROM 
        {{ source('sales', 'transactions') }} t
    INNER JOIN 
        {{ source('store', 'locations') }} s ON t.StoreID = s.StoreID
    WHERE 
        t.TransactionDate >= DATEADD(day, -90, CURRENT_DATE())
        AND t.Status = 'Completed'
)

SELECT 
    {{ dbt_utils.generate_surrogate_key(['tg.TransactionID', 'tbd.BrandID']) }} AS InteractionBrandID,
    tg.TransactionID,
    tbd.BrandID,
    b.BrandName,
    tbd.MentionCount,
    tg.StoreID,
    tg.RegionID,
    tg.Region,
    tg.City,
    tg.Barangay,
    tg.TransactionDate,
    tg.CustomerID,
    tg.TotalAmount AS TransactionAmount,
    tbd.TotalAmount AS AttributedAmount,
    CASE WHEN tbd.BrandRank = 1 THEN TRUE ELSE FALSE END AS IsTopBrand,
    'product' AS MentionSource,
    CURRENT_TIMESTAMP() AS CreatedAt,
    CURRENT_TIMESTAMP() AS UpdatedAt
FROM 
    transaction_geos tg
INNER JOIN 
    transaction_brand_data tbd ON tg.TransactionID = tbd.TransactionID
INNER JOIN 
    {{ source('inventory', 'brands') }} b ON tbd.BrandID = b.BrandID