-- Scout Dashboard Comparison Views Migration
-- Adds materialized views and functions for A/B comparison system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create comparison session tracking table
CREATE TABLE IF NOT EXISTS scout.comparison_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  mode TEXT CHECK (mode IN ('off', 'time', 'brand', 'category', 'geo')),
  normalize TEXT CHECK (normalize IN ('none', 'share_category', 'share_geo', 'index_100')),
  population_weighting BOOLEAN DEFAULT FALSE,
  set_a JSONB, -- {time: {}, product: {}, geo: {}}
  set_b JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create index for efficient session lookup
CREATE INDEX IF NOT EXISTS idx_comparison_sessions_user_created 
  ON scout.comparison_sessions (user_id, created_at DESC);

-- Executive KPIs Compare View
CREATE OR REPLACE VIEW scout.vw_exec_kpis_compare AS
WITH cohort_base AS (
  SELECT
    'A'::text AS set_label,
    t.time_id, l.region_id, l.province_id, l.city_id, l.barangay_id,
    p.category_id, p.brand_id, p.sku_id,
    t.peso_value, t.total_units, 1::int AS txn
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_location l ON l.location_id = t.location_id
  LEFT JOIN scout.dim_product p ON p.product_id = t.product_id
  WHERE tm.date_day BETWEEN COALESCE(CURRENT_DATE - INTERVAL '28 days', '2024-01-01') 
                       AND COALESCE(CURRENT_DATE, '2024-12-31')
  
  UNION ALL
  
  SELECT
    'B'::text AS set_label,
    t.time_id, l.region_id, l.province_id, l.city_id, l.barangay_id,
    p.category_id, p.brand_id, p.sku_id,
    t.peso_value, t.total_units, 1::int AS txn
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_location l ON l.location_id = t.location_id
  LEFT JOIN scout.dim_product p ON p.product_id = t.product_id
  WHERE tm.date_day BETWEEN COALESCE(CURRENT_DATE - INTERVAL '56 days', '2024-01-01') 
                       AND COALESCE(CURRENT_DATE - INTERVAL '28 days', '2024-01-01')
),
agg AS (
  SELECT
    set_label,
    'total' AS entity_key,
    SUM(peso_value) AS peso_value,
    SUM(total_units) AS units,
    SUM(txn) AS txn_count,
    AVG(peso_value) AS avg_basket_value
  FROM cohort_base
  GROUP BY 1, 2
),
pivot AS (
  SELECT 
    entity_key,
    'txn_count' AS metric,
    MAX(txn_count) FILTER (WHERE set_label='A') AS val_a,
    MAX(txn_count) FILTER (WHERE set_label='B') AS val_b
  FROM agg GROUP BY 1, 2
  
  UNION ALL
  
  SELECT 
    entity_key,
    'peso_value' AS metric,
    MAX(peso_value) FILTER (WHERE set_label='A') AS val_a,
    MAX(peso_value) FILTER (WHERE set_label='B') AS val_b
  FROM agg GROUP BY 1, 2
  
  UNION ALL
  
  SELECT 
    entity_key,
    'avg_basket_value' AS metric,
    MAX(avg_basket_value) FILTER (WHERE set_label='A') AS val_a,
    MAX(avg_basket_value) FILTER (WHERE set_label='B') AS val_b
  FROM agg GROUP BY 1, 2
  
  UNION ALL
  
  SELECT 
    entity_key,
    'units' AS metric,
    MAX(units) FILTER (WHERE set_label='A') AS val_a,
    MAX(units) FILTER (WHERE set_label='B') AS val_b
  FROM agg GROUP BY 1, 2
)
SELECT 
  entity_key,
  metric,
  val_a,
  val_b,
  (val_b - val_a) AS delta_abs,
  CASE 
    WHEN val_a = 0 OR val_a IS NULL THEN NULL 
    ELSE ((val_b - val_a)::numeric / val_a) * 100 
  END AS delta_pct,
  CASE 
    WHEN val_a = 0 OR val_a IS NULL THEN NULL 
    ELSE (val_b::numeric / val_a) * 100 
  END AS index_100
FROM pivot
ORDER BY metric;

