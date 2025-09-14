-- Enable pg_cron for database-native scheduling
create extension if not exists pg_cron;

-- Grant cron access to service role for job management
grant usage on schema cron to service_role;
grant all privileges on all tables in schema cron to service_role;

-- Helper function to safely refresh materialized views
create or replace function internal.refresh_materialized_views()
returns table(view_name text, refreshed boolean, error_message text)
language plpgsql
security definer
as $$
declare
  mv_record record;
  success_count integer := 0;
  error_count integer := 0;
begin
  -- Get all materialized views in analytics schema
  for mv_record in 
    select schemaname, matviewname 
    from pg_matviews 
    where schemaname = 'analytics'
  loop
    begin
      execute format('REFRESH MATERIALIZED VIEW %I.%I', mv_record.schemaname, mv_record.matviewname);
      
      view_name := mv_record.schemaname || '.' || mv_record.matviewname;
      refreshed := true;
      error_message := null;
      success_count := success_count + 1;
      
      return next;
      
    exception when others then
      view_name := mv_record.schemaname || '.' || mv_record.matviewname;
      refreshed := false;
      error_message := SQLERRM;
      error_count := error_count + 1;
      
      -- Log error but continue with other views
      raise notice 'Failed to refresh materialized view %: %', view_name, SQLERRM;
      
      return next;
    end;
  end loop;
  
  -- Summary log
  raise notice 'Materialized view refresh complete: % success, % errors', success_count, error_count;
end $$;

-- Helper function for TTL cleanup with safety limits
create or replace function internal.cleanup_expired_data()
returns table(table_name text, deleted_count bigint, error_message text)
language plpgsql
security definer
as $$
declare
  cleanup_record record;
  deleted_rows bigint;
begin
  -- Cleanup analytics_snap.kpi_hourly (keep 90 days)
  begin
    delete from analytics_snap.kpi_hourly 
    where snapshot_ts < now() - interval '90 days';
    
    get diagnostics deleted_rows = row_count;
    
    table_name := 'analytics_snap.kpi_hourly';
    deleted_count := deleted_rows;
    error_message := null;
    
    return next;
    
  exception when others then
    table_name := 'analytics_snap.kpi_hourly';
    deleted_count := 0;
    error_message := SQLERRM;
    
    raise notice 'TTL cleanup failed for analytics_snap.kpi_hourly: %', SQLERRM;
    
    return next;
  end;
  
  -- Add more TTL cleanups here as needed
  -- Example: chat_conversations older than 1 year
  begin
    delete from analytics.chat_conversations 
    where created_at < now() - interval '1 year'
    and id in (
      select id from analytics.chat_conversations 
      where created_at < now() - interval '1 year'
      limit 1000  -- Safety limit to prevent massive deletions
    );
    
    get diagnostics deleted_rows = row_count;
    
    table_name := 'analytics.chat_conversations';
    deleted_count := deleted_rows;
    error_message := null;
    
    return next;
    
  exception when others then
    table_name := 'analytics.chat_conversations';
    deleted_count := 0;
    error_message := SQLERRM;
    
    raise notice 'TTL cleanup failed for analytics.chat_conversations: %', SQLERRM;
    
    return next;
  end;
end $$;

-- Schedule jobs (with error handling for existing jobs)
do $schedule$ 
begin
  -- Nightly materialized view refresh at 18:00 UTC (2 AM PHT)
  begin
    perform cron.schedule(
      'mv_refresh_nightly',
      '0 18 * * *',
      $$select internal.refresh_materialized_views();$$
    );
    raise notice 'Scheduled: mv_refresh_nightly';
  exception 
    when duplicate_object then
      raise notice 'Job mv_refresh_nightly already exists';
    when others then
      raise notice 'Failed to schedule mv_refresh_nightly: %', SQLERRM;
  end;

  -- Hourly TTL cleanup at 15 minutes past each hour
  begin
    perform cron.schedule(
      'ttl_cleanup_hourly',
      '15 * * * *',
      $$select internal.cleanup_expired_data();$$
    );
    raise notice 'Scheduled: ttl_cleanup_hourly';
  exception 
    when duplicate_object then
      raise notice 'Job ttl_cleanup_hourly already exists';
    when others then
      raise notice 'Failed to schedule ttl_cleanup_hourly: %', SQLERRM;
  end;

  -- Weekly maintenance at Sunday 3 AM UTC (11 AM PHT)
  begin
    perform cron.schedule(
      'weekly_maintenance',
      '0 3 * * 0',
      $$
      -- Vacuum and analyze key tables
      VACUUM ANALYZE analytics.recommendations;
      VACUUM ANALYZE analytics.agent_insights;
      VACUUM ANALYZE analytics.chat_conversations;
      VACUUM ANALYZE analytics_snap.kpi_hourly;
      
      -- Update table statistics
      ANALYZE;
      $$
    );
    raise notice 'Scheduled: weekly_maintenance';
  exception 
    when duplicate_object then
      raise notice 'Job weekly_maintenance already exists';
    when others then
      raise notice 'Failed to schedule weekly_maintenance: %', SQLERRM;
  end;
  
end $schedule$;

-- Create a view to monitor cron jobs
create or replace view internal.cron_jobs as
select 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
from cron.job
order by jobname;

-- Grant access to monitor cron jobs
grant select on internal.cron_jobs to service_role;