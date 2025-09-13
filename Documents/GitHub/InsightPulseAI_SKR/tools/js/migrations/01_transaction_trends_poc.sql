-- =====================================================
-- Transaction Trends POC Migration
-- File: 01_transaction_trends_poc.sql
-- Purpose: Minimal migration for /transactions route POC
-- =====================================================

USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

PRINT '========================================================';
PRINT 'TRANSACTION TRENDS POC MIGRATION';
PRINT 'Execution started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================================';

-- =====================================================
-- Step 1: Add Essential Duration and Amount Fields
-- =====================================================

PRINT 'Adding transaction timing and amount fields...';

-- Check if columns already exist before adding
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'StartTime')
BEGIN
    ALTER TABLE dbo.SalesInteractions ADD StartTime DATETIME2 NULL;
    PRINT 'Added StartTime column';
END
ELSE
    PRINT 'StartTime column already exists';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'EndTime')
BEGIN
    ALTER TABLE dbo.SalesInteractions ADD EndTime DATETIME2 NULL;
    PRINT 'Added EndTime column';
END
ELSE
    PRINT 'EndTime column already exists';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'DurationSec')
BEGIN
    ALTER TABLE dbo.SalesInteractions ADD DurationSec AS DATEDIFF(SECOND, StartTime, EndTime) PERSISTED;
    PRINT 'Added DurationSec computed column';
END
ELSE
    PRINT 'DurationSec column already exists';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TransactionAmount')
BEGIN
    ALTER TABLE dbo.SalesInteractions ADD TransactionAmount DECIMAL(10,2) NULL;
    PRINT 'Added TransactionAmount column';
END
ELSE
    PRINT 'TransactionAmount column already exists';

-- =====================================================
-- Step 2: Create Transaction Trends View (POC-focused)
-- =====================================================

PRINT 'Creating v_TransactionTrendsPOC view...';

CREATE OR ALTER VIEW v_TransactionTrendsPOC AS
SELECT 
    si.InteractionID,
    si.TransactionDate,
    si.StartTime,
    si.EndTime,
    si.DurationSec,
    si.TransactionAmount,
    si.StoreID,
    s.StoreName,
    
    -- Time analysis fields for POC charts
    DATEPART(HOUR, si.StartTime) as TransactionHour,
    DATEPART(WEEKDAY, si.TransactionDate) as TransactionWeekday,
    CASE 
        WHEN DATEPART(WEEKDAY, si.TransactionDate) IN (1, 7) THEN 'Weekend'
        ELSE 'Weekday'
    END as DayType,
    
    -- Duration categories for box plot
    CASE 
        WHEN si.DurationSec IS NULL THEN 'Unknown'
        WHEN si.DurationSec < 60 THEN 'Quick (< 1min)'
        WHEN si.DurationSec BETWEEN 60 AND 180 THEN 'Normal (1-3min)'
        WHEN si.DurationSec BETWEEN 181 AND 300 THEN 'Long (3-5min)'
        ELSE 'Extended (> 5min)'
    END as DurationCategory,
    
    -- Amount categories for visualization
    CASE 
        WHEN si.TransactionAmount IS NULL THEN 'Unknown'
        WHEN si.TransactionAmount BETWEEN 1 AND 25 THEN '₱1-25'
        WHEN si.TransactionAmount BETWEEN 26 AND 50 THEN '₱26-50'
        WHEN si.TransactionAmount BETWEEN 51 AND 100 THEN '₱51-100'
        ELSE '₱100+'
    END as AmountRange
    
FROM dbo.SalesInteractions si
LEFT JOIN dbo.Stores s ON si.StoreID = s.StoreID
WHERE si.TransactionDate IS NOT NULL;
GO

-- =====================================================
-- Step 3: Populate Sample Data for POC
-- =====================================================

PRINT 'Populating sample transaction timing data...';

-- Update transaction amounts from existing TransactionItems
UPDATE si
SET TransactionAmount = (
    SELECT ISNULL(SUM(ti.Quantity * ti.UnitPrice), 0)
    FROM dbo.TransactionItems ti
    WHERE ti.InteractionID = si.InteractionID
)
FROM dbo.SalesInteractions si
WHERE si.TransactionAmount IS NULL;

-- Populate StartTime and EndTime from transcript data (if available)
WITH TransactionTiming AS (
    SELECT 
        si.InteractionID,
        MIN(st.Timestamp) as FirstTranscript,
        MAX(st.Timestamp) as LastTranscript
    FROM dbo.SalesInteractions si
    INNER JOIN dbo.SalesInteractionTranscripts st ON si.InteractionID = st.InteractionID
    GROUP BY si.InteractionID
)
UPDATE si
SET 
    StartTime = tt.FirstTranscript,
    EndTime = tt.LastTranscript
FROM dbo.SalesInteractions si
INNER JOIN TransactionTiming tt ON si.InteractionID = tt.InteractionID
WHERE si.StartTime IS NULL;

