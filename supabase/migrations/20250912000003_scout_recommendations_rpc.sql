-- Scout Recommendations RPC Functions for Gold & Platinum layers
-- Migration: 20250912000003_scout_recommendations_rpc.sql

-- Gold layer RPC functions

-- Upsert gold recommendation
create or replace function scout.upsert_gold_recommendation_scout(
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
    update scout.gold_recommendations set
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
    
    if v_recommendation_id is not null then
      return v_recommendation_id;
    end if;
  end if;
  
  -- Insert new record
  insert into scout.gold_recommendations (
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

-- List gold recommendations with filtering
create or replace function scout.list_gold_recommendations_scout(
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
    from scout.gold_recommendations r
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

-- Platinum layer RPC functions

-- Upsert platinum recommendation (AI-enriched)
create or replace function scout.upsert_platinum_recommendation_scout(
  p_id uuid default null,
  p_gold_recommendation_id uuid default null,
  p_title text default null,
  p_description text default null,
  p_tier scout.reco_tier default null,
  p_confidence_score decimal default null,
  p_ai_confidence_boost decimal default null,
  p_expected_impact text default null,
  p_quantified_impact jsonb default null,
  p_implementation_effort text default null,
  p_priority_rank integer default null,
  p_ai_priority_adjustment integer default null,
  p_evidence jsonb default null,
  p_ai_insights jsonb default null,
  p_research_citations jsonb default null,
  p_data_sources text[] default null,
  p_filters_applied jsonb default null,
  p_competitive_analysis jsonb default null,
  p_risk_assessment jsonb default null,
  p_recommended_actions text[] default null,
  p_ai_generated_actions text[] default null,
  p_success_metrics text[] default null,
  p_predictive_metrics jsonb default null,
  p_timeline_estimate text default null,
  p_resource_requirements text default null,
  p_cost_benefit_analysis jsonb default null,
  p_target_audience text default null,
  p_persona_analysis jsonb default null,
  p_affected_categories text[] default null,
  p_affected_regions text[] default null,
  p_market_conditions jsonb default null,
  p_seasonal_factors jsonb default null,
  p_ai_model_version text default null,
  p_research_depth_score integer default null,
  p_data_freshness_score integer default null,
  p_tags text[] default null,
  p_ai_tags text[] default null,
  p_status text default 'pending',
  p_ai_recommendations text default null,
  p_success_probability decimal default null
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
    update scout.platinum_recommendations set
      gold_recommendation_id = coalesce(p_gold_recommendation_id, gold_recommendation_id),
      title = coalesce(p_title, title),
      description = coalesce(p_description, description),
      tier = coalesce(p_tier, tier),
      confidence_score = coalesce(p_confidence_score, confidence_score),
      ai_confidence_boost = coalesce(p_ai_confidence_boost, ai_confidence_boost),
      expected_impact = coalesce(p_expected_impact, expected_impact),
      quantified_impact = coalesce(p_quantified_impact, quantified_impact),
      implementation_effort = coalesce(p_implementation_effort, implementation_effort),
      priority_rank = coalesce(p_priority_rank, priority_rank),
      ai_priority_adjustment = coalesce(p_ai_priority_adjustment, ai_priority_adjustment),
      evidence = coalesce(p_evidence, evidence),
      ai_insights = coalesce(p_ai_insights, ai_insights),
      research_citations = coalesce(p_research_citations, research_citations),
      data_sources = coalesce(p_data_sources, data_sources),
      filters_applied = coalesce(p_filters_applied, filters_applied),
      competitive_analysis = coalesce(p_competitive_analysis, competitive_analysis),
      risk_assessment = coalesce(p_risk_assessment, risk_assessment),
      recommended_actions = coalesce(p_recommended_actions, recommended_actions),
      ai_generated_actions = coalesce(p_ai_generated_actions, ai_generated_actions),
      success_metrics = coalesce(p_success_metrics, success_metrics),
      predictive_metrics = coalesce(p_predictive_metrics, predictive_metrics),
      timeline_estimate = coalesce(p_timeline_estimate, timeline_estimate),
      resource_requirements = coalesce(p_resource_requirements, resource_requirements),
      cost_benefit_analysis = coalesce(p_cost_benefit_analysis, cost_benefit_analysis),
      target_audience = coalesce(p_target_audience, target_audience),
      persona_analysis = coalesce(p_persona_analysis, persona_analysis),
      affected_categories = coalesce(p_affected_categories, affected_categories),
      affected_regions = coalesce(p_affected_regions, affected_regions),
      market_conditions = coalesce(p_market_conditions, market_conditions),
      seasonal_factors = coalesce(p_seasonal_factors, seasonal_factors),
      ai_model_version = coalesce(p_ai_model_version, ai_model_version),
      research_depth_score = coalesce(p_research_depth_score, research_depth_score),
      data_freshness_score = coalesce(p_data_freshness_score, data_freshness_score),
      tags = coalesce(p_tags, tags),
      ai_tags = coalesce(p_ai_tags, ai_tags),
      status = coalesce(p_status, status),
      ai_recommendations = coalesce(p_ai_recommendations, ai_recommendations),
      success_probability = coalesce(p_success_probability, success_probability),
      updated_at = now()
    where id = p_id
    returning id into v_recommendation_id;
    
    if v_recommendation_id is not null then
      return v_recommendation_id;
    end if;
  end if;
  
  -- Insert new record
  insert into scout.platinum_recommendations (
    gold_recommendation_id, title, description, tier, confidence_score, ai_confidence_boost,
    expected_impact, quantified_impact, implementation_effort, priority_rank, ai_priority_adjustment,
    evidence, ai_insights, research_citations, data_sources, filters_applied, competitive_analysis,
    risk_assessment, recommended_actions, ai_generated_actions, success_metrics, predictive_metrics,
    timeline_estimate, resource_requirements, cost_benefit_analysis, target_audience, persona_analysis,
    affected_categories, affected_regions, market_conditions, seasonal_factors, ai_model_version,
    research_depth_score, data_freshness_score, tags, ai_tags, status, ai_recommendations,
    success_probability, created_by
  ) values (
    p_gold_recommendation_id, p_title, p_description, p_tier, p_confidence_score, p_ai_confidence_boost,
    p_expected_impact, p_quantified_impact, p_implementation_effort, p_priority_rank, p_ai_priority_adjustment,
    p_evidence, p_ai_insights, p_research_citations, p_data_sources, p_filters_applied, p_competitive_analysis,
    p_risk_assessment, p_recommended_actions, p_ai_generated_actions, p_success_metrics, p_predictive_metrics,
    p_timeline_estimate, p_resource_requirements, p_cost_benefit_analysis, p_target_audience, p_persona_analysis,
    p_affected_categories, p_affected_regions, p_market_conditions, p_seasonal_factors, p_ai_model_version,
    p_research_depth_score, p_data_freshness_score, p_tags, p_ai_tags, p_status, p_ai_recommendations,
    p_success_probability, auth.uid()
  )
  returning id into v_recommendation_id;
  
  return v_recommendation_id;
end;
$$;

-- List platinum recommendations with AI scoring
create or replace function scout.list_platinum_recommendations_scout(
  p_tier scout.reco_tier default null,
  p_status text default null,
  p_min_confidence decimal default null,
  p_max_confidence decimal default null,
  p_min_success_probability decimal default null,
  p_min_research_depth integer default null,
  p_ai_model_version text default null,
  p_tags text[] default null,
  p_ai_tags text[] default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  gold_recommendation_id uuid,
  title text,
  description text,
  tier scout.reco_tier,
  confidence_score decimal,
  ai_confidence_boost decimal,
  final_confidence decimal,
  expected_impact text,
  quantified_impact jsonb,
  implementation_effort text,
  priority_rank integer,
  ai_priority_adjustment integer,
  final_priority integer,
  evidence jsonb,
  ai_insights jsonb,
  research_citations jsonb,
  competitive_analysis jsonb,
  risk_assessment jsonb,
  recommended_actions text[],
  ai_generated_actions text[],
  success_metrics text[],
  predictive_metrics jsonb,
  cost_benefit_analysis jsonb,
  persona_analysis jsonb,
  market_conditions jsonb,
  ai_model_version text,
  research_depth_score integer,
  data_freshness_score integer,
  tags text[],
  ai_tags text[],
  status text,
  success_probability decimal,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
    select 
      r.id, r.gold_recommendation_id, r.title, r.description, r.tier,
      r.confidence_score, r.ai_confidence_boost,
      least(1.0, greatest(0.0, coalesce(r.confidence_score, 0.0) + coalesce(r.ai_confidence_boost, 0.0)))::decimal(3,2) as final_confidence,
      r.expected_impact, r.quantified_impact, r.implementation_effort,
      r.priority_rank, r.ai_priority_adjustment,
      (r.priority_rank + coalesce(r.ai_priority_adjustment, 0)) as final_priority,
      r.evidence, r.ai_insights, r.research_citations, r.competitive_analysis, r.risk_assessment,
      r.recommended_actions, r.ai_generated_actions, r.success_metrics, r.predictive_metrics,
      r.cost_benefit_analysis, r.persona_analysis, r.market_conditions,
      r.ai_model_version, r.research_depth_score, r.data_freshness_score,
      r.tags, r.ai_tags, r.status, r.success_probability,
      r.created_at, r.updated_at
    from scout.platinum_recommendations r
    where 
      (p_tier is null or r.tier = p_tier)
      and (p_status is null or r.status = p_status)
      and (p_min_confidence is null or coalesce(r.confidence_score, 0.0) + coalesce(r.ai_confidence_boost, 0.0) >= p_min_confidence)
      and (p_max_confidence is null or coalesce(r.confidence_score, 0.0) + coalesce(r.ai_confidence_boost, 0.0) <= p_max_confidence)
      and (p_min_success_probability is null or r.success_probability >= p_min_success_probability)
      and (p_min_research_depth is null or r.research_depth_score >= p_min_research_depth)
      and (p_ai_model_version is null or r.ai_model_version = p_ai_model_version)
      and (p_tags is null or r.tags && p_tags)
      and (p_ai_tags is null or r.ai_tags && p_ai_tags)
    order by 
      (r.priority_rank + coalesce(r.ai_priority_adjustment, 0)) desc,
      least(1.0, greatest(0.0, coalesce(r.confidence_score, 0.0) + coalesce(r.ai_confidence_boost, 0.0))) desc,
      coalesce(r.success_probability, 0.0) desc,
      r.created_at desc
    limit p_limit
    offset p_offset;
end;
$$;

-- Get recommendation summary by tier and layer
create or replace function scout.get_recommendation_summary_scout()
returns table (
  layer text,
  tier scout.reco_tier,
  count bigint,
  avg_confidence decimal,
  avg_success_probability decimal,
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
      'gold'::text as layer,
      r.tier,
      count(*) as count,
      round(avg(r.confidence_score), 2) as avg_confidence,
      null::decimal as avg_success_probability,
      count(*) filter (where r.status = 'pending') as pending_count,
      count(*) filter (where r.status = 'approved') as approved_count,
      count(*) filter (where r.status = 'implemented') as implemented_count
    from scout.gold_recommendations r
    group by r.tier
    
    union all
    
    select 
      'platinum'::text as layer,
      r.tier,
      count(*) as count,
      round(avg(coalesce(r.confidence_score, 0.0) + coalesce(r.ai_confidence_boost, 0.0)), 2) as avg_confidence,
      round(avg(r.success_probability), 2) as avg_success_probability,
      count(*) filter (where r.status = 'pending') as pending_count,
      count(*) filter (where r.status = 'approved') as approved_count,
      count(*) filter (where r.status = 'implemented') as implemented_count
    from scout.platinum_recommendations r
    group by r.tier
    
    order by layer, 
      case tier
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

-- Update recommendation status (works for both layers)
create or replace function scout.update_recommendation_status_scout(
  p_layer text, -- 'gold' or 'platinum'
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
  if p_layer = 'gold' then
    update scout.gold_recommendations
    set 
      status = p_status,
      reviewed_at = case when p_status in ('approved', 'rejected') then now() else reviewed_at end,
      reviewed_by = case when p_status in ('approved', 'rejected') then auth.uid() else reviewed_by end,
      implementation_notes = coalesce(p_implementation_notes, implementation_notes),
      updated_at = now()
    where id = p_id;
  elsif p_layer = 'platinum' then
    update scout.platinum_recommendations
    set 
      status = p_status,
      reviewed_at = case when p_status in ('approved', 'rejected') then now() else reviewed_at end,
      reviewed_by = case when p_status in ('approved', 'rejected') then auth.uid() else reviewed_by end,
      implementation_notes = coalesce(p_implementation_notes, implementation_notes),
      updated_at = now()
    where id = p_id;
  else
    raise exception 'Invalid layer: %. Must be ''gold'' or ''platinum''', p_layer;
  end if;
  
  get diagnostics v_updated = found;
  return v_updated;
end;
$$;

-- Promote gold recommendation to platinum (AI enhancement workflow)
create or replace function scout.promote_to_platinum_scout(
  p_gold_id uuid,
  p_ai_insights jsonb default null,
  p_research_citations jsonb default null,
  p_competitive_analysis jsonb default null,
  p_risk_assessment jsonb default null,
  p_ai_model_version text default 'claude-3.5',
  p_research_depth_score integer default 5,
  p_data_freshness_score integer default 5
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_gold_rec record;
  v_platinum_id uuid;
begin
  -- Get gold recommendation
  select * into v_gold_rec 
  from scout.gold_recommendations 
  where id = p_gold_id;
  
  if not found then
    raise exception 'Gold recommendation not found: %', p_gold_id;
  end if;
  
  -- Create platinum version with AI enhancements
  insert into scout.platinum_recommendations (
    gold_recommendation_id, title, description, tier, confidence_score,
    expected_impact, implementation_effort, priority_rank, evidence,
    data_sources, filters_applied, recommended_actions, success_metrics,
    timeline_estimate, resource_requirements, target_audience,
    affected_categories, affected_regions, tags, status,
    ai_insights, research_citations, competitive_analysis, risk_assessment,
    ai_model_version, research_depth_score, data_freshness_score,
    created_by
  ) values (
    p_gold_id, v_gold_rec.title, v_gold_rec.description, v_gold_rec.tier,
    v_gold_rec.confidence_score, v_gold_rec.expected_impact, 
    v_gold_rec.implementation_effort, v_gold_rec.priority_rank, v_gold_rec.evidence,
    v_gold_rec.data_sources, v_gold_rec.filters_applied, v_gold_rec.recommended_actions,
    v_gold_rec.success_metrics, v_gold_rec.timeline_estimate, v_gold_rec.resource_requirements,
    v_gold_rec.target_audience, v_gold_rec.affected_categories, v_gold_rec.affected_regions,
    v_gold_rec.tags, v_gold_rec.status, p_ai_insights, p_research_citations,
    p_competitive_analysis, p_risk_assessment, p_ai_model_version,
    p_research_depth_score, p_data_freshness_score, auth.uid()
  )
  returning id into v_platinum_id;
  
  return v_platinum_id;
end;
$$;

-- Grant permissions on RPC functions
grant execute on function scout.upsert_gold_recommendation to authenticated;
grant execute on function scout.list_gold_recommendations to authenticated;
grant execute on function scout.upsert_platinum_recommendation to authenticated;
grant execute on function scout.list_platinum_recommendations to authenticated;
grant execute on function scout.get_recommendation_summary to authenticated;
grant execute on function scout.update_recommendation_status to authenticated;
grant execute on function scout.promote_to_platinum to authenticated;