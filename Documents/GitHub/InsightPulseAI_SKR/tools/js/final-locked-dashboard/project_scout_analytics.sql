-- ********************************************************************
-- Project Scout: Comprehensive SQL Analysis Toolkit
-- Based on the Analysis Overview Requirements
-- Excluding NULL datapoints for accurate analysis
-- ********************************************************************

-- =======================================================================
-- SECTION 1: CUSTOMER PROFILE ANALYSIS
-- =======================================================================

-- 1.1 Purchase Patterns by Demographics
-- Analyzes how different demographic groups make purchases
-- Excludes records with NULL demographics
SELECT 
    d.DemographicSegment,
    d.AgeGroup,
    d.IncomeLevel,
    COUNT(DISTINCT t.CustomerID) AS UniqueCustomers,
    COUNT(t.TransactionID) AS TotalTransactions,
    SUM(t.TotalAmount) AS TotalSpend,
    AVG(t.TotalAmount) AS AvgTransactionValue,
    SUM(t.TotalAmount) / COUNT(DISTINCT t.CustomerID) AS AvgSpendPerCustomer,
    SUM(t.ItemCount) / COUNT(t.TransactionID) AS AvgItemsPerTransaction
FROM 
    dbo.Transactions t
JOIN 
    dbo.CustomerDemographics d ON t.CustomerID = d.CustomerID
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL demographics
    AND d.DemographicSegment IS NOT NULL
    AND d.AgeGroup IS NOT NULL
    AND d.IncomeLevel IS NOT NULL
    AND t.TotalAmount IS NOT NULL
    AND t.ItemCount IS NOT NULL
GROUP BY 
    d.DemographicSegment, d.AgeGroup, d.IncomeLevel
ORDER BY 
    TotalSpend DESC;

