{{
    config(
        materialized='incremental',
        unique_key='StoreDate',
        tags=['mart', 'stores', 'metrics']
    )
}}

WITH interactions AS (
    SELECT
        StoreID,
        CAST(InteractionDate AS DATE) AS InteractionDate,
        COUNT(*) AS InteractionCount,
        COUNT(DISTINCT CustomerID) AS UniqueCustomers,
        COUNT(DISTINCT SessionID) AS UniqueSessions,
        AVG(DurationSeconds) AS AvgInteractionDurationSeconds,
        SUM(CASE WHEN InteractionType = 'purchase' THEN 1 ELSE 0 END) AS PurchaseCount,
        SUM(CASE WHEN InteractionType = 'browse' THEN 1 ELSE 0 END) AS BrowseCount,
        SUM(CASE WHEN InteractionType = 'inquiry' THEN 1 ELSE 0 END) AS InquiryCount,
        SUM(CASE WHEN InteractionType = 'return' THEN 1 ELSE 0 END) AS ReturnCount,
        SUM(CASE WHEN InteractionType = 'assistance' THEN 1 ELSE 0 END) AS AssistanceCount,
        AVG(InteractionScore) AS AvgInteractionScore
    FROM {{ ref('sales_interactions') }}
    WHERE InteractionDate IS NOT NULL
    GROUP BY StoreID, CAST(InteractionDate AS DATE)
),

brand_metrics AS (
    SELECT
        si.StoreID,
        CAST(si.InteractionDate AS DATE) AS InteractionDate,
        COUNT(DISTINCT sib.BrandID) AS UniqueBrandsMentioned,
        COUNT(sib.BrandID) AS TotalBrandMentions
    FROM {{ ref('sales_interactions') }} si
    JOIN {{ ref('sales_interaction_brands') }} sib ON si.InteractionID = sib.InteractionID
    WHERE si.InteractionDate IS NOT NULL
    GROUP BY si.StoreID, CAST(si.InteractionDate AS DATE)
),

transcript_metrics AS (
    SELECT
        si.StoreID,
        CAST(si.InteractionDate AS DATE) AS InteractionDate,
        COUNT(DISTINCT sit.TranscriptID) AS TranscriptCount,
        AVG(sit.WordCount) AS AvgWordCount,
        AVG(sit.SentimentScore) AS AvgSentimentScore
    FROM {{ ref('sales_interactions') }} si
    JOIN {{ ref('sales_interaction_transcripts') }} sit ON si.InteractionID = sit.InteractionID
    WHERE si.InteractionDate IS NOT NULL
    GROUP BY si.StoreID, CAST(si.InteractionDate AS DATE)
),

device_metrics AS (
    SELECT
        StoreID,
        CAST(LoggedAt AS DATE) AS LogDate,
        COUNT(DISTINCT DeviceID) AS ActiveDevices,
        COUNT(CASE WHEN LogLevel IN ('ERROR', 'CRITICAL') THEN 1 END) AS ErrorCount
    FROM {{ ref('bronze_device_logs') }}
    WHERE LoggedAt IS NOT NULL
    GROUP BY StoreID, CAST(LoggedAt AS DATE)
)

SELECT
    CONCAT(i.StoreID, '-', i.InteractionDate) AS StoreDate,
    i.StoreID,
    s.StoreName,
    s.City,
    s.RegionID,
    i.InteractionDate,
    i.InteractionCount,
    i.UniqueCustomers,
    i.UniqueSessions,
    i.AvgInteractionDurationSeconds,
    i.PurchaseCount,
    i.BrowseCount,
    i.InquiryCount,
    i.ReturnCount,
    i.AssistanceCount,
    i.AvgInteractionScore,
    COALESCE(bm.UniqueBrandsMentioned, 0) AS UniqueBrandsMentioned,
    COALESCE(bm.TotalBrandMentions, 0) AS TotalBrandMentions,
    COALESCE(tm.TranscriptCount, 0) AS TranscriptCount,
    COALESCE(tm.AvgWordCount, 0) AS AvgWordCount,
    COALESCE(tm.AvgSentimentScore, 0) AS AvgTranscriptSentiment,
    COALESCE(dm.ActiveDevices, 0) AS ActiveDevices,
    COALESCE(dm.ErrorCount, 0) AS DeviceErrorCount,
    -- Calculated metrics
    CASE WHEN i.BrowseCount > 0 
         THEN CAST(i.PurchaseCount AS FLOAT) / i.BrowseCount 
         ELSE 0 
    END AS BrowseToSaleConversion,
    CURRENT_TIMESTAMP() AS ProcessedAt
FROM interactions i
LEFT JOIN {{ ref('stores') }} s ON i.StoreID = s.StoreID
LEFT JOIN brand_metrics bm ON i.StoreID = bm.StoreID AND i.InteractionDate = bm.InteractionDate
LEFT JOIN transcript_metrics tm ON i.StoreID = tm.StoreID AND i.InteractionDate = tm.InteractionDate
LEFT JOIN device_metrics dm ON i.StoreID = dm.StoreID AND i.InteractionDate = dm.LogDate
WHERE s.IsActive = 1

{% if is_incremental() %}
    AND i.InteractionDate > (SELECT MAX(InteractionDate) FROM {{ this }})
{% endif %}