-- Google Drive ETL Automation & Monitoring
-- Add scheduled job and monitoring for Google Drive ETL pipeline

-- Create function to trigger Google Drive ETL Edge Function
CREATE OR REPLACE FUNCTION etl.trigger_gdrive_etl()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response TEXT;
  v_status INTEGER;
  v_supabase_url TEXT;
  v_function_url TEXT;
BEGIN
  -- Get Supabase URL from environment or configuration
  -- Note: In production, this would come from environment variables
  v_supabase_url := current_setting('app.supabase_url', true);
  
  IF v_supabase_url IS NULL THEN
    -- Fallback to a known pattern or configuration table
    v_supabase_url := 'https://your-project-ref.supabase.co';
  END IF;
  
  v_function_url := v_supabase_url || '/functions/v1/gdrive-etl';
  
  BEGIN
    -- Use pg_net extension to call the Edge Function
    -- Note: This requires pg_net extension which should be enabled
    SELECT status_code, content INTO v_status, v_response
    FROM net.http_post(
      url := v_function_url,
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_key', true) || '"}',
      body := '{"triggered_by": "cron"}'
    );
    
    -- Log the result
    IF v_status = 200 OR v_status = 207 THEN
      RAISE NOTICE 'Google Drive ETL triggered successfully: %', v_response;
      RETURN 'SUCCESS: ' || v_response;
    ELSE
      RAISE WARNING 'Google Drive ETL returned status %: %', v_status, v_response;
      RETURN 'WARNING: Status ' || v_status || ': ' || v_response;
    END IF;
    
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Failed to trigger Google Drive ETL: %', SQLERRM;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END $$;

-- Create enhanced monitoring view for Google Drive ETL
CREATE OR REPLACE VIEW etl.gdrive_monitoring AS
SELECT 
  -- Job run details
  jr.id as job_run_id,
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
  
  -- Success metrics
  CASE 
    WHEN jr.records_processed > 0 THEN 
      ROUND(100.0 * (jr.records_inserted + jr.records_updated) / jr.records_processed, 2)
    ELSE 0 
  END AS success_rate_pct,
  
  -- File processing stats
  COUNT(pf.id) as files_processed,
  SUM(pf.records_extracted) as total_records_extracted,
  SUM(pf.file_size) as total_bytes_processed,
  
  -- Data freshness
  MAX(pf.processed_at) as last_file_processed_at,
  MIN(pf.processed_at) as first_file_processed_at,
  
  -- Quality indicators  
  jr.metadata,
  
  -- Health indicators
  CASE 
    WHEN jr.status = 'running' AND jr.started_at < NOW() - INTERVAL '2 hours' THEN 'STALE'
    WHEN jr.status = 'failed' THEN 'FAILED'
    WHEN jr.records_failed > 0 AND jr.records_failed::float / GREATEST(jr.records_processed, 1) > 0.1 THEN 'HIGH_ERROR_RATE'
    WHEN jr.status = 'completed' AND jr.records_inserted = 0 THEN 'NO_DATA'
    WHEN jr.status = 'completed' THEN 'HEALTHY'
    ELSE 'UNKNOWN'
  END as health_status
  
FROM etl.job_runs jr
LEFT JOIN etl.processed_files pf ON pf.job_run_id = jr.id
WHERE jr.job_name = 'google-drive-etl'
GROUP BY jr.id, jr.job_name, jr.status, jr.started_at, jr.completed_at, 
         jr.records_processed, jr.records_inserted, jr.records_updated, 
         jr.records_failed, jr.error_message, jr.metadata
ORDER BY jr.started_at DESC;

