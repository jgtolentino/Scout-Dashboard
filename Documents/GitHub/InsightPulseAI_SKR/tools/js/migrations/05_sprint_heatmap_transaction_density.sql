-- =====================================================
-- Heatmap Iteration: Transaction Density by Location
-- File: 05_sprint_heatmap_transaction_density.sql
-- Purpose: Add geographic transaction density view for heatmap visualization
-- =====================================================

USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

PRINT '========================================================';
PRINT 'HEATMAP ITERATION: TRANSACTION DENSITY VIEW';
PRINT 'Execution started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================================';

-- =====================================================
-- Step 1: Ensure GeoDimension Table Exists
-- =====================================================

PRINT 'Checking GeoDimension table structure...';

-- Create GeoDimension table if it doesn't exist (from Sprint 11)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GeoDimension')
BEGIN
    PRINT 'Creating GeoDimension table...';
    
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
    
    CREATE UNIQUE INDEX IX_GeoDimension_StoreID ON dbo.GeoDimension (StoreID);
    PRINT 'GeoDimension table created successfully';
END
ELSE
    PRINT 'GeoDimension table already exists';

-- =====================================================
-- Step 2: Populate GeoDimension with Sample Data
-- =====================================================

PRINT 'Populating GeoDimension with sample geographic data...';

-- Clear existing data and repopulate
TRUNCATE TABLE dbo.GeoDimension;

-- Insert sample barangay data for existing stores
INSERT INTO dbo.GeoDimension (StoreID, Barangay, Municipality, Province, Region, Latitude, Longitude)
SELECT 
    s.StoreID,
    -- Extract or assign barangay from store location
    CASE 
        WHEN s.Location LIKE '%Poblacion%' THEN 'Poblacion'
        WHEN s.Location LIKE '%San Antonio%' THEN 'San Antonio'
        WHEN s.Location LIKE '%Bagumbayan%' THEN 'Bagumbayan'
        WHEN s.Location LIKE '%Maligaya%' THEN 'Maligaya'
        WHEN s.Location LIKE '%Rizal%' THEN 'Rizal'
        WHEN s.Location LIKE '%Mabini%' THEN 'Mabini'
        WHEN s.Location LIKE '%Del Pilar%' THEN 'Del Pilar'
        WHEN s.Location LIKE '%Bonifacio%' THEN 'Bonifacio'
        ELSE 
            CASE (ABS(CHECKSUM(NEWID())) % 8)
                WHEN 0 THEN 'Poblacion'
                WHEN 1 THEN 'San Antonio'
                WHEN 2 THEN 'Bagumbayan'
                WHEN 3 THEN 'Maligaya'
                WHEN 4 THEN 'Rizal'
                WHEN 5 THEN 'Mabini'
                WHEN 6 THEN 'Del Pilar'
                ELSE 'Bonifacio'
            END
    END as Barangay,
    
    -- Assign municipality based on patterns
    CASE 
        WHEN s.Location LIKE '%Metro Manila%' OR s.Location LIKE '%Manila%' THEN 'Manila'
        WHEN s.Location LIKE '%Quezon%' THEN 'Quezon City'
        WHEN s.Location LIKE '%Makati%' THEN 'Makati'
        WHEN s.Location LIKE '%Cebu%' THEN 'Cebu City'
        WHEN s.Location LIKE '%Davao%' THEN 'Davao City'
        ELSE 
            CASE (ABS(CHECKSUM(NEWID())) % 5)
                WHEN 0 THEN 'Manila'
                WHEN 1 THEN 'Quezon City'
                WHEN 2 THEN 'Makati'
                WHEN 3 THEN 'Cebu City'
                ELSE 'Davao City'
            END
    END as Municipality,
    
    -- Assign province
    CASE 
        WHEN s.Location LIKE '%Metro Manila%' OR s.Location LIKE '%Manila%' THEN 'Metro Manila'
        WHEN s.Location LIKE '%Cebu%' THEN 'Cebu'
        WHEN s.Location LIKE '%Davao%' THEN 'Davao del Sur'
        ELSE 'Metro Manila'
    END as Province,
    
    -- Assign region
    CASE 
        WHEN s.Location LIKE '%Metro Manila%' OR s.Location LIKE '%Manila%' THEN 'NCR'
        WHEN s.Location LIKE '%Cebu%' THEN 'Region VII'
        WHEN s.Location LIKE '%Davao%' THEN 'Region XI'
        ELSE 'NCR'
    END as Region,
    
    -- Use existing coordinates or generate realistic ones
    COALESCE(s.Latitude, 14.5995 + (RAND(CHECKSUM(NEWID())) - 0.5) * 0.5), -- Manila area
    COALESCE(s.Longitude, 120.9842 + (RAND(CHECKSUM(NEWID())) - 0.5) * 0.5) -- Manila area
    
