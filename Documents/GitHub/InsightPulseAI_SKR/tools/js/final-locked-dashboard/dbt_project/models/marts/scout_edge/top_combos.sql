{{ config(
    materialized = 'table',
    sort = 'ComboRank',
    schema = 'marts',
    tags = ["scout_edge", "brands", "combos"]
) }}

WITH transaction_combos AS (
    SELECT 
        t.TransactionID,
        t.StoreID,
        s.Region,
        s.City,
        s.Barangay,
        t.TransactionDate,
        t.TotalAmount,
        ARRAY_AGG(DISTINCT p.BrandID) AS BrandIDs,
        ARRAY_AGG(DISTINCT b.BrandName ORDER BY b.BrandName) AS BrandNames,
        COUNT(DISTINCT p.BrandID) AS BrandCount
    FROM 
        {{ source('sales', 'transactions') }} t
    INNER JOIN 
        {{ source('sales', 'transaction_items') }} ti ON t.TransactionID = ti.TransactionID
    INNER JOIN 
        {{ source('inventory', 'products') }} p ON ti.ProductID = p.ProductID
    INNER JOIN 
        {{ source('inventory', 'brands') }} b ON p.BrandID = b.BrandID
    INNER JOIN 
        {{ source('store', 'locations') }} s ON t.StoreID = s.StoreID
    WHERE 
        t.TransactionDate >= DATEADD(day, -90, CURRENT_DATE())
        AND t.Status = 'Completed'
    GROUP BY 
        t.TransactionID, t.StoreID, s.Region, s.City, s.Barangay, t.TransactionDate, t.TotalAmount
    HAVING 
        COUNT(DISTINCT p.BrandID) > 1  -- Only include multi-brand transactions
),

combo_patterns AS (
    SELECT 
        Region,
        City,
        Barangay,
        ARRAY_TO_STRING(BrandNames, ' + ') AS ComboName,
        ARRAY_AGG(TransactionID) AS TransactionIDs,
        COUNT(*) AS TransactionCount,
        SUM(TotalAmount) AS TotalSales,
        AVG(TotalAmount) AS AvgTransactionValue,
        COUNT(DISTINCT StoreID) AS StoreCount,
        ARRAY_AGG(DISTINCT StoreID) AS StoreIDs,
        ROW_NUMBER() OVER (
            PARTITION BY Region, City, Barangay 
            ORDER BY COUNT(*) DESC
        ) AS ComboRank,
        ROW_NUMBER() OVER (
            PARTITION BY Region
            ORDER BY COUNT(*) DESC
        ) AS RegionalComboRank,
        ROW_NUMBER() OVER (
            ORDER BY COUNT(*) DESC
        ) AS OverallComboRank
    FROM 
        transaction_combos
    WHERE 
        BrandCount BETWEEN 2 AND 5  -- Focus on realistic combos (2-5 brands)
    GROUP BY 
        Region, City, Barangay, ARRAY_TO_STRING(BrandNames, ' + ')
)

SELECT
    {{ dbt_utils.generate_surrogate_key(['ComboName', 'Region', 'City', 'Barangay']) }} AS ComboID,
    ComboName,
    Region,
    City,
    Barangay,
    ARRAY_SIZE(TransactionIDs) AS TransactionCount,
    TotalSales,
    AvgTransactionValue,
    StoreCount,
    ARRAY_TO_STRING(StoreIDs, ',') AS StoreIDList,
    ComboRank,
    RegionalComboRank,
    OverallComboRank,
    CASE 
        WHEN ComboRank = 1 THEN TRUE 
        ELSE FALSE 
    END AS IsTopComboInLocation,
    CASE 
        WHEN RegionalComboRank = 1 THEN TRUE 
        ELSE FALSE 
    END AS IsTopComboInRegion,
    CASE 
        WHEN OverallComboRank <= 10 THEN TRUE 
        ELSE FALSE 
    END AS IsOverallTopTen,
    CURRENT_TIMESTAMP() AS GeneratedAt
FROM 
    combo_patterns
WHERE 
    ComboRank <= 10  -- Top 10 combos per location