-- =====================================================
-- Sprint 12: FK Constraints and Data Validation Tests
-- File: 04_sprint12_fk_constraints_validation.sql
-- Purpose: Harden referential integrity and add comprehensive validation
-- =====================================================

USE [scout_analytics];
GO

-- =====================================================
-- Step 1: Add Missing Foreign Key Constraints
-- =====================================================

PRINT 'Adding foreign key constraints for referential integrity...';

-- SessionMatches to bronze_transcriptions
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SessionMatches_Transcription')
BEGIN
    ALTER TABLE dbo.SessionMatches
    ADD CONSTRAINT FK_SessionMatches_Transcription
    FOREIGN KEY (TranscriptionID) REFERENCES dbo.bronze_transcriptions(TranscriptionID)
    ON DELETE CASCADE;
    PRINT 'Added FK: SessionMatches -> bronze_transcriptions';
END;

-- SessionMatches to bronze_vision_detections  
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SessionMatches_Vision')
BEGIN
    ALTER TABLE dbo.SessionMatches
    ADD CONSTRAINT FK_SessionMatches_Vision
    FOREIGN KEY (VisionDetectionID) REFERENCES dbo.bronze_vision_detections(DetectionID)
    ON DELETE CASCADE;
    PRINT 'Added FK: SessionMatches -> bronze_vision_detections';
END;

-- Ensure SalesInteractionTranscripts has proper FK
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SalesInteractionTranscripts_SalesInteractions')
BEGIN
    ALTER TABLE dbo.SalesInteractionTranscripts
    ADD CONSTRAINT FK_SalesInteractionTranscripts_SalesInteractions
    FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID)
    ON DELETE CASCADE;
    PRINT 'Added FK: SalesInteractionTranscripts -> SalesInteractions';
END;

-- =====================================================
-- Step 2: Create Audit Tables for Dimensions
-- =====================================================

PRINT 'Creating audit tables for dimension changes...';

-- Products audit table (following BrandUpdates pattern)
CREATE TABLE dbo.ProductUpdates (
    UpdateID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ChangeType VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    OldProductName NVARCHAR(255),
    NewProductName NVARCHAR(255),
    OldCategory NVARCHAR(100),
    NewCategory NVARCHAR(100),
    OldBrandID INT,
    NewBrandID INT,
    ChangeDate DATETIME2 DEFAULT GETDATE(),
    ChangedBy NVARCHAR(100) DEFAULT SYSTEM_USER,
    CONSTRAINT FK_ProductUpdates_Product FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID)
);
GO

-- Stores audit table
CREATE TABLE dbo.StoreUpdates (
    UpdateID INT IDENTITY(1,1) PRIMARY KEY,
    StoreID INT NOT NULL,
    ChangeType VARCHAR(10) NOT NULL,
    OldStoreName NVARCHAR(255),
    NewStoreName NVARCHAR(255),
    OldLocation NVARCHAR(500),
    NewLocation NVARCHAR(500),
    OldLatitude DECIMAL(10,8),
    NewLatitude DECIMAL(10,8),
    OldLongitude DECIMAL(11,8),
    NewLongitude DECIMAL(11,8),
    ChangeDate DATETIME2 DEFAULT GETDATE(),
    ChangedBy NVARCHAR(100) DEFAULT SYSTEM_USER,
    CONSTRAINT FK_StoreUpdates_Store FOREIGN KEY (StoreID) REFERENCES dbo.Stores(StoreID)
);
GO

-- =====================================================
-- Step 3: Create Audit Triggers
-- =====================================================

PRINT 'Creating audit triggers for dimension tables...';

