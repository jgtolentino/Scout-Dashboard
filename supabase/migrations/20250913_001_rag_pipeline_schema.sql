-- ============================================================================
-- Scout v7.1 RAG Pipeline Schema Migration
-- Creates platinum layer tables for vector embeddings, knowledge graph, audit
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create platinum schema for enriched intelligence layer
CREATE SCHEMA IF NOT EXISTS platinum;

-- ============================================================================
-- RAG Vector Store Tables
-- ============================================================================

-- RAG chunks table for vector embeddings
CREATE TABLE platinum.rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI ada-002 dimension
    source_type VARCHAR(50) NOT NULL, -- 'manual', 'documentation', 'market_intel'
    source_id VARCHAR(255),
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT rag_chunks_source_type_check 
        CHECK (source_type IN ('manual', 'documentation', 'market_intel', 'product_catalog')),
    CONSTRAINT rag_chunks_tenant_id_not_null 
        CHECK (tenant_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_rag_chunks_tenant_id ON platinum.rag_chunks (tenant_id);
CREATE INDEX idx_rag_chunks_source_type ON platinum.rag_chunks (source_type);
CREATE INDEX idx_rag_chunks_embedding ON platinum.rag_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_rag_chunks_text_search ON platinum.rag_chunks USING gin (to_tsvector('english', chunk_text));
CREATE INDEX idx_rag_chunks_metadata ON platinum.rag_chunks USING gin (chunk_metadata);

-- ============================================================================
-- Knowledge Graph Tables
-- ============================================================================

-- Knowledge graph entities (brand → category → SKU hierarchy)
CREATE TABLE platinum.kg_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'brand', 'category', 'sku', 'location'
    entity_id VARCHAR(255) NOT NULL, -- External ID from source system
    entity_name VARCHAR(255) NOT NULL,
    entity_attributes JSONB DEFAULT '{}',
    parent_entity_id UUID REFERENCES platinum.kg_entities(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT kg_entities_type_check 
        CHECK (entity_type IN ('brand', 'category', 'sku', 'location', 'region', 'city', 'barangay')),
    UNIQUE (tenant_id, entity_type, entity_id)
);

-- Knowledge graph relationships
CREATE TABLE platinum.kg_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    from_entity_id UUID NOT NULL REFERENCES platinum.kg_entities(id),
    to_entity_id UUID NOT NULL REFERENCES platinum.kg_entities(id),
    relationship_type VARCHAR(50) NOT NULL, -- 'parent_of', 'substitutes', 'competes_with'
    relationship_weight DECIMAL(5,4) DEFAULT 1.0,
    relationship_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT kg_relationships_type_check 
        CHECK (relationship_type IN ('parent_of', 'child_of', 'substitutes', 'competes_with', 'located_in')),
    CONSTRAINT kg_relationships_weight_check 
        CHECK (relationship_weight >= 0.0 AND relationship_weight <= 1.0),
    UNIQUE (tenant_id, from_entity_id, to_entity_id, relationship_type)
);

-- Create indexes for knowledge graph performance
CREATE INDEX idx_kg_entities_tenant_id ON platinum.kg_entities (tenant_id);
CREATE INDEX idx_kg_entities_type ON platinum.kg_entities (entity_type);
CREATE INDEX idx_kg_entities_parent ON platinum.kg_entities (parent_entity_id);
CREATE INDEX idx_kg_entities_lookup ON platinum.kg_entities (tenant_id, entity_type, entity_id);

CREATE INDEX idx_kg_relationships_tenant_id ON platinum.kg_relationships (tenant_id);
CREATE INDEX idx_kg_relationships_from ON platinum.kg_relationships (from_entity_id);
CREATE INDEX idx_kg_relationships_to ON platinum.kg_relationships (to_entity_id);
CREATE INDEX idx_kg_relationships_type ON platinum.kg_relationships (relationship_type);

-- ============================================================================
-- CAG (Comparative Analysis Graph) Tables
-- ============================================================================

-- Substitution edges for comparative analysis
CREATE TABLE platinum.cag_substitution_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    from_sku_id VARCHAR(255) NOT NULL,
    to_sku_id VARCHAR(255) NOT NULL,
    substitution_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    confidence_score DECIMAL(5,4) DEFAULT 0.0,
    evidence_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cag_substitution_rate_check 
        CHECK (substitution_rate >= 0.0 AND substitution_rate <= 1.0),
    CONSTRAINT cag_confidence_check 
        CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    UNIQUE (tenant_id, from_sku_id, to_sku_id)
);

