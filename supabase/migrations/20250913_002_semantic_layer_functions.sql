-- ============================================================================
-- Scout v7.1 Semantic Layer Functions Migration
-- Creates RPC functions for semantic model operations and NL→SQL pipeline
-- ============================================================================

-- ============================================================================
-- Semantic Model Query Functions
-- ============================================================================

-- Function to get available filter options based on semantic model
CREATE OR REPLACE FUNCTION fn_filter_options(
    _filters JSONB DEFAULT '{}'::JSONB,
    _entity_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    entity_label TEXT,
    parent_entity_id VARCHAR(255),
    metadata JSONB
) AS $$
DECLARE
    _tenant_id UUID := (auth.jwt() ->> 'tenant_id')::UUID;
BEGIN
    RETURN QUERY
    SELECT 
        kg.entity_type,
        kg.entity_id,
        kg.entity_name as entity_label,
        parent_kg.entity_id as parent_entity_id,
        kg.entity_attributes as metadata
    FROM platinum.kg_entities kg
    LEFT JOIN platinum.kg_entities parent_kg ON kg.parent_entity_id = parent_kg.id
    WHERE kg.tenant_id = _tenant_id
        AND (_entity_types IS NULL OR kg.entity_type = ANY(_entity_types))
        -- Apply cascading filter logic
        AND (
            _filters = '{}'::JSONB 
            OR kg.entity_id IN (
                SELECT jsonb_array_elements_text(_filters -> kg.entity_type)
            )
            OR kg.parent_entity_id IN (
                SELECT p.id FROM platinum.kg_entities p 
                WHERE p.entity_id IN (
                    SELECT jsonb_array_elements_text(_filters -> p.entity_type)
                )
            )
        )
    ORDER BY kg.entity_type, kg.entity_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate cohort metrics with semantic model awareness
CREATE OR REPLACE FUNCTION fn_cohort_metrics(
    _cohorts JSONB,
    _metric VARCHAR(50),
    _granularity VARCHAR(20) DEFAULT 'week',
    _date_from DATE DEFAULT NULL,
    _date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    cohort_key VARCHAR(10),
    time_period DATE,
    metric_value DECIMAL,
    metric_formatted TEXT,
    row_count INTEGER
) AS $$
DECLARE
    _tenant_id UUID := (auth.jwt() ->> 'tenant_id')::UUID;
    _role TEXT := auth.jwt() ->> 'role';
    _row_limit INTEGER;
    _cohort JSONB;
    _sql TEXT := '';
    _union_parts TEXT[] := '{}';
    _time_trunc_expr TEXT;
