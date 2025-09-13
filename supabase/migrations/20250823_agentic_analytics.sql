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
-- ===========================================================