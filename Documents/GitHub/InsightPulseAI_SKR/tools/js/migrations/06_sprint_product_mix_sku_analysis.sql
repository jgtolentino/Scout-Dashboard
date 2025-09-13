-- ================================================================
-- Sprint 6: Product Mix & SKU Analysis Module
-- Scout Dashboard - Product Analytics Implementation
-- 
-- Purpose: Complete product and inventory analytics capabilities
-- Components: ProductDimension, InventoryFact, SalesFact, Views, Procedures
-- ================================================================

USE ScoutAnalytics;
GO

-- ================================================================
-- STEP 1: Create ProductDimension Table
-- ================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductDimension')
BEGIN
    CREATE TABLE ProductDimension (
        ProductID INT IDENTITY(1,1) PRIMARY KEY,
        ProductName NVARCHAR(200) NOT NULL,
        SKU NVARCHAR(50) NOT NULL UNIQUE,
        Category NVARCHAR(100) NOT NULL,
        SubCategory NVARCHAR(100),
        Brand NVARCHAR(100),
        UnitPrice DECIMAL(10,2) NOT NULL,
        CostPrice DECIMAL(10,2),
        LaunchDate DATE,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
        LastModified DATETIME2 DEFAULT GETUTCDATE()
    );
    
    PRINT 'ProductDimension table created successfully';
END
ELSE
BEGIN
    PRINT 'ProductDimension table already exists';
END
GO

