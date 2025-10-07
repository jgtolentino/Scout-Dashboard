-- ============================================================================
-- Scout v7.1 Comprehensive Model Performance Tracking System
-- Covers ALL 7.1 capabilities with write data mode (not read-only)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create dedicated performance schema
CREATE SCHEMA IF NOT EXISTS scout_performance;

-- ============================================================================
-- 1. AGENT SYSTEM PERFORMANCE TRACKING
-- ============================================================================

-- Individual agent performance metrics
CREATE TABLE scout_performance.agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name TEXT NOT NULL, -- query_agent, retriever_agent, chart_vision_agent, narrative_agent, orchestrator
    capability TEXT NOT NULL, -- nl_sql, rag_retrieval, chart_generation, narrative, orchestration
    tenant_id UUID NOT NULL,
    
    -- Performance metrics
    execution_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    quality_score FLOAT CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
    confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    
    -- Input/output tracking
    input_tokens INTEGER,
    output_tokens INTEGER,
    input_hash TEXT, -- For deduplication
    output_hash TEXT,
    
    -- Context and metadata
    user_context JSONB,
    execution_context JSONB,
    error_details JSONB,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexing
    CONSTRAINT agent_metrics_time_check CHECK (completed_at >= started_at)
);

-- Agent coordination performance (multi-agent workflows)
CREATE TABLE scout_performance.agent_coordination_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orchestration_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Workflow details
    agent_sequence TEXT[] NOT NULL, -- Order of agent execution
    parallel_agents TEXT[], -- Agents executed in parallel
    total_agents INTEGER NOT NULL,
    
    -- Performance metrics
    total_execution_time_ms INTEGER NOT NULL,
    coordination_overhead_ms INTEGER NOT NULL,
    context_preservation_score FLOAT CHECK (context_preservation_score >= 0.0 AND context_preservation_score <= 1.0),
    quality_gates_passed INTEGER NOT NULL,
    quality_gates_total INTEGER NOT NULL,
    
    -- Results
    final_success BOOLEAN NOT NULL,
    final_quality_score FLOAT,
    agent_results JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. NL→SQL PERFORMANCE TRACKING
-- ============================================================================

-- Natural language to SQL conversion performance
CREATE TABLE scout_performance.nl_sql_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Input details
    natural_language_input TEXT NOT NULL,
    user_intent TEXT, -- classified intent
    language_detected TEXT DEFAULT 'en', -- en, fil, etc.
    complexity_score FLOAT, -- 0.0 (simple) to 1.0 (complex)
    
    -- Generated SQL
    generated_sql TEXT NOT NULL,
    sql_valid BOOLEAN NOT NULL,
    sql_executed BOOLEAN NOT NULL,
    execution_time_ms INTEGER,
    rows_returned INTEGER,
    
    -- Quality metrics
    semantic_accuracy_score FLOAT CHECK (semantic_accuracy_score >= 0.0 AND semantic_accuracy_score <= 1.0),
    sql_efficiency_score FLOAT, -- Query optimization score
    security_compliance BOOLEAN NOT NULL DEFAULT true,
    guardrail_violations JSONB,
    
    -- Validation results
    validation_errors JSONB,
    business_context_used JSONB,
    entity_resolutions JSONB,
    
    -- Performance benchmarks
    baseline_query_time_ms INTEGER, -- Expected time for this query type
    performance_vs_baseline FLOAT, -- Ratio: actual/baseline
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SQL query optimization tracking
CREATE TABLE scout_performance.sql_optimization_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_query_hash TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Original vs optimized
    original_sql TEXT NOT NULL,
    optimized_sql TEXT NOT NULL,
    optimization_strategy TEXT, -- index_hint, join_reorder, cte_optimization
    
    -- Performance improvement
    original_execution_time_ms INTEGER NOT NULL,
    optimized_execution_time_ms INTEGER NOT NULL,
    improvement_factor FLOAT NOT NULL, -- original/optimized
    
    -- Resource usage
    original_cpu_cost FLOAT,
    optimized_cpu_cost FLOAT,
    memory_usage_mb FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. RAG PIPELINE PERFORMANCE TRACKING
-- ============================================================================