-- Create summary view for dashboard
CREATE OR REPLACE VIEW etl.gdrive_summary AS
WITH recent_jobs AS (
  SELECT * FROM etl.gdrive_monitoring 
  WHERE started_at >= NOW() - INTERVAL '7 days'
),
latest_job AS (
  SELECT * FROM etl.gdrive_monitoring 
  ORDER BY started_at DESC LIMIT 1
)
SELECT 
  -- Latest job info
  (SELECT status FROM latest_job) as last_status,
  (SELECT started_at FROM latest_job) as last_run_at,
  (SELECT duration FROM latest_job) as last_duration,
  (SELECT files_processed FROM latest_job) as last_files_processed,
  (SELECT records_inserted FROM latest_job) as last_records_inserted,
  (SELECT health_status FROM latest_job) as current_health,
  
  -- 7-day statistics
  COUNT(*) as runs_last_7_days,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_runs_7d,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs_7d,
  SUM(files_processed) as total_files_7d,
  SUM(records_inserted) as total_records_7d,
  AVG(success_rate_pct) as avg_success_rate_7d,
  
  -- Performance metrics
  AVG(EXTRACT(EPOCH FROM duration)) as avg_duration_seconds_7d,
  MAX(EXTRACT(EPOCH FROM duration)) as max_duration_seconds_7d,
  
  -- Data freshness
  MAX(last_file_processed_at) as most_recent_data_processed,
  NOW() - MAX(last_file_processed_at) as data_freshness_age
  
FROM recent_jobs;