-- ================================================================
-- STEP 2: Create InventoryFact Table
-- ================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryFact')
BEGIN
    CREATE TABLE InventoryFact (
        InventoryID INT IDENTITY(1,1) PRIMARY KEY,
        ProductID INT NOT NULL,
        LocationID INT NOT NULL,
        StockLevel INT NOT NULL DEFAULT 0,
        ReorderPoint INT NOT NULL DEFAULT 0,
        MaxStock INT,
        LastRestocked DATETIME2,
        MovementType NVARCHAR(20) CHECK (MovementType IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER')),
        MovementQuantity INT,
        MovementDate DATETIME2 DEFAULT GETUTCDATE(),
        StockValue DECIMAL(12,2),
        StockStatus NVARCHAR(20) DEFAULT 'NORMAL',
        CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
        
        FOREIGN KEY (ProductID) REFERENCES ProductDimension(ProductID),
        FOREIGN KEY (LocationID) REFERENCES GeoDimension(LocationID)
    );
    
    PRINT 'InventoryFact table created successfully';
END
ELSE
BEGIN
    PRINT 'InventoryFact table already exists';
END
GO

-- ================================================================
-- STEP 3: Create SalesFact Table
-- ================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesFact')
BEGIN
    CREATE TABLE SalesFact (
        SaleID INT IDENTITY(1,1) PRIMARY KEY,
        ProductID INT NOT NULL,
        LocationID INT NOT NULL,
        CustomerID NVARCHAR(50),
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(10,2) NOT NULL,
        Revenue DECIMAL(12,2) NOT NULL,
        CostOfGoods DECIMAL(12,2),
        Profit DECIMAL(12,2),
        SaleDate DATETIME2 NOT NULL,
        SalesPersonID NVARCHAR(50),
        PaymentMethod NVARCHAR(50),
        CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
        
        FOREIGN KEY (ProductID) REFERENCES ProductDimension(ProductID),
        FOREIGN KEY (LocationID) REFERENCES GeoDimension(LocationID)
    );
    
    PRINT 'SalesFact table created successfully';
END
ELSE
BEGIN
    PRINT 'SalesFact table already exists';
END
GO

-- ================================================================
-- STEP 4: Create Product Mix Analysis View
-- ================================================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_ProductMixAnalysis')
    DROP VIEW v_ProductMixAnalysis;
GO

CREATE VIEW v_ProductMixAnalysis AS
SELECT 
    p.Category,
    p.SubCategory,
    COUNT(DISTINCT p.ProductID) AS ProductCount,
    COUNT(DISTINCT s.SaleID) AS TransactionCount,
    SUM(s.Quantity) AS TotalUnitsSold,
    SUM(s.Revenue) AS TotalRevenue,
    SUM(s.Profit) AS TotalProfit,
    AVG(s.UnitPrice) AS AvgSellingPrice,
    CASE 
        WHEN SUM(SUM(s.Revenue)) OVER() > 0 
        THEN ROUND((SUM(s.Revenue) * 100.0 / SUM(SUM(s.Revenue)) OVER()), 2)
        ELSE 0 
    END AS MarketSharePercentage,
    CASE 
        WHEN SUM(s.Quantity) > 0 
        THEN ROUND(SUM(s.Profit) / SUM(s.Revenue) * 100, 2)
        ELSE 0 
    END AS ProfitMarginPercentage
FROM ProductDimension p
LEFT JOIN SalesFact s ON p.ProductID = s.ProductID
WHERE p.IsActive = 1
GROUP BY p.Category, p.SubCategory;
GO

PRINT 'v_ProductMixAnalysis view created successfully';

-- ================================================================
-- STEP 5: Create SKU Performance Analysis View
-- ================================================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_SKUPerformance')
    DROP VIEW v_SKUPerformance;
GO

CREATE VIEW v_SKUPerformance AS
SELECT 
    p.ProductID,
    p.ProductName,
    p.SKU,
    p.Category,
    p.Brand,
    p.UnitPrice,
    COALESCE(SUM(s.Quantity), 0) AS UnitsSold,
    COALESCE(SUM(s.Revenue), 0) AS Revenue,
    COALESCE(SUM(s.Profit), 0) AS Profit,
    COALESCE(AVG(i.StockLevel), 0) AS AvgStockLevel,
    CASE 
        WHEN AVG(i.StockLevel) > 0 AND SUM(s.Quantity) > 0
        THEN ROUND(SUM(s.Quantity) / AVG(i.StockLevel), 2)
        ELSE 0 
    END AS InventoryTurnover,
    CASE 
        WHEN SUM(s.Revenue) > 0 
        THEN ROUND(SUM(s.Profit) / SUM(s.Revenue) * 100, 2)
        ELSE 0 
    END AS ProfitMargin,
    CASE 
        WHEN AVG(i.StockLevel) > 0 AND AVG(COALESCE(s.Quantity, 0)) > 0
        THEN ROUND(AVG(i.StockLevel) / (AVG(COALESCE(s.Quantity, 0)) / 30.0), 0)
        ELSE 999 
    END AS DaysOfStock,
    COUNT(DISTINCT s.LocationID) AS LocationsCovered
FROM ProductDimension p
LEFT JOIN SalesFact s ON p.ProductID = s.ProductID 
    AND s.SaleDate >= DATEADD(MONTH, -3, GETUTCDATE())
LEFT JOIN InventoryFact i ON p.ProductID = i.ProductID
WHERE p.IsActive = 1
GROUP BY p.ProductID, p.ProductName, p.SKU, p.Category, p.Brand, p.UnitPrice;
GO

PRINT 'v_SKUPerformance view created successfully';

-- ================================================================
-- STEP 6: Create Inventory Density Analysis View
-- ================================================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_InventoryDensity')
    DROP VIEW v_InventoryDensity;
GO

CREATE VIEW v_InventoryDensity AS
SELECT 
    g.LocationID,
    g.Barangay,
    g.Municipality,
    g.Province,
    g.Latitude,
    g.Longitude,
    p.Category,
    COUNT(DISTINCT i.ProductID) AS ProductsInStock,
    SUM(i.StockLevel) AS TotalStock,
    SUM(i.StockValue) AS TotalStockValue,
    AVG(i.StockLevel) AS AvgStockLevel,
    COUNT(CASE WHEN i.StockLevel <= i.ReorderPoint THEN 1 END) AS LowStockItems,
    COUNT(CASE WHEN i.StockLevel = 0 THEN 1 END) AS OutOfStockItems,
    CASE 
        WHEN COUNT(DISTINCT i.ProductID) > 0
        THEN ROUND(SUM(i.StockLevel) / COUNT(DISTINCT i.ProductID), 2)
        ELSE 0 
    END AS StockDensity
FROM GeoDimension g
LEFT JOIN InventoryFact i ON g.LocationID = i.LocationID
LEFT JOIN ProductDimension p ON i.ProductID = p.ProductID
WHERE g.LocationType = 'Barangay'
GROUP BY g.LocationID, g.Barangay, g.Municipality, g.Province, 
         g.Latitude, g.Longitude, p.Category;
GO

PRINT 'v_InventoryDensity view created successfully';

-- ================================================================
-- STEP 7: Create Seasonal Trends Analysis View
-- ================================================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_SeasonalTrends')
    DROP VIEW v_SeasonalTrends;
GO

CREATE VIEW v_SeasonalTrends AS
SELECT 
    p.Category,
    p.SubCategory,
    YEAR(s.SaleDate) AS SaleYear,
    MONTH(s.SaleDate) AS SaleMonth,
    DATENAME(MONTH, s.SaleDate) AS MonthName,
    DATEPART(QUARTER, s.SaleDate) AS Quarter,
    SUM(s.Quantity) AS UnitsSold,
    SUM(s.Revenue) AS Revenue,
    SUM(s.Profit) AS Profit,
    COUNT(DISTINCT s.SaleID) AS TransactionCount,
    AVG(s.UnitPrice) AS AvgPrice,
    COUNT(DISTINCT s.LocationID) AS LocationsCovered
FROM ProductDimension p
INNER JOIN SalesFact s ON p.ProductID = s.ProductID
WHERE p.IsActive = 1 
  AND s.SaleDate >= DATEADD(YEAR, -2, GETUTCDATE())
GROUP BY p.Category, p.SubCategory, YEAR(s.SaleDate), MONTH(s.SaleDate), 
         DATENAME(MONTH, s.SaleDate), DATEPART(QUARTER, s.SaleDate);
GO

PRINT 'v_SeasonalTrends view created successfully';

-- ================================================================
-- STEP 8: Create Stored Procedure - Get Product Mix Analysis
-- ================================================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetProductMix')
    DROP PROCEDURE sp_GetProductMix;
GO

CREATE PROCEDURE sp_GetProductMix
    @StartDate DATETIME2,
    @EndDate DATETIME2,
    @CategoryFilter NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pma.Category,
        pma.SubCategory,
        pma.ProductCount,
        pma.TransactionCount,
        pma.TotalUnitsSold,
        pma.TotalRevenue,
        pma.TotalProfit,
        pma.AvgSellingPrice,
        pma.MarketSharePercentage,
        pma.ProfitMarginPercentage
    FROM v_ProductMixAnalysis pma
    INNER JOIN SalesFact s ON EXISTS (
        SELECT 1 FROM ProductDimension p 
        WHERE p.Category = pma.Category 
          AND p.SubCategory = pma.SubCategory
          AND p.ProductID = s.ProductID
          AND s.SaleDate >= @StartDate 
          AND s.SaleDate <= @EndDate
    )
    WHERE (@CategoryFilter IS NULL OR pma.Category = @CategoryFilter)
    ORDER BY pma.TotalRevenue DESC;
END
GO

PRINT 'sp_GetProductMix procedure created successfully';

-- ================================================================
-- STEP 9: Create Stored Procedure - Get SKU Performance
-- ================================================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetSKUPerformance')
    DROP PROCEDURE sp_GetSKUPerformance;
GO

CREATE PROCEDURE sp_GetSKUPerformance
    @StartDate DATETIME2,
    @EndDate DATETIME2,
    @TopN INT = 20,
    @SortBy NVARCHAR(20) = 'Revenue'
AS
BEGIN
    SET NOCOUNT ON;
    
    WITH RankedSKUs AS (
        SELECT 
            sku.*,
            ROW_NUMBER() OVER (
                ORDER BY 
                    CASE WHEN @SortBy = 'Revenue' THEN sku.Revenue END DESC,
                    CASE WHEN @SortBy = 'Volume' THEN sku.UnitsSold END DESC,
                    CASE WHEN @SortBy = 'Margin' THEN sku.ProfitMargin END DESC,
                    sku.Revenue DESC
            ) AS Rank
        FROM v_SKUPerformance sku
        WHERE EXISTS (
            SELECT 1 FROM SalesFact s 
            WHERE s.ProductID = sku.ProductID 
              AND s.SaleDate >= @StartDate 
              AND s.SaleDate <= @EndDate
        )
    )
    SELECT 
        ProductID,
        ProductName,
        SKU,
        Category,
        Brand,
        UnitPrice,
        UnitsSold,
        Revenue,
        Profit,
        AvgStockLevel,
        InventoryTurnover,
        ProfitMargin,
        DaysOfStock,
        LocationsCovered,
        Rank
    FROM RankedSKUs
    WHERE Rank <= @TopN
    ORDER BY Rank;
END
GO

PRINT 'sp_GetSKUPerformance procedure created successfully';

-- ================================================================
-- STEP 10: Create Stored Procedure - Get Inventory Density
-- ================================================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetInventoryDensity')
    DROP PROCEDURE sp_GetInventoryDensity;
GO

CREATE PROCEDURE sp_GetInventoryDensity
    @LocationLevel NVARCHAR(20) = 'Barangay',
    @StockThreshold INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        LocationID,
        Barangay,
        Municipality,
        Province,
        Latitude,
        Longitude,
        Category,
        ProductsInStock,
        TotalStock,
        TotalStockValue,
        AvgStockLevel,
        LowStockItems,
        OutOfStockItems,
        StockDensity,
        CASE 
            WHEN LowStockItems > 0 THEN 'LOW_STOCK'
            WHEN OutOfStockItems > 0 THEN 'OUT_OF_STOCK'
            WHEN AvgStockLevel > @StockThreshold * 2 THEN 'HIGH_STOCK'
            ELSE 'NORMAL'
        END AS StockStatus
    FROM v_InventoryDensity
    WHERE TotalStock > 0
    ORDER BY StockDensity DESC, TotalStockValue DESC;
END
GO

PRINT 'sp_GetInventoryDensity procedure created successfully';

-- ================================================================
-- STEP 11: Create Stored Procedure - Get Seasonal Trends
-- ================================================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetSeasonalTrends')
    DROP PROCEDURE sp_GetSeasonalTrends;
GO

CREATE PROCEDURE sp_GetSeasonalTrends
    @ProductCategory NVARCHAR(100) = NULL,
    @TimeGranularity NVARCHAR(20) = 'Monthly',
    @YearsBack INT = 2
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATETIME2 = DATEADD(YEAR, -@YearsBack, GETUTCDATE());
    
    IF @TimeGranularity = 'Monthly'
    BEGIN
        SELECT 
            Category,
            SubCategory,
            SaleYear,
            SaleMonth,
            MonthName,
            Quarter,
            UnitsSold,
            Revenue,
            Profit,
            TransactionCount,
            AvgPrice,
            LocationsCovered,
            LAG(Revenue, 12) OVER (PARTITION BY Category ORDER BY SaleYear, SaleMonth) AS PrevYearRevenue,
            CASE 
                WHEN LAG(Revenue, 12) OVER (PARTITION BY Category ORDER BY SaleYear, SaleMonth) > 0
                THEN ROUND((Revenue - LAG(Revenue, 12) OVER (PARTITION BY Category ORDER BY SaleYear, SaleMonth)) / 
                     LAG(Revenue, 12) OVER (PARTITION BY Category ORDER BY SaleYear, SaleMonth) * 100, 2)
                ELSE NULL
            END AS YoYGrowthPercentage
        FROM v_SeasonalTrends
        WHERE (@ProductCategory IS NULL OR Category = @ProductCategory)
        ORDER BY Category, SaleYear, SaleMonth;
    END
    ELSE
    BEGIN
        SELECT 
            Category,
            SaleYear,
            Quarter,
            SUM(UnitsSold) AS UnitsSold,
            SUM(Revenue) AS Revenue,
            SUM(Profit) AS Profit,
            SUM(TransactionCount) AS TransactionCount,
            AVG(AvgPrice) AS AvgPrice,
            MAX(LocationsCovered) AS LocationsCovered
        FROM v_SeasonalTrends
        WHERE (@ProductCategory IS NULL OR Category = @ProductCategory)
        GROUP BY Category, SaleYear, Quarter
        ORDER BY Category, SaleYear, Quarter;
    END
END
GO

PRINT 'sp_GetSeasonalTrends procedure created successfully';

-- ================================================================
-- STEP 12: Create Performance Indexes
-- ================================================================

-- ProductDimension indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductDimension_Category_Active')
    CREATE INDEX IX_ProductDimension_Category_Active ON ProductDimension(Category, IsActive);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductDimension_SKU')
    CREATE INDEX IX_ProductDimension_SKU ON ProductDimension(SKU);

-- InventoryFact indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InventoryFact_ProductLocation')
    CREATE INDEX IX_InventoryFact_ProductLocation ON InventoryFact(ProductID, LocationID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InventoryFact_StockLevel')
    CREATE INDEX IX_InventoryFact_StockLevel ON InventoryFact(StockLevel, ReorderPoint);

-- SalesFact indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SalesFact_ProductDate')
    CREATE INDEX IX_SalesFact_ProductDate ON SalesFact(ProductID, SaleDate);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SalesFact_LocationDate')
    CREATE INDEX IX_SalesFact_LocationDate ON SalesFact(LocationID, SaleDate);

PRINT 'Performance indexes created successfully';

-- ================================================================
-- STEP 13: Populate Sample Data
-- ================================================================

-- Sample Product Data
INSERT INTO ProductDimension (ProductName, SKU, Category, SubCategory, Brand, UnitPrice, CostPrice, LaunchDate)
VALUES 
    ('Instant Coffee 3-in-1', 'CF001', 'Beverages', 'Coffee', 'NescafΓ©', 3.50, 2.10, '2024-01-15'),
    ('White Rice 5kg', 'RC001', 'Staples', 'Rice', 'Dinorado', 285.00, 200.00, '2024-01-10'),
    ('Cooking Oil 1L', 'OIL001', 'Cooking', 'Oil', 'Minola', 89.00, 65.00, '2024-01-20'),
    ('Canned Sardines', 'CN001', 'Canned Goods', 'Fish', 'Ligo', 28.50, 18.00, '2024-02-01'),
    ('Laundry Soap Bar', 'SP001', 'Household', 'Cleaning', 'Tide', 12.00, 8.00, '2024-01-25'),
    ('Shampoo Sachet', 'SH001', 'Personal Care', 'Hair Care', 'Pantene', 8.50, 5.50, '2024-02-10'),
    ('Biscuits Pack', 'BC001', 'Snacks', 'Biscuits', 'Skyflakes', 15.00, 10.00, '2024-01-30'),
    ('Energy Drink', 'ED001', 'Beverages', 'Energy', 'Red Bull', 45.00, 30.00, '2024-02-15'),
    ('Instant Noodles', 'ND001', 'Instant Food', 'Noodles', 'Lucky Me', 13.50, 9.00, '2024-01-18'),
    ('Bath Soap', 'BS001', 'Personal Care', 'Bath', 'Safeguard', 25.00, 17.00, '2024-02-05');

-- Sample Inventory Data
DECLARE @ProductID INT, @LocationID INT;
DECLARE product_cursor CURSOR FOR SELECT ProductID FROM ProductDimension;
DECLARE location_cursor CURSOR FOR SELECT TOP 5 LocationID FROM GeoDimension WHERE LocationType = 'Barangay';

OPEN product_cursor;
FETCH NEXT FROM product_cursor INTO @ProductID;

WHILE @@FETCH_STATUS = 0
BEGIN
    OPEN location_cursor;
    FETCH NEXT FROM location_cursor INTO @LocationID;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO InventoryFact (ProductID, LocationID, StockLevel, ReorderPoint, MaxStock, LastRestocked, StockValue, StockStatus)
        VALUES (
            @ProductID, 
            @LocationID, 
            FLOOR(RAND() * 100) + 10,  -- Random stock 10-110
            15,  -- Reorder point
            150, -- Max stock
            DATEADD(DAY, -FLOOR(RAND() * 30), GETUTCDATE()), -- Last restocked within 30 days
            (FLOOR(RAND() * 100) + 10) * (SELECT UnitPrice FROM ProductDimension WHERE ProductID = @ProductID),
            'NORMAL'
        );
        
        FETCH NEXT FROM location_cursor INTO @LocationID;
    END
    
    CLOSE location_cursor;
    FETCH NEXT FROM product_cursor INTO @ProductID;
END

CLOSE product_cursor;
DEALLOCATE product_cursor;
DEALLOCATE location_cursor;

-- Sample Sales Data
DECLARE @SaleDate DATETIME2;
DECLARE @DaysBack INT = 90;

WHILE @DaysBack > 0
BEGIN
    SET @SaleDate = DATEADD(DAY, -@DaysBack, GETUTCDATE());
    
    -- Generate 5-15 random sales per day
    DECLARE @SalesCount INT = FLOOR(RAND() * 10) + 5;
    DECLARE @CurrentSale INT = 0;
    
    WHILE @CurrentSale < @SalesCount
    BEGIN
        SELECT TOP 1 
            @ProductID = ProductID,
            @LocationID = (SELECT TOP 1 LocationID FROM GeoDimension WHERE LocationType = 'Barangay' ORDER BY NEWID())
        FROM ProductDimension 
        ORDER BY NEWID();
        
        DECLARE @Quantity INT = FLOOR(RAND() * 5) + 1;
        DECLARE @UnitPrice DECIMAL(10,2) = (SELECT UnitPrice FROM ProductDimension WHERE ProductID = @ProductID);
        DECLARE @CostPrice DECIMAL(10,2) = ISNULL((SELECT CostPrice FROM ProductDimension WHERE ProductID = @ProductID), @UnitPrice * 0.7);
        
        INSERT INTO SalesFact (ProductID, LocationID, CustomerID, Quantity, UnitPrice, Revenue, CostOfGoods, Profit, SaleDate)
        VALUES (
            @ProductID,
            @LocationID,
            'CUST' + RIGHT('000' + CAST(FLOOR(RAND() * 1000) AS VARCHAR), 4),
            @Quantity,
            @UnitPrice,
            @Quantity * @UnitPrice,
            @Quantity * @CostPrice,
            @Quantity * (@UnitPrice - @CostPrice),
            @SaleDate
        );
        
        SET @CurrentSale = @CurrentSale + 1;
    END
    
    SET @DaysBack = @DaysBack - 1;
END

PRINT 'Sample data populated successfully';

-- ================================================================
-- STEP 14: Data Validation and Testing
-- ================================================================

PRINT 'Running data validation tests...';

-- Test product mix analysis
DECLARE @ProductCount INT = (SELECT COUNT(*) FROM ProductDimension WHERE IsActive = 1);
DECLARE @CategoryCount INT = (SELECT COUNT(DISTINCT Category) FROM v_ProductMixAnalysis);
PRINT 'Products: ' + CAST(@ProductCount AS VARCHAR) + ', Categories in analysis: ' + CAST(@CategoryCount AS VARCHAR);

-- Test SKU performance
DECLARE @SKUWithSales INT = (SELECT COUNT(DISTINCT ProductID) FROM v_SKUPerformance WHERE UnitsSold > 0);
PRINT 'SKUs with sales data: ' + CAST(@SKUWithSales AS VARCHAR);

-- Test inventory density
DECLARE @LocationsWithInventory INT = (SELECT COUNT(DISTINCT LocationID) FROM v_InventoryDensity WHERE TotalStock > 0);
PRINT 'Locations with inventory: ' + CAST(@LocationsWithInventory AS VARCHAR);

-- Test seasonal trends
DECLARE @MonthsWithData INT = (SELECT COUNT(*) FROM v_SeasonalTrends);
PRINT 'Months with sales data: ' + CAST(@MonthsWithData AS VARCHAR);

-- Test stored procedures
EXEC sp_GetProductMix @StartDate = '2024-01-01', @EndDate = '2024-12-31';
EXEC sp_GetSKUPerformance @StartDate = '2024-01-01', @EndDate = '2024-12-31', @TopN = 5;
EXEC sp_GetInventoryDensity @LocationLevel = 'Barangay', @StockThreshold = 10;
EXEC sp_GetSeasonalTrends @ProductCategory = NULL, @TimeGranularity = 'Monthly', @YearsBack = 1;

PRINT '================================================================';
PRINT 'Product Mix & SKU Analysis Migration Completed Successfully!';
PRINT '================================================================';
PRINT 'Tables Created: ProductDimension, InventoryFact, SalesFact';
PRINT 'Views Created: v_ProductMixAnalysis, v_SKUPerformance, v_InventoryDensity, v_SeasonalTrends';
PRINT 'Procedures Created: sp_GetProductMix, sp_GetSKUPerformance, sp_GetInventoryDensity, sp_GetSeasonalTrends';
PRINT 'Sample Data: ' + CAST(@ProductCount AS VARCHAR) + ' products, sales data for 90 days';
PRINT 'Ready for API and frontend implementation';
PRINT '================================================================';