-- Products audit trigger
CREATE OR ALTER TRIGGER tr_Products_Audit
ON dbo.Products
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Handle DELETE
    IF EXISTS(SELECT 1 FROM deleted) AND NOT EXISTS(SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO dbo.ProductUpdates (ProductID, ChangeType, OldProductName, OldCategory, OldBrandID)
        SELECT ProductID, 'DELETE', ProductName, Category, BrandID
        FROM deleted;
    END
    
    -- Handle INSERT
    IF EXISTS(SELECT 1 FROM inserted) AND NOT EXISTS(SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.ProductUpdates (ProductID, ChangeType, NewProductName, NewCategory, NewBrandID)
        SELECT ProductID, 'INSERT', ProductName, Category, BrandID
        FROM inserted;
    END
    
    -- Handle UPDATE
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.ProductUpdates (
            ProductID, ChangeType, 
            OldProductName, NewProductName,
            OldCategory, NewCategory,
            OldBrandID, NewBrandID
        )
        SELECT 
            i.ProductID, 'UPDATE',
            d.ProductName, i.ProductName,
            d.Category, i.Category,
            d.BrandID, i.BrandID
        FROM inserted i
        INNER JOIN deleted d ON i.ProductID = d.ProductID
        WHERE (
            i.ProductName != d.ProductName OR
            ISNULL(i.Category, '') != ISNULL(d.Category, '') OR
            ISNULL(i.BrandID, 0) != ISNULL(d.BrandID, 0)
        );
    END
END;
GO

-- Stores audit trigger
CREATE OR ALTER TRIGGER tr_Stores_Audit
ON dbo.Stores
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Handle DELETE
    IF EXISTS(SELECT 1 FROM deleted) AND NOT EXISTS(SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO dbo.StoreUpdates (StoreID, ChangeType, OldStoreName, OldLocation, OldLatitude, OldLongitude)
        SELECT StoreID, 'DELETE', StoreName, Location, Latitude, Longitude
        FROM deleted;
    END
    
    -- Handle INSERT
    IF EXISTS(SELECT 1 FROM inserted) AND NOT EXISTS(SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.StoreUpdates (StoreID, ChangeType, NewStoreName, NewLocation, NewLatitude, NewLongitude)
        SELECT StoreID, 'INSERT', StoreName, Location, Latitude, Longitude
        FROM inserted;
    END
    
    -- Handle UPDATE
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.StoreUpdates (
            StoreID, ChangeType,
            OldStoreName, NewStoreName,
            OldLocation, NewLocation,
            OldLatitude, NewLatitude,
            OldLongitude, NewLongitude
        )
        SELECT 
            i.StoreID, 'UPDATE',
            d.StoreName, i.StoreName,
            d.Location, i.Location,
            d.Latitude, i.Latitude,
            d.Longitude, i.Longitude
        FROM inserted i
        INNER JOIN deleted d ON i.StoreID = d.StoreID
        WHERE (
            ISNULL(i.StoreName, '') != ISNULL(d.StoreName, '') OR
            ISNULL(i.Location, '') != ISNULL(d.Location, '') OR
            ISNULL(i.Latitude, 0) != ISNULL(d.Latitude, 0) OR
            ISNULL(i.Longitude, 0) != ISNULL(d.Longitude, 0)
        );
    END
END;
GO

-- =====================================================
-- Step 4: Create Data Quality Validation Procedures
-- =====================================================

PRINT 'Creating data quality validation procedures...';

-- Comprehensive data quality check procedure
CREATE OR ALTER PROCEDURE sp_DataQualityCheck
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IssueCount INT = 0;
    
    PRINT '=== DATA QUALITY VALIDATION REPORT ===';
    PRINT 'Generated: ' + CONVERT(VARCHAR, GETDATE(), 120);
    PRINT '';
    
    -- Check 1: Orphaned transaction items
    SELECT @IssueCount = COUNT(*)
    FROM dbo.TransactionItems ti
    LEFT JOIN dbo.SalesInteractions si ON ti.InteractionID = si.InteractionID
    WHERE si.InteractionID IS NULL;
    
    IF @IssueCount > 0
    BEGIN
        PRINT 'ISSUE: ' + CAST(@IssueCount AS VARCHAR) + ' orphaned transaction items found';
        SELECT 'Orphaned TransactionItems' as Issue, COUNT(*) as Count
        FROM dbo.TransactionItems ti
        LEFT JOIN dbo.SalesInteractions si ON ti.InteractionID = si.InteractionID
        WHERE si.InteractionID IS NULL;
    END
    ELSE
        PRINT 'PASS: No orphaned transaction items';
    
    -- Check 2: Products without brands
    SELECT @IssueCount = COUNT(*)
    FROM dbo.Products p
    LEFT JOIN dbo.Brands b ON p.BrandID = b.BrandID
    WHERE p.BrandID IS NOT NULL AND b.BrandID IS NULL;
    
    IF @IssueCount > 0
    BEGIN
        PRINT 'ISSUE: ' + CAST(@IssueCount AS VARCHAR) + ' products with invalid brand references';
        SELECT 'Invalid Brand References' as Issue, COUNT(*) as Count
        FROM dbo.Products p
        LEFT JOIN dbo.Brands b ON p.BrandID = b.BrandID
        WHERE p.BrandID IS NOT NULL AND b.BrandID IS NULL;
    END
    ELSE
        PRINT 'PASS: All product brand references are valid';
    
    -- Check 3: Negative transaction amounts
    SELECT @IssueCount = COUNT(*)
    FROM dbo.SalesInteractions
    WHERE TransactionAmount < 0;
    
    IF @IssueCount > 0
    BEGIN
        PRINT 'ISSUE: ' + CAST(@IssueCount AS VARCHAR) + ' transactions with negative amounts';
        SELECT 'Negative Transaction Amounts' as Issue, COUNT(*) as Count
        FROM dbo.SalesInteractions WHERE TransactionAmount < 0;
    END
    ELSE
        PRINT 'PASS: No negative transaction amounts';
    
    -- Check 4: Invalid durations
    SELECT @IssueCount = COUNT(*)
    FROM dbo.SalesInteractions
    WHERE DurationSec < 0 OR DurationSec > 7200;
    
    IF @IssueCount > 0
    BEGIN
        PRINT 'ISSUE: ' + CAST(@IssueCount AS VARCHAR) + ' transactions with invalid durations';
        SELECT 'Invalid Durations' as Issue, COUNT(*) as Count
        FROM dbo.SalesInteractions 
        WHERE DurationSec < 0 OR DurationSec > 7200;
    END
    ELSE
        PRINT 'PASS: All transaction durations are reasonable';
    
    -- Check 5: Session match integrity
    SELECT @IssueCount = COUNT(*)
    FROM dbo.SessionMatches sm
    LEFT JOIN dbo.bronze_transcriptions bt ON sm.TranscriptionID = bt.TranscriptionID
    LEFT JOIN dbo.bronze_vision_detections bv ON sm.VisionDetectionID = bv.DetectionID
    WHERE bt.TranscriptionID IS NULL OR bv.DetectionID IS NULL;
    
    IF @IssueCount > 0
    BEGIN
        PRINT 'ISSUE: ' + CAST(@IssueCount AS VARCHAR) + ' session matches with broken references';
        SELECT 'Broken Session Match References' as Issue, COUNT(*) as Count
        FROM dbo.SessionMatches sm
        LEFT JOIN dbo.bronze_transcriptions bt ON sm.TranscriptionID = bt.TranscriptionID
        LEFT JOIN dbo.bronze_vision_detections bv ON sm.VisionDetectionID = bv.DetectionID
        WHERE bt.TranscriptionID IS NULL OR bv.DetectionID IS NULL;
    END
    ELSE
        PRINT 'PASS: All session match references are valid';
    
    -- Check 6: Substitution logic integrity
    SELECT @IssueCount = COUNT(*)
    FROM dbo.TransactionItems
    WHERE IsSubstitution = 1 AND SubstitutedProductID IS NULL;
    
    IF @IssueCount > 0
    BEGIN
        PRINT 'ISSUE: ' + CAST(@IssueCount AS VARCHAR) + ' substitutions without original product reference';
        SELECT 'Invalid Substitution References' as Issue, COUNT(*) as Count
        FROM dbo.TransactionItems
        WHERE IsSubstitution = 1 AND SubstitutedProductID IS NULL;
    END
    ELSE
        PRINT 'PASS: All substitution references are valid';
    
    PRINT '';
    PRINT '=== END DATA QUALITY REPORT ===';
END;
GO

-- =====================================================
-- Step 5: Create Nightly Data Integrity Job Procedure
-- =====================================================

PRINT 'Creating nightly data integrity job procedure...';

CREATE OR ALTER PROCEDURE sp_NightlyDataIntegrityCheck
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartTime DATETIME2 = GETDATE();
    DECLARE @LogMessage NVARCHAR(MAX);
    
    -- Log start
    SET @LogMessage = 'Nightly data integrity check started at ' + CONVERT(VARCHAR, @StartTime, 120);
    INSERT INTO dbo.IntegrationAuditLogs (LogLevel, Message, CreatedAt)
    VALUES ('INFO', @LogMessage, @StartTime);
    
    -- Refresh materialized views
    EXEC sp_RefreshSkuFrequency;
    
    -- Run data quality checks
    EXEC sp_DataQualityCheck;
    
    -- Update transaction amounts for any missed records
    UPDATE si
    SET TransactionAmount = (
        SELECT ISNULL(SUM(ti.Quantity * ti.UnitPrice), 0)
        FROM dbo.TransactionItems ti
        WHERE ti.InteractionID = si.InteractionID
    )
    FROM dbo.SalesInteractions si
    WHERE si.TransactionAmount IS NULL;
    
    -- Clean up old audit logs (keep 90 days)
    DELETE FROM dbo.IntegrationAuditLogs
    WHERE CreatedAt < DATEADD(DAY, -90, GETDATE());
    
    -- Log completion
    DECLARE @EndTime DATETIME2 = GETDATE();
    DECLARE @Duration INT = DATEDIFF(SECOND, @StartTime, @EndTime);
    SET @LogMessage = 'Nightly data integrity check completed in ' + CAST(@Duration AS VARCHAR) + ' seconds';
    INSERT INTO dbo.IntegrationAuditLogs (LogLevel, Message, CreatedAt)
    VALUES ('INFO', @LogMessage, @EndTime);
    
    PRINT @LogMessage;
END;
GO

-- =====================================================
-- Step 6: Create Performance Monitoring Views
-- =====================================================

PRINT 'Creating performance monitoring views...';

CREATE OR ALTER VIEW v_SystemHealthMetrics AS
SELECT 
    'Database Size' as MetricName,
    CAST(SUM(size * 8.0 / 1024) AS DECIMAL(10,2)) as ValueMB,
    GETDATE() as MeasuredAt
FROM sys.database_files
WHERE type = 0  -- Data files only

UNION ALL

SELECT 
    'Total Transactions',
    CAST(COUNT(*) AS DECIMAL(10,2)),
    GETDATE()
FROM dbo.SalesInteractions

UNION ALL

SELECT 
    'Total Transaction Items',
    CAST(COUNT(*) AS DECIMAL(10,2)),
    GETDATE()
FROM dbo.TransactionItems

UNION ALL

SELECT 
    'Average Transaction Duration (seconds)',
    CAST(AVG(DurationSec) AS DECIMAL(10,2)),
    GETDATE()
FROM dbo.SalesInteractions
WHERE DurationSec IS NOT NULL

UNION ALL

SELECT 
    'Average Transaction Amount',
    CAST(AVG(TransactionAmount) AS DECIMAL(10,2)),
    GETDATE()
FROM dbo.SalesInteractions
WHERE TransactionAmount IS NOT NULL;
GO

-- =====================================================
-- Step 7: Add Additional Indexes for Performance
-- =====================================================

PRINT 'Creating additional performance indexes...';

-- Index for substitution analysis
CREATE NONCLUSTERED INDEX IX_TransactionItems_Substitution
ON dbo.TransactionItems (IsSubstitution, SubstitutedProductID)
INCLUDE (ProductID, Quantity, UnitPrice);

-- Index for request method analysis
CREATE NONCLUSTERED INDEX IX_TransactionItems_RequestMethod
ON dbo.TransactionItems (RequestMethod, IsStoreOwnerSuggested, SuggestionAccepted)
INCLUDE (ProductID, Quantity, UnitPrice);

-- Index for audit tables
CREATE NONCLUSTERED INDEX IX_ProductUpdates_Date ON dbo.ProductUpdates (ChangeDate);
CREATE NONCLUSTERED INDEX IX_StoreUpdates_Date ON dbo.StoreUpdates (ChangeDate);

-- =====================================================
-- Step 8: Create Data Export Procedures for Dashboard
-- =====================================================

PRINT 'Creating dashboard data export procedures...';

CREATE OR ALTER PROCEDURE sp_ExportDashboardData
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to last 30 days if no dates provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    -- Export transaction summary
    SELECT 
        'transaction_summary' as dataset_name,
        si.TransactionDate,
        si.StoreID,
        s.StoreName,
        s.Location as StoreLocation,
        COUNT(*) as TransactionCount,
        SUM(si.TransactionAmount) as TotalAmount,
        AVG(si.TransactionAmount) as AvgAmount,
        AVG(si.DurationSec) as AvgDurationSec,
        SUM(CASE WHEN ba.BasketSize = 1 THEN 1 ELSE 0 END) as SingleItemTransactions,
        SUM(CASE WHEN ba.BasketSize > 1 THEN 1 ELSE 0 END) as MultiItemTransactions
    FROM dbo.SalesInteractions si
    INNER JOIN dbo.Stores s ON si.StoreID = s.StoreID
    LEFT JOIN dbo.v_BasketAnalysis ba ON si.InteractionID = ba.InteractionID
    WHERE si.TransactionDate BETWEEN @StartDate AND @EndDate
    GROUP BY si.TransactionDate, si.StoreID, s.StoreName, s.Location
    ORDER BY si.TransactionDate, si.StoreID;
    
    -- Export top products
    SELECT 
        'top_products' as dataset_name,
        p.ProductID,
        p.ProductName,
        b.BrandName,
        p.Category,
        skf.TotalQuantitySold,
        skf.TotalTransactions,
        skf.TotalRevenue,
        skf.AvgQuantityPerTransaction
    FROM dbo.v_SkuFrequency skf
    INNER JOIN dbo.Products p ON skf.ProductID = p.ProductID
    LEFT JOIN dbo.Brands b ON p.BrandID = b.BrandID
    ORDER BY skf.TotalRevenue DESC;
    
    -- Export substitution patterns
    SELECT 
        'substitution_patterns' as dataset_name,
        sa.OriginalProductName,
        sa.OriginalBrandName,
        sa.SubstituteProductName,
        sa.SubstituteBrandName,
        sa.SubstitutionType,
        sa.SubstitutionCount,
        sa.TotalSubstitutionRevenue
    FROM dbo.v_SubstitutionAnalysis sa
    ORDER BY sa.SubstitutionCount DESC;
END;
GO

-- =====================================================
-- Step 9: Run Initial Data Quality Check
-- =====================================================

PRINT 'Running initial data quality check...';

EXEC sp_DataQualityCheck;
GO

-- =====================================================
-- Step 10: Create Maintenance Schedule Recommendations
-- =====================================================

PRINT 'Creating maintenance recommendations...';

INSERT INTO dbo.IntegrationAuditLogs (LogLevel, Message, CreatedAt)
VALUES ('INFO', 'MAINTENANCE SCHEDULE RECOMMENDATIONS:
1. Run sp_NightlyDataIntegrityCheck daily at 2 AM
2. Run sp_RefreshSkuFrequency every 4 hours during business hours  
3. Monitor v_SystemHealthMetrics weekly
4. Review audit tables (ProductUpdates, StoreUpdates) monthly
5. Clean old audit logs quarterly (automated in nightly job)
6. Rebuild indexes monthly during maintenance window', GETDATE());

-- =====================================================
-- Final Verification
-- =====================================================

PRINT 'Running final verification...';

SELECT 'Foreign Key Constraints' as CheckType, COUNT(*) as Count
FROM sys.foreign_keys 
WHERE parent_object_id IN (
    OBJECT_ID('dbo.SessionMatches'),
    OBJECT_ID('dbo.SalesInteractionTranscripts'),
    OBJECT_ID('dbo.TransactionItems')
);

SELECT 'Audit Tables' as CheckType, COUNT(*) as Count
FROM sys.tables
WHERE name IN ('ProductUpdates', 'StoreUpdates');

SELECT 'Data Quality Procedures' as CheckType, COUNT(*) as Count
FROM sys.procedures
WHERE name IN ('sp_DataQualityCheck', 'sp_NightlyDataIntegrityCheck', 'sp_ExportDashboardData');

PRINT '';
PRINT 'Sprint 12 migration completed successfully!';
PRINT 'All FK constraints, audit systems, and validation procedures are now in place.';
GO