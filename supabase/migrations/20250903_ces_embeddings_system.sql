-- Creative Effectiveness Scoring (CES) - Embeddings and Business Outcomes Extension
-- Adds vector embeddings, RAG capabilities, and business outcome tracking

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- EMBEDDINGS AND VECTOR SEARCH TABLES
-- =====================================================

-- Creative feature embeddings for semantic similarity
CREATE TABLE ces.ces_creative_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES ces.creative_assets(id) ON DELETE CASCADE,
    campaign_id TEXT, -- Link to campaign for business outcome correlation
    
    -- Vector embeddings (1536 dimensions for OpenAI Ada v2)
    feature_embedding vector(1536) NOT NULL,
    
    -- Source text used to generate embedding
    feature_text TEXT NOT NULL,
    
    -- Embedding metadata
    embedding_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_asset_embedding UNIQUE(asset_id)
);

-- Business outcomes tracking for performance-grounded effectiveness
CREATE TABLE ces.scout_campaign_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    market TEXT DEFAULT 'global',
    
    -- Core business metrics (performance-grounded approach)
    engagement_rate DECIMAL(5,4), -- CTR, likes, shares, comments per impression
    brand_recall DECIMAL(4,3), -- Aided/unaided brand recall percentage
    conversion_rate DECIMAL(5,4), -- Purchase conversion rate
    roi DECIMAL(6,2), -- Return on investment multiplier
    sales_lift DECIMAL(4,3), -- Incremental sales lift percentage
    sentiment_score DECIMAL(4,3), -- Brand sentiment score (0-1)
    cac DECIMAL(8,2), -- Customer acquisition cost
    media_efficiency DECIMAL(5,3), -- Cost per effective reach
    behavioral_response DECIMAL(4,3), -- Behavior change/intent metrics
    brand_equity_change DECIMAL(5,4), -- Brand equity improvement
    
    -- Additional business context
    campaign_duration_days INTEGER,
    total_spend DECIMAL(12,2),
    reach_millions DECIMAL(8,2),
    frequency_avg DECIMAL(4,2),
    
    -- Attribution and measurement metadata
    measurement_methodology JSONB DEFAULT '{}', -- How metrics were measured
    attribution_model TEXT DEFAULT 'last_touch',
    measurement_period_days INTEGER DEFAULT 30,
    
    -- Market context
    competitive_context JSONB DEFAULT '{}', -- Competitive landscape during campaign
    market_conditions JSONB DEFAULT '{}', -- Economic/social conditions
    
    -- Timestamps
    campaign_start_date DATE,
    campaign_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_campaign_outcome UNIQUE(campaign_id)
);

-- Campaign-asset relationships for outcome correlation
CREATE TABLE ces.scout_campaign_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    asset_id UUID NOT NULL REFERENCES ces.creative_assets(id) ON DELETE CASCADE,
    
    -- Asset role in campaign
    asset_role TEXT NOT NULL, -- 'hero', 'supporting', 'variant_a', 'variant_b'
    media_channels TEXT[] DEFAULT '{}', -- Where this asset was used
    spend_allocation DECIMAL(4,3), -- Percentage of campaign spend on this asset
    impression_share DECIMAL(4,3), -- Percentage of campaign impressions
    
    -- Asset-specific performance (if measurable)
    asset_engagement_rate DECIMAL(5,4),
    asset_conversion_rate DECIMAL(5,4),
    asset_sentiment_score DECIMAL(4,3),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_campaign_asset UNIQUE(campaign_id, asset_id)
);

-- Effectiveness benchmarks from external sources (WARC, D&AD, Cannes)
CREATE TABLE ces.scout_effectiveness_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'warc_effective_100', 'daivid', 'cannes_lions', 'effie_awards'
    
    -- Campaign identification
    campaign_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    market TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER NOT NULL,
    
    -- Benchmark metrics (standardized to match our schema)
    benchmark_engagement_rate DECIMAL(5,4),
    benchmark_brand_recall DECIMAL(4,3),
    benchmark_conversion_rate DECIMAL(5,4),
    benchmark_roi DECIMAL(6,2),
    benchmark_sales_lift DECIMAL(4,3),
    benchmark_sentiment_score DECIMAL(4,3),
    
    -- Awards and recognition
    awards_won TEXT[],
    effectiveness_score DECIMAL(4,2), -- Overall effectiveness rating
    
    -- Creative description for similarity matching
    creative_description TEXT,
    creative_elements TEXT[], -- Visual, emotional, strategic elements
    
    -- Source metadata
    source_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_benchmark UNIQUE(source, campaign_name, brand, year)
);

