-- Create schema for Scout Analytics
CREATE SCHEMA IF NOT EXISTS scout;

-- Main transactions table
CREATE TABLE IF NOT EXISTS scout.transactions (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('morning','afternoon','evening','night')),
  region TEXT,
  province TEXT,
  city TEXT,
  barangay TEXT,
  product_category TEXT,
  brand_name TEXT,
  sku TEXT,
  units_per_transaction INT CHECK (units_per_transaction >= 0),
  peso_value NUMERIC CHECK (peso_value >= 0),
  basket_size INT CHECK (basket_size >= 0),
  combo_basket TEXT[],
  request_mode TEXT CHECK (request_mode IN ('verbal','pointing','indirect')),
  request_type TEXT CHECK (request_type IN ('branded','unbranded','point','indirect')),
  suggestion_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  gender TEXT CHECK (gender IN ('male','female','unknown')),
  age_bracket TEXT CHECK (age_bracket IN ('18-24','25-34','35-44','45-54','55+','unknown')),
  substitution_occurred BOOLEAN NOT NULL DEFAULT FALSE,
  substitution_from TEXT,
  substitution_to TEXT,
  substitution_reason TEXT,
  duration_seconds INT CHECK (duration_seconds >= 0) DEFAULT 0,
  campaign_influenced BOOLEAN NOT NULL DEFAULT FALSE,
  handshake_score NUMERIC CHECK (handshake_score >= 0 AND handshake_score <= 1) DEFAULT 0,
  is_tbwa_client BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT,
  customer_type TEXT,
  store_type TEXT,
  economic_class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scout_txn_timestamp ON scout.transactions (timestamp);
CREATE INDEX IF NOT EXISTS idx_scout_txn_geo ON scout.transactions (region, province, city, barangay);
CREATE INDEX IF NOT EXISTS idx_scout_txn_cat_brand ON scout.transactions (product_category, brand_name);
CREATE INDEX IF NOT EXISTS idx_scout_txn_tod ON scout.transactions (time_of_day);
CREATE INDEX IF NOT EXISTS idx_scout_txn_store ON scout.transactions (store_id);

-- Views for dashboard analytics leveraging production dimensional tables
CREATE OR REPLACE VIEW scout.v_trends_daily AS
SELECT 
  date_trunc('day', timestamp)::date AS day,
  COUNT(*)::INT AS tx_count,
  SUM(peso_value)::FLOAT AS sales,
  AVG(peso_value)::FLOAT AS avg_transaction
FROM scout.transactions
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW scout.v_behavior AS
SELECT 
  request_type,
  COUNT(*)::INT AS n,
  AVG((suggestion_accepted)::int)::FLOAT AS acceptance_rate
FROM scout.transactions
GROUP BY 1;

-- Updated product mix view to leverage master data tables if available
CREATE OR REPLACE VIEW scout.v_product_mix AS
SELECT
  COALESCE(mc.category_name, t.product_category, 'unknown') AS product_category,
  COALESCE(mb.brand_name, t.brand_name, 'unknown') AS brand_name,
  COUNT(*)::INT AS n,
  SUM(t.peso_value)::FLOAT AS total_sales
FROM scout.transactions t
LEFT JOIN master_categories mc ON LOWER(t.product_category) = LOWER(mc.category_name)
LEFT JOIN master_brands mb ON LOWER(t.brand_name) = LOWER(mb.brand_name)
GROUP BY 1, 2
ORDER BY n DESC;

CREATE OR REPLACE VIEW scout.v_profiling AS
SELECT
  gender,
  age_bracket,
  COUNT(*)::INT AS n,
  AVG(peso_value)::FLOAT AS avg_spend
FROM scout.transactions
GROUP BY 1, 2;

-- Updated geographic view to use ph_provinces table for proper province normalization
CREATE OR REPLACE VIEW scout.v_geo_province AS
SELECT
  COALESCE(p.province_name, t.province, 'unknown') AS province,
  COUNT(t.*)::INT AS tx_count,
  SUM(t.peso_value)::FLOAT AS sales,
  AVG(t.peso_value)::FLOAT AS avg_transaction,
  p.region_name,
  p.province_code
FROM ph_provinces p
LEFT JOIN scout.transactions t ON (
  LOWER(TRIM(t.province)) = LOWER(TRIM(p.province_name)) OR
  LOWER(TRIM(t.province)) = LOWER(TRIM(p.alt_name)) OR
  LOWER(TRIM(t.province)) LIKE LOWER(TRIM(p.province_name)) || '%'
)
GROUP BY p.province_name, p.region_name, p.province_code, t.province
HAVING COUNT(t.*) > 0 OR p.province_name IS NOT NULL
ORDER BY tx_count DESC NULLS LAST;

CREATE OR REPLACE VIEW scout.v_time_heatmap AS
SELECT
  time_of_day,
  EXTRACT(dow FROM timestamp) AS day_of_week,
  COUNT(*)::INT AS tx_count,
  AVG(peso_value)::FLOAT AS avg_value
FROM scout.transactions
GROUP BY 1, 2;

-- Updated competitive analysis to use master brands data
CREATE OR REPLACE VIEW scout.v_competitive_analysis AS
SELECT
  COALESCE(mb.brand_name, t.brand_name) AS brand_name,
  COALESCE(mc.category_name, t.product_category) AS product_category,
  COUNT(*)::INT AS market_share,
  SUM(t.peso_value)::FLOAT AS total_revenue,
  AVG(t.peso_value)::FLOAT AS avg_price_point,
  AVG((t.suggestion_accepted)::INT)::FLOAT AS acceptance_rate,
  mb.is_tbwa_client,
  mb.tier_classification
FROM scout.transactions t
LEFT JOIN master_brands mb ON LOWER(TRIM(t.brand_name)) = LOWER(TRIM(mb.brand_name))
LEFT JOIN master_categories mc ON LOWER(TRIM(t.product_category)) = LOWER(TRIM(mc.category_name))
WHERE t.brand_name IS NOT NULL
GROUP BY mb.brand_name, t.brand_name, mc.category_name, t.product_category, mb.is_tbwa_client, mb.tier_classification
ORDER BY market_share DESC;

-- Grant permissions
GRANT USAGE ON SCHEMA scout TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA scout TO anon, authenticated;

-- Enable RLS (Row Level Security)
ALTER TABLE scout.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON scout.transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow anonymous access for demo purposes (remove in production)
CREATE POLICY "Allow anonymous read" ON scout.transactions
  FOR SELECT USING (TRUE);