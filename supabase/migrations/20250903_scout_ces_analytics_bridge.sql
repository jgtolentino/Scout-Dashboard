-- Scout-CES Analytics Bridge Views
-- Connects Scout retail performance data with CES creative effectiveness scores
-- Enables analysis of how creative quality impacts business outcomes

-- =====================================================
-- BRIDGE VIEWS: Scout Performance + CES Effectiveness
-- =====================================================

-- Master view connecting campaigns to both performance and creative data
CREATE VIEW analytics.campaign_performance_creative AS
SELECT 
    -- Campaign identifiers
    co.campaign_id,
    co.brand,
    co.market,
    
    -- Business performance metrics (from Scout)
    co.engagement_rate,
    co.brand_recall,
    co.conversion_rate,
    co.roi,
    co.sales_lift,
    co.sentiment_score,
    co.cac,
    co.media_efficiency,
    co.behavioral_response,
    co.brand_equity_change,
    
    -- Campaign context
    co.campaign_duration_days,
    co.total_spend,
    co.reach_millions,
    co.frequency_avg,
    
    -- Creative effectiveness metrics (aggregated)
    AVG(ces.clarity_score) AS avg_clarity_score,
    AVG(ces.emotion_score) AS avg_emotion_score,
    AVG(ces.branding_score) AS avg_branding_score,
    AVG(ces.culture_score) AS avg_culture_score,
    AVG(ces.production_quality_score) AS avg_production_quality_score,
    AVG(ces.cta_score) AS avg_cta_score,
    AVG(ces.distinctiveness_score) AS avg_distinctiveness_score,
    AVG(ces.tbwa_dna_score) AS avg_tbwa_dna_score,
    AVG(ces.overall_effectiveness_score) AS avg_overall_effectiveness,
    
    -- Creative asset counts
    COUNT(DISTINCT ca.asset_id) AS total_creative_assets,
    COUNT(DISTINCT CASE WHEN ca.asset_role = 'hero' THEN ca.asset_id END) AS hero_assets,
    COUNT(DISTINCT CASE WHEN ca.asset_role = 'supporting' THEN ca.asset_id END) AS supporting_assets,
    
    -- Creative types distribution
    COUNT(DISTINCT CASE WHEN gca.file_type = 'image' THEN ca.asset_id END) AS image_assets,
    COUNT(DISTINCT CASE WHEN gca.file_type = 'video' THEN ca.asset_id END) AS video_assets,
    COUNT(DISTINCT CASE WHEN gca.file_type = 'audio' THEN ca.asset_id END) AS audio_assets,
    
    -- Performance correlation indicators
    CASE 
        WHEN AVG(ces.overall_effectiveness_score) >= 8.0 THEN 'high_creative'
        WHEN AVG(ces.overall_effectiveness_score) >= 6.0 THEN 'medium_creative'
        ELSE 'low_creative'
    END AS creative_effectiveness_tier,
    
    CASE 
        WHEN co.roi >= 3.0 THEN 'high_performance'
        WHEN co.roi >= 2.0 THEN 'medium_performance'
        ELSE 'low_performance'
    END AS business_performance_tier

FROM ces.campaign_outcomes co
LEFT JOIN ces.campaign_assets ca ON co.campaign_id = ca.campaign_id
LEFT JOIN ces.creative_assets ces_assets ON ca.asset_id = ces_assets.id
LEFT JOIN ces.creative_scores ces ON ces_assets.id = ces.asset_id
LEFT JOIN creative_ops.gold_creative_assets gca ON ces_assets.source_file = gca.source_file
GROUP BY 
    co.campaign_id, co.brand, co.market, co.engagement_rate, co.brand_recall,
    co.conversion_rate, co.roi, co.sales_lift, co.sentiment_score, co.cac,
    co.media_efficiency, co.behavioral_response, co.brand_equity_change,
    co.campaign_duration_days, co.total_spend, co.reach_millions, co.frequency_avg;

