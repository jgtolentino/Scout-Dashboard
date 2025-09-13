-- Creative Effectiveness Scoring (CES) System Database Schema
-- Migration v1.0.0 - September 3, 2025
-- Comprehensive multimodal creative scoring infrastructure

BEGIN;

-- Create CES schema for organization
CREATE SCHEMA IF NOT EXISTS ces;

-- ============================================================================
-- CORE TABLES: Asset Management & Scoring
-- ============================================================================

-- Creative Assets Table - Stores multimodal assets for scoring
CREATE TABLE ces.ces_creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Asset Metadata
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT NOT NULL,
    content_type TEXT NOT NULL CHECK (
        content_type IN (
            'video/mp4', 'video/mov', 'video/webm',
            'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
            'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/x-wav'
        )
    ),
    
    -- Categorization
    asset_type TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN content_type LIKE 'video/%' THEN 'video'
            WHEN content_type LIKE 'image/%' OR content_type = 'application/pdf' THEN 'image'
            WHEN content_type LIKE 'audio/%' THEN 'audio'
            ELSE 'unknown'
        END
    ) STORED,
    
    -- Creative Context
    campaign_name TEXT,
    brand_context TEXT,
    target_audience TEXT,
    creative_brief TEXT,
    competitive_set TEXT[],
    
    -- Technical Properties
    duration_seconds NUMERIC, -- for video/audio
    dimensions JSONB, -- {"width": 1920, "height": 1080}
    quality_metrics JSONB, -- technical quality scores
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed', 'archived')
    ),
    processing_metadata JSONB,
    
    -- Timestamps and User Tracking
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CES Evaluations Table - Stores scoring results
CREATE TABLE ces.scout_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES ces.creative_assets(id) ON DELETE CASCADE,
    
    -- Scoring Configuration
    evaluation_type TEXT DEFAULT 'comprehensive' CHECK (
        evaluation_type IN ('quick', 'comprehensive', 'benchmark', 'competitive')
    ),
    scoring_model TEXT DEFAULT 'llava-critic',
    model_version TEXT DEFAULT '1.0',
    
    -- TBWA 8-Dimension Scores
    scores JSONB NOT NULL, -- {clarity: 8, emotion: 9, branding: 7, culture: 9, production: 10, cta: 8, distinctiveness: 9, tbwa_dna: 10}
    
    -- Aggregated Metrics
    overall_score NUMERIC GENERATED ALWAYS AS (
        (
            COALESCE((scores->>'clarity')::numeric, 0) +
            COALESCE((scores->>'emotion')::numeric, 0) +
            COALESCE((scores->>'branding')::numeric, 0) +
            COALESCE((scores->>'culture')::numeric, 0) +
            COALESCE((scores->>'production')::numeric, 0) +
            COALESCE((scores->>'cta')::numeric, 0) +
            COALESCE((scores->>'distinctiveness')::numeric, 0) +
            COALESCE((scores->>'tbwa_dna')::numeric, 0)
        ) / 8.0
    ) STORED,
    
    -- Detailed Analysis
    explanation TEXT,
    strengths TEXT[],
    improvement_areas TEXT[],
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Visual Overlays & Annotations
    visual_annotations JSONB, -- bounding boxes, highlights, etc.
    overlay_url TEXT,
    
    -- Benchmark Positioning
    benchmark_percentile NUMERIC CHECK (benchmark_percentile >= 0 AND benchmark_percentile <= 100),
    competitive_position TEXT,
    warc_alignment JSONB,
    cannes_alignment JSONB,
    
    -- Processing Metadata
    processing_time_ms INTEGER,
    agent_used TEXT,
    model_parameters JSONB,
    
    -- Timestamps
    evaluated_by TEXT,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scoring Dimensions Reference Table
CREATE TABLE ces.scout_scoring_dimensions (
    id SERIAL PRIMARY KEY,
    dimension_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    weight NUMERIC DEFAULT 1.0 CHECK (weight >= 0),
    max_score INTEGER DEFAULT 10,
    criteria JSONB, -- detailed scoring criteria
    examples JSONB, -- good/bad examples
    
    -- TBWA-specific guidance
    tbwa_guidelines TEXT,
    cultural_considerations TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmark Reference Library
CREATE TABLE ces.scout_benchmark_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference Asset
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    campaign TEXT,
    year INTEGER,
    
    -- Source & Classification
    source TEXT CHECK (source IN ('warc', 'cannes', 'd_ad', 'effie', 'thinkbox', 'internal')),
    award_category TEXT,
    award_tier TEXT, -- Gold, Silver, Bronze, Winner, etc.
    
    -- Asset References
    asset_url TEXT,
    thumbnail_url TEXT,
    case_study_url TEXT,
    
    -- Benchmark Scores
    reference_scores JSONB,
    effectiveness_metrics JSONB,
    business_impact JSONB,
    
    -- Context
    market TEXT,
    category TEXT,
    target_demographic TEXT,
    media_channels TEXT[],
    campaign_objectives TEXT[],
    
    -- Metadata
    description TEXT,
    key_insights TEXT[],
    success_factors TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUPPORTING TABLES: Analytics & Monitoring
-- ============================================================================

-- Evaluation Sessions - Track batch evaluations
CREATE TABLE ces.scout_evaluation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name TEXT,
    description TEXT,
    
    -- Session Configuration
    evaluation_config JSONB,
    batch_size INTEGER DEFAULT 1,
    
    -- Progress Tracking
    total_assets INTEGER DEFAULT 0,
    completed_assets INTEGER DEFAULT 0,
    failed_assets INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'completed', 'failed', 'cancelled')
    ),
    
    -- User & Timing
    created_by TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link evaluations to sessions