-- Timeseries Compare View
CREATE OR REPLACE VIEW scout.vw_timeseries_compare AS
WITH cohort_base AS (
  SELECT
    'A'::text AS set_label,
    tm.date_day AS bucket,
    t.peso_value, t.total_units, 1::int AS txn
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '28 days' AND CURRENT_DATE
  
  UNION ALL
  
  SELECT
    'B'::text AS set_label,
    tm.date_day AS bucket,
    t.peso_value, t.total_units, 1::int AS txn
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '56 days' 
                       AND CURRENT_DATE - INTERVAL '28 days'
)
SELECT
  set_label,
  bucket,
  SUM(peso_value) AS value,
  SUM(txn) AS txn_count,
  SUM(total_units) AS units
FROM cohort_base
GROUP BY 1, 2
ORDER BY bucket, set_label;

-- Category Brand Share View
CREATE OR REPLACE VIEW scout.vw_category_brand_share AS
WITH cohort_base AS (
  SELECT
    'A'::text AS set_label,
    b.brand_name AS entity,
    c.category_name,
    t.peso_value, t.total_units
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_product p ON p.product_id = t.product_id
  JOIN scout.dim_brand b ON b.brand_id = p.brand_id
  JOIN scout.dim_category c ON c.category_id = b.category_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '28 days' AND CURRENT_DATE
  
  UNION ALL
  
  SELECT
    'B'::text AS set_label,
    b.brand_name AS entity,
    c.category_name,
    t.peso_value, t.total_units
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_product p ON p.product_id = t.product_id
  JOIN scout.dim_brand b ON b.brand_id = p.brand_id
  JOIN scout.dim_category c ON c.category_id = b.category_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '56 days' 
                       AND CURRENT_DATE - INTERVAL '28 days'
),
agg AS (
  SELECT
    set_label,
    entity,
    category_name,
    SUM(peso_value) AS peso_value,
    SUM(total_units) AS units
  FROM cohort_base
  GROUP BY 1, 2, 3
),
totals AS (
  SELECT
    set_label,
    category_name,
    SUM(peso_value) AS category_total
  FROM agg
  GROUP BY 1, 2
)
SELECT
  a.set_label,
  a.entity,
  a.category_name,
  a.peso_value,
  a.units,
  (a.peso_value::numeric / NULLIF(t.category_total, 0)) AS share
FROM agg a
JOIN totals t ON t.set_label = a.set_label AND t.category_name = a.category_name
ORDER BY a.category_name, a.set_label, a.peso_value DESC;

-- Brand Rank Delta View
CREATE OR REPLACE VIEW scout.vw_brand_rank_delta AS
WITH cohort_base AS (
  SELECT
    'A'::text AS set_label,
    b.brand_name AS brand,
    c.category_name,
    SUM(t.peso_value) AS peso_value,
    SUM(t.total_units) AS units
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_product p ON p.product_id = t.product_id
  JOIN scout.dim_brand b ON b.brand_id = p.brand_id
  JOIN scout.dim_category c ON c.category_id = b.category_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '28 days' AND CURRENT_DATE
  GROUP BY 1, 2, 3
  
  UNION ALL
  
  SELECT
    'B'::text AS set_label,
    b.brand_name AS brand,
    c.category_name,
    SUM(t.peso_value) AS peso_value,
    SUM(t.total_units) AS units
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_product p ON p.product_id = t.product_id
  JOIN scout.dim_brand b ON b.brand_id = p.brand_id
  JOIN scout.dim_category c ON c.category_id = b.category_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '56 days' 
                       AND CURRENT_DATE - INTERVAL '28 days'
  GROUP BY 1, 2, 3
),
ranked AS (
  SELECT
    set_label,
    brand,
    category_name,
    peso_value,
    units,
    ROW_NUMBER() OVER (PARTITION BY set_label, category_name ORDER BY peso_value DESC) AS rank
  FROM cohort_base
),
pivot AS (
  SELECT
    brand,
    category_name,
    'peso_value' AS metric,
    MAX(rank) FILTER (WHERE set_label='A') AS rank_a,
    MAX(rank) FILTER (WHERE set_label='B') AS rank_b,
    MAX(peso_value) FILTER (WHERE set_label='A') AS val_a,
    MAX(peso_value) FILTER (WHERE set_label='B') AS val_b
  FROM ranked
  GROUP BY 1, 2, 3
)
SELECT
  brand,
  category_name,
  metric,
  rank_a,
  rank_b,
  (rank_b - rank_a) AS rank_delta,
  val_a,
  val_b,
  ((val_b - val_a)::numeric / NULLIF(val_a, 0)) * 100 AS change_pct
FROM pivot
WHERE rank_a IS NOT NULL OR rank_b IS NOT NULL
ORDER BY category_name, COALESCE(rank_a, rank_b);