FROM dbo.Stores s
WHERE s.StoreID IS NOT NULL;

PRINT 'Populated ' + CAST(@@ROWCOUNT AS VARCHAR) + ' geographic records';

-- =====================================================
-- Step 3: Create Transaction Density View
-- =====================================================

PRINT 'Creating v_TransactionDensity view...';

CREATE OR ALTER VIEW dbo.v_TransactionDensity AS
SELECT 
    gd.Barangay,
    gd.Municipality,
    gd.Province,
    gd.Region,
    AVG(gd.Latitude) as CenterLatitude,
    AVG(gd.Longitude) as CenterLongitude,
    COUNT(si.InteractionID) as TransactionCount,
    SUM(si.TransactionAmount) as TotalAmount,
    AVG(si.TransactionAmount) as AvgAmount,
    COUNT(DISTINCT si.StoreID) as StoreCount,
    COUNT(DISTINCT si.CustomerID) as UniqueCustomers,
    
    -- Density classification
    CASE 
        WHEN COUNT(si.InteractionID) >= 100 THEN 'High'
        WHEN COUNT(si.InteractionID) >= 50 THEN 'Medium-High'
        WHEN COUNT(si.InteractionID) >= 20 THEN 'Medium'
        WHEN COUNT(si.InteractionID) >= 5 THEN 'Low'
        ELSE 'Very Low'
    END as DensityLevel,
    
    -- Activity score (normalized 0-100)
    CASE 
        WHEN COUNT(si.InteractionID) > 0 THEN
            LEAST(100, (COUNT(si.InteractionID) * 100.0 / 
                (SELECT MAX(cnt) FROM (
                    SELECT COUNT(*) as cnt 
                    FROM dbo.SalesInteractions si2 
                    INNER JOIN dbo.Stores s2 ON si2.StoreID = s2.StoreID
                    INNER JOIN dbo.GeoDimension gd2 ON s2.StoreID = gd2.StoreID
                    GROUP BY gd2.Barangay
                ) max_counts)))
        ELSE 0
    END as ActivityScore

FROM dbo.GeoDimension gd
LEFT JOIN dbo.Stores s ON gd.StoreID = s.StoreID
LEFT JOIN dbo.SalesInteractions si ON s.StoreID = si.StoreID
GROUP BY 
    gd.Barangay, 
    gd.Municipality, 
    gd.Province, 
    gd.Region;
GO

-- =====================================================
-- Step 4: Create Heatmap Data Procedure
-- =====================================================

PRINT 'Creating sp_GetTransactionDensity procedure...';

