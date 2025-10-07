-- ===========================================================
-- Scout v5.2 — Agentic Analytics Scaffold (Ledger, Monitors, Contracts)
-- Idempotent, Supabase-safe
-- ===========================================================
set check_function_bodies = off;

-- ---------- Core schema + extensions ----------
create schema if not exists scout;
create extension if not exists pgcrypto;  -- for gen_random_uuid()

-- ---------- Enum types for governance ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type scout.approval_status as enum ('auto','manual','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'action_status') then
    create type scout.action_status as enum ('pending','success','failed');
  end if;
end$$;

-- ===========================================================
-- (A) ACTION LEDGER  (platinum write-path, gold remains read-path)
-- ===========================================================
create table if not exists scout.scout_platinum_agent_action_ledger (
  id               uuid primary key default gen_random_uuid(),
  ts               timestamptz not null default now(),
  agent            text not null,       -- e.g., 'ScoutAgent', 'LearnBot'
  user_id          uuid,                -- auth.uid() of requester (nullable for system)
  monitor          text,                -- optional: monitor name that triggered action
  hypothesis       text,                -- optional reasoning summary
  decision         text not null,       -- structured natural language decision
  action_type      text not null,       -- e.g., 'create_insight','schedule_ab_test','open_ticket'
  action_payload   jsonb not null default '{}'::jsonb,
  approval_status  scout.approval_status not null default 'manual',
  rollback_ref     uuid,                -- to reference a prior ledger id
  verify_after     interval not null default interval '7 days',
  success_criteria jsonb,               -- e.g., {"kpi":"ROI","delta":">=2%","window":"7d"}
  status           scout.action_status not null default 'pending'
);

-- Helpful indexes
create index if not exists idx_ledger_ts         on scout.platinum_agent_action_ledger (ts desc);
create index if not exists idx_ledger_status     on scout.platinum_agent_action_ledger (status);
create index if not exists idx_ledger_monitor    on scout.platinum_agent_action_ledger (monitor);
create index if not exists idx_ledger_user       on scout.platinum_agent_action_ledger (user_id);

-- RLS: restrict direct row visibility; service_role writes; authenticated reads own rows
alter table scout.platinum_agent_action_ledger enable row level security;

-- Drop existing policies (if re-running) and recreate cleanly
do $$
begin
  if exists (select 1 from pg_policies where schemaname='scout' and tablename='platinum_agent_action_ledger' and policyname='ledger_select_own') then
    drop policy "ledger_select_own" on scout.platinum_agent_action_ledger;
  end if;
  if exists (select 1 from pg_policies where schemaname='scout' and tablename='platinum_agent_action_ledger' and policyname='ledger_insert_service_role') then
    drop policy "ledger_insert_service_role" on scout.platinum_agent_action_ledger;
  end if;
  if exists (select 1 from pg_policies where schemaname='scout' and tablename='platinum_agent_action_ledger' and policyname='ledger_update_service_role') then
    drop policy "ledger_update_service_role" on scout.platinum_agent_action_ledger;
  end if;
end$$;

create policy "ledger_select_own"
on scout.platinum_agent_action_ledger
for select
to authenticated
using (user_id = auth.uid());

-- Only service role may insert/update (agents run via server-side)
create policy "ledger_insert_service_role"
on scout.platinum_agent_action_ledger
for insert
to service_role
with check (true);

create policy "ledger_update_service_role"
on scout.platinum_agent_action_ledger
for update
to service_role
using (true)
with check (true);

-- ===========================================================
-- (B) MONITORS: definitions + events + runner
-- ===========================================================
create table if not exists scout.scout_platinum_monitors (
  id              bigserial primary key,
  name            text not null unique,
  sql             text not null,        -- must select rows to signal an event
  threshold       numeric not null default 1.0,
  window_minutes  integer not null default 60,
  is_enabled      boolean not null default true,
  last_run_at     timestamptz
);

create table if not exists scout.scout_platinum_monitor_events (
  id           uuid primary key default gen_random_uuid(),
  monitor_id   bigint not null references scout.platinum_monitors(id) on delete cascade,
  occurred_at  timestamptz not null default now(),
  payload      jsonb not null,      -- aggregated rows from the monitor's SQL
  severity     text not null default 'info',
  acknowledged boolean not null default false
);

create index if not exists idx_monitor_events_time on scout.platinum_monitor_events (occurred_at desc);
create index if not exists idx_monitor_events_mid  on scout.platinum_monitor_events (monitor_id);

-- Runner: executes each enabled monitor; inserts one event with aggregated payload if any rows returned
create or replace function scout.run_monitors_scout()
returns integer
language plpgsql
security definer
set search_path = scout, public
as $$
declare
  r     record;
  cnt   int := 0;
  res   jsonb;
begin
  for r in select * from scout.platinum_monitors where is_enabled loop
    -- Wrap monitor SQL as a subquery and aggregate to a compact JSON payload
    execute format('
      select coalesce(jsonb_agg(t), ''[]''::jsonb)
      from (%s) as t
    ', r.sql)
    into res;

    if res is not null and res <> '[]'::jsonb then
      insert into scout.platinum_monitor_events (monitor_id, payload)
      values (r.id, res);
      cnt := cnt + 1;
    end if;

    update scout.platinum_monitors
       set last_run_at = now()
     where id = r.id;
  end loop;

  return cnt;
end
$$;

-- Seed 3 example monitors (safe re-run)
-- 1) Demand spike in last 60 minutes vs trailing window (requires scout.gold_sales_15min)
insert into scout.platinum_monitors (name, sql, threshold, window_minutes, is_enabled)
select 'demand_spike_brand',
$$
select brand,
       sum(units) as u_60m,
       1.5 * (
         select coalesce(avg(units),0)
         from scout.gold_sales_15min s2
         where s2.ts between now()-interval '7 day' and now()-interval '1 day'
           and s2.brand = s1.brand
       ) as spike_threshold
from scout.gold_sales_15min s1
where ts >= now() - interval '60 min'
group by brand
having sum(units) >
       1.5 * (
         select coalesce(avg(units),0)
         from scout.gold_sales_15min s2
         where s2.ts between now()-interval '7 day' and now()-interval '1 day'
           and s2.brand = s1.brand
       )
$$, 1.0, 60, true
on conflict (name) do nothing;

-- 2) Promo lift anomaly (requires gold_sales_daily with columns: date, brand, promo_flag, units)
insert into scout.platinum_monitors (name, sql, threshold, window_minutes, is_enabled)
select 'promo_lift_anomaly',
$$
with base as (
  select brand,
         avg(case when promo_flag then units end)      as units_promo,
         avg(case when not promo_flag then units end)  as units_no_promo
  from scout.gold_sales_daily
  where date >= current_date - interval '30 day'
  group by brand
)
select brand,
       units_promo, units_no_promo,
       case when units_no_promo > 0 then units_promo/units_no_promo else null end as promo_lift
