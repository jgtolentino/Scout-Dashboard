-- Migration: Seed TBWA\SMP FMCG Client Brands
-- Purpose: Add TBWA\SMP client brands and products to match live data naming conventions
-- Date: 2025-05-23

USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

-- ======================================
-- 1. CREATE BRAND DIMENSION TABLE IF NOT EXISTS
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Brands')
BEGIN
    CREATE TABLE dbo.Brands (
        BrandID INT PRIMARY KEY,
        BrandName NVARCHAR(100) NOT NULL,
        CompanyName NVARCHAR(200),
        Category NVARCHAR(50),
        IsTBWAClient BIT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- ======================================
-- 2. CREATE PRODUCTS TABLE IF NOT EXISTS
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE dbo.Products (
        ProductID NVARCHAR(20) PRIMARY KEY,
        ProductName NVARCHAR(200) NOT NULL,
        BrandID INT NOT NULL,
        CategoryID INT,
        SubCategory NVARCHAR(50),
        UPC NVARCHAR(20),
        DefaultPrice DECIMAL(10,2),
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Products_Brand FOREIGN KEY (BrandID) REFERENCES dbo.Brands(BrandID)
    );
END
GO

-- ======================================
-- 3. CREATE CATEGORY TABLE IF NOT EXISTS
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE dbo.Categories (
        CategoryID INT PRIMARY KEY,
        CategoryName NVARCHAR(50) NOT NULL,
        Description NVARCHAR(200)
    );
END
GO

-- ======================================
-- 4. INSERT CATEGORIES
-- ======================================
-- Clear existing test data if needed
DELETE FROM dbo.Categories WHERE CategoryID IN (1,2,3,4,5);

INSERT INTO dbo.Categories (CategoryID, CategoryName, Description) VALUES
(1, 'Food & Beverage', 'Food products and beverages'),
(2, 'Snacks', 'Snack foods and confectionery'),
(3, 'Dairy', 'Dairy products including milk and cream'),
(4, 'Household', 'Household cleaning and maintenance products'),
(5, 'Personal Care', 'Personal hygiene and care products');
GO

-- ======================================
-- 5. INSERT TBWA\SMP CLIENT BRANDS
-- ======================================
-- Clear existing test brands if needed
DELETE FROM dbo.Products WHERE BrandID IN (1,2,3,4);
DELETE FROM dbo.Brands WHERE BrandID IN (1,2,3,4);

-- Del Monte Philippines
INSERT INTO dbo.Brands (BrandID, BrandName, CompanyName, Category, IsTBWAClient) VALUES
(1, 'Del Monte Philippines', 'Del Monte Philippines Inc.', 'Food & Beverage', 1);

-- Oishi (Liwayway Marketing)
INSERT INTO dbo.Brands (BrandID, BrandName, CompanyName, Category, IsTBWAClient) VALUES
(2, 'Oishi', 'Liwayway Marketing Corporation', 'Snacks', 1);

-- Alaska Milk Corporation
INSERT INTO dbo.Brands (BrandID, BrandName, CompanyName, Category, IsTBWAClient) VALUES
(3, 'Alaska', 'Alaska Milk Corporation', 'Dairy', 1);

-- Peerless Products
INSERT INTO dbo.Brands (BrandID, BrandName, CompanyName, Category, IsTBWAClient) VALUES
(4, 'Peerless Products', 'Peerless Products Manufacturing Corporation', 'Household & Personal Care', 1);
GO

-- ======================================
-- 6. INSERT PRODUCTS
-- ======================================
-- Del Monte Products
INSERT INTO dbo.Products (ProductID, ProductName, BrandID, CategoryID, SubCategory, UPC, DefaultPrice) VALUES
('DM001', 'Del Monte Pineapple Juice', 1, 1, 'Beverage', '4800024573001', 35.00),
('DM002', 'Del Monte Fruit Cocktail', 1, 1, 'Canned Goods', '4800024573002', 45.00),
('DM003', 'Del Monte Tomato Sauce', 1, 1, 'Condiments', '4800024573003', 25.00),
('DM004', 'Del Monte Sweet Style Spaghetti Sauce', 1, 1, 'Pasta Sauce', '4800024573004', 55.00),
('DM005', 'Fit ''n Right Four Seasons', 1, 1, 'Health Drink', '4800024573005', 20.00),
('DM006', 'Today''s Pineapple Tidbits', 1, 1, 'Canned Goods', '4800024573006', 30.00),
('DM007', 'S&W Premium Corn Kernels', 1, 1, 'Canned Goods', '4800024573007', 40.00);

-- Oishi Products
INSERT INTO dbo.Products (ProductID, ProductName, BrandID, CategoryID, SubCategory, UPC, DefaultPrice) VALUES
('OS001', 'Oishi Prawn Crackers Original', 2, 2, 'Snack', '4800194173001', 15.00),
('OS002', 'Oishi Ridges Cheese', 2, 2, 'Potato Chips', '4800194173002', 25.00),
('OS003', 'Oishi Pillows Choco-Filled', 2, 2, 'Biscuit', '4800194173003', 8.00),
('OS004', 'Oishi Crispy Patata Baked Potato Flavor', 2, 2, 'Snack', '4800194173004', 20.00),
('OS005', 'Smart C+ Orange', 2, 2, 'Beverage', '4800194173005', 10.00),
('OS006', 'Oaties Oat Cookies', 2, 2, 'Biscuit', '4800194173006', 12.00),
('OS007', 'Gourmet Picks Salted Egg', 2, 2, 'Premium Snack', '4800194173007', 35.00);

-- Alaska Products
INSERT INTO dbo.Products (ProductID, ProductName, BrandID, CategoryID, SubCategory, UPC, DefaultPrice) VALUES
('AK001', 'Alaska Evaporated Milk 370mL', 3, 3, 'Evaporated Milk', '4800092120001', 38.00),
('AK002', 'Alaska Sweetened Condensed Milk 300mL', 3, 3, 'Condensed Milk', '4800092120002', 42.00),
('AK003', 'Alaska Powdered Milk Drink 300g', 3, 3, 'Powdered Milk', '4800092120003', 125.00),
('AK004', 'Alaska Krem-Top Coffee Creamer', 3, 3, 'Coffee Creamer', '4800092120004', 20.00),
('AK005', 'Alpine Full Cream Milk 1L', 3, 3, 'Fresh Milk', '4800092120005', 95.00),
('AK006', 'Cow Bell Condensed Milk 150mL', 3, 3, 'Condensed Milk', '4800092120006', 22.00);

-- Peerless Products
INSERT INTO dbo.Products (ProductID, ProductName, BrandID, CategoryID, SubCategory, UPC, DefaultPrice) VALUES
('PP001', 'Champion Detergent Powder 1kg', 4, 4, 'Laundry', '4806517260001', 65.00),
('PP002', 'Champion Liquid Detergent 1L', 4, 4, 'Laundry', '4806517260002', 85.00),
('PP003', 'Cyclone Intensified Bleach 500mL', 4, 4, 'Household Cleaner', '4806517260003', 25.00),
('PP004', 'Calla Moisturizing Body Wash 200mL', 4, 5, 'Personal Care', '4806517260004', 45.00),
('PP005', 'Hana Shampoo Anti-Dandruff 200mL', 4, 5, 'Hair Care', '4806517260005', 55.00),
('PP006', 'Pride Dishwashing Liquid Lemon 250mL', 4, 4, 'Dishwashing', '4806517260006', 30.00),
('PP007', 'Care Plus Hand Sanitizer 100mL', 4, 5, 'Hygiene', '4806517260007', 35.00);
GO

-- ======================================
-- 7. CREATE STORE BRAND AVAILABILITY TABLE
-- ======================================
-- Track which brands are available in which stores (sari-sari stores have limited SKUs)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StoreBrandAvailability')
BEGIN
    CREATE TABLE dbo.StoreBrandAvailability (
        StoreID INT NOT NULL,
        BrandID INT NOT NULL,
        ProductID NVARCHAR(20) NOT NULL,
        IsAvailable BIT DEFAULT 1,
        StockLevel INT DEFAULT 50,
        LastRestockDate DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_StoreBrandAvailability PRIMARY KEY (StoreID, ProductID),
        CONSTRAINT FK_StoreBrandAvail_Store FOREIGN KEY (StoreID) REFERENCES dbo.Stores(StoreID),
        CONSTRAINT FK_StoreBrandAvail_Brand FOREIGN KEY (BrandID) REFERENCES dbo.Brands(BrandID),
        CONSTRAINT FK_StoreBrandAvail_Product FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID)
    );