-- Retrieval-Augmented Generation performance
CREATE TABLE scout_performance.rag_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retrieval_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Query details
    query_text TEXT NOT NULL,
    query_embedding vector(1536),
    query_type TEXT, -- business_context, competitive_intel, historical_insight
    
    -- Retrieval metrics
    total_chunks_available INTEGER NOT NULL,
    chunks_retrieved INTEGER NOT NULL,
    retrieval_time_ms INTEGER NOT NULL,
    
    -- Relevance scoring
    relevance_scores FLOAT[] NOT NULL,
    avg_relevance_score FLOAT NOT NULL,
    min_relevance_threshold FLOAT NOT NULL DEFAULT 0.7,
    chunks_above_threshold INTEGER NOT NULL,
    
    -- Hybrid search performance
    vector_similarity_score FLOAT,
    bm25_score FLOAT,
    metadata_boost_score FLOAT,
    final_ranking_score FLOAT,
    
    -- Context utilization
    context_window_tokens INTEGER NOT NULL,
    context_utilized_tokens INTEGER NOT NULL,
    context_utilization_rate FLOAT NOT NULL,
    
    -- Quality assessment
    response_relevance_score FLOAT,
    response_completeness_score FLOAT,
    hallucination_risk_score FLOAT,
    
    -- Retrieved content metadata
    retrieved_content_types TEXT[],
    source_diversity_score FLOAT,
    temporal_distribution JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge graph traversal performance
CREATE TABLE scout_performance.kg_traversal_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    traversal_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Traversal details
    start_entities TEXT[] NOT NULL,
    target_entities TEXT[] NOT NULL,
    traversal_path JSONB NOT NULL,
    max_hops INTEGER NOT NULL,
    
    -- Performance metrics
    traversal_time_ms INTEGER NOT NULL,
    entities_explored INTEGER NOT NULL,
    relationships_followed INTEGER NOT NULL,
    path_efficiency_score FLOAT,
    
    -- Results quality
    relevant_connections_found INTEGER,
    connection_strength_scores FLOAT[],
    business_impact_score FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PREDICTIVE MODEL PERFORMANCE TRACKING
-- ============================================================================

-- MindsDB model accuracy tracking
CREATE TABLE scout_performance.model_accuracy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL, -- revenue_forecaster, demand_predictor, churn_classifier
    model_version TEXT NOT NULL,
    prediction_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Prediction details
    prediction_type TEXT NOT NULL, -- revenue, demand, churn, classification
    business_domain TEXT NOT NULL, -- brand_performance, inventory, competitive
    prediction_horizon TEXT NOT NULL, -- 1d, 7d, 14d, 30d, 90d
    
    -- Actual vs predicted
    predicted_value FLOAT NOT NULL,
    actual_value FLOAT,
    prediction_confidence FLOAT CHECK (prediction_confidence >= 0.0 AND prediction_confidence <= 1.0),
    confidence_interval_lower FLOAT,
    confidence_interval_upper FLOAT,
    
    -- Accuracy metrics
    absolute_error FLOAT,
    percentage_error FLOAT,
    within_confidence_interval BOOLEAN,
    accuracy_tier TEXT, -- excellent, good, acceptable, poor
    
    -- Business impact
    business_impact_score FLOAT, -- How important this prediction was
    decision_influenced BOOLEAN, -- Did this prediction influence a business decision
    financial_impact_estimate FLOAT,
    
    -- Model metadata
    feature_count INTEGER,
    training_data_size INTEGER,
    model_freshness_hours FLOAT,
    data_quality_score FLOAT,
    
    predicted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_recorded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model drift detection
CREATE TABLE scout_performance.model_drift_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Drift detection
    drift_type TEXT NOT NULL, -- data_drift, concept_drift, performance_drift
    drift_severity FLOAT CHECK (drift_severity >= 0.0 AND drift_severity <= 1.0),
    drift_threshold FLOAT NOT NULL DEFAULT 0.1,
    drift_detected BOOLEAN NOT NULL,
    
    -- Statistical measures
    psi_score FLOAT, -- Population Stability Index
    ks_statistic FLOAT, -- Kolmogorov-Smirnov test
    jensen_shannon_distance FLOAT,
    wasserstein_distance FLOAT,
    
    -- Feature-level drift
    feature_drift_scores JSONB, -- Per-feature drift scores
    most_drifted_features TEXT[],
    
    -- Performance impact
    performance_degradation FLOAT,
    recommendation TEXT, -- retrain, recalibrate, monitor, ignore
    
    -- Time windows
    baseline_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    baseline_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. BUSINESS CAPABILITY PERFORMANCE TRACKING
