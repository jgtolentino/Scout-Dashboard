-- 014_stage_to_bronze.sql
create schema if not exists scout;

create table if not exists scout.scout_stage_edge_ingest (
  raw jsonb not null,
  src_path text,
  loaded_at timestamptz default now()
);

-- Bronze layer: Raw ingestion
create table if not exists scout.scout_bronze_edge_raw (
  id text primary key,
  device_id text,
  captured_at timestamptz,
  src_filename text,
  payload jsonb not null,
  ingested_at timestamptz default now()
);

-- Silver layer: Cleaned transactions  
create table if not exists scout.scout_silver_transactions (
  transaction_id text primary key,
  store_id text,
  timestamp timestamptz not null,
  brand_name text,
  peso_value decimal(12,2),
  region text,
  device_id text,
  location jsonb,
  product_category text,
  processed_at timestamptz default now()
);

-- Gold layer: Aggregated views
create or replace view scout.gold_daily_revenue as
select 
  date(timestamp) as date,
  sum(peso_value) as total_revenue,
  count(*) as transaction_count,
  count(distinct store_id) as unique_stores
from scout.silver_transactions
group by date(timestamp)
order by date desc;

create or replace view scout.gold_brand_performance as
select 
  brand_name,
  sum(peso_value) as total_revenue,
  count(*) as transaction_count,
  avg(peso_value) as avg_transaction_value
from scout.silver_transactions
where brand_name is not null
group by brand_name
order by total_revenue desc;

-- Stage to Bronze mapping function
create or replace function scout.fn_stage_to_bronze_scout()
returns bigint
language plpgsql
security definer
as $$
declare
  processed_count bigint := 0;
begin
  -- Process staged data into bronze layer
  insert into scout.bronze_edge_raw (id, device_id, captured_at, src_filename, payload)
  select 
    coalesce(
      raw->>'transaction_id',
      raw->>'id', 
      extract(epoch from now())::text || '-' || row_number() over()
    ) as id,
    coalesce(
      raw->>'device_id',
      case 
        when src_path like '%scoutpi-0002%' then 'scoutpi-0002'
        when src_path like '%scoutpi-0006%' then 'scoutpi-0006'
        else 'unknown'
      end
    ) as device_id,
    coalesce(
      (raw->>'timestamp')::timestamptz,
      (raw->>'created_at')::timestamptz,
      loaded_at
    ) as captured_at,
    split_part(src_path, '::', 2) as src_filename,
    raw as payload
  from scout.stage_edge_ingest
  where raw is not null
  on conflict (id) do nothing;
  
  get diagnostics processed_count = row_count;
  
  -- Clean up processed staging records
  delete from scout.stage_edge_ingest;
  
  return processed_count;
end;
$$;

-- Bronze to Silver processing function
create or replace function scout.process_bronze_to_silver_ces()
returns integer as $$
declare
  processed_count integer := 0;
begin
  with new_silver as (
    insert into scout.silver_transactions (
      transaction_id, store_id, timestamp, brand_name, peso_value, region, device_id, location, product_category
    )
    select distinct
      coalesce(payload->>'transaction_id', id) as transaction_id,
      payload->>'store_id' as store_id,
      coalesce((payload->>'timestamp')::timestamptz, captured_at) as timestamp,
      payload->>'brand_name' as brand_name,
      case 
        when payload->>'peso_value' ~ '^[0-9]+\.?[0-9]*$' 
        then (payload->>'peso_value')::decimal 
        else null 
      end as peso_value,
      coalesce(payload->>'region', 'Unknown') as region,
      device_id,
      payload->'location' as location,
      payload->>'product_category' as product_category
    from scout.bronze_edge_raw
    where payload is not null
      and not exists (
        select 1 from scout.silver_transactions s
        where s.transaction_id = coalesce(payload->>'transaction_id', bronze_edge_raw.id)
      )
    on conflict (transaction_id) do nothing
    returning transaction_id
  )
  select count(*) into processed_count from new_silver;
  
  return processed_count;
end;
$$ language plpgsql;

-- Public wrapper callable from Edge Functions (/rpc/stage_to_bronze)
create or replace function public.stage_to_bronze_scout()
returns bigint
language sql
security definer
set search_path = public, pg_temp, scout
as $
  select scout.fn_stage_to_bronze();
$;

-- Permissions
grant usage on schema scout to anon, authenticated, service_role;
grant all on all tables in schema scout to service_role;
grant select on all tables in schema scout to anon, authenticated;
grant select on all sequences in schema scout to anon, authenticated, service_role;
grant execute on function public.stage_to_bronze() to anon, authenticated, service_role;