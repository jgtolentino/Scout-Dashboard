-- AI Insights Schema Migration for Client360 Dashboard
-- This script creates or updates the AI insights tables for the Client360 Dashboard

-- Create schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA dbo')
END
GO

-- Create AIInsights table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AIInsights' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.AIInsights (
        InsightID NVARCHAR(50) NOT NULL PRIMARY KEY,
        InsightType NVARCHAR(50) NOT NULL,
        GeneratedAt DATETIME2 NOT NULL,
        Model NVARCHAR(100) NOT NULL,
        IsSynthetic BIT NOT NULL DEFAULT 0,
        StoreID NVARCHAR(50) NULL,
        BrandID NVARCHAR(50) NULL,
        CategoryID NVARCHAR(50) NULL,
        RegionID NVARCHAR(50) NULL,
        Content NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        ExpiresAt DATETIME2 NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        TokensUsed INT NULL,
        GenerationLatencyMs INT NULL,
        Version INT NOT NULL DEFAULT 1,
        Tags NVARCHAR(MAX) NULL,
        UserFeedback NVARCHAR(MAX) NULL
    )
END
ELSE
BEGIN
    -- Add any missing columns to the existing table
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'TokensUsed' AND object_id = OBJECT_ID('dbo.AIInsights'))
    BEGIN
        ALTER TABLE dbo.AIInsights ADD TokensUsed INT NULL
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'GenerationLatencyMs' AND object_id = OBJECT_ID('dbo.AIInsights'))
    BEGIN
        ALTER TABLE dbo.AIInsights ADD GenerationLatencyMs INT NULL
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'Tags' AND object_id = OBJECT_ID('dbo.AIInsights'))
    BEGIN
        ALTER TABLE dbo.AIInsights ADD Tags NVARCHAR(MAX) NULL
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'UserFeedback' AND object_id = OBJECT_ID('dbo.AIInsights'))
    BEGIN
        ALTER TABLE dbo.AIInsights ADD UserFeedback NVARCHAR(MAX) NULL
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'ExpiresAt' AND object_id = OBJECT_ID('dbo.AIInsights'))
    BEGIN
        ALTER TABLE dbo.AIInsights ADD ExpiresAt DATETIME2 NULL
    END
END
GO

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AIInsights_InsightType' AND object_id = OBJECT_ID('dbo.AIInsights'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AIInsights_InsightType ON dbo.AIInsights(InsightType)
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AIInsights_StoreID' AND object_id = OBJECT_ID('dbo.AIInsights'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AIInsights_StoreID ON dbo.AIInsights(StoreID) WHERE StoreID IS NOT NULL
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AIInsights_BrandID' AND object_id = OBJECT_ID('dbo.AIInsights'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AIInsights_BrandID ON dbo.AIInsights(BrandID) WHERE BrandID IS NOT NULL
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AIInsights_GeneratedAt' AND object_id = OBJECT_ID('dbo.AIInsights'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AIInsights_GeneratedAt ON dbo.AIInsights(GeneratedAt)
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AIInsights_IsSynthetic' AND object_id = OBJECT_ID('dbo.AIInsights'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AIInsights_IsSynthetic ON dbo.AIInsights(IsSynthetic)
END
GO

-- Create a view for active insights
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ActiveInsights')
BEGIN
    DROP VIEW dbo.vw_ActiveInsights
END
GO

CREATE VIEW dbo.vw_ActiveInsights
AS
SELECT 
    i.InsightID,
    i.InsightType,
    i.GeneratedAt,
    i.Model,
    i.IsSynthetic,
    i.StoreID,
    i.BrandID,
    i.CategoryID,
    i.RegionID,
    i.Content,
    i.CreatedAt,
    i.UpdatedAt,
    i.TokensUsed,
    i.Tags,
    s.StoreName,
    s.Region,
    s.CityMunicipality,
    s.Barangay
FROM 
    dbo.AIInsights i
LEFT JOIN 
    dbo.Stores s ON i.StoreID = s.StoreID
WHERE 
    i.IsActive = 1
    AND (i.ExpiresAt IS NULL OR i.ExpiresAt > GETUTCDATE())
GO

-- Create a stored procedure for getting insights
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetInsights')
BEGIN
    DROP PROCEDURE dbo.sp_GetInsights
END
GO

CREATE PROCEDURE dbo.sp_GetInsights
    @InsightType NVARCHAR(50) = NULL,
    @StoreID NVARCHAR(50) = NULL,
    @BrandID NVARCHAR(50) = NULL,
    @RegionID NVARCHAR(50) = NULL,
    @IncludeSynthetic BIT = 0,
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @Limit INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        i.InsightID,
        i.InsightType,
        i.GeneratedAt,
        i.Model,
        i.IsSynthetic,
        i.StoreID,
        i.BrandID,
        i.CategoryID,
        i.RegionID,
        i.Content,
        i.CreatedAt,
        i.Tags
    FROM 
        dbo.AIInsights i
    WHERE 
        i.IsActive = 1
        AND (i.ExpiresAt IS NULL OR i.ExpiresAt > GETUTCDATE())
        AND (@InsightType IS NULL OR i.InsightType = @InsightType)
        AND (@StoreID IS NULL OR i.StoreID = @StoreID)
        AND (@BrandID IS NULL OR i.BrandID = @BrandID)
        AND (@RegionID IS NULL OR i.RegionID = @RegionID)
        AND (@IncludeSynthetic = 1 OR i.IsSynthetic = 0)
        AND (@StartDate IS NULL OR i.GeneratedAt >= @StartDate)
        AND (@EndDate IS NULL OR i.GeneratedAt <= @EndDate)
    ORDER BY 
        i.GeneratedAt DESC;
