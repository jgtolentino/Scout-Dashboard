-- ============================================================================
-- Synthetic Data Tracking Schema Updates
-- Client360 Dashboard - May 21, 2025
-- ============================================================================
-- This script adds IsSynthetic flags and tracking metadata to relevant tables
-- Enables clear identification of fabricated vs. real data throughout the system
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- SECTION 1: Update Core Tables with IsSynthetic Flag
-- ============================================================================

-- SalesInteractions table update
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractions]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractions]') AND name = 'IsSynthetic')
    BEGIN
        PRINT 'Adding IsSynthetic flag to SalesInteractions table';
        ALTER TABLE dbo.SalesInteractions ADD IsSynthetic BIT NOT NULL DEFAULT(0);
        
        -- Add index for filtering
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SalesInteractions_IsSynthetic' AND object_id = OBJECT_ID('dbo.SalesInteractions'))
        BEGIN
            CREATE INDEX IX_SalesInteractions_IsSynthetic ON dbo.SalesInteractions(IsSynthetic);
        END
        
        -- Add metadata columns for tracking fabrication source
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractions]') AND name = 'SourceSystem')
        BEGIN
            ALTER TABLE dbo.SalesInteractions ADD SourceSystem NVARCHAR(100) NULL;
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractions]') AND name = 'FabricationMethod')
        BEGIN
            ALTER TABLE dbo.SalesInteractions ADD FabricationMethod NVARCHAR(200) NULL;
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractions]') AND name = 'GeneratedBy')
        BEGIN
            ALTER TABLE dbo.SalesInteractions ADD GeneratedBy NVARCHAR(100) NULL;
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesInteractions]') AND name = 'GeneratedDate')
        BEGIN
            ALTER TABLE dbo.SalesInteractions ADD GeneratedDate DATETIME NULL;
        END
    END
    ELSE
    BEGIN
        PRINT 'IsSynthetic flag already exists in SalesInteractions table';
    END
END
ELSE
BEGIN
    PRINT 'SalesInteractions table does not exist. Please create it first.';
END

-- TranscriptChunks table update
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TranscriptChunks]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TranscriptChunks]') AND name = 'IsSynthetic')
    BEGIN
        PRINT 'Adding IsSynthetic flag to TranscriptChunks table';
        ALTER TABLE dbo.TranscriptChunks ADD IsSynthetic BIT NOT NULL DEFAULT(0);
        
        -- Add index for filtering
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TranscriptChunks_IsSynthetic' AND object_id = OBJECT_ID('dbo.TranscriptChunks'))
        BEGIN
            CREATE INDEX IX_TranscriptChunks_IsSynthetic ON dbo.TranscriptChunks(IsSynthetic);
        END
        
        -- Add metadata columns for tracking fabrication source
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TranscriptChunks]') AND name = 'GeneratedBy')
        BEGIN
            ALTER TABLE dbo.TranscriptChunks ADD GeneratedBy NVARCHAR(100) NULL;
        END
    END
    ELSE
    BEGIN
        PRINT 'IsSynthetic flag already exists in TranscriptChunks table';
    END
END
ELSE
BEGIN
    PRINT 'TranscriptChunks table does not exist. Please create it first.';
END

-- VisionDetections table update
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VisionDetections]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[VisionDetections]') AND name = 'IsSynthetic')
    BEGIN
        PRINT 'Adding IsSynthetic flag to VisionDetections table';
        ALTER TABLE dbo.VisionDetections ADD IsSynthetic BIT NOT NULL DEFAULT(0);
        
        -- Add index for filtering
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VisionDetections_IsSynthetic' AND object_id = OBJECT_ID('dbo.VisionDetections'))
        BEGIN
            CREATE INDEX IX_VisionDetections_IsSynthetic ON dbo.VisionDetections(IsSynthetic);
        END
        
        -- Add metadata columns for tracking fabrication source
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[VisionDetections]') AND name = 'GeneratedBy')
        BEGIN
            ALTER TABLE dbo.VisionDetections ADD GeneratedBy NVARCHAR(100) NULL;
        END
    END
    ELSE
    BEGIN
        PRINT 'IsSynthetic flag already exists in VisionDetections table';
    END
END
ELSE
BEGIN
    PRINT 'VisionDetections table does not exist. Please create it first.';