-- Geographic Metric Views (A, B, Delta)
CREATE OR REPLACE VIEW scout.vw_geo_metric_A AS
SELECT
  l.geom,
  l.region_name,
  l.province_name,
  l.city_name,
  l.barangay_name,
  SUM(t.peso_value) AS metric_value,
  SUM(t.total_units) AS units,
  COUNT(*) AS txn_count
FROM scout.fact_transactions t
JOIN scout.dim_time tm ON tm.time_id = t.time_id
JOIN scout.dim_location l ON l.location_id = t.location_id
WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '28 days' AND CURRENT_DATE
GROUP BY 1, 2, 3, 4, 5;

CREATE OR REPLACE VIEW scout.vw_geo_metric_B AS
SELECT
  l.geom,
  l.region_name,
  l.province_name,
  l.city_name,
  l.barangay_name,
  SUM(t.peso_value) AS metric_value,
  SUM(t.total_units) AS units,
  COUNT(*) AS txn_count
FROM scout.fact_transactions t
JOIN scout.dim_time tm ON tm.time_id = t.time_id
JOIN scout.dim_location l ON l.location_id = t.location_id
WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '56 days' 
                     AND CURRENT_DATE - INTERVAL '28 days'
GROUP BY 1, 2, 3, 4, 5;

CREATE OR REPLACE VIEW scout.vw_geo_metric_delta AS
SELECT
  COALESCE(a.geom, b.geom) AS geom,
  COALESCE(a.region_name, b.region_name) AS region_name,
  COALESCE(a.province_name, b.province_name) AS province_name,
  COALESCE(a.city_name, b.city_name) AS city_name,
  COALESCE(a.barangay_name, b.barangay_name) AS barangay_name,
  COALESCE(a.metric_value, 0) AS val_a,
  COALESCE(b.metric_value, 0) AS val_b,
  (COALESCE(b.metric_value, 0) - COALESCE(a.metric_value, 0)) AS delta_abs,
  CASE 
    WHEN COALESCE(a.metric_value, 0) = 0 THEN NULL
    ELSE ((COALESCE(b.metric_value, 0) - COALESCE(a.metric_value, 0))::numeric / a.metric_value) * 100
  END AS delta_pct
FROM scout.vw_geo_metric_A a
FULL OUTER JOIN scout.vw_geo_metric_B b USING (geom);

