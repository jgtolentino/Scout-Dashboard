-- ===========================================================
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
grant execute on function scout.push_feed(text,text,text,text,jsonb,jsonb) to service_role;