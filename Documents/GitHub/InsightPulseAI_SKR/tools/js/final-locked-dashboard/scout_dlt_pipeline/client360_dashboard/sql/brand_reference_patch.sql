-- ============================================================================
-- Client Brands Reference Table Update for Sari-Sari Products
-- Client360 Dashboard - May 21, 2025
-- ============================================================================
-- This script safely adds and updates FMCG products in the reference table
-- Specifically enriching attributes for sari-sari store analysis
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- SECTION 1: Ensure table exists (create if not)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ClientBrandsReference]') AND type in (N'U'))
BEGIN
    PRINT 'Creating ClientBrandsReference table...';
    
    CREATE TABLE [dbo].[ClientBrandsReference] (
        [BrandReferenceID] INT IDENTITY(1,1) PRIMARY KEY,
        [BrandName] NVARCHAR(200) NOT NULL,
        [ProductType] NVARCHAR(100) NULL,
        [ClientName] NVARCHAR(200) NOT NULL,
        [Category] NVARCHAR(100) NULL,
        [Subcategory] NVARCHAR(100) NULL,
        [IsSariSariFriendly] BIT NOT NULL DEFAULT(0),
        [IsActive] BIT NOT NULL DEFAULT(1),
        [ShelfLife] INT NULL, -- in days 
        [MinimumOrderQty] INT NULL,
        [TypicalPrice] DECIMAL(10,2) NULL,
        [SizeUnit] NVARCHAR(50) NULL,
        [RefreshRate] FLOAT NULL, -- items per day (consumption rate)
        [CreatedDate] DATETIME NOT NULL DEFAULT(GETDATE()),
        [ModifiedDate] DATETIME NOT NULL DEFAULT(GETDATE())
    );
    
    -- Create index on key lookup columns
    CREATE UNIQUE INDEX IX_ClientBrandsReference_BrandClient 
    ON [dbo].[ClientBrandsReference] (BrandName, ClientName);
    
    CREATE INDEX IX_ClientBrandsReference_SariSari 
    ON [dbo].[ClientBrandsReference] (IsSariSariFriendly, Category);
    
    PRINT 'ClientBrandsReference table created successfully.';
END
ELSE
BEGIN
    PRINT 'ClientBrandsReference table already exists.';
    
    -- Ensure IsSariSariFriendly column exists (add if missing)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ClientBrandsReference]') AND name = 'IsSariSariFriendly')
    BEGIN
        PRINT 'Adding IsSariSariFriendly column...';
        ALTER TABLE [dbo].[ClientBrandsReference] ADD [IsSariSariFriendly] BIT NOT NULL DEFAULT(0);
        
        -- Create index for the new column if it doesn't exist
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ClientBrandsReference_SariSari' AND object_id = OBJECT_ID('dbo.ClientBrandsReference'))
        BEGIN
            CREATE INDEX IX_ClientBrandsReference_SariSari 
            ON [dbo].[ClientBrandsReference] (IsSariSariFriendly, Category);
        END
    END
    
    -- Ensure ModifiedDate column exists (add if missing)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ClientBrandsReference]') AND name = 'ModifiedDate')
    BEGIN
        PRINT 'Adding ModifiedDate column...';
        ALTER TABLE [dbo].[ClientBrandsReference] ADD [ModifiedDate] DATETIME NOT NULL DEFAULT(GETDATE());
    END
END
GO

-- ============================================================================
-- SECTION 2: Create or update trigger for ModifiedDate
-- ============================================================================
IF OBJECT_ID('dbo.TR_ClientBrandsReference_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_ClientBrandsReference_Update;
GO

CREATE TRIGGER dbo.TR_ClientBrandsReference_Update
ON dbo.ClientBrandsReference
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE cbr
    SET ModifiedDate = GETDATE()
    FROM dbo.ClientBrandsReference cbr
    INNER JOIN inserted i ON cbr.BrandReferenceID = i.BrandReferenceID;
END
GO

-- ============================================================================
-- SECTION 3: Safe MERGE operation to update existing and add new records
-- ============================================================================
PRINT 'Updating brand reference table with sari-sari product data...';

-- Create temporary table for our reference data
CREATE TABLE #SariSariBrands (
    BrandName NVARCHAR(200) NOT NULL,
    ProductType NVARCHAR(100) NOT NULL,
    ClientName NVARCHAR(200) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Subcategory NVARCHAR(100) NULL,
    IsSariSariFriendly BIT NOT NULL,
    TypicalPrice DECIMAL(10,2) NULL,
    SizeUnit NVARCHAR(50) NULL,
    RefreshRate FLOAT NULL
);

