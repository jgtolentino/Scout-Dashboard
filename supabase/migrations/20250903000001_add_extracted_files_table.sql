-- Add extracted_files table for ZIP ingestion system
-- Migration: 20250903000001_add_extracted_files_table.sql

-- Extracted files table (for tracking individual files within ZIP uploads)
CREATE TABLE IF NOT EXISTS scout_dash.scout_extracted_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES scout_dash.file_uploads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_extracted_files_upload_id ON scout_dash.extracted_files(upload_id);
CREATE INDEX IF NOT EXISTS idx_extracted_files_type ON scout_dash.extracted_files(file_type);
CREATE INDEX IF NOT EXISTS idx_extracted_files_extracted_at ON scout_dash.extracted_files(extracted_at DESC);

-- Add updated_at trigger
CREATE TRIGGER trigger_extracted_files_updated_at
  BEFORE UPDATE ON scout_dash.extracted_files
  FOR EACH ROW
  EXECUTE FUNCTION scout_dash.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE scout_dash.extracted_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy for extracted_files
CREATE POLICY "Users can view own extracted files" ON scout_dash.extracted_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scout_dash.file_uploads 
      WHERE id = extracted_files.upload_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert extracted files" ON scout_dash.extracted_files
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON scout_dash.extracted_files TO authenticated;
GRANT SELECT ON scout_dash.extracted_files TO anon;

-- Add additional fields to file_uploads table for better ZIP tracking
ALTER TABLE scout_dash.file_uploads 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS extracted_files_count INTEGER DEFAULT 0;

-- Update the import statistics view to include extracted files info
CREATE OR REPLACE VIEW scout_dash.import_statistics AS
SELECT 
  u.user_id,
  COUNT(DISTINCT u.id) as total_uploads,
  COUNT(DISTINCT CASE WHEN u.status = 'completed' THEN u.id END) as successful_uploads,
  COUNT(DISTINCT CASE WHEN u.status = 'failed' THEN u.id END) as failed_uploads,
  COUNT(DISTINCT CASE WHEN u.status = 'processing' THEN u.id END) as processing_uploads,
  SUM(u.file_size) as total_size_bytes,
  COALESCE(SUM(u.extracted_files_count), 0) as total_files_extracted,
  COALESCE(SUM(l.records_imported), 0) as total_records_imported,
  COALESCE(SUM(l.records_failed), 0) as total_records_failed,
  MAX(u.uploaded_at) as last_upload_date,
  AVG(l.processing_time_ms) as avg_processing_time_ms
FROM scout_dash.file_uploads u
LEFT JOIN scout_dash.file_processing_logs l ON u.id = l.upload_id
GROUP BY u.user_id;

-- Function to get extracted files for an upload
CREATE OR REPLACE FUNCTION scout_dash.get_extracted_files_scout(p_upload_id UUID)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  extracted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ef.id,
    ef.filename,
    ef.file_type,
    ef.file_size,
    ef.storage_path,
    ef.extracted_at
  FROM scout_dash.extracted_files ef
  WHERE ef.upload_id = p_upload_id
  ORDER BY ef.extracted_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION scout_dash.get_extracted_files TO authenticated;

-- Add comments
COMMENT ON TABLE scout_dash.extracted_files IS 'Individual files extracted from ZIP uploads';
COMMENT ON FUNCTION scout_dash.get_extracted_files IS 'Returns all files extracted from a specific upload';