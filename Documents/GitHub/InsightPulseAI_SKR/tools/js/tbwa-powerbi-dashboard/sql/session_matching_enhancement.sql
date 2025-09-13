-- Migration Script for Project Scout Schema Enhancement
-- Adds explicit session matching table and transaction detail support
-- ================================================================

BEGIN TRANSACTION;

PRINT 'Starting Project Scout schema enhancement migration...';

-- =================================================================
-- STEP 1: Create backup of affected tables
-- =================================================================
PRINT 'Creating backups of affected tables...';

SELECT *
INTO dbo.SalesInteractions_Backup
FROM dbo.SalesInteractions;

SELECT *
INTO dbo.SalesInteractionBrands_Backup
FROM dbo.SalesInteractionBrands;

SELECT *
INTO dbo.bronze_transcriptions_Backup
FROM dbo.bronze_transcriptions;

SELECT *
INTO dbo.bronze_vision_detections_Backup
FROM dbo.bronze_vision_detections;

-- =================================================================
-- STEP 2: Create new Session Matching table
-- =================================================================
PRINT 'Creating SessionMatches table...';

CREATE TABLE dbo.SessionMatches (
    SessionMatchID INT IDENTITY(1,1) PRIMARY KEY,
    InteractionID VARCHAR(60) NOT NULL,
    TranscriptID INT NULL,
    DetectionID INT NULL,
    MatchConfidence FLOAT NOT NULL DEFAULT 1.0,
    TimeOffsetMs INT NULL,
    MatchMethod VARCHAR(50) NOT NULL DEFAULT 'TimestampCorrelation',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    -- Audit columns
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    CONSTRAINT FK_SessionMatches_SalesInteractions FOREIGN KEY (InteractionID) 
        REFERENCES dbo.SalesInteractions(InteractionID),
    CONSTRAINT FK_SessionMatches_Transcriptions FOREIGN KEY (TranscriptID) 
        REFERENCES dbo.bronze_transcriptions(TranscriptID),
    CONSTRAINT FK_SessionMatches_Detections FOREIGN KEY (DetectionID) 
        REFERENCES dbo.bronze_vision_detections(DetectionID)
);

CREATE INDEX IX_SessionMatches_InteractionID ON dbo.SessionMatches(InteractionID);
CREATE INDEX IX_SessionMatches_TranscriptID ON dbo.SessionMatches(TranscriptID);
CREATE INDEX IX_SessionMatches_DetectionID ON dbo.SessionMatches(DetectionID);

-- =================================================================
-- STEP 3: Enhance SalesInteractions with transaction metrics
-- =================================================================
PRINT 'Enhancing SalesInteractions table with transaction metrics...';

-- Add new columns to SalesInteractions
ALTER TABLE dbo.SalesInteractions
ADD TransactionDuration INT NULL,                     -- Duration in seconds
    ProductCount INT NULL,                           -- Number of distinct products
    TotalItemCount INT NULL,                         -- Total quantity of all items
    TransactionValue DECIMAL(10,2) NULL,             -- Estimated peso value
    RequestMethod VARCHAR(50) NULL,                  -- How customer requested product
    HasSubstitution BIT NOT NULL DEFAULT 0,          -- Whether substitution occurred
    FirstChoiceProductID INT NULL,                   -- First product requested
    SubstitutedProductID INT NULL,                   -- Product substituted to
    -- Audit columns
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    -- Data quality and source tracking
    SourceSystem NVARCHAR(50) NULL,
    SourceRecordID NVARCHAR(100) NULL,
    DataQualityScore DECIMAL(5,2) NULL;

-- Add foreign key constraints
ALTER TABLE dbo.SalesInteractions
ADD CONSTRAINT FK_SalesInteractions_FirstChoiceProduct 
    FOREIGN KEY (FirstChoiceProductID) REFERENCES dbo.Products(ProductID);

ALTER TABLE dbo.SalesInteractions
ADD CONSTRAINT FK_SalesInteractions_SubstitutedProduct 
    FOREIGN KEY (SubstitutedProductID) REFERENCES dbo.Products(ProductID);

