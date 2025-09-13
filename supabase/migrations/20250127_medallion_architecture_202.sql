-- =============================================================================
-- MEDALLION ARCHITECTURE IMPLEMENTATION #202
-- Project: cxzllzyxwpyptfretryc
-- Purpose: Transform existing structure to full medallion compliance
-- Execute: supabase db push (after #201)
-- =============================================================================

BEGIN;

-- =============================================================================
-- MEDALLION LAYER SCHEMAS
-- =============================================================================

-- Bronze Layer - Raw data ingestion
CREATE SCHEMA IF NOT EXISTS bronze_hr;
CREATE SCHEMA IF NOT EXISTS bronze_financial;
CREATE SCHEMA IF NOT EXISTS bronze_operations;
CREATE SCHEMA IF NOT EXISTS bronze_creative;

-- Silver Layer - Cleaned and validated data
CREATE SCHEMA IF NOT EXISTS silver_hr;
CREATE SCHEMA IF NOT EXISTS silver_financial;
CREATE SCHEMA IF NOT EXISTS silver_operations;
CREATE SCHEMA IF NOT EXISTS silver_creative;

-- Gold Layer - Business-ready analytics (already exists as analytics)
-- Rename existing analytics to gold for clarity
ALTER SCHEMA analytics RENAME TO gold;

-- Data lineage and metadata
CREATE SCHEMA IF NOT EXISTS metadata;

-- =============================================================================
-- METADATA FRAMEWORK
-- =============================================================================

-- Data lineage tracking
CREATE TABLE metadata.data_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_schema TEXT NOT NULL,
  source_table TEXT NOT NULL,
  target_schema TEXT NOT NULL,
  target_table TEXT NOT NULL,
  transformation_type TEXT NOT NULL, -- bronze_to_silver, silver_to_gold, direct
  transformation_logic TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Data quality rules
CREATE TABLE metadata.data_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  column_name TEXT,
  rule_type TEXT NOT NULL, -- not_null, unique, range, format, custom
  rule_definition JSONB NOT NULL,
  severity TEXT CHECK (severity IN ('error', 'warning', 'info')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ETL job tracking
CREATE TABLE metadata.etl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT UNIQUE NOT NULL,
  source_layer TEXT CHECK (source_layer IN ('bronze', 'silver', 'gold')),
  target_layer TEXT CHECK (target_layer IN ('bronze', 'silver', 'gold')),
  job_type TEXT CHECK (job_type IN ('full_refresh', 'incremental', 'streaming')),
  schedule_cron TEXT,
  last_run_start TIMESTAMP,
  last_run_end TIMESTAMP,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  last_run_records_processed INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Data freshness tracking
CREATE TABLE metadata.data_freshness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  expected_frequency_hours INTEGER NOT NULL,
  is_stale BOOLEAN GENERATED ALWAYS AS (
    last_updated < NOW() - (expected_frequency_hours || ' hours')::INTERVAL
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(schema_name, table_name)
);

-- =============================================================================
-- BRONZE LAYER - RAW DATA VIEWS
-- =============================================================================

-- Bronze HR - Raw employee data with source metadata
CREATE OR REPLACE VIEW bronze_hr.employees_raw AS
SELECT 
  *,
  'hr_admin' as source_schema,
  'employees' as source_table,
  created_at as ingestion_timestamp,
  updated_at as last_modified,
  'manual_entry' as ingestion_method
FROM hr_admin.employees;

CREATE OR REPLACE VIEW bronze_hr.performance_reviews_raw AS
SELECT 
  *,
  'hr_admin' as source_schema,
  'performance_reviews' as source_table,
  created_at as ingestion_timestamp,
  'manual_entry' as ingestion_method
FROM hr_admin.performance_reviews;

-- Bronze Financial - Raw financial data
CREATE OR REPLACE VIEW bronze_financial.cash_advances_raw AS
SELECT 
  *,
  'financial_ops' as source_schema,
  'cash_advances' as source_table,
  created_at as ingestion_timestamp,
  updated_at as last_modified,
  'manual_entry' as ingestion_method
FROM financial_ops.cash_advances;

CREATE OR REPLACE VIEW bronze_financial.expense_reports_raw AS
SELECT 
  *,
  'financial_ops' as source_schema,
  'expense_reports' as source_table,
  created_at as ingestion_timestamp,
  updated_at as last_modified,
  'manual_entry' as ingestion_method
FROM financial_ops.expense_reports;

-- Bronze Operations - Raw operational data
CREATE OR REPLACE VIEW bronze_operations.transactions_raw AS
SELECT 
  *,
  'operations' as source_schema,
  'transactions' as source_table,
  created_at as ingestion_timestamp,
  'pos_system' as ingestion_method
FROM operations.transactions;

CREATE OR REPLACE VIEW bronze_operations.stores_raw AS
SELECT 
  *,
  'operations' as source_schema,
  'stores' as source_table,
  created_at as ingestion_timestamp,
  updated_at as last_modified,
  'manual_entry' as ingestion_method
FROM operations.stores;

-- =============================================================================
-- SILVER LAYER - CLEANED AND VALIDATED DATA
-- =============================================================================

-- Silver HR - Cleaned employee data with business rules
CREATE TABLE silver_hr.employees_validated (
  id UUID PRIMARY KEY,
  employee_id TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID,
  position_id UUID,
  manager_id UUID,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  status TEXT NOT NULL,
  user_role TEXT NOT NULL,
  profile_data JSONB DEFAULT '{}',
  
  -- Data quality flags
  is_valid_email BOOLEAN GENERATED ALWAYS AS (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') STORED,
  is_valid_salary BOOLEAN GENERATED ALWAYS AS (salary IS NULL OR (salary > 0 AND salary <= 10000000)) STORED,
  is_valid_hire_date BOOLEAN GENERATED ALWAYS AS (hire_date >= '1950-01-01' AND hire_date <= CURRENT_DATE) STORED,
  
  -- Metadata
  bronze_source_timestamp TIMESTAMP NOT NULL,
  silver_processed_at TIMESTAMP DEFAULT NOW(),
  data_quality_score INTEGER GENERATED ALWAYS AS (
    (CASE WHEN is_valid_email THEN 1 ELSE 0 END +
     CASE WHEN is_valid_salary THEN 1 ELSE 0 END +
     CASE WHEN is_valid_hire_date THEN 1 ELSE 0 END +
     CASE WHEN full_name IS NOT NULL AND LENGTH(full_name) > 0 THEN 1 ELSE 0 END) * 25
  ) STORED,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Silver Financial - Validated financial transactions
CREATE TABLE silver_financial.cash_advances_validated (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  destination TEXT,
  status TEXT NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP,
  notes TEXT,
  
  -- Enriched fields
  amount_category TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN amount < 1000 THEN 'small'
      WHEN amount < 5000 THEN 'medium'
      WHEN amount < 20000 THEN 'large'
      ELSE 'extra_large'
    END
  ) STORED,
  
  approval_duration_hours NUMERIC GENERATED ALWAYS AS (
    CASE WHEN approved_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (approved_at - bronze_source_timestamp))/3600 
    ELSE NULL END
  ) STORED,
  
  -- Data quality flags
  is_valid_amount BOOLEAN GENERATED ALWAYS AS (amount > 0 AND amount <= 1000000) STORED,
  is_valid_purpose BOOLEAN GENERATED ALWAYS AS (LENGTH(purpose) >= 10) STORED,
  
  -- Metadata
  bronze_source_timestamp TIMESTAMP NOT NULL,
  silver_processed_at TIMESTAMP DEFAULT NOW(),
  data_quality_score INTEGER GENERATED ALWAYS AS (
    (CASE WHEN is_valid_amount THEN 1 ELSE 0 END +
     CASE WHEN is_valid_purpose THEN 1 ELSE 0 END +
     CASE WHEN status IN ('pending', 'approved', 'rejected', 'liquidated') THEN 1 ELSE 0 END) * 33
  ) STORED,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Silver Operations - Enriched transaction data
CREATE TABLE silver_operations.transactions_enriched (
  transaction_id UUID PRIMARY KEY,
  store_id UUID,
  customer_id UUID,
  transaction_date TIMESTAMP NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  
  -- Enriched fields
  transaction_hour INTEGER GENERATED ALWAYS AS (EXTRACT(HOUR FROM transaction_date)) STORED,
  transaction_day_of_week INTEGER GENERATED ALWAYS AS (EXTRACT(DOW FROM transaction_date)) STORED,
  transaction_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM transaction_date)) STORED,
  
  amount_tier TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN total_amount < 100 THEN 'low'
      WHEN total_amount < 500 THEN 'medium'
      WHEN total_amount < 2000 THEN 'high'
      ELSE 'premium'
    END
  ) STORED,
  
  -- Data quality flags
  is_valid_amount BOOLEAN GENERATED ALWAYS AS (total_amount > 0 AND total_amount <= 1000000) STORED,
  is_future_dated BOOLEAN GENERATED ALWAYS AS (transaction_date > NOW()) STORED,
  
  -- Metadata
  bronze_source_timestamp TIMESTAMP NOT NULL,
  silver_processed_at TIMESTAMP DEFAULT NOW(),
  data_quality_score INTEGER GENERATED ALWAYS AS (
    (CASE WHEN is_valid_amount THEN 1 ELSE 0 END +
     CASE WHEN NOT is_future_dated THEN 1 ELSE 0 END +
     CASE WHEN store_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN payment_method IS NOT NULL THEN 1 ELSE 0 END) * 25
  ) STORED,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- GOLD LAYER - BUSINESS READY ANALYTICS (Enhanced existing)
-- =============================================================================

-- Enhanced HR Analytics with medallion metadata
CREATE OR REPLACE VIEW gold.hr_executive_dashboard AS
WITH silver_metrics AS (
  SELECT 
    COUNT(*) as total_employees,
    COUNT(*) FILTER (WHERE status = 'active') as active_employees,
    COUNT(*) FILTER (WHERE data_quality_score >= 75) as high_quality_records,
    AVG(data_quality_score) as avg_data_quality,
    COUNT(*) FILTER (WHERE silver_processed_at >= CURRENT_DATE) as processed_today
  FROM silver_hr.employees_validated
),
performance_metrics AS (
  SELECT 
    AVG(performance_score) as avg_performance,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE performance_score >= 4.0) as high_performers
  FROM hr_admin.performance_reviews 
  WHERE review_period >= CURRENT_DATE - INTERVAL '12 months'
)
SELECT 
  sm.*,
  pm.avg_performance,
  pm.high_performers,
  ROUND((pm.high_performers::DECIMAL / NULLIF(pm.total_reviews, 0)) * 100, 2) as high_performer_percentage,
  CURRENT_TIMESTAMP as generated_at,
  'gold' as data_layer,
  'hr_executive_dashboard' as view_name
