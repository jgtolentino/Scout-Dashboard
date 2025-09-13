-- Creative Operations (CES) - Medallion Architecture Schema
-- Separate schema for creative effectiveness scoring with Bronze → Silver → Gold layers
-- Integrates with Scout ETL pipeline while maintaining schema separation

BEGIN;

-- Create creative_ops schema
CREATE SCHEMA IF NOT EXISTS creative_ops;

-- =====================================================
-- BRONZE LAYER - Raw creative asset ingestion
-- =====================================================

-- Bronze raw creative assets (from Google Drive)
CREATE TABLE creative_ops.ces_bronze_creative_raw (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID DEFAULT gen_random_uuid(),
    source_file TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'zip', 'json', 'csv', 'unknown')),
    
    -- File metadata
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    file_hash TEXT, -- SHA256 for deduplication
    
    -- Google Drive metadata
    drive_file_id TEXT,
    drive_folder_path TEXT,
    
    -- Raw payload (file metadata, initial analysis)
    payload JSONB NOT NULL DEFAULT '{}',
    
    -- ETL metadata
    store_id TEXT DEFAULT 'CREATIVE_OPS',
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bronze creative extractions (processed features from multimodal AI)
CREATE TABLE creative_ops.ces_bronze_creative_features (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID NOT NULL,
    source_file TEXT NOT NULL,
    
    -- Extraction metadata
    extraction_model TEXT NOT NULL, -- 'llava_critic', 'q_align', 'score2instruct'
    extraction_version TEXT DEFAULT '1.0',
    
    -- Raw extracted features
    visual_features JSONB DEFAULT '{}',
    audio_features JSONB DEFAULT '{}',
    text_features JSONB DEFAULT '{}',
    technical_features JSONB DEFAULT '{}',
    
    -- Processing metadata
    extraction_confidence DECIMAL(4,3),
    processing_time_ms INTEGER,
    
    -- Timestamps
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SILVER LAYER - Cleaned and standardized data
-- =====================================================

-- Silver creative assets (standardized, cleaned)
CREATE TABLE creative_ops.ces_silver_creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE,
    source_file TEXT NOT NULL,
    
    -- Asset identification
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'document', 'campaign_bundle')),
    campaign_id TEXT,
    brand TEXT,
    market TEXT DEFAULT 'global',
    
    -- Standardized creative features
    visual_elements TEXT[],
    audio_elements TEXT[],
    text_content TEXT[],
    brand_elements JSONB,
    technical_quality JSONB,
    
    -- TBWA 8-dimensional framework (raw scores 0-10)
    clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 10),
    emotion_score DECIMAL(3,2) CHECK (emotion_score >= 0 AND emotion_score <= 10),
    branding_score DECIMAL(3,2) CHECK (branding_score >= 0 AND branding_score <= 10),
    culture_score DECIMAL(3,2) CHECK (culture_score >= 0 AND culture_score <= 10),
    production_score DECIMAL(3,2) CHECK (production_score >= 0 AND production_score <= 10),
    cta_score DECIMAL(3,2) CHECK (cta_score >= 0 AND cta_score <= 10),
    distinctiveness_score DECIMAL(3,2) CHECK (distinctiveness_score >= 0 AND distinctiveness_score <= 10),
    tbwa_dna_score DECIMAL(3,2) CHECK (tbwa_dna_score >= 0 AND tbwa_dna_score <= 10),
    
    -- Composite scores
    overall_ces_score DECIMAL(4,2) GENERATED ALWAYS AS (
        (clarity_score + emotion_score + branding_score + culture_score + 
         production_score + cta_score + distinctiveness_score + tbwa_dna_score) / 8.0
    ) STORED,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Silver campaign metadata (standardized campaign info)
CREATE TABLE creative_ops.scout_silver_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL UNIQUE,
    source_file TEXT,
    
    -- Campaign details
    campaign_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    market TEXT NOT NULL,
    category TEXT,
    campaign_type TEXT, -- 'awareness', 'conversion', 'retention'
    
    -- Campaign period
    start_date DATE,
    end_date DATE,
    duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
    
    -- Target audience
    target_audience TEXT,
    target_demographics JSONB DEFAULT '{}',
    
    -- Business objectives
    business_goals TEXT[],
    kpi_targets JSONB DEFAULT '{}',
    
    -- Media context
    media_channels TEXT[],
    total_budget DECIMAL(12,2),
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GOLD LAYER - Business-ready analytics tables
-- =====================================================

