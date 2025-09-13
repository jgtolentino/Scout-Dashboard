-- Medallion Architecture for SuqiBot
-- Bronze → Silver → Gold layers for 105+ features

-- Bronze Layer: Raw data ingestion
CREATE TABLE IF NOT EXISTS bronze_ingestion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'scout_dashboard', 'sari_iq', 'similarweb'
  raw_data JSONB NOT NULL,
  record_count INTEGER,
  ingested_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Silver Layer: Cleansed and standardized data
CREATE TABLE IF NOT EXISTS silver_curated (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source TEXT NOT NULL,
  curated_data JSONB NOT NULL,
  quality_score NUMERIC(5,2),
  issues_fixed TEXT[],
  curated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gold Layer: Business-ready insights and analytics
CREATE TABLE IF NOT EXISTS gold_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL,
  analytics_type TEXT NOT NULL, -- 'executive_summary', 'market_intelligence', etc.
  insights JSONB NOT NULL,
  confidence_score NUMERIC(5,2),
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SuqiBot operation logs
CREATE TABLE IF NOT EXISTS suqi_bot_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Analytics cache for real-time performance
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_data JSONB NOT NULL,
  filters JSONB,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  hit_count INTEGER DEFAULT 0
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'scout', 'sari_iq', 'similarweb'
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_bronze_batch ON bronze_ingestion(batch_id);
CREATE INDEX idx_bronze_source ON bronze_ingestion(source);
CREATE INDEX idx_bronze_ingested ON bronze_ingestion(ingested_at);

CREATE INDEX idx_silver_batch ON silver_curated(batch_id);
CREATE INDEX idx_silver_source ON silver_curated(source);
CREATE INDEX idx_silver_quality ON silver_curated(quality_score);

CREATE INDEX idx_gold_batch ON gold_insights(batch_id);
CREATE INDEX idx_gold_type ON gold_insights(analytics_type);
CREATE INDEX idx_gold_confidence ON gold_insights(confidence_score);

CREATE INDEX idx_logs_operation ON suqi_bot_logs(operation);
CREATE INDEX idx_logs_status ON suqi_bot_logs(status);
CREATE INDEX idx_logs_timestamp ON suqi_bot_logs(timestamp);

CREATE INDEX idx_cache_metric ON analytics_cache(metric_type);
CREATE INDEX idx_cache_expires ON analytics_cache(expires_at);

-- Views for monitoring
CREATE VIEW medallion_pipeline_status AS
SELECT 
  b.batch_id,
  b.source,
  b.ingested_at as bronze_time,
  s.curated_at as silver_time,
  g.generated_at as gold_time,
  g.analytics_type,
  g.confidence_score,
  EXTRACT(EPOCH FROM (g.generated_at - b.ingested_at)) as total_processing_seconds
FROM bronze_ingestion b
LEFT JOIN silver_curated s ON b.batch_id = s.batch_id
LEFT JOIN gold_insights g ON b.batch_id = g.batch_id
ORDER BY b.ingested_at DESC;

CREATE VIEW feature_performance AS
SELECT 
  source,
  COUNT(DISTINCT feature_id) as unique_features,
  SUM(usage_count) as total_usage,
  MAX(last_used) as last_activity
FROM feature_usage
GROUP BY source;

-- Row Level Security
ALTER TABLE bronze_ingestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_curated ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE suqi_bot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Policies for service role (SuqiBot)
CREATE POLICY "Service role full access" ON bronze_ingestion FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON silver_curated FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON gold_insights FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON suqi_bot_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON analytics_cache FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON feature_usage FOR ALL TO service_role USING (true);

-- Policies for authenticated users (read-only)
CREATE POLICY "Authenticated read access" ON gold_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON analytics_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON feature_usage FOR SELECT TO authenticated USING (true);