-- Insert FMCG brands typically found in sari-sari stores
-- This dataset focuses on Philippines market-specific brands
INSERT INTO #SariSariBrands
(BrandName, ProductType, ClientName, Category, Subcategory, IsSariSariFriendly, TypicalPrice, SizeUnit, RefreshRate)
VALUES
-- Food Products
('Lucky Me!', 'Instant Noodles', 'Monde Nissin', 'Food', 'Instant Noodles', 1, 15.00, '55g', 4.2),
('Payless', 'Instant Noodles', 'Monde Nissin', 'Food', 'Instant Noodles', 1, 12.00, '55g', 3.7),
('Nestle Milo', 'Chocolate Drink', 'Nestle', 'Beverage', 'Powdered Drink', 1, 10.00, '22g', 3.5),
('Bear Brand', 'Powdered Milk', 'Nestle', 'Dairy', 'Milk', 1, 12.00, '33g', 2.8),
('Alaska', 'Evaporated Milk', 'Alaska Milk Corporation', 'Dairy', 'Milk', 1, 25.00, '140g', 2.0),
('Nescafe 3-in-1', 'Coffee', 'Nestle', 'Beverage', 'Coffee', 1, 8.00, '20g', 5.1),
('Great Taste', 'Coffee', 'Universal Robina Corporation', 'Beverage', 'Coffee', 1, 7.00, '20g', 4.8),
('Argentina Corned Beef', 'Canned Meat', 'Century Pacific Food', 'Food', 'Canned Goods', 1, 35.00, '150g', 1.2),
('Century Tuna', 'Canned Fish', 'Century Pacific Food', 'Food', 'Canned Goods', 1, 30.00, '155g', 1.0),
('Del Monte Ketchup', 'Tomato Sauce', 'Del Monte Philippines', 'Food', 'Condiments', 1, 18.00, '100g', 1.5),
('UFC Banana Ketchup', 'Banana Sauce', 'Nutri-Asia', 'Food', 'Condiments', 1, 15.00, '100g', 1.8),
('Silver Swan Soy Sauce', 'Soy Sauce', 'Nutri-Asia', 'Food', 'Condiments', 1, 20.00, '200ml', 1.7),
('Datu Puti Vinegar', 'Vinegar', 'Nutri-Asia', 'Food', 'Condiments', 1, 18.00, '200ml', 1.5),
('Magic Sarap', 'Seasoning', 'Nestle', 'Food', 'Condiments', 1, 6.00, '8g', 2.2),
('Knorr Cube', 'Bouillon Cube', 'Unilever', 'Food', 'Condiments', 1, 5.00, '10g', 2.4),
('Ajinomoto', 'MSG', 'Ajinomoto', 'Food', 'Condiments', 1, 5.00, '7g', 2.0),
('Eden Cheese', 'Cheese', 'Mondelez', 'Dairy', 'Cheese', 1, 28.00, '33g', 2.0),
('Cheez Whiz', 'Cheese Spread', 'Mondelez', 'Dairy', 'Cheese', 1, 27.00, '35g', 1.8),
('Star Margarine', 'Margarine', 'Unilever', 'Dairy', 'Spreads', 1, 12.00, '25g', 2.2),
('Ligo Sardines', 'Canned Fish', 'Ligo', 'Food', 'Canned Goods', 1, 24.00, '155g', 1.2),
('Oishi Prawn Crackers', 'Snack', 'Oishi', 'Food', 'Snacks', 1, 12.00, '45g', 3.8),
('Nova', 'Chips', 'Jack n Jill', 'Food', 'Snacks', 1, 10.00, '22g', 4.2),
('Piattos', 'Chips', 'Jack n Jill', 'Food', 'Snacks', 1, 15.00, '40g', 3.5),
('Clover Chips', 'Chips', 'Jack n Jill', 'Food', 'Snacks', 1, 8.00, '23g', 4.7),
('Boy Bawang', 'Corn Snack', 'KSK Food Products', 'Food', 'Snacks', 1, 12.00, '40g', 3.0),
('Cloud 9', 'Chocolate', 'Jack n Jill', 'Food', 'Chocolate', 1, 10.00, '30g', 3.1),
('Choc Nut', 'Peanut Chocolate', 'Hany/Unisman', 'Food', 'Chocolate', 1, 2.00, '10g', 5.5),
('Maxx Candy', 'Hard Candy', 'Colombia', 'Food', 'Candy', 1, 1.00, '5g', 6.0),
('White Rabbit', 'Milk Candy', 'Misc', 'Food', 'Candy', 1, 1.00, '5g', 5.8),