-- ============================================================================

-- End-to-end capability health monitoring
CREATE TABLE scout_performance.capability_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capability_name TEXT NOT NULL, -- agentic_analytics, predictive_intelligence, real_time_processing
    subcapability TEXT, -- Specific feature within capability
    tenant_id UUID,
    
    -- Health scores (0.0 to 1.0)
    overall_health_score FLOAT NOT NULL CHECK (overall_health_score >= 0.0 AND overall_health_score <= 1.0),
    availability_score FLOAT NOT NULL,
    performance_score FLOAT NOT NULL,
    quality_score FLOAT NOT NULL,
    reliability_score FLOAT NOT NULL,
    
    -- Component breakdown
    component_scores JSONB NOT NULL, -- Detailed scores per component
    failed_components TEXT[],
    degraded_components TEXT[],
    
    -- SLA compliance
    sla_target_uptime FLOAT NOT NULL DEFAULT 0.99,
    actual_uptime FLOAT NOT NULL,
    sla_compliant BOOLEAN NOT NULL,
    sla_violations INTEGER DEFAULT 0,
    
    -- Performance benchmarks
    target_response_time_ms INTEGER NOT NULL,
    actual_p95_response_time_ms INTEGER NOT NULL,
    target_accuracy FLOAT DEFAULT 0.95,
    actual_accuracy FLOAT,
    
    -- Business impact
    active_users INTEGER,
    queries_processed INTEGER,
    business_value_generated FLOAT,
    cost_efficiency_score FLOAT,
    
    measurement_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    measurement_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    last_validated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time performance monitoring
CREATE TABLE scout_performance.realtime_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_type TEXT NOT NULL, -- agent, model, pipeline, api_endpoint
    component_name TEXT NOT NULL,
    metric_name TEXT NOT NULL, -- p95_latency, error_rate, throughput, memory_usage
    tenant_id UUID,
    
    -- Metric values
    current_value FLOAT NOT NULL,
    previous_value FLOAT,
    change_rate FLOAT,
    
    -- Thresholds
    threshold_warning FLOAT,
    threshold_critical FLOAT,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
    
    -- Trending
    trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable', 'volatile')),
    trend_confidence FLOAT,
    
    -- Metadata
    measurement_unit TEXT, -- ms, percentage, count, bytes
    data_source TEXT, -- prometheus, custom, database
    collection_interval_seconds INTEGER DEFAULT 60,
    
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we don't store too much historical data
    CONSTRAINT realtime_metrics_recent CHECK (measured_at > NOW() - INTERVAL '7 days')
);

-- ============================================================================
-- 6. DATA PIPELINE PERFORMANCE TRACKING
-- ============================================================================

-- ETL pipeline performance (Bronze → Silver → Gold → Platinum)
CREATE TABLE scout_performance.etl_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_name TEXT NOT NULL,
    pipeline_stage TEXT NOT NULL CHECK (pipeline_stage IN ('bronze', 'silver', 'gold', 'platinum')),
    batch_id UUID NOT NULL,
    tenant_id UUID,
    
    -- Volume metrics
    records_input INTEGER NOT NULL,
    records_output INTEGER NOT NULL,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    data_quality_pass_rate FLOAT NOT NULL,
    
    -- Performance metrics
    processing_time_ms INTEGER NOT NULL,
    cpu_usage_percent FLOAT,
    memory_usage_mb FLOAT,
    io_operations INTEGER,
    
    -- Quality metrics
    schema_violations INTEGER DEFAULT 0,
    business_rule_violations INTEGER DEFAULT 0,
    data_freshness_score FLOAT,
    completeness_score FLOAT,
    consistency_score FLOAT,
    
    -- Resource efficiency
    cost_per_record FLOAT,
    throughput_records_per_second FLOAT NOT NULL,
    resource_utilization_score FLOAT,
    
    -- Error tracking
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    error_details JSONB,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT etl_performance_time_check CHECK (completed_at >= started_at)
);

-- ============================================================================
-- 7. USER EXPERIENCE PERFORMANCE TRACKING
-- ============================================================================