-- Creative effectiveness impact analysis
CREATE VIEW analytics.creative_effectiveness_impact AS
SELECT 
    creative_effectiveness_tier,
    business_performance_tier,
    COUNT(*) AS campaign_count,
    AVG(roi) AS avg_roi,
    AVG(engagement_rate) AS avg_engagement_rate,
    AVG(brand_recall) AS avg_brand_recall,
    AVG(conversion_rate) AS avg_conversion_rate,
    AVG(sales_lift) AS avg_sales_lift,
    AVG(avg_overall_effectiveness) AS avg_creative_score,
    
    -- Performance lift analysis
    AVG(roi) - (SELECT AVG(roi) FROM analytics.campaign_performance_creative WHERE creative_effectiveness_tier = 'low_creative') AS roi_lift_vs_low_creative,
    AVG(engagement_rate) - (SELECT AVG(engagement_rate) FROM analytics.campaign_performance_creative WHERE creative_effectiveness_tier = 'low_creative') AS engagement_lift_vs_low_creative,
    AVG(brand_recall) - (SELECT AVG(brand_recall) FROM analytics.campaign_performance_creative WHERE creative_effectiveness_tier = 'low_creative') AS recall_lift_vs_low_creative,
    
    -- Statistical confidence
    STDDEV(roi) AS roi_stddev,
    COUNT(*) AS sample_size
    
FROM analytics.campaign_performance_creative
GROUP BY creative_effectiveness_tier, business_performance_tier
ORDER BY creative_effectiveness_tier DESC, business_performance_tier DESC;

-- Asset-level performance correlation
CREATE VIEW analytics.asset_performance_correlation AS
SELECT 
    ca.asset_id,
    ca.campaign_id,
    ca.asset_role,
    gca.file_type,
    gca.file_size_mb,
    
    -- Creative scores
    ces.clarity_score,
    ces.emotion_score,
    ces.branding_score,
    ces.culture_score,
    ces.production_quality_score,
    ces.cta_score,
    ces.distinctiveness_score,
    ces.tbwa_dna_score,
    ces.overall_effectiveness_score,
    
    -- Asset-specific performance (when available)
    ca.asset_engagement_rate,
    ca.asset_conversion_rate,
    ca.asset_sentiment_score,
    ca.spend_allocation,
    ca.impression_share,
    
    -- Campaign performance (for correlation)
    co.roi AS campaign_roi,
    co.engagement_rate AS campaign_engagement_rate,
    co.brand_recall AS campaign_brand_recall,
    
    -- Performance attribution
    CASE 
        WHEN ca.spend_allocation > 0 THEN co.roi * ca.spend_allocation
        ELSE NULL
    END AS attributed_roi,
    
    CASE 
        WHEN ca.impression_share > 0 THEN co.engagement_rate * ca.impression_share
        ELSE NULL
    END AS attributed_engagement

FROM ces.campaign_assets ca
JOIN ces.creative_assets ces_assets ON ca.asset_id = ces_assets.id
LEFT JOIN ces.creative_scores ces ON ces_assets.id = ces.asset_id
LEFT JOIN creative_ops.gold_creative_assets gca ON ces_assets.source_file = gca.source_file
LEFT JOIN ces.campaign_outcomes co ON ca.campaign_id = co.campaign_id;

-- Brand performance by creative DNA alignment
CREATE VIEW analytics.brand_creative_dna_performance AS
SELECT 
    co.brand,
    co.market,
    
    -- TBWA DNA alignment metrics
    AVG(ces.tbwa_dna_score) AS avg_tbwa_dna_alignment,
    AVG(ces.distinctiveness_score) AS avg_distinctiveness,
    AVG(ces.branding_score) AS avg_branding_strength,
    
    -- Business performance by DNA alignment
    AVG(co.roi) AS avg_roi,
    AVG(co.brand_equity_change) AS avg_brand_equity_change,
    AVG(co.sentiment_score) AS avg_sentiment,
    
    -- DNA alignment tiers
    COUNT(CASE WHEN ces.tbwa_dna_score >= 8.0 THEN 1 END) AS high_dna_alignment_assets,
    COUNT(CASE WHEN ces.tbwa_dna_score BETWEEN 6.0 AND 7.9 THEN 1 END) AS medium_dna_alignment_assets,
    COUNT(CASE WHEN ces.tbwa_dna_score < 6.0 THEN 1 END) AS low_dna_alignment_assets,
    
    -- Performance correlation with DNA
    CORR(ces.tbwa_dna_score, co.roi) AS dna_roi_correlation,
    CORR(ces.tbwa_dna_score, co.brand_equity_change) AS dna_brand_equity_correlation,
    CORR(ces.distinctiveness_score, co.engagement_rate) AS distinctiveness_engagement_correlation,
    
    COUNT(DISTINCT co.campaign_id) AS total_campaigns,
    COUNT(DISTINCT ca.asset_id) AS total_assets

FROM ces.campaign_outcomes co
JOIN ces.campaign_assets ca ON co.campaign_id = ca.campaign_id
JOIN ces.creative_assets ces_assets ON ca.asset_id = ces_assets.id
LEFT JOIN ces.creative_scores ces ON ces_assets.id = ces.asset_id
GROUP BY co.brand, co.market
HAVING COUNT(DISTINCT co.campaign_id) >= 3 -- Minimum campaigns for meaningful correlation
ORDER BY avg_roi DESC, avg_tbwa_dna_alignment DESC;