END
GO

-- ======================================
-- 8. POPULATE STORE BRAND AVAILABILITY
-- ======================================
-- Sari-sari stores typically carry popular fast-moving items
-- Only populate for stores that are sari-sari type (StoreTypeID = 1)
INSERT INTO dbo.StoreBrandAvailability (StoreID, BrandID, ProductID, IsAvailable, StockLevel)
SELECT 
    s.StoreID,
    p.BrandID,
    p.ProductID,
    1 as IsAvailable,
    CASE 
        -- Popular items have higher stock
        WHEN p.ProductName LIKE '%Pineapple Juice%' THEN 100
        WHEN p.ProductName LIKE '%Prawn Crackers%' THEN 150
        WHEN p.ProductName LIKE '%Alaska%Milk%' THEN 120
        WHEN p.ProductName LIKE '%Champion Detergent%' THEN 80
        ELSE 50 + ABS(CHECKSUM(NEWID())) % 50  -- Random 50-100
    END as StockLevel
FROM dbo.Stores s
CROSS JOIN dbo.Products p
WHERE s.StoreTypeID = 1  -- Sari-sari stores only
    AND (
        -- Sari-sari stores typically stock these items
        p.ProductID IN ('DM001', 'DM003', 'DM005') -- Del Monte juice, sauce, Fit n Right
        OR p.ProductID IN ('OS001', 'OS002', 'OS005') -- Oishi crackers, ridges, Smart C
        OR p.ProductID IN ('AK001', 'AK002') -- Alaska evap and condensed milk
        OR p.ProductID IN ('PP001', 'PP006') -- Champion detergent, Pride dishwashing
    )
    AND NOT EXISTS (
        SELECT 1 FROM dbo.StoreBrandAvailability sba 
        WHERE sba.StoreID = s.StoreID AND sba.ProductID = p.ProductID
    );
