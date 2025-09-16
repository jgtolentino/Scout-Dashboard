-- === Production Analytics Complete: Zero-Red Fix Pack ===
-- Comprehensive analytics + switching system with error elimination

-- Create scout schema with error handling
create schema if not exists scout;

-- === SAFE CAST MACRO IMPLEMENTATION ===
-- Replace TRY_CAST with PostgreSQL-compatible safe functions
create or replace function scout.safe_cast_int(input_value text)
returns integer language plpgsql immutable as $$
begin
  return input_value::integer;
exception when others then
  return null;
end;
$$;

create or replace function scout.safe_cast_numeric(input_value text, precision_val int default 10, scale_val int default 2)
returns numeric language plpgsql immutable as $$
begin
  return input_value::numeric;
exception when others then
  return null;
end;
$$;

create or replace function scout.safe_cast_timestamp(input_value text)
returns timestamp language plpgsql immutable as $$
begin
  return input_value::timestamp;
exception when others then
  return null;
end;
$$;

-- === AUTO-CONFORM SCHEMA VIEW ===
-- Handle missing columns (folder_id, product_id) with computed defaults
create or replace view scout.auto_conform_transactions as
select 
  *,
  -- Auto-generated folder_id from store hierarchy
  case 
    when store_id is not null then 'folder_' || store_id::text
    else 'folder_unknown'
  end as folder_id,
  -- Auto-generated product_id from category + brand + sku
  case 
    when product_category is not null and brand_name is not null and sku is not null 
    then md5(product_category || '_' || brand_name || '_' || sku)
    when product_category is not null and brand_name is not null
    then md5(product_category || '_' || brand_name)
    else 'product_unknown'
  end as product_id
from silver.transactions_cleaned;

-- === ENHANCED TRANSACTIONS VIEW ===
-- Data quality enforcement with COALESCE defaults
create or replace view scout.transactions as
select 
  id as transaction_id,
  -- Handle NULL timestamps with defaults
  coalesce(timestamp, now() - interval '1 day') as timestamp,
  coalesce(product_category, 'Unknown') as product_category,
  coalesce(brand_name, 'Unknown') as brand_name,
  coalesce(age_bracket, 'Unknown') as age_bracket,
  coalesce(gender, 'Unknown') as gender,
  coalesce(sku, 'Unknown') as pack_size,
  coalesce(payment_method, 'Cash') as payment_method,
  coalesce(customer_type, 'Regular') as customer_type,
  coalesce(peso_value, 0) as peso_value,
  -- Add computed fields
  coalesce(store_id, 'Unknown') as store_id
from silver.transactions_cleaned
where timestamp is not null or id is not null; -- Basic data quality gate

-- === HELPER FUNCTIONS ===
-- Daypart calculation with timezone handling
create or replace function scout.daypart_of(ts timestamptz)
returns text language sql immutable as $$
  select case
    when extract(hour from ts at time zone 'Asia/Manila') between 5 and 10 then 'Morning'
    when extract(hour from ts at time zone 'Asia/Manila') between 11 and 15 then 'Midday'
    when extract(hour from ts at time zone 'Asia/Manila') between 16 and 19 then 'Afternoon'
    else 'Evening'
  end
$$;

-- Basket size banding
create or replace function scout.basket_band(n int)
returns text language sql immutable as $$
  select case
    when n is null then 'Unknown'
    when n <= 1 then 'Single'
    when n = 2 then 'Pair'
    when n between 3 and 5 then 'Small'
    when n between 6 and 10 then 'Medium'
    else 'Large'
  end
$$;

-- Price tier calculation
create or replace function scout.price_tier(amount numeric)
returns text language sql immutable as $$
  select case
    when amount is null or amount <= 0 then 'Unknown'
    when amount <= 50 then 'Budget'
    when amount <= 200 then 'Standard'
    when amount <= 500 then 'Premium'
    else 'Luxury'
  end
$$;

