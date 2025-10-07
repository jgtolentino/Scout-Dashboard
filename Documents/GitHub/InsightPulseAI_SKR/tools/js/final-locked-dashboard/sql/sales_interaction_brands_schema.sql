/*
 * SalesInteractionBrands Schema and ETL for Scout Edge Choropleth Map
 * 
 * This script includes:
 * 1. DDL for SalesInteractionBrands table
 * 2. ETL to populate the table from transaction data
 * 3. View definitions for dashboard use
 * 4. Stored procedures for dashboard queries
 */

-- =======================================================================
-- SECTION 1: TABLE CREATION
-- =======================================================================

-- Create SalesInteractionBrands table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractionBrands]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SalesInteractionBrands] (
        [InteractionBrandID] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [TransactionID] BIGINT NOT NULL,
        [BrandID] INT NOT NULL,
        [MentionCount] INT NOT NULL DEFAULT(1),
        [StoreID] VARCHAR(50) NOT NULL,
        [RegionID] VARCHAR(50) NOT NULL,
        [Region] NVARCHAR(100) NOT NULL,
        [City] NVARCHAR(100) NOT NULL,
        [Barangay] NVARCHAR(100) NOT NULL,
        [TransactionDate] DATE NOT NULL,
        [CustomerID] VARCHAR(50) NULL,
        [TransactionAmount] DECIMAL(18,2) NOT NULL,
        [AttributedAmount] DECIMAL(18,2) NULL,
        [IsTopBrand] BIT NOT NULL DEFAULT(0),
        [MentionSource] VARCHAR(20) NOT NULL DEFAULT('product'), -- 'product', 'transcript', 'bundle'
        [CreatedAt] DATETIME NOT NULL DEFAULT(GETDATE()),
        [UpdatedAt] DATETIME NOT NULL DEFAULT(GETDATE())
    );

    -- Add indexes for performance
    CREATE NONCLUSTERED INDEX [IX_SalesInteractionBrands_TransactionID] 
        ON [dbo].[SalesInteractionBrands]([TransactionID]);
        
    CREATE NONCLUSTERED INDEX [IX_SalesInteractionBrands_BrandID] 
        ON [dbo].[SalesInteractionBrands]([BrandID]);
        
    CREATE NONCLUSTERED INDEX [IX_SalesInteractionBrands_Geo] 
        ON [dbo].[SalesInteractionBrands]([RegionID], [City], [Barangay]);
        
    CREATE NONCLUSTERED INDEX [IX_SalesInteractionBrands_Date] 
        ON [dbo].[SalesInteractionBrands]([TransactionDate]);
        
    PRINT 'SalesInteractionBrands table created successfully';
END
ELSE
BEGIN
    PRINT 'SalesInteractionBrands table already exists';
END

-- =======================================================================
-- SECTION 2: DATA POPULATION (ETL)
-- =======================================================================