-- =================================================================
-- STEP 4: Create TransactionItems table for product quantities
-- =================================================================
PRINT 'Creating TransactionItems table for product quantities...';

CREATE TABLE dbo.TransactionItems (
    TransactionItemID INT IDENTITY(1,1) PRIMARY KEY,
    InteractionID VARCHAR(60) NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NULL,
    RequestSequence INT NOT NULL DEFAULT 0,
    RequestMethod VARCHAR(50) NULL,
    -- Audit columns
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    -- Quality and source tracking
    SourceSystem NVARCHAR(50) NULL DEFAULT 'TransactionImport',
    SourceRecordID NVARCHAR(100) NULL,
    DataQualityScore DECIMAL(5,2) NULL,
    CONSTRAINT FK_TransactionItems_SalesInteractions FOREIGN KEY (InteractionID) 
        REFERENCES dbo.SalesInteractions(InteractionID),
    CONSTRAINT FK_TransactionItems_Products FOREIGN KEY (ProductID) 
        REFERENCES dbo.Products(ProductID)
);

CREATE INDEX IX_TransactionItems_InteractionID ON dbo.TransactionItems(InteractionID);
CREATE INDEX IX_TransactionItems_ProductID ON dbo.TransactionItems(ProductID);

-- =================================================================
-- STEP 5: Create RequestMethods reference table
-- =================================================================
PRINT 'Creating RequestMethods reference table...';

CREATE TABLE dbo.RequestMethods (
    RequestMethodID INT IDENTITY(1,1) PRIMARY KEY,
    MethodName VARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    RequiresBrandMention BIT NOT NULL DEFAULT 0,
    RequiresVisualReference BIT NOT NULL DEFAULT 0,
    IsQuestion BIT NOT NULL DEFAULT 0,
    -- Audit columns
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER
);

-- Populate with common request methods
INSERT INTO dbo.RequestMethods (MethodName, Description, RequiresBrandMention, RequiresVisualReference, IsQuestion)
VALUES 
('BrandSpecific', 'Customer mentioned specific brand name', 1, 0, 0),
('CategoryOnly', 'Customer mentioned product category only', 0, 0, 0),
('VisualPointing', 'Customer pointed to or indicated product visually', 0, 1, 0),
('Question', 'Customer asked if product is available', 0, 0, 1),
('UnbrandedCommodity', 'Customer requested unbranded item (e.g. ice, salt)', 0, 0, 0);

-- =================================================================
-- STEP 6: Create UnbrandedCommodities reference table
-- =================================================================
PRINT 'Creating UnbrandedCommodities reference table...';

CREATE TABLE dbo.UnbrandedCommodities (
    CommodityID INT IDENTITY(1,1) PRIMARY KEY,
    CommodityName NVARCHAR(100) NOT NULL,
    LocalTerms NVARCHAR(255) NULL,
    CategoryID INT NULL,
    -- Audit columns
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    CONSTRAINT FK_UnbrandedCommodities_Category 
        FOREIGN KEY (CategoryID) REFERENCES dbo.Products(Category)
);

-- Create full-text index for local terms
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ProductsCatalog')
BEGIN
    CREATE FULLTEXT CATALOG ProductsCatalog AS DEFAULT;
END

CREATE FULLTEXT INDEX ON dbo.UnbrandedCommodities (
    CommodityName,
    LocalTerms
) KEY INDEX PK__UnbrandedCommodities ON ProductsCatalog WITH CHANGE_TRACKING AUTO;

-- Populate with common Filipino unbranded commodities
INSERT INTO dbo.UnbrandedCommodities (CommodityName, LocalTerms)
VALUES 
('Ice', 'yelo,tubig yelo'),
('Salt', 'asin'),
('Sugar', 'asukal'),
('Rice', 'bigas,kanin'),
('Eggs', 'itlog'),
('Vinegar', 'suka'),
('Soy Sauce', 'toyo'),
('Cooking Oil', 'mantika'),
('Bread', 'tinapay,pandesal'),
('Onion', 'sibuyas'),
('Garlic', 'bawang'),
('Matches', 'posporo'),
('Water', 'tubig');