ALTER TABLE ces.evaluations ADD COLUMN session_id UUID REFERENCES ces.evaluation_sessions(id);

-- Feedback & Validation Table
CREATE TABLE ces.scout_evaluation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES ces.evaluations(id) ON DELETE CASCADE,
    
    -- Feedback Details
    feedback_type TEXT CHECK (feedback_type IN ('correction', 'validation', 'suggestion', 'dispute')),
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    corrected_scores JSONB,
    feedback_text TEXT,
    
    -- Metadata
    provided_by TEXT,
    is_expert_feedback BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES: Performance Optimization
-- ============================================================================

-- Asset indexes
CREATE INDEX idx_ces_assets_type ON ces.creative_assets(asset_type);
CREATE INDEX idx_ces_assets_status ON ces.creative_assets(processing_status);
CREATE INDEX idx_ces_assets_brand ON ces.creative_assets(brand_context);
CREATE INDEX idx_ces_assets_uploaded ON ces.creative_assets(uploaded_at);

-- Evaluation indexes
CREATE INDEX idx_ces_evaluations_asset ON ces.evaluations(asset_id);
CREATE INDEX idx_ces_evaluations_score ON ces.evaluations(overall_score);
CREATE INDEX idx_ces_evaluations_type ON ces.evaluations(evaluation_type);
CREATE INDEX idx_ces_evaluations_evaluated ON ces.evaluations(evaluated_at);
CREATE INDEX idx_ces_evaluations_session ON ces.evaluations(session_id);

-- Benchmark indexes
CREATE INDEX idx_ces_benchmark_source ON ces.benchmark_library(source);
CREATE INDEX idx_ces_benchmark_brand ON ces.benchmark_library(brand);
CREATE INDEX idx_ces_benchmark_year ON ces.benchmark_library(year);
CREATE INDEX idx_ces_benchmark_category ON ces.benchmark_library(award_category);

-- Composite indexes for common queries
CREATE INDEX idx_ces_evaluations_asset_score ON ces.evaluations(asset_id, overall_score DESC);
CREATE INDEX idx_ces_assets_brand_type ON ces.creative_assets(brand_context, asset_type);

-- ============================================================================
-- ROW LEVEL SECURITY: Agent-Based Access Control
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE ces.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.scoring_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.benchmark_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.evaluation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces.evaluation_feedback ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON ces.creative_assets FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON ces.evaluations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON ces.scoring_dimensions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON ces.benchmark_library FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON ces.evaluation_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON ces.evaluation_feedback FOR ALL TO service_role USING (true);

-- Authenticated users with creative_analyst role can access
CREATE POLICY "Creative analysts access" ON ces.creative_assets 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'role' = 'creative_analyst' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Creative analysts access" ON ces.evaluations 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'role' = 'creative_analyst' OR auth.jwt() ->> 'role' = 'admin');

-- Read-only access to dimensions and benchmarks for authenticated users
CREATE POLICY "Read dimensions" ON ces.scoring_dimensions 
    FOR SELECT TO authenticated 
    USING (is_active = true);

CREATE POLICY "Read benchmarks" ON ces.benchmark_library 
    FOR SELECT TO authenticated 
    USING (is_active = true);

-- ============================================================================
-- FUNCTIONS: Business Logic & Utilities
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION ces.update_updated_at_scout()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_ces_assets_updated_at
    BEFORE UPDATE ON ces.creative_assets
    FOR EACH ROW EXECUTE FUNCTION ces.update_updated_at();

CREATE TRIGGER update_ces_evaluations_updated_at
    BEFORE UPDATE ON ces.evaluations
    FOR EACH ROW EXECUTE FUNCTION ces.update_updated_at();

CREATE TRIGGER update_ces_sessions_updated_at
    BEFORE UPDATE ON ces.evaluation_sessions
    FOR EACH ROW EXECUTE FUNCTION ces.update_updated_at();

