-- Create a secure function to execute ad-hoc queries
-- This function provides a controlled way to run dynamic SQL with safety checks

CREATE OR REPLACE FUNCTION execute_adhoc_query(query_sql text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, scout
AS $$
DECLARE
    rec record;
    result_array jsonb := '[]'::jsonb;
    row_json jsonb;
    query_upper text;
    execution_start timestamp;
    execution_time interval;
BEGIN
    -- Log the start time
    execution_start := clock_timestamp();
    
    -- Convert to uppercase for checking
    query_upper := upper(trim(query_sql));
    
    -- Security checks
    IF query_upper NOT LIKE 'SELECT%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    IF query_upper LIKE '%INFORMATION_SCHEMA%' OR 
       query_upper LIKE '%PG_%' OR
       query_upper LIKE '%CURRENT_USER%' OR
       query_upper LIKE '%SESSION_USER%' THEN
        RAISE EXCEPTION 'Access to system catalogs is not allowed';
    END IF;
    
    -- Check for multiple statements (basic protection)
    IF position(';' in rtrim(query_sql, ' ;')) > 0 THEN
        RAISE EXCEPTION 'Multiple statements are not allowed';
    END IF;
    
    -- Add row limit if not present
    IF query_upper NOT LIKE '%LIMIT%' THEN
        query_sql := query_sql || ' LIMIT 1000';
    END IF;
    
    -- Execute the query and build JSON array
    FOR rec IN EXECUTE query_sql
    LOOP
        -- Convert record to JSON
        SELECT to_jsonb(rec.*) INTO row_json;
        
        -- Add to result array
        result_array := result_array || row_json;
        
        -- Safety check - limit result size
        IF jsonb_array_length(result_array) >= 1000 THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Calculate execution time
    execution_time := clock_timestamp() - execution_start;
    
    -- Log query execution (optional - remove in production if not needed)
    INSERT INTO scout.query_log (
        query_sql, 
        row_count, 
        execution_time_ms,
        executed_by,
        executed_at
    ) VALUES (
        query_sql,
        jsonb_array_length(result_array),
        EXTRACT(epoch FROM execution_time) * 1000,
        auth.uid(),
        execution_start
    );
    
    -- Return the JSON array as a single-column table
    RETURN QUERY SELECT result_array;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO scout.query_log (
            query_sql, 
            error_message,
            executed_by,
            executed_at
        ) VALUES (
            query_sql,
            SQLERRM,
            auth.uid(),
            execution_start
        );
        
        -- Re-raise the exception
        RAISE;
END;
$$;

-- Create query log table for monitoring and debugging
CREATE TABLE IF NOT EXISTS scout.query_log (
    id BIGSERIAL PRIMARY KEY,
    query_sql TEXT NOT NULL,
    row_count INTEGER,
    execution_time_ms NUMERIC,
    error_message TEXT,
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_query_log_executed_at 
    ON scout.query_log (executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_log_executed_by 
    ON scout.query_log (executed_by, executed_at DESC);

-- Enable RLS on query log
ALTER TABLE scout.query_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own query logs
CREATE POLICY "Users can view their own query logs" 
    ON scout.query_log 
    FOR SELECT 
    USING (auth.uid() = executed_by);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION execute_adhoc_query(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_adhoc_query(text) TO anon;

-- Grant permissions on query log table
GRANT SELECT ON scout.query_log TO authenticated;
GRANT INSERT ON scout.query_log TO authenticated;

-- Create a view for query statistics (for admins)
CREATE OR REPLACE VIEW scout.vw_query_stats AS
SELECT 
    DATE(executed_at) as query_date,
    executed_by,
    COUNT(*) as query_count,
    AVG(execution_time_ms) as avg_execution_time_ms,
    MAX(execution_time_ms) as max_execution_time_ms,
    SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) as error_count,
    AVG(row_count) as avg_row_count,
    MAX(row_count) as max_row_count
FROM scout.query_log
WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

-- Create function to clean old query logs (run monthly)
CREATE OR REPLACE FUNCTION scout.cleanup_query_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete logs older than 90 days
    DELETE FROM scout.query_log 
    WHERE executed_at < CURRENT_DATE - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION scout.cleanup_query_logs() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION execute_adhoc_query(text) IS 'Secure function to execute ad-hoc SELECT queries with safety checks and logging';
COMMENT ON TABLE scout.query_log IS 'Log of all ad-hoc queries executed through the dashboard';
COMMENT ON VIEW scout.vw_query_stats IS 'Daily statistics for ad-hoc query usage and performance';
COMMENT ON FUNCTION scout.cleanup_query_logs() IS 'Maintenance function to remove old query logs (run monthly)';