-- Create procedure to populate SalesInteractionBrands from product transactions
CREATE OR ALTER PROCEDURE [dbo].[PopulateSalesInteractionBrands]
    @DaysToProcess INT = 30  -- Default to last 30 days
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATE = DATEADD(DAY, -@DaysToProcess, GETDATE());
    
    -- Begin transaction
    BEGIN TRANSACTION;
    
    -- Delete any existing records for the time period to avoid duplicates
    DELETE FROM [dbo].[SalesInteractionBrands]
    WHERE TransactionDate >= @StartDate;
    
    -- Temporary table to store transaction brand summary for quick access
    CREATE TABLE #TempTransactionBrands (
        TransactionID BIGINT,
        BrandID INT,
        MentionCount INT,
        ProductCount INT,
        TotalAmount DECIMAL(18,2),
        BrandRank INT
    );
    
    -- Insert brand data from product transactions
    INSERT INTO #TempTransactionBrands (TransactionID, BrandID, MentionCount, ProductCount, TotalAmount, BrandRank)
    SELECT 
        ti.TransactionID,
        p.BrandID,
        COUNT(*) AS MentionCount,
        SUM(ti.Quantity) AS ProductCount,
        SUM(ti.LineTotal) AS TotalAmount,
        ROW_NUMBER() OVER (PARTITION BY ti.TransactionID ORDER BY COUNT(*) DESC) AS BrandRank
    FROM 
        Sales.TransactionItems ti
    INNER JOIN 
        Inventory.Products p ON ti.ProductID = p.ProductID
    INNER JOIN 
        Sales.Transactions t ON ti.TransactionID = t.TransactionID
    WHERE 
        t.TransactionDate >= @StartDate
        AND t.Status = 'Completed'
        AND p.BrandID IS NOT NULL
    GROUP BY 
        ti.TransactionID, p.BrandID;
    
    -- Insert into SalesInteractionBrands from the temp table
    INSERT INTO [dbo].[SalesInteractionBrands] (
        TransactionID, BrandID, MentionCount, StoreID, RegionID, Region, City, Barangay,
        TransactionDate, CustomerID, TransactionAmount, AttributedAmount, IsTopBrand, MentionSource
    )
    SELECT 
        t.TransactionID,
        tb.BrandID,
        tb.MentionCount,
        t.StoreID,
        s.RegionID,
        s.Region,
        s.City,
        s.Barangay,
        t.TransactionDate,
        t.CustomerID,
        t.TotalAmount AS TransactionAmount,
        tb.TotalAmount AS AttributedAmount,
        CASE WHEN tb.BrandRank = 1 THEN 1 ELSE 0 END AS IsTopBrand,
        'product' AS MentionSource
    FROM 
        Sales.Transactions t
    INNER JOIN 
        #TempTransactionBrands tb ON t.TransactionID = tb.TransactionID
    INNER JOIN 
        Store.Locations s ON t.StoreID = s.StoreID
    WHERE 
        t.TransactionDate >= @StartDate
        AND t.Status = 'Completed';
    
    -- Drop the temp table
    DROP TABLE #TempTransactionBrands;
    
    -- Optional: Insert brand data from transcript analysis if available
    -- This would be implemented based on the actual transcript analysis data structure
    /*
    INSERT INTO [dbo].[SalesInteractionBrands] (
        TransactionID, BrandID, MentionCount, StoreID, RegionID, Region, City, Barangay,
        TransactionDate, CustomerID, TransactionAmount, AttributedAmount, IsTopBrand, MentionSource
    )
    SELECT 
        tr.TransactionID,
        bm.BrandID,
        bm.MentionCount,
        t.StoreID,
        s.RegionID,
        s.Region,
        s.City,
        s.Barangay,
        t.TransactionDate,
        t.CustomerID,
        t.TotalAmount AS TransactionAmount,
        NULL AS AttributedAmount, -- Can't attribute direct spend to transcript mentions
        0 AS IsTopBrand, -- Transcript mentions are not considered top brands
        'transcript' AS MentionSource
    FROM 
        Sales.Transactions t
    INNER JOIN 
        Analytics.TransactionTranscripts tr ON t.TransactionID = tr.TransactionID
    INNER JOIN 
        Analytics.BrandMentions bm ON tr.TranscriptID = bm.TranscriptID
    INNER JOIN 
        Store.Locations s ON t.StoreID = s.StoreID
    WHERE 
        t.TransactionDate >= @StartDate
        AND t.Status = 'Completed'
        -- Exclude brands already counted from products to avoid double counting
        AND NOT EXISTS (
            SELECT 1 FROM [dbo].[SalesInteractionBrands] 
            WHERE TransactionID = t.TransactionID AND BrandID = bm.BrandID
        );
    */
    
    -- Commit transaction
    COMMIT TRANSACTION;
    
    -- Return count of records inserted
    SELECT COUNT(*) AS RecordsInserted FROM [dbo].[SalesInteractionBrands] WHERE TransactionDate >= @StartDate;
END;
GO

-- =======================================================================
-- SECTION 3: VIEW DEFINITIONS FOR DASHBOARD
-- =======================================================================