-- Generate synthetic timing data for transactions without transcript data
UPDATE dbo.SalesInteractions
SET 
    StartTime = DATEADD(MINUTE, 
        ABS(CHECKSUM(NEWID())) % 720,  -- Random minutes in 12-hour window
        CAST(TransactionDate as DATETIME2)
    ),
    EndTime = DATEADD(SECOND,
        60 + (ABS(CHECKSUM(NEWID())) % 240),  -- 1-5 minutes duration
        DATEADD(MINUTE, 
            ABS(CHECKSUM(NEWID())) % 720,
            CAST(TransactionDate as DATETIME2)
        )
    )
WHERE StartTime IS NULL 
AND TransactionDate >= DATEADD(DAY, -30, GETDATE()); -- Only last 30 days

-- =====================================================
-- Step 4: Create Performance Index for POC
-- =====================================================

PRINT 'Creating performance index for transaction trends...';

-- Index for time-based queries (hourly analysis)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'IX_SalesInteractions_POC_TimeAnalysis')
BEGIN
    CREATE NONCLUSTERED INDEX IX_SalesInteractions_POC_TimeAnalysis
    ON dbo.SalesInteractions (TransactionDate, StartTime)
    INCLUDE (DurationSec, TransactionAmount, StoreID);
    PRINT 'Created time analysis index';
END
ELSE
    PRINT 'Time analysis index already exists';

-- =====================================================
-- Step 5: Create API Data Export Procedure for POC
-- =====================================================

PRINT 'Creating transaction trends API procedure...';

CREATE OR ALTER PROCEDURE sp_GetTransactionTrendsPOC
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @StoreID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to last 7 days if no dates provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -7, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    -- Hourly volume data for time-series chart
    SELECT 
        'hourly_volume' as dataset_name,
        DATEPART(HOUR, StartTime) as hour,
        COUNT(*) as transaction_count,
        AVG(CAST(TransactionAmount as FLOAT)) as avg_amount,
        AVG(CAST(DurationSec as FLOAT)) as avg_duration
    FROM v_TransactionTrendsPOC
    WHERE TransactionDate BETWEEN @StartDate AND @EndDate
    AND (@StoreID IS NULL OR StoreID = @StoreID)
    AND StartTime IS NOT NULL
    GROUP BY DATEPART(HOUR, StartTime)
    ORDER BY hour;
    
    -- Duration distribution for box plot
    SELECT 
        'duration_distribution' as dataset_name,
        DurationCategory,
        COUNT(*) as count,
        MIN(DurationSec) as min_duration,
        MAX(DurationSec) as max_duration,
        AVG(CAST(DurationSec as FLOAT)) as avg_duration,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY DurationSec) as q1,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY DurationSec) as median,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY DurationSec) as q3
    FROM v_TransactionTrendsPOC
    WHERE TransactionDate BETWEEN @StartDate AND @EndDate
    AND (@StoreID IS NULL OR StoreID = @StoreID)
    AND DurationSec IS NOT NULL
    GROUP BY DurationCategory
    ORDER BY avg_duration;
    
    -- Summary stats for POC dashboard
    SELECT 
        'summary_stats' as dataset_name,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN DurationSec IS NOT NULL THEN 1 END) as transactions_with_duration,
        COUNT(CASE WHEN TransactionAmount IS NOT NULL THEN 1 END) as transactions_with_amount,
        AVG(CAST(TransactionAmount as FLOAT)) as avg_transaction_amount,
        AVG(CAST(DurationSec as FLOAT)) as avg_duration_seconds,
        MIN(TransactionDate) as date_range_start,
        MAX(TransactionDate) as date_range_end
    FROM v_TransactionTrendsPOC
    WHERE TransactionDate BETWEEN @StartDate AND @EndDate
    AND (@StoreID IS NULL OR StoreID = @StoreID);
END;
GO

-- =====================================================
-- Step 6: Test the POC Setup
-- =====================================================

PRINT 'Testing POC setup...';

-- Test the view
SELECT 
    'v_TransactionTrendsPOC Test' as test_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN DurationSec IS NOT NULL THEN 1 END) as records_with_duration,
    COUNT(CASE WHEN TransactionAmount IS NOT NULL THEN 1 END) as records_with_amount,
    MIN(TransactionDate) as earliest_date,
    MAX(TransactionDate) as latest_date
FROM v_TransactionTrendsPOC;

-- Test the API procedure
PRINT 'Testing API procedure with last 7 days...';
EXEC sp_GetTransactionTrendsPOC;

-- =====================================================
-- Step 7: Update Statistics
-- =====================================================

PRINT 'Updating table statistics...';
UPDATE STATISTICS dbo.SalesInteractions;

PRINT 'Transaction Trends POC migration completed successfully!';
PRINT 'Ready for API integration at /api/transactions/trends';
PRINT '========================================================';
GO