CREATE OR ALTER PROCEDURE dbo.sp_GetTransactionDensity
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @Municipality NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to last 30 days if no dates provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    -- Geographic density data for heatmap
    SELECT 
        'density_data' as dataset_name,
        gd.Barangay,
        gd.Municipality,
        gd.Province,
        gd.Region,
        AVG(gd.Latitude) as Latitude,
        AVG(gd.Longitude) as Longitude,
        COUNT(si.InteractionID) as TransactionCount,
        SUM(si.TransactionAmount) as TotalAmount,
        AVG(CAST(si.TransactionAmount as FLOAT)) as AvgAmount,
        COUNT(DISTINCT si.StoreID) as StoreCount,
        COUNT(DISTINCT si.CustomerID) as UniqueCustomers,
        
        -- Density metrics for heatmap coloring
        CASE 
            WHEN COUNT(si.InteractionID) >= 100 THEN 'High'
            WHEN COUNT(si.InteractionID) >= 50 THEN 'Medium-High'
            WHEN COUNT(si.InteractionID) >= 20 THEN 'Medium'
            WHEN COUNT(si.InteractionID) >= 5 THEN 'Low'
            ELSE 'Very Low'
        END as DensityLevel,
        
        -- Normalized activity score (0-100) for heat intensity
        CASE 
            WHEN COUNT(si.InteractionID) > 0 THEN
                CASE 
                    WHEN MAX(COUNT(si.InteractionID)) OVER() > 0 THEN
                        CAST(COUNT(si.InteractionID) * 100.0 / MAX(COUNT(si.InteractionID)) OVER() AS INT)
                    ELSE 0
                END
            ELSE 0
        END as HeatIntensity
        
    FROM dbo.GeoDimension gd
    LEFT JOIN dbo.Stores s ON gd.StoreID = s.StoreID
    LEFT JOIN dbo.SalesInteractions si ON s.StoreID = si.StoreID 
        AND si.TransactionDate BETWEEN @StartDate AND @EndDate
    WHERE (@Municipality IS NULL OR gd.Municipality = @Municipality)
    GROUP BY 
        gd.Barangay, 
        gd.Municipality, 
        gd.Province, 
        gd.Region
    HAVING COUNT(si.InteractionID) > 0  -- Only show areas with transactions
    ORDER BY COUNT(si.InteractionID) DESC;
    
    -- Summary statistics for the heatmap
    SELECT 
        'summary_stats' as dataset_name,
        COUNT(DISTINCT gd.Barangay) as TotalBarangays,
        COUNT(DISTINCT gd.Municipality) as TotalMunicipalities,
        SUM(CASE WHEN si.InteractionID IS NOT NULL THEN 1 ELSE 0 END) as TotalTransactions,
        COUNT(DISTINCT si.StoreID) as ActiveStores,
        MIN(si.TransactionDate) as DateRangeStart,
        MAX(si.TransactionDate) as DateRangeEnd
    FROM dbo.GeoDimension gd
    LEFT JOIN dbo.Stores s ON gd.StoreID = s.StoreID
    LEFT JOIN dbo.SalesInteractions si ON s.StoreID = si.StoreID 
        AND si.TransactionDate BETWEEN @StartDate AND @EndDate
    WHERE (@Municipality IS NULL OR gd.Municipality = @Municipality);
END;
GO

-- =====================================================
-- Step 5: Create Performance Indexes
-- =====================================================

PRINT 'Creating performance indexes for heatmap queries...';

-- Index for geographic lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.GeoDimension') AND name = 'IX_GeoDimension_Barangay')
BEGIN
    CREATE NONCLUSTERED INDEX IX_GeoDimension_Barangay
    ON dbo.GeoDimension (Barangay, Municipality)
    INCLUDE (StoreID, Latitude, Longitude);
    PRINT 'Created geographic lookup index';
END;

-- Index for store-transaction joins
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'IX_SalesInteractions_StoreDate')
BEGIN
    CREATE NONCLUSTERED INDEX IX_SalesInteractions_StoreDate
    ON dbo.SalesInteractions (StoreID, TransactionDate)
    INCLUDE (InteractionID, TransactionAmount, CustomerID);
    PRINT 'Created store-date lookup index';
END;

-- =====================================================
-- Step 6: Test the Heatmap Views and Procedures
-- =====================================================

PRINT 'Testing heatmap functionality...';

-- Test the view
SELECT 
    'v_TransactionDensity Test' as test_name,
    COUNT(*) as total_barangays,
    SUM(TransactionCount) as total_transactions,
    AVG(TransactionCount) as avg_transactions_per_barangay,
    COUNT(CASE WHEN DensityLevel = 'High' THEN 1 END) as high_density_areas
FROM dbo.v_TransactionDensity;

-- Test the procedure
PRINT 'Testing sp_GetTransactionDensity procedure...';
EXEC dbo.sp_GetTransactionDensity 
    @StartDate = '2025-05-01', 
    @EndDate = '2025-05-23';

-- =====================================================
-- Step 7: Update Statistics
-- =====================================================

PRINT 'Updating table statistics...';
UPDATE STATISTICS dbo.GeoDimension;
UPDATE STATISTICS dbo.SalesInteractions;

PRINT 'Heatmap iteration migration completed successfully!';
PRINT 'Ready for heatmap API integration at /api/transactions/heatmap';
PRINT '========================================================';
GO