-- Move ZIP upload subsystem from scout_dash -> scout
-- Migration: 20250823135302_move_zip_upload_to_scout.sql

CREATE SCHEMA IF NOT EXISTS scout;

-- Move tables from scout_dash to scout (if they exist)
DO $$
BEGIN
    -- Move file_processing_logs first (has FK dependency)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout_dash' AND table_name = 'file_processing_logs') THEN
        ALTER TABLE scout_dash.file_processing_logs SET SCHEMA scout;
    END IF;
    
    -- Move file_uploads table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout_dash' AND table_name = 'file_uploads') THEN
        ALTER TABLE scout_dash.file_uploads SET SCHEMA scout;
    END IF;
END $$;

-- Move functions to scout schema
DO $$
BEGIN
    -- Move handle_updated_at function
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'scout_dash' AND routine_name = 'handle_updated_at') THEN
        ALTER FUNCTION scout_dash.handle_updated_at() SET SCHEMA scout;
    END IF;
    
    -- Move update_upload_status function  
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'scout_dash' AND routine_name = 'update_upload_status') THEN
        ALTER FUNCTION scout_dash.update_upload_status(uuid,text,text) SET SCHEMA scout;
    END IF;
    
    -- Move check_duplicate_file function
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'scout_dash' AND routine_name = 'check_duplicate_file') THEN
        ALTER FUNCTION scout_dash.check_duplicate_file(uuid,text) SET SCHEMA scout;
    END IF;
    
    -- Move get_upload_history function
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'scout_dash' AND routine_name = 'get_upload_history') THEN
        ALTER FUNCTION scout_dash.get_upload_history(uuid,int) SET SCHEMA scout;
    END IF;
END $$;

-- Move views to scout schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'scout_dash' AND table_name = 'import_statistics') THEN
        ALTER VIEW scout_dash.import_statistics SET SCHEMA scout;
    END IF;
END $$;

-- Recreate trigger in correct schema (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout' AND table_name = 'file_uploads') THEN
        -- Drop old trigger if exists
        DROP TRIGGER IF EXISTS trigger_file_uploads_updated_at ON scout.file_uploads;
        
        -- Create new trigger
        CREATE TRIGGER trigger_file_uploads_updated_at
            BEFORE UPDATE ON scout.file_uploads
            FOR EACH ROW EXECUTE FUNCTION scout.handle_updated_at();
    END IF;
END $$;

-- Clean up old schema if empty
DO $$
BEGIN
    -- Check if scout_dash schema has any remaining objects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout_dash'
        UNION
        SELECT 1 FROM information_schema.views WHERE table_schema = 'scout_dash'
        UNION 
        SELECT 1 FROM information_schema.routines WHERE routine_schema = 'scout_dash'
    ) THEN
        DROP SCHEMA IF EXISTS scout_dash CASCADE;
    END IF;
END $$;

-- Tighten privileges (no broad GRANT ALL)
-- Revoke all existing permissions first
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout' AND table_name = 'file_uploads') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA scout FROM anon, authenticated;
        
        -- Enable RLS
        ALTER TABLE scout.file_uploads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE scout.file_processing_logs ENABLE ROW LEVEL SECURITY;
        
        -- Minimal grants; RLS restricts row visibility
        GRANT USAGE ON SCHEMA scout TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON scout.file_uploads TO authenticated;
        GRANT SELECT, INSERT ON scout.file_processing_logs TO authenticated;
        
        -- Function execution permissions
        GRANT EXECUTE ON FUNCTION scout.update_upload_status(uuid,text,text) TO authenticated;
        GRANT EXECUTE ON FUNCTION scout.check_duplicate_file(uuid,text) TO authenticated;
        GRANT EXECUTE ON FUNCTION scout.get_upload_history(uuid,int) TO authenticated;
        
        -- Grant sequence permissions for ID generation
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA scout TO authenticated;
    END IF;
END $$;

-- Update RLS policies to use correct schema references
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout' AND table_name = 'file_uploads') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own uploads" ON scout.file_uploads;
        DROP POLICY IF EXISTS "Users can insert own uploads" ON scout.file_uploads;  
        DROP POLICY IF EXISTS "Users can update own uploads" ON scout.file_uploads;
        DROP POLICY IF EXISTS "Users can delete own uploads" ON scout.file_uploads;
        DROP POLICY IF EXISTS "Users can view own processing logs" ON scout.file_processing_logs;
        DROP POLICY IF EXISTS "Service can insert processing logs" ON scout.file_processing_logs;
        
        -- Recreate RLS policies
        CREATE POLICY "Users can view own uploads" ON scout.file_uploads
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert own uploads" ON scout.file_uploads
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update own uploads" ON scout.file_uploads
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete own uploads" ON scout.file_uploads
            FOR DELETE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can view own processing logs" ON scout.file_processing_logs
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM scout.file_uploads 
                    WHERE id = file_processing_logs.upload_id 
                    AND user_id = auth.uid()
                )
            );
            
        CREATE POLICY "Service can insert processing logs" ON scout.file_processing_logs
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Update comments for documentation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'scout' AND table_name = 'file_uploads') THEN
        COMMENT ON TABLE scout.file_uploads IS 'Tracks ZIP file uploads and their processing status';
        COMMENT ON TABLE scout.file_processing_logs IS 'Detailed logs for each file processed within uploaded ZIPs';
        COMMENT ON VIEW scout.import_statistics IS 'Aggregate statistics for user upload history';
        COMMENT ON FUNCTION scout.check_duplicate_file IS 'Prevents duplicate file uploads based on hash';
        COMMENT ON FUNCTION scout.update_upload_status IS 'Updates upload status and metadata';
        COMMENT ON FUNCTION scout.get_upload_history IS 'Returns paginated upload history for a user';
    END IF;
END $$;