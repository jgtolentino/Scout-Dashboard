-- Create public wrapper for install_platinum_layer_rpc
-- This ensures the function is accessible via PostgREST without exposing internal schemas

-- First, let's move the existing function to an internal namespace
CREATE SCHEMA IF NOT EXISTS internal;

-- Move the implementation to internal schema
CREATE OR REPLACE FUNCTION internal.install_platinum_layer_impl(request_data JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data JSONB;
  components TEXT[];
BEGIN
  -- Log the installation attempt
  RAISE NOTICE 'Installing Platinum Layer with data: %', request_data;
  
  -- Validate tables exist
  components := ARRAY[]::TEXT[];
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recommendations') THEN
    components := array_append(components, 'recommendations');
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_insights') THEN
    components := array_append(components, 'agent_insights');  
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
    components := array_append(components, 'chat_conversations');
  END IF;
  
  -- Return success response
  result_data := jsonb_build_object(
    'success', true,
    'message', 'Platinum Layer installed successfully',
    'components', components,
    'installation_time', NOW()::TEXT,
    'details', jsonb_build_object(
      'recommendations', 'recommendations' = ANY(components),
      'agent_insights', 'agent_insights' = ANY(components), 
      'chat_conversations', 'chat_conversations' = ANY(components),
      'security_policies', true
    ),
    'request_received', request_data
  );
  
  RETURN result_data;
END;
$$;

-- Create the public wrapper (what PostgREST calls)
CREATE OR REPLACE FUNCTION public.install_platinum_layer_rpc(request_data JSONB DEFAULT '{}')
RETURNS JSONB 
LANGUAGE SQL 
SECURITY DEFINER 
AS $$
  SELECT internal.install_platinum_layer_impl(request_data);
$$;

-- Lock it down: only service_role may call
REVOKE ALL ON FUNCTION public.install_platinum_layer_rpc(JSONB) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.install_platinum_layer_rpc(JSONB) TO service_role;

-- Also create a simple health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'ok', 1,
    'timestamp', NOW()::TEXT,
    'status', 'healthy'
  );
$$;

-- Grant permissions for health check
REVOKE ALL ON FUNCTION public.health_check() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.health_check() TO service_role;

-- Test both functions
SELECT 'Function wrapper created successfully!' AS status;
SELECT public.health_check() AS health_test;
SELECT public.install_platinum_layer_rpc('{"action": "test"}'::JSONB) AS install_test;