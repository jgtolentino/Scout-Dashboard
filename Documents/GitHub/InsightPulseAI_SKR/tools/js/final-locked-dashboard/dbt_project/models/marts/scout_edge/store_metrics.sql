{{ config(
    materialized = 'table',
    sort = 'StoreID',
    dist = 'StoreID',
    schema = 'marts',
    tags = ["scout_edge", "stores"]
) }}

WITH store_transactions AS (
    SELECT 
        t.StoreID,
        s.StoreName,
        s.StoreType,
        s.Region,
        s.City,
        s.Barangay,
        s.Latitude,
        s.Longitude,
        CAST(t.TransactionDate AS DATE) AS SalesDate,
        COUNT(DISTINCT t.TransactionID) AS TransactionCount,
        COUNT(DISTINCT t.CustomerID) AS CustomerCount,
        SUM(t.TotalAmount) AS TotalSales,
        SUM(t.ItemCount) AS ItemCount,
        AVG(t.TotalAmount) AS AvgTransactionValue,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.TotalAmount) AS MedianTransactionValue
    FROM 
        {{ source('sales', 'transactions') }} t
    INNER JOIN 
        {{ source('store', 'locations') }} s ON t.StoreID = s.StoreID
    WHERE 
        t.TransactionDate >= DATEADD(day, -90, CURRENT_DATE())
        AND t.Status = 'Completed'
    GROUP BY 
        t.StoreID, s.StoreName, s.StoreType, s.Region, s.City, s.Barangay, 
        s.Latitude, s.Longitude, CAST(t.TransactionDate AS DATE)
),

brand_metrics_by_store AS (
    SELECT 
        sib.StoreID,
        COUNT(DISTINCT sib.BrandID) AS UniqueBrands,
        MAX(tb.BrandName) FILTER (WHERE tb.BrandRank = 1 AND tb.IsTopBrandInLocation) AS TopBrand,
        MAX(tb.MentionCount) FILTER (WHERE tb.BrandRank = 1) AS TopBrandMentions,
        MAX(tb.TopBrandPercentage) FILTER (WHERE tb.BrandRank = 1) AS TopBrandPercentage,
        MAX(tb.BrandName) FILTER (WHERE tb.BrandRank = 2) AS SecondBrand,
        MAX(tb.MentionCount) FILTER (WHERE tb.BrandRank = 2) AS SecondBrandMentions
    FROM 
        {{ ref('sales_interaction_brands') }} sib
    LEFT JOIN 
        {{ ref('top_brands') }} tb 
        ON sib.BrandID = tb.BrandID 
        AND sib.Region = tb.Region 
        AND sib.City = tb.City 
        AND sib.Barangay = tb.Barangay
    WHERE 
        sib.TransactionDate >= DATEADD(day, -90, CURRENT_DATE())
    GROUP BY 
        sib.StoreID
),

store_combo_metrics AS (
    SELECT 
        tc.Region,
        tc.City,
        tc.Barangay,
        UNNEST(SPLIT(tc.StoreIDList, ',')) AS StoreID,
        MAX(tc.ComboName) FILTER (WHERE tc.ComboRank = 1) AS TopCombo,
        MAX(tc.TransactionCount) FILTER (WHERE tc.ComboRank = 1) AS TopComboTransactions,
        COUNT(DISTINCT tc.ComboName) AS UniqueComboCount
    FROM 
        {{ ref('top_combos') }} tc
    GROUP BY 
        tc.Region, tc.City, tc.Barangay, UNNEST(SPLIT(tc.StoreIDList, ','))
)

SELECT
    st.StoreID,
    st.StoreName,
    st.StoreType,
    st.Region,
    st.City,
    st.Barangay,
    st.Latitude,
    st.Longitude,
    -- Aggregated data for the last 90 days
    SUM(st.TransactionCount) AS TotalTransactions90d,
    SUM(st.CustomerCount) AS TotalCustomers90d,
    SUM(st.TotalSales) AS TotalSales90d,
    SUM(st.ItemCount) AS TotalItems90d,
    SUM(st.TotalSales) / NULLIF(SUM(st.TransactionCount), 0) AS AvgTransactionValue90d,
    -- Last 30 days
    SUM(CASE WHEN st.SalesDate >= DATEADD(day, -30, CURRENT_DATE()) THEN st.TotalSales ELSE 0 END) AS TotalSales30d,
    SUM(CASE WHEN st.SalesDate >= DATEADD(day, -30, CURRENT_DATE()) THEN st.TransactionCount ELSE 0 END) AS TotalTransactions30d,
    -- Last 7 days
    SUM(CASE WHEN st.SalesDate >= DATEADD(day, -7, CURRENT_DATE()) THEN st.TotalSales ELSE 0 END) AS TotalSales7d,
    SUM(CASE WHEN st.SalesDate >= DATEADD(day, -7, CURRENT_DATE()) THEN st.TransactionCount ELSE 0 END) AS TotalTransactions7d,
    -- Brand metrics
    bm.UniqueBrands,
    bm.TopBrand,
    bm.TopBrandMentions,
    bm.TopBrandPercentage,
    bm.SecondBrand,
    bm.SecondBrandMentions,
    -- Combo metrics
    cm.TopCombo,
    cm.TopComboTransactions,
    cm.UniqueComboCount,
    -- Growth metrics
    SUM(CASE WHEN st.SalesDate >= DATEADD(day, -30, CURRENT_DATE()) THEN st.TotalSales ELSE 0 END) /
      NULLIF(SUM(CASE WHEN st.SalesDate BETWEEN DATEADD(day, -60, CURRENT_DATE()) AND DATEADD(day, -31, CURRENT_DATE()) 
               THEN st.TotalSales ELSE 0 END), 0) - 1 AS SalesGrowth30d,
    SUM(CASE WHEN st.SalesDate >= DATEADD(day, -30, CURRENT_DATE()) THEN st.TransactionCount ELSE 0 END) /
      NULLIF(SUM(CASE WHEN st.SalesDate BETWEEN DATEADD(day, -60, CURRENT_DATE()) AND DATEADD(day, -31, CURRENT_DATE()) 
               THEN st.TransactionCount ELSE 0 END), 0) - 1 AS TransactionGrowth30d,
    -- Store ranking by sales
    ROW_NUMBER() OVER (ORDER BY SUM(st.TotalSales) DESC) AS OverallSalesRank,
    ROW_NUMBER() OVER (PARTITION BY st.Region ORDER BY SUM(st.TotalSales) DESC) AS RegionalSalesRank,
    CURRENT_TIMESTAMP() AS GeneratedAt
FROM 
    store_transactions st
LEFT JOIN 
    brand_metrics_by_store bm ON st.StoreID = bm.StoreID
LEFT JOIN 
    store_combo_metrics cm 
    ON st.StoreID = cm.StoreID 
    AND st.Region = cm.Region 
    AND st.City = cm.City 
    AND st.Barangay = cm.Barangay
GROUP BY
    st.StoreID, st.StoreName, st.StoreType, st.Region, st.City, st.Barangay, 
    st.Latitude, st.Longitude, bm.UniqueBrands, bm.TopBrand, bm.TopBrandMentions, 
    bm.TopBrandPercentage, bm.SecondBrand, bm.SecondBrandMentions, 
    cm.TopCombo, cm.TopComboTransactions, cm.UniqueComboCount