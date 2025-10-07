-- Reports tables with multiple permissive policies for the same command
-- This helps identify RLS policy consolidation opportunities

do $$
declare
  rec record;
begin
  raise notice '=== RLS POLICY OVERLAP REPORT ===';
  
  -- Main report: tables with multiple permissive policies per command
  raise notice 'Tables with multiple permissive policies for the same command:';
  for rec in
    select 
      schemaname, 
      tablename, 
      cmd, 
      count(*) as policy_count,
      string_agg(policyname, ', ' order by policyname) as policies
    from (
      select 
        pol.schemaname, 
        pol.tablename, 
        pol.policyname,
        case when pol.cmd is null then 'ALL' else pol.cmd end as cmd,
        pol.permissive
      from pg_policies pol
      where pol.schemaname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
    ) t
    where permissive = 'PERMISSIVE'
    group by schemaname, tablename, cmd
    having count(*) > 1
    order by count(*) desc, schemaname, tablename, cmd
  loop
    raise notice '  %I.%I [%] has % policies: %', 
      rec.schemaname, rec.tablename, rec.cmd, rec.policy_count, rec.policies;
  end loop;

  raise notice '';
  raise notice 'All RLS policies summary:';
  
  -- Summary of all policies
  for rec in
    select 
      schemaname,
      tablename,
      policyname,
      cmd,
      permissive,
      array_to_string(roles, ', ') as role_list,
      length(qual) as using_clause_length,
      length(with_check) as with_check_length
    from pg_policies
    where schemaname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
    order by schemaname, tablename, cmd, policyname
  loop
    raise notice '  %I.%I.%I [%] roles=[%] using_len=% check_len=%', 
      rec.schemaname, rec.tablename, rec.policyname, rec.cmd, 
      coalesce(rec.role_list, 'none'), 
      coalesce(rec.using_clause_length, 0),
      coalesce(rec.with_check_length, 0);
  end loop;
  
  raise notice '';
  raise notice 'RECOMMENDATION: Consolidate overlapping permissive policies into single policy per command';
end $$;