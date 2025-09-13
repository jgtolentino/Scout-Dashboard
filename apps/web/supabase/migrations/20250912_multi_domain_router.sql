-- Multi-Domain AI Router Database Schema
-- Creates tables for logging, tracking, and managing the multi-domain routing system

-- Router logs table for tracking routing decisions
CREATE TABLE IF NOT EXISTS multi_domain_router_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  session_id TEXT,
  query TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('scout', 'ces', 'docs')),
  intent TEXT NOT NULL,
  handler TEXT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  routing_method TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- CES handler logs for creative effectiveness queries
CREATE TABLE IF NOT EXISTS ces_handler_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  query TEXT NOT NULL,
  intent TEXT CHECK (intent IN ('creative', 'effectiveness')),
  filters JSONB DEFAULT '{}'::jsonb,
  latency_ms INTEGER NOT NULL,
  result_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Documentation search logs
CREATE TABLE IF NOT EXISTS docs_search_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  query TEXT NOT NULL,
  intent TEXT CHECK (intent IN ('documentation', 'tutorial')),
  filters JSONB DEFAULT '{}'::jsonb,
  result_count INTEGER DEFAULT 0,
  search_method TEXT NOT NULL DEFAULT 'semantic_search',
  latency_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Google Drive sync tracking
CREATE TABLE IF NOT EXISTS drive_sync_files (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  file_id TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('scout', 'ces', 'docs')),
  last_modified TIMESTAMPTZ NOT NULL,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  record_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Drive sync operation logs
CREATE TABLE IF NOT EXISTS drive_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  files_processed INTEGER DEFAULT 0,
  files_added INTEGER DEFAULT 0,
  files_updated INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  duration_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Documentation content table for semantic search
CREATE TABLE IF NOT EXISTS documentation (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  content_type TEXT CHECK (content_type IN ('api', 'reference', 'specification', 'tutorial', 'guide', 'walkthrough')),
  source_file TEXT,
  source_path TEXT,
  embedding vector(1536), -- For semantic search
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_router_logs_created_at ON multi_domain_router_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_router_logs_domain ON multi_domain_router_logs(domain);
CREATE INDEX IF NOT EXISTS idx_router_logs_user_id ON multi_domain_router_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_ces_logs_created_at ON ces_handler_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ces_logs_intent ON ces_handler_logs(intent);

CREATE INDEX IF NOT EXISTS idx_docs_logs_created_at ON docs_search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_docs_logs_intent ON docs_search_logs(intent);

CREATE INDEX IF NOT EXISTS idx_sync_files_domain ON drive_sync_files(domain);
CREATE INDEX IF NOT EXISTS idx_sync_files_modified ON drive_sync_files(last_modified);
CREATE INDEX IF NOT EXISTS idx_sync_files_sync_timestamp ON drive_sync_files(sync_timestamp);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON drive_sync_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_docs_category ON documentation(category);
CREATE INDEX IF NOT EXISTS idx_docs_content_type ON documentation(content_type);
CREATE INDEX IF NOT EXISTS idx_docs_tags ON documentation USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_docs_embedding ON documentation USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable full-text search on documentation content
CREATE INDEX IF NOT EXISTS idx_docs_content_fts ON documentation USING GIN(to_tsvector('english', title || ' ' || content));

-- Create RLS policies
ALTER TABLE multi_domain_router_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_handler_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_sync_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON multi_domain_router_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON ces_handler_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON docs_search_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON drive_sync_files FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON drive_sync_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON documentation FOR ALL TO service_role USING (true);

-- Allow authenticated users to read documentation
CREATE POLICY "Users can read documentation" ON documentation FOR SELECT TO authenticated USING (true);

-- Create functions for CES data analysis (placeholder implementations)
CREATE OR REPLACE FUNCTION ces_creative_analysis(
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder implementation - will be replaced with actual CES analytics
  RETURN jsonb_build_object(
    'campaigns', '[]'::jsonb,
    'creative_assets', '[]'::jsonb,
    'performance_metrics', '{}'::jsonb,
    'insights', '[]'::jsonb,
    'note', 'Placeholder implementation - integrate with actual CES data'
  );
END;
$$;

CREATE OR REPLACE FUNCTION ces_effectiveness_analysis(
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder implementation - will be replaced with actual effectiveness analytics
  RETURN jsonb_build_object(
    'attribution', '{}'::jsonb,
    'roi_metrics', '{}'::jsonb,
    'conversion_funnel', '[]'::jsonb,
    'recommendations', '[]'::jsonb,
    'note', 'Placeholder implementation - integrate with actual attribution data'
  );
END;
$$;

-- Create function for documentation semantic search
CREATE OR REPLACE FUNCTION docs_semantic_search(
  p_query TEXT,
  p_embedding TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_content_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_embedding vector(1536);
  result JSONB;
BEGIN
  -- Parse embedding if provided
  IF p_embedding IS NOT NULL THEN
    query_embedding := p_embedding::vector(1536);
  END IF;

  -- Build query based on whether we have embeddings
  IF query_embedding IS NOT NULL THEN
    -- Semantic search using embeddings
    WITH semantic_results AS (
      SELECT 
        title,
        content,
        category,
        difficulty_level,
        tags,
        content_type,
        source_file,
        1 - (embedding <=> query_embedding) AS similarity
      FROM documentation
      WHERE 
        (p_content_types IS NULL OR content_type = ANY(p_content_types))
        AND (
          (p_filters->>'category')::text IS NULL OR 
          category = (p_filters->>'category')::text
        )
      ORDER BY embedding <=> query_embedding
      LIMIT p_limit
    )
    SELECT jsonb_build_object(
      'results', jsonb_agg(row_to_json(semantic_results)),
      'top_matches', jsonb_agg(row_to_json(semantic_results)) FILTER (WHERE similarity > 0.8),
      'search_method', 'semantic'
    ) INTO result
    FROM semantic_results;
  ELSE
    -- Fallback to full-text search
    WITH text_results AS (
      SELECT 
        title,
        content,
        category,
        difficulty_level,
        tags,
        content_type,
        source_file,
        ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', p_query)) AS rank
      FROM documentation
      WHERE 
        to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', p_query)
        AND (p_content_types IS NULL OR content_type = ANY(p_content_types))
        AND (
          (p_filters->>'category')::text IS NULL OR 
          category = (p_filters->>'category')::text
        )
      ORDER BY rank DESC
      LIMIT p_limit
    )
    SELECT jsonb_build_object(
      'results', jsonb_agg(row_to_json(text_results)),
      'search_method', 'fulltext'
    ) INTO result
    FROM text_results;
  END IF;

  RETURN COALESCE(result, jsonb_build_object('results', '[]'::jsonb, 'search_method', 'none'));
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drive_sync_files_updated_at BEFORE UPDATE ON drive_sync_files FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documentation_updated_at BEFORE UPDATE ON documentation FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();