-- === BASKET AGGREGATION VIEW ===
create or replace view scout.v_basket_sizes as
select
  transaction_id,
  count(*)::int as basket_size,
  sum(coalesce(peso_value, 0))::numeric as basket_value,
  avg(coalesce(peso_value, 0))::numeric as avg_item_value,
  max(coalesce(peso_value, 0))::numeric as max_item_value
from scout.transactions
group by transaction_id;

-- === CORE ANALYTICS MATERIALIZED VIEW ===
drop materialized view if exists scout.mv_facts cascade;
create materialized view scout.mv_facts as
select
  -- Temporal dimensions
  date(t.timestamp)::date as d,
  extract(year from t.timestamp)::int as year,
  extract(month from t.timestamp)::int as month,
  extract(dow from t.timestamp)::int as dow,
  extract(week from t.timestamp)::int as week,
  (extract(dow from t.timestamp)::int in (0,6)) as is_weekend,
  scout.daypart_of(t.timestamp) as daypart,
  
  -- Product dimensions
  coalesce(t.product_category, 'Unknown') as category,
  coalesce(t.brand_name, 'Unknown') as brand,
  coalesce(t.pack_size, 'Unknown') as pack_size,
  scout.price_tier(t.peso_value) as price_tier,
  
  -- Customer dimensions  
  coalesce(t.age_bracket, 'Unknown') as age_bracket,
  coalesce(t.gender, 'Unknown') as gender,
  coalesce(t.payment_method, 'Cash') as payment_method,
  coalesce(t.customer_type, 'Regular') as customer_type,
  
  -- Location dimensions
  coalesce(t.store_id, 'Unknown') as store_id,
  
  -- Transaction facts
  t.transaction_id,
  coalesce(bs.basket_size, 1) as basket_size,
  coalesce(bs.basket_value, t.peso_value, 0) as basket_value,
  scout.basket_band(bs.basket_size) as basket_band,
  
  -- Line-level aggregations
  sum(coalesce(t.peso_value, 0))::numeric as line_value,
  count(*)::int as line_count,
  avg(coalesce(t.peso_value, 0))::numeric as avg_line_value

from scout.transactions t
left join scout.v_basket_sizes bs using (transaction_id)
where t.timestamp >= '2024-01-01'::date -- Performance optimization
group by 
  date(t.timestamp), extract(year from t.timestamp), extract(month from t.timestamp),
  extract(dow from t.timestamp), extract(week from t.timestamp),
  scout.daypart_of(t.timestamp), t.product_category, t.brand_name, t.pack_size,
  scout.price_tier(t.peso_value), t.age_bracket, t.gender, t.payment_method,
  t.customer_type, t.store_id, t.transaction_id, bs.basket_size, bs.basket_value;

-- === SWITCHING ANALYTICS MATERIALIZED VIEW ===
drop materialized view if exists scout.mv_switching cascade;
create materialized view scout.mv_switching as
with customer_transactions as (
  select 
    customer_type,
    age_bracket,
    gender,
    store_id,
    brand,
    category,
    d,
    transaction_id,
    basket_value,
    row_number() over (
      partition by customer_type, age_bracket, gender, store_id 
      order by d, transaction_id
    ) as tx_sequence
  from scout.mv_facts
  where customer_type != 'Unknown'
),
switching_pairs as (
  select 
    curr.customer_type,
    curr.age_bracket,
    curr.gender,
    curr.store_id,
    curr.brand as from_brand,
    curr.category as from_category,
    next_tx.brand as to_brand,
    next_tx.category as to_category,
    curr.d as switch_date,
    curr.basket_value as from_value,
    next_tx.basket_value as to_value,
    next_tx.d - curr.d as days_between
  from customer_transactions curr
  join customer_transactions next_tx on (
    curr.customer_type = next_tx.customer_type
    and curr.age_bracket = next_tx.age_bracket  
    and curr.gender = next_tx.gender
    and curr.store_id = next_tx.store_id
    and curr.tx_sequence + 1 = next_tx.tx_sequence
  )
  where curr.brand != next_tx.brand 
    and next_tx.d - curr.d <= 30 -- Within 30 days
)
select 
  from_brand,
  to_brand,
  from_category,
  to_category,
  customer_type,
  age_bracket,
  gender,
  count(*) as switch_count,
  avg(days_between) as avg_days_between,
  avg(from_value) as avg_from_value,
  avg(to_value) as avg_to_value,
  avg(to_value - from_value) as avg_value_change,
  count(*) * 100.0 / sum(count(*)) over (partition by from_brand) as switch_rate_pct
