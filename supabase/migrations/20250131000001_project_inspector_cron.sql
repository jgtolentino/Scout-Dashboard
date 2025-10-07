-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a table to log project inspector results
CREATE TABLE IF NOT EXISTS public.scout_project_inspector_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT,
    result JSONB,
    error TEXT,
    metadata JSONB
);

-- Create a function to_scout invoke the project-inspecto_scoutr Edge Function
CREATE OR REPLACE FUNCTION public.invoke_project_inspector_scout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_status TEXT;
    v_error TEXT;
BEGIN
    -- Use pg_net to call the Edge Function
    -- Note: You'll need to replace the URL with your actual project URL
    BEGIN
        -- This is a placeholder - actual implementation would use pg_net or similar
        -- to make HTTP request to your Edge Function
        v_status := 'scheduled';
        v_result := jsonb_build_object(
            'message', 'Project inspector scheduled via cron',
            'timestamp', NOW()
        );
        
        -- Log the execution
        INSERT INTO public.project_inspector_logs (status, result, metadata)
        VALUES (v_status, v_result, jsonb_build_object(
            'trigger', 'cron',
            'schedule', 'hourly'
        ));
        
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        INSERT INTO public.project_inspector_logs (status, error, metadata)
        VALUES ('error', v_error, jsonb_build_object(
            'trigger', 'cron',
            'schedule', 'hourly'
        ));
    END;
END;
$$;

-- Schedule the project inspector to run every hour
SELECT cron.schedule(
    'project_inspector_hourly',           -- job name
    '0 * * * *',                         -- every hour at minute 0
    'SELECT public.invoke_project_inspector();'
);

-- Schedule a more frequent run during business hours (every 15 minutes, 9am-6pm weekdays)
SELECT cron.schedule(
    'project_inspector_business_hours',   -- job name
    '*/15 9-18 * * 1-5',                 -- every 15 min, 9am-6pm, Mon-Fri
    'SELECT public.invoke_project_inspector();'
);

-- Create a function to_scout manually trigger project inspecto_scoutr
CREATE OR REPLACE FUNCTION public.trigger_project_inspector_scout()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM public.invoke_project_inspector();
    RETURN 'Project inspector triggered successfully';
END;
$$;

-- Create RLS policies for the logs table
ALTER TABLE public.project_inspector_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read logs
CREATE POLICY "Allow authenticated users to read project inspector logs"
ON public.project_inspector_logs
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert logs
CREATE POLICY "Only service role can insert project inspector logs"
ON public.project_inspector_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.project_inspector_logs IS 'Logs for project inspector Edge Function executions';
COMMENT ON FUNCTION public.invoke_project_inspector() IS 'Invokes the project-inspector Edge Function via cron';
COMMENT ON FUNCTION public.trigger_project_inspector() IS 'Manually trigger the project inspector';

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('project_inspector_hourly');
-- SELECT cron.unschedule('project_inspector_business_hours');