from base
where (case when units_no_promo > 0 then units_promo/units_no_promo else 0 end) < 1.05
$$, 1.0, 1440, true
on conflict (name) do nothing;

-- 3) Share loss vs rival (requires gold_brand_share_daily with date, brand, share)
insert into scout.platinum_monitors (name, sql, threshold, window_minutes, is_enabled)
select 'share_loss_vs_rival',
$$
with w as (
  select date, brand, share,
         lag(share, 7) over (partition by brand order by date) as share_wk_ago
  from scout.gold_brand_share_daily
  where date >= current_date - interval '14 day'
)
select a.date, a.brand as focal_brand, a.share as focal_share,
       b.brand as rival_brand, b.share as rival_share,
       (a.share - a.share_wk_ago) as focal_d_change,
       (b.share - lag(b.share,7) over (partition by b.brand order by b.date)) as rival_d_change
from w a
join w b on a.date = b.date and a.brand <> b.brand
where (a.share - a.share_wk_ago) < -0.02
  and (b.share - lag(b.share,7) over (partition by b.brand order by b.date)) > 0.02
$$, 1.0, 1440, true
on conflict (name) do nothing;

-- ===========================================================
-- (C) GOLD-ONLY CONTRACT CHECKS  (config + violations + verifier)
-- ===========================================================
create table if not exists scout.scout_gold_contracts (
  id              bigserial primary key,
  table_name      text not null,            -- e.g., 'scout.gold_sales_daily'
  column_name     text,                     -- nullable for custom checks
  check_type      text not null,            -- 'not_null' | 'positive' | 'unique' | 'custom'
  check_expression text,                    -- for 'custom': SQL that returns violating rows
  severity        text not null default 'error', -- 'warn' | 'error'
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists scout.scout_contract_violations (
  id            uuid primary key default gen_random_uuid(),
  detected_at   timestamptz not null default now(),
  table_name    text not null,
  column_name   text,
  check_type    text not null,
  row_count     bigint not null,
  sample_rows   jsonb,
  severity      text not null default 'error'
);

-- Upsert a few canonical contract rows (adjust for your schema)
insert into scout.gold_contracts (table_name, column_name, check_type, is_active)
select 'scout.gold_sales_daily','date','not_null',true
where not exists (select 1 from scout.gold_contracts where table_name='scout.gold_sales_daily' and column_name='date');

insert into scout.gold_contracts (table_name, column_name, check_type, is_active)
select 'scout.gold_sales_daily','store_id','not_null',true
where not exists (select 1 from scout.gold_contracts where table_name='scout.gold_sales_daily' and column_name='store_id');

insert into scout.gold_contracts (table_name, column_name, check_type, is_active)
select 'scout.gold_sales_daily','brand','not_null',true
where not exists (select 1 from scout.gold_contracts where table_name='scout.gold_sales_daily' and column_name='brand');

insert into scout.gold_contracts (table_name, column_name, check_type, is_active)
select 'scout.gold_sales_daily','qty','positive',true
where not exists (select 1 from scout.gold_contracts where table_name='scout.gold_sales_daily' and column_name='qty');

insert into scout.gold_contracts (table_name, column_name, check_type, is_active)
select 'scout.gold_sales_daily','net_amount','positive',true
where not exists (select 1 from scout.gold_contracts where table_name='scout.gold_sales_daily' and column_name='net_amount');

-- Verifier: scans config, inserts violations into contract_violations, returns total violations found
create or replace function scout.verify_gold_contracts_scout()
returns integer
language plpgsql
security definer
set search_path = scout, public
as $$
declare
  r          record;
  v_sql      text;
  v_cnt      bigint;
  v_sample   jsonb;
  total_cnt  int := 0;
begin
  for r in select * from scout.gold_contracts where is_active loop
    if r.check_type = 'not_null' then
      v_sql := format('select count(*) from %s where %I is null', r.table_name, r.column_name);
      execute v_sql into v_cnt;

      if v_cnt > 0 then
        execute format($q$select coalesce(jsonb_agg(t),'[]'::jsonb)
                       from (select * from %s where %I is null limit 10) t$q$, r.table_name, r.column_name)
        into v_sample;

        insert into scout.contract_violations(table_name,column_name,check_type,row_count,sample_rows,severity)
        values (r.table_name, r.column_name, r.check_type, v_cnt, v_sample, coalesce(r.severity,'error'));
        total_cnt := total_cnt + v_cnt;
      end if;

    elsif r.check_type = 'positive' then
      v_sql := format('select count(*) from %s where %I <= 0', r.table_name, r.column_name);
      execute v_sql into v_cnt;

      if v_cnt > 0 then
        execute format($q$select coalesce(jsonb_agg(t),'[]'::jsonb)
                       from (select * from %s where %I <= 0 limit 10) t$q$, r.table_name, r.column_name)
        into v_sample;

        insert into scout.contract_violations(table_name,column_name,check_type,row_count,sample_rows,severity)
        values (r.table_name, r.column_name, r.check_type, v_cnt, v_sample, coalesce(r.severity,'error'));
        total_cnt := total_cnt + v_cnt;
      end if;

    elsif r.check_type = 'unique' then
      -- duplicates detector
      v_sql := format($q$
        with d as (
          select %1$I, count(*) c
          from %2$s
          group by %1$I
          having count(*) > 1
        )
        select coalesce(sum(c),0) from d
      $q$, r.column_name, r.table_name);
      execute v_sql into v_cnt;

      if v_cnt > 0 then
        execute format($q$select coalesce(jsonb_agg(t),'[]'::jsonb)
                       from (
                         select %1$I, count(*) c
                         from %2$s
                         group by %1$I
                         having count(*) > 1
                         limit 10
                       ) t$q$, r.column_name, r.table_name)
        into v_sample;

        insert into scout.contract_violations(table_name,column_name,check_type,row_count,sample_rows,severity)
        values (r.table_name, r.column_name, r.check_type, v_cnt, v_sample, coalesce(r.severity,'error'));
        total_cnt := total_cnt + v_cnt;
      end if;

    elsif r.check_type = 'custom' and r.check_expression is not null then
      -- expect r.check_expression to be a SELECT returning violating rows
      execute format('select count(*) from (%s) _x', r.check_expression) into v_cnt;

      if v_cnt > 0 then
        execute format('select coalesce(jsonb_agg(_x),''[]''::jsonb) from (%s limit 10) _x', r.check_expression)
        into v_sample;

        insert into scout.contract_violations(table_name,column_name,check_type,row_count,sample_rows,severity)
        values (r.table_name, r.column_name, r.check_type, v_cnt, v_sample, coalesce(r.severity,'error'));
        total_cnt := total_cnt + v_cnt;
      end if;
    end if;
  end loop;

  return total_cnt;
end
$$;

-- ===========================================================
-- (D) GOLD-ONLY ACCESS ENFORCER (optional helper)
--   Revokes table privileges from anon/authenticated for non-GOLD,
--   grants SELECT on GOLD_* to authenticated; keeps ledger write to service_role.
-- ===========================================================
create or replace function scout.enforce_gold_only_access_ces()
returns void
language plpgsql
security definer
as $$
declare
  t record;
begin
  -- revoke on all scout tables for anon/authenticated
  for t in
    select schemaname, tablename
    from pg_tables
    where schemaname='scout'
  loop
    execute format('revoke all on table %I.%I from anon, authenticated', t.schemaname, t.tablename);
  end loop;

  -- grant SELECT on GOLD_* back to authenticated; (no anon by default)
  for t in
    select schemaname, tablename
    from pg_tables
    where schemaname='scout' and tablename like 'gold_%'
  loop
    execute format('grant select on table %I.%I to authenticated', t.schemaname, t.tablename);
    -- ensure RLS on GOLD tables (read only)
    execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
    -- create permissive select policy if absent
    if not exists (
      select 1 from pg_policies p
      where p.schemaname = t.schemaname
        and p.tablename = t.tablename
        and p.policyname = 'gold_select_authenticated'
    ) then
      execute format($p$create policy "gold_select_authenticated"
                     on %I.%I for select to authenticated using (true)$p$, t.schemaname, t.tablename);
    end if;
  end loop;

  -- Ledger rights (already handled via policies above): service_role insert/update only.
end
$$;

-- Optionally run once on deploy:
-- select scout.enforce_gold_only_access();

-- ===========================================================
-- END
-- ===========================================================-- ===========================================================
-- Scout v5.2 — Isko Deep Research + Agent Feed + RPCs
-- ===========================================================
set check_function_bodies = off;

create schema if not exists scout;
create schema if not exists deep_research;

create extension if not exists pgcrypto;

-- =========================
-- Agent Feed (UI inbox)
-- =========================
create table if not exists scout.scout_agent_feed (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  severity     text not null default 'info', -- info|warn|error|success
  source       text not null,                -- 'monitor', 'contract_check', 'isko'
  title        text not null,
  description  text,
  payload      jsonb not null default '{}'::jsonb, -- raw event (monitor rows, violations, job meta)
  related_ids  jsonb not null default '[]'::jsonb, -- e.g., ["monitor_events:id", "ledger:id"]
  status       text not null default 'new'          -- new|read|archived
);

create index if not exists idx_agent_feed_created_at on scout.agent_feed (created_at desc);
create index if not exists idx_agent_feed_status on scout.agent_feed (status);

alter table scout.agent_feed enable row level security;
do $$
begin
  if exists (select 1 from pg_policies where schemaname='scout' and tablename='agent_feed') then
    -- reset
    drop policy if exists "agent_feed_read_auth" on scout.agent_feed;
    drop policy if exists "agent_feed_insert_srv" on scout.agent_feed;
    drop policy if exists "agent_feed_update_auth" on scout.agent_feed;
  end if;
end$$;

create policy "agent_feed_read_auth"
on scout.agent_feed for select
to authenticated using (true);

create policy "agent_feed_insert_srv"
on scout.agent_feed for insert
to service_role with check (true);

create policy "agent_feed_update_auth"
on scout.agent_feed for update
to authenticated using (true) with check (true);

-- ======================================
-- Isko: scraping job queue + SKU summary
-- ======================================
create table if not exists deep_research.scout_sku_jobs (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  scheduled_for  timestamptz not null default now(),  -- when allowed to run
  started_at     timestamptz,
  finished_at    timestamptz,
  status         text not null default 'queued',       -- queued|running|success|failed|dead
  priority       int not null default 100,             -- 0 = highest
  task_type      text not null default 'brand_sku_scrape', -- future-proof
  task_payload   jsonb not null,                       -- {brand:"", urls:[...], region:"", ...}
  attempts       int not null default 0,
  last_error     text
);

create index if not exists idx_sku_jobs_sched on deep_research.sku_jobs (status, scheduled_for, priority, created_at);

-- canonical output table (exists per your stack, ensure idempotence)
create table if not exists deep_research.scout_sku_summary (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  brand         text not null,
  sku_name      text not null,
  category      text,
  upc           text,
  size          text,
  pack          text,
  price_min     numeric,
  price_max     numeric,
  currency      text default 'PHP',
  image_url     text,
  source_url    text,
  meta          jsonb not null default '{}'::jsonb, -- attrs, embeddings, etc
  job_id        uuid references deep_research.sku_jobs(id) on delete set null
);

create index if not exists idx_sku_summary_brand on deep_research.sku_summary (brand);
create index if not exists idx_sku_summary_created on deep_research.sku_summary (created_at desc);

-- RLS for deep_research (read for authenticated; write by service_role)
alter table deep_research.sku_jobs    enable row level security;
alter table deep_research.sku_summary enable row level security;

do $$
begin
  -- reset policies if re-run
  perform 1;
  if exists (select 1 from pg_policies where schemaname='deep_research' and tablename='sku_jobs') then
    drop policy if exists "sku_jobs_read_auth" on deep_research.sku_jobs;
    drop policy if exists "sku_jobs_ins_srv"   on deep_research.sku_jobs;
    drop policy if exists "sku_jobs_upd_srv"   on deep_research.sku_jobs;
  end if;
  if exists (select 1 from pg_policies where schemaname='deep_research' and tablename='sku_summary') then
    drop policy if exists "sku_summary_read_auth" on deep_research.sku_summary;
    drop policy if exists "sku_summary_ins_srv"   on deep_research.sku_summary;
    drop policy if exists "sku_summary_upd_srv"   on deep_research.sku_summary;
  end if;
end$$;

create policy "sku_jobs_read_auth"   on deep_research.sku_jobs    for select to authenticated using (true);
create policy "sku_jobs_ins_srv"     on deep_research.sku_jobs    for insert to service_role with check (true);
create policy "sku_jobs_upd_srv"     on deep_research.sku_jobs    for update to service_role using (true) with check (true);
create policy "sku_summary_read_auth"on deep_research.sku_summary for select to authenticated using (true);
create policy "sku_summary_ins_srv"  on deep_research.sku_summary for insert to service_role with check (true);
create policy "sku_summary_upd_srv"  on deep_research.sku_summary for update to service_role using (true) with check (true);

-- ======================================
-- RPCs — keyset pagination (fast, stable)
-- ======================================

-- 1) Agent Feed list
create or replace function scout.rpc_agent_feed_list_scout(
  p_limit int default 50,
  p_cursor timestamptz default null, -- pass the last seen created_at
  p_status text default null          -- optional filter: new|read|archived
)
returns table (
  id uuid,
  created_at timestamptz,
  severity text,
  source text,
  title text,
  description text,
  payload jsonb,
  related_ids jsonb,
  status text
)
language sql
security definer
as $$
  select f.*
  from scout.agent_feed f
  where (p_status is null or f.status = p_status)
    and (p_cursor is null or f.created_at < p_cursor)
  order by f.created_at desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function scout.rpc_agent_feed_list(int, timestamptz, text) to authenticated;