from switching_pairs
group by from_brand, to_brand, from_category, to_category, 
         customer_type, age_bracket, gender;

-- === PERFORMANCE INDEXES ===
-- mv_facts indexes for optimal query performance
create unique index if not exists mv_facts_unique_idx on scout.mv_facts (
  transaction_id, d, category, brand, age_bracket, gender
);

create index if not exists mv_facts_temporal_idx on scout.mv_facts (d, year, month, week);
create index if not exists mv_facts_daypart_category_idx on scout.mv_facts (daypart, category);
create index if not exists mv_facts_brand_category_idx on scout.mv_facts (brand, category);
create index if not exists mv_facts_customer_idx on scout.mv_facts (age_bracket, gender, customer_type);
create index if not exists mv_facts_location_idx on scout.mv_facts (store_id);
create index if not exists mv_facts_basket_idx on scout.mv_facts (basket_band, basket_size);
create index if not exists mv_facts_price_idx on scout.mv_facts (price_tier);
create index if not exists mv_facts_payment_idx on scout.mv_facts (payment_method);

-- mv_switching indexes
create unique index if not exists mv_switching_unique_idx on scout.mv_switching (
  from_brand, to_brand, customer_type, age_bracket, gender
);

create index if not exists mv_switching_from_brand_idx on scout.mv_switching (from_brand);
create index if not exists mv_switching_to_brand_idx on scout.mv_switching (to_brand);
create index if not exists mv_switching_category_idx on scout.mv_switching (from_category, to_category);
create index if not exists mv_switching_customer_idx on scout.mv_switching (customer_type, age_bracket, gender);

-- === AUTOMATED REFRESH SYSTEM ===
-- Enable pg_cron for scheduled refreshes
create extension if not exists pg_cron with schema extensions;

-- Clean up existing schedules
select cron.unschedule('refresh_analytics_facts') 
where exists (select 1 from cron.job where jobname = 'refresh_analytics_facts');

select cron.unschedule('refresh_analytics_switching') 
where exists (select 1 from cron.job where jobname = 'refresh_analytics_switching');

-- Schedule mv_facts refresh every 10 minutes
select cron.schedule(
  'refresh_analytics_facts',
  '*/10 * * * *',
  'refresh materialized view concurrently scout.mv_facts'
);

-- Schedule mv_switching refresh every 30 minutes
select cron.schedule(
  'refresh_analytics_switching', 
  '*/30 * * * *',
  'refresh materialized view concurrently scout.mv_switching'
);

-- === PERMISSIONS & SECURITY ===
grant usage on schema scout to authenticated;
grant select on all tables in schema scout to authenticated;
grant select on all materialized views in schema scout to authenticated;

-- === INITIAL DATA LOAD ===
-- Refresh both materialized views to populate data
refresh materialized view concurrently scout.mv_facts;
refresh materialized view concurrently scout.mv_switching;

-- === VALIDATION QUERIES ===
-- Verify data quality and completeness
do $$
declare
  facts_count integer;
  switching_count integer;
  null_count integer;
begin
  select count(*) into facts_count from scout.mv_facts;
  select count(*) into switching_count from scout.mv_switching;
  select count(*) into null_count from scout.mv_facts where transaction_id is null;
  
  raise notice 'Analytics deployment complete:';
  raise notice '- Facts records: %', facts_count;
  raise notice '- Switching records: %', switching_count;
  raise notice '- Data quality: % null transactions', null_count;
  
  if facts_count = 0 then
    raise exception 'CRITICAL: No facts data loaded - check silver.transactions_cleaned';
  end if;
end $$;