BEGIN
    -- Determine row limits based on role (from PRD section 6.5)
    _row_limit := CASE _role
        WHEN 'executive' THEN 5000
        WHEN 'store_manager' THEN 20000
        WHEN 'analyst' THEN 100000
        ELSE 1000
    END;
    
    -- Set time truncation based on granularity
    _time_trunc_expr := CASE _granularity
        WHEN 'day' THEN 'date_trunc(''day'', t.transaction_date)'
        WHEN 'week' THEN 'date_trunc(''week'', t.transaction_date)'
        WHEN 'month' THEN 'date_trunc(''month'', t.transaction_date)'
        WHEN 'quarter' THEN 'date_trunc(''quarter'', t.transaction_date)'
        WHEN 'year' THEN 'date_trunc(''year'', t.transaction_date)'
        ELSE 'date_trunc(''week'', t.transaction_date)'
    END;
    
    -- Build SQL for each cohort
    FOR _cohort IN SELECT jsonb_array_elements(_cohorts)
    LOOP
        _sql := format('
            SELECT 
                %L as cohort_key,
                %s::DATE as time_period,
                %s as metric_value,
                %s as metric_formatted,
                COUNT(*)::INTEGER as row_count
            FROM scout.fact_transaction_item t
            JOIN scout.dim_time dt ON t.date_id = dt.date_id
            JOIN scout.dim_brand b ON t.brand_id = b.brand_id
            JOIN scout.dim_category c ON t.category_id = c.category_id
            JOIN scout.dim_location l ON t.location_id = l.location_id
            WHERE t.tenant_id = %L
                AND (%L IS NULL OR dt.d >= %L)
                AND (%L IS NULL OR dt.d <= %L)
                %s
            GROUP BY cohort_key, time_period
            ORDER BY time_period',
            _cohort ->> 'key',
            _time_trunc_expr,
            -- Metric calculation based on semantic model
            CASE _metric
                WHEN 'revenue' THEN 'ROUND(SUM(t.peso_value), 2)'
                WHEN 'units' THEN 'SUM(t.qty)'
                WHEN 'tx_count' THEN 'COUNT(DISTINCT t.tx_id)'
                WHEN 'avg_basket' THEN 'ROUND(SUM(t.peso_value) / NULLIF(COUNT(DISTINCT t.tx_id), 0), 2)'
                ELSE 'SUM(t.peso_value)'
            END,
            -- Formatted output based on semantic model
            CASE _metric
                WHEN 'revenue' THEN 'CONCAT(''₱'', TO_CHAR(ROUND(SUM(t.peso_value), 2), ''FM999,999,999.00''))'
                WHEN 'units' THEN 'TO_CHAR(SUM(t.qty), ''FM999,999,999'')'
                WHEN 'tx_count' THEN 'TO_CHAR(COUNT(DISTINCT t.tx_id), ''FM999,999,999'')'
                WHEN 'avg_basket' THEN 'CASE WHEN COUNT(DISTINCT t.tx_id) = 0 THEN ''—'' ELSE CONCAT(''₱'', TO_CHAR(ROUND(SUM(t.peso_value) / COUNT(DISTINCT t.tx_id), 2), ''FM999,999.00'')) END'
                ELSE 'TO_CHAR(SUM(t.peso_value), ''FM999,999,999'')'
            END,
            _tenant_id,
            _date_from, _date_from,
            _date_to, _date_to,
            -- Apply cohort filters
            CASE 
                WHEN _cohort -> 'filters' -> 'brand_ids' IS NOT NULL THEN
                    format('AND b.brand_external_id = ANY(%L)', 
                           array(SELECT jsonb_array_elements_text(_cohort -> 'filters' -> 'brand_ids')))
                ELSE ''
            END ||
            CASE 
                WHEN _cohort -> 'filters' -> 'category_ids' IS NOT NULL THEN
                    format('AND c.category_external_id = ANY(%L)', 
                           array(SELECT jsonb_array_elements_text(_cohort -> 'filters' -> 'category_ids')))
                ELSE ''
            END ||
            CASE 
                WHEN _cohort -> 'filters' -> 'location_ids' IS NOT NULL THEN
                    format('AND l.location_external_id = ANY(%L)', 
                           array(SELECT jsonb_array_elements_text(_cohort -> 'filters' -> 'location_ids')))
                ELSE ''
            END
        );
        
        _union_parts := _union_parts || _sql;
    END LOOP;
    
    -- Combine all cohorts with UNION ALL and apply row limit
    _sql := array_to_string(_union_parts, ' UNION ALL ') || format(' LIMIT %s', _row_limit);
    
    RETURN QUERY EXECUTE _sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get POS funnel metrics
CREATE OR REPLACE FUNCTION fn_funnel_metrics(
    _filters JSONB DEFAULT '{}'::JSONB,
    _date_from DATE DEFAULT NULL,
    _date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    stage VARCHAR(20),
    event_count INTEGER,
    conversion_rate DECIMAL,
    stage_order INTEGER
) AS $$
DECLARE
    _tenant_id UUID := (auth.jwt() ->> 'tenant_id')::UUID;
BEGIN
    RETURN QUERY
    WITH funnel_data AS (
        SELECT 
            f.stage,
            COUNT(*) as events,
            CASE f.stage
                WHEN 'ask' THEN 1
                WHEN 'offer' THEN 2
                WHEN 'accept' THEN 3
                WHEN 'basket' THEN 4
                ELSE 5
            END as stage_order
        FROM scout.gold_pos_funnel f
        WHERE f.tenant_id = _tenant_id
            AND (_date_from IS NULL OR f.event_date >= _date_from)
            AND (_date_to IS NULL OR f.event_date <= _date_to)
            -- Apply filters if provided
            AND (_filters = '{}'::JSONB OR (
                (_filters ->> 'brand_ids' IS NULL OR f.brand_id = ANY(
                    SELECT jsonb_array_elements_text(_filters -> 'brand_ids')
                ))
                AND (_filters ->> 'location_ids' IS NULL OR f.location_id = ANY(
                    SELECT jsonb_array_elements_text(_filters -> 'location_ids')
                ))
            ))
        GROUP BY f.stage
    ),
    funnel_with_conversion AS (
        SELECT 
            f1.stage,
            f1.events,
            CASE 
                WHEN f1.stage_order = 1 THEN 1.0
                ELSE ROUND(
                    f1.events::DECIMAL / NULLIF(
                        (SELECT f2.events FROM funnel_data f2 WHERE f2.stage_order = f1.stage_order - 1), 
                        0
                    ), 4
                )
            END as conversion_rate,
            f1.stage_order
        FROM funnel_data f1
    )
    SELECT 
        fc.stage,
        fc.events,
        fc.conversion_rate,
        fc.stage_order
    FROM funnel_with_conversion fc
    ORDER BY fc.stage_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NL→SQL Pipeline Support Functions
