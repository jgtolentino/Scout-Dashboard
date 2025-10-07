-- Enable Supabase Wrappers for Foreign Data Wrappers (FDW)
create extension if not exists wrappers with schema extensions;

-- Schema for external data sources
create schema if not exists ext;

-- Grant usage to service roles and MindsDB roles
grant usage on schema ext to service_role;
grant usage on schema ext to mindsdb_code_ro; -- Allow MindsDB to query foreign tables

-- =====================================================
-- Microsoft SQL Server Wrapper Template
-- =====================================================
-- Uncomment and configure when Azure SQL credentials are in Vault

/*
-- Create MSSQL foreign server
create server ext.mssql_srv 
foreign data wrapper mssql_fdw 
options (
  host (select internal.vault_get_secret('AZURE_SQL_SERVER')),
  port '1433',
  database (select internal.vault_get_secret('AZURE_SQL_DB'))
);

-- User mapping for service role
create user mapping for service_role 
server ext.mssql_srv 
options (
  username (select internal.vault_get_secret('AZURE_SQL_USER')),
  password (select internal.vault_get_secret('AZURE_SQL_PASSWORD'))
);

-- User mapping for MindsDB code role (read-only access to FDW)
create user mapping for mindsdb_code_ro 
server ext.mssql_srv 
options (
  username (select internal.vault_get_secret('AZURE_SQL_USER')),
  password (select internal.vault_get_secret('AZURE_SQL_PASSWORD'))
);

-- Example foreign tables (activate when server is created)
create foreign table ext.azure_campaigns (
  id bigint,
  name text,
  brand text,
  category text,
  subcategory text,
  region text,
  start_date date,
  end_date date,
  budget numeric,
  spend numeric,
  impressions bigint,
  clicks bigint,
  conversions bigint,
  created_at timestamptz,
  updated_at timestamptz
) 
server ext.mssql_srv 
options (
  table 'dbo.Campaigns'
);

create foreign table ext.azure_transactions (
  id bigint,
  campaign_id bigint,
  customer_id text,
  product_sku text,
  quantity integer,
  unit_price numeric,
  total_amount numeric,
  transaction_date timestamptz,
  region text,
  province text,
  city text,
  channel text
) 
server ext.mssql_srv 
options (
  table 'dbo.Transactions'
);

-- Grant select permissions on foreign tables
grant select on ext.azure_campaigns to service_role, mindsdb_code_ro;
grant select on ext.azure_transactions to service_role, mindsdb_code_ro;
*/

-- =====================================================  
-- S3 Wrapper Template for Data Lake Access
-- =====================================================
-- Uncomment and configure when AWS credentials are in Vault

/*
-- Create S3 foreign server
create server ext.s3_srv 
foreign data wrapper s3_fdw 
options (
  address 's3.amazonaws.com',
  region (select internal.vault_get_secret('AWS_REGION'))
);

-- User mapping for S3 access
create user mapping for service_role 
server ext.s3_srv 
options (
  access_key_id (select internal.vault_get_secret('AWS_ACCESS_KEY_ID')),
  secret_access_key (select internal.vault_get_secret('AWS_SECRET_ACCESS_KEY'))
);

create user mapping for mindsdb_code_ro 
server ext.s3_srv 
options (
  access_key_id (select internal.vault_get_secret('AWS_ACCESS_KEY_ID')),
  secret_access_key (select internal.vault_get_secret('AWS_SECRET_ACCESS_KEY'))
);

-- Bronze layer foreign tables (raw data)
create foreign table ext.bronze_interactions (
  event_id text,
  user_id text,
  session_id text,
  event_type text,
  event_data jsonb,
  timestamp timestamptz,
  org_id text,
  source_file text
)
server ext.s3_srv 
options (
  file_format 'parquet',
  uri (select 's3://' || internal.vault_get_secret('S3_BRONZE_BUCKET') || '/interactions/')
);

create foreign table ext.bronze_products (
  sku text,
  name text,
  brand text,
  category text,
  subcategory text,
  price numeric,
  cost numeric,
  attributes jsonb,
  last_updated timestamptz,
  org_id text,
  source_file text
)
server ext.s3_srv 
options (
  file_format 'parquet', 
  uri (select 's3://' || internal.vault_get_secret('S3_BRONZE_BUCKET') || '/products/')
);

-- Silver layer foreign tables (processed data)
create foreign table ext.silver_sales_facts (
  sale_id text,
  date_key integer,
  product_key text,
  customer_key text,
  quantity integer,
  unit_price numeric,
  total_amount numeric,
  discount_amount numeric,
  tax_amount numeric,
  org_id text,
  created_at timestamptz
)
server ext.s3_srv 
options (
  file_format 'parquet',
  uri (select 's3://' || internal.vault_get_secret('S3_SILVER_BUCKET') || '/sales_facts/')
);

-- Grant select permissions
grant select on ext.bronze_interactions to service_role, mindsdb_code_ro;
grant select on ext.bronze_products to service_role, mindsdb_code_ro;  
grant select on ext.silver_sales_facts to service_role, mindsdb_code_ro;
*/

-- =====================================================
-- Slack Wrapper Template for Notifications
-- =====================================================
-- Uncomment when Slack webhook is configured in Vault

/*
-- Create Slack foreign server for notifications
create server ext.slack_srv 
foreign data wrapper http_fdw
options (
  base_url 'https://hooks.slack.com'
);

-- Function to send Slack notifications using FDW
create or replace function ext.send_slack_notification(
  message text,
  channel text default '#alerts'
)
returns boolean
language plpgsql
security definer
as $$
declare
  webhook_url text;
  response_status integer;
begin
  -- Get Slack webhook from Vault
  webhook_url := internal.vault_get_secret('SLACK_WEBHOOK');
  
  if webhook_url is null then
    raise exception 'Slack webhook not configured in Vault';
  end if;
  
  -- Send notification (placeholder - actual implementation depends on http_fdw capabilities)
  -- This would need to be implemented based on the specific HTTP FDW available
  
  return true;
exception
  when others then
    raise notice 'Failed to send Slack notification: %', SQLERRM;
    return false;
end $$;

grant execute on function ext.send_slack_notification(text, text) to service_role;
*/

-- =====================================================
-- Wrapper Management Functions
-- =====================================================

-- Function to check wrapper connectivity
create or replace function ext.check_wrapper_health()
returns table(
  wrapper_name text,
  server_name text,
  status text,
  error_message text
)
language plpgsql
security definer
as $$
begin
  -- Check each configured wrapper
  -- This is a template - actual implementation depends on active wrappers
  
  return query
  select 
    'template'::text as wrapper_name,
    'not_configured'::text as server_name,
    'inactive'::text as status,
    'Wrappers are templates - configure via Vault secrets'::text as error_message;
end $$;

-- Function to list available foreign tables
create or replace view ext.foreign_tables as
select 
  schemaname,
  tablename,
  servername,
  'foreign'::text as table_type
from pg_foreign_table ft
join pg_class c on ft.ftrelid = c.oid
join pg_namespace n on c.relnamespace = n.oid
join pg_foreign_server s on ft.ftserver = s.oid
where n.nspname = 'ext'
order by tablename;

-- Grant monitoring access
grant execute on function ext.check_wrapper_health() to service_role;
grant select on ext.foreign_tables to service_role, mindsdb_code_ro;