-- User query performance and satisfaction
CREATE TABLE scout_performance.user_experience_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_id UUID,
    tenant_id UUID NOT NULL,
    
    -- Query details
    query_text TEXT NOT NULL,
    query_type TEXT, -- natural_language, dashboard_filter, direct_sql
    query_complexity TEXT CHECK (query_complexity IN ('simple', 'moderate', 'complex')),
    
    -- Performance metrics
    total_response_time_ms INTEGER NOT NULL,
    time_to_first_result_ms INTEGER,
    time_to_complete_ms INTEGER,
    
    -- User interaction
    user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
    result_clicked BOOLEAN DEFAULT false,
    result_refined BOOLEAN DEFAULT false,
    query_abandoned BOOLEAN DEFAULT false,
    
    -- Quality assessment
    result_relevance_score FLOAT,
    visualization_quality_score FLOAT,
    explanation_clarity_score FLOAT,
    
    -- Context
    device_type TEXT,
    browser_type TEXT,
    network_condition TEXT,
    previous_queries INTEGER DEFAULT 0,
    
    -- Results metadata
    results_returned INTEGER,
    charts_generated INTEGER,
    insights_provided INTEGER,
    recommendations_made INTEGER,
    
    query_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Agent metrics indexes
CREATE INDEX idx_agent_metrics_agent_tenant ON scout_performance.agent_metrics (agent_name, tenant_id, completed_at DESC);
CREATE INDEX idx_agent_metrics_performance ON scout_performance.agent_metrics (execution_time_ms, quality_score);
CREATE INDEX idx_agent_metrics_success ON scout_performance.agent_metrics (success, completed_at DESC);

-- NL→SQL performance indexes
CREATE INDEX idx_nl_sql_performance_tenant ON scout_performance.nl_sql_performance (tenant_id, created_at DESC);
CREATE INDEX idx_nl_sql_performance_quality ON scout_performance.nl_sql_performance (semantic_accuracy_score, sql_executed);
CREATE INDEX idx_nl_sql_performance_hash ON scout_performance.nl_sql_performance USING hash (query_id);

-- RAG performance indexes
CREATE INDEX idx_rag_performance_tenant ON scout_performance.rag_performance (tenant_id, created_at DESC);
CREATE INDEX idx_rag_performance_quality ON scout_performance.rag_performance (avg_relevance_score, response_relevance_score);

-- Model accuracy indexes
CREATE INDEX idx_model_accuracy_model ON scout_performance.model_accuracy (model_name, business_domain, predicted_at DESC);
CREATE INDEX idx_model_accuracy_quality ON scout_performance.model_accuracy (accuracy_tier, business_impact_score DESC);

-- Capability health indexes
CREATE INDEX idx_capability_health_name ON scout_performance.capability_health (capability_name, last_validated DESC);
CREATE INDEX idx_capability_health_score ON scout_performance.capability_health (overall_health_score, sla_compliant);

-- Realtime metrics indexes (with partial index for recent data)
CREATE INDEX idx_realtime_metrics_component ON scout_performance.realtime_metrics (component_type, component_name, measured_at DESC)
    WHERE measured_at > NOW() - INTERVAL '24 hours';
CREATE INDEX idx_realtime_metrics_status ON scout_performance.realtime_metrics (status, measured_at DESC)
    WHERE status != 'healthy';

-- ETL performance indexes
CREATE INDEX idx_etl_performance_pipeline ON scout_performance.etl_performance (pipeline_name, pipeline_stage, completed_at DESC);
CREATE INDEX idx_etl_performance_batch ON scout_performance.etl_performance (batch_id);

-- User experience indexes
CREATE INDEX idx_user_experience_tenant ON scout_performance.user_experience_metrics (tenant_id, query_timestamp DESC);
CREATE INDEX idx_user_experience_performance ON scout_performance.user_experience_metrics (total_response_time_ms, user_satisfaction_score);

