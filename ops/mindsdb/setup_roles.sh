#!/bin/bash
# Scout Analytics - MindsDB Database Roles Setup
# Creates least-privilege roles for MindsDB instances
# Usage: ./ops/mindsdb/setup_roles.sh

set -euo pipefail

echo "🔐 Setting up MindsDB database roles in Supabase..."

PG_DIRECT="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__PG_URL_DIRECT -w)"

if [[ -z "$PG_DIRECT" ]]; then
    echo "❌ SCOUT__REMOTE__PG_URL_DIRECT not found in Keychain"
    echo "💡 Run: ./ops/secrets_put.sh first"
    exit 1
fi

# Get passwords interactively (secure input)
echo "Setting up two MindsDB roles with different access levels:"
echo "  - mindsdb_desktop_ro: Views only (most restrictive)"
echo "  - mindsdb_code_ro: Views + ref tables (broader reads)"
echo "  - mindsdb_code_ingest: Write-only to analytics_snap schema"
echo ""

read -rsp "Password for mindsdb_desktop_ro: " PWD_DESKTOP; echo
read -rsp "Password for mindsdb_code_ro: " PWD_CODE; echo  
read -rsp "Password for mindsdb_code_ingest (write-only): " PWD_INGEST; echo

echo ""
echo "🗄️ Creating roles and permissions..."

psql "$PG_DIRECT" -v ON_ERROR_STOP=1 <<SQL
-- Create analytics snapshot schema for KPI writes
create schema if not exists analytics_snap;

create table if not exists analytics_snap.kpi_hourly (
  snapshot_ts timestamptz not null default now(),
  metric       text        not null,
  value        numeric     not null,
  primary key (snapshot_ts, metric)
);

-- Desktop role (most restrictive - analytics views only)
do \$\$
begin
  if not exists (select 1 from pg_roles where rolname = 'mindsdb_desktop_ro') then
    execute 'create role mindsdb_desktop_ro login password ' || quote_literal('$PWD_DESKTOP');
  end if;
end \$\$;

grant connect on database postgres to mindsdb_desktop_ro;
grant usage on schema analytics, public to mindsdb_desktop_ro;
grant select on all tables in schema analytics to mindsdb_desktop_ro;
alter default privileges in schema analytics grant select on tables to mindsdb_desktop_ro;

-- Code role (broader reads - analytics + ref)
do \$\$
begin
  if not exists (select 1 from pg_roles where rolname = 'mindsdb_code_ro') then
    execute 'create role mindsdb_code_ro login password ' || quote_literal('$PWD_CODE');
  end if;
end \$\$;

grant connect on database postgres to mindsdb_code_ro;
grant usage on schema analytics, ref, public to mindsdb_code_ro;
grant select on all tables in schema analytics, ref to mindsdb_code_ro;
alter default privileges in schema analytics grant select on tables to mindsdb_code_ro;
alter default privileges in schema ref grant select on tables to mindsdb_code_ro;

-- Ingest role (write-only to analytics_snap)
do \$\$
begin
  if not exists (select 1 from pg_roles where rolname = 'mindsdb_code_ingest') then
    execute 'create role mindsdb_code_ingest login password ' || quote_literal('$PWD_INGEST');
  end if;
end \$\$;

grant connect on database postgres to mindsdb_code_ingest;
grant usage on schema analytics_snap to mindsdb_code_ingest;
grant insert on table analytics_snap.kpi_hourly to mindsdb_code_ingest;
-- DO NOT grant select/update/delete - write-only role

-- Verify permissions
\echo '✅ Role permissions summary:'
select 
  r.rolname as role_name,
  array_agg(distinct n.nspname order by n.nspname) as schemas_with_usage
from pg_roles r
left join pg_namespace n on has_schema_privilege(r.rolname, n.nspname, 'USAGE')
where r.rolname like 'mindsdb_%'
group by r.rolname
order by r.rolname;
SQL

echo ""
echo "🔑 Storing credentials in Keychain..."
security add-generic-password -a "$USER" -s SCOUT__MCP__DESKTOP_DB_USER -w mindsdb_desktop_ro -U
security add-generic-password -a "$USER" -s SCOUT__MCP__DESKTOP_DB_PASS -w "$PWD_DESKTOP" -U
security add-generic-password -a "$USER" -s SCOUT__MCP__CODE_DB_USER -w mindsdb_code_ro -U
security add-generic-password -a "$USER" -s SCOUT__MCP__CODE_DB_PASS -w "$PWD_CODE" -U
security add-generic-password -a "$USER" -s SCOUT__MCP__CODEW_DB_USER -w mindsdb_code_ingest -U
security add-generic-password -a "$USER" -s SCOUT__MCP__CODEW_DB_PASS -w "$PWD_INGEST" -U

echo ""
echo "🎯 MindsDB roles setup complete!"
echo "📊 Roles created:"
echo "  - mindsdb_desktop_ro: Analytics views only"
echo "  - mindsdb_code_ro: Analytics + ref tables (read-only)"
echo "  - mindsdb_code_ingest: Write-only to analytics_snap.kpi_hourly"