-- Creative feature effectiveness patterns
CREATE VIEW analytics.creative_feature_effectiveness AS
SELECT 
    -- Extract common creative features from features_extracted
    jsonb_extract_path_text(gca.features_extracted, 'visual_elements') AS visual_elements,
    jsonb_extract_path_text(gca.features_extracted, 'dominant_colors') AS dominant_colors,
    jsonb_extract_path_text(gca.features_extracted, 'text_content') AS text_content_detected,
    jsonb_extract_path_text(gca.features_extracted, 'audio_features', 'genre') AS audio_genre,
    
    -- Creative effectiveness
    AVG(ces.overall_effectiveness_score) AS avg_effectiveness_score,
    AVG(ces.emotion_score) AS avg_emotion_score,
    AVG(ces.branding_score) AS avg_branding_score,
    
    -- Business performance
    AVG(co.roi) AS avg_roi,
    AVG(co.engagement_rate) AS avg_engagement_rate,
    AVG(co.brand_recall) AS avg_brand_recall,
    
    -- Usage statistics
    COUNT(DISTINCT ca.campaign_id) AS campaigns_using_feature,
    COUNT(DISTINCT ca.asset_id) AS assets_with_feature,
    
    -- Feature effectiveness ranking
    RANK() OVER (ORDER BY AVG(ces.overall_effectiveness_score) DESC) AS effectiveness_rank,
    RANK() OVER (ORDER BY AVG(co.roi) DESC) AS roi_rank

FROM creative_ops.gold_creative_assets gca
JOIN ces.creative_assets ces_assets ON gca.source_file = ces_assets.source_file
LEFT JOIN ces.creative_scores ces ON ces_assets.id = ces.asset_id
LEFT JOIN ces.campaign_assets ca ON ces_assets.id = ca.asset_id
LEFT JOIN ces.campaign_outcomes co ON ca.campaign_id = co.campaign_id
WHERE gca.features_extracted IS NOT NULL
GROUP BY 
    jsonb_extract_path_text(gca.features_extracted, 'visual_elements'),
    jsonb_extract_path_text(gca.features_extracted, 'dominant_colors'),
    jsonb_extract_path_text(gca.features_extracted, 'text_content'),
    jsonb_extract_path_text(gca.features_extracted, 'audio_features', 'genre')
HAVING COUNT(DISTINCT ca.campaign_id) >= 2 -- Minimum campaigns for pattern recognition
ORDER BY avg_effectiveness_score DESC, avg_roi DESC;

-- Scout retail data integration bridge
CREATE VIEW analytics.scout_retail_creative_bridge AS
SELECT 
    -- Scout retail metrics (from store performance data)
    sr.store_id,
    sr.store_name,
    sr.location,
    sr.market AS store_market,
    
    -- Retail performance
    SUM(sr.total_revenue) AS total_retail_revenue,
    AVG(sr.avg_transaction_value) AS avg_transaction_value,
    SUM(sr.customer_count) AS total_customers,
    AVG(sr.customer_satisfaction_score) AS avg_satisfaction,
    
    -- Creative campaigns active during retail period
    co.brand,
    co.campaign_id,
    co.market AS campaign_market,
    AVG(ces.overall_effectiveness_score) AS avg_creative_effectiveness,
    
    -- Cross-schema correlation
    CASE 
        WHEN co.market = sr.market AND AVG(ces.overall_effectiveness_score) >= 8.0 
        THEN 'high_creative_market_match'
        WHEN co.market = sr.market AND AVG(ces.overall_effectiveness_score) >= 6.0 
        THEN 'medium_creative_market_match'
        WHEN co.market = sr.market 
        THEN 'low_creative_market_match'
        ELSE 'no_market_match'
    END AS creative_market_alignment,
    
    -- Performance lift analysis
    AVG(sr.total_revenue) - LAG(AVG(sr.total_revenue)) OVER (
        PARTITION BY sr.store_id 
        ORDER BY co.campaign_start_date
    ) AS revenue_lift_vs_previous,
    
    co.campaign_start_date,
    co.campaign_end_date

