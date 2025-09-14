-- Post-deploy hardening script
-- Ensure wrappers are locked to service_role only
DO $harden$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='install_platinum_layer_rpc') THEN
    REVOKE ALL ON FUNCTION public.install_platinum_layer_rpc(JSONB) FROM public, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.install_platinum_layer_rpc(JSONB) TO service_role;
    RAISE NOTICE 'Hardened install_platinum_layer_rpc function';
  END IF;
END $harden$;

-- Enable RLS for Platinum tables
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_insights ENABLE ROW LEVEL SECURITY; 
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

SELECT 'Hardening completed successfully!' AS status;