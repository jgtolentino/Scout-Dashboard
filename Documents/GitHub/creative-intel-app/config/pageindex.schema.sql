-- Creative feature indexing schema
CREATE EXTENSION IF NOT EXISTS vector;

-- Creative assets table
CREATE TABLE IF NOT EXISTS creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id TEXT UNIQUE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Feature vectors table
CREATE TABLE IF NOT EXISTS feature_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL,  -- 'layout', 'text', 'visual', etc.
    embedding vector(1536),      -- OpenAI embedding dimension
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Extracted text content
CREATE TABLE IF NOT EXISTS extracted_text (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    page_number INTEGER,
    content TEXT,
    bounding_box JSONB,  -- {x1, y1, x2, y2}
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Layout elements
CREATE TABLE IF NOT EXISTS layout_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL,  -- 'text', 'image', 'logo', etc.
    bounding_box JSONB,         -- {x1, y1, x2, y2}
    confidence FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creative_assets_drive_id ON creative_assets(drive_id);
CREATE INDEX IF NOT EXISTS idx_feature_vectors_asset_id ON feature_vectors(asset_id);
CREATE INDEX IF NOT EXISTS idx_extracted_text_asset_id ON extracted_text(asset_id);
CREATE INDEX IF NOT EXISTS idx_layout_elements_asset_id ON layout_elements(asset_id);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_feature_vectors_embedding ON feature_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_creative_assets_updated_at
    BEFORE UPDATE ON creative_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 