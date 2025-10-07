-- =====================================================
-- Sprint 10: Schema Migration for Transaction Duration and Amounts
-- File: 02_sprint10_transaction_duration_amounts.sql
-- Purpose: Add transaction timing and computed amount fields
-- =====================================================

USE [scout_analytics];
GO

-- =====================================================
-- Step 1: Add Transaction Duration Fields
-- =====================================================

PRINT 'Adding transaction duration fields to SalesInteractions...';

ALTER TABLE dbo.SalesInteractions
ADD 
    StartTime DATETIME2 NULL,
    EndTime DATETIME2 NULL;
GO

-- Add computed column for duration (persisted for performance)
ALTER TABLE dbo.SalesInteractions
ADD DurationSec AS DATEDIFF(SECOND, StartTime, EndTime) PERSISTED;
GO

-- =====================================================
-- Step 2: Add Transaction Amount (Computed, Persisted)
-- =====================================================

PRINT 'Adding persisted transaction amount field...';

-- Note: We'll use a trigger approach for the computed column since
-- it needs to reference another table (TransactionItems)
ALTER TABLE dbo.SalesInteractions
ADD TransactionAmount DECIMAL(10,2) NULL;
GO

-- Create index on the new amount field for dashboard performance
CREATE NONCLUSTERED INDEX IX_SalesInteractions_TransactionAmount
ON dbo.SalesInteractions (TransactionAmount)
INCLUDE (TransactionDate, StoreID, CustomerID);
GO

-- =====================================================
-- Step 3: Create Trigger to Maintain TransactionAmount
-- =====================================================

PRINT 'Creating trigger to maintain transaction amounts...';

CREATE OR ALTER TRIGGER tr_UpdateTransactionAmount
ON dbo.TransactionItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update affected transactions
    WITH AffectedTransactions AS (
        SELECT DISTINCT InteractionID FROM inserted
        UNION
        SELECT DISTINCT InteractionID FROM deleted
    )
    UPDATE si
    SET TransactionAmount = (
        SELECT ISNULL(SUM(ti.Quantity * ti.UnitPrice), 0)
        FROM dbo.TransactionItems ti
        WHERE ti.InteractionID = si.InteractionID
    )
    FROM dbo.SalesInteractions si
    INNER JOIN AffectedTransactions at ON si.InteractionID = at.InteractionID;
END;
GO

-- =====================================================
-- Step 4: Populate Existing Records
-- =====================================================

PRINT 'Populating transaction amounts for existing records...';

-- Update all existing transaction amounts
UPDATE si
SET TransactionAmount = (
    SELECT ISNULL(SUM(ti.Quantity * ti.UnitPrice), 0)
    FROM dbo.TransactionItems ti
    WHERE ti.InteractionID = si.InteractionID
)
FROM dbo.SalesInteractions si;
GO

PRINT 'Populating transaction start/end times from transcript data...';

-- Populate StartTime and EndTime from transcript data
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
GO

-- =====================================================
-- Step 5: Add Indexes for Dashboard Performance
-- =====================================================

PRINT 'Creating performance indexes...';

-- Index for time-based filtering
CREATE NONCLUSTERED INDEX IX_SalesInteractions_Duration
ON dbo.SalesInteractions (DurationSec)
INCLUDE (TransactionDate, StoreID, TransactionAmount);
GO

-- Index for transaction date bucketing (hour, weekday analysis)
CREATE NONCLUSTERED INDEX IX_SalesInteractions_TimeAnalysis
ON dbo.SalesInteractions (TransactionDate)
INCLUDE (StartTime, EndTime, DurationSec, TransactionAmount, StoreID);
GO

-- =====================================================
-- Step 6: Create Performance Views
-- =====================================================

PRINT 'Creating transaction stats view...';

CREATE OR ALTER VIEW v_TransactionStats AS
SELECT 
    si.InteractionID,
    si.TransactionDate,
    si.StoreID,
    si.CustomerID,
    si.TransactionAmount,
    si.DurationSec,
    DATEPART(HOUR, si.StartTime) as TransactionHour,
    DATEPART(WEEKDAY, si.TransactionDate) as TransactionWeekday,
    CASE 
        WHEN DATEPART(WEEKDAY, si.TransactionDate) IN (1, 7) THEN 'Weekend'
        ELSE 'Weekday'
    END as DayType,
    COUNT(ti.ProductID) as ItemCount,
    AVG(ti.UnitPrice) as AvgUnitPrice,
    SUM(ti.Quantity) as TotalUnits
FROM dbo.SalesInteractions si
LEFT JOIN dbo.TransactionItems ti ON si.InteractionID = ti.InteractionID
GROUP BY 
    si.InteractionID, si.TransactionDate, si.StoreID, si.CustomerID,
    si.TransactionAmount, si.DurationSec, si.StartTime;
GO

-- =====================================================
-- Step 7: Add Data Quality Constraints
-- =====================================================

PRINT 'Adding data quality constraints...';

-- Ensure transaction amounts are non-negative
ALTER TABLE dbo.SalesInteractions
ADD CONSTRAINT CK_TransactionAmount_NonNegative 
CHECK (TransactionAmount >= 0);
GO

-- Ensure duration is reasonable (max 2 hours)
ALTER TABLE dbo.SalesInteractions
ADD CONSTRAINT CK_DurationSec_Reasonable 
CHECK (DurationSec IS NULL OR (DurationSec >= 0 AND DurationSec <= 7200));
GO

-- Ensure EndTime is after StartTime
ALTER TABLE dbo.SalesInteractions
ADD CONSTRAINT CK_EndTime_After_StartTime 
CHECK (EndTime IS NULL OR StartTime IS NULL OR EndTime >= StartTime);
GO

-- =====================================================
-- Step 8: Update Statistics
-- =====================================================

PRINT 'Updating table statistics...';

UPDATE STATISTICS dbo.SalesInteractions;
UPDATE STATISTICS dbo.TransactionItems;
GO

-- =====================================================
-- Verification Queries
-- =====================================================

PRINT 'Running verification queries...';

SELECT 
    'Transaction Amount Distribution' as CheckType,
    COUNT(*) as TotalTransactions,
    AVG(TransactionAmount) as AvgAmount,
    MIN(TransactionAmount) as MinAmount,
    MAX(TransactionAmount) as MaxAmount,
    COUNT(CASE WHEN TransactionAmount IS NULL THEN 1 END) as NullAmounts
FROM dbo.SalesInteractions;

SELECT 
    'Duration Distribution' as CheckType,
    COUNT(*) as TotalTransactions,
    AVG(DurationSec) as AvgDurationSec,
    MIN(DurationSec) as MinDurationSec,
    MAX(DurationSec) as MaxDurationSec,
    COUNT(CASE WHEN DurationSec IS NULL THEN 1 END) as NullDurations
FROM dbo.SalesInteractions;

PRINT 'Sprint 10 migration completed successfully!';
GO