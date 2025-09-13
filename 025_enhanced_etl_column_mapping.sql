-- 025_enhanced_etl_column_mapping.sql
-- Purpose: Enhanced ETL infrastructure with ML-powered column mapping
-- Integrates with existing Scout ETL pipeline and adds advanced features

BEGIN;

-- ============================================================================
-- ENHANCED COLUMN MAPPINGS TABLE
-- ============================================================================

-- Drop existing table if it exists and recreate with enhanced schema
DROP TABLE IF EXISTS scout.column_mappings CASCADE;

CREATE TABLE scout.column_mappings (
    id SERIAL PRIMARY KEY,
    source_column VARCHAR(255) NOT NULL,
    target_column VARCHAR(255),
    match_strategy VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    data_type VARCHAR(50),
    transformation VARCHAR(255),
    default_value TEXT,
    validation_rule TEXT,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sheet_source VARCHAR(255),
    user_validated BOOLEAN DEFAULT FALSE,
    ml_features JSONB,
    metadata JSONB,

    -- Constraints
    CONSTRAINT unique_source_sheet UNIQUE(source_column, sheet_source),
    CONSTRAINT valid_strategy CHECK (match_strategy IN ('exact', 'fuzzy', 'pattern', 'ml_prediction', 'historical', 'default', 'manual'))
);

-- Indexes for performance
CREATE INDEX idx_column_mappings_source ON scout.column_mappings(source_column);
CREATE INDEX idx_column_mappings_target ON scout.column_mappings(target_column);
CREATE INDEX idx_column_mappings_strategy ON scout.column_mappings(match_strategy);
CREATE INDEX idx_column_mappings_confidence ON scout.column_mappings(confidence_score DESC);
CREATE INDEX idx_column_mappings_usage ON scout.column_mappings(usage_count DESC);
CREATE INDEX idx_column_mappings_last_used ON scout.column_mappings(last_used DESC);
CREATE INDEX idx_column_mappings_sheet_source ON scout.column_mappings(sheet_source);
CREATE GIN INDEX idx_column_mappings_ml_features ON scout.column_mappings USING GIN(ml_features);

-- ============================================================================
-- ENHANCED ETL SYNC LOG WITH DETAILED METRICS
-- ============================================================================

-- Enhance existing etl_sync_log table
ALTER TABLE scout.etl_sync_log
ADD COLUMN IF NOT EXISTS column_mappings_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ml_predictions_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuzzy_matches_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exact_matches_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unmapped_columns_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_mapping_confidence DECIMAL(4,3),
ADD COLUMN IF NOT EXISTS processing_metrics JSONB,
ADD COLUMN IF NOT EXISTS data_quality_score DECIMAL(4,3);

-- ============================================================================
-- ML MODEL METADATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scout.ml_model_metadata (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    training_date TIMESTAMPTZ DEFAULT NOW(),
    training_samples INTEGER NOT NULL,
    accuracy_score DECIMAL(4,3),
    precision_score DECIMAL(4,3),
    recall_score DECIMAL(4,3),
    f1_score DECIMAL(4,3),
    model_path TEXT,
    hyperparameters JSONB,
    feature_importance JSONB,
    validation_metrics JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_model_version UNIQUE(model_name, model_version)
);

-- ============================================================================
-- DATA QUALITY METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scout.data_quality_metrics (
    id SERIAL PRIMARY KEY,
    check_timestamp TIMESTAMPTZ DEFAULT NOW(),
    sheet_name VARCHAR(255),
    table_name VARCHAR(255),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
    details JSONB,
    sync_id VARCHAR(64),

    -- Foreign key to etl_sync_log
    CONSTRAINT fk_sync_id FOREIGN KEY (sync_id) REFERENCES scout.etl_sync_log(sync_id) ON DELETE CASCADE
);

-- Indexes for data quality metrics
CREATE INDEX idx_data_quality_timestamp ON scout.data_quality_metrics(check_timestamp DESC);
CREATE INDEX idx_data_quality_sheet ON scout.data_quality_metrics(sheet_name);
CREATE INDEX idx_data_quality_metric ON scout.data_quality_metrics(metric_name);
CREATE INDEX idx_data_quality_status ON scout.data_quality_metrics(status);

-- ============================================================================
-- TRANSFORMATION RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scout.transformation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    pattern VARCHAR(500),
    transformation_function TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    examples JSONB,

    CONSTRAINT valid_rule_type CHECK (rule_type IN ('regex', 'function', 'lookup', 'formula'))
);