FROM silver_metrics sm, performance_metrics pm;

-- Enhanced Financial Analytics with medallion lineage
CREATE OR REPLACE VIEW gold.financial_executive_dashboard AS
WITH silver_metrics AS (
  SELECT 
    COUNT(*) as total_advances,
    SUM(amount) FILTER (WHERE status = 'approved') as total_approved_amount,
    COUNT(*) FILTER (WHERE data_quality_score >= 75) as high_quality_records,
    AVG(approval_duration_hours) FILTER (WHERE approved_at IS NOT NULL) as avg_approval_hours,
    COUNT(*) FILTER (WHERE silver_processed_at >= CURRENT_DATE) as processed_today
  FROM silver_financial.cash_advances_validated
  WHERE bronze_source_timestamp >= CURRENT_DATE - INTERVAL '30 days'
),
monthly_trends AS (
  SELECT 
    DATE_TRUNC('month', bronze_source_timestamp) as month,
    SUM(amount) as monthly_amount,
    COUNT(*) as monthly_count
  FROM silver_financial.cash_advances_validated
  WHERE bronze_source_timestamp >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', bronze_source_timestamp)
)
SELECT 
  sm.*,
  (SELECT jsonb_agg(jsonb_build_object('month', month, 'amount', monthly_amount, 'count', monthly_count) ORDER BY month) FROM monthly_trends) as monthly_trends,
  CURRENT_TIMESTAMP as generated_at,
  'gold' as data_layer,
  'financial_executive_dashboard' as view_name
