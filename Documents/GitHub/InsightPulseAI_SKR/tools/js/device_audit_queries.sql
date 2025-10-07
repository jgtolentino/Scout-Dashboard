-- =========================================================
-- DEVICE AUDIT SQL QUERIES
-- =========================================================

-- 1. PROBLEMATIC DEVICES: Master list of devices needing attention
-- =========================================================
WITH ProblematicDevices AS (
    -- Devices with empty transcriptions
    SELECT DISTINCT 
        d.DeviceID,
        d.location AS StoreID,
        d.model AS DeviceModel,
        d.firmwareVersion,
        'Empty Transcripts' AS IssueType
    FROM bronze_transcriptions t
    JOIN devices d ON t.DeviceID = d.DeviceID
    WHERE t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = ''
    
    UNION ALL
    
    -- Devices with missing CustomerIDs
    SELECT DISTINCT 
        d.DeviceID,
        d.location AS StoreID,
        d.model AS DeviceModel,
        d.firmwareVersion,
        'Missing CustomerIDs' AS IssueType
    FROM SalesInteractions s
    JOIN devices d ON s.DeviceID = d.DeviceID
    WHERE s.CustomerID IS NULL AND s.InteractionType IN ('VIEW', 'PICK', 'INQUIRY')
    
    UNION ALL
    
    -- Devices with missing BoundingBox data
    SELECT DISTINCT 
        d.DeviceID,
        d.location AS StoreID, 
        d.model AS DeviceModel,
        d.firmwareVersion,
        'Missing BoundingBox' AS IssueType
    FROM bronze_vision_detections v
    JOIN devices d ON v.DeviceID = d.DeviceID
    WHERE v.BoundingBox IS NULL AND v.DetectedObject IS NOT NULL
    
    UNION ALL
    
    -- Silent devices (no data in 24 hours)
    SELECT DISTINCT
        d.DeviceID,
        d.location AS StoreID,
        d.model AS DeviceModel,
        d.firmwareVersion,
        'Silent > 24 hours' AS IssueType
    FROM devices d
    WHERE DATEDIFF(hour, d.lastDataTransmission, CURRENT_TIMESTAMP) > 24
)
-- Final query with counts for dashboard
SELECT 
    DeviceID,
    StoreID,
    DeviceModel,
    firmwareVersion,
    IssueType,
    COUNT(*) OVER (PARTITION BY DeviceID) AS TotalIssueCount
FROM ProblematicDevices
ORDER BY TotalIssueCount DESC, DeviceID;


-- 2. EMPTY TRANSCRIPTIONS: Detailed analysis of transcript quality
-- =========================================================
WITH TranscriptQuality AS (
    SELECT
        t.DeviceID,
        d.location AS StoreID,
        d.model AS DeviceModel,
        d.firmwareVersion,
        COUNT(*) AS TotalTranscripts,
        SUM(CASE WHEN t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = '' THEN 1 ELSE 0 END) AS EmptyTranscripts,
        SUM(CASE WHEN t.FacialID IS NULL THEN 1 ELSE 0 END) AS MissingFacialIDs,
        SUM(CASE WHEN t.Confidence IS NULL THEN 1 ELSE 0 END) AS MissingConfidence,
        AVG(CAST(t.Confidence AS FLOAT)) AS AvgConfidence
    FROM bronze_transcriptions t
    JOIN devices d ON t.DeviceID = d.DeviceID
    WHERE t.Timestamp >= DATEADD(day, -7, CURRENT_TIMESTAMP)
    GROUP BY t.DeviceID, d.location, d.model, d.firmwareVersion
)
SELECT
    DeviceID,
    StoreID,
    DeviceModel,
    firmwareVersion,
    TotalTranscripts,
    EmptyTranscripts,
    CAST(EmptyTranscripts * 100.0 / NULLIF(TotalTranscripts, 0) AS DECIMAL(5,2)) AS EmptyTranscriptPercent,
    MissingFacialIDs,
    CAST(MissingFacialIDs * 100.0 / NULLIF(TotalTranscripts, 0) AS DECIMAL(5,2)) AS MissingFacialIDPercent,
    MissingConfidence,
    CAST(MissingConfidence * 100.0 / NULLIF(TotalTranscripts, 0) AS DECIMAL(5,2)) AS MissingConfidencePercent,
    AvgConfidence
FROM TranscriptQuality
WHERE EmptyTranscripts > 0 OR MissingFacialIDs > 0
ORDER BY EmptyTranscriptPercent DESC, MissingFacialIDPercent DESC;


