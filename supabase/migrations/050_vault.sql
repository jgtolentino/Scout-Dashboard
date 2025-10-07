-- Enable Vault & a safe getter wrapper (SECURITY DEFINER, whitelist keys)
create extension if not exists supabase_vault with schema extensions;

create schema if not exists internal;

create table if not exists internal.vault_allowlist(
  key text primary key, 
  purpose text not null,
  created_at timestamptz not null default now()
);

-- Add keys you plan to fetch at runtime (no values here)
insert into internal.vault_allowlist(key, purpose) values
  ('OPENAI_API_KEY', 'embeddings and AI processing'),
  ('ANTHROPIC_API_KEY', 'AI chat and analysis'),
  ('SLACK_WEBHOOK', 'alerts and notifications'),
  ('AZURE_SQL_USER', 'Azure SQL FDW connection'),
  ('AZURE_SQL_PASSWORD', 'Azure SQL FDW connection'),
  ('AZURE_SQL_SERVER', 'Azure SQL FDW connection'),
  ('AZURE_SQL_DB', 'Azure SQL FDW connection'),
  ('AWS_ACCESS_KEY_ID', 'S3 FDW connection'),
  ('AWS_SECRET_ACCESS_KEY', 'S3 FDW connection'),
  ('AWS_REGION', 'S3 FDW connection'),
  ('S3_BRONZE_BUCKET', 'Bronze layer S3 access'),
  ('S3_SILVER_BUCKET', 'Silver layer S3 access')
on conflict (key) do update set 
  purpose = excluded.purpose,
  created_at = now();

-- Safe vault getter with allowlist validation
create or replace function internal.vault_get_secret(p_key text)
returns text
language plpgsql
security definer
as $$
declare 
  v text;
begin
  -- Check if key is allowed
  if not exists (select 1 from internal.vault_allowlist where key = p_key) then
    raise exception 'vault key % not in allowlist', p_key;
  end if;
  
  -- Get secret from vault
  select decrypted_secret into v from vault.decrypted_secrets where name = p_key;
  
  if v is null then
    raise exception 'vault key % not found or null', p_key;
  end if;
  
  return v;
exception
  when others then
    -- Log error but don't expose details
    raise notice 'vault_get_secret failed for key: %', p_key;
    return null;
end $$;

-- Secure the vault getter function
revoke all on function internal.vault_get_secret(text) from public, anon, authenticated;
grant execute on function internal.vault_get_secret(text) to service_role;

-- Create a view for vault key inventory (no secrets exposed)
create or replace view internal.vault_inventory as
select 
  key,
  purpose,
  created_at,
  case when exists(select 1 from vault.decrypted_secrets where name = v.key) 
       then 'present' else 'missing' end as status
from internal.vault_allowlist v
order by key;