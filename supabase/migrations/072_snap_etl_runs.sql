-- ETL run metrics persistence and alerting
create schema if not exists analytics_snap;

create table if not exists analytics_snap.etl_runs(
  run_id        bigint generated always as identity primary key,
  ran_at        timestamptz not null default now(),
  window_secs   int not null default 90,
  linked        int not null,
  extracted     int not null,
  ok            boolean not null,
  err           text
);

-- Quick views for the dashboard
create or replace view analytics.v_etl_last_24h as
select date_trunc('hour', ran_at) h,
       sum(linked) linked, sum(extracted) extracted,
       count(*) runs, bool_and(ok) all_ok
from analytics_snap.etl_runs
where ran_at > now() - interval '24 hours'
group by 1 order by 1 desc;

-- Create observability schema if not exists
create schema if not exists obs;

-- Alert if 3 consecutive runs produced zero work (likely feed stalled)
create or replace function obs.alert_etl_stall() returns void
language plpgsql security definer as $$
declare stalled boolean;
begin
  select count(*) filter (where (linked+extracted)>0)=0
  from (select linked, extracted from analytics_snap.etl_runs order by run_id desc limit 3) t
  into stalled;

  if coalesce(stalled,false) then
    -- Try to use existing Slack function if available
    begin
      perform obs.post_to_slack('ETL stalled: last 3 runs had no work');
    exception when others then
      -- Log the stall if Slack function doesn't exist
      raise notice 'ETL stalled: last 3 runs had no work';
    end;
  end if;
end $$;

-- Grant permissions
grant select on analytics_snap.etl_runs to service_role, authenticated;
grant select on analytics.v_etl_last_24h to service_role, authenticated, anon;
grant execute on function obs.alert_etl_stall() to service_role;

revoke all on schema analytics_snap from public;