-- 3. MISSING CUSTOMER IDs: Track customer identification failures
-- =========================================================
WITH CustomerCapture AS (
    SELECT
        s.DeviceID,
        d.location AS StoreID,
        d.model AS DeviceModel,
        d.firmwareVersion,
        s.InteractionType,
        COUNT(*) AS TotalInteractions,
        SUM(CASE WHEN s.CustomerID IS NULL THEN 1 ELSE 0 END) AS MissingCustomerIDs
    FROM SalesInteractions s
    JOIN devices d ON s.DeviceID = d.DeviceID
    WHERE s.Timestamp >= DATEADD(day, -7, CURRENT_TIMESTAMP)
    GROUP BY s.DeviceID, d.location, d.model, d.firmwareVersion, s.InteractionType
)
SELECT
    DeviceID,
    StoreID,
    DeviceModel,
    firmwareVersion,
    InteractionType,
    TotalInteractions,
    MissingCustomerIDs,
    CAST(MissingCustomerIDs * 100.0 / NULLIF(TotalInteractions, 0) AS DECIMAL(5,2)) AS MissingCustomerIDPercent
FROM CustomerCapture
WHERE MissingCustomerIDs > 0
ORDER BY MissingCustomerIDPercent DESC, TotalInteractions DESC;


-- 4. DEVICE HEALTH DASHBOARD: Overall device health metrics
-- =========================================================
WITH DeviceHealth AS (
    -- Get last transmission time for all data types
    SELECT 
        d.DeviceID,
        d.location AS StoreID,
        d.model AS DeviceModel,
        d.firmwareVersion,
        d.status,
        -- Last data points from each table
        (
            SELECT MAX(EventTimestamp) 
            FROM bronze_device_logs 
            WHERE DeviceID = d.DeviceID
        ) AS LastDeviceLog,
        (
            SELECT MAX(Timestamp) 
            FROM bronze_transcriptions 
            WHERE DeviceID = d.DeviceID
        ) AS LastTranscription,
        (
            SELECT MAX(Timestamp) 
            FROM bronze_vision_detections 
            WHERE DeviceID = d.DeviceID
        ) AS LastVisionDetection,
        (
            SELECT MAX(Timestamp) 
            FROM SalesInteractions 
            WHERE DeviceID = d.DeviceID
        ) AS LastSalesInteraction,
        -- Data quality metrics
        (
            SELECT COUNT(*) 
            FROM bronze_transcriptions 
            WHERE DeviceID = d.DeviceID 
            AND (TranscriptText IS NULL OR TRIM(TranscriptText) = '')
            AND Timestamp >= DATEADD(day, -7, CURRENT_TIMESTAMP)
        ) AS EmptyTranscripts,
        (
            SELECT COUNT(*) 
            FROM SalesInteractions 
            WHERE DeviceID = d.DeviceID 
            AND CustomerID IS NULL
            AND Timestamp >= DATEADD(day, -7, CURRENT_TIMESTAMP)
        ) AS MissingCustomerIDs,
        (
            SELECT COUNT(*) 
            FROM bronze_vision_detections 
            WHERE DeviceID = d.DeviceID 
            AND BoundingBox IS NULL
            AND Timestamp >= DATEADD(day, -7, CURRENT_TIMESTAMP)
        ) AS MissingBoundingBoxes
    FROM devices d
)
SELECT
    DeviceID,
    StoreID,
    DeviceModel,
    firmwareVersion,
    status,
    LastDeviceLog,
    LastTranscription,
    LastVisionDetection,
    LastSalesInteraction,
    DATEDIFF(hour, LastDeviceLog, CURRENT_TIMESTAMP) AS HoursSinceLastDeviceLog,
    DATEDIFF(hour, LastTranscription, CURRENT_TIMESTAMP) AS HoursSinceLastTranscription,
    DATEDIFF(hour, LastVisionDetection, CURRENT_TIMESTAMP) AS HoursSinceLastVisionDetection,
    DATEDIFF(hour, LastSalesInteraction, CURRENT_TIMESTAMP) AS HoursSinceLastSalesInteraction,
    EmptyTranscripts,
    MissingCustomerIDs,
    MissingBoundingBoxes,
    CASE
        WHEN DATEDIFF(hour, LastDeviceLog, CURRENT_TIMESTAMP) > 24 THEN 'Critical'
        WHEN DATEDIFF(hour, LastDeviceLog, CURRENT_TIMESTAMP) > 6 THEN 'Warning'
        WHEN EmptyTranscripts > 5 OR MissingCustomerIDs > 5 OR MissingBoundingBoxes > 5 THEN 'Warning'
        ELSE 'Healthy'
    END AS HealthStatus