-- 2) Monitor events (from earlier migration), paginated
create or replace function scout.rpc_monitor_events_list_scout(
  p_limit int default 50,
  p_cursor timestamptz default null,
  p_monitor_name text default null
)
returns table (
  id uuid,
  monitor_name text,
  occurred_at timestamptz,
  payload jsonb,
  severity text
)
language sql
security definer
as $$
  select e.id,
         m.name as monitor_name,
         e.occurred_at,
         e.payload,
         e.severity
  from scout.platinum_monitor_events e
  join scout.platinum_monitors m on m.id = e.monitor_id
  where (p_monitor_name is null or m.name = p_monitor_name)
    and (p_cursor is null or e.occurred_at < p_cursor)
  order by e.occurred_at desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function scout.rpc_monitor_events_list(int, timestamptz, text) to authenticated;

-- 3) SKU summary (Isko results), paginated
create or replace function deep_research.rpc_sku_summary_list_scout(
  p_brand text default null,
  p_limit int default 50,
  p_cursor timestamptz default null
)
returns table (
  id uuid,
  created_at timestamptz,
  brand text,
  sku_name text,
  category text,
  upc text,
  size text,
  pack text,
  price_min numeric,
  price_max numeric,
  currency text,
  image_url text,
  source_url text,
  meta jsonb
)
language sql
security definer
as $$
  select s.id, s.created_at, s.brand, s.sku_name, s.category, s.upc, s.size, s.pack,
         s.price_min, s.price_max, s.currency, s.image_url, s.source_url, s.meta
  from deep_research.sku_summary s
  where (p_brand is null or s.brand = p_brand)
    and (p_cursor is null or s.created_at < p_cursor)
  order by s.created_at desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function deep_research.rpc_sku_summary_list(text, int, timestamptz) to authenticated;

