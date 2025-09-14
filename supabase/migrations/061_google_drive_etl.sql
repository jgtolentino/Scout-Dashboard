-- Google Drive ETL Pipeline Infrastructure
-- Add Google Drive credentials to vault allowlist and create ETL infrastructure

-- Add Google Drive API credentials to vault allowlist
INSERT INTO internal.vault_allowlist(key, purpose) VALUES
  ('GOOGLE_DRIVE_CLIENT_ID', 'Google Drive API OAuth client ID'),
  ('GOOGLE_DRIVE_CLIENT_SECRET', 'Google Drive API OAuth client secret'),
  ('GOOGLE_DRIVE_REFRESH_TOKEN', 'Google Drive API refresh token for authentication'),
  ('GOOGLE_DRIVE_FOLDER_ID', 'Google Drive folder ID containing Scout Analytics data')
ON CONFLICT (key) DO UPDATE SET 
  purpose = excluded.purpose,
  created_at = now();

-- Create schema for ETL pipeline
CREATE SCHEMA IF NOT EXISTS etl;
GRANT USAGE ON SCHEMA etl TO service_role;

-- Create table to track ETL job runs
CREATE TABLE IF NOT EXISTS etl.job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on job runs for monitoring
CREATE INDEX IF NOT EXISTS idx_etl_job_runs_status_started 
ON etl.job_runs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_etl_job_runs_job_name_started 
ON etl.job_runs(job_name, started_at DESC);

-- Create table to track processed files (prevent duplicates)
CREATE TABLE IF NOT EXISTS etl.processed_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  modified_time TIMESTAMPTZ,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_run_id UUID REFERENCES etl.job_runs(id),
  records_extracted INTEGER DEFAULT 0,
  checksum TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create index on processed files
CREATE INDEX IF NOT EXISTS idx_etl_processed_files_file_id 
ON etl.processed_files(file_id);
CREATE INDEX IF NOT EXISTS idx_etl_processed_files_processed_at 
ON etl.processed_files(processed_at DESC);

-- Create bronze layer table for raw Google Drive data
CREATE TABLE IF NOT EXISTS bronze.gdrive_scout_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_run_id UUID REFERENCES etl.job_runs(id),
  
  -- Data lineage
  _source_file TEXT,
  _ingestion_timestamp TIMESTAMPTZ DEFAULT NOW(),
  _row_hash TEXT,
  
  -- Data quality flags
  _has_data_quality_issues BOOLEAN DEFAULT FALSE,
  _validation_errors JSONB DEFAULT '[]'
);

-- Create indices for bronze layer
CREATE INDEX IF NOT EXISTS idx_bronze_gdrive_file_id 
ON bronze.gdrive_scout_data(file_id);
CREATE INDEX IF NOT EXISTS idx_bronze_gdrive_extracted_at 
ON bronze.gdrive_scout_data(extracted_at DESC);
CREATE INDEX IF NOT EXISTS idx_bronze_gdrive_job_run 
ON bronze.gdrive_scout_data(job_run_id);