FROM silver_metrics sm;

-- =============================================================================
-- ETL FUNCTIONS FOR MEDALLION LAYERS
-- =============================================================================

-- Create ETL schema
CREATE SCHEMA IF NOT EXISTS etl;

-- Bronze to Silver ETL for HR
CREATE OR REPLACE FUNCTION etl.bronze_to_silver_hr()
RETURNS VOID AS $$
DECLARE
  processed_count INTEGER;
BEGIN
  -- Insert new/updated employees into silver layer
  INSERT INTO silver_hr.employees_validated (
    id, employee_id, email, full_name, department_id, position_id, 
    manager_id, hire_date, salary, status, user_role, profile_data,
    bronze_source_timestamp
  )
  SELECT 
    id, employee_id, email, full_name, department_id, position_id,
    manager_id, hire_date, salary, status, user_role, profile_data,
    GREATEST(created_at, updated_at)
  FROM bronze_hr.employees_raw
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    department_id = EXCLUDED.department_id,
    salary = EXCLUDED.salary,
    status = EXCLUDED.status,
    silver_processed_at = NOW(),
    updated_at = NOW();
  
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  -- Update ETL job tracking
  INSERT INTO metadata.etl_jobs (job_name, source_layer, target_layer, job_type, last_run_start, last_run_end, last_run_status, last_run_records_processed)
  VALUES ('bronze_to_silver_hr', 'bronze', 'silver', 'incremental', NOW(), NOW(), 'success', processed_count)
  ON CONFLICT (job_name) DO UPDATE SET
    last_run_start = NOW(),
    last_run_end = NOW(),
    last_run_status = 'success',
    last_run_records_processed = processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bronze to Silver ETL for Financial
