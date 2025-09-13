-- SQL Queries for Session and Sales Interactions
-- For use with Project Scout Retail Advisor

-- 1. Basic Sales Transactions Query
-- Returns the most recent 100 sales transactions with key metrics
SELECT 
    t.TransactionID,
    t.StoreID,
    s.StoreName,
    t.RegisterID,
    t.EmployeeID,
    e.EmployeeName,
    t.CustomerID,
    t.TransactionDate,
    t.TransactionTime,
    t.TotalAmount,
    t.PaymentMethod,
    t.ItemCount,
    t.DiscountAmount,
    t.TaxAmount,
    t.Status
FROM 
    Sales.Transactions t
INNER JOIN 
    Store.Locations s ON t.StoreID = s.StoreID
INNER JOIN 
    HR.Employees e ON t.EmployeeID = e.EmployeeID
WHERE 
    t.TransactionDate >= DATEADD(day, -30, GETDATE())
ORDER BY 
    t.TransactionDate DESC, t.TransactionTime DESC
OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY;

-- 2. Daily Sales Summary by Store
-- Aggregates sales data by store and date for the last 30 days
SELECT 
    s.StoreID,
    s.StoreName,
    s.Region,
    s.StoreType,
    CAST(t.TransactionDate AS DATE) AS SalesDate,
    COUNT(t.TransactionID) AS TransactionCount,
    SUM(t.TotalAmount) AS TotalSales,
    SUM(t.ItemCount) AS TotalItemsSold,
    AVG(t.TotalAmount) AS AverageTransactionValue,
    SUM(t.TotalAmount) / NULLIF(COUNT(DISTINCT t.CustomerID), 0) AS AverageCustomerSpend
FROM 
    Sales.Transactions t
INNER JOIN 
    Store.Locations s ON t.StoreID = s.StoreID
WHERE 
    t.TransactionDate >= DATEADD(day, -30, GETDATE())
    AND t.Status = 'Completed'
GROUP BY 
    s.StoreID, s.StoreName, s.Region, s.StoreType, CAST(t.TransactionDate AS DATE)
ORDER BY 
    s.StoreID, CAST(t.TransactionDate AS DATE);

-- 3. Customer Session Analysis
-- Shows customer sessions with duration and activity metrics
SELECT 
    cs.SessionID,
    cs.CustomerID,
    c.CustomerName,
    c.CustomerSegment,
    cs.StoreID,
    s.StoreName,
    cs.SessionStartTime,
    cs.SessionEndTime,
    DATEDIFF(minute, cs.SessionStartTime, cs.SessionEndTime) AS SessionDurationMinutes,
    cs.DeviceType,
    cs.ChannelType,
    cs.PageViews,
    cs.ProductViews,
    cs.SearchCount,
    cs.CartAdditions,
    cs.CartRemovals,
    CASE WHEN t.TransactionID IS NOT NULL THEN 'Yes' ELSE 'No' END AS MadeAPurchase,
    COALESCE(t.TotalAmount, 0) AS PurchaseAmount
FROM 
    Analytics.CustomerSessions cs
LEFT JOIN 
    Customer.Profiles c ON cs.CustomerID = c.CustomerID
LEFT JOIN 
    Store.Locations s ON cs.StoreID = s.StoreID
LEFT JOIN 
    Sales.Transactions t ON cs.SessionID = t.SessionID
WHERE 
    cs.SessionStartTime >= DATEADD(day, -7, GETDATE())
ORDER BY 
    cs.SessionStartTime DESC;

-- 4. Product Performance Analysis
-- Shows top-selling products with metrics
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    p.SubCategory,
    p.Brand,
    SUM(ti.Quantity) AS TotalQuantitySold,
    SUM(ti.LineTotal) AS TotalRevenue,
    COUNT(DISTINCT t.TransactionID) AS TransactionCount,
    COUNT(DISTINCT t.CustomerID) AS UniqueCustomers,
    AVG(ti.UnitPrice) AS AverageSellingPrice,
    SUM(ti.LineTotal) / SUM(ti.Quantity) AS AverageRevenuePerUnit
FROM 
    Sales.TransactionItems ti
INNER JOIN 
    Sales.Transactions t ON ti.TransactionID = t.TransactionID
INNER JOIN 
    Inventory.Products p ON ti.ProductID = p.ProductID
WHERE 
    t.TransactionDate >= DATEADD(day, -30, GETDATE())
    AND t.Status = 'Completed'
GROUP BY 
    p.ProductID, p.ProductName, p.Category, p.SubCategory, p.Brand
ORDER BY 
    TotalRevenue DESC;

