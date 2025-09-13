{{
    config(
        materialized='incremental',
        unique_key='DeviceDate',
        tags=['mart', 'devices', 'operations']
    )
}}

WITH device_logs AS (
    SELECT
        DeviceID,
        CAST(LoggedAt AS DATE) AS LogDate,
        COUNT(*) AS LogCount,
        COUNT(CASE WHEN LogLevel = 'INFO' THEN 1 END) AS InfoCount,
        COUNT(CASE WHEN LogLevel = 'WARNING' THEN 1 END) AS WarningCount,
        COUNT(CASE WHEN LogLevel = 'ERROR' THEN 1 END) AS ErrorCount,
        COUNT(CASE WHEN LogLevel = 'CRITICAL' THEN 1 END) AS CriticalCount
    FROM {{ ref('bronze_device_logs') }}
    WHERE LoggedAt IS NOT NULL
    GROUP BY DeviceID, CAST(LoggedAt AS DATE)
),

transcriptions AS (
    SELECT
        DeviceID,
        CAST(RecordedAt AS DATE) AS RecordedDate,
        COUNT(*) AS TranscriptionCount,
        AVG(Confidence) AS AvgSTTConfidence,
        SUM(CASE WHEN Confidence < 0.7 THEN 1 ELSE 0 END) AS LowConfidenceCount,
        AVG(AudioDuration) AS AvgAudioDuration
    FROM {{ ref('bronze_transcriptions') }}
    WHERE RecordedAt IS NOT NULL
    GROUP BY DeviceID, CAST(RecordedAt AS DATE)
),

vision_detections AS (
    SELECT
        DeviceID,
        CAST(DetectedAt AS DATE) AS DetectedDate,
        COUNT(*) AS DetectionCount,
        COUNT(DISTINCT DetectionType) AS DetectionTypeCount,
        AVG(Confidence) AS AvgDetectionConfidence,
        COUNT(CASE WHEN DetectionType = 'face' THEN 1 END) AS FaceDetections,
        COUNT(CASE WHEN DetectionType = 'gesture' THEN 1 END) AS GestureDetections,
        COUNT(CASE WHEN DetectionType = 'object' THEN 1 END) AS ObjectDetections,
        COUNT(CASE WHEN DetectionType = 'zone' THEN 1 END) AS ZoneDetections
    FROM {{ ref('bronze_vision_detections') }}
    WHERE DetectedAt IS NOT NULL
    GROUP BY DeviceID, CAST(DetectedAt AS DATE)
)

SELECT
    CONCAT(dr.DeviceID, '-', COALESCE(dl.LogDate, t.RecordedDate, vd.DetectedDate)) AS DeviceDate,
    dr.DeviceID,
    dr.DeviceType,
    dr.Location,
    dr.StoreID,
    s.StoreName,
    dr.ZoneID,
    COALESCE(dl.LogDate, t.RecordedDate, vd.DetectedDate) AS MetricDate,
    -- Device logs
    COALESCE(dl.LogCount, 0) AS LogCount,
    COALESCE(dl.InfoCount, 0) AS InfoLogCount,
    COALESCE(dl.WarningCount, 0) AS WarningLogCount,
    COALESCE(dl.ErrorCount, 0) AS ErrorLogCount,
    COALESCE(dl.CriticalCount, 0) AS CriticalLogCount,
    -- STT metrics
    COALESCE(t.TranscriptionCount, 0) AS TranscriptionCount,
    COALESCE(t.AvgSTTConfidence, 0) AS AvgSTTConfidence,
    COALESCE(t.LowConfidenceCount, 0) AS LowConfidenceTranscriptionCount,
    COALESCE(t.AvgAudioDuration, 0) AS AvgAudioDuration,
    -- Vision metrics
    COALESCE(vd.DetectionCount, 0) AS VisionDetectionCount,
    COALESCE(vd.AvgDetectionConfidence, 0) AS AvgDetectionConfidence,
    COALESCE(vd.FaceDetections, 0) AS FaceDetections,
    COALESCE(vd.GestureDetections, 0) AS GestureDetections,
    COALESCE(vd.ObjectDetections, 0) AS ObjectDetections,
    COALESCE(vd.ZoneDetections, 0) AS ZoneDetections,
    -- Calculated health metrics
    CASE 
        WHEN COALESCE(dl.CriticalCount, 0) > 0 THEN 'Critical'
        WHEN COALESCE(dl.ErrorCount, 0) > 5 THEN 'Error'
        WHEN COALESCE(dl.WarningCount, 0) > 10 THEN 'Warning'
        ELSE 'Healthy'
    END AS DeviceHealthStatus,
    CASE 
        WHEN COALESCE(t.TranscriptionCount, 0) = 0 AND dr.DeviceType IN ('microphone', 'combined') THEN 'No STT Activity'
        WHEN COALESCE(vd.DetectionCount, 0) = 0 AND dr.DeviceType IN ('camera', 'combined') THEN 'No Vision Activity'
        WHEN COALESCE(dl.LogCount, 0) = 0 THEN 'No Logs'
        ELSE 'Active'
    END AS DeviceActivityStatus,
    DATEDIFF(day, dr.LastHeartbeat, COALESCE(dl.LogDate, t.RecordedDate, vd.DetectedDate)) AS DaysSinceLastHeartbeat,
    CURRENT_TIMESTAMP() AS ProcessedAt
FROM {{ ref('edge_device_registry') }} dr
LEFT JOIN {{ ref('stores') }} s ON dr.StoreID = s.StoreID
LEFT JOIN device_logs dl ON dr.DeviceID = dl.DeviceID
LEFT JOIN transcriptions t ON dr.DeviceID = t.DeviceID 
    AND COALESCE(dl.LogDate, CAST(CURRENT_TIMESTAMP() AS DATE)) = t.RecordedDate
LEFT JOIN vision_detections vd ON dr.DeviceID = vd.DeviceID 
    AND COALESCE(dl.LogDate, CAST(CURRENT_TIMESTAMP() AS DATE)) = vd.DetectedDate
WHERE dr.IsActive = 1
  AND (dl.LogDate IS NOT NULL OR t.RecordedDate IS NOT NULL OR vd.DetectedDate IS NOT NULL)

{% if is_incremental() %}
    AND COALESCE(dl.LogDate, t.RecordedDate, vd.DetectedDate) > (SELECT MAX(MetricDate) FROM {{ this }})
{% endif %}