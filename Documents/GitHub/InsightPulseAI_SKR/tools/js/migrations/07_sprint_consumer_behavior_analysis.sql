-- =====================================================
-- Consumer Behavior Analysis Migration
-- File: 07_sprint_consumer_behavior_analysis.sql
-- Purpose: Add consumer behavior tracking and analysis capabilities
-- Version: 1.0
-- =====================================================

USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

PRINT '========================================================';
PRINT 'CONSUMER BEHAVIOR ANALYSIS MIGRATION';
PRINT 'Execution started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================================';

-- =====================================================
-- Step 1: Extend TransactionItems for Consumer Behavior
-- =====================================================

PRINT 'Extending TransactionItems with consumer behavior columns...';

-- Add RequestGroup column for grouping related requests
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TransactionItems') AND name = 'RequestGroup')
BEGIN
    ALTER TABLE dbo.TransactionItems ADD RequestGroup NVARCHAR(50) NULL;
    PRINT 'Added RequestGroup column to TransactionItems';
END
ELSE
    PRINT 'RequestGroup column already exists in TransactionItems';

-- Add SuggestionAccepted column for tracking acceptance of AI/system suggestions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TransactionItems') AND name = 'SuggestionAccepted')
BEGIN
    ALTER TABLE dbo.TransactionItems ADD SuggestionAccepted BIT NULL;
    PRINT 'Added SuggestionAccepted column to TransactionItems';
END
ELSE
    PRINT 'SuggestionAccepted column already exists in TransactionItems';

-- =====================================================
-- Step 2: Create Consumer Profile Dimension Table
-- =====================================================

