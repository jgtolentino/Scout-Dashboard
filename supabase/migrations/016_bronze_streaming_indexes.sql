-- 016_bronze_streaming_indexes.sql
-- Optimize bronze table for real-time streaming and querying

-- Ensure bronze table exists with proper structure
create table if not exists scout.scout_bronze_edge_raw (
  id text primary key,
  device_id text,
  captured_at timestamptz,
  src_filename text,
  payload jsonb not null,
  ingested_at timestamptz default now()
);

-- Indexes for streaming performance
create index if not exists idx_bronze_device_time 
  on scout.bronze_edge_raw(device_id, ingested_at desc);

create index if not exists idx_bronze_ingested_recent 
  on scout.bronze_edge_raw(ingested_at desc) 
  where ingested_at >= now() - interval '24 hours';

create index if not exists idx_bronze_captured_time 
  on scout.bronze_edge_raw(captured_at desc) 
  where captured_at is not null;

-- GIN index for payload queries
create index if not exists idx_bronze_payload_gin 
  on scout.bronze_edge_raw using gin(payload);

-- Specific payload field indexes for common queries
create index if not exists idx_bronze_transaction_id 
  on scout.bronze_edge_raw using gin((payload->>'transaction_id'));

create index if not exists idx_bronze_store_id 
  on scout.bronze_edge_raw using gin((payload->>'store_id'));

create index if not exists idx_bronze_peso_value 
  on scout.bronze_edge_raw(((payload->>'peso_value')::decimal)) 
  where payload->>'peso_value' is not null;

-- Streaming-specific views for monitoring
create or replace view scout.streaming_stats as
select 
  device_id,
  count(*) as total_records,
  max(ingested_at) as last_ingested,
  min(ingested_at) as first_ingested,
  count(*) filter (where ingested_at >= now() - interval '1 hour') as last_hour,
  count(*) filter (where ingested_at >= now() - interval '1 day') as last_day,
  count(*) filter (where src_filename like 'stream:%') as stream_records,
  count(*) filter (where src_filename not like 'stream:%') as batch_records
from scout.bronze_edge_raw
group by device_id
order by last_ingested desc nulls last;

-- Real-time processing function for streaming data
create or replace function scout.process_recent_bronze_to_silver_ces(lookback_minutes integer default 5)
returns integer as $$
declare
  processed_count integer := 0;
begin
  -- Process only recent bronze records (for real-time streaming)
  with new_silver as (
    insert into scout.silver_transactions (
      transaction_id, store_id, timestamp, brand_name, peso_value, region, device_id, location, product_category
    )
    select distinct
      coalesce(payload->>'transaction_id', id) as transaction_id,
      payload->>'store_id' as store_id,
      coalesce((payload->>'timestamp')::timestamptz, captured_at, ingested_at) as timestamp,
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
    where ingested_at >= now() - interval '1 minute' * lookback_minutes
      and payload is not null
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

-- Permissions
grant select on scout.streaming_stats to anon, authenticated, service_role;
grant execute on function scout.process_recent_bronze_to_silver(integer) to service_role;