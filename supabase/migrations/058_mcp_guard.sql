-- MCP Guard - MindsDB access control and monitoring
create schema if not exists mcp;
grant usage on schema mcp to service_role;

-- Allowlist for MindsDB roles and their permitted schemas
create table if not exists mcp.schema_allowlist (
  role_name text primary key,
  allowed_schemas text[] not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert role permissions
insert into mcp.schema_allowlist (role_name, allowed_schemas, description) values
  ('mindsdb_desktop_ro', ARRAY['api', 'analytics'], 'Desktop analysis - most restrictive access'),
  ('mindsdb_code_ro', ARRAY['api', 'analytics', 'ref', 'features'], 'Code orchestration - broader read access'),
  ('mindsdb_code_ingest', ARRAY['analytics_snap'], 'Write-only access to snapshot tables')
on conflict (role_name) do update set
  allowed_schemas = excluded.allowed_schemas,
  description = excluded.description,
  updated_at = now();

-- Function to audit schema access violations
create or replace function mcp.audit_schema_violations()
returns table(
  violation_time timestamptz,
  username text,
  attempted_schema text,
  query_preview text,
  violation_type text
)
language plpgsql
security definer
as $$
declare
  violation_record record;
begin
  -- Check active queries from MindsDB roles
  for violation_record in
    select 
      now() as check_time,
      a.usename,
      a.query,
      a.state,
      a.query_start
    from pg_stat_activity a
    where a.usename in ('mindsdb_desktop_ro', 'mindsdb_code_ro', 'mindsdb_code_ingest')
      and a.state = 'active'
      and a.query is not null
      and length(a.query) > 10
  loop
    -- Extract schema references from query using regex
    -- Look for schema.table patterns
    declare
      schema_matches text[];
      schema_name text;
      allowed_schemas text[];
    begin
      -- Get allowed schemas for this role
      select al.allowed_schemas into allowed_schemas
      from mcp.schema_allowlist al 
      where al.role_name = violation_record.usename;
      
      if allowed_schemas is null then
        -- Role not in allowlist is itself a violation
        violation_time := violation_record.check_time;
        username := violation_record.usename;
        attempted_schema := 'unknown';
        query_preview := left(violation_record.query, 200);
        violation_type := 'role_not_in_allowlist';
        return next;
        continue;
      end if;
      
      -- Extract schema names from query (simplified regex approach)
      select array_agg(distinct matches[1]) into schema_matches
      from (
        select regexp_matches(violation_record.query, '\b([a-zA-Z_][a-zA-Z0-9_]*)\.[a-zA-Z_]', 'g') as matches
      ) m
      where matches[1] not in ('pg_catalog', 'information_schema', 'pgmq'); -- Ignore system schemas
      
      -- Check each schema against allowlist
      if schema_matches is not null then
        foreach schema_name in array schema_matches
        loop
          if not (schema_name = any(allowed_schemas)) then
            violation_time := violation_record.check_time;
            username := violation_record.usename;
            attempted_schema := schema_name;
            query_preview := left(violation_record.query, 200);
            violation_type := 'unauthorized_schema_access';
            return next;
          end if;
        end loop;
      end if;
    end;
  end loop;
end $$;

-- Function to send violation alerts
create or replace function mcp.alert_violations()
returns void 
language plpgsql 
security definer 
as $$
declare
  violations jsonb;
  webhook_url text;
  violation_count integer;
begin
  -- Get current violations
  select jsonb_agg(
    jsonb_build_object(
      'time', v.violation_time,
      'user', v.username,
      'schema', v.attempted_schema,
      'type', v.violation_type,
      'query', v.query_preview
    )
  ), count(*)
  into violations, violation_count
  from mcp.audit_schema_violations() v;
  
  if violation_count = 0 then
    return;
  end if;
  
  -- Get Slack webhook from vault  
  begin
    webhook_url := internal.vault_get_secret('SLACK_WEBHOOK');
  exception when others then
    raise notice 'Cannot send MCP violation alert - Slack webhook not configured';
    return;
  end;
  
  -- Send alert to Slack
  perform net.http_post(
    url := webhook_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'text', format('🚨 %s MindsDB access violations detected', violation_count),
      'blocks', jsonb_build_array(
        jsonb_build_object(
          'type', 'section',
          'text', jsonb_build_object(
            'type', 'mrkdwn',
            'text', format('MindsDB roles attempted unauthorized schema access:\\n```json\\n%s\\n```', violations::text)
          )
        ),
        jsonb_build_object(
          'type', 'context',
          'elements', jsonb_build_array(
            jsonb_build_object(
              'type', 'mrkdwn',
              'text', format('Checked at %s • %s violations found', now()::text, violation_count)
            )
          )
        )
      )
    )::jsonb
  );
  
  raise notice 'Sent MCP violation alert for % violations', violation_count;
  
  -- Log violations for audit trail
  insert into mcp.violation_log (username, attempted_schema, violation_type, query_preview, detected_at)
  select v.username, v.attempted_schema, v.violation_type, v.query_preview, v.violation_time
  from mcp.audit_schema_violations() v;
  