-- =================================================================
-- STEP 7: Create procedures to populate session matching data
-- =================================================================
PRINT 'Creating stored procedures for session matching...';

CREATE OR ALTER PROCEDURE dbo.PopulateSessionMatches
AS
BEGIN
    SET NOCOUNT ON;

    -- Populate session matches from existing data based on timestamps
    -- This would fill the new SessionMatches table with correlations
    -- between transcriptions and detections that occurred close in time
    
    INSERT INTO dbo.SessionMatches (
        InteractionID, 
        TranscriptID, 
        DetectionID, 
        MatchConfidence, 
        TimeOffsetMs,
        CreatedBy,
        LastUpdatedBy
    )
    SELECT 
        si.InteractionID,
        bt.TranscriptID,
        bvd.DetectionID,
        0.9 AS MatchConfidence, -- Default high confidence for existing matches
        DATEDIFF(MILLISECOND, bt.Timestamp, bvd.Timestamp) AS TimeOffsetMs,
        SYSTEM_USER,
        SYSTEM_USER
    FROM 
        dbo.SalesInteractions si
        JOIN dbo.bronze_transcriptions bt ON 
            bt.StoreID = si.StoreID AND 
            bt.DeviceID = si.DeviceID AND
            DATEDIFF(SECOND, bt.Timestamp, si.TransactionDate) BETWEEN -30 AND 30
        JOIN dbo.bronze_vision_detections bvd ON 
            bvd.StoreID = si.StoreID AND
            bvd.DeviceID = si.DeviceID AND
            DATEDIFF(SECOND, bvd.Timestamp, si.TransactionDate) BETWEEN -30 AND 30
    WHERE
        NOT EXISTS (SELECT 1 FROM dbo.SessionMatches sm 
                   WHERE sm.InteractionID = si.InteractionID
                   AND sm.TranscriptID = bt.TranscriptID
                   AND sm.DetectionID = bvd.DetectionID);
                   
    -- Return session match statistics
    SELECT 
        COUNT(*) AS MatchesCreated,
        COUNT(DISTINCT InteractionID) AS InteractionsMatched,
        AVG(MatchConfidence) AS AvgConfidence
    FROM 
        dbo.SessionMatches
    WHERE 
        CreatedAt >= DATEADD(MINUTE, -5, GETDATE());
END;
GO

-- =================================================================
-- STEP 8: Create procedures to calculate transaction metrics
-- =================================================================
PRINT 'Creating stored procedures for transaction metrics...';

CREATE OR ALTER PROCEDURE dbo.CalculateTransactionMetrics
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update transaction durations based on transcript timestamps
    UPDATE si
    SET 
        TransactionDuration = DATEDIFF(SECOND, MIN(bt.Timestamp), MAX(bt.Timestamp)),
        LastUpdatedAt = GETDATE(),
        LastUpdatedBy = 'TransactionMetricsCalculator',
        DataQualityScore = CASE 
                              WHEN DATEDIFF(SECOND, MIN(bt.Timestamp), MAX(bt.Timestamp)) > 0 THEN 80
                              ELSE 60
                           END
    FROM dbo.SalesInteractions si
    JOIN dbo.SessionMatches sm ON si.InteractionID = sm.InteractionID
    JOIN dbo.bronze_transcriptions bt ON sm.TranscriptID = bt.TranscriptID
    GROUP BY si.InteractionID;
    
    -- Update product counts based on brand mentions
    UPDATE si
    SET 
        ProductCount = brands.BrandCount,
        LastUpdatedAt = GETDATE(),
        LastUpdatedBy = 'TransactionMetricsCalculator'
    FROM dbo.SalesInteractions si
    JOIN (
        SELECT InteractionID, COUNT(DISTINCT BrandID) AS BrandCount
        FROM dbo.SalesInteractionBrands
        GROUP BY InteractionID
    ) brands ON si.InteractionID = brands.InteractionID;
    
    -- Update total item count based on transaction items
    UPDATE si
    SET 
        TotalItemCount = items.TotalQuantity,
        LastUpdatedAt = GETDATE(),
        LastUpdatedBy = 'TransactionMetricsCalculator'
    FROM dbo.SalesInteractions si
    JOIN (
        SELECT InteractionID, SUM(Quantity) AS TotalQuantity
        FROM dbo.TransactionItems
        GROUP BY InteractionID
    ) items ON si.InteractionID = items.InteractionID;
    
    -- Update transaction value (would require product price data)
    -- This is a placeholder for that logic
    UPDATE si
    SET 
        TransactionValue = COALESCE(
            (SELECT SUM(ti.Quantity * ti.UnitPrice)
             FROM dbo.TransactionItems ti
             WHERE ti.InteractionID = si.InteractionID
             GROUP BY ti.InteractionID),
            0.00),
        LastUpdatedAt = GETDATE(),
        LastUpdatedBy = 'TransactionMetricsCalculator'
    FROM dbo.SalesInteractions si
    WHERE TransactionValue IS NULL OR TransactionValue = 0;
    
    -- Return transaction metrics statistics
    SELECT 
        COUNT(*) AS TransactionsUpdated,
        AVG(TransactionDuration) AS AvgDuration,
        AVG(ProductCount) AS AvgProductCount,
        AVG(TransactionValue) AS AvgValue
    FROM 
        dbo.SalesInteractions
    WHERE 
        LastUpdatedBy = 'TransactionMetricsCalculator'
        AND LastUpdatedAt >= DATEADD(MINUTE, -5, GETDATE());
