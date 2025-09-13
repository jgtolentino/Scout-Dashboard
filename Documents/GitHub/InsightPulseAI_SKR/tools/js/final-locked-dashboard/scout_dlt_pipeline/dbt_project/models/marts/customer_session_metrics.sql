{{
    config(
        materialized='incremental',
        unique_key='SessionID',
        tags=['mart', 'customers', 'sessions']
    )
}}

WITH session_interactions AS (
    SELECT
        SessionID,
        CustomerID,
        StoreID,
        MIN(SessionStart) AS SessionStart,
        MAX(SessionEnd) AS SessionEnd,
        COUNT(*) AS InteractionCount,
        SUM(CASE WHEN InteractionType = 'browse' THEN 1 ELSE 0 END) AS BrowseCount,
        SUM(CASE WHEN InteractionType = 'purchase' THEN 1 ELSE 0 END) AS PurchaseCount,
        SUM(CASE WHEN InteractionType = 'inquiry' THEN 1 ELSE 0 END) AS InquiryCount,
        SUM(CASE WHEN InteractionType = 'assistance' THEN 1 ELSE 0 END) AS AssistanceCount,
        AVG(InteractionScore) AS AvgInteractionScore
    FROM {{ ref('sales_interactions') }}
    WHERE SessionID IS NOT NULL 
      AND SessionStart IS NOT NULL
      AND SessionEnd IS NOT NULL
    GROUP BY SessionID, CustomerID, StoreID
),

session_transcripts AS (
    SELECT
        si.SessionID,
        COUNT(DISTINCT sit.TranscriptID) AS TranscriptCount,
        STRING_AGG(sit.TranscriptText, ' | ') AS SessionTranscripts,
        AVG(sit.SentimentScore) AS AvgSentimentScore,
        SUM(sit.WordCount) AS TotalWordCount
    FROM {{ ref('sales_interactions') }} si
    JOIN {{ ref('sales_interaction_transcripts') }} sit ON si.InteractionID = sit.InteractionID
    WHERE si.SessionID IS NOT NULL
    GROUP BY si.SessionID
),

session_brands AS (
    SELECT
        si.SessionID,
        COUNT(DISTINCT sib.BrandID) AS UniqueBrands,
        STRING_AGG(b.BrandName, ', ') AS Brands
    FROM {{ ref('sales_interactions') }} si
    JOIN {{ ref('sales_interaction_brands') }} sib ON si.InteractionID = sib.InteractionID
    JOIN {{ ref('brands') }} b ON sib.BrandID = b.BrandID
    WHERE si.SessionID IS NOT NULL
    GROUP BY si.SessionID
)

SELECT
    si.SessionID,
    si.CustomerID,
    c.CustomerName,
    c.PersonaSegment,
    si.StoreID,
    s.StoreName,
    s.RegionID,
    si.SessionStart,
    si.SessionEnd,
    DATEDIFF(second, si.SessionStart, si.SessionEnd) AS SessionDurationSeconds,
    si.InteractionCount,
    si.BrowseCount,
    si.PurchaseCount,
    si.InquiryCount,
    si.AssistanceCount,
    si.AvgInteractionScore,
    COALESCE(st.TranscriptCount, 0) AS TranscriptCount,
    COALESCE(st.AvgSentimentScore, 0) AS AvgTranscriptSentiment,
    COALESCE(st.TotalWordCount, 0) AS TotalWordCount,
    COALESCE(sb.UniqueBrands, 0) AS UniqueBrandsMentioned,
    COALESCE(sb.Brands, '') AS BrandsMentioned,
    COALESCE(st.SessionTranscripts, '') AS SessionTranscripts,
    -- Conversion metrics
    CASE 
        WHEN si.BrowseCount > 0 THEN 
            CAST(si.PurchaseCount AS FLOAT) / si.BrowseCount 
        ELSE 0 
    END AS BrowseToPurchaseRate,
    CASE
        WHEN si.InteractionCount > 0 THEN
            CAST(si.PurchaseCount AS FLOAT) / si.InteractionCount
        ELSE 0
    END AS InteractionToPurchaseRate,
    CURRENT_TIMESTAMP() AS ProcessedAt
FROM session_interactions si
LEFT JOIN {{ ref('customers') }} c ON si.CustomerID = c.CustomerID
LEFT JOIN {{ ref('stores') }} s ON si.StoreID = s.StoreID
LEFT JOIN session_transcripts st ON si.SessionID = st.SessionID
LEFT JOIN session_brands sb ON si.SessionID = sb.SessionID
WHERE c.IsActive = 1
  AND s.IsActive = 1

{% if is_incremental() %}
    AND si.SessionStart > (SELECT MAX(SessionStart) FROM {{ this }})
{% endif %}