-- 4) Enqueue Isko jobs (server-only)
create or replace function deep_research.rpc_enqueue_sku_job_scout(p_payload jsonb, p_priority int default 100, p_run_after_minutes int default 0)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into deep_research.sku_jobs (priority, scheduled_for, task_payload)
  values (coalesce(p_priority,100), now() + make_interval(mins => greatest(0,p_run_after_minutes)), coalesce(p_payload,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end
$$;

revoke all on function deep_research.rpc_enqueue_sku_job(jsonb, int, int) from authenticated, anon;
grant execute on function deep_research.rpc_enqueue_sku_job(jsonb, int, int) to service_role;

-- ==============================
-- Helper: push events to feed
-- ==============================
create or replace function scout.push_feed_scout(
  p_severity text,
  p_source   text,
  p_title    text,
  p_desc     text,
  p_payload  jsonb,
  p_related  jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
as $$
declare v_id uuid;
begin
  insert into scout.agent_feed (severity, source, title, description, payload, related_ids)
  values (coalesce(p_severity,'info'), p_source, p_title, p_desc, coalesce(p_payload,'{}'::jsonb), coalesce(p_related,'[]'::jsonb))
  returning id into v_id;
  return v_id;
end
$$;

revoke all on function scout.push_feed(text,text,text,text,jsonb,jsonb) from authenticated, anon;
grant execute on function scout.push_feed(text,text,text,text,jsonb,jsonb) to service_role;-- ===========================================================
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
on conflict do nothing;-- ===========================================================
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
end$$;-- ===========================================================
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