END;
GO

-- =================================================================
-- STEP 9: Create procedure to detect substitutions
-- =================================================================
PRINT 'Creating stored procedure for substitution detection...';

CREATE OR ALTER PROCEDURE dbo.DetectProductSubstitutions
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Identify potential substitutions based on transcript analysis
    -- This is a placeholder for more sophisticated analysis
    
    -- Example logic: If a transcript mentions a product that wasn't in the final transaction
    -- and then another product of the same category was purchased instead, mark as substitution
    
    WITH MentionedProducts AS (
        -- Products mentioned in transcripts
        SELECT 
            sm.InteractionID,
            p.ProductID,
            p.ProductName,
            p.Category,
            ROW_NUMBER() OVER (PARTITION BY sm.InteractionID ORDER BY bt.Timestamp) AS RequestOrder
        FROM 
            dbo.SessionMatches sm
            JOIN dbo.bronze_transcriptions bt ON sm.TranscriptID = bt.TranscriptID
            JOIN dbo.bronze_transcript_brands btb ON bt.TranscriptID = btb.TranscriptID
            JOIN dbo.Products p ON btb.BrandID = p.BrandID
    ),
    PurchasedProducts AS (
        -- Products actually purchased
        SELECT 
            ti.InteractionID,
            ti.ProductID
        FROM 
            dbo.TransactionItems ti
    )
    
    -- Update SalesInteractions with substitution info
    UPDATE si
    SET 
        HasSubstitution = 1,
        FirstChoiceProductID = mp.ProductID,
        SubstitutedProductID = pp.ProductID,
        LastUpdatedAt = GETDATE(),
        LastUpdatedBy = 'SubstitutionDetector'
    FROM 
        dbo.SalesInteractions si
        JOIN MentionedProducts mp ON si.InteractionID = mp.InteractionID
        JOIN PurchasedProducts pp ON si.InteractionID = pp.InteractionID
    WHERE 
        mp.RequestOrder = 1
        AND mp.ProductID <> pp.ProductID
        AND mp.Category = (SELECT Category FROM dbo.Products WHERE ProductID = pp.ProductID)
        AND NOT EXISTS (
            SELECT 1 FROM PurchasedProducts pp2 
            WHERE pp2.InteractionID = si.InteractionID 
            AND pp2.ProductID = mp.ProductID
        );
    
    -- Return substitution statistics
    SELECT 
        COUNT(*) AS SubstitutionsDetected,
        COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM dbo.SalesInteractions), 0) AS SubstitutionPercentage
    FROM 
        dbo.SalesInteractions
    WHERE 
        HasSubstitution = 1;