-- Create function to get ETL health status
CREATE OR REPLACE FUNCTION etl.get_gdrive_health()
RETURNS TABLE(
  component TEXT,
  status TEXT,
  message TEXT,
  last_check TIMESTAMPTZ,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH health_checks AS (
    SELECT 
      'Google Drive ETL' as component,
      CASE 
        WHEN s.current_health = 'HEALTHY' THEN 'OK'
        WHEN s.current_health = 'STALE' THEN 'WARNING'
        WHEN s.current_health IN ('FAILED', 'HIGH_ERROR_RATE', 'NO_DATA') THEN 'CRITICAL'
        ELSE 'UNKNOWN'
      END as status,
      CASE 
        WHEN s.current_health = 'HEALTHY' THEN 'ETL pipeline running normally'
        WHEN s.current_health = 'STALE' THEN 'ETL job appears to be stuck'
        WHEN s.current_health = 'FAILED' THEN 'Last ETL run failed'
        WHEN s.current_health = 'HIGH_ERROR_RATE' THEN 'High error rate detected'
        WHEN s.current_health = 'NO_DATA' THEN 'No data processed in last run'
        ELSE 'Status unknown'
      END as message,
      COALESCE(s.last_run_at, '1970-01-01'::timestamptz) as last_check,
      jsonb_build_object(
        'last_status', s.last_status,
        'last_duration_minutes', EXTRACT(EPOCH FROM s.last_duration) / 60,
        'files_processed', s.last_files_processed,
        'records_inserted', s.last_records_inserted,
        'success_rate_7d', s.avg_success_rate_7d,
        'data_freshness_hours', EXTRACT(EPOCH FROM s.data_freshness_age) / 3600,
        'runs_last_7d', s.runs_last_7_days,
        'failed_runs_7d', s.failed_runs_7d
      ) as details
    FROM etl.gdrive_summary s
  )
  SELECT hc.* FROM health_checks hc;
END $$;

-- Schedule Google Drive ETL job to run every 4 hours
DO $schedule_gdrive$ 
BEGIN
  -- Schedule Google Drive ETL every 4 hours at 15 minutes past the hour
  BEGIN
    PERFORM cron.schedule(
      'gdrive_etl_4hourly',
      '15 */4 * * *',
      $$SELECT etl.trigger_gdrive_etl();$$
    );
    RAISE NOTICE 'Scheduled: gdrive_etl_4hourly (every 4 hours at :15)';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'Job gdrive_etl_4hourly already exists';
    WHEN others THEN
      RAISE NOTICE 'Failed to schedule gdrive_etl_4hourly: %', SQLERRM;
  END;

  -- Schedule daily cleanup of old ETL data (keep 30 days)
  BEGIN
    PERFORM cron.schedule(
      'gdrive_etl_cleanup',
      '30 2 * * *',
      $$
      -- Clean up old job runs (keep 30 days)
      DELETE FROM etl.job_runs 
      WHERE job_name = 'google-drive-etl' 
      AND started_at < NOW() - INTERVAL '30 days';
      
      -- Clean up old processed files records (keep 30 days)  
      DELETE FROM etl.processed_files 
      WHERE processed_at < NOW() - INTERVAL '30 days'
      AND job_run_id NOT IN (
        SELECT id FROM etl.job_runs 
        WHERE job_name = 'google-drive-etl'
      );
      
      -- Clean up old bronze data (keep 90 days)
      DELETE FROM bronze.gdrive_scout_data 
      WHERE extracted_at < NOW() - INTERVAL '90 days';
      
      RAISE NOTICE 'Google Drive ETL cleanup completed';
      $$
    );
    RAISE NOTICE 'Scheduled: gdrive_etl_cleanup (daily at 2:30 AM)';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'Job gdrive_etl_cleanup already exists';
    WHEN others THEN
      RAISE NOTICE 'Failed to schedule gdrive_etl_cleanup: %', SQLERRM;
  END;

  -- Schedule weekly health check and alerting
  BEGIN
    PERFORM cron.schedule(
      'gdrive_etl_health_check',
      '0 8 * * 1',
      $$
      DO $health$ 
      DECLARE
        health_record RECORD;
        alert_needed BOOLEAN := FALSE;
        alert_message TEXT := '';
      BEGIN
        -- Check ETL health
        FOR health_record IN 
          SELECT * FROM etl.get_gdrive_health()
        LOOP
          IF health_record.status IN ('WARNING', 'CRITICAL') THEN
            alert_needed := TRUE;
            alert_message := alert_message || 
              format('ALERT: %s is %s - %s. Details: %s', 
                health_record.component,
                health_record.status, 
                health_record.message,
                health_record.details::text
              ) || E'\n';
          END IF;
        END LOOP;
        
        -- Log health status
        IF alert_needed THEN
          RAISE WARNING 'Google Drive ETL Health Issues Detected: %', alert_message;
          -- Here you could extend to send actual alerts (webhook, email, etc.)
        ELSE  
          RAISE NOTICE 'Google Drive ETL health check passed - all systems normal';
        END IF;
      END $health$;
      $$
    );
    RAISE NOTICE 'Scheduled: gdrive_etl_health_check (weekly on Monday 8 AM)';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'Job gdrive_etl_health_check already exists';
    WHEN others THEN
      RAISE NOTICE 'Failed to schedule gdrive_etl_health_check: %', SQLERRM;
  END;
  
END $schedule_gdrive$;

-- Grant permissions for monitoring views and functions
GRANT SELECT ON etl.gdrive_monitoring TO service_role;
GRANT SELECT ON etl.gdrive_summary TO service_role;
GRANT EXECUTE ON FUNCTION etl.trigger_gdrive_etl() TO service_role;
GRANT EXECUTE ON FUNCTION etl.get_gdrive_health() TO service_role;

-- Create indexes for better monitoring performance
CREATE INDEX IF NOT EXISTS idx_job_runs_gdrive_etl 
ON etl.job_runs(job_name, started_at DESC) 
WHERE job_name = 'google-drive-etl';

CREATE INDEX IF NOT EXISTS idx_gdrive_bronze_extracted_at 
ON bronze.gdrive_scout_data(extracted_at DESC);

-- Add configuration table for ETL settings
CREATE TABLE IF NOT EXISTS etl.configuration (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT DEFAULT CURRENT_USER
);

-- Insert default configuration
INSERT INTO etl.configuration (key, value, description) VALUES
  (
    'gdrive_etl_settings', 
    '{
      "batch_size": 100,
      "timeout_minutes": 120,
      "retry_attempts": 3,
      "file_size_limit_mb": 50,
      "max_files_per_run": 1000,
      "health_check_thresholds": {
        "max_duration_hours": 2,
        "max_error_rate_pct": 10,
        "data_freshness_hours": 6
      }
    }',
    'Configuration settings for Google Drive ETL pipeline'
  )
ON CONFLICT (key) DO UPDATE SET
  updated_at = NOW(),
  updated_by = CURRENT_USER;

-- Grant permissions on configuration
GRANT SELECT, UPDATE ON etl.configuration TO service_role;