-- Create function to start ETL job run
CREATE OR REPLACE FUNCTION etl.start_job_run(
  p_job_name TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO etl.job_runs (job_name, status, metadata)
  VALUES (p_job_name, 'running', p_metadata)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END $$;

-- Create function to complete ETL job run
CREATE OR REPLACE FUNCTION etl.complete_job_run(
  p_job_id UUID,
  p_status TEXT,
  p_records_processed INTEGER DEFAULT 0,
  p_records_inserted INTEGER DEFAULT 0,
  p_records_updated INTEGER DEFAULT 0,
  p_records_failed INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE etl.job_runs 
  SET 
    status = p_status,
    completed_at = NOW(),
    records_processed = p_records_processed,
    records_inserted = p_records_inserted,
    records_updated = p_records_updated,
    records_failed = p_records_failed,
    error_message = p_error_message
  WHERE id = p_job_id;
END $$;

-- Create function to check if file was already processed
CREATE OR REPLACE FUNCTION etl.is_file_processed(
  p_file_id TEXT,
  p_modified_time TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM etl.processed_files 
    WHERE file_id = p_file_id 
    AND modified_time >= p_modified_time
  ) INTO v_exists;
  
  RETURN v_exists;
END $$;

-- Create function to record processed file
CREATE OR REPLACE FUNCTION etl.record_processed_file(
  p_file_id TEXT,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_modified_time TIMESTAMPTZ,
  p_job_run_id UUID,
  p_records_extracted INTEGER DEFAULT 0,
  p_checksum TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO etl.processed_files (
    file_id, file_name, file_size, modified_time, 
    job_run_id, records_extracted, checksum, metadata
  )
  VALUES (
    p_file_id, p_file_name, p_file_size, p_modified_time,
    p_job_run_id, p_records_extracted, p_checksum, p_metadata
  )
  ON CONFLICT (file_id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_size = EXCLUDED.file_size,
    modified_time = EXCLUDED.modified_time,
    processed_at = NOW(),
    job_run_id = EXCLUDED.job_run_id,
    records_extracted = EXCLUDED.records_extracted,
    checksum = EXCLUDED.checksum,
    metadata = EXCLUDED.metadata
  RETURNING id INTO v_id;
  
  RETURN v_id;
END $$;

-- Create monitoring view for ETL jobs
CREATE OR REPLACE VIEW etl.job_monitoring AS
SELECT 
  jr.id,
  jr.job_name,
  jr.status,
  jr.started_at,
  jr.completed_at,
  jr.completed_at - jr.started_at AS duration,
  jr.records_processed,
  jr.records_inserted,
  jr.records_updated,
  jr.records_failed,
  jr.error_message,
  
  -- Success rate calculation
  CASE 
    WHEN jr.records_processed > 0 THEN 
      ROUND(100.0 * (jr.records_inserted + jr.records_updated) / jr.records_processed, 2)
    ELSE 0 
  END AS success_rate_pct,
  
  -- Count of files processed in this job
  (SELECT COUNT(*) FROM etl.processed_files pf WHERE pf.job_run_id = jr.id) as files_processed,
  
  jr.metadata
FROM etl.job_runs jr
ORDER BY jr.started_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON etl.job_runs TO service_role;
GRANT SELECT, INSERT, UPDATE ON etl.processed_files TO service_role;
GRANT SELECT, INSERT ON bronze.gdrive_scout_data TO service_role;
GRANT SELECT ON etl.job_monitoring TO service_role;

-- Grant execute permissions on ETL functions
GRANT EXECUTE ON FUNCTION etl.start_job_run(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION etl.complete_job_run(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION etl.is_file_processed(TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION etl.record_processed_file(TEXT, TEXT, BIGINT, TIMESTAMPTZ, UUID, INTEGER, TEXT, JSONB) TO service_role;

-- Create alert function for ETL failures
CREATE OR REPLACE FUNCTION etl.alert_job_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only alert on failures
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Log the failure (could extend to send webhooks/notifications)
    RAISE NOTICE 'ETL Job Failed: % - %', NEW.job_name, NEW.error_message;
    
    -- Insert into a notifications table if one exists
    -- INSERT INTO notifications (type, title, message, metadata) 
    -- VALUES ('etl_failure', 'ETL Job Failed', format('Job %s failed: %s', NEW.job_name, NEW.error_message), 
    --         json_build_object('job_id', NEW.id, 'job_name', NEW.job_name));
  END IF;
  
  RETURN NEW;
END $$;

-- Create trigger for job failure alerts
DROP TRIGGER IF EXISTS tr_etl_job_failure_alert ON etl.job_runs;
CREATE TRIGGER tr_etl_job_failure_alert
  AFTER UPDATE ON etl.job_runs
  FOR EACH ROW
  EXECUTE FUNCTION etl.alert_job_failure();