END;
GO

-- =================================================================
-- STEP 10: Create view for dashboard consumption
-- =================================================================
PRINT 'Creating dashboard view...';

CREATE OR ALTER VIEW dbo.SalesInteractionDashboardView
AS
SELECT 
    si.InteractionID,
    si.StoreID,
    s.StoreName,
    s.Location,
    si.TransactionDate,
    si.TransactionDuration,
    si.ProductCount,
    si.TotalItemCount,
    si.TransactionValue,
    si.Gender,
    si.Age,
    si.EmotionalState,
    sib.BrandName,
    p.Category,
    p.ProductName,
    CASE WHEN si.HasSubstitution = 1 THEN 'Yes' ELSE 'No' END AS HasSubstitution,
    fp.ProductName AS FirstProduct,
    sp.ProductName AS SubstitutedProduct,
    rm.MethodName AS RequestMethodName,
    rm.Description AS RequestMethodDescription,
    -- Data quality indicators
    si.DataQualityScore,
    -- Audit information
    si.CreatedAt,
    si.CreatedBy,
    si.LastUpdatedAt,
    si.LastUpdatedBy
FROM 
    dbo.SalesInteractions si
    LEFT JOIN dbo.Stores s ON si.StoreID = s.StoreID
    LEFT JOIN dbo.SalesInteractionBrands sib ON si.InteractionID = sib.InteractionID
    LEFT JOIN dbo.Products p ON sib.BrandID = p.BrandID
    LEFT JOIN dbo.Products fp ON si.FirstChoiceProductID = fp.ProductID
    LEFT JOIN dbo.Products sp ON si.SubstitutedProductID = sp.ProductID
    LEFT JOIN dbo.RequestMethods rm ON si.RequestMethod = rm.MethodName;
GO

-- Create Power BI-optimized view with standard naming
CREATE OR ALTER VIEW dbo.vw_SalesInteractionsForPowerBI
AS
SELECT 
    si.InteractionID,
    si.StoreID,
    s.StoreName,
    s.Region,
    s.City,
    s.Barangay,
    CAST(si.TransactionDate AS DATE) AS TransactionDate,
    DATEPART(HOUR, si.TransactionDate) AS TransactionHour,
    DATEPART(WEEKDAY, si.TransactionDate) AS TransactionWeekday,
    si.TransactionDuration,
    si.ProductCount,
    si.TotalItemCount,
    si.TransactionValue,
    si.Gender,
    si.Age,
    si.EmotionalState,
    CASE WHEN si.HasSubstitution = 1 THEN 'Yes' ELSE 'No' END AS HasSubstitution,
    -- Brand information
    b.BrandName,
    b.BrandID,
    bc.CategoryName AS BrandCategory,
    -- Product information
    p.ProductName,
    p.Category AS ProductCategory,
    p.ProductID,
    -- Transaction items
    ti.Quantity,
    ti.UnitPrice,
    ti.Quantity * ti.UnitPrice AS LineTotal,
    -- Request method
    rm.MethodName AS RequestMethod,
    rm.RequiresBrandMention,
    rm.RequiresVisualReference,
    -- Data quality
    si.DataQualityScore
FROM 
    dbo.SalesInteractions si
    LEFT JOIN dbo.Stores s ON si.StoreID = s.StoreID
    LEFT JOIN dbo.TransactionItems ti ON si.InteractionID = ti.InteractionID
    LEFT JOIN dbo.Products p ON ti.ProductID = p.ProductID
    LEFT JOIN dbo.BrandMaster b ON p.BrandID = b.BrandID
    LEFT JOIN dbo.BrandCategoryMaster bc ON b.CategoryID = bc.CategoryID
    LEFT JOIN dbo.RequestMethods rm ON si.RequestMethod = rm.MethodName;
GO

-- =================================================================
-- STEP 11: Create migration verification procedure
-- =================================================================
PRINT 'Creating migration verification procedure...';

