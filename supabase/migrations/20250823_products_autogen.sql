-- ===========================================================
-- Scout v5.2 — Auto-generate expanded product catalog
-- Depends on: 20250823_brands_products.sql (brands/products)
-- ===========================================================
set check_function_bodies = off;

create schema if not exists masterdata;

-- 1) Safety/quality constraints
-- Unique product_name within brand
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='masterdata' and indexname='uq_products_brand_product_name'
  ) then
    create unique index uq_products_brand_product_name
      on masterdata.products(brand_id, product_name);
  end if;
end$$;

-- 2) Deterministic UPC generator (synthetic EAN-13 style)
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

-- 3) Autogen function:
--    - Expands base products x flavors x sizes into distinct SKUs
--    - Builds clean product_name like "Prawn Crackers Chili 60g" or "Evaporada 370ml"
--    - Inserts if missing (upsert by (brand_id, product_name))
create or replace function masterdata.generate_catalog_scout(
  p_brand_name text,
  p_category   text,
  p_subcategory text,
  p_base_products text[],     -- e.g. '{Evaporada, Condensada}'
  p_flavors    text[],        -- e.g. '{Original, Chocolate, Strawberry}' or '{}' for none
  p_sizes      text[],        -- e.g. '{60g,100g,120g}' or volumes '{180ml,370ml,1L}'
  p_pack_opts  text[] default '{}'::text[],  -- e.g. '{Singles,6-pack,12-pack}'
  p_limit_per_base int default 0             -- 0 = all combos; >0 cap per base variant
)
returns integer
language plpgsql
security definer
as $$
declare
  v_brand_id uuid;
  v_inserted int := 0;
  b text; f text; s text; pk text;
  display_name text;
  upc text;
  combos int := 0;
begin
  -- resolve brand
  select id into v_brand_id
  from masterdata.brands
  where lower(brand_name)=lower(p_brand_name)
  limit 1;

  if v_brand_id is null then
    raise exception 'Brand % not found in masterdata.brands', p_brand_name;
  end if;

  -- generate combinations
  foreach b in array p_base_products loop
    combos := 0;
    if array_length(p_flavors,1) is null or array_length(p_flavors,1) = 0 then
      -- no flavors, just sizes x packs
      foreach s in array coalesce(p_sizes, array['']) loop
        if array_length(p_pack_opts,1) is null or array_length(p_pack_opts,1) = 0 then
          display_name := trim(b || ' ' || s);
          upc := masterdata.synthetic_upc(p_brand_name || ':' || display_name);
          insert into masterdata.products(brand_id, product_name, category, subcategory, pack_size, upc, metadata)
          values (v_brand_id, display_name, p_category, p_subcategory, s, upc, jsonb_build_object('auto',true))
          on conflict (brand_id, product_name) do nothing;
          if found then v_inserted := v_inserted + 1; end if;
          combos := combos + 1;
          if p_limit_per_base > 0 and combos >= p_limit_per_base then exit; end if;
        else
          foreach pk in array p_pack_opts loop
            display_name := trim(b || ' ' || s || ' ' || pk);
            upc := masterdata.synthetic_upc(p_brand_name || ':' || display_name);
            insert into masterdata.products(brand_id, product_name, category, subcategory, pack_size, upc, metadata)
            values (v_brand_id, display_name, p_category, p_subcategory, trim(s || ' ' || pk), upc, jsonb_build_object('auto',true))
            on conflict (brand_id, product_name) do nothing;
            if found then v_inserted := v_inserted + 1; end if;
            combos := combos + 1;
            if p_limit_per_base > 0 and combos >= p_limit_per_base then exit; end if;
          end loop;
        end if;
      end loop;
    else
      -- flavors present
      foreach f in array p_flavors loop
        foreach s in array coalesce(p_sizes, array['']) loop
          if array_length(p_pack_opts,1) is null or array_length(p_pack_opts,1) = 0 then
            display_name := trim(b || ' ' || f || ' ' || s);
            upc := masterdata.synthetic_upc(p_brand_name || ':' || display_name);
            insert into masterdata.products(brand_id, product_name, category, subcategory, pack_size, upc, metadata)
            values (v_brand_id, display_name, p_category, p_subcategory, s, upc, jsonb_build_object('flavor',f,'auto',true))
            on conflict (brand_id, product_name) do nothing;
            if found then v_inserted := v_inserted + 1; end if;
            combos := combos + 1;
            if p_limit_per_base > 0 and combos >= p_limit_per_base then exit; end if;
          else
            foreach pk in array p_pack_opts loop
              display_name := trim(b || ' ' || f || ' ' || s || ' ' || pk);
              upc := masterdata.synthetic_upc(p_brand_name || ':' || display_name);
              insert into masterdata.products(brand_id, product_name, category, subcategory, pack_size, upc, metadata)
              values (v_brand_id, display_name, p_category, p_subcategory, trim(s || ' ' || pk), upc, jsonb_build_object('flavor',f,'auto',true))
              on conflict (brand_id, product_name) do nothing;
              if found then v_inserted := v_inserted + 1; end if;
              combos := combos + 1;
              if p_limit_per_base > 0 and combos >= p_limit_per_base then exit; end if;
            end loop;
          end if;
        end loop;
      end loop;
    end if;
  end loop;

  return v_inserted;