-- RAG knowledge base for creative insights and recommendations
CREATE TABLE ces.ces_creative_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Insight classification
    insight_type TEXT NOT NULL, -- 'optimization', 'pattern', 'benchmark', 'prediction'
    category TEXT NOT NULL, -- 'visual', 'emotional', 'brand', 'performance'
    confidence DECIMAL(4,3) NOT NULL,
    
    -- Insight content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    insight_data JSONB DEFAULT '{}', -- Structured insight data
    
    -- Source assets/campaigns that generated this insight
    source_assets UUID[] DEFAULT '{}',
    source_campaigns TEXT[] DEFAULT '{}',
    
    -- Applicability filters
    applicable_brands TEXT[] DEFAULT '{}',
    applicable_markets TEXT[] DEFAULT '{}',
    applicable_categories TEXT[] DEFAULT '{}',
    
    -- Insight embedding for semantic search
    insight_embedding vector(1536),
    
    -- Performance tracking
    times_applied INTEGER DEFAULT 0,
    success_rate DECIMAL(4,3) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Vector similarity search indexes
CREATE INDEX idx_creative_embeddings_vector ON ces.creative_embeddings 
USING ivfflat (feature_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_creative_insights_vector ON ces.creative_insights 
USING ivfflat (insight_embedding vector_cosine_ops) WITH (lists = 100);

-- Business outcome analysis indexes
CREATE INDEX idx_campaign_outcomes_brand_market ON ces.campaign_outcomes(brand, market);
CREATE INDEX idx_campaign_outcomes_roi_desc ON ces.campaign_outcomes(roi DESC);
CREATE INDEX idx_campaign_outcomes_engagement_desc ON ces.campaign_outcomes(engagement_rate DESC);

-- Campaign asset relationship indexes
CREATE INDEX idx_campaign_assets_campaign ON ces.campaign_assets(campaign_id);
CREATE INDEX idx_campaign_assets_asset ON ces.campaign_assets(asset_id);
CREATE INDEX idx_campaign_assets_role ON ces.campaign_assets(asset_role);

-- Benchmark search indexes
CREATE INDEX idx_benchmarks_source_year ON ces.effectiveness_benchmarks(source, year DESC);
CREATE INDEX idx_benchmarks_brand_category ON ces.effectiveness_benchmarks(brand, category);
CREATE INDEX idx_benchmarks_effectiveness_desc ON ces.effectiveness_benchmarks(effectiveness_score DESC);

-- Insight retrieval indexes
CREATE INDEX idx_insights_type_category ON ces.creative_insights(insight_type, category);
CREATE INDEX idx_insights_confidence_desc ON ces.creative_insights(confidence DESC);
CREATE INDEX idx_insights_success_rate_desc ON ces.creative_insights(success_rate DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ces.creative_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.campaign_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.effectiveness_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.creative_insights ENABLE ROW LEVEL SECURITY;

-- Embeddings access (linked to asset permissions)
CREATE POLICY "Embeddings read access" ON ces.creative_embeddings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM ces.creative_assets a 
        WHERE a.id = creative_embeddings.asset_id 
        AND (auth.jwt() ->> 'role' = ANY(ARRAY['creative_analyst', 'brand_manager', 'admin']))
    ));

CREATE POLICY "Embeddings write access" ON ces.creative_embeddings FOR ALL
    USING (auth.jwt() ->> 'role' = ANY(ARRAY['creative_analyst', 'admin']));

-- Business outcomes access (brand-filtered)
CREATE POLICY "Campaign outcomes read access" ON ces.campaign_outcomes FOR SELECT
    USING (
        auth.jwt() ->> 'role' = ANY(ARRAY['brand_manager', 'creative_analyst', 'admin'])
        OR auth.jwt() ->> 'brand' = brand
    );

CREATE POLICY "Campaign outcomes write access" ON ces.campaign_outcomes FOR ALL
    USING (
        auth.jwt() ->> 'role' = ANY(ARRAY['brand_manager', 'admin'])
        OR auth.jwt() ->> 'brand' = brand
    );