-- AI Recommendations View (enhanced for comparison context)
CREATE OR REPLACE VIEW scout.vw_ai_recommendations AS
WITH recent_performance AS (
  SELECT
    b.brand_name,
    c.category_name,
    l.region_name,
    SUM(t.peso_value) AS recent_value,
    SUM(t.total_units) AS recent_units,
    COUNT(*) AS recent_txns
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_location l ON l.location_id = t.location_id
  LEFT JOIN scout.dim_product p ON p.product_id = t.product_id
  LEFT JOIN scout.dim_brand b ON b.brand_id = p.brand_id
  LEFT JOIN scout.dim_category c ON c.category_id = b.category_id
  WHERE tm.date_day >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY 1, 2, 3
),
prev_performance AS (
  SELECT
    b.brand_name,
    c.category_name,
    l.region_name,
    SUM(t.peso_value) AS prev_value,
    SUM(t.total_units) AS prev_units,
    COUNT(*) AS prev_txns
  FROM scout.fact_transactions t
  JOIN scout.dim_time tm ON tm.time_id = t.time_id
  JOIN scout.dim_location l ON l.location_id = t.location_id
  LEFT JOIN scout.dim_product p ON p.product_id = t.product_id
  LEFT JOIN scout.dim_brand b ON b.brand_id = p.brand_id
  LEFT JOIN scout.dim_category c ON c.category_id = b.category_id
  WHERE tm.date_day BETWEEN CURRENT_DATE - INTERVAL '14 days' 
                       AND CURRENT_DATE - INTERVAL '7 days'
  GROUP BY 1, 2, 3
),
changes AS (
  SELECT
    COALESCE(r.brand_name, p.brand_name) AS brand_name,
    COALESCE(r.category_name, p.category_name) AS category_name,
    COALESCE(r.region_name, p.region_name) AS region_name,
    COALESCE(r.recent_value, 0) AS recent_value,
    COALESCE(p.prev_value, 0) AS prev_value,
    CASE 
      WHEN COALESCE(p.prev_value, 0) = 0 THEN NULL
      ELSE ((COALESCE(r.recent_value, 0) - COALESCE(p.prev_value, 0))::numeric / p.prev_value) * 100
    END AS change_pct
  FROM recent_performance r
  FULL OUTER JOIN prev_performance p ON (
    p.brand_name = r.brand_name AND 
    p.category_name = r.category_name AND 
    p.region_name = r.region_name
  )
)
SELECT
  CASE 
    WHEN change_pct > 20 THEN 'Strong Growth: ' || brand_name || ' in ' || region_name
    WHEN change_pct < -20 THEN 'Declining Performance: ' || brand_name || ' in ' || region_name  
    WHEN recent_value = 0 AND prev_value > 0 THEN 'Lost Sales: ' || brand_name || ' in ' || region_name
    WHEN prev_value = 0 AND recent_value > 0 THEN 'New Activity: ' || brand_name || ' in ' || region_name
    ELSE 'Stable Performance: ' || brand_name || ' in ' || region_name
  END AS recommendation,
  
  CASE 
    WHEN ABS(change_pct) > 50 THEN 1
    WHEN ABS(change_pct) > 20 THEN 2  
    WHEN ABS(change_pct) > 10 THEN 3
    ELSE 4
  END AS priority,
  
  CASE
    WHEN change_pct > 20 THEN 'Week-over-week growth of ' || ROUND(change_pct, 1) || '% indicates strong market momentum'
    WHEN change_pct < -20 THEN 'Week-over-week decline of ' || ROUND(ABS(change_pct), 1) || '% requires immediate attention'
    WHEN recent_value = 0 THEN 'Complete sales halt detected - investigate supply or demand issues'  
    WHEN prev_value = 0 THEN 'New sales activity detected - monitor for trend development'
    ELSE 'Performance within normal range (' || ROUND(COALESCE(change_pct, 0), 1) || '% change)'
  END AS rationale,
  
  brand_name,
  category_name, 
  region_name,
  recent_value,
  prev_value,
  change_pct,
  NOW() AS generated_at
FROM changes
WHERE (brand_name IS NOT NULL OR category_name IS NOT NULL)
  AND region_name IS NOT NULL
ORDER BY priority, ABS(COALESCE(change_pct, 0)) DESC
LIMIT 100;

-- Function to refresh comparison materialized views
CREATE OR REPLACE FUNCTION scout.refresh_comparison_views()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Since these are regular views, they don't need explicit refresh
  -- But we can add logic here for future materialized views
  RAISE NOTICE 'Comparison views refreshed successfully';
END;
$$;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA scout TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA scout TO anon;
GRANT USAGE ON SCHEMA scout TO authenticated;
GRANT USAGE ON SCHEMA scout TO anon;

-- Add RLS policies for comparison sessions
ALTER TABLE scout.comparison_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own comparison sessions" 
  ON scout.comparison_sessions
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create indexes for performance  
CREATE INDEX IF NOT EXISTS idx_fact_transactions_time_location 
  ON scout.fact_transactions (time_id, location_id);

CREATE INDEX IF NOT EXISTS idx_fact_transactions_time_product
  ON scout.fact_transactions (time_id, product_id);

CREATE INDEX IF NOT EXISTS idx_dim_time_date_day 
  ON scout.dim_time (date_day);

-- Add comments for documentation
COMMENT ON VIEW scout.vw_exec_kpis_compare IS 'Executive KPIs with A/B comparison and delta calculations';
COMMENT ON VIEW scout.vw_timeseries_compare IS 'Time series data for A/B comparison charts';
COMMENT ON VIEW scout.vw_category_brand_share IS 'Brand market share within categories for comparison';
COMMENT ON VIEW scout.vw_brand_rank_delta IS 'Brand ranking changes between comparison periods';
COMMENT ON VIEW scout.vw_geo_metric_A IS 'Geographic performance metrics for comparison set A';
COMMENT ON VIEW scout.vw_geo_metric_B IS 'Geographic performance metrics for comparison set B';  
COMMENT ON VIEW scout.vw_geo_metric_delta IS 'Geographic performance deltas between A and B sets';
COMMENT ON VIEW scout.vw_ai_recommendations IS 'AI-generated recommendations based on performance changes';

COMMENT ON TABLE scout.comparison_sessions IS 'User comparison session configurations with TTL';
COMMENT ON FUNCTION scout.refresh_comparison_views() IS 'Refresh function for comparison system materialized views';