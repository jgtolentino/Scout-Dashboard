-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS scout_dash;

-- File upload tracking table
CREATE TABLE IF NOT EXISTS scout_dash.scout_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN (
    'uploaded', 'processing', 'completed', 'completed_with_errors', 'failed'
  )),
  error_message TEXT,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracted files from ZIP
CREATE TABLE IF NOT EXISTS scout_dash.scout_extracted_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES scout_dash.file_uploads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,
  data_structure JSONB,
  row_count INTEGER,
  status TEXT DEFAULT 'extracted' CHECK (status IN (
    'extracted', 'analyzed', 'processed', 'failed'
  )),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imported campaign data
CREATE TABLE IF NOT EXISTS scout_dash.scout_imported_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES scout_dash.extracted_files(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  brand_name TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2),
  impressions BIGINT,
  clicks BIGINT,
  conversions BIGINT,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imported metrics data
CREATE TABLE IF NOT EXISTS scout_dash.scout_imported_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES scout_dash.extracted_files(id) ON DELETE CASCADE,
  metric_date DATE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(20, 4) NOT NULL,
  dimensions JSONB,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic imported data for manual review
CREATE TABLE IF NOT EXISTS scout_dash.scout_imported_generic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES scout_dash.extracted_files(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing log for audit trail
CREATE TABLE IF NOT EXISTS scout_dash.ces_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES scout_dash.file_uploads(id) ON DELETE CASCADE,
  file_id UUID REFERENCES scout_dash.extracted_files(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_file_uploads_user_id ON scout_dash.file_uploads(user_id);
CREATE INDEX idx_file_uploads_status ON scout_dash.file_uploads(status);
CREATE INDEX idx_file_uploads_upload_date ON scout_dash.file_uploads(upload_date DESC);
CREATE INDEX idx_extracted_files_upload_id ON scout_dash.extracted_files(upload_id);
CREATE INDEX idx_extracted_files_status ON scout_dash.extracted_files(status);
CREATE INDEX idx_extracted_files_file_hash ON scout_dash.extracted_files(file_hash);
CREATE INDEX idx_imported_campaigns_file_id ON scout_dash.imported_campaigns(file_id);
CREATE INDEX idx_imported_campaigns_campaign_name ON scout_dash.imported_campaigns(campaign_name);
CREATE INDEX idx_imported_metrics_file_id ON scout_dash.imported_metrics(file_id);
CREATE INDEX idx_imported_metrics_date ON scout_dash.imported_metrics(metric_date);
CREATE INDEX idx_processing_log_upload_id ON scout_dash.processing_log(upload_id);
CREATE INDEX idx_processing_log_file_id ON scout_dash.processing_log(file_id);

-- Enable Row Level Security
ALTER TABLE scout_dash.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.extracted_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.imported_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.imported_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.imported_generic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.processing_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own uploads
CREATE POLICY "Users can view own uploads" ON scout_dash.file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON scout_dash.file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON scout_dash.file_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON scout_dash.file_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Users can see extracted files from their uploads
CREATE POLICY "Users can view extracted files from own uploads" ON scout_dash.extracted_files
  FOR SELECT USING (
    upload_id IN (
      SELECT id FROM scout_dash.file_uploads WHERE user_id = auth.uid()
    )
  );

-- Similar policies for imported data tables
CREATE POLICY "Users can view imported campaigns from own files" ON scout_dash.imported_campaigns
  FOR SELECT USING (
    file_id IN (
      SELECT ef.id FROM scout_dash.extracted_files ef
      JOIN scout_dash.file_uploads fu ON ef.upload_id = fu.id
      WHERE fu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view imported metrics from own files" ON scout_dash.imported_metrics
  FOR SELECT USING (
    file_id IN (
      SELECT ef.id FROM scout_dash.extracted_files ef
      JOIN scout_dash.file_uploads fu ON ef.upload_id = fu.id
      WHERE fu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view generic data from own files" ON scout_dash.imported_generic_data
  FOR SELECT USING (
    file_id IN (
      SELECT ef.id FROM scout_dash.extracted_files ef
      JOIN scout_dash.file_uploads fu ON ef.upload_id = fu.id
      WHERE fu.user_id = auth.uid()
    )
  );

-- Processing log visible to upload owners
CREATE POLICY "Users can view processing logs for own uploads" ON scout_dash.processing_log
  FOR SELECT USING (
    upload_id IN (
      SELECT id FROM scout_dash.file_uploads WHERE user_id = auth.uid()
    ) OR
    file_id IN (
      SELECT ef.id FROM scout_dash.extracted_files ef
      JOIN scout_dash.file_uploads fu ON ef.upload_id = fu.id
      WHERE fu.user_id = auth.uid()
    )
  );

-- Functions for data processing
CREATE OR REPLACE FUNCTION scout_dash.update_updated_at_scout()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_file_uploads_updated_at
  BEFORE UPDATE ON scout_dash.file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION scout_dash.update_updated_at();

-- Function to check for duplicate uploads
CREATE OR REPLACE FUNCTION scout_dash.check_duplicate_upload_scout(
  p_user_id UUID,
  p_file_hash TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM scout_dash.file_uploads fu
    JOIN scout_dash.extracted_files ef ON fu.id = ef.upload_id
    WHERE fu.user_id = p_user_id
      AND ef.file_hash = p_file_hash
      AND fu.status IN ('completed', 'processing')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get upload statistics
CREATE OR REPLACE FUNCTION scout_dash.get_upload_stats_scout(p_user_id UUID)
RETURNS TABLE (
  total_uploads BIGINT,
  total_size BIGINT,
  successful_uploads BIGINT,
  failed_uploads BIGINT,
  total_files_extracted BIGINT,
  total_campaigns_imported BIGINT,
  total_metrics_imported BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT fu.id)::BIGINT AS total_uploads,
    COALESCE(SUM(fu.file_size), 0)::BIGINT AS total_size,
    COUNT(DISTINCT CASE WHEN fu.status IN ('completed', 'completed_with_errors') THEN fu.id END)::BIGINT AS successful_uploads,
    COUNT(DISTINCT CASE WHEN fu.status = 'failed' THEN fu.id END)::BIGINT AS failed_uploads,
    COUNT(DISTINCT ef.id)::BIGINT AS total_files_extracted,
    COUNT(DISTINCT ic.id)::BIGINT AS total_campaigns_imported,
    COUNT(DISTINCT im.id)::BIGINT AS total_metrics_imported
  FROM scout_dash.file_uploads fu
  LEFT JOIN scout_dash.extracted_files ef ON fu.id = ef.upload_id
  LEFT JOIN scout_dash.imported_campaigns ic ON ef.id = ic.file_id
  LEFT JOIN scout_dash.imported_metrics im ON ef.id = im.file_id
  WHERE fu.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA scout_dash TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA scout_dash TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA scout_dash TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA scout_dash TO authenticated;