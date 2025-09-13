-- ==== Supabase Hardening: Performance & Security (preview/apply) ====
-- Flip this to 'true' to APPLY changes; keep 'false' to preview only.
do $$
declare
  apply boolean := false;   -- <<< SET true TO APPLY
  rec record;
  ddl_stmt text;
begin
  raise notice '== START HARDENING (apply=%)', apply;

  -- 1) Foreign Keys without covering indexes -> create recommended indexes
  raise notice 'Scanning FKs without covering indexes...';
  
  for rec in
    with fks as (
      select
        con.oid as conid,
        nsp.nspname as schema_name,
        rel.relname as table_name,
        array_agg(att.attname order by kcu.ordinal_position) as fk_cols_array,
        string_agg(att.attname, ', ' order by kcu.ordinal_position) as fk_cols
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      join information_schema.key_column_usage kcu
        on con.conname = kcu.constraint_name
        and nsp.nspname = kcu.constraint_schema
      join pg_attribute att
        on att.attrelid = con.conrelid 
        and att.attname = kcu.column_name
      where con.contype = 'f'
        and nsp.nspname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
      group by con.oid, nsp.nspname, rel.relname
    ),
    missing as (
      select 
        fks.schema_name,
        fks.table_name,
        fks.fk_cols,
        fks.fk_cols_array,
        case when exists (
          select 1 from pg_index idx
          join pg_class c on c.oid = idx.indexrelid
          where idx.indrelid = (
            select cl.oid 
            from pg_class cl 
            join pg_namespace ns on ns.oid = cl.relnamespace 
            where ns.nspname = fks.schema_name 
            and cl.relname = fks.table_name
          )
          and idx.indkey::int2[] @> (
            select array_agg(att.attnum order by ordinality)
            from pg_attribute att
            join unnest(fks.fk_cols_array) with ordinality as u(col_name, ordinality) 
              on att.attname = u.col_name
            where att.attrelid = (
              select cl.oid 
              from pg_class cl 
              join pg_namespace ns on ns.oid = cl.relnamespace 
              where ns.nspname = fks.schema_name 
              and cl.relname = fks.table_name
            )
          )
        ) then true else false end as has_covering_index
      from fks
    )
    select * from missing where not has_covering_index
  loop
    ddl_stmt := format('create index if not exists idx_fk_%s_%s on %I.%I (%s);',
      rec.table_name, 
      replace(rec.fk_cols, ', ', '_'), 
      rec.schema_name, 
      rec.table_name, 
      rec.fk_cols
    );
    
    if apply then
      raise notice 'CREATING INDEX: %', ddl_stmt;
      execute ddl_stmt;
    else
      raise notice 'MISSING FK INDEX -> %I.%I (%s)', rec.schema_name, rec.table_name, rec.fk_cols;
    end if;
  end loop;

  -- 2) Duplicate indexes -> report and optionally drop larger duplicates
  raise notice 'Scanning duplicate indexes...';
  
  for rec in
    with idx as (
      select
        n.nspname as schema_name,
        c.relname as index_name,
        t.relname as table_name,
        pg_get_indexdef(i.indexrelid) as index_def,
        i.indrelid, 
        i.indexrelid,
        pg_relation_size(i.indexrelid) as index_size
      from pg_index i
      join pg_class c on c.oid = i.indexrelid
      join pg_class t on t.oid = i.indrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
    ),
    normalized as (
      select 
        *,
        -- Normalize index definition by removing schema/index name specifics
        regexp_replace(
          regexp_replace(index_def, 'CREATE [^\\s]+ INDEX [^\\s]+ ON [^\\s]+\\.[^\\s]+', 'CREATE INDEX ON TABLE'),
          '\\s+', ' ', 'g'
        ) as normalized_def
      from idx
    ),
    groups as (
      select 
        normalized_def,
        array_agg(
          row(schema_name, index_name, table_name, index_size)::text 
          order by index_size
        ) as members,
        count(*) as dup_count
      from normalized
      group by normalized_def
      having count(*) > 1
    )
    select * from groups
  loop
    raise notice 'DUPLICATE INDEX GROUP (% indexes): %', rec.dup_count, rec.normalized_def;
    raise notice '  Members: %', rec.members;
    
    if apply then
      -- Drop all but the smallest (first) index
      for i in 2..array_length(rec.members, 1) loop
        declare
          member_info text := rec.members[i];
          schema_name text;
          index_name text;
        begin
          -- Parse the member info (crude parsing)
          schema_name := split_part(split_part(member_info, ',', 1), '(', 2);
          index_name := split_part(member_info, ',', 2);
          
          if schema_name != '' and index_name != '' then
            ddl_stmt := format('drop index if exists %I.%I;', schema_name, index_name);
            raise notice 'DROPPING DUPLICATE: %', ddl_stmt;
            execute ddl_stmt;
          end if;
        end;
      end loop;
    end if;
  end loop;

  -- 3) RLS audit: tables in exposed schemas without RLS
  raise notice 'Auditing RLS on exposed schemas...';
  
  for rec in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and n.nspname in ('public', 'scout')
      and not c.relrowsecurity
  loop
    if apply then
      raise notice 'ENABLING RLS -> %I.%I', rec.schema_name, rec.table_name;
      execute format('alter table %I.%I enable row level security;', rec.schema_name, rec.table_name);
      
      -- Add default deny policy if none exists
      if not exists (
        select 1 from pg_policies 
        where schemaname = rec.schema_name 
        and tablename = rec.table_name 
        and policyname = 'deny_all'
      ) then
        execute format('create policy deny_all on %I.%I using (false) with check (false);',
                      rec.schema_name, rec.table_name);
        raise notice '  Added default deny policy';
      end if;
    else
      raise notice 'RLS OFF -> %I.%I', rec.schema_name, rec.table_name;
    end if;
  end loop;

  -- 4) Report SECURITY DEFINER functions
  raise notice 'SECURITY DEFINER functions found:';
  for rec in
    select n.nspname as schema_name, p.proname as function_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef is true
      and n.nspname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
  loop
    raise notice '  %I.%I (review for privilege escalation)', rec.schema_name, rec.function_name;
  end loop;

  -- 5) Report materialized views with public access
  raise notice 'Materialized views with potential public access:';
  for rec in
    select n.nspname as schema_name, c.relname as mv_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'm'
      and n.nspname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
  loop
    raise notice '  %I.%I (review grants to anon/authenticated)', rec.schema_name, rec.mv_name;
  end loop;

  -- 6) Tables without primary key
  raise notice 'Tables without primary key:';
  for rec in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_index i on i.indrelid = c.oid and i.indisprimary
    where c.relkind = 'r'
      and n.nspname not in ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime', 'supabase_functions')
      and i.indexrelid is null
  loop
    raise notice '  %I.%I (add primary key)', rec.schema_name, rec.table_name;
  end loop;

  raise notice '== HARDENING DONE (apply=%)', apply;
end $$;