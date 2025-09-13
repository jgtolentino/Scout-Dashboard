-- Migration: Data Quality Tracking Tables
-- Purpose: Track data quality metrics from edge devices through medallion layers
-- Date: 2025-05-23

USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

-- ======================================
-- 1. CREATE DATA QUALITY METRICS TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = DataQualityMetrics)
BEGIN
    CREATE TABLE dbo.DataQualityMetrics (
        MetricID BIGINT IDENTITY(1,1) PRIMARY KEY,
        TraceID NVARCHAR(100) NOT NULL,
        DeviceID NVARCHAR(50) NOT NULL,
        StoreID INT NOT NULL,
        Layer NVARCHAR(20) NOT NULL, -- Edge, Bronze, Silver, Gold
        EventType NVARCHAR(50),
        QualityScore DECIMAL(5,2),
        CompletenessScore DECIMAL(5,2),
        AccuracyScore DECIMAL(5,2),
        TimelinessScore DECIMAL(5,2),
        ValidationErrors INT DEFAULT 0,
        ValidationWarnings INT DEFAULT 0,
        ProcessingLatencyMs INT,
        RecordCount INT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE(),
        INDEX IX_TraceID (TraceID),
        INDEX IX_DeviceID_Date (DeviceID, CreatedDate),
        INDEX IX_Layer_Date (Layer, CreatedDate)
    );
END
GO

-- ======================================
-- 2. CREATE DEVICE HEALTH TRACKING TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = DeviceHealthMetrics)
BEGIN
    CREATE TABLE dbo.DeviceHealthMetrics (
        HealthID BIGINT IDENTITY(1,1) PRIMARY KEY,
        DeviceID NVARCHAR(50) NOT NULL,
        StoreID INT NOT NULL,
        FirmwareVersion NVARCHAR(20),
        BatteryLevel INT,
        MemoryUsagePercent INT,
        CPUUsagePercent INT,
        Temperature DECIMAL(5,2),
        SignalStrength INT,
        NetworkType NVARCHAR(20),
        LastHeartbeat DATETIME,
        ConsecutiveFailures INT DEFAULT 0,
        IsOnline BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE(),
        INDEX IX_DeviceID (DeviceID),
        INDEX IX_StoreID (StoreID),
        INDEX IX_LastHeartbeat (LastHeartbeat)
    );
END
GO
-- ======================================
-- 3. CREATE DATA LINEAGE TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = DataLineage)
BEGIN
    CREATE TABLE dbo.DataLineage (
        LineageID BIGINT IDENTITY(1,1) PRIMARY KEY,
        TraceID NVARCHAR(100) NOT NULL,
        EventID NVARCHAR(100) NOT NULL,
        DeviceID NVARCHAR(50) NOT NULL,
        Layer NVARCHAR(20) NOT NULL,
        ProcessingStep NVARCHAR(100),
        InputRecordCount INT,
        OutputRecordCount INT,
        DroppedRecordCount INT DEFAULT 0,
        TransformationApplied NVARCHAR(500),
        ProcessingStartTime DATETIME,
        ProcessingEndTime DATETIME,
        ProcessingDurationMs INT,
        ErrorMessage NVARCHAR(MAX),
        CreatedDate DATETIME DEFAULT GETDATE(),
        INDEX IX_TraceID_Layer (TraceID, Layer),
        INDEX IX_EventID (EventID)
    );
END
GO