CREATE OR REPLACE FUNCTION etl.bronze_to_silver_financial()
RETURNS VOID AS $$
DECLARE
  processed_count INTEGER;
BEGIN
  INSERT INTO silver_financial.cash_advances_validated (
    id, user_id, amount, purpose, destination, status, 
    approved_by, approved_at, notes, bronze_source_timestamp
  )
  SELECT 
    id, user_id, amount, purpose, destination, status,
    approved_by, approved_at, notes,
    GREATEST(created_at, updated_at)
  FROM bronze_financial.cash_advances_raw
  ON CONFLICT (id) DO UPDATE SET
    amount = EXCLUDED.amount,
    purpose = EXCLUDED.purpose,
    status = EXCLUDED.status,
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at,
    silver_processed_at = NOW(),
    updated_at = NOW();
  
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  INSERT INTO metadata.etl_jobs (job_name, source_layer, target_layer, job_type, last_run_start, last_run_end, last_run_status, last_run_records_processed)
  VALUES ('bronze_to_silver_financial', 'bronze', 'silver', 'incremental', NOW(), NOW(), 'success', processed_count)
  ON CONFLICT (job_name) DO UPDATE SET
    last_run_start = NOW(),
    last_run_end = NOW(),
    last_run_status = 'success',
    last_run_records_processed = processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DATA QUALITY MONITORING
-- =============================================================================

-- Create quality schema
CREATE SCHEMA IF NOT EXISTS quality;

-- Function to check data quality across silver layer
CREATE OR REPLACE FUNCTION quality.check_silver_data_quality()
RETURNS TABLE (
  schema_name TEXT,
  table_name TEXT,
  total_records BIGINT,
  high_quality_records BIGINT,
  quality_percentage DECIMAL,
  quality_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'silver_hr'::TEXT,
    'employees_validated'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE data_quality_score >= 75)::BIGINT,
    ROUND((COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) * 100, 2),
    CASE 
      WHEN (COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) >= 0.9 THEN 'excellent'
      WHEN (COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) >= 0.75 THEN 'good'
      WHEN (COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) >= 0.5 THEN 'fair'
      ELSE 'poor'
    END
  FROM silver_hr.employees_validated
  
  UNION ALL
  
  SELECT 
    'silver_financial'::TEXT,
    'cash_advances_validated'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE data_quality_score >= 75)::BIGINT,
    ROUND((COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) * 100, 2),
    CASE 
      WHEN (COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) >= 0.9 THEN 'excellent'
      WHEN (COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) >= 0.75 THEN 'good'
      WHEN (COUNT(*) FILTER (WHERE data_quality_score >= 75)::DECIMAL / COUNT(*)) >= 0.5 THEN 'fair'
      ELSE 'poor'
    END
  FROM silver_financial.cash_advances_validated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MEDALLION ORCHESTRATION
-- =============================================================================

-- Master ETL orchestration function
CREATE OR REPLACE FUNCTION etl.run_medallion_pipeline()
RETURNS JSONB AS $$
DECLARE
  start_time TIMESTAMP := NOW();
  result JSONB;
BEGIN
  -- Run bronze to silver ETL
  PERFORM etl.bronze_to_silver_hr();
  PERFORM etl.bronze_to_silver_financial();
  
  -- Refresh gold layer materialized views
  REFRESH MATERIALIZED VIEW IF EXISTS gold.monthly_financial_summary;
  
  -- Check data quality
  PERFORM quality.check_silver_data_quality();
  
  -- Update data freshness tracking
  INSERT INTO metadata.data_freshness (schema_name, table_name, last_updated, expected_frequency_hours)
  VALUES 
    ('silver_hr', 'employees_validated', NOW(), 24),
    ('silver_financial', 'cash_advances_validated', NOW(), 1),
    ('gold', 'hr_executive_dashboard', NOW(), 4),
    ('gold', 'financial_executive_dashboard', NOW(), 1)
  ON CONFLICT (schema_name, table_name) DO UPDATE SET
    last_updated = NOW();
  
  SELECT jsonb_build_object(
    'pipeline_status', 'success',
    'start_time', start_time,
    'end_time', NOW(),
    'duration_minutes', EXTRACT(EPOCH FROM (NOW() - start_time))/60,
    'layers_processed', ARRAY['bronze', 'silver', 'gold'],
    'data_quality', (SELECT jsonb_agg(row_to_json(q)) FROM quality.check_silver_data_quality() q)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MEDALLION ACCESS POLICIES
-- =============================================================================

-- Bronze layer access (raw data, restricted)
CREATE POLICY "bronze_data_admin_only" ON bronze_hr.employees_raw
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM hr_admin.employees WHERE id = auth.uid() AND user_role = 'executive')
  );