-- Campaign assets (filtered by campaign access)
CREATE POLICY "Campaign assets access" ON ces.campaign_assets FOR ALL
    USING (EXISTS (
        SELECT 1 FROM ces.campaign_outcomes co 
        WHERE co.campaign_id = campaign_assets.campaign_id
        AND (
            auth.jwt() ->> 'role' = ANY(ARRAY['brand_manager', 'creative_analyst', 'admin'])
            OR auth.jwt() ->> 'brand' = co.brand
        )
    ));

-- Benchmarks (read-only for most users)
CREATE POLICY "Benchmarks read access" ON ces.effectiveness_benchmarks FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);

CREATE POLICY "Benchmarks write access" ON ces.effectiveness_benchmarks FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Creative insights (shared knowledge base)
CREATE POLICY "Insights read access" ON ces.creative_insights FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);

CREATE POLICY "Insights write access" ON ces.creative_insights FOR ALL
    USING (auth.jwt() ->> 'role' = ANY(ARRAY['creative_analyst', 'admin']));

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to find similar campaigns by creative features
CREATE OR REPLACE FUNCTION ces.find_similar_campaigns_scout(
    query_embedding vector(1536),
    similarity_threshold DECIMAL DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    asset_id UUID,
    campaign_id TEXT,
    similarity_score DECIMAL,
    engagement_rate DECIMAL,
    roi DECIMAL,
    brand_recall DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.asset_id,
        ce.campaign_id,
        (1 - (ce.feature_embedding <=> query_embedding))::DECIMAL AS similarity_score,
        co.engagement_rate,
        co.roi,
        co.brand_recall
    FROM ces.creative_embeddings ce
    LEFT JOIN ces.campaign_outcomes co ON ce.campaign_id = co.campaign_id
    WHERE (1 - (ce.feature_embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance predictions based on similar campaigns
CREATE OR REPLACE FUNCTION ces.predict_campaign_performance_neural(
    query_embedding vector(1536),
    target_brand TEXT DEFAULT NULL,
    target_market TEXT DEFAULT 'global'
)
RETURNS JSON AS $$
DECLARE
    similar_campaigns_data JSON;
    prediction_data JSON;
BEGIN
    -- Find similar campaigns with outcomes
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'similarity_score', similarity_score,
            'engagement_rate', engagement_rate,
            'roi', roi,
            'brand_recall', brand_recall,
            'conversion_rate', co.conversion_rate,
            'sales_lift', co.sales_lift,
            'sentiment_score', co.sentiment_score
        )
    ) INTO similar_campaigns_data
    FROM ces.find_similar_campaigns(query_embedding, 0.6, 15) sc
    LEFT JOIN ces.campaign_outcomes co ON sc.campaign_id = co.campaign_id
    WHERE co.campaign_id IS NOT NULL;

    -- Calculate weighted predictions
    WITH weighted_predictions AS (
        SELECT 
            SUM(similarity_score * engagement_rate) / SUM(similarity_score) AS pred_engagement_rate,
            SUM(similarity_score * roi) / SUM(similarity_score) AS pred_roi,
            SUM(similarity_score * brand_recall) / SUM(similarity_score) AS pred_brand_recall,
            AVG(similarity_score) AS avg_similarity,
            COUNT(*) AS similar_count
        FROM JSON_TO_RECORDSET(similar_campaigns_data) AS x(
            similarity_score DECIMAL,
            engagement_rate DECIMAL,
            roi DECIMAL,
            brand_recall DECIMAL,
            conversion_rate DECIMAL,
            sales_lift DECIMAL,
            sentiment_score DECIMAL
        )
    )
    SELECT JSON_BUILD_OBJECT(
        'predicted_engagement_rate', COALESCE(pred_engagement_rate, 0.025),
        'predicted_roi', COALESCE(pred_roi, 1.8),
        'predicted_brand_recall', COALESCE(pred_brand_recall, 0.45),
        'confidence', LEAST(COALESCE(avg_similarity, 0.3), 0.95),
        'similar_campaigns_found', COALESCE(similar_count, 0),
        'prediction_method', CASE 
            WHEN similar_count > 0 THEN 'similarity_weighted_average'
            ELSE 'market_baseline'
        END
    ) INTO prediction_data
    FROM weighted_predictions;

    RETURN prediction_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve relevant creative insights using RAG
CREATE OR REPLACE FUNCTION ces.get_creative_insights_ces(
    query_text TEXT,
    insight_categories TEXT[] DEFAULT ARRAY['visual', 'emotional', 'brand', 'performance'],
    max_results INTEGER DEFAULT 5
)
RETURNS JSON AS $$
DECLARE
    insights_data JSON;
BEGIN
    -- In production, this would generate an embedding for query_text
    -- and perform vector similarity search on insight_embedding
    
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', id,
            'title', title,
            'description', description,
            'insight_type', insight_type,
            'category', category,
            'confidence', confidence,
            'success_rate', success_rate,
            'times_applied', times_applied,
            'insight_data', insight_data
        )
    ) INTO insights_data
    FROM ces.creative_insights
    WHERE category = ANY(insight_categories)
    AND confidence >= 0.7
    ORDER BY success_rate DESC, confidence DESC
    LIMIT max_results;

    RETURN COALESCE(insights_data, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =====================================================

-- Insert sample effectiveness benchmarks
INSERT INTO ces.effectiveness_benchmarks (
    source, campaign_name, brand, market, category, year,
    benchmark_engagement_rate, benchmark_brand_recall, benchmark_roi, benchmark_sales_lift,
    awards_won, effectiveness_score, creative_description, creative_elements
) VALUES 
(
    'warc_effective_100',
    'The Greatest Showman Nike Campaign',
    'Nike',
    'global',
    'sportswear',
    2023,
    0.048, 0.72, 3.2, 0.24,
    ARRAY['Cannes Lions Gold', 'Effie Gold'],
    9.2,
    'Emotional storytelling campaign featuring diverse athletes overcoming challenges',
    ARRAY['inspirational', 'diversity', 'achievement', 'cinematic']
),
(
    'daivid',
    'Coca-Cola Happiness Factory 2.0',
    'Coca-Cola',
    'philippines',
    'beverages',
    2023,
    0.052, 0.68, 2.8, 0.19,
    ARRAY['Local Marketing Awards'],
    8.7,
    'Interactive digital experience bringing joy and connection',
    ARRAY['interactive', 'joyful', 'community', 'digital_native']
);

-- Insert sample creative insights
INSERT INTO ces.creative_insights (
    insight_type, category, confidence, title, description, insight_data,
    applicable_brands, applicable_markets, applicable_categories
) VALUES
(
    'pattern',
    'emotional',
    0.89,
    'Aspirational storytelling drives 23% higher brand recall',
    'Campaigns featuring aspirational narratives with relatable protagonists achieve significantly higher brand recall scores compared to product-focused approaches.',
    JSON_BUILD_OBJECT(
        'lift_percentage', 0.23,
        'sample_size', 156,
        'key_elements', ARRAY['relatable_protagonist', 'growth_journey', 'authentic_challenge'],
        'optimal_duration', '30-45 seconds'
    ),
    ARRAY['nike', 'adidas', 'under_armour'],
    ARRAY['global', 'philippines', 'thailand'],
    ARRAY['sportswear', 'lifestyle']
),
(
    'optimization',
    'performance',
    0.84,
    'Logo placement in final 5 seconds increases conversion by 18%',
    'Strategic logo placement timing significantly impacts conversion rates, with final-frame positioning outperforming early placement.',
    JSON_BUILD_OBJECT(
        'conversion_lift', 0.18,
        'optimal_timing', 'final_5_seconds',
        'brand_visibility_score', 0.75,
        'testing_campaigns', 89
    ),
    ARRAY['general'],
    ARRAY['global'],
    ARRAY['general']
);

COMMENT ON SCHEMA ces IS 'Creative Effectiveness Scoring system with performance-grounded business outcome tracking, vector embeddings for semantic similarity, and RAG-powered insights';
COMMENT ON TABLE ces.creative_embeddings IS 'Vector embeddings of creative features for semantic similarity search and campaign matching';
COMMENT ON TABLE ces.campaign_outcomes IS 'Business outcome metrics for performance-grounded effectiveness measurement';
COMMENT ON TABLE ces.effectiveness_benchmarks IS 'External effectiveness benchmarks from WARC, D&AD, Cannes Lions for comparative analysis';
COMMENT ON TABLE ces.creative_insights IS 'RAG knowledge base of creative insights and optimization recommendations';