-- View for brand mentions by geography for choropleth map
CREATE OR ALTER VIEW [dbo].[vw_BrandMentionsByGeo] AS
SELECT
    Region,
    City,
    Barangay,
    BrandID,
    b.BrandName,
    COUNT(DISTINCT TransactionID) AS TransactionCount,
    SUM(MentionCount) AS MentionCount,
    COUNT(DISTINCT CustomerID) AS UniqueCustomers,
    SUM(TransactionAmount) AS TotalSales,
    SUM(CASE WHEN IsTopBrand = 1 THEN 1 ELSE 0 END) AS TopBrandCount,
    CAST(SUM(CASE WHEN IsTopBrand = 1 THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(COUNT(DISTINCT TransactionID), 0) * 100 AS TopBrandPercentage
FROM
    [dbo].[SalesInteractionBrands] sib
JOIN
    dbo.Brands b ON sib.BrandID = b.BrandID
GROUP BY
    Region, City, Barangay, sib.BrandID, b.BrandName;
GO

-- View for top brands by region
CREATE OR ALTER VIEW [dbo].[vw_TopBrandsByRegion] AS
WITH RankedBrands AS (
    SELECT
        Region,
        BrandID,
        b.BrandName,
        COUNT(DISTINCT TransactionID) AS TransactionCount,
        SUM(MentionCount) AS MentionCount,
        ROW_NUMBER() OVER (PARTITION BY Region ORDER BY COUNT(DISTINCT TransactionID) DESC) AS BrandRank
    FROM
        [dbo].[SalesInteractionBrands] sib
    JOIN
        dbo.Brands b ON sib.BrandID = b.BrandID
    GROUP BY
        Region, sib.BrandID, b.BrandName
)
SELECT
    Region,
    BrandID,
    BrandName,
    TransactionCount,
    MentionCount,
    BrandRank
FROM
    RankedBrands
WHERE
    BrandRank <= 5; -- Top 5 brands per region
GO

-- View for store-level brand performance
CREATE OR ALTER VIEW [dbo].[vw_StoreBrandPerformance] AS
SELECT
    StoreID,
    s.StoreName,
    s.Region,
    s.City,
    s.Barangay,
    sib.BrandID,
    b.BrandName,
    COUNT(DISTINCT TransactionID) AS TransactionCount,
    COUNT(DISTINCT CustomerID) AS UniqueCustomers,
    SUM(TransactionAmount) AS TotalSales,
    SUM(CASE WHEN IsTopBrand = 1 THEN 1 ELSE 0 END) AS TopBrandTransactions,
    CAST(SUM(CASE WHEN IsTopBrand = 1 THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(COUNT(DISTINCT TransactionID), 0) * 100 AS TopBrandPercentage
FROM
    [dbo].[SalesInteractionBrands] sib
JOIN
    dbo.Brands b ON sib.BrandID = b.BrandID
JOIN
    Store.Locations s ON sib.StoreID = s.StoreID
GROUP BY
    sib.StoreID, s.StoreName, s.Region, s.City, s.Barangay, sib.BrandID, b.BrandName;
GO

-- View for brand mentions over time
CREATE OR ALTER VIEW [dbo].[vw_BrandMentionsOverTime] AS
SELECT
    CAST(TransactionDate AS DATE) AS Date,
    BrandID,
    b.BrandName,
    COUNT(DISTINCT TransactionID) AS TransactionCount,
    SUM(MentionCount) AS MentionCount,
    COUNT(DISTINCT CustomerID) AS UniqueCustomers,
    SUM(TransactionAmount) AS TotalSales
FROM
    [dbo].[SalesInteractionBrands] sib
JOIN
    dbo.Brands b ON sib.BrandID = b.BrandID
GROUP BY
    CAST(TransactionDate AS DATE), sib.BrandID, b.BrandName;
GO

-- =======================================================================
-- SECTION 4: STORED PROCEDURES FOR CHOROPLETH MAP QUERIES
-- =======================================================================

-- Procedure to get geo data for choropleth map
CREATE OR ALTER PROCEDURE [dbo].[GetChoroplethData]
    @GeoLevel VARCHAR(20) = 'barangay', -- 'region', 'city', 'barangay'
    @BrandID INT = NULL,
    @Days INT = 30,
    @Mode VARCHAR(20) = 'brands' -- 'brands', 'stores', 'sales', 'combos'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATE = DATEADD(DAY, -@Days, GETDATE());
    
    -- For brands mode - show brand mentions
    IF @Mode = 'brands'
    BEGIN
        -- Prepare the GeoJSON structure
        SELECT 
            'FeatureCollection' AS [type],
            (
                SELECT 
                    GETDATE() AS generated,
                    'brand_mentions' AS [source],
                    'geo_brand_mentions' AS mode,
                    CONCAT('last_', @Days, '_days') AS timeRange
                FOR JSON PATH
            ) AS metadata,
            (
                SELECT
                    'Feature' AS [type],
                    (
                        -- Properties with brand and geographic data
                        SELECT
                            CASE 
                                WHEN @GeoLevel = 'region' THEN Region
                                WHEN @GeoLevel = 'city' THEN City
                                ELSE Barangay
                            END AS name,
                            Region AS region,
                            City AS city,
                            Barangay AS barangay,
                            -- Use mention count as the value for coloring
                            SUM(MentionCount) AS value,
                            DENSE_RANK() OVER (ORDER BY SUM(MentionCount) DESC) AS rank,
                            COUNT(DISTINCT StoreID) AS storeCount,
                            -- Get top brand for this geographic area
                            FIRST_VALUE(TopBrand) OVER (PARTITION BY Region, City, Barangay 
                                ORDER BY TopBrandCount DESC) AS topBrand,
                            -- Brand percentage calculated as ratio of top brand mentions to total mentions
                            CAST(MAX(TopBrandPercentage) AS INT) AS brandPercentage,
                            -- Get second top brand
                            FIRST_VALUE(SecondBrand) OVER (PARTITION BY Region, City, Barangay 
                                ORDER BY SecondBrandCount DESC) AS secondBrand,
                            CAST(MAX(SecondBrandPercentage) AS INT) AS secondPercentage,
                            SUM(TransactionCount) AS transactionCount
                        FROM (
                            -- Subquery to prepare brand data per geographic area
                            SELECT 
                                g.Region,
                                g.City,
                                g.Barangay,
                                g.BrandID,
                                g.BrandName,
                                -- Counts for calculating percentages
                                SUM(g.MentionCount) AS MentionCount,
                                COUNT(DISTINCT g.StoreID) AS StoreCount,
                                COUNT(DISTINCT g.TransactionID) AS TransactionCount,
                                -- Rank brands within each geographic area
                                ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) AS BrandRank,
                                -- Store top brand information
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) = 1 
                                    THEN g.BrandName ELSE NULL END AS TopBrand,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) = 1 
                                    THEN SUM(g.MentionCount) ELSE 0 END AS TopBrandCount,
                                -- Store second brand information
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) = 2
                                    THEN g.BrandName ELSE NULL END AS SecondBrand,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) = 2
                                    THEN SUM(g.MentionCount) ELSE 0 END AS SecondBrandCount,
                                -- Calculate percentages
                                CAST(100.0 * SUM(g.MentionCount) / 
                                    NULLIF(SUM(SUM(g.MentionCount)) OVER (PARTITION BY g.Region, g.City, g.Barangay), 0) AS FLOAT) AS BrandPercentage,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) = 1 
                                    THEN CAST(100.0 * SUM(g.MentionCount) / 
                                        NULLIF(SUM(SUM(g.MentionCount)) OVER (PARTITION BY g.Region, g.City, g.Barangay), 0) AS FLOAT)
                                    ELSE 0 END AS TopBrandPercentage,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY g.Region, g.City, g.Barangay 
                                    ORDER BY SUM(g.MentionCount) DESC) = 2
                                    THEN CAST(100.0 * SUM(g.MentionCount) / 
                                        NULLIF(SUM(SUM(g.MentionCount)) OVER (PARTITION BY g.Region, g.City, g.Barangay), 0) AS FLOAT)
                                    ELSE 0 END AS SecondBrandPercentage
                            FROM (
                                -- Base query to get brand mentions from transactions
                                SELECT 
                                    sib.Region,
                                    sib.City,
                                    sib.Barangay,
                                    sib.StoreID,
                                    sib.TransactionID,
                                    sib.BrandID,
                                    b.BrandName,
                                    sib.MentionCount
                                FROM 
                                    [dbo].[SalesInteractionBrands] sib
                                JOIN 
                                    dbo.Brands b ON sib.BrandID = b.BrandID
                                WHERE 
                                    sib.TransactionDate >= @StartDate
                                    AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                            ) g
                            GROUP BY 
                                g.Region, g.City, g.Barangay, g.BrandID, g.BrandName
                        ) RankedBrands
                        -- Need only one row per geographic area for GeoJSON
                        WHERE BrandRank = 1 
                        GROUP BY 
                            Region, City, Barangay, TopBrand, SecondBrand
                        FOR JSON PATH
                    ) AS properties,
                    -- Join with the geometric data from GeoJSON file
                    -- This placeholder needs to be replaced with actual geometry data in application
                    (
                        SELECT 
                            'Polygon' AS [type],
                            '[ChoroplethMap will populate this with actual geometry]' AS coordinates
                        FOR JSON PATH
                    ) AS geometry
                FROM 
                    [dbo].[SalesInteractionBrands] sib
                WHERE 
                    sib.TransactionDate >= @StartDate
                    AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                -- Group at the appropriate geographic level
                GROUP BY 
                    CASE WHEN @GeoLevel = 'region' THEN Region
                         WHEN @GeoLevel = 'city' THEN CONCAT(Region, '_', City)
                         ELSE CONCAT(Region, '_', City, '_', Barangay)
                    END
                FOR JSON PATH
            ) AS features
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END
    -- For sales mode - show transaction amounts
    ELSE IF @Mode = 'sales'
    BEGIN
        -- Similar structure to brands mode but with sales data
        SELECT 
            'FeatureCollection' AS [type],
            (
                SELECT 
                    GETDATE() AS generated,
                    'sales_volume' AS [source],
                    'geo_sales_volume' AS mode,
                    CONCAT('last_', @Days, '_days') AS timeRange
                FOR JSON PATH
            ) AS metadata,
            (
                SELECT
                    'Feature' AS [type],
                    (
                        SELECT
                            CASE 
                                WHEN @GeoLevel = 'region' THEN Region
                                WHEN @GeoLevel = 'city' THEN City
                                ELSE Barangay
                            END AS name,
                            Region AS region,
                            City AS city,
                            Barangay AS barangay,
                            -- Use sales amount as the value for coloring
                            SUM(TransactionAmount) AS value,
                            DENSE_RANK() OVER (ORDER BY SUM(TransactionAmount) DESC) AS rank,
                            COUNT(DISTINCT StoreID) AS storeCount,
                            -- Get top brand for this geographic area
                            FIRST_VALUE(TopBrand) OVER (PARTITION BY Region, City, Barangay 
                                ORDER BY TopBrandSales DESC) AS topBrand,
                            COUNT(DISTINCT TransactionID) AS transactionCount
                        FROM (
                            SELECT 
                                Region,
                                City,
                                Barangay,
                                StoreID,
                                TransactionID,
                                TransactionAmount,
                                BrandID,
                                b.BrandName,
                                ROW_NUMBER() OVER (PARTITION BY Region, City, Barangay 
                                    ORDER BY SUM(TransactionAmount) DESC) AS BrandRank,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY Region, City, Barangay 
                                    ORDER BY SUM(TransactionAmount) DESC) = 1 
                                    THEN b.BrandName ELSE NULL END AS TopBrand,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY Region, City, Barangay 
                                    ORDER BY SUM(TransactionAmount) DESC) = 1 
                                    THEN SUM(TransactionAmount) ELSE 0 END AS TopBrandSales
                            FROM 
                                [dbo].[SalesInteractionBrands] sib
                            JOIN 
                                dbo.Brands b ON sib.BrandID = b.BrandID
                            WHERE 
                                sib.TransactionDate >= @StartDate
                                AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                            GROUP BY 
                                Region, City, Barangay, StoreID, TransactionID, 
                                TransactionAmount, sib.BrandID, b.BrandName
                        ) SalesData
                        GROUP BY 
                            Region, City, Barangay, TopBrand
                        FOR JSON PATH
                    ) AS properties,
                    (
                        SELECT 
                            'Polygon' AS [type],
                            '[ChoroplethMap will populate this with actual geometry]' AS coordinates
                        FOR JSON PATH
                    ) AS geometry
                FROM 
                    [dbo].[SalesInteractionBrands] sib
                WHERE 
                    sib.TransactionDate >= @StartDate
                    AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                GROUP BY 
                    CASE WHEN @GeoLevel = 'region' THEN Region
                         WHEN @GeoLevel = 'city' THEN CONCAT(Region, '_', City)
                         ELSE CONCAT(Region, '_', City, '_', Barangay)
                    END
                FOR JSON PATH
            ) AS features
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END
    -- For stores mode - show store distribution
    ELSE IF @Mode = 'stores'
    BEGIN
        SELECT 
            'FeatureCollection' AS [type],
            (
                SELECT 
                    GETDATE() AS generated,
                    'store_density' AS [source],
                    'geo_store_density' AS mode,
                    CONCAT('last_', @Days, '_days') AS timeRange
                FOR JSON PATH
            ) AS metadata,
            (
                SELECT
                    'Feature' AS [type],
                    (
                        SELECT
                            CASE 
                                WHEN @GeoLevel = 'region' THEN Region
                                WHEN @GeoLevel = 'city' THEN City
                                ELSE Barangay
                            END AS name,
                            Region AS region,
                            City AS city,
                            Barangay AS barangay,
                            -- Use store count as the value for coloring
                            COUNT(DISTINCT StoreID) AS value,
                            DENSE_RANK() OVER (ORDER BY COUNT(DISTINCT StoreID) DESC) AS rank,
                            -- Get top brand for this geographic area
                            FIRST_VALUE(TopBrand) OVER (PARTITION BY Region, City, Barangay 
                                ORDER BY TopBrandCount DESC) AS topBrand,
                            COUNT(DISTINCT TransactionID) AS transactionCount
                        FROM (
                            SELECT 
                                Region,
                                City,
                                Barangay,
                                StoreID,
                                TransactionID,
                                BrandID,
                                b.BrandName,
                                ROW_NUMBER() OVER (PARTITION BY Region, City, Barangay 
                                    ORDER BY COUNT(*) DESC) AS BrandRank,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY Region, City, Barangay 
                                    ORDER BY COUNT(*) DESC) = 1 
                                    THEN b.BrandName ELSE NULL END AS TopBrand,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY Region, City, Barangay 
                                    ORDER BY COUNT(*) DESC) = 1 
                                    THEN COUNT(*) ELSE 0 END AS TopBrandCount
                            FROM 
                                [dbo].[SalesInteractionBrands] sib
                            JOIN 
                                dbo.Brands b ON sib.BrandID = b.BrandID
                            WHERE 
                                sib.TransactionDate >= @StartDate
                                AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                            GROUP BY 
                                Region, City, Barangay, StoreID, TransactionID, 
                                sib.BrandID, b.BrandName
                        ) StoreData
                        GROUP BY 
                            Region, City, Barangay, TopBrand
                        FOR JSON PATH
                    ) AS properties,
                    (
                        SELECT 
                            'Polygon' AS [type],
                            '[ChoroplethMap will populate this with actual geometry]' AS coordinates
                        FOR JSON PATH
                    ) AS geometry
                FROM 
                    [dbo].[SalesInteractionBrands] sib
                WHERE 
                    sib.TransactionDate >= @StartDate
                    AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                GROUP BY 
                    CASE WHEN @GeoLevel = 'region' THEN Region
                         WHEN @GeoLevel = 'city' THEN CONCAT(Region, '_', City)
                         ELSE CONCAT(Region, '_', City, '_', Barangay)
                    END
                FOR JSON PATH
            ) AS features
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END
    -- For combos mode - show brand combinations
    ELSE IF @Mode = 'combos'
    BEGIN
        SELECT 
            'FeatureCollection' AS [type],
            (
                SELECT 
                    GETDATE() AS generated,
                    'combo_frequency' AS [source],
                    'geo_combo_frequency' AS mode,
                    CONCAT('last_', @Days, '_days') AS timeRange
                FOR JSON PATH
            ) AS metadata,
            (
                SELECT
                    'Feature' AS [type],
                    (
                        SELECT
                            CASE 
                                WHEN @GeoLevel = 'region' THEN Region
                                WHEN @GeoLevel = 'city' THEN City
                                ELSE Barangay
                            END AS name,
                            Region AS region,
                            City AS city,
                            Barangay AS barangay,
                            -- Use combo count as the value for coloring
                            COUNT(DISTINCT TransactionID) AS value,
                            DENSE_RANK() OVER (ORDER BY COUNT(DISTINCT TransactionID) DESC) AS rank,
                            -- Get top brand combination
                            FIRST_VALUE(TopCombo) OVER (PARTITION BY Region, City, Barangay 
                                ORDER BY TopComboCount DESC) AS topBrand,
                            SUM(TransactionCount) AS transactionCount
                        FROM (
                            SELECT 
                                c.Region,
                                c.City,
                                c.Barangay,
                                c.TransactionID,
                                STRING_AGG(b.BrandName, ' + ') WITHIN GROUP (ORDER BY b.BrandName) AS ComboName,
                                COUNT(*) AS BrandCount,
                                1 AS TransactionCount,
                                ROW_NUMBER() OVER (PARTITION BY c.Region, c.City, c.Barangay 
                                    ORDER BY COUNT(DISTINCT c.TransactionID) DESC) AS ComboRank,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY c.Region, c.City, c.Barangay 
                                    ORDER BY COUNT(DISTINCT c.TransactionID) DESC) = 1 
                                    THEN STRING_AGG(b.BrandName, ' + ') WITHIN GROUP (ORDER BY b.BrandName)
                                    ELSE NULL END AS TopCombo,
                                CASE WHEN ROW_NUMBER() OVER (PARTITION BY c.Region, c.City, c.Barangay 
                                    ORDER BY COUNT(DISTINCT c.TransactionID) DESC) = 1 
                                    THEN COUNT(DISTINCT c.TransactionID) ELSE 0 END AS TopComboCount
                            FROM 
                                [dbo].[SalesInteractionBrands] c
                            JOIN 
                                dbo.Brands b ON c.BrandID = b.BrandID
                            WHERE 
                                c.TransactionDate >= @StartDate
                                AND (@BrandID IS NULL OR c.BrandID = @BrandID)
                                -- For combos, only consider transactions with multiple brands
                                AND EXISTS (
                                    SELECT 1 
                                    FROM [dbo].[SalesInteractionBrands] c2 
                                    WHERE c2.TransactionID = c.TransactionID 
                                    GROUP BY c2.TransactionID 
                                    HAVING COUNT(DISTINCT c2.BrandID) > 1
                                )
                            GROUP BY 
                                c.Region, c.City, c.Barangay, c.TransactionID
                        ) ComboData
                        GROUP BY 
                            Region, City, Barangay, TopCombo
                        FOR JSON PATH
                    ) AS properties,
                    (
                        SELECT 
                            'Polygon' AS [type],
                            '[ChoroplethMap will populate this with actual geometry]' AS coordinates
                        FOR JSON PATH
                    ) AS geometry
                FROM 
                    [dbo].[SalesInteractionBrands] sib
                WHERE 
                    sib.TransactionDate >= @StartDate
                    AND (@BrandID IS NULL OR sib.BrandID = @BrandID)
                    -- For combos, only consider transactions with multiple brands
                    AND EXISTS (
                        SELECT 1 
                        FROM [dbo].[SalesInteractionBrands] sib2 
                        WHERE sib2.TransactionID = sib.TransactionID 
                        GROUP BY sib2.TransactionID 
                        HAVING COUNT(DISTINCT sib2.BrandID) > 1
                    )
                GROUP BY 
                    CASE WHEN @GeoLevel = 'region' THEN Region
                         WHEN @GeoLevel = 'city' THEN CONCAT(Region, '_', City)
                         ELSE CONCAT(Region, '_', City, '_', Barangay)
                    END
                FOR JSON PATH
            ) AS features
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END
END;
GO

-- Procedure to run the ETL on a schedule
CREATE OR ALTER PROCEDURE [dbo].[ScheduledUpdateSalesInteractionBrands]
AS
BEGIN
    -- Set history length to process (can be adjusted)
    DECLARE @DaysToProcess INT = 90;
    
    EXEC [dbo].[PopulateSalesInteractionBrands] @DaysToProcess = @DaysToProcess;
    
    -- Return execution status
    SELECT 
        'SalesInteractionBrands ETL completed' AS Status,
        GETDATE() AS ExecutionTime,
        @DaysToProcess AS DaysProcessed,
        (SELECT COUNT(*) FROM [dbo].[SalesInteractionBrands] WHERE TransactionDate >= DATEADD(DAY, -@DaysToProcess, GETDATE())) AS RecordsUpdated;
END;
GO

-- =======================================================================
-- SECTION 5: INITIAL DATA POPULATION
-- =======================================================================

-- Populate initial data (comment out if you don't want to run immediately)
-- EXEC [dbo].[PopulateSalesInteractionBrands] @DaysToProcess = 90;