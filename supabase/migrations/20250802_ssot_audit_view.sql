-- Create or replace view for SSOT audit (run in Supabase SQL editor)
create or replace view scout.scout_ssot_audit as
with t as (
  select 'bronze_transactions' as table_name, count(*)::int as row_count, min(timestamp) as min_date, max(timestamp) as max_date
    from bronze.transactions
  union all
  select 'silver_clean_events', count(*)::int, min(event_time), max(event_time)
    from silver.clean_events
  union all
  select 'silver_transactions', count(*)::int, min(transaction_time), max(transaction_time)
    from silver.transactions
  union all
  select 'gold_aggregations', count(*)::int, min(agg_date), max(agg_date)
    from gold.aggregations
  union all
  select 'campaigns', count(*)::int, min(start_date), max(end_date)
    from scout.campaigns
  union all
  select 'user_profiles', count(*)::int, min(created_at), max(updated_at)
    from scout.user_profiles
)
select *,
  case when row_count > 0 then '✅' else '⚠️' end as status
from t
order by table_name;