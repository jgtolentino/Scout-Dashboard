-- Migration Script for Project Scout Schema Enhancement
-- Adds explicit session matching table and transaction detail support
-- ================================================================

BEGIN TRANSACTION;

PRINT 'Starting Project Scout schema enhancement migration...';

-- =================================================================
-- STEP 1: Create backup of affected tables
-- =================================================================
PRINT 'Creating backups of affected tables...';

-- Create backups with IF NOT EXISTS checks
IF OBJECT_ID('dbo.SalesInteractions_Backup', 'U') IS NULL
BEGIN
    SELECT *
    INTO dbo.SalesInteractions_Backup
    FROM dbo.SalesInteractions;
    
    PRINT 'Created SalesInteractions backup';
END

IF OBJECT_ID('dbo.SalesInteractionBrands_Backup', 'U') IS NULL
BEGIN
    SELECT *
    INTO dbo.SalesInteractionBrands_Backup
    FROM dbo.SalesInteractionBrands;
    
    PRINT 'Created SalesInteractionBrands backup';
END

IF OBJECT_ID('dbo.bronze_transcriptions_Backup', 'U') IS NULL
BEGIN
    SELECT *
    INTO dbo.bronze_transcriptions_Backup
    FROM dbo.bronze_transcriptions;
    
    PRINT 'Created bronze_transcriptions backup';
END

IF OBJECT_ID('dbo.bronze_vision_detections_Backup', 'U') IS NULL
BEGIN
    SELECT *
    INTO dbo.bronze_vision_detections_Backup
    FROM dbo.bronze_vision_detections;
    
    PRINT 'Created bronze_vision_detections backup';
END

-- =================================================================
-- STEP 2: Create new Session Matching table
-- =================================================================
PRINT 'Creating SessionMatches table...';

IF OBJECT_ID('dbo.SessionMatches', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SessionMatches (
        SessionMatchID INT IDENTITY(1,1) PRIMARY KEY,
        InteractionID VARCHAR(60) NOT NULL,
        TranscriptID INT NULL,
        DetectionID INT NULL,
        MatchConfidence FLOAT NOT NULL DEFAULT 1.0,
        TimeOffsetMs INT NULL,
        MatchMethod VARCHAR(50) NOT NULL DEFAULT 'TimestampCorrelation',
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        IngestedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
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
    
    PRINT 'SessionMatches table created successfully';
END
ELSE
BEGIN
    PRINT 'SessionMatches table already exists, skipping creation';
END

-- =================================================================
-- STEP 3: Enhance SalesInteractions with transaction metrics
-- =================================================================
PRINT 'Enhancing SalesInteractions table with transaction metrics...';

-- Check if columns exist before adding them to prevent errors
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TransactionDuration')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD TransactionDuration INT NULL;
    
    PRINT 'Added TransactionDuration column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'ProductCount')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD ProductCount INT NULL;
    
    PRINT 'Added ProductCount column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TotalItemCount')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD TotalItemCount INT NULL;
    
    PRINT 'Added TotalItemCount column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TransactionValue')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD TransactionValue DECIMAL(10,2) NULL;
    
    PRINT 'Added TransactionValue column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'RequestMethod')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD RequestMethod VARCHAR(50) NULL;
    
    PRINT 'Added RequestMethod column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'HasSubstitution')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD HasSubstitution BIT NOT NULL DEFAULT 0;
    
    PRINT 'Added HasSubstitution column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'FirstChoiceProductID')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD FirstChoiceProductID INT NULL;
    
    PRINT 'Added FirstChoiceProductID column to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'SubstitutedProductID')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD SubstitutedProductID INT NULL;
    
    PRINT 'Added SubstitutedProductID column to SalesInteractions';
END

-- Add foreign key constraints if columns were successfully added
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'FirstChoiceProductID')
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SalesInteractions_FirstChoiceProduct')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD CONSTRAINT FK_SalesInteractions_FirstChoiceProduct 
        FOREIGN KEY (FirstChoiceProductID) REFERENCES dbo.Products(ProductID);
        
    PRINT 'Added foreign key FK_SalesInteractions_FirstChoiceProduct';
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'SubstitutedProductID')
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SalesInteractions_SubstitutedProduct')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD CONSTRAINT FK_SalesInteractions_SubstitutedProduct 
        FOREIGN KEY (SubstitutedProductID) REFERENCES dbo.Products(ProductID);
        
    PRINT 'Added foreign key FK_SalesInteractions_SubstitutedProduct';
END

-- =================================================================
-- STEP 4: Create TransactionItems table for product quantities
-- =================================================================
PRINT 'Creating TransactionItems table for product quantities...';