-- ======================================
-- 4. CREATE QUALITY ISSUE LOG TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = QualityIssueLog)
BEGIN
    CREATE TABLE dbo.QualityIssueLog (
        IssueID BIGINT IDENTITY(1,1) PRIMARY KEY,
        TraceID NVARCHAR(100),
        DeviceID NVARCHAR(50),
        StoreID INT,
        IssueType NVARCHAR(50), -- MissingData, SchemaViolation, Duplicate, Anomaly
        Severity NVARCHAR(20), -- Critical, High, Medium, Low
        Layer NVARCHAR(20),
        Description NVARCHAR(MAX),
        AffectedField NVARCHAR(100),
        ExpectedValue NVARCHAR(500),
        ActualValue NVARCHAR(500),
        AutoRemediated BIT DEFAULT 0,
        RemediationAction NVARCHAR(500),
        CreatedDate DATETIME DEFAULT GETDATE(),
        ResolvedDate DATETIME,
        INDEX IX_DeviceID_Date (DeviceID, CreatedDate),
        INDEX IX_IssueType_Severity (IssueType, Severity)
    );
END
GO

-- ======================================
-- 5. CREATE QUALITY THRESHOLDS TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = QualityThresholds)
BEGIN
    CREATE TABLE dbo.QualityThresholds (
        ThresholdID INT IDENTITY(1,1) PRIMARY KEY,
        Layer NVARCHAR(20) NOT NULL,
        MetricName NVARCHAR(50) NOT NULL,
        ThresholdType NVARCHAR(20), -- Min, Max, Target
        ThresholdValue DECIMAL(10,2),
        AlertEnabled BIT DEFAULT 1,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE(),
        UpdatedDate DATETIME DEFAULT GETDATE(),
        UNIQUE (Layer, MetricName, ThresholdType)
    );
END
GO
-- ======================================
-- 6. INSERT DEFAULT QUALITY THRESHOLDS
-- ======================================
DELETE FROM dbo.QualityThresholds WHERE Layer IN (Edge, Bronze, Silver, Gold);

INSERT INTO dbo.QualityThresholds (Layer, MetricName, ThresholdType, ThresholdValue) VALUES
-- Edge Layer Thresholds
(Edge, QualityScore, Min, 80),
(Edge, BatteryLevel, Min, 20),
(Edge, SignalStrength, Min, -80),
(Edge, ValidationErrorRate, Max, 5),
-- Bronze Layer Thresholds
(Bronze, CompletenessScore, Min, 90),
(Bronze, DuplicateRate, Max, 1),
(Bronze, IngestionLatency, Max, 300000), -- 5 minutes
-- Silver Layer Thresholds
(Silver, CustomerIDRate, Min, 80),
(Silver, TranscriptConfidence, Min, 85),
(Silver, AccuracyScore, Min, 95),
-- Gold Layer Thresholds
(Gold, MetricCompleteness, Min, 98),
(Gold, AnomalyRate, Max, 2),
(Gold, InsightQuality, Min, 90);
GO

-- ======================================
-- 7. CREATE QUALITY MONITORING VIEW
-- ======================================
CREATE OR ALTER VIEW dbo.v_DataQualityDashboard
AS
WITH LatestMetrics AS (
    SELECT 
        DeviceID,
        StoreID,
        Layer,
        QualityScore,
        CompletenessScore,
        AccuracyScore,
        TimelinessScore,
        ValidationErrors,
        ValidationWarnings,
        ProcessingLatencyMs,
        CreatedDate,
        ROW_NUMBER() OVER (PARTITION BY DeviceID, Layer ORDER BY CreatedDate DESC) as rn
    FROM dbo.DataQualityMetrics
    WHERE CreatedDate >= DATEADD(hour, -24, GETDATE())
),
DeviceHealth AS (
    SELECT 
        DeviceID,
        FirmwareVersion,
        BatteryLevel,
        SignalStrength,
        IsOnline,
        LastHeartbeat,
        ROW_NUMBER() OVER (PARTITION BY DeviceID ORDER BY CreatedDate DESC) as rn
    FROM dbo.DeviceHealthMetrics
)
SELECT 
    lm.DeviceID,
    lm.StoreID,
    s.StoreName,
    lm.Layer,
    lm.QualityScore,
    lm.CompletenessScore,
    lm.AccuracyScore,
    lm.TimelinessScore,
    lm.ValidationErrors,
    lm.ValidationWarnings,
    lm.ProcessingLatencyMs,
    dh.FirmwareVersion,
    dh.BatteryLevel,
    dh.SignalStrength,
    dh.IsOnline,
    dh.LastHeartbeat,
    DATEDIFF(minute, dh.LastHeartbeat, GETDATE()) as MinutesSinceLastHeartbeat,
    lm.CreatedDate as LastMetricUpdate