CREATE OR ALTER PROCEDURE dbo.VerifyScoutMigration
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorFound BIT = 0;
    DECLARE @ErrorMessage NVARCHAR(4000) = '';
    
    -- Verify SessionMatches table
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SessionMatches')
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'SessionMatches table not created. ';
    END
    
    -- Verify SalesInteractions columns
    IF NOT COL_LENGTH('dbo.SalesInteractions', 'TransactionDuration') IS NULL
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'SalesInteractions columns not added. ';
    END
    
    -- Verify TransactionItems table
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TransactionItems')
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'TransactionItems table not created. ';
    END
    
    -- Verify view creation
    IF NOT EXISTS (SELECT 1 FROM sys.views WHERE name = 'SalesInteractionDashboardView')
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'Dashboard view not created. ';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_SalesInteractionsForPowerBI')
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'Power BI view not created. ';
    END
    
    -- Verify procedure creation
    IF NOT EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'PopulateSessionMatches')
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'PopulateSessionMatches procedure not created. ';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'CalculateTransactionMetrics')
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'CalculateTransactionMetrics procedure not created. ';
    END
    
    -- Report verification results
    IF @ErrorFound = 1
    BEGIN
        RAISERROR(@ErrorMessage, 16, 1);
    END
    ELSE
    BEGIN
        SELECT 
            (SELECT COUNT(*) FROM dbo.SessionMatches) AS SessionMatchesCount,
            (SELECT COUNT(*) FROM dbo.SalesInteractions WHERE TransactionDuration IS NOT NULL) AS TransactionsWithDuration,
            (SELECT COUNT(*) FROM dbo.TransactionItems) AS TransactionItemsCount,
            (SELECT COUNT(*) FROM dbo.SalesInteractions WHERE HasSubstitution = 1) AS SubstitutionsDetected,
            'Migration verification completed successfully.' AS Status;
    END
END;
GO

-- =================================================================
-- STEP 12: Create data quality analysis procedure
-- =================================================================
PRINT 'Creating data quality analysis procedure...';

CREATE OR ALTER PROCEDURE dbo.AnalyzeSessionMatchQuality
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate data quality scores for session matches
    WITH MatchQuality AS (
        SELECT
            sm.InteractionID,
            COUNT(sm.SessionMatchID) AS MatchCount,
            AVG(sm.MatchConfidence) AS AvgConfidence,
            MAX(ABS(sm.TimeOffsetMs)) AS MaxTimeOffset,
            CASE
                WHEN MAX(ABS(sm.TimeOffsetMs)) < 1000 THEN 100  -- Less than 1 second offset
                WHEN MAX(ABS(sm.TimeOffsetMs)) < 5000 THEN 80   -- Less than 5 seconds offset
                WHEN MAX(ABS(sm.TimeOffsetMs)) < 10000 THEN 60  -- Less than 10 seconds offset
                ELSE 40                                         -- More than 10 seconds offset
            END AS TimeOffsetScore,
            CASE
                WHEN COUNT(DISTINCT sm.TranscriptID) > 3 THEN 100  -- Multiple transcript matches
                WHEN COUNT(DISTINCT sm.TranscriptID) > 1 THEN 80   -- At least 2 transcript matches
                ELSE 60                                            -- Only 1 transcript match
            END AS TranscriptCoverageScore
        FROM
            dbo.SessionMatches sm
        GROUP BY
            sm.InteractionID
    )
    
    -- Update data quality scores in SalesInteractions
    UPDATE si
    SET
        DataQualityScore = (mq.TimeOffsetScore * 0.4 + mq.TranscriptCoverageScore * 0.4 + (mq.AvgConfidence * 100) * 0.2),
        LastUpdatedAt = GETDATE(),
        LastUpdatedBy = 'DataQualityAnalyzer'
    FROM
        dbo.SalesInteractions si
        JOIN MatchQuality mq ON si.InteractionID = mq.InteractionID;
    
    -- Return quality analysis results
    SELECT
        'Session Match Quality Analysis' AS AnalysisType,
        COUNT(*) AS InteractionsAnalyzed,
        AVG(DataQualityScore) AS AvgQualityScore,
        MIN(DataQualityScore) AS MinQualityScore,
        MAX(DataQualityScore) AS MaxQualityScore,
        COUNT(CASE WHEN DataQualityScore >= 80 THEN 1 END) * 100.0 / COUNT(*) AS HighQualityPercentage
    FROM
        dbo.SalesInteractions
    WHERE
        DataQualityScore IS NOT NULL;
