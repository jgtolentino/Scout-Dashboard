{{
    config(
        materialized='incremental',
        unique_key='InteractionID',
        tags=['mart', 'sales']
    )
}}

WITH devices AS (
    SELECT * FROM {{ ref('edge_device_registry') }}
),

customers AS (
    SELECT * FROM {{ ref('customers') }}
),

stores AS (
    SELECT * FROM {{ ref('stores') }}
),

transcripts AS (
    SELECT 
        InteractionID,
        STRING_AGG(TranscriptText, ' | ') AS AllTranscripts,
        COUNT(*) AS TranscriptCount,
        MAX(SentimentScore) AS MaxSentimentScore,
        MIN(SentimentScore) AS MinSentimentScore,
        AVG(SentimentScore) AS AvgSentimentScore,
        SUM(WordCount) AS TotalWordCount
    FROM {{ ref('sales_interaction_transcripts') }}
    GROUP BY InteractionID
),

brand_mentions AS (
    SELECT
        sib.InteractionID,
        COUNT(DISTINCT sib.BrandID) AS BrandCount,
        STRING_AGG(b.BrandName, ', ') AS BrandsMentioned,
        AVG(sib.SentimentScore) AS AvgBrandSentiment
    FROM {{ ref('sales_interaction_brands') }} sib
    JOIN {{ ref('brands') }} b ON sib.BrandID = b.BrandID
    GROUP BY sib.InteractionID
)

SELECT
    si.InteractionID,
    si.CustomerID,
    c.CustomerName,
    c.PersonaSegment,
    si.StoreID,
    s.StoreName,
    s.City,
    s.RegionID,
    si.DeviceID,
    d.DeviceType,
    d.ZoneID,
    si.InteractionType,
    si.InteractionDate,
    si.DurationSeconds,
    si.InteractionScore,
    COALESCE(tr.AllTranscripts, '') AS Transcripts,
    COALESCE(tr.TranscriptCount, 0) AS TranscriptCount,
    COALESCE(tr.AvgSentimentScore, 0) AS AvgTranscriptSentiment,
    COALESCE(tr.TotalWordCount, 0) AS TotalWordCount,
    COALESCE(bm.BrandCount, 0) AS BrandCount,
    COALESCE(bm.BrandsMentioned, '') AS BrandsMentioned,
    COALESCE(bm.AvgBrandSentiment, 0) AS AvgBrandSentiment,
    si.IngestedAt,
    si.SessionID,
    si.SessionStart,
    si.SessionEnd,
    DATEDIFF(second, si.SessionStart, si.SessionEnd) AS SessionDurationSeconds,
    CURRENT_TIMESTAMP() AS ProcessedAt
FROM {{ ref('sales_interactions') }} si
LEFT JOIN devices d ON si.DeviceID = d.DeviceID
LEFT JOIN customers c ON si.CustomerID = c.CustomerID
LEFT JOIN stores s ON si.StoreID = s.StoreID
LEFT JOIN transcripts tr ON si.InteractionID = tr.InteractionID
LEFT JOIN brand_mentions bm ON si.InteractionID = bm.InteractionID
WHERE c.IsActive = 1
  AND s.IsActive = 1
  AND d.IsActive = 1

{% if is_incremental() %}
    AND si.IngestedAt > (SELECT MAX(IngestedAt) FROM {{ this }})
{% endif %}