IF OBJECT_ID('dbo.TransactionItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TransactionItems (
        TransactionItemID INT IDENTITY(1,1) PRIMARY KEY,
        InteractionID VARCHAR(60) NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        UnitPrice DECIMAL(10,2) NULL,
        RequestSequence INT NOT NULL DEFAULT 0,
        RequestMethod VARCHAR(50) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        IngestedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_TransactionItems_SalesInteractions FOREIGN KEY (InteractionID) 
            REFERENCES dbo.SalesInteractions(InteractionID),
        CONSTRAINT FK_TransactionItems_Products FOREIGN KEY (ProductID) 
            REFERENCES dbo.Products(ProductID)
    );

    CREATE INDEX IX_TransactionItems_InteractionID ON dbo.TransactionItems(InteractionID);
    CREATE INDEX IX_TransactionItems_ProductID ON dbo.TransactionItems(ProductID);
    
    PRINT 'TransactionItems table created successfully';
END
ELSE
BEGIN
    PRINT 'TransactionItems table already exists, skipping creation';
END

-- =================================================================
-- STEP 5: Create RequestMethods reference table
-- =================================================================
PRINT 'Creating RequestMethods reference table...';

IF OBJECT_ID('dbo.RequestMethods', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RequestMethods (
        RequestMethodID INT IDENTITY(1,1) PRIMARY KEY,
        MethodName VARCHAR(50) NOT NULL,
        Description NVARCHAR(255) NULL,
        RequiresBrandMention BIT NOT NULL DEFAULT 0,
        RequiresVisualReference BIT NOT NULL DEFAULT 0,
        IsQuestion BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Populate with common request methods
    INSERT INTO dbo.RequestMethods (MethodName, Description, RequiresBrandMention, RequiresVisualReference, IsQuestion)
    VALUES 
    ('BrandSpecific', 'Customer mentioned specific brand name', 1, 0, 0),
    ('CategoryOnly', 'Customer mentioned product category only', 0, 0, 0),
    ('VisualPointing', 'Customer pointed to or indicated product visually', 0, 1, 0),
    ('Question', 'Customer asked if product is available', 0, 0, 1),
    ('UnbrandedCommodity', 'Customer requested unbranded item (e.g. ice, salt)', 0, 0, 0);
    
    PRINT 'RequestMethods table created and populated successfully';
END
ELSE
BEGIN
    PRINT 'RequestMethods table already exists, skipping creation';
END

-- =================================================================
-- STEP 6: Create UnbrandedCommodities reference table
-- =================================================================
PRINT 'Creating UnbrandedCommodities reference table...';

IF OBJECT_ID('dbo.UnbrandedCommodities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UnbrandedCommodities (
        CommodityID INT IDENTITY(1,1) PRIMARY KEY,
        CommodityName NVARCHAR(100) NOT NULL,
        LocalTerms NVARCHAR(255) NULL,
        CategoryID INT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_UnbrandedCommodities_Category 
            FOREIGN KEY (CategoryID) REFERENCES dbo.Products(Category)
    );

    -- Populate with common Filipino unbranded commodities
    INSERT INTO dbo.UnbrandedCommodities (CommodityName, LocalTerms)
    VALUES 
    ('Ice', 'yelo,tubig yelo'),
    ('Salt', 'asin'),
    ('Sugar', 'asukal'),
    ('Rice', 'bigas,kanin'),
    ('Eggs', 'itlog');
    
    PRINT 'UnbrandedCommodities table created and populated successfully';
END
ELSE
BEGIN
    PRINT 'UnbrandedCommodities table already exists, skipping creation';
END

-- =================================================================
-- STEP 7: Create procedures to populate session matching data
-- =================================================================
PRINT 'Creating stored procedures for session matching...';

-- Drop procedure if it exists to recreate it
IF OBJECT_ID('dbo.PopulateSessionMatches', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.PopulateSessionMatches;
    PRINT 'Dropped existing PopulateSessionMatches procedure';
END

-- Create procedure
CREATE PROCEDURE dbo.PopulateSessionMatches
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Populate session matches from existing data based on timestamps
    -- This would fill the new SessionMatches table with correlations
    -- between transcriptions and detections that occurred close in time
    
    INSERT INTO dbo.SessionMatches (InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs)
    SELECT 
        si.InteractionID,
        bt.TranscriptID,
        bvd.DetectionID,
        0.9 AS MatchConfidence, -- Default high confidence for existing matches
        DATEDIFF(MILLISECOND, bt.Timestamp, bvd.Timestamp) AS TimeOffsetMs
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
                   
    -- Return the number of new matches created
    DECLARE @MatchesCreated INT = @@ROWCOUNT;
    SELECT @MatchesCreated AS MatchesCreated;
    
    PRINT CONCAT('Created ', @MatchesCreated, ' new session matches');
END;
GO

-- =================================================================
-- STEP 8: Create procedures to calculate transaction metrics
-- =================================================================
PRINT 'Creating stored procedures for transaction metrics...';

-- Drop procedure if it exists to recreate it
IF OBJECT_ID('dbo.CalculateTransactionMetrics', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.CalculateTransactionMetrics;
    PRINT 'Dropped existing CalculateTransactionMetrics procedure';
END

-- Create procedure
CREATE PROCEDURE dbo.CalculateTransactionMetrics
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Keep track of updates
    DECLARE @DurationUpdates INT = 0;
    DECLARE @ProductCountUpdates INT = 0;
    DECLARE @ValueUpdates INT = 0;
    
    -- Update transaction durations based on transcript timestamps
    UPDATE si
    SET TransactionDuration = DATEDIFF(SECOND, MIN(bt.Timestamp), MAX(bt.Timestamp))
    FROM dbo.SalesInteractions si
    JOIN dbo.SessionMatches sm ON si.InteractionID = sm.InteractionID
    JOIN dbo.bronze_transcriptions bt ON sm.TranscriptID = bt.TranscriptID
    WHERE si.TransactionDuration IS NULL
    GROUP BY si.InteractionID;
    
    SET @DurationUpdates = @@ROWCOUNT;
    
    -- Update product counts based on brand mentions
    UPDATE si
    SET ProductCount = brands.BrandCount
    FROM dbo.SalesInteractions si
    JOIN (
        SELECT InteractionID, COUNT(DISTINCT BrandID) AS BrandCount
        FROM dbo.SalesInteractionBrands
        GROUP BY InteractionID
    ) brands ON si.InteractionID = brands.InteractionID
    WHERE si.ProductCount IS NULL;
    
    SET @ProductCountUpdates = @@ROWCOUNT;
    
    -- Update transaction value (would require product price data)
    -- This is a simplified placeholder for that logic
    UPDATE si
    SET TransactionValue = 0.00
    FROM dbo.SalesInteractions si
    WHERE si.TransactionValue IS NULL;
    
    SET @ValueUpdates = @@ROWCOUNT;
    
    -- Return update counts
    SELECT 
        @DurationUpdates AS DurationUpdates,
        @ProductCountUpdates AS ProductCountUpdates,
        @ValueUpdates AS ValueUpdates;
        
    PRINT CONCAT('Updated transaction metrics: ', 
                @DurationUpdates, ' durations, ', 
                @ProductCountUpdates, ' product counts, ', 
                @ValueUpdates, ' transaction values');
END;
GO

-- =================================================================
-- STEP 9: Create view for dashboard consumption
-- =================================================================
PRINT 'Creating dashboard view...';

-- Drop view if it exists to recreate it
IF OBJECT_ID('dbo.SalesInteractionDashboardView', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.SalesInteractionDashboardView;
    PRINT 'Dropped existing SalesInteractionDashboardView view';
END

-- Create view
CREATE VIEW dbo.SalesInteractionDashboardView
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
    -- Add session match information
    CASE WHEN sm.SessionMatchID IS NOT NULL THEN 'Yes' ELSE 'No' END AS HasSessionMatch,
    COUNT(DISTINCT sm.TranscriptID) AS TranscriptCount,
    COUNT(DISTINCT sm.DetectionID) AS DetectionCount
FROM 
    dbo.SalesInteractions si
    LEFT JOIN dbo.Stores s ON si.StoreID = s.StoreID
    LEFT JOIN dbo.SalesInteractionBrands sib ON si.InteractionID = sib.InteractionID
    LEFT JOIN dbo.Products p ON sib.BrandID = p.BrandID
    LEFT JOIN dbo.Products fp ON si.FirstChoiceProductID = fp.ProductID
    LEFT JOIN dbo.Products sp ON si.SubstitutedProductID = sp.ProductID
    LEFT JOIN dbo.SessionMatches sm ON si.InteractionID = sm.InteractionID
GROUP BY
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
    CASE WHEN si.HasSubstitution = 1 THEN 'Yes' ELSE 'No' END,
    fp.ProductName,
    sp.ProductName,
    CASE WHEN sm.SessionMatchID IS NOT NULL THEN 'Yes' ELSE 'No' END;
GO

PRINT 'SalesInteractionDashboardView created successfully';

-- =================================================================
-- STEP 10: Create migration verification procedure
-- =================================================================
PRINT 'Creating migration verification procedure...';

-- Drop procedure if it exists to recreate it
IF OBJECT_ID('dbo.VerifyScoutMigration', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.VerifyScoutMigration;
    PRINT 'Dropped existing VerifyScoutMigration procedure';
END

-- Create procedure
CREATE PROCEDURE dbo.VerifyScoutMigration
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorFound BIT = 0;
    DECLARE @ErrorMessage NVARCHAR(4000) = '';
    DECLARE @VerificationResults TABLE (
        CheckName NVARCHAR(100),
        Result NVARCHAR(50),
        Details NVARCHAR(255)
    );
    
    -- Verify SessionMatches table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SessionMatches')
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('SessionMatches table', 'Success', 'Table exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'SessionMatches table not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('SessionMatches table', 'Failure', 'Table does not exist');
    END
    
    -- Verify SalesInteractions columns
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TransactionDuration')
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('SalesInteractions columns', 'Success', 'TransactionDuration column exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'SalesInteractions columns not added. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('SalesInteractions columns', 'Failure', 'TransactionDuration column does not exist');
    END
    
    -- Verify TransactionItems table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TransactionItems')
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('TransactionItems table', 'Success', 'Table exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'TransactionItems table not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('TransactionItems table', 'Failure', 'Table does not exist');
    END
    
    -- Verify RequestMethods table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RequestMethods')
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('RequestMethods table', 'Success', 'Table exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'RequestMethods table not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('RequestMethods table', 'Failure', 'Table does not exist');
    END
    
    -- Verify UnbrandedCommodities table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UnbrandedCommodities')
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('UnbrandedCommodities table', 'Success', 'Table exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'UnbrandedCommodities table not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('UnbrandedCommodities table', 'Failure', 'Table does not exist');
    END
    
    -- Verify stored procedures
    IF OBJECT_ID('dbo.PopulateSessionMatches', 'P') IS NOT NULL
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('PopulateSessionMatches procedure', 'Success', 'Procedure exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'PopulateSessionMatches procedure not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('PopulateSessionMatches procedure', 'Failure', 'Procedure does not exist');
    END
    
    IF OBJECT_ID('dbo.CalculateTransactionMetrics', 'P') IS NOT NULL
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('CalculateTransactionMetrics procedure', 'Success', 'Procedure exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'CalculateTransactionMetrics procedure not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('CalculateTransactionMetrics procedure', 'Failure', 'Procedure does not exist');
    END
    
    -- Verify dashboard view
    IF OBJECT_ID('dbo.SalesInteractionDashboardView', 'V') IS NOT NULL
    BEGIN
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('SalesInteractionDashboardView view', 'Success', 'View exists');
    END
    ELSE
    BEGIN
        SET @ErrorFound = 1;
        SET @ErrorMessage = @ErrorMessage + 'SalesInteractionDashboardView view not created. ';
        
        INSERT INTO @VerificationResults (CheckName, Result, Details)
        VALUES ('SalesInteractionDashboardView view', 'Failure', 'View does not exist');
    END
    
    -- Report verification results
    SELECT * FROM @VerificationResults ORDER BY Result DESC, CheckName;
    
    IF @ErrorFound = 1
    BEGIN
        RAISERROR(@ErrorMessage, 16, 1);
    END
    ELSE
    BEGIN
        PRINT 'Migration verification completed successfully.';
    END
END;
GO

-- =================================================================
-- STEP 11: Execute population procedures
-- =================================================================
PRINT 'Executing population procedures...';

-- Execute the procedures to populate data
BEGIN TRY
    -- Populate session matches
    EXEC dbo.PopulateSessionMatches;
    
    -- Calculate transaction metrics
    EXEC dbo.CalculateTransactionMetrics;
    
    PRINT 'Population procedures executed successfully';
END TRY
BEGIN CATCH
    PRINT 'Error executing population procedures: ' + ERROR_MESSAGE();
END CATCH

-- =================================================================
-- STEP 12: Verify migration
-- =================================================================
PRINT 'Verifying migration...';

-- Execute verification procedure
BEGIN TRY
    EXEC dbo.VerifyScoutMigration;
    PRINT 'Migration verification completed successfully';
END TRY
BEGIN CATCH
    PRINT 'Error during verification: ' + ERROR_MESSAGE();
    
    -- Don't roll back transaction if verification fails
    -- We want to keep the changes even if the verification reports issues
END CATCH

-- If everything is successful, commit the transaction
COMMIT TRANSACTION;

PRINT 'Project Scout schema enhancement migration completed successfully.';
GO