exception when others then
  raise notice 'Error in MCP violation alerting: %', SQLERRM;
end $$;

-- Violation log table for audit trail
create table if not exists mcp.violation_log (
  id bigserial primary key,
  username text not null,
  attempted_schema text not null,
  violation_type text not null,
  query_preview text,
  detected_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Function to get MCP role status
create or replace function mcp.get_role_status()
returns table(
  role_name text,
  allowed_schemas text[],
  is_active boolean,
  last_seen timestamptz,
  connection_count bigint
)
language sql
security definer
as $$
select 
  al.role_name,
  al.allowed_schemas,
  exists(select 1 from pg_stat_activity where usename = al.role_name) as is_active,
  (select max(state_change) from pg_stat_activity where usename = al.role_name) as last_seen,
  (select count(*) from pg_stat_activity where usename = al.role_name) as connection_count
from mcp.schema_allowlist al
order by al.role_name;
$$;

-- View for monitoring MCP activity
create or replace view mcp.activity_summary as
select 
  usename as role_name,
  state,
  count(*) as session_count,
  max(now() - query_start) as longest_query_duration,
  max(now() - state_change) as longest_state_duration,
  array_agg(distinct client_addr::text) filter (where client_addr is not null) as client_addresses
from pg_stat_activity
where usename in (select role_name from mcp.schema_allowlist)
group by usename, state
order by usename, state;

-- Schedule MCP monitoring jobs
do $mcp$ 
begin
  -- Every 5 minutes - check for violations
  begin
    perform cron.schedule(
      'mcp_violation_check',
      '*/5 * * * *',
      $$select mcp.alert_violations();$$
    );
    raise notice 'Scheduled: mcp_violation_check';
  exception 
    when duplicate_object then
      raise notice 'Job mcp_violation_check already exists';
    when others then
      raise notice 'Failed to schedule mcp_violation_check: %', SQLERRM;
  end;
  
  -- Daily summary report at 9 AM UTC
  begin
    perform cron.schedule(
      'mcp_daily_summary',
      '0 9 * * *',
      $$select mcp.get_role_status();$$
    );
    raise notice 'Scheduled: mcp_daily_summary';
  exception 
    when duplicate_object then
      raise notice 'Job mcp_daily_summary already exists';
    when others then
      raise notice 'Failed to schedule mcp_daily_summary: %', SQLERRM;
  end;
end $mcp$;

-- Grant permissions
grant select on mcp.schema_allowlist to service_role;
grant select on mcp.violation_log to service_role;
grant select on mcp.activity_summary to service_role;
grant execute on function mcp.audit_schema_violations() to service_role;
grant execute on function mcp.alert_violations() to service_role;
grant execute on function mcp.get_role_status() to service_role;