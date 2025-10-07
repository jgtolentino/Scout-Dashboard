-- =====================================================
-- Sprint 11: Substitution Tracking and Aggregated Views
-- File: 03_sprint11_substitution_tracking_views.sql
-- Purpose: Add substitution patterns and create performance views
-- =====================================================

USE [scout_analytics];
GO

-- =====================================================
-- Step 1: Extend TransactionItems for Substitution Tracking
-- =====================================================

PRINT 'Adding substitution tracking fields to TransactionItems...';

ALTER TABLE dbo.TransactionItems
ADD 
    IsSubstitution BIT NOT NULL CONSTRAINT DF_TI_IsSubstitution DEFAULT(0),
    SubstitutedProductID INT NULL,
    SuggestionAccepted BIT NULL,
    IsStoreOwnerSuggested BIT NOT NULL CONSTRAINT DF_TI_IsStoreOwnerSuggested DEFAULT(0);
GO

-- Add foreign key for substituted product
ALTER TABLE dbo.TransactionItems
ADD CONSTRAINT FK_TransactionItems_SubstitutedProduct
FOREIGN KEY (SubstitutedProductID) REFERENCES dbo.Products(ProductID);
GO

-- =====================================================
-- Step 2: Extend RequestMethods for Request Grouping
-- =====================================================

PRINT 'Adding request grouping to RequestMethods...';

ALTER TABLE dbo.RequestMethods
ADD RequestGroup VARCHAR(20) NULL;
GO

-- Populate request groups based on existing data
UPDATE dbo.RequestMethods
SET RequestGroup = CASE 
    WHEN MethodName LIKE '%brand%' OR MethodName LIKE '%specific%' THEN 'Branded'
    WHEN MethodName LIKE '%point%' OR MethodName LIKE '%gesture%' THEN 'Unbranded'
    WHEN MethodName LIKE '%unclear%' OR MethodName LIKE '%mumble%' THEN 'Unsure'
    ELSE 'Unbranded'
END;
GO

-- =====================================================
-- Step 3: Create Materialized Views for Performance
-- =====================================================

PRINT 'Creating SKU frequency materialized view...';

-- Create table for SKU frequency (materialized view pattern)
CREATE TABLE dbo.v_SkuFrequency (
    ProductID INT NOT NULL,
    ProductName NVARCHAR(255),
    BrandName NVARCHAR(100),
    Category NVARCHAR(100),
    TotalQuantitySold INT,
    TotalTransactions INT,
    AvgQuantityPerTransaction DECIMAL(10,2),
    TotalRevenue DECIMAL(12,2),
    LastUpdated DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT PK_SkuFrequency PRIMARY KEY (ProductID)
);
GO

-- Create index for performance
CREATE NONCLUSTERED INDEX IX_SkuFrequency_TotalQuantity
ON dbo.v_SkuFrequency (TotalQuantitySold DESC)
INCLUDE (ProductName, BrandName, Category, TotalRevenue);
GO

-- =====================================================
-- Step 4: Create Substitution Analysis View
-- =====================================================

PRINT 'Creating substitution analysis view...';

CREATE OR ALTER VIEW v_SubstitutionAnalysis AS
SELECT 
    original_p.ProductID as OriginalProductID,
    original_p.ProductName as OriginalProductName,
    original_b.BrandName as OriginalBrandName,
    original_p.Category as OriginalCategory,
    
    substitute_p.ProductID as SubstituteProductID,
    substitute_p.ProductName as SubstituteProductName,
    substitute_b.BrandName as SubstituteBrandName,
    substitute_p.Category as SubstituteCategory,
    
    COUNT(*) as SubstitutionCount,
    AVG(ti.UnitPrice) as AvgSubstitutePrice,
    SUM(ti.Quantity * ti.UnitPrice) as TotalSubstitutionRevenue,
    
    -- Calculate substitution patterns
    CASE 
        WHEN original_b.BrandName = substitute_b.BrandName THEN 'Same Brand'
        WHEN original_p.Category = substitute_p.Category THEN 'Same Category'
        ELSE 'Cross Category'
    END as SubstitutionType
    
