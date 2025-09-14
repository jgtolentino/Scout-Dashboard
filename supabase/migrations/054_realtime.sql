-- Enable Realtime for dashboard live updates
-- Ensure the Realtime publication includes our analytics tables

-- Add analytics tables to Realtime publication
do $$
begin
  -- Add tables to the default supabase_realtime publication
  -- This allows clients to subscribe to changes
  
  -- Core analytics tables
  if exists (select 1 from pg_tables where schemaname = 'analytics' and tablename = 'recommendations') then
    alter publication supabase_realtime add table analytics.recommendations;
    raise notice 'Added analytics.recommendations to realtime publication';
  end if;
  
  if exists (select 1 from pg_tables where schemaname = 'analytics' and tablename = 'agent_insights') then  
    alter publication supabase_realtime add table analytics.agent_insights;
    raise notice 'Added analytics.agent_insights to realtime publication';
  end if;
  
  if exists (select 1 from pg_tables where schemaname = 'analytics' and tablename = 'chat_conversations') then
    alter publication supabase_realtime add table analytics.chat_conversations;
    raise notice 'Added analytics.chat_conversations to realtime publication';
  end if;
  
  -- KPI snapshots for live dashboard updates
  if exists (select 1 from pg_tables where schemaname = 'analytics_snap' and tablename = 'kpi_hourly') then
    alter publication supabase_realtime add table analytics_snap.kpi_hourly;
    raise notice 'Added analytics_snap.kpi_hourly to realtime publication';
  end if;
  
exception
  when duplicate_object then
    raise notice 'Some tables already in realtime publication - continuing';
  when others then
    raise notice 'Error adding tables to realtime publication: %', SQLERRM;
end $$;

-- Enable Row Level Security on tables for Realtime
-- (Realtime respects RLS policies automatically)

-- Create RLS policies for analytics tables if they don't exist
do $$
begin
  -- Recommendations RLS
  if exists (select 1 from pg_tables where schemaname = 'analytics' and tablename = 'recommendations') then
    -- Enable RLS if not already enabled
    if not exists (select 1 from pg_class c join pg_namespace n on c.relnamespace = n.oid 
                   where n.nspname = 'analytics' and c.relname = 'recommendations' and c.relrowsecurity) then
      alter table analytics.recommendations enable row level security;
      raise notice 'Enabled RLS on analytics.recommendations';
    end if;
    
    -- Create policy for authenticated users to see their org's data
    if not exists (select 1 from pg_policies where schemaname = 'analytics' and tablename = 'recommendations' and policyname = 'realtime_org_isolation') then
      create policy realtime_org_isolation on analytics.recommendations
        for select using (
          auth.jwt() ->> 'org_id' = org_id::text
          or auth.jwt() ->> 'role' = 'service_role'
        );
      raise notice 'Created RLS policy for analytics.recommendations';
    end if;
  end if;

  -- Agent insights RLS  
  if exists (select 1 from pg_tables where schemaname = 'analytics' and tablename = 'agent_insights') then
    if not exists (select 1 from pg_class c join pg_namespace n on c.relnamespace = n.oid 
                   where n.nspname = 'analytics' and c.relname = 'agent_insights' and c.relrowsecurity) then
      alter table analytics.agent_insights enable row level security;
      raise notice 'Enabled RLS on analytics.agent_insights';
    end if;
    
    if not exists (select 1 from pg_policies where schemaname = 'analytics' and tablename = 'agent_insights' and policyname = 'realtime_org_isolation') then
      create policy realtime_org_isolation on analytics.agent_insights
        for select using (
          auth.jwt() ->> 'org_id' = org_id::text
          or auth.jwt() ->> 'role' = 'service_role'
        );
      raise notice 'Created RLS policy for analytics.agent_insights';
    end if;
  end if;

  -- Chat conversations RLS
  if exists (select 1 from pg_tables where schemaname = 'analytics' and tablename = 'chat_conversations') then
    if not exists (select 1 from pg_class c join pg_namespace n on c.relnamespace = n.oid 
                   where n.nspname = 'analytics' and c.relname = 'chat_conversations' and c.relrowsecurity) then
      alter table analytics.chat_conversations enable row level security;
      raise notice 'Enabled RLS on analytics.chat_conversations';
    end if;
    
    if not exists (select 1 from pg_policies where schemaname = 'analytics' and tablename = 'chat_conversations' and policyname = 'realtime_org_isolation') then
      create policy realtime_org_isolation on analytics.chat_conversations
        for select using (
          auth.jwt() ->> 'org_id' = org_id::text
          or auth.jwt() ->> 'role' = 'service_role'
        );
      raise notice 'Created RLS policy for analytics.chat_conversations';
    end if;
  end if;

  -- KPI snapshots - allow all authenticated users to see aggregated data
  if exists (select 1 from pg_tables where schemaname = 'analytics_snap' and tablename = 'kpi_hourly') then
    if not exists (select 1 from pg_class c join pg_namespace n on c.relnamespace = n.oid 
                   where n.nspname = 'analytics_snap' and c.relname = 'kpi_hourly' and c.relrowsecurity) then
      alter table analytics_snap.kpi_hourly enable row level security;
      raise notice 'Enabled RLS on analytics_snap.kpi_hourly';
    end if;
    
    if not exists (select 1 from pg_policies where schemaname = 'analytics_snap' and tablename = 'kpi_hourly' and policyname = 'realtime_authenticated_read') then
      create policy realtime_authenticated_read on analytics_snap.kpi_hourly
        for select using (
          auth.role() = 'authenticated'
          or auth.jwt() ->> 'role' = 'service_role'
        );
      raise notice 'Created RLS policy for analytics_snap.kpi_hourly';
    end if;
  end if;

exception
  when others then
    raise notice 'Error setting up RLS policies: %', SQLERRM;
end $$;

-- Create a helper function to get realtime channel recommendations
create or replace function internal.get_realtime_channels()
returns table(
  table_name text,
  suggested_channel text,
  filter_example text,
  description text
)
language sql
security definer
as $$
select 
  'analytics.recommendations'::text,
  'recommendations:org_id=eq.{org_id}'::text,
  'org_id=eq.123e4567-e89b-12d3-a456-426614174000'::text,
  'Real-time recommendation updates filtered by organization'::text
union all
select 
  'analytics.agent_insights'::text,
  'agent_insights:org_id=eq.{org_id}'::text,
  'org_id=eq.123e4567-e89b-12d3-a456-426614174000'::text,
  'Live AI agent discoveries and insights'::text
union all
select 
  'analytics.chat_conversations'::text,
  'chat_conversations:org_id=eq.{org_id}'::text,
  'org_id=eq.123e4567-e89b-12d3-a456-426614174000'::text,
  'Real-time chat conversation updates'::text
union all
select 
  'analytics_snap.kpi_hourly'::text,
  'kpi_hourly'::text,
  'metric=eq.recommendations_total'::text,
  'Live KPI updates for dashboard tiles'::text;
$$;

-- Grant access to the helper function
grant execute on function internal.get_realtime_channels() to service_role, authenticated;