PRINT 'Creating ConsumerProfile dimension table...';

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ConsumerProfile')
BEGIN
    CREATE TABLE dbo.ConsumerProfile (
        ConsumerID INT IDENTITY(1,1) PRIMARY KEY,
        Gender NVARCHAR(10) NULL,
        AgeBracket NVARCHAR(20) NULL,
        PreferredCategories NVARCHAR(500) NULL,
        AvgSessionDuration INT NULL, -- in seconds
        TotalTransactions INT DEFAULT 0,
        SuggestionAcceptanceRate DECIMAL(5,2) NULL,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        LastUpdated DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created ConsumerProfile table';
END
ELSE
    PRINT 'ConsumerProfile table already exists';

-- =====================================================
-- Step 3: Create Consumer Behavior Fact Table
-- =====================================================

PRINT 'Creating ConsumerBehaviorFact table...';

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ConsumerBehaviorFact')
BEGIN
    CREATE TABLE dbo.ConsumerBehaviorFact (
        BehaviorID INT IDENTITY(1,1) PRIMARY KEY,
        ConsumerID INT NULL,
        SessionID NVARCHAR(100) NULL,
        InteractionDate DATETIME2 DEFAULT GETDATE(),
        RequestGroup NVARCHAR(50) NULL,
        RequestType NVARCHAR(30) NULL, -- 'product_search', 'category_browse', 'suggestion_request'
        SuggestionOffered BIT DEFAULT 0,
        SuggestionAccepted BIT NULL,
        ResponseTime INT NULL, -- in milliseconds
        SentimentScore DECIMAL(3,2) NULL, -- -1.0 to 1.0
        StoreID INT NULL,
        
        FOREIGN KEY (ConsumerID) REFERENCES dbo.ConsumerProfile(ConsumerID),
        FOREIGN KEY (StoreID) REFERENCES dbo.Stores(StoreID)
    );
    
    PRINT 'Created ConsumerBehaviorFact table';
END
ELSE
    PRINT 'ConsumerBehaviorFact table already exists';

-- =====================================================
-- Step 4: Create Indexes for Performance
-- =====================================================

PRINT 'Creating performance indexes...';

-- Index for ConsumerProfile lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsumerProfile_Gender_AgeBracket')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ConsumerProfile_Gender_AgeBracket 
    ON dbo.ConsumerProfile (Gender, AgeBracket);
    PRINT 'Created IX_ConsumerProfile_Gender_AgeBracket index';
END

-- Index for ConsumerBehaviorFact queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsumerBehaviorFact_DateConsumer')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ConsumerBehaviorFact_DateConsumer 
    ON dbo.ConsumerBehaviorFact (InteractionDate, ConsumerID);
    PRINT 'Created IX_ConsumerBehaviorFact_DateConsumer index';
END

-- Index for RequestGroup analysis
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsumerBehaviorFact_RequestGroup')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ConsumerBehaviorFact_RequestGroup 
    ON dbo.ConsumerBehaviorFact (RequestGroup, InteractionDate);
    PRINT 'Created IX_ConsumerBehaviorFact_RequestGroup index';
END

-- =====================================================
-- Step 5: Create Analytical Views
-- =====================================================

PRINT 'Creating analytical views...';

-- View 1: Request Patterns Analysis
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_RequestPatternsAnalysis')
BEGIN
    DROP VIEW dbo.v_RequestPatternsAnalysis;
    PRINT 'Dropped existing v_RequestPatternsAnalysis view';
END

CREATE VIEW dbo.v_RequestPatternsAnalysis AS
SELECT 
    cp.Gender,
    cp.AgeBracket,
    cbf.RequestGroup,
    cbf.RequestType,
    COUNT(*) as RequestCount,
    AVG(CAST(cbf.ResponseTime AS FLOAT)) as AvgResponseTime,
    AVG(CAST(cbf.SentimentScore AS FLOAT)) as AvgSentiment,
    CAST(cbf.InteractionDate AS DATE) as InteractionDate,
    DATEPART(HOUR, cbf.InteractionDate) as HourOfDay,
    DATENAME(WEEKDAY, cbf.InteractionDate) as DayOfWeek
FROM dbo.ConsumerBehaviorFact cbf
    LEFT JOIN dbo.ConsumerProfile cp ON cbf.ConsumerID = cp.ConsumerID
WHERE cbf.InteractionDate >= DATEADD(DAY, -30, GETDATE())
GROUP BY 
    cp.Gender, cp.AgeBracket, cbf.RequestGroup, cbf.RequestType,
    CAST(cbf.InteractionDate AS DATE), 
    DATEPART(HOUR, cbf.InteractionDate),
    DATENAME(WEEKDAY, cbf.InteractionDate);

PRINT 'Created v_RequestPatternsAnalysis view';

-- View 2: Suggestion Acceptance Analysis
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_SuggestionAcceptanceAnalysis')
BEGIN
    DROP VIEW dbo.v_SuggestionAcceptanceAnalysis;
    PRINT 'Dropped existing v_SuggestionAcceptanceAnalysis view';
END

CREATE VIEW dbo.v_SuggestionAcceptanceAnalysis AS
SELECT 
    cp.Gender,
    cp.AgeBracket,
    cbf.RequestGroup,
    COUNT(CASE WHEN cbf.SuggestionOffered = 1 THEN 1 END) as SuggestionsOffered,
    COUNT(CASE WHEN cbf.SuggestionAccepted = 1 THEN 1 END) as SuggestionsAccepted,
    CASE 
        WHEN COUNT(CASE WHEN cbf.SuggestionOffered = 1 THEN 1 END) > 0 
        THEN CAST(COUNT(CASE WHEN cbf.SuggestionAccepted = 1 THEN 1 END) AS FLOAT) / 
             CAST(COUNT(CASE WHEN cbf.SuggestionOffered = 1 THEN 1 END) AS FLOAT) * 100
        ELSE 0 
    END as AcceptanceRate,
    AVG(CAST(cbf.SentimentScore AS FLOAT)) as AvgSentimentWhenSuggested,
    CAST(cbf.InteractionDate AS DATE) as InteractionDate
FROM dbo.ConsumerBehaviorFact cbf
    LEFT JOIN dbo.ConsumerProfile cp ON cbf.ConsumerID = cp.ConsumerID
WHERE cbf.InteractionDate >= DATEADD(DAY, -30, GETDATE())
    AND cbf.SuggestionOffered = 1
GROUP BY 
    cp.Gender, cp.AgeBracket, cbf.RequestGroup,
    CAST(cbf.InteractionDate AS DATE);

PRINT 'Created v_SuggestionAcceptanceAnalysis view';

-- View 3: Sentiment Trend Analysis
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_SentimentTrendAnalysis')
BEGIN
    DROP VIEW dbo.v_SentimentTrendAnalysis;
    PRINT 'Dropped existing v_SentimentTrendAnalysis view';
END

CREATE VIEW dbo.v_SentimentTrendAnalysis AS
SELECT 
    cp.Gender,
    cp.AgeBracket,
    cbf.RequestGroup,
    CAST(cbf.InteractionDate AS DATE) as InteractionDate,
    DATEPART(HOUR, cbf.InteractionDate) as HourOfDay,
    AVG(CAST(cbf.SentimentScore AS FLOAT)) as AvgSentiment,
    COUNT(*) as InteractionCount,
    COUNT(CASE WHEN cbf.SentimentScore > 0.3 THEN 1 END) as PositiveInteractions,
    COUNT(CASE WHEN cbf.SentimentScore BETWEEN -0.3 AND 0.3 THEN 1 END) as NeutralInteractions,
    COUNT(CASE WHEN cbf.SentimentScore < -0.3 THEN 1 END) as NegativeInteractions,
    CASE 
        WHEN COUNT(*) > 0 
        THEN CAST(COUNT(CASE WHEN cbf.SentimentScore > 0.3 THEN 1 END) AS FLOAT) / 
             CAST(COUNT(*) AS FLOAT) * 100
        ELSE 0 
    END as PositivePercentage
FROM dbo.ConsumerBehaviorFact cbf
    LEFT JOIN dbo.ConsumerProfile cp ON cbf.ConsumerID = cp.ConsumerID
WHERE cbf.InteractionDate >= DATEADD(DAY, -30, GETDATE())
    AND cbf.SentimentScore IS NOT NULL
GROUP BY 
    cp.Gender, cp.AgeBracket, cbf.RequestGroup,
    CAST(cbf.InteractionDate AS DATE),
    DATEPART(HOUR, cbf.InteractionDate);

PRINT 'Created v_SentimentTrendAnalysis view';

-- =====================================================
-- Step 6: Create Stored Procedures
-- =====================================================

PRINT 'Creating stored procedures...';

-- Stored Procedure 1: Get Request Patterns
IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'sp_GetRequestPatterns')
BEGIN
    DROP PROCEDURE dbo.sp_GetRequestPatterns;
    PRINT 'Dropped existing sp_GetRequestPatterns procedure';
