{{
    config(
        materialized='incremental',
        unique_key='BrandDate',
        tags=['mart', 'brands', 'metrics']
    )
}}

WITH brand_interactions AS (
    SELECT
        sib.BrandID,
        b.BrandName,
        b.CategoryID,
        c.CategoryName,
        CAST(si.InteractionDate AS DATE) AS InteractionDate,
        si.StoreID,
        s.StoreName,
        s.RegionID,
        COUNT(DISTINCT si.InteractionID) AS InteractionCount,
        COUNT(DISTINCT si.CustomerID) AS UniqueCustomers,
        SUM(CASE WHEN si.InteractionType = 'purchase' THEN 1 ELSE 0 END) AS PurchaseCount,
        AVG(sib.SentimentScore) AS AvgSentimentScore,
        COUNT(CASE WHEN sib.MentionType = 'explicit' THEN 1 END) AS ExplicitMentions,
        COUNT(CASE WHEN sib.MentionType = 'implicit' THEN 1 END) AS ImplicitMentions,
        COUNT(CASE WHEN sib.MentionType = 'visual' THEN 1 END) AS VisualMentions
    FROM {{ ref('sales_interaction_brands') }} sib
    JOIN {{ ref('sales_interactions') }} si ON sib.InteractionID = si.InteractionID
    JOIN {{ ref('brands') }} b ON sib.BrandID = b.BrandID
    JOIN {{ ref('stores') }} s ON si.StoreID = s.StoreID
    LEFT JOIN {{ ref('categories') }} c ON b.CategoryID = c.CategoryID
    WHERE si.InteractionDate IS NOT NULL
      AND b.IsActive = 1
      AND s.IsActive = 1
    GROUP BY 
        sib.BrandID,
        b.BrandName,
        b.CategoryID,
        c.CategoryName,
        CAST(si.InteractionDate AS DATE),
        si.StoreID,
        s.StoreName,
        s.RegionID
),

brand_sentiment_trends AS (
    SELECT
        BrandID,
        InteractionDate,
        AvgSentimentScore - LAG(AvgSentimentScore, 7) OVER (
            PARTITION BY BrandID, StoreID 
            ORDER BY InteractionDate
        ) AS SentimentTrend7Day
    FROM brand_interactions
)

SELECT
    CONCAT(bi.BrandID, '-', bi.StoreID, '-', bi.InteractionDate) AS BrandDate,
    bi.BrandID,
    bi.BrandName,
    bi.CategoryID,
    bi.CategoryName,
    bi.InteractionDate,
    bi.StoreID,
    bi.StoreName,
    bi.RegionID,
    bi.InteractionCount,
    bi.UniqueCustomers,
    bi.PurchaseCount,
    bi.AvgSentimentScore,
    bi.ExplicitMentions,
    bi.ImplicitMentions,
    bi.VisualMentions,
    bi.ExplicitMentions + bi.ImplicitMentions + bi.VisualMentions AS TotalMentions,
    COALESCE(bst.SentimentTrend7Day, 0) AS SentimentTrend7Day,
    -- Brand Share of Voice (within category)
    bi.InteractionCount / NULLIF(SUM(bi.InteractionCount) OVER (
        PARTITION BY bi.CategoryID, bi.StoreID, bi.InteractionDate
    ), 0) AS CategoryShareOfVoice,
    -- Brand Share of Voice (overall)
    bi.InteractionCount / NULLIF(SUM(bi.InteractionCount) OVER (
        PARTITION BY bi.StoreID, bi.InteractionDate
    ), 0) AS OverallShareOfVoice,
    CURRENT_TIMESTAMP() AS ProcessedAt
FROM brand_interactions bi
LEFT JOIN brand_sentiment_trends bst 
    ON bi.BrandID = bst.BrandID 
    AND bi.InteractionDate = bst.InteractionDate

{% if is_incremental() %}
    WHERE bi.InteractionDate > (SELECT MAX(InteractionDate) FROM {{ this }})
{% endif %}