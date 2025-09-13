-- Scout Platinum Recommendations System with AI & Deep Research Enrichment
-- Migration: 20250912000002_scout_platinum_recommendations.sql

-- Create recommendation tier enum in scout schema
create type if not exists scout.reco_tier as enum (
  'operational',       -- Day-to-day optimizations (inventory, pricing, promotions)
  'tactical',          -- Short-term strategic moves (campaigns, partnerships, product launches)  
  'strategic',         -- Medium-term positioning (market expansion, brand positioning)
  'transformational',  -- Long-term business transformation (digital transformation, new markets)
  'governance',        -- Policy and process improvements (compliance, risk management)
  'financial',         -- Financial optimization (cost reduction, revenue growth, investment)
  'experiment'         -- A/B tests, pilot programs, innovation initiatives
);

-- Gold layer: Standard recommendations
create table if not exists scout.scout_gold_recommendations (
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

-- Platinum layer: AI insights and deep research enriched recommendations
create table if not exists scout.scout_platinum_recommendations (
  id uuid default gen_random_uuid() primary key,
  
  -- Inherit from gold
  gold_recommendation_id uuid references scout.gold_recommendations(id),
  
  -- Core fields (can override gold)
  title text not null,
  description text not null,
  tier scout.reco_tier not null,
  
  -- Enhanced business impact with AI scoring
  confidence_score decimal(3,2) check (confidence_score >= 0.0 and confidence_score <= 1.0),
  ai_confidence_boost decimal(3,2) check (ai_confidence_boost >= -1.0 and ai_confidence_boost <= 1.0),
  expected_impact text,
  quantified_impact jsonb default '{}'::jsonb, -- AI-calculated impact metrics
  implementation_effort text,
  priority_rank integer default 0,
  ai_priority_adjustment integer default 0,
  
  -- AI-enriched evidence and context
  evidence jsonb default '[]'::jsonb,
  ai_insights jsonb default '[]'::jsonb, -- AI-generated insights
  research_citations jsonb default '[]'::jsonb, -- Deep research references
  data_sources text[],
  filters_applied jsonb default '{}'::jsonb,
  competitive_analysis jsonb default '{}'::jsonb, -- Market intelligence
  risk_assessment jsonb default '{}'::jsonb, -- AI risk scoring
  
  -- AI-enhanced implementation details
  recommended_actions text[],
  ai_generated_actions text[], -- AI-suggested additional actions
  success_metrics text[],
  predictive_metrics jsonb default '[]'::jsonb, -- AI-predicted outcomes
  timeline_estimate text,
  resource_requirements text,
  cost_benefit_analysis jsonb default '{}'::jsonb, -- AI financial modeling
  
  -- Enhanced business context
  target_audience text,
  persona_analysis jsonb default '{}'::jsonb, -- AI persona insights
  affected_categories text[],
  affected_regions text[],
  market_conditions jsonb default '{}'::jsonb, -- Market context analysis
  seasonal_factors jsonb default '{}'::jsonb, -- Temporal analysis
  
  -- AI processing metadata
  ai_model_version text,
  ai_processing_date timestamp with time zone default now(),
  research_depth_score integer check (research_depth_score >= 1 and research_depth_score <= 10),
  data_freshness_score integer check (data_freshness_score >= 1 and data_freshness_score <= 10),
  
  -- Standard metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  tags text[] default '{}',
  ai_tags text[] default '{}', -- AI-generated tags
  
  -- Enhanced status tracking
  status text default 'pending' check (status in ('pending', 'in_review', 'approved', 'implemented', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references auth.users(id),
  implementation_notes text,
  ai_recommendations text, -- AI suggestions for implementation
  success_probability decimal(3,2) check (success_probability >= 0.0 and success_probability <= 1.0)
);

-- Create performance indexes for gold
create index if not exists idx_gold_recommendations_tier on scout.gold_recommendations(tier);
create index if not exists idx_gold_recommendations_priority on scout.gold_recommendations(priority_rank);
create index if not exists idx_gold_recommendations_confidence on scout.gold_recommendations(confidence_score desc);
create index if not exists idx_gold_recommendations_status on scout.gold_recommendations(status);
create index if not exists idx_gold_recommendations_created_at on scout.gold_recommendations(created_at desc);
create index if not exists idx_gold_recommendations_filters on scout.gold_recommendations using gin(filters_applied);
create index if not exists idx_gold_recommendations_evidence on scout.gold_recommendations using gin(evidence);

-- Create performance indexes for platinum
create index if not exists idx_platinum_recommendations_tier on scout.platinum_recommendations(tier);
create index if not exists idx_platinum_recommendations_priority on scout.platinum_recommendations(priority_rank);
create index if not exists idx_platinum_recommendations_confidence on scout.platinum_recommendations(confidence_score desc);
create index if not exists idx_platinum_recommendations_ai_confidence on scout.platinum_recommendations(ai_confidence_boost desc);
create index if not exists idx_platinum_recommendations_status on scout.platinum_recommendations(status);
create index if not exists idx_platinum_recommendations_created_at on scout.platinum_recommendations(created_at desc);
create index if not exists idx_platinum_recommendations_gold_ref on scout.platinum_recommendations(gold_recommendation_id);
create index if not exists idx_platinum_recommendations_research_depth on scout.platinum_recommendations(research_depth_score desc);
create index if not exists idx_platinum_recommendations_success_prob on scout.platinum_recommendations(success_probability desc);
create index if not exists idx_platinum_recommendations_ai_insights on scout.platinum_recommendations using gin(ai_insights);
create index if not exists idx_platinum_recommendations_research_citations on scout.platinum_recommendations using gin(research_citations);
create index if not exists idx_platinum_recommendations_competitive_analysis on scout.platinum_recommendations using gin(competitive_analysis);

-- Enable RLS on both tables
alter table scout.gold_recommendations enable row level security;
alter table scout.platinum_recommendations enable row level security;

-- Gold RLS Policies
drop policy if exists "Users can view gold recommendations" on scout.gold_recommendations;
create policy "Users can view gold recommendations" 
on scout.gold_recommendations for select 
to authenticated 
using (true);

drop policy if exists "Users can create gold recommendations" on scout.gold_recommendations;
create policy "Users can create gold recommendations" 
on scout.gold_recommendations for insert 
to authenticated 
with check (auth.uid() = created_by);

drop policy if exists "Users can update own gold recommendations" on scout.gold_recommendations;
create policy "Users can update own gold recommendations" 
on scout.gold_recommendations for update 
to authenticated 
using (auth.uid() = created_by or auth.jwt() ->> 'role' = 'admin')
with check (auth.uid() = created_by or auth.jwt() ->> 'role' = 'admin');

drop policy if exists "Admins can delete gold recommendations" on scout.gold_recommendations;
create policy "Admins can delete gold recommendations" 
on scout.gold_recommendations for delete 
to authenticated 
using (auth.jwt() ->> 'role' = 'admin');

-- Platinum RLS Policies (more restrictive due to AI enrichment)
drop policy if exists "Users can view platinum recommendations" on scout.platinum_recommendations;
create policy "Users can view platinum recommendations" 
on scout.platinum_recommendations for select 
to authenticated 
using (true);

drop policy if exists "AI systems can create platinum recommendations" on scout.platinum_recommendations;
create policy "AI systems can create platinum recommendations" 
on scout.platinum_recommendations for insert 
to authenticated 
with check (auth.jwt() ->> 'role' in ('service_role', 'ai_system', 'admin') or auth.uid() = created_by);

drop policy if exists "AI systems can update platinum recommendations" on scout.platinum_recommendations;
create policy "AI systems can update platinum recommendations" 
on scout.platinum_recommendations for update 
to authenticated 
using (auth.jwt() ->> 'role' in ('service_role', 'ai_system', 'admin') or auth.uid() = created_by)
with check (auth.jwt() ->> 'role' in ('service_role', 'ai_system', 'admin') or auth.uid() = created_by);

drop policy if exists "Admins can delete platinum recommendations" on scout.platinum_recommendations;
create policy "Admins can delete platinum recommendations" 
on scout.platinum_recommendations for delete 
to authenticated 
using (auth.jwt() ->> 'role' = 'admin');

-- Updated_at triggers
create or replace function scout.set_updated_at_scout()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gold_recommendations_updated_at on scout.gold_recommendations;
create trigger gold_recommendations_updated_at
  before update on scout.gold_recommendations
  for each row
  execute function scout.set_updated_at();

drop trigger if exists platinum_recommendations_updated_at on scout.platinum_recommendations;
create trigger platinum_recommendations_updated_at
  before update on scout.platinum_recommendations
  for each row
  execute function scout.set_updated_at();

-- Grant permissions
grant usage on schema scout to authenticated;
grant all on scout.gold_recommendations to authenticated;
grant all on scout.platinum_recommendations to authenticated;
grant execute on function scout.set_updated_at to authenticated;