END
GO

-- Create a stored procedure for recording user feedback
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecordInsightFeedback')
BEGIN
    DROP PROCEDURE dbo.sp_RecordInsightFeedback
END
GO

CREATE PROCEDURE dbo.sp_RecordInsightFeedback
    @InsightID NVARCHAR(50),
    @Feedback NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.AIInsights
    SET 
        UserFeedback = @Feedback,
        UpdatedAt = GETUTCDATE()
    WHERE 
        InsightID = @InsightID;
    
    SELECT @@ROWCOUNT AS RecordsUpdated;
END
GO

-- Create a stored procedure for generating AI insights data directly to the database
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GenerateAIInsights')
BEGIN
    DROP PROCEDURE dbo.sp_GenerateAIInsights
END
GO

CREATE PROCEDURE dbo.sp_GenerateAIInsights
    @InsightType NVARCHAR(50),
    @ParametersJSON NVARCHAR(MAX),
    @Debug BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- This is a stub procedure that will be used by the 
    -- Azure Function that generates insights
    -- For security reasons, the actual insight generation logic
    -- is implemented in the Azure Function
    
    DECLARE @ResultCount INT = 0;
    
    IF @Debug = 1
    BEGIN
        SELECT 
            @InsightType AS RequestedInsightType,
            @ParametersJSON AS Parameters,
            'This is a stub implementation. In production, this would call an Azure Function.' AS Message
    END
    
    SELECT @ResultCount AS InsightsGenerated;
END
GO

-- Create a stored procedure for expiring old insights
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ExpireOldInsights')
BEGIN
    DROP PROCEDURE dbo.sp_ExpireOldInsights
END
GO

CREATE PROCEDURE dbo.sp_ExpireOldInsights
    @DaysToKeep INT = 90
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CutoffDate DATETIME2 = DATEADD(DAY, -@DaysToKeep, GETUTCDATE());
    
    UPDATE dbo.AIInsights
    SET 
        IsActive = 0,
        UpdatedAt = GETUTCDATE()
    WHERE 
        GeneratedAt < @CutoffDate
        AND IsActive = 1;
    
    SELECT @@ROWCOUNT AS RecordsUpdated;
END
GO

-- Create a trigger to automatically update the UpdatedAt column
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_AIInsights_UpdatedAt')
BEGIN
    DROP TRIGGER dbo.tr_AIInsights_UpdatedAt
END
GO

CREATE TRIGGER dbo.tr_AIInsights_UpdatedAt
ON dbo.AIInsights
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT UPDATE(UpdatedAt)
    BEGIN
        UPDATE dbo.AIInsights
        SET UpdatedAt = GETUTCDATE()
        FROM dbo.AIInsights t
        INNER JOIN inserted i ON t.InsightID = i.InsightID;
    END
END
GO

-- Create a function to check if insight is synthetic
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_IsInsightSynthetic')
BEGIN
    DROP FUNCTION dbo.fn_IsInsightSynthetic
END
GO

CREATE FUNCTION dbo.fn_IsInsightSynthetic 
(
    @InsightID NVARCHAR(50)
)
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 0;
    
    -- Check if the ID starts with the synthetic prefix
    IF @InsightID LIKE 'SIM-%'
    BEGIN
        SET @Result = 1;
    END
    ELSE
    BEGIN
        -- Check if it's explicitly marked as synthetic in the table
        SELECT @Result = IsSynthetic
        FROM dbo.AIInsights
        WHERE InsightID = @InsightID;
    END
    
    RETURN @Result;
END
GO

-- Create a helper view to extract properties from the Content JSON field
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InsightProperties')
BEGIN
    DROP VIEW dbo.vw_InsightProperties
END
GO

CREATE VIEW dbo.vw_InsightProperties
AS
SELECT 
    InsightID,
    InsightType,
    GeneratedAt,
    StoreID,
    BrandID,
    IsSynthetic,
    JSON_VALUE(Content, '$.title') AS Title,
    JSON_VALUE(Content, '$.summary') AS Summary,
    JSON_VALUE(Content, '$.confidence') AS Confidence,
    JSON_VALUE(Content, '$.timeframe') AS Timeframe,
    JSON_QUERY(Content, '$.tags') AS TagsJSON,
    JSON_QUERY(Content, '$.data') AS DataJSON,
    JSON_QUERY(Content, '$.recommendations') AS RecommendationsJSON
FROM 
    dbo.AIInsights
GO

-- Create a sample insights report for dashboard display
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InsightsDashboard')
BEGIN
    DROP VIEW dbo.vw_InsightsDashboard
END
GO

CREATE VIEW dbo.vw_InsightsDashboard
AS
SELECT TOP 1000
    i.InsightID,
    i.InsightType,
    i.GeneratedAt,
    i.StoreID,
    s.StoreName,
    s.Region,
    s.CityMunicipality,
    s.Barangay,
    p.Title,
    p.Summary,
    p.Confidence,
    p.Timeframe,
    CASE WHEN i.IsSynthetic = 1 THEN 'Synthetic' ELSE 'Real' END AS DataSource,
    i.Model
FROM 
    dbo.AIInsights i
INNER JOIN 
    dbo.vw_InsightProperties p ON i.InsightID = p.InsightID
LEFT JOIN 
    dbo.Stores s ON i.StoreID = s.StoreID
WHERE 
    i.IsActive = 1
ORDER BY 
    i.GeneratedAt DESC
GO

-- Print completion message
PRINT 'AI Insights schema migration completed successfully.'
GO