-- Gold creative effectiveness facts
CREATE TABLE creative_ops.ces_fact_creative_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES creative_ops.silver_creative_assets(asset_id),
    campaign_id TEXT REFERENCES creative_ops.silver_campaigns(campaign_id),
    source_file TEXT NOT NULL,
    
    -- Creative identifiers
    brand TEXT NOT NULL,
    market TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    
    -- TBWA 8-dimensional scores (normalized to 0-100)
    clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
    emotion_score INTEGER CHECK (emotion_score >= 0 AND emotion_score <= 100),
    branding_score INTEGER CHECK (branding_score >= 0 AND branding_score <= 100),
    culture_score INTEGER CHECK (culture_score >= 0 AND culture_score <= 100),
    production_score INTEGER CHECK (production_score >= 0 AND production_score <= 100),
    cta_score INTEGER CHECK (cta_score >= 0 AND cta_score <= 100),
    distinctiveness_score INTEGER CHECK (distinctiveness_score >= 0 AND distinctiveness_score <= 100),
    tbwa_dna_score INTEGER CHECK (tbwa_dna_score >= 0 AND tbwa_dna_score <= 100),
    
    -- Composite effectiveness score (0-100)
    overall_effectiveness_score INTEGER GENERATED ALWAYS AS (
        ROUND((clarity_score + emotion_score + branding_score + culture_score + 
               production_score + cta_score + distinctiveness_score + tbwa_dna_score) / 8.0)
    ) STORED,
    
    -- Performance tier classification
    effectiveness_tier TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN ((clarity_score + emotion_score + branding_score + culture_score + 
                   production_score + cta_score + distinctiveness_score + tbwa_dna_score) / 8.0) >= 80 THEN 'Exceptional'
            WHEN ((clarity_score + emotion_score + branding_score + culture_score + 
                   production_score + cta_score + distinctiveness_score + tbwa_dna_score) / 8.0) >= 65 THEN 'Strong' 
            WHEN ((clarity_score + emotion_score + branding_score + culture_score + 
                   production_score + cta_score + distinctiveness_score + tbwa_dna_score) / 8.0) >= 50 THEN 'Good'
            WHEN ((clarity_score + emotion_score + branding_score + culture_score + 
                   production_score + cta_score + distinctiveness_score + tbwa_dna_score) / 8.0) >= 35 THEN 'Fair'
            ELSE 'Needs Improvement'
        END
    ) STORED,
    
    -- Timestamps
    analysis_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gold campaign performance facts (business outcomes)
CREATE TABLE creative_ops.scout_fact_campaign_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL REFERENCES creative_ops.silver_campaigns(campaign_id),
    source_file TEXT,
    
    -- Campaign identifiers  
    brand TEXT NOT NULL,
    market TEXT NOT NULL,
    
    -- Business outcome metrics (performance-grounded approach)
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
    
    -- Campaign context
    total_spend DECIMAL(12,2),
    reach_millions DECIMAL(8,2),
    frequency_avg DECIMAL(4,2),
    campaign_duration_days INTEGER,
    
    -- Attribution metadata
    measurement_methodology JSONB DEFAULT '{}',
    attribution_model TEXT DEFAULT 'last_touch',
    measurement_period_days INTEGER DEFAULT 30,
    
    -- Timestamps
    campaign_start_date DATE,
    campaign_end_date DATE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ETL TRANSFORM FUNCTIONS
-- =====================================================