-- Insert default transformation rules
INSERT INTO scout.transformation_rules (rule_name, rule_type, pattern, transformation_function, description, examples) VALUES
('extract_store_number', 'regex', '\\d+', 'REGEXP_EXTRACT({value}, ''\\d+'')', 'Extract numeric store ID from store name', '["Store_001" -> "001", "Shop 123" -> "123"]'),
('standardize_datetime', 'function', '', 'TO_TIMESTAMP({value}, ''YYYY-MM-DD HH24:MI:SS'')', 'Convert various datetime formats to standard ISO format', '["2024-01-15 10:30" -> "2024-01-15T10:30:00Z"]'),
('standardize_payment_method', 'function', '', 'UPPER(REPLACE({value}, '' '', ''_''))', 'Normalize payment method names', '["Credit Card" -> "CREDIT_CARD", "cash" -> "CASH"]'),
('standardize_category', 'function', '', 'INITCAP(REPLACE({value}, ''_'', '' ''))', 'Standardize category names', '["food_beverage" -> "Food Beverage"]'),
('categorize_basket_size', 'function', '', 'CASE WHEN {value}::int <= 3 THEN ''Small'' WHEN {value}::int <= 7 THEN ''Medium'' ELSE ''Large'' END', 'Categorize basket size', '["2" -> "Small", "5" -> "Medium", "10" -> "Large"]'),
('normalize_currency', 'function', '', 'ROUND({value}::numeric, 2)', 'Normalize currency to 2 decimal places', '["123.456" -> "123.46"]'),
('extract_brand', 'regex', '^([A-Za-z]+)', 'REGEXP_EXTRACT({value}, ''^([A-Za-z]+)'')', 'Extract brand name from product description', '["Nike Air Max" -> "Nike"]'),
('clean_product_name', 'function', '', 'TRIM(REGEXP_REPLACE({value}, ''[^A-Za-z0-9 ]'', '''', ''g''))', 'Remove special characters from product names', '["Product@123!" -> "Product123"]');

-- ============================================================================
-- VIEWS FOR ANALYTICS AND MONITORING
-- ============================================================================

-- Column mapping effectiveness view
CREATE OR REPLACE VIEW scout.v_column_mapping_effectiveness AS
SELECT
    match_strategy,
    COUNT(*) as total_mappings,
    AVG(confidence_score) as avg_confidence,
    SUM(usage_count) as total_usage,
    COUNT(CASE WHEN user_validated THEN 1 END) as validated_mappings,
    COUNT(CASE WHEN confidence_score >= 0.9 THEN 1 END) as high_confidence_mappings,
    COUNT(CASE WHEN confidence_score BETWEEN 0.7 AND 0.89 THEN 1 END) as medium_confidence_mappings,
    COUNT(CASE WHEN confidence_score < 0.7 THEN 1 END) as low_confidence_mappings,
    MAX(last_used) as last_used_date
FROM scout.column_mappings
GROUP BY match_strategy
ORDER BY avg_confidence DESC;

-- ETL performance dashboard
CREATE OR REPLACE VIEW scout.v_etl_performance_dashboard AS
SELECT
    DATE(sync_timestamp) as sync_date,
    sync_type,
    COUNT(*) as sync_count,
    AVG(duration_seconds) as avg_duration_seconds,
    SUM(records_inserted + records_updated) as total_records_processed,
    AVG(avg_mapping_confidence) as avg_mapping_confidence,
    SUM(exact_matches_count) as total_exact_matches,
    SUM(fuzzy_matches_count) as total_fuzzy_matches,
    SUM(ml_predictions_count) as total_ml_predictions,
    SUM(unmapped_columns_count) as total_unmapped_columns,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_syncs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_syncs,
    AVG(data_quality_score) as avg_data_quality_score
FROM scout.etl_sync_log
WHERE sync_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(sync_timestamp), sync_type
ORDER BY sync_date DESC, sync_type;

-- Data quality trends
CREATE OR REPLACE VIEW scout.v_data_quality_trends AS
SELECT
    DATE(check_timestamp) as check_date,
    metric_name,
    COUNT(*) as total_checks,
    AVG(metric_value) as avg_metric_value,
    COUNT(CASE WHEN status = 'pass' THEN 1 END) as passed_checks,
    COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_checks,
    COUNT(CASE WHEN status = 'fail' THEN 1 END) as failed_checks,
    (COUNT(CASE WHEN status = 'pass' THEN 1 END)::float / COUNT(*) * 100) as pass_rate_percent
FROM scout.data_quality_metrics
WHERE check_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(check_timestamp), metric_name
ORDER BY check_date DESC, metric_name;

-- ============================================================================
-- FUNCTIONS FOR ETL OPERATIONS
-- ============================================================================

-- Function to get column mapping suggestions
CREATE OR REPLACE FUNCTION scout.get_column_mapping_suggestions(
    p_source_column TEXT,
    p_sheet_source TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    target_column TEXT,
    confidence_score DECIMAL,
    match_strategy TEXT,
    usage_count INTEGER,
    last_used TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.target_column,
        cm.confidence_score,
        cm.match_strategy,
        cm.usage_count,
        cm.last_used
    FROM scout.column_mappings cm
    WHERE
        (p_sheet_source IS NULL OR cm.sheet_source = p_sheet_source)
        AND (
            cm.source_column ILIKE '%' || p_source_column || '%'
            OR SIMILARITY(cm.source_column, p_source_column) > 0.5
        )
    ORDER BY
        SIMILARITY(cm.source_column, p_source_column) DESC,
        cm.confidence_score DESC,
        cm.usage_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to log ETL performance metrics
CREATE OR REPLACE FUNCTION scout.log_etl_metrics(
    p_sync_id TEXT,
    p_column_mappings JSONB,
    p_data_quality_metrics JSONB,
    p_processing_metrics JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exact_matches INTEGER := 0;
    v_fuzzy_matches INTEGER := 0;
    v_ml_predictions INTEGER := 0;
    v_unmapped_columns INTEGER := 0;
    v_total_confidence DECIMAL := 0;
    v_mapping_count INTEGER := 0;
BEGIN
    -- Process column mappings
    IF p_column_mappings IS NOT NULL THEN
        SELECT
            COALESCE(SUM(CASE WHEN mapping->>'match_strategy' = 'exact' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN mapping->>'match_strategy' = 'fuzzy' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN mapping->>'match_strategy' = 'ml_prediction' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN mapping->>'target_column' IS NULL THEN 1 ELSE 0 END), 0),
            COALESCE(AVG((mapping->>'confidence_score')::decimal), 0),
            COUNT(*)
        INTO v_exact_matches, v_fuzzy_matches, v_ml_predictions, v_unmapped_columns, v_total_confidence, v_mapping_count
        FROM jsonb_array_elements(p_column_mappings) as mapping;
    END IF;

    -- Update etl_sync_log with metrics
    UPDATE scout.etl_sync_log
    SET
        column_mappings_used = v_mapping_count,
        exact_matches_count = v_exact_matches,
        fuzzy_matches_count = v_fuzzy_matches,
        ml_predictions_count = v_ml_predictions,
        unmapped_columns_count = v_unmapped_columns,
        avg_mapping_confidence = v_total_confidence,
        processing_metrics = p_processing_metrics,
        updated_at = NOW()
    WHERE sync_id = p_sync_id;

    -- Insert data quality metrics
    IF p_data_quality_metrics IS NOT NULL THEN
        INSERT INTO scout.data_quality_metrics (sync_id, metric_name, metric_value, threshold_value, status, details)
        SELECT
            p_sync_id,
            metric->>'name',
            (metric->>'value')::decimal,
            (metric->>'threshold')::decimal,
            metric->>'status',
            metric->'details'
        FROM jsonb_array_elements(p_data_quality_metrics) as metric;
    END IF;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error logging ETL metrics: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function for ETL health check
CREATE OR REPLACE FUNCTION scout.etl_health_check()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    status TEXT,
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- Last sync check
    SELECT
        'minutes_since_last_sync'::TEXT,
        EXTRACT(EPOCH FROM (NOW() - MAX(sync_timestamp)))/60,
        CASE
            WHEN EXTRACT(EPOCH FROM (NOW() - MAX(sync_timestamp)))/60 < 30 THEN 'healthy'
            WHEN EXTRACT(EPOCH FROM (NOW() - MAX(sync_timestamp)))/60 < 60 THEN 'warning'
            ELSE 'critical'
        END,
        jsonb_build_object('last_sync', MAX(sync_timestamp))
    FROM scout.etl_sync_log

    UNION ALL

    -- Success rate check (24h)
    SELECT
        'success_rate_24h'::TEXT,
        COALESCE(
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::NUMERIC /
            NULLIF(COUNT(*), 0) * 100, 0
        ),
        CASE
            WHEN COALESCE(
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::NUMERIC /
                NULLIF(COUNT(*), 0), 0
            ) >= 0.95 THEN 'healthy'
            WHEN COALESCE(
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::NUMERIC /
                NULLIF(COUNT(*), 0), 0
            ) >= 0.8 THEN 'warning'
            ELSE 'critical'
        END,
        jsonb_build_object(
            'total_syncs', COUNT(*),
            'successful_syncs', SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END),
            'failed_syncs', SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)
        )
    FROM scout.etl_sync_log
    WHERE sync_timestamp > NOW() - INTERVAL '24 hours'

    UNION ALL

    -- Column mapping effectiveness
    SELECT
        'avg_mapping_confidence'::TEXT,
        AVG(confidence_score),
        CASE
            WHEN AVG(confidence_score) >= 0.9 THEN 'healthy'
            WHEN AVG(confidence_score) >= 0.7 THEN 'warning'
            ELSE 'critical'
        END,
        jsonb_build_object(
            'total_mappings', COUNT(*),
            'high_confidence', COUNT(CASE WHEN confidence_score >= 0.9 THEN 1 END),
            'validated_mappings', COUNT(CASE WHEN user_validated THEN 1 END)
        )
    FROM scout.column_mappings
    WHERE last_used > NOW() - INTERVAL '7 days'

    UNION ALL

    -- Data quality trends
    SELECT
        'data_quality_pass_rate'::TEXT,
        COALESCE(
            COUNT(CASE WHEN status = 'pass' THEN 1 END)::NUMERIC /
            NULLIF(COUNT(*), 0) * 100, 0
        ),
        CASE
            WHEN COALESCE(
                COUNT(CASE WHEN status = 'pass' THEN 1 END)::NUMERIC /
                NULLIF(COUNT(*), 0), 0
            ) >= 0.9 THEN 'healthy'
            WHEN COALESCE(
                COUNT(CASE WHEN status = 'pass' THEN 1 END)::NUMERIC /
                NULLIF(COUNT(*), 0), 0
            ) >= 0.7 THEN 'warning'
            ELSE 'critical'
        END,
        jsonb_build_object(
            'total_checks', COUNT(*),
            'passed_checks', COUNT(CASE WHEN status = 'pass' THEN 1 END),
            'failed_checks', COUNT(CASE WHEN status = 'fail' THEN 1 END)
        )
    FROM scout.data_quality_metrics
    WHERE check_timestamp > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION scout.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to column_mappings
CREATE TRIGGER trigger_column_mappings_updated_at
    BEFORE UPDATE ON scout.column_mappings
    FOR EACH ROW
    EXECUTE FUNCTION scout.update_timestamp();

-- Apply trigger to transformation_rules
CREATE TRIGGER trigger_transformation_rules_updated_at
    BEFORE UPDATE ON scout.transformation_rules
    FOR EACH ROW
    EXECUTE FUNCTION scout.update_timestamp();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE scout.column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.ml_model_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.transformation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role full access column_mappings" ON scout.column_mappings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access ml_model_metadata" ON scout.ml_model_metadata
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access data_quality_metrics" ON scout.data_quality_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access transformation_rules" ON scout.transformation_rules
    FOR ALL USING (auth.role() = 'service_role');

-- Create read-only policies for authenticated users
CREATE POLICY "Read access column_mappings" ON scout.column_mappings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Read access data_quality_metrics" ON scout.data_quality_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample column mappings for testing
INSERT INTO scout.column_mappings (
    source_column, target_column, match_strategy, confidence_score,
    data_type, sheet_source, user_validated
) VALUES
('trans_id', 'transaction_id', 'fuzzy', 0.95, 'string', 'test_sheet', true),
('store_num', 'store_id', 'pattern', 0.90, 'string', 'test_sheet', true),
('payment_type', 'payment_method', 'exact', 1.0, 'string', 'test_sheet', true),
('cust_gender', 'customer_gender', 'fuzzy', 0.88, 'string', 'test_sheet', false),
('age_bracket', 'age_group', 'pattern', 0.92, 'string', 'test_sheet', true),
('prod_category', 'product_category', 'fuzzy', 0.85, 'string', 'test_sheet', false),
('total_cost', 'total_amount', 'exact', 1.0, 'numeric', 'test_sheet', true);

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Verify table creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'scout'
    AND table_name IN ('column_mappings', 'ml_model_metadata', 'data_quality_metrics', 'transformation_rules');

    IF table_count = 4 THEN
        RAISE NOTICE 'SUCCESS: All 4 enhanced ETL tables created successfully';
    ELSE
        RAISE NOTICE 'WARNING: Only % out of 4 tables were created', table_count;
    END IF;
END $$;

-- Verify sample data
DO $$
DECLARE
    mapping_count INTEGER;
    rule_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mapping_count FROM scout.column_mappings;
    SELECT COUNT(*) INTO rule_count FROM scout.transformation_rules;

    RAISE NOTICE 'Sample data inserted: % column mappings, % transformation rules', mapping_count, rule_count;
END $$;