FROM DeviceHealth
ORDER BY 
    CASE
        WHEN HealthStatus = 'Critical' THEN 1
        WHEN HealthStatus = 'Warning' THEN 2
        ELSE 3
    END,
    HoursSinceLastDeviceLog DESC;


-- 5. FIRMWARE ANALYSIS: Impact of firmware version on data quality
-- =========================================================
WITH FirmwareStats AS (
    SELECT
        d.firmwareVersion,
        COUNT(DISTINCT d.DeviceID) AS TotalDevices,
        -- Device log completeness
        (
            SELECT COUNT(*) 
            FROM bronze_device_logs l
            JOIN devices d2 ON l.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
        ) AS TotalLogs,
        (
            SELECT COUNT(*) 
            FROM bronze_device_logs l
            JOIN devices d2 ON l.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
            AND (l.Payload IS NULL OR l.StoreID IS NULL OR l.EventTimestamp IS NULL)
        ) AS IncompleteLogs,
        -- Transcription quality
        (
            SELECT COUNT(*) 
            FROM bronze_transcriptions t
            JOIN devices d2 ON t.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
        ) AS TotalTranscriptions,
        (
            SELECT COUNT(*) 
            FROM bronze_transcriptions t
            JOIN devices d2 ON t.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
            AND (t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = '')
        ) AS EmptyTranscriptions,
        -- Vision detection quality
        (
            SELECT COUNT(*) 
            FROM bronze_vision_detections v
            JOIN devices d2 ON v.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
        ) AS TotalDetections,
        (
            SELECT COUNT(*) 
            FROM bronze_vision_detections v
            JOIN devices d2 ON v.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
            AND (v.BoundingBox IS NULL OR v.Confidence IS NULL)
        ) AS IncompleteDetections,
        -- Sales interaction quality
        (
            SELECT COUNT(*) 
            FROM SalesInteractions s
            JOIN devices d2 ON s.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
        ) AS TotalInteractions,
        (
            SELECT COUNT(*) 
            FROM SalesInteractions s
            JOIN devices d2 ON s.DeviceID = d2.DeviceID
            WHERE d2.firmwareVersion = d.firmwareVersion
            AND s.CustomerID IS NULL
        ) AS MissingCustomerIDs
    FROM devices d
    GROUP BY d.firmwareVersion
)
SELECT
    firmwareVersion,
    TotalDevices,
    -- Device logs stats
    CAST(IncompleteLogs * 100.0 / NULLIF(TotalLogs, 0) AS DECIMAL(5,2)) AS IncompleteLogPercent,
    -- Transcription stats
    CAST(EmptyTranscriptions * 100.0 / NULLIF(TotalTranscriptions, 0) AS DECIMAL(5,2)) AS EmptyTranscriptPercent,
    -- Vision detection stats
    CAST(IncompleteDetections * 100.0 / NULLIF(TotalDetections, 0) AS DECIMAL(5,2)) AS IncompleteDetectionPercent,
    -- Sales interaction stats
    CAST(MissingCustomerIDs * 100.0 / NULLIF(TotalInteractions, 0) AS DECIMAL(5,2)) AS MissingCustomerIDPercent,
    -- Overall quality score (lower is better)
    CAST(
        (
            (IncompleteLogs * 100.0 / NULLIF(TotalLogs, 0)) +
            (EmptyTranscriptions * 100.0 / NULLIF(TotalTranscriptions, 0)) + 
            (IncompleteDetections * 100.0 / NULLIF(TotalDetections, 0)) +
            (MissingCustomerIDs * 100.0 / NULLIF(TotalInteractions, 0))
        ) / 4 AS DECIMAL(5,2)
    ) AS OverallErrorRate
FROM FirmwareStats
ORDER BY OverallErrorRate;