-- 1.2 Brand Loyalty Metrics
-- Measures customer loyalty across different brands
-- Excludes records with NULL brand information
WITH CustomerBrandInteractions AS (
    SELECT 
        c.CustomerID,
        p.BrandID,
        b.BrandName,
        COUNT(DISTINCT t.TransactionID) AS TransactionCount,
        SUM(ti.Quantity) AS TotalQuantity,
        SUM(ti.LineTotal) AS TotalSpend,
        DATEDIFF(day, MIN(t.TransactionDate), MAX(t.TransactionDate)) AS DaysBetweenFirstLast,
        COUNT(DISTINCT DATEPART(month, t.TransactionDate)) AS ActiveMonths
    FROM 
        dbo.Customers c
    JOIN 
        dbo.Transactions t ON c.CustomerID = t.CustomerID
    JOIN 
        dbo.TransactionItems ti ON t.TransactionID = ti.TransactionID
    JOIN 
        dbo.Products p ON ti.ProductID = p.ProductID
    JOIN 
        dbo.Brands b ON p.BrandID = b.BrandID
    WHERE 
        t.TransactionDate BETWEEN DATEADD(month, -12, GETDATE()) AND GETDATE()
        -- Exclude NULL quantities and line totals
        AND ti.Quantity IS NOT NULL
        AND ti.LineTotal IS NOT NULL
        AND p.BrandID IS NOT NULL
        AND b.BrandName IS NOT NULL
    GROUP BY 
        c.CustomerID, p.BrandID, b.BrandName
)
SELECT 
    BrandID,
    BrandName,
    COUNT(DISTINCT CustomerID) AS TotalCustomers,
    SUM(TotalSpend) AS TotalRevenue,
    AVG(CASE WHEN DaysBetweenFirstLast > 30 THEN TransactionCount * 1.0 / (DaysBetweenFirstLast / 30.0) ELSE TransactionCount END) AS AvgMonthlyFrequency,
    SUM(CASE WHEN TransactionCount >= 3 THEN 1 ELSE 0 END) AS RepeatCustomers,
    CAST(SUM(CASE WHEN TransactionCount >= 3 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(DISTINCT CustomerID), 0) AS RepeatCustomerRate,
    AVG(TotalQuantity) AS AvgQuantityPerCustomer,
    AVG(ActiveMonths) AS AvgActiveMonths
FROM 
    CustomerBrandInteractions
GROUP BY 
    BrandID, BrandName
ORDER BY 
    RepeatCustomerRate DESC;

-- 1.3 Cultural Influence Analysis
-- Analyzes the impact of cultural factors on purchasing behavior
-- Excludes records with NULL cultural attributes
SELECT 
    c.CulturalGroup,
    c.Region,
    b.BrandName,
    COUNT(DISTINCT t.TransactionID) AS TransactionCount,
    SUM(ti.Quantity) AS TotalQuantity,
    SUM(ti.LineTotal) AS TotalSpend,
    AVG(ti.LineTotal / NULLIF(ti.Quantity, 0)) AS AvgPricePerUnit
FROM 
    dbo.CustomerAttributes c
JOIN 
    dbo.Transactions t ON c.CustomerID = t.CustomerID
JOIN 
    dbo.TransactionItems ti ON t.TransactionID = ti.TransactionID
JOIN 
    dbo.Products p ON ti.ProductID = p.ProductID
JOIN 
    dbo.Brands b ON p.BrandID = b.BrandID
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL cultural attributes
    AND c.CulturalGroup IS NOT NULL
    AND c.Region IS NOT NULL
    AND b.BrandName IS NOT NULL
    AND ti.Quantity IS NOT NULL
    AND ti.Quantity > 0  -- Avoid division by zero
    AND ti.LineTotal IS NOT NULL
GROUP BY 
    c.CulturalGroup, c.Region, b.BrandName
ORDER BY 
    c.CulturalGroup, TotalSpend DESC;

-- =======================================================================
-- SECTION 2: STORE PERFORMANCE ANALYSIS
-- =======================================================================

-- 2.1 Regional Performance
-- Compares performance across different geographical regions
-- Excludes records with NULL regions
SELECT 
    s.Region,
    COUNT(DISTINCT s.StoreID) AS StoreCount,
    SUM(t.TotalAmount) AS TotalSales,
    SUM(t.TotalAmount) / NULLIF(COUNT(DISTINCT s.StoreID), 0) AS AvgSalesPerStore,
    COUNT(t.TransactionID) AS TotalTransactions,
    COUNT(t.TransactionID) / NULLIF(COUNT(DISTINCT s.StoreID), 0) AS AvgTransactionsPerStore,
    SUM(t.TotalAmount) / NULLIF(COUNT(t.TransactionID), 0) AS AvgTransactionValue,
    SUM(t.ItemCount) / NULLIF(COUNT(t.TransactionID), 0) AS AvgItemsPerTransaction
FROM 
    dbo.Stores s
JOIN 
    dbo.Transactions t ON s.StoreID = t.StoreID
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL regions and transaction data
    AND s.Region IS NOT NULL
    AND t.TotalAmount IS NOT NULL
    AND t.ItemCount IS NOT NULL
GROUP BY 
    s.Region
ORDER BY 
    AvgSalesPerStore DESC;

-- 2.2 Store Size Impact
-- Analyzes how store size affects sales performance
-- Excludes records with NULL size category or square footage
SELECT 
    s.SizeCategory,
    COUNT(DISTINCT s.StoreID) AS StoreCount,
    SUM(t.TotalAmount) / NULLIF(COUNT(DISTINCT s.StoreID), 0) AS AvgSalesPerStore,
    SUM(t.TotalAmount) / NULLIF(SUM(s.SquareFootage), 0) AS SalesPerSquareFoot,
    COUNT(t.TransactionID) / NULLIF(COUNT(DISTINCT s.StoreID), 0) AS AvgTransactionsPerStore,
    COUNT(t.TransactionID) / NULLIF(SUM(s.SquareFootage), 0) AS TransactionsPerSquareFoot,
    SUM(t.TotalAmount) / NULLIF(COUNT(t.TransactionID), 0) AS AvgTransactionValue
FROM 
    dbo.Stores s
JOIN 
    dbo.Transactions t ON s.StoreID = t.StoreID
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL store size data
    AND s.SizeCategory IS NOT NULL
    AND s.SquareFootage IS NOT NULL
    AND s.SquareFootage > 0  -- Avoid division by zero
    AND t.TotalAmount IS NOT NULL
GROUP BY 
    s.SizeCategory
ORDER BY 
    SalesPerSquareFoot DESC;

-- 2.3 Peak Transaction Analysis
-- Identifies peak transaction periods and patterns
-- Excludes records with NULL transaction times
SELECT 
    DATEPART(hour, t.TransactionTime) AS HourOfDay,
    DATEPART(weekday, t.TransactionDate) AS DayOfWeek,
    COUNT(t.TransactionID) AS TransactionCount,
    SUM(t.TotalAmount) AS TotalSales,
    AVG(t.TotalAmount) AS AvgTransactionValue,
    SUM(t.ItemCount) AS TotalItemsSold,
    AVG(t.ItemCount) AS AvgItemsPerTransaction
FROM 
    dbo.Transactions t
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL transaction times and dates
    AND t.TransactionTime IS NOT NULL
    AND t.TransactionDate IS NOT NULL
    AND t.TotalAmount IS NOT NULL
    AND t.ItemCount IS NOT NULL
GROUP BY 
    DATEPART(hour, t.TransactionTime),
    DATEPART(weekday, t.TransactionDate)
ORDER BY 
    TransactionCount DESC;

-- =======================================================================
-- SECTION 3: PRODUCT INTELLIGENCE
-- =======================================================================

-- 3.1 Bundle Effectiveness
-- Analyzes the performance of product bundles
-- Excludes records with NULL bundle information
WITH BundleTransactions AS (
    SELECT 
        ti.TransactionID,
        b.BundleID,
        b.BundleName,
        COUNT(DISTINCT ti.ProductID) AS ProductCount,
        SUM(ti.Quantity) AS TotalQuantity,
        SUM(ti.LineTotal) AS TotalSpend
    FROM 
        dbo.TransactionItems ti
    JOIN 
        dbo.Products p ON ti.ProductID = p.ProductID
    JOIN 
        dbo.BundleProducts bp ON p.ProductID = bp.ProductID
    JOIN 
        dbo.Bundles b ON bp.BundleID = b.BundleID
    WHERE
        -- Exclude NULL bundle data
        b.BundleID IS NOT NULL
        AND b.BundleName IS NOT NULL
        AND ti.Quantity IS NOT NULL
        AND ti.LineTotal IS NOT NULL
    GROUP BY 
        ti.TransactionID, b.BundleID, b.BundleName
    HAVING 
        COUNT(DISTINCT ti.ProductID) >= 2
)
SELECT 
    BundleID,
    BundleName,
    COUNT(TransactionID) AS TransactionCount,
    AVG(ProductCount) AS AvgProductsPerBundle,
    AVG(TotalQuantity) AS AvgQuantityPerTransaction,
    AVG(TotalSpend) AS AvgSpendPerTransaction,
    SUM(TotalSpend) AS TotalRevenue
FROM 
    BundleTransactions
GROUP BY 
    BundleID, BundleName
ORDER BY 
    TransactionCount DESC;

-- 3.2 Category Performance
-- Evaluates performance across product categories
-- Excludes records with NULL categories or transaction data
SELECT 
    p.Category,
    p.SubCategory,
    COUNT(DISTINCT ti.TransactionID) AS TransactionCount,
    COUNT(DISTINCT t.CustomerID) AS UniqueCustomers,
    SUM(ti.Quantity) AS TotalQuantitySold,
    SUM(ti.LineTotal) AS TotalRevenue,
    AVG(ti.LineTotal / NULLIF(ti.Quantity, 0)) AS AvgPricePerUnit,
    SUM(ti.Quantity) / NULLIF(COUNT(DISTINCT ti.TransactionID), 0) AS AvgQuantityPerTransaction
FROM 
    dbo.Products p
JOIN 
    dbo.TransactionItems ti ON p.ProductID = ti.ProductID
JOIN 
    dbo.Transactions t ON ti.TransactionID = t.TransactionID
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL category data and transaction data
    AND p.Category IS NOT NULL
    AND p.SubCategory IS NOT NULL
    AND ti.Quantity IS NOT NULL
    AND ti.Quantity > 0  -- Avoid division by zero
    AND ti.LineTotal IS NOT NULL
    AND t.CustomerID IS NOT NULL
GROUP BY 
    p.Category, p.SubCategory
ORDER BY 
    TotalRevenue DESC;

-- 3.3 SKU-level Patterns
-- Identifies patterns and insights at the individual SKU level
-- Excludes records with NULL SKU information
SELECT 
    p.ProductID,
    p.ProductName,
    p.SKU,
    p.Category,
    p.SubCategory,
    COUNT(DISTINCT ti.TransactionID) AS TransactionCount,
    SUM(ti.Quantity) AS TotalQuantitySold,
    SUM(ti.LineTotal) AS TotalRevenue,
    AVG(ti.LineTotal / NULLIF(ti.Quantity, 0)) AS AvgPricePerUnit,
    STDEV(ti.LineTotal / NULLIF(ti.Quantity, 0)) AS PriceStandardDeviation,
    SUM(CASE WHEN ti.DiscountAmount > 0 THEN ti.Quantity ELSE 0 END) AS DiscountedQuantity,
    CAST(SUM(CASE WHEN ti.DiscountAmount > 0 THEN ti.Quantity ELSE 0 END) AS FLOAT) / 
        NULLIF(SUM(ti.Quantity), 0) AS DiscountedPercentage
FROM 
    dbo.Products p
JOIN 
    dbo.TransactionItems ti ON p.ProductID = ti.ProductID
JOIN 
    dbo.Transactions t ON ti.TransactionID = t.TransactionID
WHERE 
    t.TransactionDate BETWEEN @StartDate AND @EndDate
    -- Exclude NULL product information and transaction data
    AND p.ProductID IS NOT NULL
    AND p.ProductName IS NOT NULL
    AND p.SKU IS NOT NULL
    AND p.Category IS NOT NULL
    AND p.SubCategory IS NOT NULL
    AND ti.Quantity IS NOT NULL
    AND ti.Quantity > 0  -- Avoid division by zero
    AND ti.LineTotal IS NOT NULL
    AND ti.DiscountAmount IS NOT NULL
GROUP BY 
    p.ProductID, p.ProductName, p.SKU, p.Category, p.SubCategory
ORDER BY 
    TotalQuantitySold DESC;

-- 3.4 BUMO (Brand-Used-Most-Often) Analysis
-- Identifies which brands customers use most often
-- Excludes records with NULL brand information
WITH CustomerBrandUsage AS (
    SELECT 
        t.CustomerID,
        p.BrandID,
        b.BrandName,
        COUNT(DISTINCT t.TransactionID) AS TransactionCount,
        SUM(ti.Quantity) AS TotalQuantity,
        ROW_NUMBER() OVER (PARTITION BY t.CustomerID ORDER BY COUNT(DISTINCT t.TransactionID) DESC) AS BrandRank
    FROM 
        dbo.Transactions t
    JOIN 
        dbo.TransactionItems ti ON t.TransactionID = ti.TransactionID
    JOIN 
        dbo.Products p ON ti.ProductID = p.ProductID
    JOIN 
        dbo.Brands b ON p.BrandID = b.BrandID
    WHERE 
        t.TransactionDate BETWEEN DATEADD(month, -6, GETDATE()) AND GETDATE()
        -- Exclude NULL brand information and transaction data
        AND t.CustomerID IS NOT NULL
        AND p.BrandID IS NOT NULL
        AND b.BrandName IS NOT NULL
        AND ti.Quantity IS NOT NULL
    GROUP BY 
        t.CustomerID, p.BrandID, b.BrandName
)
SELECT 
    BrandID,
    BrandName,
    COUNT(CASE WHEN BrandRank = 1 THEN CustomerID END) AS PrimaryCustomers,
    CAST(COUNT(CASE WHEN BrandRank = 1 THEN CustomerID END) AS FLOAT) / 
        NULLIF((SELECT COUNT(DISTINCT CustomerID) FROM dbo.Transactions 
                WHERE TransactionDate BETWEEN DATEADD(month, -6, GETDATE()) AND GETDATE()
                AND CustomerID IS NOT NULL), 0) AS MarketSharePct,
    AVG(CASE WHEN BrandRank = 1 THEN TransactionCount END) AS AvgTransactionsPerPrimaryCustomer,
    AVG(CASE WHEN BrandRank = 1 THEN TotalQuantity END) AS AvgQuantityPerPrimaryCustomer
FROM 
    CustomerBrandUsage
GROUP BY 
    BrandID, BrandName
ORDER BY 
    PrimaryCustomers DESC;

-- =======================================================================
-- SECTION 4: ADVANCED ANALYTICS
-- =======================================================================

-- 4.1 Market Basket Analysis
-- Identifies which products are frequently purchased together
-- Excludes records with NULL product information
WITH ProductPairs AS (
    SELECT 
        t1.ProductID AS Product1ID,
        p1.ProductName AS Product1Name,
        t2.ProductID AS Product2ID,
        p2.ProductName AS Product2Name,
        COUNT(DISTINCT t1.TransactionID) AS SharedTransactions
    FROM 
        dbo.TransactionItems t1
    JOIN 
        dbo.TransactionItems t2 ON t1.TransactionID = t2.TransactionID AND t1.ProductID < t2.ProductID
    JOIN 
        dbo.Products p1 ON t1.ProductID = p1.ProductID
    JOIN 
        dbo.Products p2 ON t2.ProductID = p2.ProductID
    JOIN 
        dbo.Transactions t ON t1.TransactionID = t.TransactionID
    WHERE 
        t.TransactionDate BETWEEN @StartDate AND @EndDate
        -- Exclude NULL product information
        AND t1.ProductID IS NOT NULL
        AND p1.ProductName IS NOT NULL
        AND t2.ProductID IS NOT NULL
        AND p2.ProductName IS NOT NULL
    GROUP BY 
        t1.ProductID, p1.ProductName, t2.ProductID, p2.ProductName
)
SELECT 
    pp.Product1ID,
    pp.Product1Name,
    pp.Product2ID,
    pp.Product2Name,
    pp.SharedTransactions,
    SharedTransactions * 100.0 / NULLIF(p1count.TransactionCount, 0) AS Product1Support,
    SharedTransactions * 100.0 / NULLIF(p2count.TransactionCount, 0) AS Product2Support,
    CAST(SharedTransactions AS FLOAT) / NULLIF(p1count.TransactionCount, 0) AS Confidence1to2,
    CAST(SharedTransactions AS FLOAT) / NULLIF(p2count.TransactionCount, 0) AS Confidence2to1,
    (CAST(SharedTransactions AS FLOAT) * COUNT(DISTINCT t.TransactionID)) / 
        NULLIF((p1count.TransactionCount * p2count.TransactionCount), 0) AS LiftRatio
FROM 
    ProductPairs pp
JOIN 
    (SELECT ProductID, COUNT(DISTINCT TransactionID) AS TransactionCount 
     FROM dbo.TransactionItems 
     WHERE ProductID IS NOT NULL
     GROUP BY ProductID) p1count 
ON pp.Product1ID = p1count.ProductID
JOIN 
    (SELECT ProductID, COUNT(DISTINCT TransactionID) AS TransactionCount 
     FROM dbo.TransactionItems 
     WHERE ProductID IS NOT NULL
     GROUP BY ProductID) p2count 
ON pp.Product2ID = p2count.ProductID
CROSS JOIN 
    (SELECT COUNT(DISTINCT TransactionID) AS TransactionCount FROM dbo.Transactions 
     WHERE TransactionDate BETWEEN @StartDate AND @EndDate) t
WHERE 
    pp.SharedTransactions > 10
ORDER BY 
    SharedTransactions DESC;

-- 4.2 Demand Forecasting Preparatory Data
-- Creates the dataset needed for demand forecasting models
-- Excludes records with NULL sales data
SELECT 
    CAST(t.TransactionDate AS DATE) AS SalesDate,
    p.Category,
    p.SubCategory,
    p.ProductID,
    p.ProductName,
    SUM(ti.Quantity) AS QuantitySold,
    COUNT(DISTINCT t.TransactionID) AS TransactionCount,
    COUNT(DISTINCT t.StoreID) AS StoreCount,
    COUNT(DISTINCT t.CustomerID) AS CustomerCount,
    AVG(ti.UnitPrice) AS AvgPrice,
    SUM(ti.DiscountAmount) / NULLIF(SUM(ti.Quantity), 0) AS AvgDiscountPerUnit,
    CASE WHEN DATEPART(weekday, t.TransactionDate) IN (1, 7) THEN 1 ELSE 0 END AS IsWeekend
FROM 
    dbo.Transactions t
JOIN 
    dbo.TransactionItems ti ON t.TransactionID = ti.TransactionID
JOIN 
    dbo.Products p ON ti.ProductID = p.ProductID
WHERE 
    t.TransactionDate BETWEEN DATEADD(year, -2, GETDATE()) AND GETDATE()
    -- Exclude NULL sales data
    AND t.TransactionDate IS NOT NULL
    AND p.Category IS NOT NULL
    AND p.SubCategory IS NOT NULL
    AND p.ProductID IS NOT NULL
    AND p.ProductName IS NOT NULL
    AND ti.Quantity IS NOT NULL
    AND ti.UnitPrice IS NOT NULL
    AND ti.DiscountAmount IS NOT NULL
    AND t.StoreID IS NOT NULL
    AND t.CustomerID IS NOT NULL
GROUP BY 
    CAST(t.TransactionDate AS DATE), p.Category, p.SubCategory, p.ProductID, p.ProductName
ORDER BY 
    SalesDate, p.Category, p.SubCategory, p.ProductID;

-- 4.3 Promotional Impact Analysis
-- Analyzes the effectiveness of promotional campaigns
-- Excludes records with NULL promotion data
SELECT 
    pr.PromotionID,
    pr.PromotionName,
    pr.PromotionType,
    pr.StartDate,
    pr.EndDate,
    DATEDIFF(day, pr.StartDate, pr.EndDate) + 1 AS PromotionDuration,
    COUNT(DISTINCT t.TransactionID) AS TransactionsDuringPromotion,
    COUNT(DISTINCT t.TransactionID) / NULLIF(DATEDIFF(day, pr.StartDate, pr.EndDate), 0) AS AvgDailyTransactions,
    COUNT(DISTINCT t.CustomerID) AS UniqueCustomers,
    SUM(t.TotalAmount) AS TotalRevenue,
    SUM(t.TotalAmount) / NULLIF((DATEDIFF(day, pr.StartDate, pr.EndDate) + 1), 0) AS AvgDailyRevenue,
    -- Compare with pre-promotion period of same duration
    (SELECT COUNT(DISTINCT t2.TransactionID) 
     FROM dbo.Transactions t2 
     WHERE t2.TransactionDate BETWEEN DATEADD(day, -DATEDIFF(day, pr.StartDate, pr.EndDate) - 1, pr.StartDate) AND DATEADD(day, -1, pr.StartDate)
     AND t2.TransactionID IS NOT NULL) AS TransactionsPrePromotion,
    (SELECT SUM(t2.TotalAmount) 
     FROM dbo.Transactions t2 
     WHERE t2.TransactionDate BETWEEN DATEADD(day, -DATEDIFF(day, pr.StartDate, pr.EndDate) - 1, pr.StartDate) AND DATEADD(day, -1, pr.StartDate)
     AND t2.TotalAmount IS NOT NULL) AS RevenuePrePromotion,
    -- Calculate lift
    COUNT(DISTINCT t.TransactionID) * 100.0 / NULLIF((SELECT COUNT(DISTINCT t2.TransactionID) 
                                                    FROM dbo.Transactions t2 
                                                    WHERE t2.TransactionDate BETWEEN DATEADD(day, -DATEDIFF(day, pr.StartDate, pr.EndDate) - 1, pr.StartDate) AND DATEADD(day, -1, pr.StartDate)
                                                    AND t2.TransactionID IS NOT NULL), 0) - 100 AS TransactionLiftPct,
    SUM(t.TotalAmount) * 100.0 / NULLIF((SELECT SUM(t2.TotalAmount) 
                                      FROM dbo.Transactions t2 
                                      WHERE t2.TransactionDate BETWEEN DATEADD(day, -DATEDIFF(day, pr.StartDate, pr.EndDate) - 1, pr.StartDate) AND DATEADD(day, -1, pr.StartDate)
                                      AND t2.TotalAmount IS NOT NULL), 0) - 100 AS RevenueLiftPct
FROM 
    dbo.Promotions pr
JOIN 
    dbo.Transactions t ON t.TransactionDate BETWEEN pr.StartDate AND pr.EndDate
LEFT JOIN 
    dbo.PromotionProducts pp ON pr.PromotionID = pp.PromotionID
LEFT JOIN 
    dbo.TransactionItems ti ON t.TransactionID = ti.TransactionID AND (pp.ProductID IS NULL OR ti.ProductID = pp.ProductID)
WHERE 
    pr.StartDate >= DATEADD(year, -1, GETDATE())
    -- Exclude NULL promotion data
    AND pr.PromotionID IS NOT NULL
    AND pr.PromotionName IS NOT NULL
    AND pr.PromotionType IS NOT NULL
    AND pr.StartDate IS NOT NULL
    AND pr.EndDate IS NOT NULL
    AND t.TransactionID IS NOT NULL
    AND t.CustomerID IS NOT NULL
    AND t.TotalAmount IS NOT NULL
GROUP BY 
    pr.PromotionID, pr.PromotionName, pr.PromotionType, pr.StartDate, pr.EndDate
ORDER BY 
    pr.StartDate DESC;