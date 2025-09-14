-- Feature Store Schema
create schema if not exists features;
grant usage on schema features to service_role, authenticated, mindsdb_code_ro;

-- Core feature storage table
create table if not exists features.handshake_signals (
  org_id uuid not null,
  company text not null,
  subcategory text not null,
  signal_name text not null,
  signal_value numeric not null,
  signal_type text not null default 'numeric',
  confidence_score numeric default 1.0,
  as_of_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  primary key (org_id, company, subcategory, signal_name, as_of_date)
);

-- Enable RLS
alter table features.handshake_signals enable row level security;

-- RLS policy for org isolation
create policy org_isolation on features.handshake_signals
  for all using (
    auth.jwt() ->> 'org_id' = org_id::text
    or auth.jwt() ->> 'role' = 'service_role'
  );

-- Product feature signals table
create table if not exists features.product_signals (
  org_id uuid not null,
  sku text not null,
  signal_name text not null,
  signal_value numeric not null,
  signal_type text not null default 'numeric',
  confidence_score numeric default 1.0,
  as_of_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  primary key (org_id, sku, signal_name, as_of_date)
);

alter table features.product_signals enable row level security;
create policy org_isolation on features.product_signals
  for all using (
    auth.jwt() ->> 'org_id' = org_id::text
    or auth.jwt() ->> 'role' = 'service_role'
  );

-- Customer feature signals table  
create table if not exists features.customer_signals (
  org_id uuid not null,
  customer_id text not null,
  signal_name text not null,
  signal_value numeric not null,
  signal_type text not null default 'numeric',
  confidence_score numeric default 1.0,
  as_of_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  primary key (org_id, customer_id, signal_name, as_of_date)
);

alter table features.customer_signals enable row level security;
create policy org_isolation on features.customer_signals
  for all using (
    auth.jwt() ->> 'org_id' = org_id::text
    or auth.jwt() ->> 'role' = 'service_role'
  );

-- Feature computation functions
create or replace function features.compute_handshake_features(target_date date default current_date)
returns table(
  org_id uuid,
  company text,
  subcategory text,
  features_computed integer
)
language plpgsql
security definer
as $$
declare
  rec record;
  computed_count integer := 0;
begin
  -- Compute recommendation score percentiles by company/subcategory
  insert into features.handshake_signals (org_id, company, subcategory, signal_name, signal_value, as_of_date)
  select 
    r.org_id,
    r.company,
    r.subcategory,
    'recs_score_p50' as signal_name,
    percentile_cont(0.5) within group (order by r.score) as signal_value,
    target_date as as_of_date
  from analytics.recommendations r
  where r.created_at::date <= target_date
    and r.status = 'active'
  group by r.org_id, r.company, r.subcategory
  having count(*) >= 3  -- Minimum sample size
  on conflict (org_id, company, subcategory, signal_name, as_of_date) 
  do update set 
    signal_value = excluded.signal_value,
    updated_at = now();
    
  get diagnostics computed_count = row_count;
  
  -- Compute recommendation counts
  insert into features.handshake_signals (org_id, company, subcategory, signal_name, signal_value, as_of_date)
  select 
    r.org_id,
    r.company,
    r.subcategory,
    'recs_count_30d' as signal_name,
    count(*) as signal_value,
    target_date as as_of_date
  from analytics.recommendations r
  where r.created_at >= target_date - interval '30 days'
    and r.created_at::date <= target_date
    and r.status = 'active'
  group by r.org_id, r.company, r.subcategory
  on conflict (org_id, company, subcategory, signal_name, as_of_date) 
  do update set 
    signal_value = excluded.signal_value,
    updated_at = now();
    
  -- Return summary by org/company/subcategory
  return query
  select 
    fs.org_id,
    fs.company,
    fs.subcategory,
    count(distinct fs.signal_name)::integer as features_computed
  from features.handshake_signals fs
  where fs.as_of_date = target_date
    and fs.updated_at >= current_date
  group by fs.org_id, fs.company, fs.subcategory
  order by features_computed desc;
end $$;

-- Feature retrieval function for ML models
create or replace function features.get_features(
  p_org_id uuid,
  p_company text default null,
  p_subcategory text default null,
  p_signals text[] default null,
  p_as_of_date date default current_date
)
returns table(
  company text,
  subcategory text,
  signal_name text,
  signal_value numeric,
  signal_type text,
  confidence_score numeric,
  as_of_date date
)
language sql
security definer
as $$
select 
  fs.company,
  fs.subcategory,
  fs.signal_name,
  fs.signal_value,
  fs.signal_type,
  fs.confidence_score,
  fs.as_of_date
from features.handshake_signals fs
where fs.org_id = p_org_id
  and (p_company is null or fs.company = p_company)
  and (p_subcategory is null or fs.subcategory = p_subcategory)
  and (p_signals is null or fs.signal_name = any(p_signals))
  and fs.as_of_date <= p_as_of_date
  and fs.as_of_date = (
    select max(fs2.as_of_date) 
    from features.handshake_signals fs2
    where fs2.org_id = fs.org_id
      and fs2.company = fs.company
      and fs2.subcategory = fs.subcategory
      and fs2.signal_name = fs.signal_name
      and fs2.as_of_date <= p_as_of_date
  )
order by fs.company, fs.subcategory, fs.signal_name;
$$;

-- Feature freshness monitoring
create or replace view features.feature_freshness as
select 
  signal_name,
  count(*) as total_features,
  max(as_of_date) as latest_date,
  min(as_of_date) as earliest_date,
  current_date - max(as_of_date) as days_stale,
  case 
    when current_date - max(as_of_date) = 0 then 'fresh'
    when current_date - max(as_of_date) <= 1 then 'recent' 
    when current_date - max(as_of_date) <= 7 then 'stale'
    else 'very_stale'
  end as freshness_status
from features.handshake_signals
group by signal_name
order by days_stale desc;

-- Schedule feature computation
do $features$ 
begin
  -- Daily feature computation at 1 AM UTC (9 AM PHT)
  begin
    perform cron.schedule(
      'features_daily_compute',
      '0 1 * * *',
      $$select features.compute_handshake_features();$$
    );
    raise notice 'Scheduled: features_daily_compute';
  exception 
    when duplicate_object then
      raise notice 'Job features_daily_compute already exists';
    when others then
      raise notice 'Failed to schedule features_daily_compute: %', SQLERRM;
  end;
end $features$;

-- Grant permissions
grant select on features.handshake_signals to authenticated, mindsdb_code_ro;
grant select on features.product_signals to authenticated, mindsdb_code_ro;
grant select on features.customer_signals to authenticated, mindsdb_code_ro;
grant select on features.feature_freshness to authenticated, service_role;
grant execute on function features.compute_handshake_features(date) to service_role;
grant execute on function features.get_features(uuid, text, text, text[], date) to authenticated, service_role;