-- ============================================================================

-- Function to validate generated SQL against semantic model guardrails
CREATE OR REPLACE FUNCTION fn_validate_sql(
    _sql TEXT,
    _user_role TEXT DEFAULT NULL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_code VARCHAR(50),
    error_message TEXT,
    suggested_fix TEXT
) AS $$
DECLARE
    _role TEXT := COALESCE(_user_role, auth.jwt() ->> 'role');
    _sql_lower TEXT := lower(_sql);
BEGIN
    -- Check for forbidden operations
    IF _sql_lower ~ '\b(drop|delete|update|insert|create|alter|truncate)\b' THEN
        RETURN QUERY SELECT false, 'FORBIDDEN_OPERATION', 
            'SQL contains forbidden operations (DROP, DELETE, UPDATE, INSERT, CREATE, ALTER)', 
            'Use only SELECT statements for data retrieval';
        RETURN;
    END IF;
    
    -- Check for SELECT *
    IF _sql_lower ~ 'select\s+\*' THEN
        RETURN QUERY SELECT false, 'SELECT_STAR_FORBIDDEN', 
            'SELECT * is not allowed', 
            'Specify exact columns needed from the semantic model';
        RETURN;
    END IF;
    
    -- Check for unpredicated CROSS JOIN
    IF _sql_lower ~ '\bcross\s+join\b' AND NOT _sql_lower ~ '\bwhere\b' THEN
        RETURN QUERY SELECT false, 'UNPREDICATED_CROSS_JOIN', 
            'CROSS JOIN without WHERE predicate is forbidden', 
            'Add WHERE clause with join conditions or use INNER/LEFT JOIN';
        RETURN;
    END IF;
    
    -- Check for whitelisted schemas
    IF NOT (_sql_lower ~ '\b(scout\.gold_|scout\.dim_|scout\.v_.*_public)\b') THEN
        RETURN QUERY SELECT false, 'SCHEMA_NOT_WHITELISTED', 
            'Query must use whitelisted schemas: scout.gold_*, scout.dim_*, scout.v_*_public', 
            'Modify query to use approved schema objects only';
        RETURN;
    END IF;
    
    -- Check for required date range (for analyst role)
    IF _role = 'analyst' AND NOT _sql_lower ~ '\bdate\b.*(\>|\<|between)' THEN
        RETURN QUERY SELECT false, 'DATE_RANGE_REQUIRED', 
            'Analyst queries must include date range filters', 
            'Add WHERE clause with date range like "WHERE date >= ''2024-01-01''"';
        RETURN;
    END IF;
    
    -- All validations passed
    RETURN QUERY SELECT true, 'VALID', 'SQL passed all validation checks', NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute validated SQL with row limits and audit logging
CREATE OR REPLACE FUNCTION fn_execute_sql(
    _natural_language_query TEXT,
    _generated_sql TEXT,
    _query_intent VARCHAR(100) DEFAULT NULL,
    _agent_pipeline JSONB DEFAULT NULL,
    _chart_spec JSONB DEFAULT NULL
)
RETURNS TABLE (
    execution_id UUID,
    status VARCHAR(20),
    row_count INTEGER,
    execution_time_ms INTEGER,
    result JSONB,
    error_message TEXT
) AS $$
DECLARE
    _tenant_id UUID := (auth.jwt() ->> 'tenant_id')::UUID;
    _user_id UUID := (auth.jwt() ->> 'sub')::UUID;
    _user_role TEXT := auth.jwt() ->> 'role';
    _row_limit INTEGER;
    _start_time TIMESTAMPTZ;
    _end_time TIMESTAMPTZ;
    _execution_time INTEGER;
    _validation_result RECORD;
    _audit_id UUID;
    _result JSONB;
    _row_count INTEGER;
    _final_sql TEXT;