END

CREATE PROCEDURE dbo.sp_GetRequestPatterns
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @Gender NVARCHAR(10) = NULL,
    @AgeBracket NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to last 7 days if no dates provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -7, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    SELECT 
        Gender,
        AgeBracket,
        RequestGroup,
        RequestType,
        SUM(RequestCount) as TotalRequests,
        AVG(AvgResponseTime) as AvgResponseTime,
        AVG(AvgSentiment) as AvgSentiment,
        InteractionDate,
        HourOfDay,
        DayOfWeek
    FROM dbo.v_RequestPatternsAnalysis
    WHERE InteractionDate BETWEEN CAST(@StartDate AS DATE) AND CAST(@EndDate AS DATE)
        AND (@Gender IS NULL OR Gender = @Gender)
        AND (@AgeBracket IS NULL OR AgeBracket = @AgeBracket)
    GROUP BY Gender, AgeBracket, RequestGroup, RequestType, InteractionDate, HourOfDay, DayOfWeek
    ORDER BY InteractionDate DESC, HourOfDay;
END

PRINT 'Created sp_GetRequestPatterns procedure';

-- Stored Procedure 2: Get Suggestion Acceptance
IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'sp_GetSuggestionAcceptance')
BEGIN
    DROP PROCEDURE dbo.sp_GetSuggestionAcceptance;
    PRINT 'Dropped existing sp_GetSuggestionAcceptance procedure';
END

CREATE PROCEDURE dbo.sp_GetSuggestionAcceptance
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @Gender NVARCHAR(10) = NULL,
    @AgeBracket NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to last 7 days if no dates provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -7, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    SELECT 
        Gender,
        AgeBracket,
        RequestGroup,
        SUM(SuggestionsOffered) as TotalSuggestionsOffered,
        SUM(SuggestionsAccepted) as TotalSuggestionsAccepted,
        AVG(AcceptanceRate) as AvgAcceptanceRate,
        AVG(AvgSentimentWhenSuggested) as AvgSentimentWhenSuggested,
        InteractionDate
    FROM dbo.v_SuggestionAcceptanceAnalysis
    WHERE InteractionDate BETWEEN CAST(@StartDate AS DATE) AND CAST(@EndDate AS DATE)
        AND (@Gender IS NULL OR Gender = @Gender)
        AND (@AgeBracket IS NULL OR AgeBracket = @AgeBracket)
    GROUP BY Gender, AgeBracket, RequestGroup, InteractionDate
    ORDER BY InteractionDate DESC;