CREATE INDEX idx_cag_substitution_tenant_id ON platinum.cag_substitution_edges (tenant_id);
CREATE INDEX idx_cag_substitution_from_sku ON platinum.cag_substitution_edges (from_sku_id);
CREATE INDEX idx_cag_substitution_to_sku ON platinum.cag_substitution_edges (to_sku_id);
CREATE INDEX idx_cag_substitution_rate ON platinum.cag_substitution_edges (substitution_rate DESC);

-- ============================================================================
-- Audit and Operations Tables
-- ============================================================================

-- Audit ledger for NL→SQL operations
CREATE TABLE ops.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    user_role VARCHAR(50) NOT NULL,
    
    -- Query details
    natural_language_query TEXT NOT NULL,
    generated_sql TEXT,
    executed_sql TEXT,
    query_intent VARCHAR(100), -- 'metric_query', 'comparison', 'forecast', 'exploration'
    
    -- Execution results
    execution_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error', 'timeout'
    row_count INTEGER,
    execution_time_ms INTEGER,
    error_message TEXT,
    
    -- Agent routing
    agent_pipeline JSONB, -- ['QueryAgent', 'RetrieverAgent', 'ChartVisionAgent', 'NarrativeAgent']
    mcp_servers_used JSONB, -- ['context7', 'sequential', 'magic']
    superclaude_flags JSONB, -- ['--think-hard', '--wave-mode']
    
    -- Chart generation
    chart_spec JSONB,
    chart_type VARCHAR(50),
    chart_generation_time_ms INTEGER,
    
    -- Compliance
    rls_enforced BOOLEAN DEFAULT true,
    row_limit_applied INTEGER,
    schema_validation_passed BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT audit_ledger_status_check 
        CHECK (execution_status IN ('pending', 'success', 'error', 'timeout')),
    CONSTRAINT audit_ledger_role_check 
        CHECK (user_role IN ('executive', 'analyst', 'store_manager', 'admin'))
);

-- Platinum job runs for enrichment tracking
CREATE TABLE platinum.job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'rag_refresh', 'kg_update', 'cag_calculation', 'market_enrichment'
    
    -- Execution details
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'timeout'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Data processing
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Lineage
    source_hash VARCHAR(64), -- SHA256 of source data
    target_tables TEXT[], -- Array of affected table names
    dependencies JSONB, -- Job dependencies and versions
    
    -- Results
    job_output JSONB,
    error_details JSONB,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT job_runs_status_check 
        CHECK (status IN ('running', 'completed', 'failed', 'timeout', 'cancelled')),
    CONSTRAINT job_runs_type_check 
        CHECK (job_type IN ('rag_refresh', 'kg_update', 'cag_calculation', 'market_enrichment', 'embedding_generation'))
);

-- Create indexes for audit and operations
CREATE INDEX idx_audit_ledger_tenant_id ON ops.audit_ledger (tenant_id);
CREATE INDEX idx_audit_ledger_user_id ON ops.audit_ledger (user_id);
CREATE INDEX idx_audit_ledger_created_at ON ops.audit_ledger (created_at DESC);
CREATE INDEX idx_audit_ledger_status ON ops.audit_ledger (execution_status);
CREATE INDEX idx_audit_ledger_intent ON ops.audit_ledger (query_intent);