BEGIN
    _start_time := clock_timestamp();
    
    -- Generate audit ID
    _audit_id := gen_random_uuid();
    
    -- Determine row limits based on role (from PRD section 6.5)
    _row_limit := CASE _user_role
        WHEN 'executive' THEN 5000
        WHEN 'store_manager' THEN 20000
        WHEN 'analyst' THEN 100000
        ELSE 1000
    END;
    
    -- Validate SQL
    SELECT INTO _validation_result * FROM fn_validate_sql(_generated_sql, _user_role) LIMIT 1;
    
    IF NOT _validation_result.is_valid THEN
        -- Log failed validation
        INSERT INTO ops.audit_ledger (
            id, tenant_id, user_id, user_role,
            natural_language_query, generated_sql, query_intent,
            execution_status, error_message, agent_pipeline,
            rls_enforced, row_limit_applied, schema_validation_passed
        ) VALUES (
            _audit_id, _tenant_id, _user_id, _user_role,
            _natural_language_query, _generated_sql, _query_intent,
            'error', _validation_result.error_message, _agent_pipeline,
            true, _row_limit, false
        );
        
        RETURN QUERY SELECT 
            _audit_id, 'error'::VARCHAR(20), 0, 0, 
            NULL::JSONB, _validation_result.error_message;
        RETURN;
    END IF;
    
    -- Add tenant filter and row limit to SQL
    _final_sql := format(
        'WITH limited_query AS (%s) SELECT * FROM limited_query WHERE tenant_id = %L LIMIT %s',
        _generated_sql, _tenant_id, _row_limit
    );
    
    -- Execute the SQL and capture results
    BEGIN
        EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', _final_sql) INTO _result;
        GET DIAGNOSTICS _row_count = ROW_COUNT;
        
        _end_time := clock_timestamp();
        _execution_time := EXTRACT(epoch FROM (_end_time - _start_time)) * 1000;
        
        -- Log successful execution
        INSERT INTO ops.audit_ledger (
            id, tenant_id, user_id, user_role,
            natural_language_query, generated_sql, executed_sql, query_intent,
            execution_status, row_count, execution_time_ms,
            agent_pipeline, chart_spec,
            rls_enforced, row_limit_applied, schema_validation_passed
        ) VALUES (
            _audit_id, _tenant_id, _user_id, _user_role,
            _natural_language_query, _generated_sql, _final_sql, _query_intent,
            'success', _row_count, _execution_time,
            _agent_pipeline, _chart_spec,
            true, _row_limit, true
        );
        
        RETURN QUERY SELECT 
            _audit_id, 'success'::VARCHAR(20), _row_count, _execution_time, 
            _result, NULL::TEXT;
            
    EXCEPTION WHEN OTHERS THEN
        _end_time := clock_timestamp();
        _execution_time := EXTRACT(epoch FROM (_end_time - _start_time)) * 1000;
        
        -- Log execution error
        INSERT INTO ops.audit_ledger (
            id, tenant_id, user_id, user_role,
            natural_language_query, generated_sql, executed_sql, query_intent,
            execution_status, execution_time_ms, error_message,
            agent_pipeline, rls_enforced, row_limit_applied, schema_validation_passed
        ) VALUES (
            _audit_id, _tenant_id, _user_id, _user_role,
            _natural_language_query, _generated_sql, _final_sql, _query_intent,
            'error', _execution_time, SQLERRM,
            _agent_pipeline, true, _row_limit, true
        );
        
        RETURN QUERY SELECT 
            _audit_id, 'error'::VARCHAR(20), 0, _execution_time, 
            NULL::JSONB, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MindsDB Integration Functions
-- ============================================================================

-- Function to determine forecast delegation to MindsDB
CREATE OR REPLACE FUNCTION fn_should_delegate_to_mindsdb(
    _natural_language_query TEXT,
    _intent_score DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    should_delegate BOOLEAN,
    confidence DECIMAL,
    forecast_keywords TEXT[],
    delegation_reason TEXT
) AS $$
DECLARE
    _query_lower TEXT := lower(_natural_language_query);
    _forecast_keywords TEXT[] := ARRAY['forecast', 'predict', 'projection', 'future', 'trend', 'estimate'];
    _found_keywords TEXT[] := '{}';
    _keyword TEXT;
    _keyword_count INTEGER := 0;
    _confidence_score DECIMAL := 0.0;
BEGIN
    -- Check for forecast keywords
    FOREACH _keyword IN ARRAY _forecast_keywords LOOP
        IF _query_lower ~ ('\b' || _keyword || '\b') THEN
            _found_keywords := _found_keywords || _keyword;
            _keyword_count := _keyword_count + 1;
        END IF;
    END LOOP;
    
    -- Calculate confidence based on keywords and intent score
    _confidence_score := CASE 
        WHEN _keyword_count > 0 THEN LEAST(0.8 + (_keyword_count * 0.1), 1.0)
        WHEN _intent_score IS NOT NULL AND _intent_score >= 0.8 THEN _intent_score
        ELSE 0.0
    END;
    
    RETURN QUERY SELECT 
        (_keyword_count > 0 OR (_intent_score IS NOT NULL AND _intent_score >= 0.8)) as should_delegate,
        _confidence_score,
        _found_keywords,
        CASE 
            WHEN _keyword_count > 0 THEN format('Found forecast keywords: %s', array_to_string(_found_keywords, ', '))
            WHEN _intent_score IS NOT NULL AND _intent_score >= 0.8 THEN format('High intent confidence score: %s', _intent_score)
            ELSE 'No forecast indicators detected'
        END as delegation_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Audit and Analytics Functions