-- Personal Care
('Safeguard', 'Soap', 'Procter & Gamble', 'Personal Care', 'Soap', 1, 18.00, '55g', 1.5),
('Palmolive', 'Shampoo', 'Colgate-Palmolive', 'Personal Care', 'Hair Care', 1, 6.00, '12ml', 2.7),
('Head & Shoulders', 'Shampoo', 'Procter & Gamble', 'Personal Care', 'Hair Care', 1, 7.00, '12ml', 2.5),
('Sunsilk', 'Shampoo', 'Unilever', 'Personal Care', 'Hair Care', 1, 6.00, '12ml', 2.8),
('Creamsilk', 'Conditioner', 'Unilever', 'Personal Care', 'Hair Care', 1, 7.00, '12ml', 2.3),
('Colgate', 'Toothpaste', 'Colgate-Palmolive', 'Personal Care', 'Oral Care', 1, 15.00, '35g', 1.0),
('Closeup', 'Toothpaste', 'Unilever', 'Personal Care', 'Oral Care', 1, 15.00, '35g', 1.0),
('Hapee', 'Toothpaste', 'Lamoiyan', 'Personal Care', 'Oral Care', 1, 12.00, '35g', 1.0),
('Rexona', 'Deodorant', 'Unilever', 'Personal Care', 'Deodorant', 1, 10.00, '8g', 1.5),

-- Household Products
('Tide', 'Detergent', 'Procter & Gamble', 'Household', 'Laundry', 1, 10.00, '43g', 3.0),
('Ariel', 'Detergent', 'Procter & Gamble', 'Household', 'Laundry', 1, 12.00, '45g', 2.8),
('Surf', 'Detergent', 'Unilever', 'Household', 'Laundry', 1, 9.00, '42g', 3.2),
('Breeze', 'Detergent', 'Unilever', 'Household', 'Laundry', 1, 8.00, '40g', 3.4),
('Champion', 'Detergent', 'Peerless Products', 'Household', 'Laundry', 1, 7.00, '40g', 3.5),
('Wings', 'Detergent', 'Wings Food', 'Household', 'Laundry', 1, 7.00, '35g', 3.7),
('Pride', 'Detergent', 'Peerless Products', 'Household', 'Laundry', 1, 6.50, '33g', 3.8),
('Mr. Clean', 'All-purpose Cleaner', 'Procter & Gamble', 'Household', 'Cleaning', 1, 20.00, '100ml', 1.2),
('Domex', 'Bleach', 'Unilever', 'Household', 'Cleaning', 1, 18.00, '100ml', 1.3),
('Zonrox', 'Bleach', 'Splash Corporation', 'Household', 'Cleaning', 1, 15.00, '100ml', 1.5),
('Joy', 'Dishwashing Liquid', 'Procter & Gamble', 'Household', 'Cleaning', 1, 8.00, '20ml', 2.2),