CREATE INDEX idx_job_runs_name ON platinum.job_runs (job_name);
CREATE INDEX idx_job_runs_type ON platinum.job_runs (job_type);
CREATE INDEX idx_job_runs_status ON platinum.job_runs (status);
CREATE INDEX idx_job_runs_started_at ON platinum.job_runs (started_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE platinum.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE platinum.kg_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platinum.kg_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE platinum.cag_substitution_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops.audit_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
CREATE POLICY rag_chunks_tenant_isolation ON platinum.rag_chunks
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY kg_entities_tenant_isolation ON platinum.kg_entities
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY kg_relationships_tenant_isolation ON platinum.kg_relationships
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY cag_substitution_tenant_isolation ON platinum.cag_substitution_edges
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY audit_ledger_tenant_isolation ON ops.audit_ledger
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ============================================================================
-- Functions for RAG Pipeline
-- ============================================================================

-- Function for hybrid semantic search
CREATE OR REPLACE FUNCTION platinum.fn_rag_semantic_search(
    _query TEXT,
    _embedding vector(1536),
    _tenant_id UUID,
    _threshold FLOAT DEFAULT 0.7,
    _limit INTEGER DEFAULT 8
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    similarity_score FLOAT,
    source_type VARCHAR(50),
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id,
        rc.chunk_text,
        1 - (rc.embedding <=> _embedding) as similarity,
        rc.source_type,
        rc.chunk_metadata
    FROM platinum.rag_chunks rc
    WHERE rc.tenant_id = _tenant_id
        AND (1 - (rc.embedding <=> _embedding)) > _threshold
    ORDER BY rc.embedding <=> _embedding
    LIMIT _limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for knowledge graph traversal
CREATE OR REPLACE FUNCTION platinum.fn_kg_find_related_entities(
    _entity_id UUID,
    _relationship_types TEXT[] DEFAULT NULL,
    _max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
    entity_id UUID,
    entity_name VARCHAR(255),
    entity_type VARCHAR(50),
    relationship_path TEXT[],
    depth INTEGER
) AS $$
WITH RECURSIVE entity_traversal AS (
    -- Base case: start with the given entity
    SELECT 
        e.id,
        e.entity_name,
        e.entity_type,
        ARRAY[]::TEXT[] as relationship_path,
        0 as depth
    FROM platinum.kg_entities e
    WHERE e.id = _entity_id
    
    UNION ALL
    
    -- Recursive case: find related entities
    SELECT 
        e.id,
        e.entity_name,
        e.entity_type,
        et.relationship_path || r.relationship_type,
        et.depth + 1
    FROM entity_traversal et
    JOIN platinum.kg_relationships r ON et.entity_id = r.from_entity_id
    JOIN platinum.kg_entities e ON r.to_entity_id = e.id
    WHERE et.depth < _max_depth
        AND (_relationship_types IS NULL OR r.relationship_type = ANY(_relationship_types))
)
SELECT * FROM entity_traversal WHERE depth > 0;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_rag_chunks_updated_at 
    BEFORE UPDATE ON platinum.rag_chunks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kg_entities_updated_at 
    BEFORE UPDATE ON platinum.kg_entities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- View for RAG chunk analytics
CREATE VIEW platinum.v_rag_analytics AS
SELECT 
    source_type,
    COUNT(*) as chunk_count,
    AVG(char_length(chunk_text)) as avg_chunk_length,
    COUNT(DISTINCT tenant_id) as tenant_count,
    MAX(created_at) as last_updated
FROM platinum.rag_chunks 
GROUP BY source_type;

-- View for knowledge graph statistics
CREATE VIEW platinum.v_kg_statistics AS
SELECT 
    entity_type,
    COUNT(*) as entity_count,
    COUNT(DISTINCT tenant_id) as tenant_count,
    COUNT(parent_entity_id) as entities_with_parent
FROM platinum.kg_entities
GROUP BY entity_type;

-- Grant permissions
GRANT USAGE ON SCHEMA platinum TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA platinum TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA platinum TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA platinum TO service_role;

GRANT SELECT ON platinum.v_rag_analytics TO service_role;
GRANT SELECT ON platinum.v_kg_statistics TO service_role;

-- Grant ops schema permissions
GRANT USAGE ON SCHEMA ops TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ops TO service_role;

-- ============================================================================
-- Data Quality Constraints
-- ============================================================================

-- Add constraint to ensure embeddings are normalized (optional)
-- ALTER TABLE platinum.rag_chunks ADD CONSTRAINT rag_chunks_embedding_normalized 
--     CHECK (abs(sqrt(embedding <#> embedding) - 1.0) < 0.01);

COMMENT ON SCHEMA platinum IS 'Scout v7.1 Platinum Layer - Enriched intelligence with RAG, KG, and CAG components';
COMMENT ON TABLE platinum.rag_chunks IS 'Vector embeddings for hybrid semantic search with BM25 + metadata';
COMMENT ON TABLE platinum.kg_entities IS 'Knowledge graph entities with hierarchical relationships';
COMMENT ON TABLE platinum.kg_relationships IS 'Knowledge graph relationships with weighted edges';
COMMENT ON TABLE platinum.cag_substitution_edges IS 'Comparative Analysis Graph for SKU substitution signals';
COMMENT ON TABLE ops.audit_ledger IS 'Comprehensive audit log for NL→SQL operations and agent pipeline execution';
COMMENT ON TABLE platinum.job_runs IS 'Job execution tracking with lineage and retry logic for platinum layer updates';