-- Enable GraphQL API with curated schema
create extension if not exists pg_graphql;

-- Create API schema for GraphQL-exposed views (read-only)
create schema if not exists api;

-- Grant usage to authenticated users and service role
grant usage on schema api to anon, authenticated, service_role;

-- =====================================================
-- Curated Views for GraphQL API
-- =====================================================

-- Recommendations view (filtered, safe columns)
create or replace view api.recommendations as
select 
  id,
  org_id,
  tier,
  company,
  subcategory,
  score,
  reasoning,
  status,
  expires_at,
  created_at,
  updated_at
from analytics.recommendations
where status = 'active'
  and (expires_at is null or expires_at > now());

-- Agent insights view (public-safe insights)
create or replace view api.agent_insights as
select 
  id,
  org_id,
  agent_type,
  insight_category,
  summary,
  confidence_score,
  impact_level,
  status,
  created_at,
  updated_at
from analytics.agent_insights
where status = 'published';

-- Chat conversations view (metadata only, no sensitive content)
create or replace view api.chat_conversations as
select 
  id,
  org_id,
  conversation_type,
  message_count,
  avg_response_time,
  satisfaction_score,
  status,
  started_at,
  ended_at,
  last_activity_at
from analytics.chat_conversations;

-- KPI snapshots view (aggregated metrics)
create or replace view api.kpi_snapshots as
select 
  snapshot_ts,
  metric,
  value,
  -- Add some computed fields for convenience
  case 
    when metric like '%_total' then 'count'
    when metric like '%_score' then 'score'
    when metric like '%_rate' then 'percentage'
    else 'other'
  end as metric_type,
  case 
    when snapshot_ts >= date_trunc('day', now()) then 'today'
    when snapshot_ts >= date_trunc('day', now() - interval '1 day') then 'yesterday'
    when snapshot_ts >= date_trunc('week', now()) then 'this_week'
    else 'historical'
  end as time_bucket
from analytics_snap.kpi_hourly
where snapshot_ts >= now() - interval '30 days'
order by snapshot_ts desc;

-- =====================================================
-- Row Level Security for GraphQL Views
-- =====================================================

-- Enable RLS on all API views
alter view api.recommendations set (security_barrier = true);
alter view api.agent_insights set (security_barrier = true);
alter view api.chat_conversations set (security_barrier = true);
alter view api.kpi_snapshots set (security_barrier = true);

-- Create RLS policies for API views
-- Note: Views inherit RLS from underlying tables, but we can add additional restrictions

-- Grant select permissions with RLS
grant select on api.recommendations to anon, authenticated;
grant select on api.agent_insights to anon, authenticated;
grant select on api.chat_conversations to anon, authenticated;
grant select on api.kpi_snapshots to anon, authenticated;

-- =====================================================
-- GraphQL Helper Functions
-- =====================================================

-- Function to get GraphQL schema info
create or replace function api.graphql_schema_info()
returns table(
  table_name text,
  column_name text,
  data_type text,
  is_nullable boolean,
  description text
)
language sql
security definer
as $$
select 
  t.table_name::text,
  c.column_name::text,
  c.data_type::text,
  c.is_nullable::boolean,
  case t.table_name
    when 'recommendations' then 'AI-generated recommendations by tier and category'
    when 'agent_insights' then 'Published insights from autonomous analytics agents'
    when 'chat_conversations' then 'Chat conversation metadata and statistics'
    when 'kpi_snapshots' then 'Hourly KPI snapshots for dashboard metrics'
    else 'API table'
  end::text as description
from information_schema.tables t
join information_schema.columns c on c.table_name = t.table_name and c.table_schema = t.table_schema
where t.table_schema = 'api'
  and t.table_type = 'VIEW'
order by t.table_name, c.ordinal_position;
$$;

-- Function to get recommendation stats for GraphQL
create or replace function api.recommendation_stats(org_filter uuid default null)
returns table(
  total_recommendations bigint,
  active_recommendations bigint,
  avg_score numeric,
  recommendations_by_tier jsonb,
  top_companies jsonb
)
language sql
security definer
as $$
with stats as (
  select 
    count(*) as total,
    count(*) filter (where status = 'active') as active,
    avg(score) as avg_score,
    org_id
  from analytics.recommendations r
  where (org_filter is null or r.org_id = org_filter)
  group by org_id
),
tier_stats as (
  select 
    jsonb_object_agg(tier, count) as by_tier
  from (
    select tier, count(*) as count
    from analytics.recommendations r
    where (org_filter is null or r.org_id = org_filter)
      and status = 'active'
    group by tier
  ) t
),
company_stats as (
  select 
    jsonb_agg(jsonb_build_object('company', company, 'count', count, 'avg_score', avg_score)) as top_companies
  from (
    select 
      company, 
      count(*) as count, 
      round(avg(score), 2) as avg_score
    from analytics.recommendations r
    where (org_filter is null or r.org_id = org_filter)
      and status = 'active'
    group by company
    order by count desc, avg_score desc
    limit 10
  ) c
)
select 
  coalesce(s.total, 0) as total_recommendations,
  coalesce(s.active, 0) as active_recommendations,
  round(coalesce(s.avg_score, 0), 2) as avg_score,
  coalesce(ts.by_tier, '{}'::jsonb) as recommendations_by_tier,
  coalesce(cs.top_companies, '[]'::jsonb) as top_companies
from stats s
cross join tier_stats ts
cross join company_stats cs;
$$;

-- Grant access to helper functions
grant execute on function api.graphql_schema_info() to anon, authenticated, service_role;
grant execute on function api.recommendation_stats(uuid) to anon, authenticated, service_role;