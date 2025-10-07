-- ===========================================================
-- Scout v5.2 — Brands Dictionary + Products Catalog
-- ===========================================================
set check_function_bodies = off;

create schema if not exists masterdata;

-- ======================================
-- Brands Dictionary
-- ======================================
create table if not exists masterdata.scout_brands (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  brand_name  text not null unique,
  company     text,
  category    text,           -- high-level (Snacks, Dairy, Tobacco, etc.)
  region      text default 'PH',
  metadata    jsonb not null default '{}'::jsonb
);

create index if not exists idx_brands_name on masterdata.brands (brand_name);

-- ======================================
-- Products Catalog
-- ======================================
create table if not exists masterdata.scout_products (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  brand_id     uuid not null references masterdata.brands(id) on delete cascade,
  product_name text not null,
  category     text,
  subcategory  text,
  pack_size    text,     -- e.g. "180ml", "20s pack"
  upc          text,
  metadata     jsonb not null default '{}'::jsonb
);

create index if not exists idx_products_brand on masterdata.products (brand_id);
create index if not exists idx_products_name on masterdata.products (product_name);

-- ======================================
-- Link to Isko sku_summary
-- ======================================
alter table if exists deep_research.sku_summary
  add column if not exists brand_id uuid references masterdata.brands(id) on delete set null;

-- optional: keep text brand_name for fallback
alter table if exists deep_research.sku_summary
  add column if not exists brand_name text;

-- sync trigger: if brand_name is known, auto-populate brand_id
create or replace function deep_research.sync_sku_brand_scout()
returns trigger
language plpgsql
as $$
declare v_id uuid;
begin
  if NEW.brand_id is null and NEW.brand_name is not null then
    select id into v_id from masterdata.brands where lower(brand_name)=lower(NEW.brand_name) limit 1;
    if found then
      NEW.brand_id := v_id;
    end if;
  end if;
  return NEW;
end$$;

drop trigger if exists trg_sync_sku_brand on deep_research.sku_summary;
create trigger trg_sync_sku_brand
before insert or update on deep_research.sku_summary
for each row execute function deep_research.sync_sku_brand();

-- ======================================
-- RPCs
-- ======================================
-- List brands (search, pagination)
create or replace function masterdata.rpc_brands_list_scout(
  p_search text default null,
  p_limit int default 50,
  p_cursor timestamptz default null
)
returns table (
  id uuid,
  created_at timestamptz,
  brand_name text,
  company text,
  category text,
  region text,
  metadata jsonb
)
language sql
security definer
as $$
  select b.*
  from masterdata.brands b
  where (p_search is null or brand_name ilike '%'||p_search||'%')
    and (p_cursor is null or b.created_at < p_cursor)
  order by b.created_at desc
  limit greatest(1, least(p_limit,200));
$$;

grant execute on function masterdata.rpc_brands_list(text,int,timestamptz) to authenticated;

-- List products (search, filter by brand)
create or replace function masterdata.rpc_products_list_scout(
  p_brand_id uuid default null,
  p_search text default null,
  p_limit int default 50,
  p_cursor timestamptz default null
)
returns table (
  id uuid,
  created_at timestamptz,
  brand_id uuid,
  product_name text,
  category text,
  subcategory text,
  pack_size text,
  upc text,
  metadata jsonb
)
language sql
security definer
as $$
  select p.*
  from masterdata.products p
  where (p_brand_id is null or p.brand_id = p_brand_id)
    and (p_search is null or product_name ilike '%'||p_search||'%')
    and (p_cursor is null or p.created_at < p_cursor)
  order by p.created_at desc
  limit greatest(1, least(p_limit,200));
$$;

grant execute on function masterdata.rpc_products_list(uuid,text,int,timestamptz) to authenticated;

-- ======================================
-- Seed entries (TBWA FMCG + Tobacco clients)
-- ======================================
insert into masterdata.brands (brand_name, company, category)
values 
  ('Alaska', 'Alaska Milk Corp', 'Dairy'),
  ('Oishi', 'Liwayway Marketing', 'Snacks'),
  ('Del Monte', 'Del Monte Philippines', 'Beverages'),
  ('Peerless', 'Peerless Products', 'Cooking Oil / Condiments'),
  ('JTI', 'Japan Tobacco International', 'Tobacco')
on conflict (brand_name) do nothing;

-- Example product seeds (extend later with real SKUs)
insert into masterdata.products (brand_id, product_name, category, subcategory, pack_size)
select b.id, 'Alaska Evaporada 370ml', 'Dairy', 'Evaporated Milk', '370ml'
from masterdata.brands b where brand_name='Alaska'
on conflict do nothing;

insert into masterdata.products (brand_id, product_name, category, subcategory, pack_size)
select b.id, 'Oishi Prawn Crackers 60g', 'Snacks', 'Chips', '60g'
from masterdata.brands b where brand_name='Oishi'
on conflict do nothing;

insert into masterdata.products (brand_id, product_name, category, subcategory, pack_size)
select b.id, 'Del Monte Pineapple Juice 240ml', 'Beverages', 'Juice', '240ml'
from masterdata.brands b where brand_name='Del Monte'
on conflict do nothing;

insert into masterdata.products (brand_id, product_name, category, subcategory, pack_size)
select b.id, 'Golden Fiesta Canola Oil 1L', 'Cooking Oil', 'Canola Oil', '1L'
from masterdata.brands b where brand_name='Peerless'
on conflict do nothing;

insert into masterdata.products (brand_id, product_name, category, subcategory, pack_size)
select b.id, 'Mild Seven Blue 20s', 'Tobacco', 'Cigarettes', '20 sticks'
from masterdata.brands b where brand_name='JTI'
on conflict do nothing;