GO

-- ======================================
-- 9. UPDATE SALESINTERACTIONBRANDS TABLE
-- ======================================
-- Add brand tracking to existing interactions for simulation
-- Only use brands that are available in the store
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesInteractionBrands')
BEGIN
    -- Assign TBWA brands based on store availability
    WITH RecentTransactions AS (
        SELECT TOP 1000 
            si.TransactionID,
            si.StoreID,
            si.TransactionDate,
            s.StoreTypeID
        FROM dbo.SalesInteractions si
        INNER JOIN dbo.Stores s ON si.StoreID = s.StoreID
        WHERE si.TransactionDate >= DATEADD(day, -30, GETDATE())
            AND s.StoreTypeID = 1  -- Sari-sari stores
        ORDER BY si.TransactionDate DESC
    ),
    AvailableBrands AS (
        SELECT DISTINCT 
            rt.TransactionID,
            rt.StoreID,
            sba.BrandID
        FROM RecentTransactions rt
        INNER JOIN dbo.StoreBrandAvailability sba ON rt.StoreID = sba.StoreID
        WHERE sba.IsAvailable = 1 AND sba.StockLevel > 0
    )
    INSERT INTO dbo.SalesInteractionBrands (TransactionID, StoreID, BrandID, MentionCount)
    SELECT 
        ab.TransactionID,
        ab.StoreID,
        ab.BrandID,
        CASE 
            -- Higher mention count for popular items
            WHEN ab.BrandID = 1 THEN 2 + ABS(CHECKSUM(NEWID())) % 2  -- Del Monte 2-3
            WHEN ab.BrandID = 2 THEN 1 + ABS(CHECKSUM(NEWID())) % 3  -- Oishi 1-3
            ELSE 1 + ABS(CHECKSUM(NEWID())) % 2  -- Others 1-2
        END as MentionCount
    FROM AvailableBrands ab
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.SalesInteractionBrands sib 
        WHERE sib.TransactionID = ab.TransactionID AND sib.BrandID = ab.BrandID
    );
END
GO

-- ======================================
-- 8. CREATE BRAND PERFORMANCE VIEW
-- ======================================
CREATE OR ALTER VIEW dbo.v_BrandPerformance
AS
WITH BrandMetrics AS (
    SELECT 
        b.BrandID,
        b.BrandName,
        b.Category,
        b.IsTBWAClient,
        COUNT(DISTINCT sib.TransactionID) AS TransactionCount,
        SUM(sib.MentionCount) AS TotalMentions,
        COUNT(DISTINCT si.StoreID) AS StoreReach,
        AVG(si.TransactionAmount) AS AvgTransactionValue,
        SUM(si.TransactionAmount) AS TotalRevenue
    FROM dbo.Brands b
    LEFT JOIN dbo.SalesInteractionBrands sib ON b.BrandID = sib.BrandID
    LEFT JOIN dbo.SalesInteractions si ON sib.TransactionID = si.TransactionID
    WHERE b.IsActive = 1
    GROUP BY b.BrandID, b.BrandName, b.Category, b.IsTBWAClient
)
SELECT 
    *,
    CASE 
        WHEN TotalRevenue > 1000000 THEN 'High'
        WHEN TotalRevenue > 500000 THEN 'Medium'
        ELSE 'Low'
    END AS PerformanceTier,
    CAST(TransactionCount * 100.0 / NULLIF(SUM(TransactionCount) OVER(), 0) AS DECIMAL(5,2)) AS MarketSharePct
FROM BrandMetrics;
GO

-- ======================================
-- 9. GRANT PERMISSIONS
-- ======================================
GRANT SELECT ON dbo.Brands TO [scout_api_user];
GRANT SELECT ON dbo.Products TO [scout_api_user];
GRANT SELECT ON dbo.Categories TO [scout_api_user];
GRANT SELECT ON dbo.v_BrandPerformance TO [scout_api_user];
GO

PRINT 'TBWA\SMP FMCG brands seeded successfully!';
PRINT 'Brands added: Del Monte Philippines, Oishi, Alaska, Peerless Products';
PRINT 'Total products added: 27 SKUs across 5 categories';
GO