-- Enable observability extensions
create extension if not exists pg_stat_statements;
create extension if not exists pg_net;

-- Observability schema
create schema if not exists obs;
grant usage on schema obs to service_role;

-- Top slowest queries view
create or replace view obs.slow_queries as
select 
  queryid,
  calls,
  round(total_exec_time::numeric, 2) as total_exec_time_ms,
  round(mean_exec_time::numeric, 2) as mean_exec_time_ms,
  round(max_exec_time::numeric, 2) as max_exec_time_ms,
  rows,
  round(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0), 1) as hit_percent,
  left(query, 100) as query_preview
from pg_stat_statements
where total_exec_time > 0
order by mean_exec_time desc
limit 50;

-- Alert function for slow queries
create or replace function obs.alert_slow_queries(threshold_ms numeric default 200)
returns void 
language plpgsql 
security definer 
as $$
declare
  slow_queries jsonb;
  webhook_url text;
begin
  -- Get slow queries above threshold
  select jsonb_agg(
    jsonb_build_object(
      'query_id', queryid,
      'avg_time_ms', round(mean_exec_time::numeric, 2),
      'calls', calls,
      'query', left(query, 200)
    )
  ) into slow_queries
  from obs.slow_queries 
  where mean_exec_time_ms > threshold_ms
  limit 10;
  
  if slow_queries is null or jsonb_array_length(slow_queries) = 0 then
    return;
  end if;
  
  -- Get Slack webhook from vault
  begin
    webhook_url := internal.vault_get_secret('SLACK_WEBHOOK');
  exception when others then
    raise notice 'Cannot send alert - Slack webhook not configured';
    return;
  end;
  
  -- Send alert to Slack
  perform net.http_post(
    url := webhook_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'text', format('🐌 %s slow queries detected (>%sms)', jsonb_array_length(slow_queries), threshold_ms),
      'blocks', jsonb_build_array(
        jsonb_build_object(
          'type', 'section',
          'text', jsonb_build_object(
            'type', 'mrkdwn',
            'text', format('```json\n%s\n```', slow_queries::text)
          )
        )
      )
    )::jsonb
  );
  
  raise notice 'Sent slow query alert for % queries', jsonb_array_length(slow_queries);
end $$;

-- Database size monitoring
create or replace view obs.database_size as
select 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
from pg_tables
where schemaname in ('analytics', 'analytics_snap', 'ai', 'ref', 'stage')
order by pg_total_relation_size(schemaname||'.'||tablename) desc;

-- Connection monitoring
create or replace view obs.active_connections as
select 
  usename,
  datname,
  client_addr,
  state,
  count(*) as connection_count,
  max(now() - query_start) as longest_query_duration,
  max(now() - state_change) as longest_state_duration
from pg_stat_activity
where state is not null
group by usename, datname, client_addr, state
order by connection_count desc;

-- Function to check system health
create or replace function obs.system_health_check()
returns table(
  check_name text,
  status text,
  value text,
  threshold text,
  description text
)
language plpgsql
security definer
as $$
begin
  -- Connection count check
  return query
  select 
    'active_connections'::text,
    case when count(*) > 50 then 'warning' when count(*) > 100 then 'critical' else 'ok' end,
    count(*)::text,
    '50/100'::text,
    'Number of active database connections'::text
  from pg_stat_activity
  where state = 'active';
  
  -- Slow query check
  return query
  select 
    'slow_queries'::text,
    case when count(*) > 10 then 'warning' when count(*) > 20 then 'critical' else 'ok' end,
    count(*)::text,
    '10/20'::text,
    'Number of queries with mean execution time > 200ms'::text
  from obs.slow_queries
  where mean_exec_time_ms > 200;
  
  -- Database size check (analytics tables)
  return query
  select 
    'database_size'::text,
    case when sum(size_bytes) > 10737418240 then 'warning' else 'ok' end, -- 10GB
    pg_size_pretty(sum(size_bytes)),
    '10GB'::text,
    'Total size of analytics tables'::text
  from obs.database_size;
  
  -- Queue depth check (if queues exist)
  if exists (select 1 from pg_extension where extname = 'pgmq') then
    return query
    select 
      'queue_depth'::text,
      case when coalesce(max(queue_length), 0) > 1000 then 'warning' else 'ok' end,
      coalesce(max(queue_length), 0)::text,
      '1000'::text,
      'Maximum queue depth across all queues'::text
    from queues.queue_stats;
  end if;
end $$;

-- Schedule observability jobs
do $obs$ 
begin
  -- Hourly slow query alerts
  begin
    perform cron.schedule(
      'obs_slow_queries',
      '0 * * * *',
      $$select obs.alert_slow_queries(200);$$
    );
    raise notice 'Scheduled: obs_slow_queries';
  exception 
    when duplicate_object then
      raise notice 'Job obs_slow_queries already exists';
    when others then
      raise notice 'Failed to schedule obs_slow_queries: %', SQLERRM;
  end;
  
  -- Daily system health check
  begin
    perform cron.schedule(
      'obs_health_check',
      '0 9 * * *', -- 9 AM UTC (5 PM PHT)
      $$select obs.system_health_check();$$
    );
    raise notice 'Scheduled: obs_health_check';
  exception 
    when duplicate_object then
      raise notice 'Job obs_health_check already exists';
    when others then
      raise notice 'Failed to schedule obs_health_check: %', SQLERRM;
  end;
end $obs$;

-- Grant permissions
grant select on obs.slow_queries to service_role;
grant select on obs.database_size to service_role;
grant select on obs.active_connections to service_role;
grant execute on function obs.alert_slow_queries(numeric) to service_role;
grant execute on function obs.system_health_check() to service_role;