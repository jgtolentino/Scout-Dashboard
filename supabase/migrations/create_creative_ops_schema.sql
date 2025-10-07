-- Create creative_ops schema if not exists
CREATE SCHEMA IF NOT EXISTS creative_ops;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Assets table with vector embeddings
CREATE TABLE IF NOT EXISTS creative_ops.scout_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID,
    storage_url TEXT NOT NULL,
    embed vector(1536), -- OpenAI ada-002 compatible embeddings
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_assets_embed 
ON creative_ops.assets 
USING ivfflat (embed vector_cosine_ops)
WITH (lists = 100);

-- Prompts table for tracking queries
CREATE TABLE IF NOT EXISTS creative_ops.scout_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_ops.assets(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS creative_ops.scout_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    year INTEGER,
    platform TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Palette analysis results
CREATE TABLE IF NOT EXISTS creative_ops.scout_palette_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_ops.assets(id) ON DELETE CASCADE,
    dominant_colors TEXT[],
    palette_scores JSONB,
    analysis_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for campaign_id
ALTER TABLE creative_ops.assets 
ADD CONSTRAINT fk_assets_campaign 
FOREIGN KEY (campaign_id) 
REFERENCES creative_ops.campaigns(id) 
ON DELETE SET NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION creative_ops.update_updated_at_scout()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON creative_ops.assets
FOR EACH ROW
EXECUTE FUNCTION creative_ops.update_updated_at();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION creative_ops.search_similar_assets_scout(
    query_embedding vector(1536),
    match_count INT DEFAULT 10,
    threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    asset_id UUID,
    storage_url TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS asset_id,
        a.storage_url,
        1 - (a.embed <=> query_embedding) AS similarity,
        a.metadata
    FROM creative_ops.assets a
    WHERE a.embed IS NOT NULL
    AND 1 - (a.embed <=> query_embedding) > threshold
    ORDER BY a.embed <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA creative_ops TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA creative_ops TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA creative_ops TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA creative_ops TO anon, authenticated;