-- ============================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all performance tables
ALTER TABLE scout_performance.agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.agent_coordination_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.nl_sql_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.sql_optimization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.rag_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.kg_traversal_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.model_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.model_drift_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.capability_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.etl_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_performance.user_experience_metrics ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies (users can only see their own tenant's data)
CREATE POLICY tenant_isolation_agent_metrics ON scout_performance.agent_metrics
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_agent_coordination ON scout_performance.agent_coordination_metrics
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_nl_sql ON scout_performance.nl_sql_performance
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_sql_optimization ON scout_performance.sql_optimization_metrics
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_rag ON scout_performance.rag_performance
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_kg_traversal ON scout_performance.kg_traversal_performance
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_model_accuracy ON scout_performance.model_accuracy
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_model_drift ON scout_performance.model_drift_metrics
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_capability_health ON scout_performance.capability_health
    FOR ALL USING (tenant_id IS NULL OR tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_realtime ON scout_performance.realtime_metrics
    FOR ALL USING (tenant_id IS NULL OR tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_etl ON scout_performance.etl_performance
    FOR ALL USING (tenant_id IS NULL OR tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation_user_experience ON scout_performance.user_experience_metrics
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- ============================================================================
-- 10. PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to record agent performance
CREATE OR REPLACE FUNCTION scout_performance.record_agent_performance(
    p_agent_name TEXT,
    p_capability TEXT,
    p_tenant_id UUID,
    p_execution_time_ms INTEGER,
    p_success BOOLEAN,
    p_quality_score FLOAT DEFAULT NULL,
    p_confidence_score FLOAT DEFAULT NULL,
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL,
    p_user_context JSONB DEFAULT NULL,
    p_execution_context JSONB DEFAULT NULL,
    p_error_details JSONB DEFAULT NULL,
    p_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_metric_id UUID;
    v_started_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set default start time if not provided
    v_started_at := COALESCE(p_started_at, NOW() - (p_execution_time_ms || ' milliseconds')::INTERVAL);
    
    INSERT INTO scout_performance.agent_metrics (
        agent_name, capability, tenant_id, execution_time_ms, success,
        quality_score, confidence_score, input_tokens, output_tokens,
        input_hash, output_hash, user_context, execution_context, error_details,
        started_at, completed_at
    ) VALUES (
        p_agent_name, p_capability, p_tenant_id, p_execution_time_ms, p_success,
        p_quality_score, p_confidence_score, p_input_tokens, p_output_tokens,
        md5(p_user_context::TEXT), md5(p_execution_context::TEXT), 
        p_user_context, p_execution_context, p_error_details,
        v_started_at, NOW()
    ) RETURNING id INTO v_metric_id;
    
    RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record model prediction performance
CREATE OR REPLACE FUNCTION scout_performance.record_model_prediction(
    p_model_name TEXT,
    p_model_version TEXT,
    p_prediction_id UUID,
    p_tenant_id UUID,
    p_prediction_type TEXT,
    p_business_domain TEXT,
    p_prediction_horizon TEXT,
    p_predicted_value FLOAT,
    p_prediction_confidence FLOAT DEFAULT NULL,
    p_confidence_interval_lower FLOAT DEFAULT NULL,
    p_confidence_interval_upper FLOAT DEFAULT NULL,
    p_business_impact_score FLOAT DEFAULT NULL,
    p_feature_count INTEGER DEFAULT NULL,
    p_training_data_size INTEGER DEFAULT NULL,
    p_data_quality_score FLOAT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_accuracy_id UUID;
BEGIN
    INSERT INTO scout_performance.model_accuracy (
        model_name, model_version, prediction_id, tenant_id,
        prediction_type, business_domain, prediction_horizon,
        predicted_value, prediction_confidence,
        confidence_interval_lower, confidence_interval_upper,
        business_impact_score, feature_count, training_data_size,
        data_quality_score, predicted_at
    ) VALUES (
        p_model_name, p_model_version, p_prediction_id, p_tenant_id,
        p_prediction_type, p_business_domain, p_prediction_horizon,
        p_predicted_value, p_prediction_confidence,
        p_confidence_interval_lower, p_confidence_interval_upper,
        p_business_impact_score, p_feature_count, p_training_data_size,
        p_data_quality_score, NOW()
    ) RETURNING id INTO v_accuracy_id;
    
    RETURN v_accuracy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update model prediction with actual value
CREATE OR REPLACE FUNCTION scout_performance.update_prediction_actual(
    p_prediction_id UUID,
    p_actual_value FLOAT
) RETURNS BOOLEAN AS $$
DECLARE
    v_predicted_value FLOAT;
    v_confidence_lower FLOAT;
    v_confidence_upper FLOAT;
    v_absolute_error FLOAT;
    v_percentage_error FLOAT;
    v_within_interval BOOLEAN;
    v_accuracy_tier TEXT;
BEGIN
    -- Get the prediction details
    SELECT predicted_value, confidence_interval_lower, confidence_interval_upper
    INTO v_predicted_value, v_confidence_lower, v_confidence_upper
    FROM scout_performance.model_accuracy
    WHERE prediction_id = p_prediction_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate accuracy metrics
    v_absolute_error := ABS(p_actual_value - v_predicted_value);
    v_percentage_error := CASE 
        WHEN p_actual_value != 0 THEN ABS(p_actual_value - v_predicted_value) / ABS(p_actual_value) * 100
        ELSE NULL
    END;
    
    -- Check if within confidence interval
    v_within_interval := CASE
        WHEN v_confidence_lower IS NOT NULL AND v_confidence_upper IS NOT NULL THEN
            p_actual_value BETWEEN v_confidence_lower AND v_confidence_upper
        ELSE NULL
    END;
    
    -- Determine accuracy tier
    v_accuracy_tier := CASE
        WHEN v_percentage_error IS NULL THEN 'unknown'
        WHEN v_percentage_error <= 5 THEN 'excellent'
        WHEN v_percentage_error <= 15 THEN 'good'
        WHEN v_percentage_error <= 30 THEN 'acceptable'
        ELSE 'poor'
    END;
    
    -- Update the record
    UPDATE scout_performance.model_accuracy
    SET 
        actual_value = p_actual_value,
        absolute_error = v_absolute_error,
        percentage_error = v_percentage_error,
        within_confidence_interval = v_within_interval,
        accuracy_tier = v_accuracy_tier,
        actual_recorded_at = NOW()
    WHERE prediction_id = p_prediction_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record realtime metrics
CREATE OR REPLACE FUNCTION scout_performance.record_realtime_metric(
    p_component_type TEXT,
    p_component_name TEXT,
    p_metric_name TEXT,
    p_current_value FLOAT,
    p_tenant_id UUID DEFAULT NULL,
    p_threshold_warning FLOAT DEFAULT NULL,
    p_threshold_critical FLOAT DEFAULT NULL,
    p_measurement_unit TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_metric_id UUID;
    v_status TEXT;
    v_previous_value FLOAT;
    v_change_rate FLOAT;
BEGIN
    -- Get previous value for trend calculation
    SELECT current_value INTO v_previous_value
    FROM scout_performance.realtime_metrics
    WHERE component_type = p_component_type 
      AND component_name = p_component_name 
      AND metric_name = p_metric_name
      AND (tenant_id = p_tenant_id OR (tenant_id IS NULL AND p_tenant_id IS NULL))
    ORDER BY measured_at DESC
    LIMIT 1;
    
    -- Calculate change rate
    v_change_rate := CASE
        WHEN v_previous_value IS NOT NULL AND v_previous_value != 0 THEN
            (p_current_value - v_previous_value) / v_previous_value * 100
        ELSE NULL
    END;
    
    -- Determine status based on thresholds
    v_status := CASE
        WHEN p_threshold_critical IS NOT NULL AND p_current_value >= p_threshold_critical THEN 'critical'
        WHEN p_threshold_warning IS NOT NULL AND p_current_value >= p_threshold_warning THEN 'warning'
        ELSE 'healthy'
    END;
    
    -- Insert new metric
    INSERT INTO scout_performance.realtime_metrics (
        component_type, component_name, metric_name, tenant_id,
        current_value, previous_value, change_rate,
        threshold_warning, threshold_critical, status,
        measurement_unit, measured_at
    ) VALUES (
        p_component_type, p_component_name, p_metric_name, p_tenant_id,
        p_current_value, v_previous_value, v_change_rate,
        p_threshold_warning, p_threshold_critical, v_status,
        p_measurement_unit, NOW()
    ) RETURNING id INTO v_metric_id;
    
    RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. PERFORMANCE VIEWS FOR MONITORING
-- ============================================================================

-- Agent performance summary view
CREATE OR REPLACE VIEW scout_performance.v_agent_performance_summary AS
SELECT 
    agent_name,
    capability,
    tenant_id,
    COUNT(*) as total_executions,
    AVG(execution_time_ms) as avg_execution_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time_ms,
    AVG(quality_score) as avg_quality_score,
    AVG(confidence_score) as avg_confidence_score,
    COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate,
    DATE_TRUNC('hour', completed_at) as time_bucket
FROM scout_performance.agent_metrics
WHERE completed_at >= NOW() - INTERVAL '24 hours'
GROUP BY agent_name, capability, tenant_id, DATE_TRUNC('hour', completed_at)
ORDER BY time_bucket DESC;

-- Model accuracy summary view
CREATE OR REPLACE VIEW scout_performance.v_model_accuracy_summary AS
SELECT 
    model_name,
    business_domain,
    prediction_type,
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE actual_value IS NOT NULL) as predictions_with_actuals,
    AVG(percentage_error) FILTER (WHERE percentage_error IS NOT NULL) as avg_percentage_error,
    COUNT(*) FILTER (WHERE accuracy_tier = 'excellent') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE actual_value IS NOT NULL), 0) as excellent_rate,
    COUNT(*) FILTER (WHERE accuracy_tier IN ('excellent', 'good')) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE actual_value IS NOT NULL), 0) as good_or_better_rate,
    AVG(business_impact_score) as avg_business_impact,
    DATE_TRUNC('day', predicted_at) as prediction_date
FROM scout_performance.model_accuracy
WHERE predicted_at >= NOW() - INTERVAL '7 days'
GROUP BY model_name, business_domain, prediction_type, DATE_TRUNC('day', predicted_at)
ORDER BY prediction_date DESC;

-- Capability health dashboard view
CREATE OR REPLACE VIEW scout_performance.v_capability_health_dashboard AS
SELECT 
    capability_name,
    subcapability,
    AVG(overall_health_score) as avg_health_score,
    AVG(availability_score) as avg_availability,
    AVG(performance_score) as avg_performance,
    AVG(quality_score) as avg_quality,
    COUNT(*) FILTER (WHERE sla_compliant = true) * 100.0 / COUNT(*) as sla_compliance_rate,
    AVG(actual_p95_response_time_ms) as avg_response_time,
    SUM(queries_processed) as total_queries,
    DATE_TRUNC('hour', last_validated) as validation_hour
FROM scout_performance.capability_health
WHERE last_validated >= NOW() - INTERVAL '24 hours'
GROUP BY capability_name, subcapability, DATE_TRUNC('hour', last_validated)
ORDER BY validation_hour DESC;

-- Critical alerts view
CREATE OR REPLACE VIEW scout_performance.v_critical_alerts AS
SELECT 
    'agent_performance' as alert_type,
    agent_name as component,
    'High error rate' as alert_message,
    COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) as error_rate,
    'critical' as severity
FROM scout_performance.agent_metrics
WHERE completed_at >= NOW() - INTERVAL '1 hour'
GROUP BY agent_name
HAVING COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) > 10

