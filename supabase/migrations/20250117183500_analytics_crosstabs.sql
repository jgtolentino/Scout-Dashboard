-- === Analytics Cross-Tabs (non-emotions) ===
create schema if not exists scout;

-- Ensure columns exist (no-ops if already present)
do $$ begin
  if to_regclass('scout.transactions') is null then
    -- Check for silver.transactions_cleaned instead
    if to_regclass('silver.transactions_cleaned') is null then
      raise exception 'Neither scout.transactions nor silver.transactions_cleaned found';
    end if;
  end if;
end $$;

-- Create scout.transactions as a view or table mapping to silver.transactions_cleaned
create or replace view scout.transactions as
select 
  id as transaction_id,
  timestamp,
  product_category,
  brand_name,
  age_bracket::text,
  gender::text,
  sku as pack_size, -- Using SKU as pack size proxy
  payment_method::text,
  customer_type::text,
  peso_value
from silver.transactions_cleaned
where timestamp is not null;

-- Daypart bucketing
create or replace function scout.daypart_of(ts timestamptz)
returns text language sql immutable as $$
  select case
    when extract(hour from ts at time zone 'UTC') between 5  and 10 then 'AM'
    when extract(hour from ts at time zone 'UTC') between 11 and 15 then 'Midday'
    when extract(hour from ts at time zone 'UTC') between 16 and 19 then 'PM'
    else 'Night'
  end
$$;

-- Basket bands
create or replace function scout.basket_band(n int)
returns text language sql immutable as $$
  select case
    when n is null then 'unknown'
    when n <= 1 then '1'
    when n = 2 then '2'
    when n between 3 and 4 then '3-4'
    when n between 5 and 7 then '5-7'
    else '8+'
  end
$$;

-- Basket sizes per transaction
create or replace view scout.v_basket_sizes as
select
  transaction_id,
  count(*)::int                              as basket_size,
  sum(coalesce(peso_value,0))::double precision as basket_value
from scout.transactions
group by 1;

-- Materialized view with unified facts (per line, joined to basket)
drop materialized view if exists scout.mv_facts cascade;
create materialized view scout.mv_facts as
select
  date(t.timestamp)::date                         as d,
  extract(dow from t.timestamp)::int              as dow,
  (extract(dow from t.timestamp)::int in (0,6))   as is_weekend,
  scout.daypart_of(t.timestamp)                   as daypart,
  coalesce(t.product_category,'unknown')          as category,
  coalesce(t.brand_name,'unknown')                as brand,
  coalesce(t.age_bracket,'unknown')               as age_bracket,
  coalesce(t.gender,'unknown')                    as gender,
  coalesce(t.pack_size,'unknown')                 as pack_size,
  coalesce(t.payment_method,'unknown')            as payment_method,
  coalesce(t.customer_type,'unknown')             as customer_type,
  t.transaction_id,
  bs.basket_size,
  bs.basket_value,
  sum(coalesce(t.peso_value,0))::double precision   as line_value,
  count(*)::int                                     as line_count
from scout.transactions t
left join scout.v_basket_sizes bs using (transaction_id)
group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14;

-- Performance indexes
create index if not exists mv_facts_daypart_category_idx on scout.mv_facts (daypart, category);
create index if not exists mv_facts_daypart_brand_idx    on scout.mv_facts (daypart, brand);
create index if not exists mv_facts_category_age_idx     on scout.mv_facts (category, age_bracket);
create index if not exists mv_facts_payment_gender_idx   on scout.mv_facts (payment_method, gender);
create index if not exists mv_facts_d_idx                on scout.mv_facts (d);
create index if not exists mv_facts_dow_weekend_idx      on scout.mv_facts (dow, is_weekend);
create index if not exists mv_facts_tx_idx               on scout.mv_facts (transaction_id);

-- Grants (views are not RLS-governed; we restrict to authenticated)
grant usage on schema scout to authenticated;
grant select on scout.mv_facts, scout.v_basket_sizes, scout.transactions to authenticated;

-- Enable pg_cron & schedule a 10-min refresh
create extension if not exists pg_cron with schema extensions;

-- Remove existing schedule if exists and add new one
select cron.unschedule('refresh_mv_facts_10min') where exists (
  select 1 from cron.job where jobname = 'refresh_mv_facts_10min'
);

select cron.schedule(
  'refresh_mv_facts_10min',
  '*/10 * * * *',
  'refresh materialized view concurrently scout.mv_facts'
);

-- Initial refresh now
refresh materialized view concurrently scout.mv_facts;