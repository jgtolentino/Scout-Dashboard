-- Schedule the Link & Extract pipeline every 5 minutes
create extension if not exists pg_cron;

-- Schedule link and extract every 5 minutes with full logging
select cron.schedule('link-extract-5m','*/5 * * * *', $$
  do $job$
  declare res json; l int; e int;
  begin
    -- Call the RPC and capture results
    select public.link_and_extract_rpc(90) into res;
    l := (res->>'linked')::int; 
    e := (res->>'extracted')::int;

    -- Log successful run
    insert into analytics_snap.etl_runs(window_secs, linked, extracted, ok)
    values (90, l, e, true);

    -- Check for stall conditions
    perform obs.alert_etl_stall();
    
    -- Notify PostgREST to reload schema cache
    notify pgrst, 'reload schema';
    
  exception when others then
    -- Log failed run with error details
    insert into analytics_snap.etl_runs(window_secs, linked, extracted, ok, err)
    values (90, 0, 0, false, SQLERRM);
    
    -- Try to alert about failure
    begin
      perform obs.post_to_slack('ETL run failed: ' || SQLERRM);
    exception when others then
      -- If Slack alert fails, just log it
      raise notice 'ETL run failed: %', SQLERRM;
    end;
  end;
  $job$;
$$);