end;
$$;

-- 4) Convenience wrappers for your 5 key brands (kept as SQL constants; safe to re-run)
-- Alaska (Dairy)
create or replace function masterdata.generate_alaska_catalog_scout()
returns integer
language plpgsql
security definer
as $$
declare n int := 0;
begin
  n := n + masterdata.generate_catalog(
    'Alaska','Dairy','Evaporated Milk',
    ARRAY['Evaporada'],
    ARRAY[]::text[],
    ARRAY['370ml','300ml','155ml'],
    ARRAY['Singles','6-pack','12-pack'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Alaska','Dairy','Condensed Milk',
    ARRAY['Condensada'],
    ARRAY['Original','Chocolate','Strawberry'],
    ARRAY['300ml','180ml'],
    ARRAY['Singles','6-pack'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Alaska','Dairy','UHT Milk',
    ARRAY['Classic','Fortified'],
    ARRAY[]::text[],
    ARRAY['1L','250ml'],
    ARRAY['Singles','6-pack'],
    0
  );
  return n;
end$$;

-- Oishi (Snacks)
create or replace function masterdata.generate_oishi_catalog_scout()
returns integer
language plpgsql
security definer
as $$
declare n int := 0;
begin
  n := n + masterdata.generate_catalog(
    'Oishi','Snacks','Prawn Crackers',
    ARRAY['Prawn Crackers'],
    ARRAY['Original','Spicy','Chili','Garlic'],
    ARRAY['30g','60g','100g'],
    ARRAY['Singles','6-pack','12-pack'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Oishi','Snacks','Pillows',
    ARRAY['Pillows'],
    ARRAY['Chocolate','Ube','Milk','Mocha'],
    ARRAY['40g','110g'],
    ARRAY['Singles','6-pack'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Oishi','Snacks','Ridges',
    ARRAY['Ridges Potato Chips'],
    ARRAY['Sour Cream','Barbecue','Cheese'],
    ARRAY['55g','100g'],
    ARRAY['Singles','6-pack'],
    0
  );
  return n;
end$$;

-- Del Monte (Beverages)
create or replace function masterdata.generate_delmonte_catalog_scout()
returns integer
language plpgsql
security definer
as $$
declare n int := 0;
begin
  n := n + masterdata.generate_catalog(
    'Del Monte','Beverages','Pineapple Juice',
    ARRAY['Pineapple Juice'],
    ARRAY['100%','Light','Fiber'],
    ARRAY['240ml','1L'],
    ARRAY['Singles','6-pack','12-pack'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Del Monte','Beverages','Juice Drink',
    ARRAY['Four Seasons','Mango','Orange'],
    ARRAY[]::text[],
    ARRAY['240ml','1L'],
    ARRAY['Singles','6-pack'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Del Monte','Culinary','Tomato Sauce',
    ARRAY['Tomato Sauce'],
    ARRAY['Original','Italian Style','Sweet Style'],
    ARRAY['200g','250g','1kg'],
    ARRAY['Singles','6-pack'],
    0
  );
  return n;
end$$;

-- Peerless (Cooking Oils/Condiments)
create or replace function masterdata.generate_peerless_catalog_scout()
returns integer
language plpgsql
security definer
as $$
declare n int := 0;
begin
  n := n + masterdata.generate_catalog(
    'Peerless','Cooking Oil','Canola Oil',
    ARRAY['Golden Fiesta Canola Oil'],
    ARRAY[]::text[],
    ARRAY['500ml','1L','2L','5L'],
    ARRAY['Singles'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Peerless','Cooking Oil','Palm Oil',
    ARRAY['Golden Fiesta Palm Oil'],
    ARRAY[]::text[],
    ARRAY['1L','2L','5L'],
    ARRAY['Singles'],
    0
  );
  n := n + masterdata.generate_catalog(
    'Peerless','Condiments','Mayonnaise',
    ARRAY['Golden Fiesta Mayo'],
    ARRAY['Original','Lite'],
    ARRAY['220ml','470ml','1L'],
    ARRAY['Singles'],
    0
  );
  return n;
end$$;

-- JTI (Tobacco)
create or replace function masterdata.generate_jti_catalog_scout()
returns integer
language plpgsql
security definer
as $$
declare n int := 0;
begin
  n := n + masterdata.generate_catalog(
    'JTI','Tobacco','Cigarettes',
    ARRAY['Winston','Mild Seven','Camel'],
    ARRAY['Blue','Gold','Menthol'],
    ARRAY['20s','10s'],
    ARRAY[]::text[],
    0
  );
  n := n + masterdata.generate_catalog(
    'JTI','Tobacco','Heated',
    ARRAY['Ploom'],
    ARRAY['Tobacco','Menthol'],
    ARRAY['Pods'],
    ARRAY[]::text[],
    0
  );
  return n;
end$$;

-- 5) Master "generate all" wrapper for your 5 brands
create or replace function masterdata.generate_client_catalogs_scout()
returns table(brand text, inserted int)
language plpgsql
security definer
as $$
begin
  return query
  select 'Alaska'::text, masterdata.generate_alaska_catalog()
  union all select 'Oishi', masterdata.generate_oishi_catalog()
  union all select 'Del Monte', masterdata.generate_delmonte_catalog()
  union all select 'Peerless', masterdata.generate_peerless_catalog()
  union all select 'JTI', masterdata.generate_jti_catalog();
end$$;

-- 6) Additional competitor brands generator
create or replace function masterdata.generate_competitor_catalogs_scout()
returns table(brand text, inserted int)
language plpgsql
security definer
as $$
declare
  n int := 0;
  total int := 0;
begin
  -- Ensure competitor brands exist
  insert into masterdata.brands (brand_name, company, category, region)
  values 
    ('Jack n Jill', 'URC', 'Snacks', 'PH'),
    ('Lucky Me', 'Monde Nissin', 'Instant Noodles', 'PH'),
    ('Nissin', 'Nissin-Universal Robina', 'Instant Noodles', 'PH'),
    ('Selecta', 'RFM-Unilever', 'Ice Cream', 'PH'),
    ('Magnolia', 'San Miguel', 'Dairy', 'PH')
  on conflict (brand_name) do nothing;
  
  -- Jack n Jill
  n := masterdata.generate_catalog(
    'Jack n Jill','Snacks','Chips',
    ARRAY['Piattos','Nova','V-Cut'],
    ARRAY['Cheese','Sour Cream','Barbecue'],
    ARRAY['40g','85g','150g'],
    ARRAY['Singles','6-pack'],
    0
  );
  total := total + n;
  
  -- Lucky Me
  n := masterdata.generate_catalog(
    'Lucky Me','Instant Noodles','Cup Noodles',
    ARRAY['Pancit Canton','Instant Mami','Cup Noodles'],
    ARRAY['Original','Sweet & Spicy','Chilimansi','Kalamansi'],
    ARRAY['60g','80g','Mini Pack'],
    ARRAY['Singles','6-pack'],
    0
  );
  total := total + n;
  
  return query
  select 'Competitors Total'::text, total;
end$$;