-- ============================================================================

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION fn_audit_statistics(
    _date_from DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    _date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_queries INTEGER,
    success_queries INTEGER,
    error_queries INTEGER,
    success_rate DECIMAL,
    avg_execution_time_ms DECIMAL,
    top_query_intents JSONB,
    top_error_types JSONB
) AS $$
DECLARE
    _tenant_id UUID := (auth.jwt() ->> 'tenant_id')::UUID;
BEGIN
    RETURN QUERY
    WITH audit_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE execution_status = 'success') as success,
            COUNT(*) FILTER (WHERE execution_status = 'error') as error,
            AVG(execution_time_ms) FILTER (WHERE execution_status = 'success') as avg_time
        FROM ops.audit_ledger
        WHERE tenant_id = _tenant_id
            AND created_at >= _date_from
            AND created_at < _date_to + INTERVAL '1 day'
    ),
    intent_stats AS (
        SELECT jsonb_object_agg(query_intent, intent_count) as intents
        FROM (
            SELECT query_intent, COUNT(*) as intent_count
            FROM ops.audit_ledger
            WHERE tenant_id = _tenant_id
                AND created_at >= _date_from
                AND created_at < _date_to + INTERVAL '1 day'
                AND query_intent IS NOT NULL
            GROUP BY query_intent
            ORDER BY intent_count DESC
            LIMIT 5
        ) t
    ),
    error_stats AS (
        SELECT jsonb_object_agg(error_type, error_count) as errors
        FROM (
            SELECT 
                CASE 
                    WHEN error_message ILIKE '%timeout%' THEN 'timeout'
                    WHEN error_message ILIKE '%permission%' THEN 'permission'
                    WHEN error_message ILIKE '%syntax%' THEN 'syntax'
                    WHEN error_message ILIKE '%validation%' THEN 'validation'
                    ELSE 'other'
                END as error_type,
                COUNT(*) as error_count
            FROM ops.audit_ledger
            WHERE tenant_id = _tenant_id
                AND created_at >= _date_from
                AND created_at < _date_to + INTERVAL '1 day'
                AND execution_status = 'error'
            GROUP BY error_type
            ORDER BY error_count DESC
            LIMIT 5
        ) t
    )
    SELECT 
        a.total,
        a.success,
        a.error,
        ROUND(a.success::DECIMAL / NULLIF(a.total, 0), 4) as success_rate,
        ROUND(a.avg_time, 2) as avg_execution_time,
        i.intents,
        e.errors
    FROM audit_stats a
    CROSS JOIN intent_stats i
    CROSS JOIN error_stats e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION fn_filter_options TO service_role;
GRANT EXECUTE ON FUNCTION fn_cohort_metrics TO service_role;
GRANT EXECUTE ON FUNCTION fn_funnel_metrics TO service_role;
GRANT EXECUTE ON FUNCTION fn_validate_sql TO service_role;
GRANT EXECUTE ON FUNCTION fn_execute_sql TO service_role;
GRANT EXECUTE ON FUNCTION fn_should_delegate_to_mindsdb TO service_role;
GRANT EXECUTE ON FUNCTION fn_audit_statistics TO service_role;

COMMENT ON FUNCTION fn_filter_options IS 'Get cascading filter options based on semantic model and current filters';
COMMENT ON FUNCTION fn_cohort_metrics IS 'Calculate metrics for multiple cohorts with role-based row limits';
COMMENT ON FUNCTION fn_funnel_metrics IS 'Get POS funnel conversion metrics with filtering support';
COMMENT ON FUNCTION fn_validate_sql IS 'Validate generated SQL against semantic model guardrails';
COMMENT ON FUNCTION fn_execute_sql IS 'Execute validated SQL with audit logging and tenant isolation';
COMMENT ON FUNCTION fn_should_delegate_to_mindsdb IS 'Determine if query should be delegated to MindsDB for forecasting';
COMMENT ON FUNCTION fn_audit_statistics IS 'Get audit statistics and analytics for NL→SQL operations';