END

-- Brands table update
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Brands]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Brands]') AND name = 'IsSynthetic')
    BEGIN
        PRINT 'Adding IsSynthetic flag to Brands table';
        ALTER TABLE dbo.Brands ADD IsSynthetic BIT NOT NULL DEFAULT(0);
    END
    ELSE
    BEGIN
        PRINT 'IsSynthetic flag already exists in Brands table';
    END
END
ELSE
BEGIN
    PRINT 'Brands table does not exist. Please create it first.';
END

-- Stores table update
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'IsSynthetic')
    BEGIN
        PRINT 'Adding IsSynthetic flag to Stores table';
        ALTER TABLE dbo.Stores ADD IsSynthetic BIT NOT NULL DEFAULT(0);
        
        -- Add index for filtering
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stores_IsSynthetic' AND object_id = OBJECT_ID('dbo.Stores'))
        BEGIN
            CREATE INDEX IX_Stores_IsSynthetic ON dbo.Stores(IsSynthetic);
        END
    END
    ELSE
    BEGIN
        PRINT 'IsSynthetic flag already exists in Stores table';
    END
END
ELSE
BEGIN
    PRINT 'Stores table does not exist. Please create it first.';
END

-- Customers table update
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'IsSynthetic')
    BEGIN
        PRINT 'Adding IsSynthetic flag to Customers table';
        ALTER TABLE dbo.Customers ADD IsSynthetic BIT NOT NULL DEFAULT(0);
        
        -- Add index for filtering
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_IsSynthetic' AND object_id = OBJECT_ID('dbo.Customers'))
        BEGIN
            CREATE INDEX IX_Customers_IsSynthetic ON dbo.Customers(IsSynthetic);
        END
    END
    ELSE
    BEGIN
        PRINT 'IsSynthetic flag already exists in Customers table';
    END
END
ELSE
BEGIN
    PRINT 'Customers table does not exist. Please create it first.';
END

-- ============================================================================
-- SECTION 2: Create or update trigger for maintaining synthetic data integrity
-- ============================================================================
IF OBJECT_ID('dbo.TR_SalesInteractions_SyntheticTracking', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_SalesInteractions_SyntheticTracking;
GO

CREATE TRIGGER dbo.TR_SalesInteractions_SyntheticTracking
ON dbo.SalesInteractions
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Ensure synthetic status is propagated to related tables
    -- This keeps the IsSynthetic flag consistent across the system
    
    -- Update TranscriptChunks
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TranscriptChunks]') AND type in (N'U'))
    BEGIN
        UPDATE tc
        SET tc.IsSynthetic = i.IsSynthetic,
            tc.GeneratedBy = i.GeneratedBy
        FROM dbo.TranscriptChunks tc
        INNER JOIN inserted i ON tc.InteractionID = i.InteractionID
        WHERE tc.IsSynthetic <> i.IsSynthetic;
    END
    
    -- Update VisionDetections
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VisionDetections]') AND type in (N'U'))
    BEGIN
        UPDATE vd
        SET vd.IsSynthetic = i.IsSynthetic,
            vd.GeneratedBy = i.GeneratedBy
        FROM dbo.VisionDetections vd
        INNER JOIN inserted i ON vd.InteractionID = i.InteractionID
        WHERE vd.IsSynthetic <> i.IsSynthetic;
    END
END;
GO

-- ============================================================================
-- SECTION 3: Create views for synthetic data visualization
-- ============================================================================
IF OBJECT_ID('dbo.vw_SyntheticDataSummary', 'V') IS NOT NULL
    DROP VIEW dbo.vw_SyntheticDataSummary;
GO

CREATE VIEW dbo.vw_SyntheticDataSummary AS
SELECT
    'SalesInteractions' AS TableName,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) AS SyntheticRecords,
    CAST(SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10,2)) AS SyntheticPercentage,
    MIN(CASE WHEN IsSynthetic = 1 THEN GeneratedDate ELSE NULL END) AS OldestSyntheticDate,
    MAX(CASE WHEN IsSynthetic = 1 THEN GeneratedDate ELSE NULL END) AS NewestSyntheticDate
FROM 
    dbo.SalesInteractions
    
UNION ALL