UNION ALL

SELECT 
    'model_accuracy' as alert_type,
    model_name as component,
    'Poor prediction accuracy' as alert_message,
    AVG(percentage_error) as error_rate,
    CASE 
        WHEN AVG(percentage_error) > 50 THEN 'critical'
        WHEN AVG(percentage_error) > 30 THEN 'warning'
        ELSE 'info'
    END as severity
FROM scout_performance.model_accuracy
WHERE predicted_at >= NOW() - INTERVAL '24 hours'
  AND actual_value IS NOT NULL
GROUP BY model_name
HAVING AVG(percentage_error) > 30

UNION ALL

SELECT 
    'capability_health' as alert_type,
    capability_name as component,
    'SLA violation' as alert_message,
    AVG(overall_health_score) as error_rate,
    'critical' as severity
FROM scout_performance.capability_health
WHERE last_validated >= NOW() - INTERVAL '1 hour'
  AND sla_compliant = false
GROUP BY capability_name;

-- ============================================================================
-- 12. AUTOMATIC CLEANUP POLICIES
-- ============================================================================

-- Function to cleanup old performance data
CREATE OR REPLACE FUNCTION scout_performance.cleanup_old_data() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    -- Delete old realtime metrics (keep only 7 days)
    DELETE FROM scout_performance.realtime_metrics 
    WHERE measured_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Delete old agent metrics (keep 30 days)
    DELETE FROM scout_performance.agent_metrics 
    WHERE completed_at < NOW() - INTERVAL '30 days';
    
    -- Delete old user experience metrics (keep 90 days)
    DELETE FROM scout_performance.user_experience_metrics 
    WHERE query_timestamp < NOW() - INTERVAL '90 days';
    
    -- Keep model accuracy data longer (1 year) for trend analysis
    DELETE FROM scout_performance.model_accuracy 
    WHERE predicted_at < NOW() - INTERVAL '1 year';
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('scout_performance_cleanup', '0 2 * * *', 'SELECT scout_performance.cleanup_old_data();');

COMMENT ON SCHEMA scout_performance IS 'Scout v7.1 comprehensive model performance tracking - covers all agentic analytics capabilities with write data mode';