FROM dbo.TransactionItems ti
INNER JOIN dbo.Products original_p ON ti.SubstitutedProductID = original_p.ProductID
INNER JOIN dbo.Products substitute_p ON ti.ProductID = substitute_p.ProductID
LEFT JOIN dbo.Brands original_b ON original_p.BrandID = original_b.BrandID
LEFT JOIN dbo.Brands substitute_b ON substitute_p.BrandID = substitute_b.BrandID
WHERE ti.IsSubstitution = 1
GROUP BY 
    original_p.ProductID, original_p.ProductName, original_b.BrandName, original_p.Category,
    substitute_p.ProductID, substitute_p.ProductName, substitute_b.BrandName, substitute_p.Category,
    original_b.BrandName, substitute_b.BrandName, original_p.Category, substitute_p.Category;
GO

-- =====================================================
-- Step 5: Create Request Method Analysis View
-- =====================================================

PRINT 'Creating request method analysis view...';

CREATE OR ALTER VIEW v_RequestMethodAnalysis AS
SELECT 
    rm.RequestGroup,
    rm.MethodName,
    COUNT(ti.TransactionItemID) as RequestCount,
    COUNT(CASE WHEN ti.SuggestionAccepted = 1 THEN 1 END) as AcceptedSuggestions,
    COUNT(CASE WHEN ti.IsStoreOwnerSuggested = 1 THEN 1 END) as StoreOwnerSuggestions,
    COUNT(CASE WHEN ti.IsSubstitution = 1 THEN 1 END) as SubstitutionCount,
    
    -- Calculate acceptance rates
    CASE 
        WHEN COUNT(CASE WHEN ti.IsStoreOwnerSuggested = 1 THEN 1 END) > 0 
        THEN CAST(COUNT(CASE WHEN ti.SuggestionAccepted = 1 THEN 1 END) as FLOAT) / 
             COUNT(CASE WHEN ti.IsStoreOwnerSuggested = 1 THEN 1 END) * 100
        ELSE 0 
    END as SuggestionAcceptanceRate,
    
    AVG(ti.UnitPrice) as AvgUnitPrice,
    SUM(ti.Quantity * ti.UnitPrice) as TotalRevenue
    
FROM dbo.TransactionItems ti
INNER JOIN dbo.RequestMethods rm ON ti.RequestMethod = rm.MethodID
GROUP BY rm.RequestGroup, rm.MethodName;
GO

-- =====================================================
-- Step 6: Create Basket Analysis View
-- =====================================================

PRINT 'Creating basket analysis view...';

CREATE OR ALTER VIEW v_BasketAnalysis AS
SELECT 
    si.InteractionID,
    si.TransactionDate,
    si.StoreID,
    si.CustomerID,
    si.TransactionAmount,
    si.DurationSec,
    
    COUNT(ti.ProductID) as BasketSize,
    COUNT(DISTINCT p.Category) as UniqueCategories,
    COUNT(DISTINCT b.BrandName) as UniqueBrands,
    COUNT(CASE WHEN ti.IsSubstitution = 1 THEN 1 END) as SubstitutionItems,
    COUNT(CASE WHEN ti.IsStoreOwnerSuggested = 1 THEN 1 END) as SuggestedItems,
    COUNT(CASE WHEN ti.SuggestionAccepted = 1 THEN 1 END) as AcceptedSuggestions,
    
    -- Basket characteristics
    CASE 
        WHEN COUNT(ti.ProductID) = 1 THEN 'Single Item'
        WHEN COUNT(ti.ProductID) = 2 THEN 'Two Items'
        WHEN COUNT(ti.ProductID) BETWEEN 3 AND 5 THEN 'Small Basket (3-5)'
        WHEN COUNT(ti.ProductID) BETWEEN 6 AND 10 THEN 'Medium Basket (6-10)'
        ELSE 'Large Basket (10+)'
    END as BasketSizeCategory,
    
    -- Calculate diversity metrics
    CASE 
        WHEN COUNT(DISTINCT b.BrandName) = 1 THEN 'Single Brand'
        WHEN COUNT(DISTINCT b.BrandName) <= 3 THEN 'Low Diversity'
        ELSE 'High Diversity'
    END as BrandDiversity
    