-- Get evaluation summary function
CREATE OR REPLACE FUNCTION ces.get_evaluation_summary_scout(
    p_asset_id UUID DEFAULT NULL,
    p_brand_context TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    asset_id UUID,
    filename TEXT,
    brand_context TEXT,
    asset_type TEXT,
    overall_score NUMERIC,
    evaluation_count INTEGER,
    latest_evaluation TIMESTAMPTZ,
    avg_confidence NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as asset_id,
        a.filename,
        a.brand_context,
        a.asset_type,
        AVG(e.overall_score) as overall_score,
        COUNT(e.id)::INTEGER as evaluation_count,
        MAX(e.evaluated_at) as latest_evaluation,
        AVG(e.confidence_score) as avg_confidence
    FROM ces.creative_assets a
    LEFT JOIN ces.evaluations e ON a.id = e.asset_id
    WHERE 
        (p_asset_id IS NULL OR a.id = p_asset_id)
        AND (p_brand_context IS NULL OR a.brand_context ILIKE '%' || p_brand_context || '%')
        AND a.processing_status = 'completed'
    GROUP BY a.id, a.filename, a.brand_context, a.asset_type
    ORDER BY latest_evaluation DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA: Scoring Dimensions
-- ============================================================================

INSERT INTO ces.scoring_dimensions (
    dimension_name, display_name, description, weight, criteria, tbwa_guidelines
) VALUES
(
    'clarity',
    'Clarity of Messaging',
    'How well the core message is conveyed to the audience',
    1.2,
    '{"excellent": "Message is crystal clear and immediately understood", "good": "Message is clear with minor ambiguity", "poor": "Message is confusing or unclear"}',
    'TBWA focuses on disruption through clarity. The message should cut through noise and be immediately understood.'
),
(
    'emotion',
    'Emotional Resonance',
    'Strength of emotional reaction elicited from the audience',
    1.3,
    '{"excellent": "Creates strong, memorable emotional connection", "good": "Generates moderate emotional response", "poor": "Little to no emotional impact"}',
    'Emotional disruption is key to TBWA''s approach. Creative should provoke, inspire, or deeply connect with audience feelings.'
),
(
    'branding',
    'Brand Recognition',
    'Degree of implicit and explicit brand presence and recall',
    1.1,
    '{"excellent": "Brand is central and memorable", "good": "Brand is present and noticeable", "poor": "Brand is weak or forgettable"}',
    'Brand should be integrated naturally into the creative narrative, not forced or overshadowed by execution.'
),
(
    'culture',
    'Cultural Fit',
    'Alignment with Filipino cultural cues and sensitivities',
    1.4,
    '{"excellent": "Perfectly attuned to local culture", "good": "Culturally appropriate", "poor": "Culturally tone-deaf or irrelevant"}',
    'Deep understanding of Filipino values, humor, traditions, and contemporary culture is essential for effective communication.'
),
(
    'production',
    'Production Quality',
    'Visual/audio craftsmanship, lighting, transitions, and technical execution',
    1.0,
    '{"excellent": "Flawless technical execution", "good": "High production values", "poor": "Poor technical quality"}',
    'Quality reflects brand values. Even disruptive creative needs strong production values to maintain credibility.'
),
(
    'cta',
    'Call to Action Strength',
    'Visibility and clarity of the desired audience action',
    1.1,
    '{"excellent": "Clear, compelling, and actionable", "good": "Present and understandable", "poor": "Weak or missing call to action"}',
    'CTA should feel natural to the creative story, not tacked on. Make it easy and compelling for audience to act.'
),
(
    'distinctiveness',
    'Disruption & Distinctiveness',
    'Originality of concept and execution that cuts through clutter',
    1.5,
    '{"excellent": "Completely original and attention-grabbing", "good": "Notable and distinctive", "poor": "Generic or forgettable"}',
    'Core TBWA principle: Disruption creates distinction. Creative should challenge conventions and stand out from competition.'
),
(
    'tbwa_dna',
    'Consistency with TBWA DNA',
    'Alignment with TBWA storytelling principles and disruption philosophy',
    1.3,
    '{"excellent": "Perfect embodiment of TBWA principles", "good": "Aligned with TBWA approach", "poor": "Inconsistent with TBWA philosophy"}',
    'Should demonstrate TBWA''s commitment to intelligent disruption, cultural relevance, and brand-building storytelling.'
);

-- ============================================================================
-- PERMISSIONS: Grant Access
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA ces TO anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA ces TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA ces TO authenticated;
GRANT INSERT, UPDATE ON ces.creative_assets TO authenticated;
GRANT INSERT, UPDATE ON ces.evaluations TO authenticated;
GRANT INSERT ON ces.evaluation_feedback TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA ces TO authenticated, service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION ces.get_evaluation_summary TO authenticated, anon;

COMMIT;

-- Notify completion
SELECT 'CES System Database Schema Successfully Created!' as status;