-- Beverages
('Coke', 'Soda', 'Coca-Cola', 'Beverage', 'Carbonated Drink', 1, 15.00, '237ml', 5.0),
('Pepsi', 'Soda', 'PepsiCo', 'Beverage', 'Carbonated Drink', 1, 14.00, '237ml', 4.8),
('Royal', 'Soda', 'Coca-Cola', 'Beverage', 'Carbonated Drink', 1, 15.00, '237ml', 4.7),
('Sprite', 'Soda', 'Coca-Cola', 'Beverage', 'Carbonated Drink', 1, 15.00, '237ml', 4.9),
('C2', 'Tea Drink', 'Universal Robina Corporation', 'Beverage', 'Ready to Drink', 1, 20.00, '230ml', 3.5),
('Nature''s Spring', 'Water', 'Splash Corporation', 'Beverage', 'Water', 1, 10.00, '350ml', 4.0),
('Summit', 'Water', 'Asia Brewery', 'Beverage', 'Water', 1, 10.00, '350ml', 4.0),
('Absolute', 'Water', 'Coca-Cola', 'Beverage', 'Water', 1, 11.00, '350ml', 3.9),
('Cobra', 'Energy Drink', 'Asia Brewery', 'Beverage', 'Energy Drink', 1, 28.00, '240ml', 2.1),
('Sting', 'Energy Drink', 'PepsiCo', 'Beverage', 'Energy Drink', 1, 25.00, '240ml', 2.0),
('Gatorade', 'Sports Drink', 'PepsiCo', 'Beverage', 'Sports Drink', 1, 30.00, '350ml', 1.8),
('Vitamilk', 'Soy Milk', 'Green Spot', 'Beverage', 'Milk', 1, 25.00, '250ml', 2.2),
('Zest-O', 'Juice Drink', 'Zest-O Corporation', 'Beverage', 'Juice', 1, 15.00, '250ml', 3.2),
('Tang', 'Powdered Juice', 'Mondelez', 'Beverage', 'Powdered Drink', 1, 8.00, '25g', 3.0),
('Eight O''Clock', 'Powdered Juice', 'Glaxo/Universal Robina', 'Beverage', 'Powdered Drink', 1, 6.00, '25g', 3.2),

-- Tobacco and Alcohol
('Marlboro', 'Cigarette', 'Philip Morris', 'Tobacco', 'Cigarette', 1, 10.00, '1 stick', 7.5),
('Winston', 'Cigarette', 'JTI', 'Tobacco', 'Cigarette', 1, 7.00, '1 stick', 7.2),
('Mighty', 'Cigarette', 'Mighty Corporation', 'Tobacco', 'Cigarette', 1, 5.00, '1 stick', 7.0),
('Fortune', 'Cigarette', 'PMFTC', 'Tobacco', 'Cigarette', 1, 4.00, '1 stick', 6.8),
('Red Horse', 'Beer', 'San Miguel', 'Alcohol', 'Beer', 1, 40.00, '330ml', 2.5),
('San Miguel', 'Beer', 'San Miguel', 'Alcohol', 'Beer', 1, 35.00, '330ml', 2.2),
('Ginebra', 'Gin', 'Ginebra San Miguel', 'Alcohol', 'Spirits', 1, 90.00, '350ml', 1.0),
('Emperador', 'Brandy', 'Alliance Global', 'Alcohol', 'Spirits', 1, 145.00, '350ml', 0.8);

-- Perform MERGE operation to update existing records and insert new ones
MERGE dbo.ClientBrandsReference AS target
USING #SariSariBrands AS source
ON (target.BrandName = source.BrandName AND target.ClientName = source.ClientName)
WHEN MATCHED THEN
    UPDATE SET 
        target.ProductType = source.ProductType,
        target.Category = source.Category,
        target.Subcategory = source.Subcategory,
        target.IsSariSariFriendly = 1,
        target.TypicalPrice = COALESCE(source.TypicalPrice, target.TypicalPrice),
        target.SizeUnit = COALESCE(source.SizeUnit, target.SizeUnit),
        target.RefreshRate = COALESCE(source.RefreshRate, target.RefreshRate),
        target.ModifiedDate = GETDATE()
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        BrandName, 
        ProductType, 
        ClientName, 
        Category, 
        Subcategory, 
        IsSariSariFriendly, 
        TypicalPrice, 
        SizeUnit, 
        RefreshRate,
        IsActive,
        CreatedDate,
        ModifiedDate
    )
    VALUES (
        source.BrandName, 
        source.ProductType, 
        source.ClientName, 
        source.Category, 
        source.Subcategory, 
        source.IsSariSariFriendly, 
        source.TypicalPrice, 
        source.SizeUnit, 
        source.RefreshRate,
        1,
        GETDATE(),
        GETDATE()
    );

-- Output the results and cleanup
DROP TABLE #SariSariBrands;

PRINT 'Brand reference update complete. FMCG products for sari-sari stores have been updated.';
GO

