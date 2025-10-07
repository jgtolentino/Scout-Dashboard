-- Performance indexes for Scout Dashboard

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON scout.campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON scout.campaigns(brand_name);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON scout.campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON scout.campaigns(start_date, end_date) WHERE end_date >= CURRENT_DATE;

-- Stores indexes
CREATE INDEX IF NOT EXISTS idx_stores_region ON scout.stores(region_code);
CREATE INDEX IF NOT EXISTS idx_stores_city ON scout.stores(city_code);
CREATE INDEX IF NOT EXISTS idx_stores_barangay ON scout.stores(barangay_code);
CREATE INDEX IF NOT EXISTS idx_stores_geo ON scout.stores(region_code, city_code, barangay_code);

-- Transactions indexes (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_transactions_campaign ON scout.transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store ON scout.transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON scout.transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON scout.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_date_desc ON scout.transactions(transaction_date DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_campaign_date ON scout.transactions(campaign_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_store_date ON scout.transactions(store_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_product_date ON scout.transactions(product_id, transaction_date);

-- Covering index for aggregation queries
CREATE INDEX IF NOT EXISTS idx_transactions_aggregation ON scout.transactions(
  transaction_date,
  campaign_id,
  store_id,
  product_id
) INCLUDE (quantity, amount);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_brand ON scout.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON scout.products(category);

-- Brands indexes
CREATE INDEX IF NOT EXISTS idx_brands_category ON scout.brands(category);

-- Partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_transactions_recent ON scout.transactions(transaction_date)
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX IF NOT EXISTS idx_transactions_high_value ON scout.transactions(amount)
  WHERE amount > 1000;

-- Text search indexes for product/brand names
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON scout.products USING gin(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_brands_name_gin ON scout.brands USING gin(to_tsvector('english', brand_name));
CREATE INDEX IF NOT EXISTS idx_campaigns_name_gin ON scout.campaigns USING gin(to_tsvector('english', campaign_name));

-- Analyze tables to update statistics
ANALYZE scout.campaigns;
ANALYZE scout.stores;
ANALYZE scout.transactions;
ANALYZE scout.products;
ANALYZE scout.brands;

-- Create materialized view for dashboard summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS scout.mv_daily_summary AS
SELECT 
  t.transaction_date,
  s.region_code,
  s.region_name,
  s.city_code,
  s.city_name,
  c.brand_name,
  c.category,
  COUNT(DISTINCT t.transaction_id) as transaction_count,
  COUNT(DISTINCT t.store_id) as store_count,
  SUM(t.quantity) as total_quantity,
  SUM(t.amount) as total_amount,
  AVG(t.amount) as avg_transaction_amount
FROM scout.transactions t
JOIN scout.campaigns c ON t.campaign_id = c.id
JOIN scout.stores s ON t.store_id = s.id
WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY 
  t.transaction_date,
  s.region_code,
  s.region_name,
  s.city_code,
  s.city_name,
  c.brand_name,
  c.category;

-- Index the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_daily_summary_date ON scout.mv_daily_summary(transaction_date);
CREATE INDEX IF NOT EXISTS idx_mv_daily_summary_region ON scout.mv_daily_summary(region_code);
CREATE INDEX IF NOT EXISTS idx_mv_daily_summary_brand ON scout.mv_daily_summary(brand_name);

-- Create refresh function for_scout materialized view
CREATE OR REPLACE FUNCTION scout.refresh_daily_summary_scout()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY scout.mv_daily_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-daily-summary', '0 1 * * *', 'SELECT scout.refresh_daily_summary();');