FROM dbo.SalesInteractions si
LEFT JOIN dbo.TransactionItems ti ON si.InteractionID = ti.InteractionID
LEFT JOIN dbo.Products p ON ti.ProductID = p.ProductID
LEFT JOIN dbo.Brands b ON p.BrandID = b.BrandID
GROUP BY 
    si.InteractionID, si.TransactionDate, si.StoreID, si.CustomerID,
    si.TransactionAmount, si.DurationSec;
GO

-- =====================================================
-- Step 7: Create ETL Procedure to Refresh SKU Frequency
-- =====================================================

PRINT 'Creating SKU frequency refresh procedure...';

CREATE OR ALTER PROCEDURE sp_RefreshSkuFrequency
AS
BEGIN
    SET NOCOUNT ON;
    
    TRUNCATE TABLE dbo.v_SkuFrequency;
    
    INSERT INTO dbo.v_SkuFrequency (
        ProductID, ProductName, BrandName, Category,
        TotalQuantitySold, TotalTransactions, AvgQuantityPerTransaction, TotalRevenue
    )
    SELECT 
        p.ProductID,
        p.ProductName,
        b.BrandName,
        p.Category,
        SUM(ti.Quantity) as TotalQuantitySold,
        COUNT(DISTINCT ti.InteractionID) as TotalTransactions,
        AVG(CAST(ti.Quantity as DECIMAL(10,2))) as AvgQuantityPerTransaction,
        SUM(ti.Quantity * ti.UnitPrice) as TotalRevenue
    FROM dbo.Products p
    LEFT JOIN dbo.Brands b ON p.BrandID = b.BrandID
    LEFT JOIN dbo.TransactionItems ti ON p.ProductID = ti.ProductID
    GROUP BY p.ProductID, p.ProductName, b.BrandName, p.Category
    HAVING SUM(ti.Quantity) > 0;
    
    PRINT 'SKU frequency data refreshed successfully.';
END;
GO

-- =====================================================
-- Step 8: Create Geographic Dimension Table
-- =====================================================

PRINT 'Creating geographic dimension table...';

CREATE TABLE dbo.GeoDimension (
    GeoID INT IDENTITY(1,1) PRIMARY KEY,
    StoreID INT NOT NULL,
    Barangay NVARCHAR(100),
    Municipality NVARCHAR(100),
    Province NVARCHAR(100),
    Region NVARCHAR(100),
    Latitude DECIMAL(10,8),
    Longitude DECIMAL(11,8),
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_GeoDimension_Store FOREIGN KEY (StoreID) REFERENCES dbo.Stores(StoreID)
);
GO

CREATE UNIQUE INDEX IX_GeoDimension_StoreID ON dbo.GeoDimension (StoreID);
GO

-- =====================================================
-- Step 9: Initialize SKU Frequency Data
-- =====================================================

PRINT 'Initializing SKU frequency data...';

EXEC sp_RefreshSkuFrequency;
GO

-- =====================================================
-- Step 10: Create Age Bracket Computed Column
-- =====================================================

PRINT 'Adding age bracket support...';

ALTER TABLE dbo.Customers
ADD AgeBracket AS 
    CASE 
        WHEN Age < 18 THEN 'Under 18'
        WHEN Age BETWEEN 18 AND 25 THEN '18-25'
        WHEN Age BETWEEN 26 AND 35 THEN '26-35'
        WHEN Age BETWEEN 36 AND 45 THEN '36-45'
        WHEN Age BETWEEN 46 AND 55 THEN '46-55'
        WHEN Age BETWEEN 56 AND 65 THEN '56-65'
        WHEN Age > 65 THEN 'Over 65'
        ELSE 'Unknown'
    END PERSISTED;
GO

-- =====================================================
-- Verification Queries
-- =====================================================

PRINT 'Running verification queries...';

SELECT 'Substitution Data' as CheckType, COUNT(*) as Count
FROM dbo.TransactionItems WHERE IsSubstitution = 1;

SELECT 'Request Groups' as CheckType, RequestGroup, COUNT(*) as Count
FROM dbo.RequestMethods GROUP BY RequestGroup;

SELECT 'SKU Frequency Records' as CheckType, COUNT(*) as Count
FROM dbo.v_SkuFrequency;

PRINT 'Sprint 11 migration completed successfully!';
GO