SELECT
    'TranscriptChunks' AS TableName,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) AS SyntheticRecords,
    CAST(SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10,2)) AS SyntheticPercentage,
    NULL AS OldestSyntheticDate,
    NULL AS NewestSyntheticDate
FROM 
    dbo.TranscriptChunks
    
UNION ALL

SELECT
    'VisionDetections' AS TableName,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) AS SyntheticRecords,
    CAST(SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10,2)) AS SyntheticPercentage,
    NULL AS OldestSyntheticDate,
    NULL AS NewestSyntheticDate
FROM 
    dbo.VisionDetections
    
UNION ALL

SELECT
    'Stores' AS TableName,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) AS SyntheticRecords,
    CAST(SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10,2)) AS SyntheticPercentage,
    NULL AS OldestSyntheticDate,
    NULL AS NewestSyntheticDate
FROM 
    dbo.Stores;
GO

-- ============================================================================
-- SECTION 4: Create stored procedure for synthetic data management
-- ============================================================================
IF OBJECT_ID('dbo.sp_ManageSyntheticData', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ManageSyntheticData;
GO

CREATE PROCEDURE dbo.sp_ManageSyntheticData
    @Action NVARCHAR(50),           -- 'Mark', 'Clear', 'Report'
    @TableName NVARCHAR(100) = NULL,
    @Criteria NVARCHAR(MAX) = NULL, -- Optional WHERE clause
    @GeneratedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'Mark' AND @TableName IS NOT NULL
    BEGIN
        DECLARE @SqlMark NVARCHAR(MAX);
        
        SET @SqlMark = N'UPDATE ' + QUOTENAME(@TableName) + 
                       N' SET IsSynthetic = 1, 
                            GeneratedBy = @GeneratedBy,
                            GeneratedDate = GETDATE()' +
                       CASE WHEN @Criteria IS NOT NULL THEN N' WHERE ' + @Criteria ELSE N'' END;
        
        EXEC sp_executesql @SqlMark, N'@GeneratedBy NVARCHAR(100)', @GeneratedBy;
        
        PRINT 'Marked records as synthetic in ' + @TableName;
    END
    ELSE IF @Action = 'Clear' AND @TableName IS NOT NULL
    BEGIN
        DECLARE @SqlClear NVARCHAR(MAX);
        
        SET @SqlClear = N'UPDATE ' + QUOTENAME(@TableName) + 
                        N' SET IsSynthetic = 0, 
                             GeneratedBy = NULL,
                             GeneratedDate = NULL' +
                        CASE WHEN @Criteria IS NOT NULL THEN N' WHERE ' + @Criteria ELSE N'' END;
        
        EXEC sp_executesql @SqlClear;
        
        PRINT 'Cleared synthetic flags in ' + @TableName;
    END
    ELSE IF @Action = 'Report'
    BEGIN
        SELECT * FROM dbo.vw_SyntheticDataSummary;
    END
    ELSE
    BEGIN
        PRINT 'Invalid action or missing parameters.';
        PRINT 'Valid actions: Mark, Clear, Report';
        PRINT 'Example: EXEC sp_ManageSyntheticData @Action = ''Mark'', @TableName = ''SalesInteractions'', @Criteria = ''InteractionID LIKE ''''SIM-%'''''', @GeneratedBy = ''Pulser 2.2.2''';
    END
END;
GO

-- ============================================================================
-- SECTION 5: Add ID Prefix Convention Support
-- ============================================================================
-- This function helps check if an ID follows the SIM-/REAL- prefix convention
IF OBJECT_ID('dbo.fn_IsSyntheticID', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_IsSyntheticID;
GO

CREATE FUNCTION dbo.fn_IsSyntheticID(@ID NVARCHAR(100))
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 0;
    
    -- Check if ID starts with 'SIM-' prefix
    IF @ID LIKE 'SIM-%'
        SET @Result = 1;
    
    RETURN @Result;
END;
GO

-- ============================================================================
-- SECTION 6: Create DB trigger for enforcing synthetic ID convention
-- ============================================================================
IF OBJECT_ID('dbo.TR_EnforceSyntheticIDConvention', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_EnforceSyntheticIDConvention;
GO

CREATE TRIGGER dbo.TR_EnforceSyntheticIDConvention
ON dbo.SalesInteractions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for IDs that should be marked as synthetic based on prefix
    UPDATE si
    SET si.IsSynthetic = 1,
        si.GeneratedDate = COALESCE(si.GeneratedDate, GETDATE())
    FROM dbo.SalesInteractions si
    INNER JOIN inserted i ON si.InteractionID = i.InteractionID
    WHERE dbo.fn_IsSyntheticID(si.InteractionID) = 1 
      AND (si.IsSynthetic = 0 OR si.IsSynthetic IS NULL);
      
    -- Check for real IDs incorrectly marked as synthetic
    UPDATE si
    SET si.IsSynthetic = 0,
        si.GeneratedDate = NULL,
        si.GeneratedBy = NULL,
        si.FabricationMethod = NULL
    FROM dbo.SalesInteractions si
    INNER JOIN inserted i ON si.InteractionID = i.InteractionID
    WHERE si.InteractionID LIKE 'REAL-%' 
      AND si.IsSynthetic = 1;
END;
GO

-- ============================================================================
-- SECTION 7: Integration with Dashboard UI
-- ============================================================================
-- Create view for dashboard consumption to power the toggle button (F2)
IF OBJECT_ID('dbo.vw_DashboardDataSources', 'V') IS NOT NULL
    DROP VIEW dbo.vw_DashboardDataSources;
GO

CREATE VIEW dbo.vw_DashboardDataSources AS
WITH SyntheticStats AS (
    SELECT 
        CASE 
            WHEN SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) > 0 THEN 1
            ELSE 0
        END AS HasSyntheticData,
        SUM(CASE WHEN IsSynthetic = 0 THEN 1 ELSE 0 END) AS RealRecordCount,
        SUM(CASE WHEN IsSynthetic = 1 THEN 1 ELSE 0 END) AS SyntheticRecordCount
    FROM 
        dbo.SalesInteractions
)
SELECT 
    'real' AS SourceKey,
    'Production Data' AS SourceName,
    'Real store transactions from edge devices' AS Description,
    RealRecordCount AS RecordCount,
    GETDATE() AS LastRefreshTime,
    1 AS IsAvailable
FROM 
    SyntheticStats
WHERE 
    RealRecordCount > 0

UNION ALL

SELECT 
    'simulation' AS SourceKey,
    'Simulated Data' AS SourceName,
    'Generated test data with synthetic interactions' AS Description,
    SyntheticRecordCount AS RecordCount,
    GETDATE() AS LastRefreshTime,
    CASE WHEN HasSyntheticData = 1 THEN 1 ELSE 0 END AS IsAvailable
FROM 
    SyntheticStats
WHERE 
    HasSyntheticData = 1;
GO

-- ============================================================================
-- SECTION 8: Output summary and instructions
-- ============================================================================
PRINT '--------------------------------------------------------';
PRINT '   SYNTHETIC DATA TRACKING SCHEMA UPDATES COMPLETE      ';
PRINT '--------------------------------------------------------';
PRINT '';
PRINT 'The following operations were performed:';
PRINT '1. Added IsSynthetic flag to core tables';
PRINT '2. Added fabrication metadata fields';
PRINT '3. Created triggers for synthetic data integrity';
PRINT '4. Created views for synthetic data reporting';
PRINT '5. Added support for SIM-/REAL- ID prefixes';
PRINT '6. Created management stored procedure';
PRINT '7. Added dashboard UI integration view';
PRINT '';
PRINT 'To manage synthetic data:';
PRINT 'EXEC sp_ManageSyntheticData @Action = ''Report'';';
PRINT 'EXEC sp_ManageSyntheticData @Action = ''Mark'', @TableName = ''SalesInteractions'', @Criteria = ''InteractionID LIKE ''''SIM-%'''''', @GeneratedBy = ''Pulser 2.2.2'';';
PRINT 'EXEC sp_ManageSyntheticData @Action = ''Clear'', @TableName = ''SalesInteractions'', @Criteria = ''GeneratedDate < DATEADD(month, -3, GETDATE())'';';
PRINT '';
PRINT 'For dashboard data source toggle (F2):';
PRINT 'SELECT * FROM vw_DashboardDataSources;';
PRINT '';
PRINT 'Remember to prefix synthetic IDs with SIM- (ex: SIM-2025-12345)';
PRINT 'and production IDs with REAL- (ex: REAL-2025-67890)';
PRINT '--------------------------------------------------------';