-- Bronze to Silver transform for creative assets
CREATE OR REPLACE FUNCTION creative_ops.transform_bronze_to_silver_assets_scout()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = creative_ops, public AS $$
BEGIN
    INSERT INTO creative_ops.silver_creative_assets (
        asset_id, source_file, asset_name, asset_type, campaign_id, brand, market,
        visual_elements, audio_elements, text_content, brand_elements, technical_quality,
        clarity_score, emotion_score, branding_score, culture_score,
        production_score, cta_score, distinctiveness_score, tbwa_dna_score
    )
    SELECT 
        br.asset_id,
        br.source_file,
        COALESCE(br.payload->>'asset_name', br.original_filename) as asset_name,
        br.file_type as asset_type,
        br.payload->>'campaign_id' as campaign_id,
        br.payload->>'brand' as brand,
        COALESCE(br.payload->>'market', 'global') as market,
        
        -- Extract features from processed features table
        COALESCE(
            (SELECT ARRAY(SELECT jsonb_array_elements_text(bf.visual_features->'elements')) 
             FROM creative_ops.bronze_creative_features bf 
             WHERE bf.asset_id = br.asset_id LIMIT 1), 
            ARRAY[]::TEXT[]
        ) as visual_elements,
        
        COALESCE(
            (SELECT ARRAY(SELECT jsonb_array_elements_text(bf.audio_features->'elements'))
             FROM creative_ops.bronze_creative_features bf 
             WHERE bf.asset_id = br.asset_id LIMIT 1),
            ARRAY[]::TEXT[]
        ) as audio_elements,
        
        COALESCE(
            (SELECT ARRAY(SELECT jsonb_array_elements_text(bf.text_features->'content'))
             FROM creative_ops.bronze_creative_features bf 
             WHERE bf.asset_id = br.asset_id LIMIT 1),
            ARRAY[]::TEXT[]
        ) as text_content,
        
        -- Brand and technical features from latest extraction
        (SELECT bf.visual_features->'brand_elements' 
         FROM creative_ops.bronze_creative_features bf 
         WHERE bf.asset_id = br.asset_id 
         ORDER BY bf.extracted_at DESC LIMIT 1) as brand_elements,
         
        (SELECT bf.technical_features 
         FROM creative_ops.bronze_creative_features bf 
         WHERE bf.asset_id = br.asset_id 
         ORDER BY bf.extracted_at DESC LIMIT 1) as technical_quality,
        
        -- TBWA 8-dimensional scores from latest extraction
        COALESCE((SELECT (bf.visual_features->'tbwa_scores'->>'clarity')::DECIMAL(3,2) 
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as clarity_score,
                  
        COALESCE((SELECT (bf.visual_features->'tbwa_scores'->>'emotion')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as emotion_score,
                  
        COALESCE((SELECT (bf.visual_features->'tbwa_scores'->>'branding')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as branding_score,
                  
        COALESCE((SELECT (bf.visual_features->'tbwa_scores'->>'culture')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as culture_score,
                  
        COALESCE((SELECT (bf.technical_features->'tbwa_scores'->>'production')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as production_score,
                  
        COALESCE((SELECT (bf.text_features->'tbwa_scores'->>'cta')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as cta_score,
                  
        COALESCE((SELECT (bf.visual_features->'tbwa_scores'->>'distinctiveness')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as distinctiveness_score,
                  
        COALESCE((SELECT (bf.visual_features->'tbwa_scores'->>'tbwa_dna')::DECIMAL(3,2)
                  FROM creative_ops.bronze_creative_features bf 
                  WHERE bf.asset_id = br.asset_id 
                  ORDER BY bf.extracted_at DESC LIMIT 1), 5.0) as tbwa_dna_score
                  
    FROM creative_ops.bronze_creative_raw br
    ON CONFLICT (asset_id) DO UPDATE SET
        asset_name = EXCLUDED.asset_name,
        asset_type = EXCLUDED.asset_type,
        campaign_id = EXCLUDED.campaign_id,
        brand = EXCLUDED.brand,
        market = EXCLUDED.market,
        visual_elements = EXCLUDED.visual_elements,
        audio_elements = EXCLUDED.audio_elements,
        text_content = EXCLUDED.text_content,
        brand_elements = EXCLUDED.brand_elements,
        technical_quality = EXCLUDED.technical_quality,
        clarity_score = EXCLUDED.clarity_score,
        emotion_score = EXCLUDED.emotion_score,
        branding_score = EXCLUDED.branding_score,
        culture_score = EXCLUDED.culture_score,
        production_score = EXCLUDED.production_score,
        cta_score = EXCLUDED.cta_score,
        distinctiveness_score = EXCLUDED.distinctiveness_score,
        tbwa_dna_score = EXCLUDED.tbwa_dna_score,
        updated_at = NOW();
END;
$$;

-- Silver to Gold transform for creative effectiveness
CREATE OR REPLACE FUNCTION creative_ops.transform_silver_to_gold_effectiveness_scout()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = creative_ops, public AS $$
BEGIN
    INSERT INTO creative_ops.fact_creative_effectiveness (
        asset_id, campaign_id, source_file, brand, market, asset_type,
        clarity_score, emotion_score, branding_score, culture_score,
        production_score, cta_score, distinctiveness_score, tbwa_dna_score
    )
    SELECT 
        sa.asset_id,
        sa.campaign_id,
        sa.source_file,
        sa.brand,
        sa.market,
        sa.asset_type,
        
        -- Convert 0-10 scores to 0-100 scale
        ROUND(sa.clarity_score * 10)::INTEGER,
        ROUND(sa.emotion_score * 10)::INTEGER,
        ROUND(sa.branding_score * 10)::INTEGER,
        ROUND(sa.culture_score * 10)::INTEGER,
        ROUND(sa.production_score * 10)::INTEGER,
        ROUND(sa.cta_score * 10)::INTEGER,
        ROUND(sa.distinctiveness_score * 10)::INTEGER,
        ROUND(sa.tbwa_dna_score * 10)::INTEGER
        
    FROM creative_ops.silver_creative_assets sa
    ON CONFLICT (asset_id) DO UPDATE SET
        campaign_id = EXCLUDED.campaign_id,
        brand = EXCLUDED.brand,
        market = EXCLUDED.market,
        asset_type = EXCLUDED.asset_type,
        clarity_score = EXCLUDED.clarity_score,
        emotion_score = EXCLUDED.emotion_score,
        branding_score = EXCLUDED.branding_score,
        culture_score = EXCLUDED.culture_score,
        production_score = EXCLUDED.production_score,
        cta_score = EXCLUDED.cta_score,
        distinctiveness_score = EXCLUDED.distinctiveness_score,
        tbwa_dna_score = EXCLUDED.tbwa_dna_score,
        updated_at = NOW();
END;
$$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Bronze layer indexes
CREATE INDEX idx_bronze_creative_raw_source_file ON creative_ops.bronze_creative_raw(source_file);
CREATE INDEX idx_bronze_creative_raw_asset_id ON creative_ops.bronze_creative_raw(asset_id);
CREATE INDEX idx_bronze_creative_raw_ingested_at ON creative_ops.bronze_creative_raw(ingested_at);
CREATE INDEX idx_bronze_creative_raw_file_hash ON creative_ops.bronze_creative_raw(file_hash);

CREATE INDEX idx_bronze_features_asset_id ON creative_ops.bronze_creative_features(asset_id);
CREATE INDEX idx_bronze_features_source_file ON creative_ops.bronze_creative_features(source_file);
CREATE INDEX idx_bronze_features_extracted_at ON creative_ops.bronze_creative_features(extracted_at);

-- Silver layer indexes
CREATE INDEX idx_silver_assets_campaign_id ON creative_ops.silver_creative_assets(campaign_id);
CREATE INDEX idx_silver_assets_brand_market ON creative_ops.silver_creative_assets(brand, market);
CREATE INDEX idx_silver_assets_source_file ON creative_ops.silver_creative_assets(source_file);
CREATE INDEX idx_silver_assets_overall_score ON creative_ops.silver_creative_assets(overall_ces_score DESC);

CREATE INDEX idx_silver_campaigns_brand_market ON creative_ops.silver_campaigns(brand, market);
CREATE INDEX idx_silver_campaigns_start_date ON creative_ops.silver_campaigns(start_date DESC);

-- Gold layer indexes
CREATE INDEX idx_fact_effectiveness_brand_market ON creative_ops.fact_creative_effectiveness(brand, market);
CREATE INDEX idx_fact_effectiveness_score ON creative_ops.fact_creative_effectiveness(overall_effectiveness_score DESC);
CREATE INDEX idx_fact_effectiveness_tier ON creative_ops.fact_creative_effectiveness(effectiveness_tier);
CREATE INDEX idx_fact_effectiveness_campaign ON creative_ops.fact_creative_effectiveness(campaign_id);
CREATE INDEX idx_fact_effectiveness_analysis_date ON creative_ops.fact_creative_effectiveness(analysis_date DESC);

CREATE INDEX idx_fact_performance_campaign ON creative_ops.fact_campaign_performance(campaign_id);
CREATE INDEX idx_fact_performance_brand_market ON creative_ops.fact_campaign_performance(brand, market);
CREATE INDEX idx_fact_performance_roi ON creative_ops.fact_campaign_performance(roi DESC);
CREATE INDEX idx_fact_performance_engagement ON creative_ops.fact_campaign_performance(engagement_rate DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE creative_ops.bronze_creative_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_ops.bronze_creative_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_ops.silver_creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_ops.silver_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_ops.fact_creative_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_ops.fact_campaign_performance ENABLE ROW LEVEL SECURITY;

-- Basic read access for authenticated users
CREATE POLICY "Read access for authenticated users" ON creative_ops.bronze_creative_raw FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);

CREATE POLICY "Read access for authenticated users" ON creative_ops.bronze_creative_features FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);
    
CREATE POLICY "Read access for authenticated users" ON creative_ops.silver_creative_assets FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);
    
CREATE POLICY "Read access for authenticated users" ON creative_ops.silver_campaigns FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);
    
CREATE POLICY "Read access for authenticated users" ON creative_ops.fact_creative_effectiveness FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);
    
CREATE POLICY "Read access for authenticated users" ON creative_ops.fact_campaign_performance FOR SELECT
    USING (auth.jwt() ->> 'role' IS NOT NULL);

-- Write access for admin users only
CREATE POLICY "Admin write access" ON creative_ops.bronze_creative_raw FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
    
CREATE POLICY "Admin write access" ON creative_ops.bronze_creative_features FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
    
CREATE POLICY "Admin write access" ON creative_ops.silver_creative_assets FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
    
CREATE POLICY "Admin write access" ON creative_ops.silver_campaigns FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
    
CREATE POLICY "Admin write access" ON creative_ops.fact_creative_effectiveness FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
    
CREATE POLICY "Admin write access" ON creative_ops.fact_campaign_performance FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON SCHEMA creative_ops IS 'Creative Operations schema for TBWA 8-dimensional Creative Effectiveness Scoring (CES) system with medallion architecture (Bronze → Silver → Gold)';

COMMIT;