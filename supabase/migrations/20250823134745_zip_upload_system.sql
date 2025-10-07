-- Scout Dashboard ZIP Upload System
-- Migration: 20250823134745_zip_upload_system.sql

-- Create scout_dash schema if not exists
CREATE SCHEMA IF NOT EXISTS scout_dash;

-- File upload tracking table
CREATE TABLE IF NOT EXISTS scout_dash.scout_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing logs table
CREATE TABLE IF NOT EXISTS scout_dash.ces_file_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES scout_dash.file_uploads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  records_found INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON scout_dash.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON scout_dash.file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at ON scout_dash.file_uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_hash ON scout_dash.file_uploads(file_hash);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_status ON scout_dash.file_uploads(user_id, status);

CREATE INDEX IF NOT EXISTS idx_processing_logs_upload_id ON scout_dash.file_processing_logs(upload_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON scout_dash.file_processing_logs(created_at DESC);

-- Updated trigger for file_uploads
CREATE OR REPLACE FUNCTION scout_dash.handle_updated_at_scout()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_file_uploads_updated_at
  BEFORE UPDATE ON scout_dash.file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION scout_dash.handle_updated_at();

-- Import statistics view
CREATE OR REPLACE VIEW scout_dash.import_statistics AS
SELECT 
  u.user_id,
  COUNT(DISTINCT u.id) as total_uploads,
  COUNT(DISTINCT CASE WHEN u.status = 'completed' THEN u.id END) as successful_uploads,
  COUNT(DISTINCT CASE WHEN u.status = 'failed' THEN u.id END) as failed_uploads,
  COUNT(DISTINCT CASE WHEN u.status = 'processing' THEN u.id END) as processing_uploads,
  SUM(u.file_size) as total_size_bytes,
  COALESCE(SUM(l.records_imported), 0) as total_records_imported,
  COALESCE(SUM(l.records_failed), 0) as total_records_failed,
  MAX(u.uploaded_at) as last_upload_date,
  AVG(l.processing_time_ms) as avg_processing_time_ms
FROM scout_dash.file_uploads u
LEFT JOIN scout_dash.file_processing_logs l ON u.id = l.upload_id
GROUP BY u.user_id;

-- Function to check for duplicate files
CREATE OR REPLACE FUNCTION scout_dash.check_duplicate_file_scout(p_user_id UUID, p_file_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM scout_dash.file_uploads 
    WHERE user_id = p_user_id 
    AND file_hash = p_file_hash 
    AND status IN ('completed', 'processing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update upload status
CREATE OR REPLACE FUNCTION scout_dash.update_upload_status_scout(
  p_upload_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE scout_dash.file_uploads
  SET 
    status = p_status,
    processed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_upload_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upload history for user
CREATE OR REPLACE FUNCTION scout_dash.get_upload_history_scout(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  file_size BIGINT,
  status TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  records_imported INTEGER,
  processing_time_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.filename,
    u.file_size,
    u.status,
    u.uploaded_at,
    u.processed_at,
    u.error_message,
    COALESCE(SUM(l.records_imported), 0)::INTEGER as records_imported,
    AVG(l.processing_time_ms)::INTEGER as processing_time_ms
  FROM scout_dash.file_uploads u
  LEFT JOIN scout_dash.file_processing_logs l ON u.id = l.upload_id
  WHERE u.user_id = p_user_id
  GROUP BY u.id, u.filename, u.file_size, u.status, u.uploaded_at, u.processed_at, u.error_message
  ORDER BY u.uploaded_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE scout_dash.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.file_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_uploads
CREATE POLICY "Users can view own uploads" ON scout_dash.file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON scout_dash.file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON scout_dash.file_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON scout_dash.file_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for file_processing_logs
CREATE POLICY "Users can view own processing logs" ON scout_dash.file_processing_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scout_dash.file_uploads 
      WHERE id = file_processing_logs.upload_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert processing logs" ON scout_dash.file_processing_logs
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA scout_dash TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA scout_dash TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA scout_dash TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA scout_dash TO anon;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION scout_dash.update_upload_status TO authenticated;
GRANT EXECUTE ON FUNCTION scout_dash.check_duplicate_file TO authenticated;
GRANT EXECUTE ON FUNCTION scout_dash.get_upload_history TO authenticated;

-- Comments for documentation
COMMENT ON TABLE scout_dash.file_uploads IS 'Tracks ZIP file uploads and their processing status';
COMMENT ON TABLE scout_dash.file_processing_logs IS 'Detailed logs for each file processed within uploaded ZIPs';
COMMENT ON VIEW scout_dash.import_statistics IS 'Aggregate statistics for user upload history';
COMMENT ON FUNCTION scout_dash.check_duplicate_file IS 'Prevents duplicate file uploads based on hash';
COMMENT ON FUNCTION scout_dash.update_upload_status IS 'Updates upload status and metadata';
COMMENT ON FUNCTION scout_dash.get_upload_history IS 'Returns paginated upload history for a user';