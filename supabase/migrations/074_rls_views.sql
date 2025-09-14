-- Enable RLS for dashboard views and grant read access
alter view analytics.v_etl_last_24h set (security_invoker = true);

-- Grant read access to anon for dashboard consumption
grant select on analytics.v_etl_last_24h to anon;