END

PRINT 'Created sp_GetSuggestionAcceptance procedure';

-- Stored Procedure 3: Get Sentiment Trends
IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'sp_GetSentimentTrends')
BEGIN
    DROP PROCEDURE dbo.sp_GetSentimentTrends;
    PRINT 'Dropped existing sp_GetSentimentTrends procedure';
END

CREATE PROCEDURE dbo.sp_GetSentimentTrends
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @Gender NVARCHAR(10) = NULL,
    @AgeBracket NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to last 7 days if no dates provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -7, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    SELECT 
        Gender,
        AgeBracket,
        RequestGroup,
        InteractionDate,
        HourOfDay,
        AVG(AvgSentiment) as AvgSentiment,
        SUM(InteractionCount) as TotalInteractions,
        SUM(PositiveInteractions) as TotalPositiveInteractions,
        SUM(NeutralInteractions) as TotalNeutralInteractions,
        SUM(NegativeInteractions) as TotalNegativeInteractions,
        AVG(PositivePercentage) as AvgPositivePercentage
    FROM dbo.v_SentimentTrendAnalysis
    WHERE InteractionDate BETWEEN CAST(@StartDate AS DATE) AND CAST(@EndDate AS DATE)
        AND (@Gender IS NULL OR Gender = @Gender)
        AND (@AgeBracket IS NULL OR AgeBracket = @AgeBracket)
    GROUP BY Gender, AgeBracket, RequestGroup, InteractionDate, HourOfDay
    ORDER BY InteractionDate DESC, HourOfDay;
END

PRINT 'Created sp_GetSentimentTrends procedure';

-- =====================================================
-- Step 7: Populate Sample Data
-- =====================================================

PRINT 'Populating sample data...';

-- Insert sample consumer profiles
IF NOT EXISTS (SELECT 1 FROM dbo.ConsumerProfile)
BEGIN
    INSERT INTO dbo.ConsumerProfile (Gender, AgeBracket, PreferredCategories, AvgSessionDuration, TotalTransactions, SuggestionAcceptanceRate)
    VALUES 
        ('Male', '18-25', 'Electronics,Gaming,Sports', 450, 23, 68.5),
        ('Female', '26-35', 'Beauty,Fashion,Home', 380, 31, 72.3),
        ('Male', '36-45', 'Tools,Automotive,Electronics', 290, 18, 45.2),
        ('Female', '18-25', 'Fashion,Beauty,Entertainment', 520, 28, 81.7),
        ('Male', '26-35', 'Electronics,Sports,Gaming', 410, 25, 59.1),
        ('Female', '36-45', 'Home,Health,Beauty', 340, 22, 66.8),
        ('Male', '46-55', 'Tools,Automotive,Home', 250, 15, 38.9),
        ('Female', '46-55', 'Health,Home,Beauty', 320, 19, 55.4),
        ('Non-binary', '26-35', 'Books,Entertainment,Electronics', 480, 21, 74.6),
        ('Male', '18-25', 'Gaming,Electronics,Sports', 560, 35, 77.2);
    
    PRINT 'Inserted 10 sample consumer profiles';
END

-- Insert sample behavior data for the last 30 days
DECLARE @i INT = 1;
DECLARE @maxRecords INT = 200;
DECLARE @randomDate DATETIME2;
DECLARE @randomConsumerID INT;
DECLARE @requestGroups TABLE (GroupName NVARCHAR(50));
DECLARE @requestTypes TABLE (TypeName NVARCHAR(30));

INSERT INTO @requestGroups VALUES 
    ('product_discovery'), ('price_comparison'), ('category_browse'), 
    ('search_query'), ('recommendation_request'), ('availability_check');

INSERT INTO @requestTypes VALUES 
    ('product_search'), ('category_browse'), ('suggestion_request'), 
    ('price_inquiry'), ('availability_check'), ('comparison_request');

