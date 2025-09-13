-- Schema + DDL
create schema if not exists scout;

create table if not exists scout.scout_inferred_transactions (
  id bigserial primary key,
  account_id uuid not null,
  store_id uuid not null,
  ts timestamptz not null default now(),
  input jsonb not null,
  total_spent numeric(12,2) not null,
  likely_products jsonb not null,
  confidence numeric not null check (confidence between 0 and 1)
);

create table if not exists scout.scout_persona_matches (
  id bigserial primary key,
  account_id uuid not null,
  store_id uuid not null,
  ts timestamptz not null default now(),
  persona text not null,
  confidence numeric not null check (confidence between 0 and 1),
  features jsonb not null default '{}'::jsonb
);

create table if not exists scout.scout_recommendations (
  id bigserial primary key,
  account_id uuid not null,
  store_id uuid not null,
  ts timestamptz not null default now(),
  title text not null,
  revenue_potential numeric(12,2) not null,
  roi text not null,
  timeline text not null,
  accepted boolean not null default false
);

-- Indexes
create index if not exists idx_inferred_transactions_account_ts on scout.inferred_transactions (account_id, ts desc);
create index if not exists idx_persona_matches_account_ts on scout.persona_matches (account_id, ts desc);
create index if not exists idx_recommendations_account_ts on scout.recommendations (account_id, ts desc);

-- RLS
alter table scout.inferred_transactions enable row level security;
alter table scout.persona_matches enable row level security;
alter table scout.recommendations enable row level security;

-- Helper: only owner can read; writes by service role only
create or replace function scout.is_owner_scout(a uuid) returns boolean language sql stable as $$
  select a = auth.uid()
$$;

drop policy if exists sel_it_owner on scout.inferred_transactions;
create policy sel_it_owner on scout.inferred_transactions
  for select using (scout.is_owner(account_id));

drop policy if exists sel_pm_owner on scout.persona_matches;
create policy sel_pm_owner on scout.persona_matches
  for select using (scout.is_owner(account_id));

drop policy if exists sel_rec_owner on scout.recommendations;
create policy sel_rec_owner on scout.recommendations
  for select using (scout.is_owner(account_id));

-- Optional insert/update policies for non-service contexts (commented by default)
-- create policy ins_it_owner on scout.inferred_transactions for insert with check (scout.is_owner(account_id));
-- create policy upd_it_owner on scout.inferred_transactions for update using (scout.is_owner(account_id));

-- note: Edge Function should use service role to bypass RLS for writes.
