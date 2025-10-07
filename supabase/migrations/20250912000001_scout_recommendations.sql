-- Scout Recommendations System with 7-Tier Taxonomy
-- Migration: 20250912000001_scout_recommendations.sql

-- Create recommendation tier enum
create type scout.reco_tier as enum (
  'operational',       -- Day-to-day optimizations (inventory, pricing, promotions)
  'tactical',          -- Short-term strategic moves (campaigns, partnerships, product launches)  
  'strategic',         -- Medium-term positioning (market expansion, brand positioning)
  'transformational',  -- Long-term business transformation (digital transformation, new markets)
  'governance',        -- Policy and process improvements (compliance, risk management)
  'financial',         -- Financial optimization (cost reduction, revenue growth, investment)
  'experiment'         -- A/B tests, pilot programs, innovation initiatives
);

-- Create recommendations table
create table scout.scout_recommendations (
  id uuid default gen_random_uuid() primary key,
  
  -- Core fields
  title text not null,
  description text not null,
  tier scout.reco_tier not null,
  
  -- Business impact
  confidence_score decimal(3,2) check (confidence_score >= 0.0 and confidence_score <= 1.0),
  expected_impact text,
  implementation_effort text,
  priority_rank integer default 0,
  
  -- Evidence and context
  evidence jsonb default '[]'::jsonb,
  data_sources text[],
  filters_applied jsonb default '{}'::jsonb,
  
  -- Implementation details  
  recommended_actions text[],
  success_metrics text[],
  timeline_estimate text,
  resource_requirements text,
  
  -- Business context
  target_audience text,
  affected_categories text[],
  affected_regions text[],
  
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  tags text[] default '{}',
  
  -- Status tracking
  status text default 'pending' check (status in ('pending', 'in_review', 'approved', 'implemented', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references auth.users(id),
  implementation_notes text
);

-- Create indexes for performance
create index idx_recommendations_tier on scout.recommendations(tier);
create index idx_recommendations_priority on scout.recommendations(priority_rank);
create index idx_recommendations_confidence on scout.recommendations(confidence_score desc);
create index idx_recommendations_status on scout.recommendations(status);
create index idx_recommendations_created_at on scout.recommendations(created_at desc);
create index idx_recommendations_filters on scout.recommendations using gin(filters_applied);
create index idx_recommendations_evidence on scout.recommendations using gin(evidence);

-- RLS Policies
alter table scout.recommendations enable row level security;

-- Read policy: authenticated users can view all recommendations
create policy "Users can view all recommendations" 
on scout.recommendations for select 
to authenticated 
using (true);

-- Insert policy: authenticated users can create recommendations
create policy "Users can create recommendations" 
on scout.recommendations for insert 
to authenticated 
with check (auth.uid() = created_by);

-- Update policy: users can update their own recommendations, or if they have admin role
create policy "Users can update own recommendations" 
on scout.recommendations for update 
to authenticated 
using (auth.uid() = created_by or auth.jwt() ->> 'role' = 'admin')
with check (auth.uid() = created_by or auth.jwt() ->> 'role' = 'admin');

-- Delete policy: only admins can delete
create policy "Admins can delete recommendations" 
on scout.recommendations for delete 
to authenticated 
using (auth.jwt() ->> 'role' = 'admin');

-- Updated_at trigger
create or replace function scout.set_updated_at_scout()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recommendations_updated_at
  before update on scout.recommendations
  for each row
  execute function scout.set_updated_at();

-- RPC Functions

-- Upsert recommendation
create or replace function scout.upsert_recommendation_scout(
  p_id uuid default null,
  p_title text default null,
  p_description text default null,
  p_tier scout.reco_tier default null,
  p_confidence_score decimal default null,
  p_expected_impact text default null,
  p_implementation_effort text default null,
  p_priority_rank integer default null,
  p_evidence jsonb default null,
  p_data_sources text[] default null,
  p_filters_applied jsonb default null,
  p_recommended_actions text[] default null,
  p_success_metrics text[] default null,
  p_timeline_estimate text default null,
  p_resource_requirements text default null,
  p_target_audience text default null,
  p_affected_categories text[] default null,
  p_affected_regions text[] default null,
  p_tags text[] default null,
  p_status text default 'pending'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_recommendation_id uuid;
begin
  -- If ID provided, try to update existing record
  if p_id is not null then
    update scout.recommendations set
      title = coalesce(p_title, title),
      description = coalesce(p_description, description),
      tier = coalesce(p_tier, tier),
      confidence_score = coalesce(p_confidence_score, confidence_score),
      expected_impact = coalesce(p_expected_impact, expected_impact),
      implementation_effort = coalesce(p_implementation_effort, implementation_effort),
      priority_rank = coalesce(p_priority_rank, priority_rank),
      evidence = coalesce(p_evidence, evidence),
      data_sources = coalesce(p_data_sources, data_sources),
      filters_applied = coalesce(p_filters_applied, filters_applied),
      recommended_actions = coalesce(p_recommended_actions, recommended_actions),
      success_metrics = coalesce(p_success_metrics, success_metrics),
      timeline_estimate = coalesce(p_timeline_estimate, timeline_estimate),
      resource_requirements = coalesce(p_resource_requirements, resource_requirements),
      target_audience = coalesce(p_target_audience, target_audience),
      affected_categories = coalesce(p_affected_categories, affected_categories),
      affected_regions = coalesce(p_affected_regions, affected_regions),
      tags = coalesce(p_tags, tags),
      status = coalesce(p_status, status),
      updated_at = now()
    where id = p_id
    returning id into v_recommendation_id;
    
    -- If update succeeded, return the ID
    if v_recommendation_id is not null then
      return v_recommendation_id;
    end if;
  end if;
  
  -- Insert new record (either ID was null or update found no matching record)
  insert into scout.recommendations (
    title, description, tier, confidence_score, expected_impact,
    implementation_effort, priority_rank, evidence, data_sources,
    filters_applied, recommended_actions, success_metrics, timeline_estimate,
    resource_requirements, target_audience, affected_categories, affected_regions,
    tags, status, created_by
  ) values (
    p_title, p_description, p_tier, p_confidence_score, p_expected_impact,
    p_implementation_effort, p_priority_rank, p_evidence, p_data_sources,
    p_filters_applied, p_recommended_actions, p_success_metrics, p_timeline_estimate,
    p_resource_requirements, p_target_audience, p_affected_categories, p_affected_regions,
    p_tags, p_status, auth.uid()
  )
  returning id into v_recommendation_id;
  
  return v_recommendation_id;
end;
$$;

-- List recommendations with filtering
create or replace function scout.list_recommendations_scout(
  p_tier scout.reco_tier default null,
  p_status text default null,
  p_min_confidence decimal default null,
  p_max_confidence decimal default null,
  p_tags text[] default null,
  p_target_audience text default null,
  p_affected_regions text[] default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  description text,
  tier scout.reco_tier,
  confidence_score decimal,
  expected_impact text,
  implementation_effort text,
  priority_rank integer,
  evidence jsonb,
  data_sources text[],
  filters_applied jsonb,
  recommended_actions text[],
  success_metrics text[],
  timeline_estimate text,
  resource_requirements text,
  target_audience text,
  affected_categories text[],
  affected_regions text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  tags text[],
  status text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  implementation_notes text
)
language plpgsql
security definer
as $$
begin
  return query
    select 
      r.id, r.title, r.description, r.tier, r.confidence_score,
      r.expected_impact, r.implementation_effort, r.priority_rank,
      r.evidence, r.data_sources, r.filters_applied, r.recommended_actions,
      r.success_metrics, r.timeline_estimate, r.resource_requirements,
      r.target_audience, r.affected_categories, r.affected_regions,
      r.created_at, r.updated_at, r.created_by, r.tags, r.status,
      r.reviewed_at, r.reviewed_by, r.implementation_notes
    from scout.recommendations r
    where 
      (p_tier is null or r.tier = p_tier)
      and (p_status is null or r.status = p_status)
      and (p_min_confidence is null or r.confidence_score >= p_min_confidence)
      and (p_max_confidence is null or r.confidence_score <= p_max_confidence)
      and (p_tags is null or r.tags && p_tags)
      and (p_target_audience is null or r.target_audience ilike '%' || p_target_audience || '%')
      and (p_affected_regions is null or r.affected_regions && p_affected_regions)
    order by r.priority_rank desc, r.confidence_score desc, r.created_at desc
    limit p_limit
    offset p_offset;
end;
$$;

-- Get recommendation summary by tier
create or replace function scout.get_recommendation_summary_scout()
returns table (
  tier scout.reco_tier,
  count bigint,
  avg_confidence decimal,
  pending_count bigint,
  approved_count bigint,
  implemented_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
    select 
      r.tier,
      count(*) as count,
      round(avg(r.confidence_score), 2) as avg_confidence,
      count(*) filter (where r.status = 'pending') as pending_count,
      count(*) filter (where r.status = 'approved') as approved_count,
      count(*) filter (where r.status = 'implemented') as implemented_count
    from scout.recommendations r
    group by r.tier
    order by 
      case r.tier
        when 'operational' then 1
        when 'tactical' then 2  
        when 'strategic' then 3
        when 'transformational' then 4
        when 'governance' then 5
        when 'financial' then 6
        when 'experiment' then 7
      end;
end;
$$;

-- Update recommendation status (for workflow management)
create or replace function scout.update_recommendation_status_scout(
  p_id uuid,
  p_status text,
  p_implementation_notes text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_updated boolean := false;
begin
  update scout.recommendations
  set 
    status = p_status,
    reviewed_at = case when p_status in ('approved', 'rejected') then now() else reviewed_at end,
    reviewed_by = case when p_status in ('approved', 'rejected') then auth.uid() else reviewed_by end,
    implementation_notes = coalesce(p_implementation_notes, implementation_notes),
    updated_at = now()
  where id = p_id;
  
  get diagnostics v_updated = found;
  return v_updated;
end;
$$;

-- Grant permissions
grant usage on schema scout to authenticated;
grant all on scout.recommendations to authenticated;
grant execute on function scout.upsert_recommendation to authenticated;
grant execute on function scout.list_recommendations to authenticated;
grant execute on function scout.get_recommendation_summary to authenticated;
grant execute on function scout.update_recommendation_status to authenticated;
grant execute on function scout.set_updated_at to authenticated;