END;
GO

-- =================================================================
-- STEP 13: Execute population procedures
-- =================================================================
PRINT 'Executing population procedures...';

EXEC dbo.PopulateSessionMatches;
EXEC dbo.CalculateTransactionMetrics;
EXEC dbo.DetectProductSubstitutions;
EXEC dbo.AnalyzeSessionMatchQuality;

-- =================================================================
-- STEP 14: Verify migration
-- =================================================================
PRINT 'Verifying migration...';

EXEC dbo.VerifyScoutMigration;

-- =================================================================
-- STEP 15: Create Power BI specific materialized view (if supported)
-- =================================================================
PRINT 'Setting up Power BI optimization...';

-- If using SQL Server 2019 or later with materialized views
-- This improves Power BI performance dramatically
IF SERVERPROPERTY('ProductMajorVersion') >= 15
BEGIN
    EXEC('
    CREATE OR ALTER VIEW dbo.vw_PowerBI_SalesInteractions
    WITH SCHEMABINDING
    AS
    SELECT 
        si.InteractionID,
        si.StoreID,
        si.TransactionDate,
        si.TransactionDuration,
        si.ProductCount,
        si.TotalItemCount,
        si.TransactionValue,
        si.HasSubstitution,
        ti.ProductID,
        ti.Quantity,
        ti.UnitPrice,
        p.Category AS ProductCategory,
        b.BrandID,
        si.RequestMethod,
        CAST(si.TransactionDate AS DATE) AS TransactionDateOnly,
        DATEPART(HOUR, si.TransactionDate) AS HourOfDay,
        DATEPART(WEEKDAY, si.TransactionDate) AS DayOfWeek
    FROM 
        dbo.SalesInteractions si
        JOIN dbo.TransactionItems ti ON si.InteractionID = ti.InteractionID
        JOIN dbo.Products p ON ti.ProductID = p.ProductID
        JOIN dbo.BrandMaster b ON p.BrandID = b.BrandID;
        
    CREATE UNIQUE CLUSTERED INDEX idx_PowerBI_SalesInteractions 
    ON dbo.vw_PowerBI_SalesInteractions(InteractionID, ProductID);
    ');
    
    PRINT 'Created optimized materialized view for Power BI';
END
ELSE
BEGIN
    PRINT 'Skipping materialized view creation (requires SQL Server 2019+)';
END

-- If everything is successful, commit the transaction
COMMIT TRANSACTION;

PRINT 'Project Scout schema enhancement migration completed successfully.';
GO

-- =================================================================
-- STEP 16: Create Power BI dataset definition script
-- =================================================================
PRINT 'Creating Power BI dataset definition script...';

-- This doesn't execute anything, just creates a script file for Power BI
-- administrators to use when setting up the dataset

DECLARE @PowerBIScript NVARCHAR(MAX) = '
-- Power BI Dataset Definition for Project Scout Dashboard
-- Created by Scout Schema Enhancement Migration

-- Recommended measures to create in Power BI:
-- ==========================================

-- 1. Transaction Count
Count_Transactions = COUNTROWS(DISTINCT(SalesInteractions[InteractionID]))

-- 2. Average Transaction Duration (in seconds)
Avg_TransactionDuration = AVERAGE(SalesInteractions[TransactionDuration])

-- 3. Average Transaction Value
Avg_TransactionValue = AVERAGE(SalesInteractions[TransactionValue])

-- 4. Total Sales Value
Total_Sales = SUM(TransactionItems[UnitPrice] * TransactionItems[Quantity])

-- 5. Substitution Rate
Substitution_Rate = 
DIVIDE(
    COUNTROWS(FILTER(SalesInteractions, SalesInteractions[HasSubstitution] = "Yes")),
    COUNTROWS(SalesInteractions)
)

-- 6. Product Count per Transaction
Avg_Products_Per_Transaction = AVERAGE(SalesInteractions[ProductCount])

-- 7. Brand Mentions (Count of brand references)
Brand_Mentions = COUNTROWS(SessionMatches)

-- 8. Quality Score
Avg_Quality_Score = AVERAGE(SalesInteractions[DataQualityScore])

-- Recommended relationships:
-- ========================
-- 1. SalesInteractions[InteractionID] -> SessionMatches[InteractionID] (1:*)
-- 2. SalesInteractions[InteractionID] -> TransactionItems[InteractionID] (1:*)
-- 3. TransactionItems[ProductID] -> Products[ProductID] (many:1)
-- 4. Products[BrandID] -> BrandMaster[BrandID] (many:1)
-- 5. Products[Category] -> BrandCategoryMaster[CategoryID] (many:1)
-- 6. SalesInteractions[RequestMethod] -> RequestMethods[MethodName] (many:1)

-- Recommended hierarchies:
-- ======================
-- 1. Date Hierarchy:
--    - Year
--    - Quarter
--    - Month
--    - Week
--    - Day
--    
-- 2. Store Hierarchy:
--    - Region
--    - City
--    - Barangay
--    - Store
--    
-- 3. Product Hierarchy:
--    - Category
--    - Brand
--    - Product
';

-- Write the script to a results output
PRINT @PowerBIScript;

-- =================================================================
-- STEP 17: Create sample queries for Power BI ETL
-- =================================================================

PRINT 'Creating sample queries for Power BI ETL...';

DECLARE @SampleQueries NVARCHAR(MAX) = '
-- Sample Power BI Direct Query

-- Base sales transactions data
SELECT 
    si.InteractionID,
    si.StoreID,
    s.StoreName,
    s.Region,
    s.City,
    s.Barangay,
    CAST(si.TransactionDate AS DATE) AS TransactionDate,
    DATEPART(HOUR, si.TransactionDate) AS TransactionHour,
    DATEPART(WEEKDAY, si.TransactionDate) AS TransactionWeekday,
    si.TransactionDuration,
    si.ProductCount,
    si.TotalItemCount,
    si.TransactionValue,
    si.HasSubstitution
FROM 
    dbo.SalesInteractions si
    JOIN dbo.Stores s ON si.StoreID = s.StoreID;

-- Transaction items detail
SELECT 
    ti.InteractionID,
    ti.ProductID,
    p.ProductName,
    p.Category,
    b.BrandName,
    ti.Quantity,
    ti.UnitPrice,
    (ti.Quantity * ti.UnitPrice) AS LineTotal,
    ti.RequestMethod
FROM 
    dbo.TransactionItems ti
    JOIN dbo.Products p ON ti.ProductID = p.ProductID
    JOIN dbo.BrandMaster b ON p.BrandID = b.BrandID;

-- Session matching data
SELECT 
    sm.InteractionID,
    sm.TranscriptID,
    sm.DetectionID,
    sm.MatchConfidence,
    sm.TimeOffsetMs,
    bt.TranscriptText,
    bt.ChunkIndex,
    bvd.DetectionType,
    bvd.ConfidenceScore,
    bvd.BoundingBox
FROM 
    dbo.SessionMatches sm
    JOIN dbo.bronze_transcriptions bt ON sm.TranscriptID = bt.TranscriptID
    JOIN dbo.bronze_vision_detections bvd ON sm.DetectionID = bvd.DetectionID;

-- Substitution analysis
SELECT 
    si.InteractionID,
    fp.ProductName AS FirstChoiceProduct,
    sp.ProductName AS SubstitutedProduct,
    fp.Category AS ProductCategory,
    COUNT(*) OVER(PARTITION BY fp.ProductID, sp.ProductID) AS SubstitutionFrequency
FROM 
    dbo.SalesInteractions si
    JOIN dbo.Products fp ON si.FirstChoiceProductID = fp.ProductID
    JOIN dbo.Products sp ON si.SubstitutedProductID = sp.ProductID
WHERE 
    si.HasSubstitution = 1;
';

-- Write the sample queries to results output
PRINT @SampleQueries;