-- 015_storage_rls_scout_ingest.sql
-- Restrict storage_uploader to insert-only under scout-ingest/edge-inbox/*

-- Clean up existing policies
drop policy if exists "su_insert_sample" on storage.objects;
drop policy if exists "su_insert_scout_ingest" on storage.objects;
drop policy if exists "su_select_none" on storage.objects;
drop policy if exists "su_update_none" on storage.objects;
drop policy if exists "su_delete_none" on storage.objects;

-- Create storage_uploader role if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'storage_uploader') then
    create role storage_uploader;
  end if;
end
$$;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Storage uploader can only insert to scout-ingest/edge-inbox/*
create policy "su_insert_scout_ingest"
on storage.objects for insert
to storage_uploader
with check (
  bucket_id = 'scout-ingest'
  and name like 'edge-inbox/%'
);

-- Deny other operations for storage_uploader
create policy "su_select_none" on storage.objects for select to storage_uploader using (false);
create policy "su_update_none" on storage.objects for update to storage_uploader using (false);
create policy "su_delete_none" on storage.objects for delete to storage_uploader using (false);

-- Grant necessary permissions
grant usage on schema storage to storage_uploader;
grant insert on storage.objects to storage_uploader;