FROM scout.gold_store_performance sr
CROSS JOIN ces.campaign_outcomes co
JOIN ces.campaign_assets ca ON co.campaign_id = ca.campaign_id
JOIN ces.creative_assets ces_assets ON ca.asset_id = ces_assets.id
LEFT JOIN ces.creative_scores ces ON ces_assets.id = ces.asset_id
WHERE 
    -- Campaign overlaps with retail data period
    sr.date_recorded BETWEEN co.campaign_start_date AND co.campaign_end_date + INTERVAL '30 days'
    -- Same brand (assuming Scout stores are mapped to brands)
    AND sr.brand = co.brand
GROUP BY 
    sr.store_id, sr.store_name, sr.location, sr.market,
    co.brand, co.campaign_id, co.market, co.campaign_start_date, co.campaign_end_date
ORDER BY total_retail_revenue DESC, avg_creative_effectiveness DESC;

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- High-performance materialized view for dashboard queries
CREATE MATERIALIZED VIEW analytics.campaign_performance_creative_summary AS
SELECT 
    campaign_id,
    brand,
    market,
    roi,
    engagement_rate,
    brand_recall,
    avg_overall_effectiveness,
    creative_effectiveness_tier,
    business_performance_tier,
    total_creative_assets,
    campaign_duration_days,
    total_spend
FROM analytics.campaign_performance_creative;

-- Create index for fast lookups
CREATE INDEX idx_campaign_summary_brand_market ON analytics.campaign_performance_creative_summary(brand, market);
CREATE INDEX idx_campaign_summary_tiers ON analytics.campaign_performance_creative_summary(creative_effectiveness_tier, business_performance_tier);
CREATE INDEX idx_campaign_summary_roi ON analytics.campaign_performance_creative_summary(roi DESC);

-- Refresh function for materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_campaign_summary_scout()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW analytics.campaign_performance_creative_summary;
    -- Log refresh
    INSERT INTO scout.etl_execution_log (
        execution_id, step_name, status, message, execution_time
    ) VALUES (
        gen_random_uuid(), 'refresh_campaign_summary', 'completed', 
        'Campaign summary materialized view refreshed', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES FOR ANALYTICS VIEWS
-- =====================================================

-- Enable RLS on analytics schema (if not already enabled)
ALTER SCHEMA analytics OWNER TO postgres;

-- Grant access to analytics views based on existing CES permissions
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO anon;

-- =====================================================
-- UTILITY FUNCTIONS FOR CROSS-SCHEMA ANALYSIS
-- =====================================================

-- Function to calculate creative ROI impact
CREATE OR REPLACE FUNCTION analytics.calculate_creative_roi_impact_ces(
    target_brand TEXT DEFAULT NULL,
    target_market TEXT DEFAULT 'global'
)
RETURNS TABLE (
    creative_tier TEXT,
    avg_roi DECIMAL,
    roi_lift_percentage DECIMAL,
    confidence_interval_95 DECIMAL,
    sample_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH creative_performance AS (
        SELECT 
            creative_effectiveness_tier,
            AVG(roi) as tier_roi,
            STDDEV(roi) as roi_stddev,
            COUNT(*) as tier_count
        FROM analytics.campaign_performance_creative
        WHERE (target_brand IS NULL OR brand = target_brand)
        AND market = target_market
        GROUP BY creative_effectiveness_tier
    ),
    baseline AS (
        SELECT tier_roi as baseline_roi 
        FROM creative_performance 
        WHERE creative_effectiveness_tier = 'low_creative'
    )
    SELECT 
        cp.creative_effectiveness_tier::TEXT,
        cp.tier_roi::DECIMAL,
        ((cp.tier_roi - b.baseline_roi) / b.baseline_roi * 100)::DECIMAL,
        (1.96 * cp.roi_stddev / SQRT(cp.tier_count))::DECIMAL, -- 95% confidence interval
        cp.tier_count::INTEGER
    FROM creative_performance cp
    CROSS JOIN baseline b
    ORDER BY cp.tier_roi DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON SCHEMA analytics IS 'Cross-schema analytics bridge connecting Scout retail performance with CES creative effectiveness data';
COMMENT ON VIEW analytics.campaign_performance_creative IS 'Master view connecting campaigns to both performance and creative effectiveness metrics';
COMMENT ON VIEW analytics.creative_effectiveness_impact IS 'Analysis of how creative effectiveness tiers impact business performance';
COMMENT ON VIEW analytics.asset_performance_correlation IS 'Asset-level correlation between creative scores and performance metrics';
COMMENT ON VIEW analytics.brand_creative_dna_performance IS 'Brand performance analysis by TBWA DNA alignment';
COMMENT ON MATERIALIZED VIEW analytics.campaign_performance_creative_summary IS 'High-performance summary for dashboard queries';