WHILE @i <= @maxRecords
BEGIN
    -- Random date within last 30 days
    SET @randomDate = DATEADD(MINUTE, 
        -ABS(CHECKSUM(NEWID()) % 43200), -- Random minutes in last 30 days
        GETDATE());
    
    -- Random consumer ID
    SET @randomConsumerID = (ABS(CHECKSUM(NEWID()) % 10) + 1);
    
    INSERT INTO dbo.ConsumerBehaviorFact 
    (ConsumerID, SessionID, InteractionDate, RequestGroup, RequestType, 
     SuggestionOffered, SuggestionAccepted, ResponseTime, SentimentScore, StoreID)
    VALUES (
        @randomConsumerID,
        'SESSION_' + CAST(@i AS NVARCHAR(10)) + '_' + FORMAT(@randomDate, 'yyyyMMdd'),
        @randomDate,
        (SELECT TOP 1 GroupName FROM @requestGroups ORDER BY NEWID()),
        (SELECT TOP 1 TypeName FROM @requestTypes ORDER BY NEWID()),
        CASE WHEN ABS(CHECKSUM(NEWID()) % 100) < 40 THEN 1 ELSE 0 END, -- 40% suggestion rate
        CASE WHEN ABS(CHECKSUM(NEWID()) % 100) < 65 THEN 1 ELSE 0 END, -- 65% acceptance when offered
        ABS(CHECKSUM(NEWID()) % 5000) + 200, -- Response time 200-5200ms
        CAST((ABS(CHECKSUM(NEWID()) % 200) - 100) AS FLOAT) / 100.0, -- Sentiment -1.0 to 1.0
        (ABS(CHECKSUM(NEWID()) % 5) + 1) -- StoreID 1-5
    );
    
    SET @i = @i + 1;
END

PRINT 'Inserted ' + CAST(@maxRecords AS NVARCHAR(10)) + ' sample behavior records';

-- =====================================================
-- Step 8: Update Statistics and Maintenance
-- =====================================================

PRINT 'Updating statistics...';

UPDATE STATISTICS dbo.ConsumerProfile;
UPDATE STATISTICS dbo.ConsumerBehaviorFact;
UPDATE STATISTICS dbo.TransactionItems;

PRINT 'Statistics updated successfully';

-- =====================================================
-- Step 9: Validation and Testing
-- =====================================================

PRINT 'Running validation tests...';

-- Test 1: Verify data integrity
DECLARE @profileCount INT = (SELECT COUNT(*) FROM dbo.ConsumerProfile);
DECLARE @behaviorCount INT = (SELECT COUNT(*) FROM dbo.ConsumerBehaviorFact);

PRINT 'Consumer profiles created: ' + CAST(@profileCount AS NVARCHAR(10));
PRINT 'Behavior records created: ' + CAST(@behaviorCount AS NVARCHAR(10));

-- Test 2: Verify views return data
DECLARE @requestPatternsCount INT = (SELECT COUNT(*) FROM dbo.v_RequestPatternsAnalysis);
DECLARE @suggestionCount INT = (SELECT COUNT(*) FROM dbo.v_SuggestionAcceptanceAnalysis);
DECLARE @sentimentCount INT = (SELECT COUNT(*) FROM dbo.v_SentimentTrendAnalysis);

PRINT 'Request patterns view records: ' + CAST(@requestPatternsCount AS NVARCHAR(10));
PRINT 'Suggestion acceptance view records: ' + CAST(@suggestionCount AS NVARCHAR(10));
PRINT 'Sentiment trends view records: ' + CAST(@sentimentCount AS NVARCHAR(10));

-- Test 3: Verify stored procedures work
BEGIN TRY
    EXEC dbo.sp_GetRequestPatterns @StartDate = '2025-05-01', @EndDate = '2025-05-31';
    PRINT 'sp_GetRequestPatterns: PASSED';
END TRY
BEGIN CATCH
    PRINT 'sp_GetRequestPatterns: FAILED - ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    EXEC dbo.sp_GetSuggestionAcceptance @StartDate = '2025-05-01', @EndDate = '2025-05-31';
    PRINT 'sp_GetSuggestionAcceptance: PASSED';
END TRY
BEGIN CATCH
    PRINT 'sp_GetSuggestionAcceptance: FAILED - ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    EXEC dbo.sp_GetSentimentTrends @StartDate = '2025-05-01', @EndDate = '2025-05-31';
    PRINT 'sp_GetSentimentTrends: PASSED';
END TRY
BEGIN CATCH
    PRINT 'sp_GetSentimentTrends: FAILED - ' + ERROR_MESSAGE();
END CATCH

PRINT '========================================================';
PRINT 'CONSUMER BEHAVIOR ANALYSIS MIGRATION COMPLETED';
PRINT 'Execution completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================================';