-- ============================================================================
-- SECTION 4: Create stored procedure for brand reference filtering
-- ============================================================================
IF OBJECT_ID('dbo.sp_GetSariSariBrands', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetSariSariBrands;
GO

CREATE PROCEDURE dbo.sp_GetSariSariBrands
    @Category NVARCHAR(100) = NULL,
    @Subcategory NVARCHAR(100) = NULL,
    @PriceRange NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @MinPrice DECIMAL(10,2) = 0.00;
    DECLARE @MaxPrice DECIMAL(10,2) = 1000.00;
    
    -- Parse price range if provided
    IF @PriceRange IS NOT NULL
    BEGIN
        IF @PriceRange = 'low' -- Under 10 pesos
        BEGIN
            SET @MinPrice = 0.00;
            SET @MaxPrice = 10.00;
        END
        ELSE IF @PriceRange = 'medium' -- 10-25 pesos
        BEGIN
            SET @MinPrice = 10.00;
            SET @MaxPrice = 25.00;
        END
        ELSE IF @PriceRange = 'high' -- Over 25 pesos
        BEGIN
            SET @MinPrice = 25.00;
            SET @MaxPrice = 1000.00;
        END
    END
    
    -- Select brands based on filters
    SELECT 
        BrandName,
        ProductType,
        ClientName,
        Category,
        Subcategory,
        TypicalPrice,
        SizeUnit,
        RefreshRate
    FROM 
        dbo.ClientBrandsReference
    WHERE 
        IsSariSariFriendly = 1
        AND IsActive = 1
        AND (@Category IS NULL OR Category = @Category)
        AND (@Subcategory IS NULL OR Subcategory = @Subcategory)
        AND (TypicalPrice IS NULL OR (TypicalPrice >= @MinPrice AND TypicalPrice <= @MaxPrice))
    ORDER BY 
        Category, Subcategory, BrandName;
END
GO

-- ============================================================================
-- SECTION 5: Create view for dashboard consumption
-- ============================================================================
IF OBJECT_ID('dbo.vw_SariSariBrandInsights', 'V') IS NOT NULL
    DROP VIEW dbo.vw_SariSariBrandInsights;
GO

CREATE VIEW dbo.vw_SariSariBrandInsights AS
WITH BrandCategoryCounts AS (
    SELECT
        Category,
        COUNT(*) AS BrandCount,
        AVG(TypicalPrice) AS AvgPrice,
        MIN(TypicalPrice) AS MinPrice,
        MAX(TypicalPrice) AS MaxPrice,
        AVG(RefreshRate) AS AvgRefreshRate
    FROM
        dbo.ClientBrandsReference
    WHERE
        IsSariSariFriendly = 1
        AND IsActive = 1
    GROUP BY
        Category
)
SELECT
    Category,
    BrandCount,
    AvgPrice,
    MinPrice,
    MaxPrice,
    AvgRefreshRate,
    CASE
        WHEN AvgRefreshRate >= 5.0 THEN 'Very High'
        WHEN AvgRefreshRate >= 3.0 THEN 'High'
        WHEN AvgRefreshRate >= 2.0 THEN 'Medium'
        WHEN AvgRefreshRate >= 1.0 THEN 'Low'
        ELSE 'Very Low'
    END AS RefreshRateCategory,
    CASE
        WHEN AvgPrice <= 10.00 THEN 'Budget'
        WHEN AvgPrice <= 25.00 THEN 'Mid-range'
        ELSE 'Premium'
    END AS PriceCategory
FROM
    BrandCategoryCounts;
GO

-- ============================================================================
-- SECTION 6: Output summary and instructions
-- ============================================================================
PRINT '--------------------------------------------------------';
PRINT '   SARI-SARI BRAND REFERENCE TABLES UPDATE COMPLETE     ';
PRINT '--------------------------------------------------------';
PRINT '';
PRINT 'The following operations were performed:';
PRINT '1. ClientBrandsReference table verified/created';
PRINT '2. IsSariSariFriendly column added (if needed)';
PRINT '3. 70+ FMCG products common in sari-sari stores added';
PRINT '4. sp_GetSariSariBrands stored procedure created';
PRINT '5. vw_SariSariBrandInsights view created';
PRINT '';
PRINT 'To query sari-sari brands:';
PRINT 'EXEC sp_GetSariSariBrands;                              -- All brands';
PRINT 'EXEC sp_GetSariSariBrands @Category = ''Food'';           -- Food only';
PRINT 'EXEC sp_GetSariSariBrands @PriceRange = ''low'';          -- Under 10 pesos';
PRINT '';
PRINT 'For insights summary: SELECT * FROM vw_SariSariBrandInsights;';
PRINT '--------------------------------------------------------';