-- Scout v7 Complete Schema Migration
-- Comprehensive deployment of all Scout v7 components

-- Core schemas
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS masterdata;
CREATE SCHEMA IF NOT EXISTS scout;

-- =============================================================================
-- STAGING LAYER - Bronze Data
-- =============================================================================

-- Drive SKUs table with brand resolution tracking
CREATE TABLE IF NOT EXISTS staging.drive_skus (
    id BIGSERIAL PRIMARY KEY,
    sku TEXT,
    brand TEXT,
    product_name TEXT,
    category TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    source TEXT DEFAULT 'google_drive',
    file_path TEXT,
    sheet_name TEXT,
    row_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Brand resolution tracking columns
    resolution_attempts INTEGER DEFAULT 0,
    resolution_last_status TEXT,
    resolution_last_method TEXT,
    resolution_last_at TIMESTAMPTZ
);

-- Azure products
CREATE TABLE IF NOT EXISTS staging.azure_products (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT,
    title TEXT,
    brand TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    category TEXT,
    availability TEXT,
    condition_value TEXT,
    shipping_cost DECIMAL(10,2),
    source TEXT DEFAULT 'azure_inference',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Azure inferences
CREATE TABLE IF NOT EXISTS staging.azure_inferences (
    id BIGSERIAL PRIMARY KEY,
    input_text TEXT,
    inference_result JSONB,
    confidence_score DECIMAL(5,4),
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    matched BOOLEAN DEFAULT false,
    match_reason TEXT
);

-- Google JSON payloads
CREATE TABLE IF NOT EXISTS staging.google_payloads (
    id BIGSERIAL PRIMARY KEY,
    payload_type TEXT,
    raw_payload JSONB,
    extracted_fields JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT false,
    matched BOOLEAN DEFAULT false,
    match_reason TEXT
);

-- =============================================================================
-- MASTERDATA LAYER - Reference Data
-- =============================================================================

-- Brands master table
CREATE TABLE IF NOT EXISTS masterdata.brands (
    id BIGSERIAL PRIMARY KEY,
    brand_name TEXT UNIQUE NOT NULL,
    normalized_name TEXT,
    category TEXT,
    parent_brand TEXT,
    country TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brand aliases for fuzzy matching
CREATE TABLE IF NOT EXISTS masterdata.brand_aliases (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT REFERENCES masterdata.brands(id),
    alias TEXT NOT NULL,
    alias_type TEXT DEFAULT 'variant',
    confidence DECIMAL(5,4) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- OPS LAYER - Operational Tables
-- =============================================================================

-- Source inventory for pipeline diagnostics
CREATE TABLE IF NOT EXISTS ops.source_inventory (
    id BIGSERIAL PRIMARY KEY,
    source_name TEXT NOT NULL,
    source_type TEXT,
    total_records BIGINT DEFAULT 0,
    last_updated TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brand resolution log
CREATE TABLE IF NOT EXISTS ops.brand_resolution_log (
    id BIGSERIAL PRIMARY KEY,
    sku_id BIGINT,
    original_brand TEXT,
    resolved_brand TEXT,
    resolution_method TEXT,
    confidence DECIMAL(5,4),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Brand merge summary
CREATE TABLE IF NOT EXISTS ops.brand_merge_summary (
    id BIGSERIAL PRIMARY KEY,
    source_brand TEXT,
    target_brand TEXT,
    merge_count BIGINT DEFAULT 0,
    merge_date DATE DEFAULT CURRENT_DATE,
    merge_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Unmatched inference log
CREATE TABLE IF NOT EXISTS ops.unmatched_inference_log (
    id BIGSERIAL PRIMARY KEY,
    inference_id BIGINT REFERENCES staging.azure_inferences(id),
    reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry TIMESTAMPTZ,
    status TEXT DEFAULT 'unmatched',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Unmatched payload log
CREATE TABLE IF NOT EXISTS ops.unmatched_payload_log (
    id BIGSERIAL PRIMARY KEY,
    payload_id BIGINT REFERENCES staging.google_payloads(id),
    reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry TIMESTAMPTZ,
    status TEXT DEFAULT 'unmatched',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- SCOUT SCHEMA - Application Layer
-- =============================================================================

-- Recommendations with RLS
CREATE TABLE IF NOT EXISTS scout.recommendations (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT UNIQUE NOT NULL DEFAULT scout.gen_task_id(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'open',
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Platinum predictions for MindsDB forecasts
CREATE TABLE IF NOT EXISTS scout.platinum_predictions_revenue_14d (
    id BIGSERIAL PRIMARY KEY,
    day DATE NOT NULL,
    predicted_revenue DECIMAL(12,2),
    confidence_interval_lower DECIMAL(12,2),
    confidence_interval_upper DECIMAL(12,2),
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(day)
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Task ID generation function
CREATE OR REPLACE FUNCTION scout.gen_task_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'task_' || extract(epoch from now())::bigint || '_' || floor(random() * 1000)::text;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS - Analytics Layer
-- =============================================================================

-- Pipeline gaps view
CREATE OR REPLACE VIEW public.v_pipeline_gaps AS
SELECT 
    si.source_name,
    si.source_type,
    si.total_records,
    si.last_updated,
    si.health_status,
    CASE 
        WHEN si.last_updated < now() - interval '24 hours' THEN 'stale'
        WHEN si.health_status = 'error' THEN 'error'
        WHEN si.total_records = 0 THEN 'empty'
        ELSE 'healthy'
    END as gap_status
FROM ops.source_inventory si;

-- Pipeline summary view
CREATE OR REPLACE VIEW public.v_pipeline_summary AS
SELECT 
    COUNT(*) as total_sources,
    COUNT(*) FILTER (WHERE health_status = 'healthy') as healthy_sources,
    COUNT(*) FILTER (WHERE health_status = 'error') as error_sources,
    COUNT(*) FILTER (WHERE last_updated < now() - interval '24 hours') as stale_sources,
    SUM(total_records) as total_records
FROM ops.source_inventory;

-- Brand resolution metrics
CREATE OR REPLACE VIEW public.v_brand_resolution_metrics AS
SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    AVG(confidence) as avg_confidence,
    resolution_method,
    DATE(created_at) as resolution_date
FROM ops.brand_resolution_log
GROUP BY resolution_method, DATE(created_at);

-- Unknown brands daily trend
CREATE OR REPLACE VIEW public.v_unknown_brands_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT original_brand) as unique_unknown_brands,
    COUNT(*) as total_unknown_attempts
FROM ops.brand_resolution_log
WHERE status = 'failed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Data quality unmatched view
CREATE OR REPLACE VIEW public.v_dq_unmatched AS
SELECT 
    'azure_inference' as source_type,
    COUNT(*) as unmatched_count,
    'inference_processing' as reason_category
FROM staging.azure_inferences
WHERE matched = false
UNION ALL
SELECT 
    'google_payload' as source_type,
    COUNT(*) as unmatched_count,
    'payload_processing' as reason_category
FROM staging.google_payloads
WHERE matched = false;

-- Data quality unmatched daily
CREATE OR REPLACE VIEW public.v_dq_unmatched_daily AS
SELECT 
    DATE(ai.created_at) as date,
    'azure_inference' as source_type,
    COUNT(*) FILTER (WHERE ai.matched = false) as unmatched_count
FROM staging.azure_inferences ai
GROUP BY DATE(ai.created_at)
UNION ALL
SELECT 
    DATE(gp.created_at) as date,
    'google_payload' as source_type,
    COUNT(*) FILTER (WHERE gp.matched = false) as unmatched_count
FROM staging.google_payloads gp
GROUP BY DATE(gp.created_at);

-- =============================================================================
-- RLS POLICIES FOR SCOUT SCHEMA
-- =============================================================================

-- Enable RLS on recommendations
ALTER TABLE scout.recommendations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see their own recommendations
CREATE POLICY IF NOT EXISTS "Users can view own recommendations" ON scout.recommendations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own recommendations  
CREATE POLICY IF NOT EXISTS "Users can insert own recommendations" ON scout.recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own recommendations
CREATE POLICY IF NOT EXISTS "Users can update own recommendations" ON scout.recommendations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for service role to access all recommendations
CREATE POLICY IF NOT EXISTS "Service role full access" ON scout.recommendations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert sample brands
INSERT INTO masterdata.brands (brand_name, normalized_name, category, country) VALUES
('Nike', 'nike', 'sportswear', 'US'),
('Adidas', 'adidas', 'sportswear', 'DE'),
('Apple', 'apple', 'technology', 'US'),
('Samsung', 'samsung', 'technology', 'KR'),
('Toyota', 'toyota', 'automotive', 'JP'),
('BMW', 'bmw', 'automotive', 'DE'),
('Coca-Cola', 'coca_cola', 'beverages', 'US')
ON CONFLICT (brand_name) DO NOTHING;

-- Insert brand aliases
INSERT INTO masterdata.brand_aliases (brand_id, alias, alias_type) VALUES
((SELECT id FROM masterdata.brands WHERE brand_name = 'Nike'), 'NIKE', 'uppercase'),
((SELECT id FROM masterdata.brands WHERE brand_name = 'Adidas'), 'ADIDAS', 'uppercase'),
((SELECT id FROM masterdata.brands WHERE brand_name = 'Apple'), 'AAPL', 'ticker'),
((SELECT id FROM masterdata.brands WHERE brand_name = 'BMW'), 'Bayerische Motoren Werke', 'full_name')
ON CONFLICT DO NOTHING;

-- Insert source inventory
INSERT INTO ops.source_inventory (source_name, source_type, total_records, health_status) VALUES
('google_drive_skus', 'file', 0, 'healthy'),
('azure_product_inference', 'api', 0, 'healthy'),
('google_json_feed', 'api', 0, 'healthy')
ON CONFLICT DO NOTHING;

-- Insert sample recommendations
INSERT INTO scout.recommendations (title, description, category, priority, status) VALUES
('Improve brand resolution accuracy', 'Implement fuzzy matching for brand names', 'data_quality', 1, 'open'),
('Set up automated data quality checks', 'Create alerts for data pipeline failures', 'monitoring', 2, 'open'),
('Optimize Azure inference processing', 'Batch process inferences to reduce API costs', 'performance', 2, 'open'),
('Create dashboard for pipeline health', 'Build real-time monitoring dashboard', 'visualization', 3, 'open'),
('Implement data lineage tracking', 'Track data transformation across pipeline stages', 'governance', 2, 'open'),
('Set up backup and recovery', 'Ensure data pipeline can recover from failures', 'reliability', 1, 'open'),
('Create API documentation', 'Document all Edge Functions and endpoints', 'documentation', 3, 'open')
ON CONFLICT (task_id) DO NOTHING;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Staging layer indexes
CREATE INDEX IF NOT EXISTS idx_drive_skus_brand ON staging.drive_skus(brand);
CREATE INDEX IF NOT EXISTS idx_drive_skus_created_at ON staging.drive_skus(created_at);
CREATE INDEX IF NOT EXISTS idx_azure_products_brand ON staging.azure_products(brand);
CREATE INDEX IF NOT EXISTS idx_azure_inferences_matched ON staging.azure_inferences(matched);
CREATE INDEX IF NOT EXISTS idx_google_payloads_matched ON staging.google_payloads(matched);

-- Ops layer indexes
CREATE INDEX IF NOT EXISTS idx_brand_resolution_log_status ON ops.brand_resolution_log(status);
CREATE INDEX IF NOT EXISTS idx_brand_resolution_log_created_at ON ops.brand_resolution_log(created_at);
CREATE INDEX IF NOT EXISTS idx_source_inventory_health ON ops.source_inventory(health_status);

-- Scout layer indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON scout.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON scout.recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON scout.recommendations(category);
CREATE INDEX IF NOT EXISTS idx_platinum_predictions_day ON scout.platinum_predictions_revenue_14d(day);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_drive_skus_updated_at BEFORE UPDATE ON staging.drive_skus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_azure_products_updated_at BEFORE UPDATE ON staging.azure_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON masterdata.brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_inventory_updated_at BEFORE UPDATE ON ops.source_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON scout.recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();