-- 5. Store Traffic Analysis by Hour
-- Shows customer traffic patterns by hour of day
SELECT 
    s.StoreID,
    s.StoreName,
    DATEPART(hour, cs.SessionStartTime) AS HourOfDay,
    COUNT(cs.SessionID) AS SessionCount,
    COUNT(DISTINCT cs.CustomerID) AS UniqueCustomers,
    AVG(DATEDIFF(minute, cs.SessionStartTime, cs.SessionEndTime)) AS AvgSessionDurationMinutes,
    SUM(CASE WHEN t.TransactionID IS NOT NULL THEN 1 ELSE 0 END) AS CompletedTransactions,
    SUM(COALESCE(t.TotalAmount, 0)) AS TotalSales,
    CAST(SUM(CASE WHEN t.TransactionID IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(COUNT(cs.SessionID), 0) AS ConversionRate
FROM 
    Analytics.CustomerSessions cs
LEFT JOIN 
    Store.Locations s ON cs.StoreID = s.StoreID
LEFT JOIN 
    Sales.Transactions t ON cs.SessionID = t.SessionID AND t.Status = 'Completed'
WHERE 
    cs.SessionStartTime >= DATEADD(day, -30, GETDATE())
GROUP BY 
    s.StoreID, s.StoreName, DATEPART(hour, cs.SessionStartTime)
ORDER BY 
    s.StoreID, DATEPART(hour, cs.SessionStartTime);

-- 6. Customer Shopping Behavior Analysis
-- Analyzes customer shopping patterns and preferences
SELECT 
    c.CustomerSegment,
    p.Category,
    COUNT(DISTINCT t.CustomerID) AS UniqueCustomers,
    COUNT(DISTINCT t.TransactionID) AS TransactionCount,
    SUM(ti.Quantity) AS TotalItemsPurchased,
    SUM(ti.LineTotal) AS TotalSpend,
    AVG(ti.LineTotal / ti.Quantity) AS AveragePricePerItem,
    SUM(ti.LineTotal) / COUNT(DISTINCT t.TransactionID) AS AverageTransactionValue
FROM 
    Sales.TransactionItems ti
INNER JOIN 
    Sales.Transactions t ON ti.TransactionID = t.TransactionID
INNER JOIN 
    Inventory.Products p ON ti.ProductID = p.ProductID
INNER JOIN 
    Customer.Profiles c ON t.CustomerID = c.CustomerID
WHERE 
    t.TransactionDate >= DATEADD(day, -90, GETDATE())
    AND t.Status = 'Completed'
GROUP BY 
    c.CustomerSegment, p.Category
ORDER BY 
    c.CustomerSegment, TotalSpend DESC;

-- 7. Employee Sales Performance
-- Analyzes sales performance by employee
SELECT 
    e.EmployeeID,
    e.EmployeeName,
    e.Position,
    s.StoreID,
    s.StoreName,
    COUNT(t.TransactionID) AS TransactionCount,
    SUM(t.TotalAmount) AS TotalSales,
    SUM(t.ItemCount) AS TotalItemsSold,
    AVG(t.TotalAmount) AS AverageTransactionValue,
    SUM(t.TotalAmount) / NULLIF(COUNT(DISTINCT t.CustomerID), 0) AS AverageCustomerSpend,
    COUNT(DISTINCT t.CustomerID) AS UniqueCustomers
FROM 
    Sales.Transactions t
INNER JOIN 
    HR.Employees e ON t.EmployeeID = e.EmployeeID
INNER JOIN 
    Store.Locations s ON t.StoreID = s.StoreID
WHERE 
    t.TransactionDate >= DATEADD(day, -30, GETDATE())
    AND t.Status = 'Completed'
GROUP BY 
    e.EmployeeID, e.EmployeeName, e.Position, s.StoreID, s.StoreName
ORDER BY 
    TotalSales DESC;

-- 8. Discount Effectiveness Analysis
-- Analyzes the effectiveness of discounts
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    CASE 
        WHEN ti.DiscountPercent = 0 THEN 'No Discount'
        WHEN ti.DiscountPercent BETWEEN 0.01 AND 0.1 THEN '1-10%'
        WHEN ti.DiscountPercent BETWEEN 0.11 AND 0.25 THEN '11-25%'
        WHEN ti.DiscountPercent BETWEEN 0.26 AND 0.5 THEN '26-50%'
        ELSE '51%+'
    END AS DiscountBracket,
    AVG(ti.DiscountPercent) AS AvgDiscountPercent,
    COUNT(ti.TransactionItemID) AS ItemsSold,
    SUM(ti.LineTotal) AS TotalRevenue,
    AVG(ti.Quantity) AS AvgQuantityPerTransaction
FROM 
    Sales.TransactionItems ti
INNER JOIN 
    Sales.Transactions t ON ti.TransactionID = t.TransactionID
INNER JOIN 
    Inventory.Products p ON ti.ProductID = p.ProductID
WHERE 
    t.TransactionDate >= DATEADD(day, -90, GETDATE())
    AND t.Status = 'Completed'
GROUP BY 
    p.ProductID, p.ProductName, p.Category,
    CASE 
        WHEN ti.DiscountPercent = 0 THEN 'No Discount'
        WHEN ti.DiscountPercent BETWEEN 0.01 AND 0.1 THEN '1-10%'
        WHEN ti.DiscountPercent BETWEEN 0.11 AND 0.25 THEN '11-25%'
        WHEN ti.DiscountPercent BETWEEN 0.26 AND 0.5 THEN '26-50%'
        ELSE '51%+'
    END
ORDER BY 
    p.Category, p.ProductID, DiscountBracket;

-- 9. Inventory Turnover Analysis
-- Analyzes inventory turnover rates
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    p.Brand,
    i.StoreID,
    s.StoreName,
    i.CurrentStockLevel,
    i.ReorderPoint,
    i.LastRestockDate,
    SUM(ti.Quantity) AS TotalSoldQuantity,
    i.CurrentStockLevel / NULLIF(SUM(ti.Quantity), 0) AS StockToSalesRatio,
    DATEDIFF(day, i.LastRestockDate, GETDATE()) AS DaysSinceLastRestock
FROM 
    Inventory.StockLevels i
INNER JOIN 
    Inventory.Products p ON i.ProductID = p.ProductID
INNER JOIN 
    Store.Locations s ON i.StoreID = s.StoreID
LEFT JOIN 
    Sales.TransactionItems ti ON i.ProductID = ti.ProductID
LEFT JOIN 
    Sales.Transactions t ON ti.TransactionID = t.TransactionID AND t.StoreID = i.StoreID
WHERE 
    t.TransactionDate >= DATEADD(day, -30, GETDATE())
    AND t.Status = 'Completed'
GROUP BY 
    p.ProductID, p.ProductName, p.Category, p.Brand, 
    i.StoreID, s.StoreName, i.CurrentStockLevel, i.ReorderPoint, i.LastRestockDate
ORDER BY 
    i.StoreID, StockToSalesRatio;

-- 10. Customer Behavior Segmentation
-- Advanced analysis to segment customers based on behavior
WITH CustomerMetrics AS (
    SELECT 
        c.CustomerID,
        c.CustomerName,
        c.CustomerSegment,
        COUNT(t.TransactionID) AS TransactionCount,
        SUM(t.TotalAmount) AS TotalSpend,
        MAX(t.TransactionDate) AS LastPurchaseDate,
        DATEDIFF(day, MAX(t.TransactionDate), GETDATE()) AS DaysSinceLastPurchase,
        AVG(t.TotalAmount) AS AverageTransactionValue,
        COUNT(DISTINCT DATEPART(month, t.TransactionDate)) AS ActiveMonthsCount
    FROM 
        Customer.Profiles c
    LEFT JOIN 
        Sales.Transactions t ON c.CustomerID = t.CustomerID
    WHERE 
        t.TransactionDate >= DATEADD(day, -365, GETDATE())
        AND t.Status = 'Completed'
    GROUP BY 
        c.CustomerID, c.CustomerName, c.CustomerSegment
)
SELECT 
    cm.*,
    CASE 
        WHEN TransactionCount >= 10 AND DaysSinceLastPurchase <= 30 THEN 'Loyal'
        WHEN TransactionCount >= 5 AND DaysSinceLastPurchase <= 60 THEN 'Regular'
        WHEN TransactionCount >= 1 AND DaysSinceLastPurchase <= 90 THEN 'Occasional'
        WHEN TransactionCount >= 1 THEN 'Lapsed'
        ELSE 'One-time'
    END AS BehaviorSegment,
    CASE 
        WHEN TotalSpend >= 1000 THEN 'High Value'
        WHEN TotalSpend >= 500 THEN 'Medium Value'
        ELSE 'Low Value'
    END AS ValueSegment,
    CASE 
        WHEN ActiveMonthsCount >= 9 THEN 'Consistent'
        WHEN ActiveMonthsCount >= 6 THEN 'Seasonal'
        ELSE 'Sporadic'
    END AS FrequencyPattern
FROM 
    CustomerMetrics cm
ORDER BY 
    TotalSpend DESC;