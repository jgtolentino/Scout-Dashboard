------------------------------------------------------------
-- RLS for all business-ready GOLD tables
-- • read-only for `authenticated`
-- • full access for `service_role`
------------------------------------------------------------
DO $$
DECLARE
  _tbl text;
BEGIN
  -- List any new gold tables here
  FOR _tbl IN
    SELECT unnest(ARRAY[
      'gold.daily_transaction_summary',
      'gold.brand_performance_summary',
      'gold.executive_kpi_summary',
      'gold.store_performance_summary',
      'gold.market_intelligence_summary',
      'gold.regional_aggregates',
      'gold.product_performance_matrix',
      'gold.customer_segment_analysis'
    ])
  LOOP
    -- Enable RLS if not already enabled
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', _tbl);

    -- Create SELECT policy for authenticated users (idempotent)
    BEGIN
      EXECUTE format(
        'CREATE POLICY p_select_%1$I_auth ON %1$I
            FOR SELECT
            TO authenticated
            USING (true)', replace(_tbl, '.', '_'));
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy p_select_% already exists, skipping', replace(_tbl, '.', '_');
    END;

    -- Create ALL policy for service_role (idempotent)
    BEGIN
      EXECUTE format(
        'CREATE POLICY p_all_%1$I_service ON %1$I
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)', replace(_tbl, '.', '_'));
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy p_all_% already exists, skipping', replace(_tbl, '.', '_');
    END;

    RAISE NOTICE '✅ RLS policies applied to %', _tbl;
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Additional performance indexes for gold tables
CREATE INDEX IF NOT EXISTS idx_gold_daily_summary_date 
  ON gold.daily_transaction_summary(business_date DESC);

CREATE INDEX IF NOT EXISTS idx_gold_brand_perf_date 
  ON gold.brand_performance_summary(summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_gold_exec_kpi_date 
  ON gold.executive_kpi_summary(business_date DESC, kpi_type);

-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA gold TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO authenticated;

-- Future tables in gold schema will inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA gold 
  GRANT SELECT ON TABLES TO authenticated;

COMMENT ON SCHEMA gold IS 'Business-ready aggregated data with RLS - read-only for authenticated users';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Gold schema RLS migration completed successfully';
  RAISE NOTICE 'Authenticated users have read-only access to all gold tables';
  RAISE NOTICE 'Service role has full access to all gold tables';
END $$;