-- 6. STORE LOCATION ANALYSIS: Identify problematic store locations
-- =========================================================
WITH StoreStats AS (
    SELECT
        d.location AS StoreID,
        COUNT(DISTINCT d.DeviceID) AS TotalDevices,
        SUM(CASE WHEN DATEDIFF(hour, d.lastDataTransmission, CURRENT_TIMESTAMP) > 24 THEN 1 ELSE 0 END) AS SilentDevices,
        -- Transcript quality by store
        (
            SELECT COUNT(*) 
            FROM bronze_transcriptions t
            JOIN devices d2 ON t.DeviceID = d2.DeviceID
            WHERE d2.location = d.location
        ) AS TotalTranscriptions,
        (
            SELECT COUNT(*) 
            FROM bronze_transcriptions t
            JOIN devices d2 ON t.DeviceID = d2.DeviceID
            WHERE d2.location = d.location
            AND (t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = '')
        ) AS EmptyTranscriptions,
        -- CustomerID capture by store
        (
            SELECT COUNT(*) 
            FROM SalesInteractions s
            JOIN devices d2 ON s.DeviceID = d2.DeviceID
            WHERE d2.location = d.location
        ) AS TotalInteractions,
        (
            SELECT COUNT(*) 
            FROM SalesInteractions s
            JOIN devices d2 ON s.DeviceID = d2.DeviceID
            WHERE d2.location = d.location
            AND s.CustomerID IS NULL
        ) AS MissingCustomerIDs
    FROM devices d
    GROUP BY d.location
)
SELECT
    StoreID,
    TotalDevices,
    SilentDevices,
    CAST(SilentDevices * 100.0 / NULLIF(TotalDevices, 0) AS DECIMAL(5,2)) AS SilentDevicePercent,
    TotalTranscriptions,
    EmptyTranscriptions,
    CAST(EmptyTranscriptions * 100.0 / NULLIF(TotalTranscriptions, 0) AS DECIMAL(5,2)) AS EmptyTranscriptPercent,
    TotalInteractions,
    MissingCustomerIDs,
    CAST(MissingCustomerIDs * 100.0 / NULLIF(TotalInteractions, 0) AS DECIMAL(5,2)) AS MissingCustomerIDPercent,
    -- Overall store health score (lower is better)
    CAST(
        (
            (SilentDevices * 100.0 / NULLIF(TotalDevices, 0)) +
            (EmptyTranscriptions * 100.0 / NULLIF(TotalTranscriptions, 0)) +
            (MissingCustomerIDs * 100.0 / NULLIF(TotalInteractions, 0))
        ) / 3 AS DECIMAL(5,2)
    ) AS OverallErrorRate
FROM StoreStats
ORDER BY OverallErrorRate DESC;


-- 7. DEVICE ALERTING QUERY: For automated monitoring and alerts
-- =========================================================
SELECT
    d.DeviceID,
    d.location AS StoreID,
    d.model AS DeviceModel,
    d.firmwareVersion,
    DATEDIFF(hour, d.lastDataTransmission, CURRENT_TIMESTAMP) AS HoursSinceLastTransmission,
    (
        SELECT COUNT(*) 
        FROM bronze_transcriptions t
        WHERE t.DeviceID = d.DeviceID
        AND (t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = '')
        AND t.Timestamp >= DATEADD(day, -1, CURRENT_TIMESTAMP)
    ) AS EmptyTranscriptsLast24h,
    (
        SELECT COUNT(*) 
        FROM SalesInteractions s
        WHERE s.DeviceID = d.DeviceID
        AND s.CustomerID IS NULL
        AND s.Timestamp >= DATEADD(day, -1, CURRENT_TIMESTAMP)
    ) AS MissingCustomerIDsLast24h,
    CASE
        WHEN DATEDIFF(hour, d.lastDataTransmission, CURRENT_TIMESTAMP) > 24 THEN 'CRITICAL'
        WHEN DATEDIFF(hour, d.lastDataTransmission, CURRENT_TIMESTAMP) > 6 THEN 'WARNING'
        WHEN (SELECT COUNT(*) FROM bronze_transcriptions t WHERE t.DeviceID = d.DeviceID AND (t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = '') AND t.Timestamp >= DATEADD(day, -1, CURRENT_TIMESTAMP)) > 5 THEN 'WARNING'
        WHEN (SELECT COUNT(*) FROM SalesInteractions s WHERE s.DeviceID = d.DeviceID AND s.CustomerID IS NULL AND s.Timestamp >= DATEADD(day, -1, CURRENT_TIMESTAMP)) > 10 THEN 'WARNING'
        ELSE 'OK'
    END AS AlertStatus
FROM devices d
WHERE 
    DATEDIFF(hour, d.lastDataTransmission, CURRENT_TIMESTAMP) > 6
    OR (
        SELECT COUNT(*) 
        FROM bronze_transcriptions t
        WHERE t.DeviceID = d.DeviceID
        AND (t.TranscriptText IS NULL OR TRIM(t.TranscriptText) = '')
        AND t.Timestamp >= DATEADD(day, -1, CURRENT_TIMESTAMP)
    ) > 5
    OR (
        SELECT COUNT(*) 
        FROM SalesInteractions s
        WHERE s.DeviceID = d.DeviceID
        AND s.CustomerID IS NULL
        AND s.Timestamp >= DATEADD(day, -1, CURRENT_TIMESTAMP)
    ) > 10
ORDER BY 
    CASE
        WHEN AlertStatus = 'CRITICAL' THEN 1
        WHEN AlertStatus = 'WARNING' THEN 2
        ELSE 3
    END,
    HoursSinceLastTransmission DESC;