-- Silver layer access (validated data, broader access)
CREATE POLICY "silver_hr_access" ON silver_hr.employees_validated
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hr_admin.employees 
      WHERE id = auth.uid() 
      AND user_role IN ('executive', 'hr_manager')
    ) OR id = auth.uid()
  );

-- Gold layer access (business analytics, role-based)
-- Inherits existing policies from analytics schema

-- Enable RLS on new tables
ALTER TABLE silver_hr.employees_validated ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_financial.cash_advances_validated ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_operations.transactions_enriched ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MEDALLION MONITORING DASHBOARD
-- =============================================================================

CREATE OR REPLACE VIEW gold.medallion_health_dashboard AS
WITH layer_stats AS (
  SELECT 
    'bronze' as layer,
    3 as total_tables,
    3 as active_tables,
    NOW() as last_updated
  UNION ALL
  SELECT 
    'silver' as layer,
    3 as total_tables,
    3 as active_tables,
    NOW() as last_updated
  UNION ALL
  SELECT 
    'gold' as layer,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'gold')::INTEGER as total_tables,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'gold')::INTEGER as active_tables,
    NOW() as last_updated
),
etl_status AS (
  SELECT 
    job_name,
    last_run_status,
    last_run_end,
    last_run_records_processed
  FROM metadata.etl_jobs
  ORDER BY last_run_end DESC
),
quality_summary AS (
  SELECT 
    AVG(quality_percentage) as avg_quality_score,
    COUNT(*) FILTER (WHERE quality_status IN ('excellent', 'good')) as good_quality_tables,
    COUNT(*) as total_quality_checks
  FROM quality.check_silver_data_quality()
)
SELECT 
  ls.layer,
  ls.total_tables,
  ls.active_tables,
  (SELECT jsonb_agg(row_to_json(e)) FROM etl_status e) as etl_jobs,
  qs.avg_quality_score,
  qs.good_quality_tables,
  CURRENT_TIMESTAMP as generated_at,
  'medallion_health' as dashboard_type
FROM layer_stats ls, quality_summary qs;

COMMIT;

-- =============================================================================
-- POST-MIGRATION MEDALLION SETUP
-- =============================================================================

DO $$
BEGIN
  -- Initialize data lineage records
  INSERT INTO metadata.data_lineage (source_schema, source_table, target_schema, target_table, transformation_type, transformation_logic) VALUES
  ('hr_admin', 'employees', 'bronze_hr', 'employees_raw', 'direct', 'SELECT * with metadata'),
  ('bronze_hr', 'employees_raw', 'silver_hr', 'employees_validated', 'bronze_to_silver', 'Data quality validation and enrichment'),
  ('silver_hr', 'employees_validated', 'gold', 'hr_executive_dashboard', 'silver_to_gold', 'Business metrics aggregation');
  
  -- Initialize data quality rules
  INSERT INTO metadata.data_quality_rules (schema_name, table_name, column_name, rule_type, rule_definition, severity) VALUES
  ('silver_hr', 'employees_validated', 'email', 'format', '{"pattern": "email_regex"}', 'error'),
  ('silver_hr', 'employees_validated', 'salary', 'range', '{"min": 0, "max": 10000000}', 'error'),
  ('silver_financial', 'cash_advances_validated', 'amount', 'range', '{"min": 0, "max": 1000000}', 'error');
  
  -- Run initial ETL
  PERFORM etl.run_medallion_pipeline();
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Medallion Architecture Implementation Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Bronze Layer: Raw data with source metadata';
  RAISE NOTICE 'Silver Layer: Validated and enriched data';
  RAISE NOTICE 'Gold Layer: Business-ready analytics';
  RAISE NOTICE 'Metadata: Lineage, quality, and monitoring';
  RAISE NOTICE 'ETL: Automated pipeline orchestration';
  RAISE NOTICE '==============================================';
END $$;