FROM LatestMetrics lm
LEFT JOIN DeviceHealth dh ON lm.DeviceID = dh.DeviceID AND dh.rn = 1
LEFT JOIN dbo.Stores s ON lm.StoreID = s.StoreID
WHERE lm.rn = 1;
GO
-- ======================================
-- 8. CREATE QUALITY ALERT PROCEDURES
-- ======================================
CREATE OR ALTER PROCEDURE sp_CheckQualityThresholds
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for threshold violations
    WITH ThresholdViolations AS (
        SELECT 
            m.DeviceID,
            m.StoreID,
            m.Layer,
            t.MetricName,
            t.ThresholdType,
            t.ThresholdValue,
            CASE t.MetricName
                WHEN QualityScore THEN m.QualityScore
                WHEN CompletenessScore THEN m.CompletenessScore
                WHEN AccuracyScore THEN m.AccuracyScore
                WHEN ValidationErrorRate THEN CAST(m.ValidationErrors AS DECIMAL) / NULLIF(m.RecordCount, 0) * 100
                ELSE NULL
            END as ActualValue,
            m.CreatedDate
        FROM dbo.DataQualityMetrics m
        CROSS JOIN dbo.QualityThresholds t
        WHERE m.Layer = t.Layer
            AND m.CreatedDate >= DATEADD(hour, -1, GETDATE())
            AND t.IsActive = 1
    )
    INSERT INTO dbo.QualityIssueLog (
        DeviceID, StoreID, IssueType, Severity, Layer, 
        Description, AffectedField, ExpectedValue, ActualValue
    )
    SELECT 
        DeviceID,
        StoreID,
        ThresholdViolation as IssueType,
        CASE 
            WHEN MetricName IN (QualityScore, CustomerIDRate) THEN Critical
            WHEN MetricName IN (CompletenessScore, AccuracyScore) THEN High
            ELSE Medium
        END as Severity,
        Layer,
        Quality metric  + MetricName +  violated  + ThresholdType +  threshold as Description,
        MetricName as AffectedField,
        CAST(ThresholdValue AS NVARCHAR(50)) as ExpectedValue,
        CAST(ActualValue AS NVARCHAR(50)) as ActualValue
    FROM ThresholdViolations
    WHERE (ThresholdType = Min AND ActualValue < ThresholdValue)
       OR (ThresholdType = Max AND ActualValue > ThresholdValue);
    
    -- Check for silent devices
    INSERT INTO dbo.QualityIssueLog (
        DeviceID, StoreID, IssueType, Severity, Layer, Description
    )
    SELECT 
        dh.DeviceID,
        dh.StoreID,
        SilentDevice as IssueType,
        Critical as Severity,
        Edge as Layer,
        Device silent for  + CAST(DATEDIFF(hour, LastHeartbeat, GETDATE()) AS NVARCHAR(10)) +  hours
    FROM dbo.DeviceHealthMetrics dh
    WHERE dh.LastHeartbeat < DATEADD(hour, -24, GETDATE())
        AND dh.IsOnline = 1
        AND NOT EXISTS (
            SELECT 1 FROM dbo.QualityIssueLog q 
            WHERE q.DeviceID = dh.DeviceID 
                AND q.IssueType = SilentDevice
                AND q.CreatedDate > DATEADD(hour, -24, GETDATE())
        );
END
GO

