-- === Minimal Working Analytics System ===
-- Simplified version that works with existing schema

-- === CORE ANALYTICS MATERIALIZED VIEW ===
create materialized view scout.mv_facts as
select
  -- Temporal dimensions
  date(timestamp) as d,
  extract(year from timestamp)::int as year,
  extract(month from timestamp)::int as month,
  extract(dow from timestamp)::int as dow,
  (extract(dow from timestamp)::int in (0,6)) as is_weekend,
  case
    when extract(hour from timestamp) between 5 and 10 then 'Morning'
    when extract(hour from timestamp) between 11 and 15 then 'Midday'
    when extract(hour from timestamp) between 16 and 19 then 'Afternoon'
    else 'Evening'
  end as daypart,
  
  -- Product dimensions
  coalesce(product_category, 'Unknown') as category,
  coalesce(brand_name, 'Unknown') as brand,
  coalesce(sku, 'Unknown') as pack_size,
  
  -- Customer dimensions  
  coalesce(age_bracket::text, 'unknown') as age_bracket,
  coalesce(gender::text, 'unknown') as gender,
  coalesce(payment_method::text, 'other') as payment_method,
  coalesce(customer_type::text, 'other') as customer_type,
  
  -- Location dimensions
  store_id::text as store_id,
  
  -- Transaction facts
  id as transaction_id,
  coalesce(basket_size, 1) as basket_size,
  peso_value as basket_value,
  case
    when basket_size is null then 'Unknown'
    when basket_size <= 1 then 'Single'
    when basket_size = 2 then 'Pair'
    when basket_size between 3 and 5 then 'Small'
    when basket_size between 6 and 10 then 'Medium'
    else 'Large'
  end as basket_band,
  
  -- Metrics
  peso_value as line_value,
  1 as line_count

from silver.transactions_cleaned
where timestamp >= '2024-01-01'::date 
  and timestamp is not null;

-- === PERFORMANCE INDEXES ===
create unique index mv_facts_unique_idx on scout.mv_facts (transaction_id, d);
create index mv_facts_temporal_idx on scout.mv_facts (d, year, month);
create index mv_facts_daypart_category_idx on scout.mv_facts (daypart, category);
create index mv_facts_brand_category_idx on scout.mv_facts (brand, category);
create index mv_facts_customer_idx on scout.mv_facts (age_bracket, gender, customer_type);

-- === PERMISSIONS ===
grant select on scout.mv_facts to authenticated;

-- === INITIAL LOAD ===
refresh materialized view scout.mv_facts;

-- === VALIDATION ===
do $$
declare
  facts_count integer;
begin
  select count(*) into facts_count from scout.mv_facts;
  raise notice 'Analytics Facts loaded: % records', facts_count;
  
  if facts_count = 0 then
    raise warning 'No facts data loaded';
  end if;
end $$;