-- ===========================================================
-- Scout v5.2 — Import SKU Catalog from CSV
-- Depends on: 20250823_brands_products.sql
-- ===========================================================
set check_function_bodies = off;

create schema if not exists staging;
create schema if not exists masterdata;

-- ===========================================================
-- 1) Create staging table matching CSV structure
-- ===========================================================
create table if not exists staging.scout_sku_catalog_upload (
  product_key integer,
  sku text,
  product_name text,
  brand_id text,        -- mix of numeric and string IDs
  brand_name text,
  category_id text,     -- mix of numeric and string IDs
  category_name text,
  pack_size text,
  unit_type text,
  list_price numeric,
  barcode text,
  manufacturer text,
  is_active boolean,
  halal_certified text, -- mix of boolean and empty
  product_description text,
  price_source text,
  created_at timestamp
);

-- ===========================================================
-- 2) Brand ID mapping table (for legacy numeric/string IDs)
-- ===========================================================
create table if not exists masterdata.scout_brand_id_map (
  legacy_id text primary key,
  brand_uuid uuid not null references masterdata.brands(id),
  created_at timestamptz default now()
);

create index if not exists idx_brand_id_map_uuid on masterdata.brand_id_map(brand_uuid);

-- ===========================================================
-- 3) Synthetic UPC generator (from previous migration)
-- ===========================================================
create or replace function masterdata.synthetic_upc_scout(p_text text)
returns text
language sql
immutable
as $$
  -- Build a stable 12-digit base from hash, then append checksum (mod 10)
  with h as (
    select abs(hashtextextended(p_text,42))::bigint as hv
  )
  , d as (
    select lpad((hv % 100000000000)::text,12,'0') as base from h
  )
  , c as (
    -- simple Luhn-like checksum (not exact EAN but stable)
    select base,
           (sum((substr(base,i,1))::int * case when (i % 2)=0 then 3 else 1 end) over ())
           as s
    from d, generate_series(1,12) i
  )
  select (select base from d) || ((10 - (max(s) % 10)) % 10)::text
  from c;
$$;

-- ===========================================================
-- 4) Import function - processes staging data into masterdata
-- ===========================================================
create or replace function masterdata.import_sku_catalog_scout()
returns table(brands_imported int, products_imported int)
language plpgsql
security definer
as $$
declare
  v_brands_count int := 0;
  v_products_count int := 0;
  r record;
  v_brand_uuid uuid;
  v_upc text;
begin
  -- Step 1: Import unique brands
  for r in 
    select distinct 
      brand_id as legacy_id,
      brand_name,
      manufacturer,
      max(created_at) as created_at
    from staging.sku_catalog_upload
    where brand_name is not null
    group by brand_id, brand_name, manufacturer
  loop
    -- Check if brand exists
    select id into v_brand_uuid
    from masterdata.brands
    where lower(brand_name) = lower(r.brand_name)
    limit 1;
    
    if v_brand_uuid is null then
      -- Create new brand
      insert into masterdata.brands (brand_name, company, region, metadata)
      values (
        r.brand_name, 
        coalesce(r.manufacturer, r.brand_name), 
        'PH',
        jsonb_build_object(
          'legacy_id', r.legacy_id,
          'imported_at', now(),
          'source', 'sku_catalog_csv'
        )
      )
      returning id into v_brand_uuid;
      
      v_brands_count := v_brands_count + 1;
    end if;
    
    -- Map legacy ID to UUID
    insert into masterdata.brand_id_map (legacy_id, brand_uuid)
    values (r.legacy_id, v_brand_uuid)
    on conflict (legacy_id) do update
    set brand_uuid = excluded.brand_uuid;
  end loop;
  
  -- Step 2: Import products
  for r in
    select 
      s.*,
      m.brand_uuid
    from staging.sku_catalog_upload s
    join masterdata.brand_id_map m on m.legacy_id = s.brand_id
    where s.product_name is not null
  loop
    -- Generate UPC if missing
    if r.barcode = 'UNKNOWN' or r.barcode is null then
      v_upc := masterdata.synthetic_upc(r.brand_name || ':' || r.product_name || ':' || coalesce(r.pack_size,''));
    else
      v_upc := r.barcode;
    end if;
    
    -- Insert product
    insert into masterdata.products (
      brand_id,
      product_name,
      category,
      subcategory,
      pack_size,
      upc,
      metadata
    )
    values (
      r.brand_uuid,
      r.product_name,
      r.category_name,
      r.unit_type,  -- using unit_type as subcategory
      r.pack_size,
      v_upc,
      jsonb_build_object(
        'sku', r.sku,
        'product_key', r.product_key,
        'list_price', r.list_price,
        'is_active', r.is_active,
        'halal_certified', case 
          when lower(r.halal_certified) = 'true' then true
          when lower(r.halal_certified) = 'false' then false
          else null
        end,
        'product_description', r.product_description,
        'price_source', r.price_source,
        'original_created_at', r.created_at,
        'imported_at', now()
      )
    )
    on conflict (brand_id, product_name) do update
    set 
      category = excluded.category,
      subcategory = excluded.subcategory,
      pack_size = excluded.pack_size,
      upc = case when products.upc = 'UNKNOWN' then excluded.upc else products.upc end,
      metadata = products.metadata || excluded.metadata;
    
    v_products_count := v_products_count + 1;
  end loop;
  
  return query select v_brands_count, v_products_count;
end;
$$;

-- ===========================================================
-- 5) Data quality views
-- ===========================================================
create or replace view masterdata.v_catalog_summary as
select 
  b.brand_name,
  count(distinct p.id) as product_count,
  count(distinct p.category) as category_count,
  count(distinct case when p.upc not like '_%000%' then p.upc end) as real_barcode_count,
  count(distinct case when p.upc like '_%000%' then p.upc end) as synthetic_upc_count,
  min(p.created_at) as first_product_added,
  max(p.created_at) as last_product_added
from masterdata.brands b
left join masterdata.products p on p.brand_id = b.id
group by b.id, b.brand_name
order by product_count desc;

-- ===========================================================
-- 6) Helper to load CSV data (manual step or via script)
-- ===========================================================
-- Option A: Use Supabase dashboard CSV import into staging.sku_catalog_upload
-- Option B: Use psql \copy command:
-- \copy staging.sku_catalog_upload from '/path/to/sku_catalog_with_telco_filled.csv' csv header;
-- Option C: Use the import script below

-- ===========================================================
-- 7) Verification queries
-- ===========================================================
create or replace function masterdata.verify_catalog_import_scout()
returns table(
  check_name text,
  result text
)
language sql
security definer
as $$
  select 'Staging rows' as check_name, 
         count(*)::text || ' rows' as result
  from staging.sku_catalog_upload
  
  union all
  
  select 'Unique brands in staging',
         count(distinct brand_name)::text || ' brands'
  from staging.sku_catalog_upload
  
  union all
  
  select 'Brands imported',
         count(*)::text || ' brands'
  from masterdata.brands
  
  union all
  
  select 'Products imported',
         count(*)::text || ' products'  
  from masterdata.products
  
  union all
  
  select 'Products with real barcodes',
         count(*)::text || ' products'
  from masterdata.products
  where upc not like '_%000%' and upc != 'UNKNOWN'
  
  union all
  
  select 'TBWA client products',
         count(*)::text || ' products'
  from masterdata.products
  where metadata->>'price_source' like 'TBWA client%';
$$;