-- ======================================
-- 9. CREATE QUALITY SUMMARY PROCEDURE
-- ======================================
CREATE OR ALTER PROCEDURE sp_GetQualitySummary
    @Layer NVARCHAR(20) = NULL,
    @TimeRangeHours INT = 24
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Overall quality metrics
    SELECT 
        Layer,
        COUNT(DISTINCT DeviceID) as ActiveDevices,
        AVG(QualityScore) as AvgQualityScore,
        MIN(QualityScore) as MinQualityScore,
        MAX(QualityScore) as MaxQualityScore,
        AVG(CompletenessScore) as AvgCompleteness,
        AVG(AccuracyScore) as AvgAccuracy,
        AVG(TimelinessScore) as AvgTimeliness,
        SUM(ValidationErrors) as TotalErrors,
        SUM(ValidationWarnings) as TotalWarnings,
        AVG(ProcessingLatencyMs) as AvgLatencyMs
    FROM dbo.DataQualityMetrics
    WHERE CreatedDate >= DATEADD(hour, -@TimeRangeHours, GETDATE())
        AND (@Layer IS NULL OR Layer = @Layer)
    GROUP BY Layer
    ORDER BY 
        CASE Layer 
            WHEN Edge THEN 1 
            WHEN Bronze THEN 2 
            WHEN Silver THEN 3 
            WHEN Gold THEN 4 
        END;
    
    -- Issue summary
    SELECT 
        IssueType,
        Severity,
        Layer,
        COUNT(*) as IssueCount,
        COUNT(DISTINCT DeviceID) as AffectedDevices
    FROM dbo.QualityIssueLog
    WHERE CreatedDate >= DATEADD(hour, -@TimeRangeHours, GETDATE())
        AND (@Layer IS NULL OR Layer = @Layer)
    GROUP BY IssueType, Severity, Layer
    ORDER BY 
        CASE Severity 
            WHEN Critical THEN 1 
            WHEN High THEN 2 
            WHEN Medium THEN 3 
            WHEN Low THEN 4 
        END;
    
    -- Device health summary
    SELECT 
        COUNT(*) as TotalDevices,
        SUM(CASE WHEN IsOnline = 1 THEN 1 ELSE 0 END) as OnlineDevices,
        AVG(BatteryLevel) as AvgBatteryLevel,
        AVG(SignalStrength) as AvgSignalStrength,
        COUNT(CASE WHEN BatteryLevel < 20 THEN 1 END) as LowBatteryCount,
        COUNT(CASE WHEN DATEDIFF(hour, LastHeartbeat, GETDATE()) > 24 THEN 1 END) as SilentDeviceCount
    FROM (
        SELECT DeviceID, MAX(CreatedDate) as LatestDate
        FROM dbo.DeviceHealthMetrics
        GROUP BY DeviceID
    ) latest
    INNER JOIN dbo.DeviceHealthMetrics dhm 
        ON latest.DeviceID = dhm.DeviceID 
        AND latest.LatestDate = dhm.CreatedDate;
END
GO

-- ======================================
-- 10. GRANT PERMISSIONS
-- ======================================
GRANT SELECT ON dbo.DataQualityMetrics TO [scout_api_user];
GRANT SELECT ON dbo.DeviceHealthMetrics TO [scout_api_user];
GRANT SELECT ON dbo.DataLineage TO [scout_api_user];
GRANT SELECT ON dbo.QualityIssueLog TO [scout_api_user];
GRANT SELECT ON dbo.v_DataQualityDashboard TO [scout_api_user];
GRANT EXECUTE ON dbo.sp_CheckQualityThresholds TO [scout_api_user];
GRANT EXECUTE ON dbo.sp_GetQualitySummary TO [scout_api_user];
GO

PRINT Data Quality Tracking tables and procedures created successfully\!;
PRINT Tables: DataQualityMetrics, DeviceHealthMetrics, DataLineage, QualityIssueLog, QualityThresholds;
PRINT View: v_DataQualityDashboard;
PRINT Procedures: sp_CheckQualityThresholds, sp_GetQualitySummary;
GO
