# Scout Runbook (POC → Next Steps)

**Last Updated:** 2025-09-14 (PH)
**Status:** POC deployed and validated ✅

## Quick Health Checks

### Health & Installer
- **Health RPC**: `./ops/bru.sh health-check.bru` (2/2 tests passing)
- **Platinum RPC**: `./ops/bru.sh install-platinum-rpc.bru` (6/6 tests passing)
- **Full inventory**: `./ops/inventory.check.sh` (requires exported env vars)

### Secrets Management (Keychain)
- **Put/update all**: `./ops/secrets_put.sh`
- **Export for session**: `source ./ops/secrets_export.sh remote`
- **Inventory (redacted)**: `./ops/secrets_inventory.sh`
- **Validate required**: `./ops/secrets_validate.sh poc`

### Local Development
- **Start local DB**: `supabase start` (DB on 54322)
- **Apply migrations**: `supabase db reset` (applies 000_init.sql)
- **Stop local**: `supabase stop`

## Architecture Overview

### Database Namespacing (do not change)
- **public**: wrappers + *_rpc functions (service_role gated)
- **internal**: implementation functions
- **analytics**: facts + materialized views (mv_*)
- **ref**: dimensions (company/brand/category/sku, geo)
- **stage**: raw ingests (azure_*)
- **mkt**: campaigns
- **ai**: embeddings + kg_* knowledge graph

### Connection Types
- **Remote Pooler (6543)**: Session/transaction pooling for high concurrency
- **Remote Direct (5432)**: Direct connection for admin operations
- **Local (54322)**: Development database via Docker

## Current Status

### ✅ Complete (POC Ready)
- **SCOUT-WS0-002**: Two-endpoint environments (pooler 6543, direct 5432)
- **SCOUT-DB-001**: Inline schema migration (remote via installer RPC)
- **SCOUT-DB-003**: Remote apply (direct 5432 connection validated)
- **SCOUT-DB-004**: Read-only RPC guard (health RPC passing)
- **SCOUT-OBS-002**: Database timeouts (statement_timeout configured)

### 🔄 In Progress
- **SCOUT-OBS-003**: CI health workflow (drafted, needs GitHub secrets)
- **SCOUT-CAMP-001**: Azure JSON source landing (files received, mapping ready)
- **SCOUT-WS0-003**: Single local Supabase (Docker 54322) bring-up

### ⏳ Next Build Priority
1. **WS0-003**: Fix local DB 54322 → apply `000_init.sql`
2. **CAMP-001**: Load Azure JSON → `stage.azure_*` tables
3. **DBT-001..003**: dbt dev→prod to materialize marts/mv_*
4. **EDGE-001**: `chat-genie` Edge Function calling `exec_readonly_sql`
5. **WEB-001/003**: Next.js dashboard reading mv_* via REST API

## Operational Procedures

### Deployment Validation
```bash
# Export secrets from Keychain
source ./ops/secrets_export.sh remote

# Run health checks
./ops/inventory.check.sh

# Verify Bruno tests
./ops/bru.sh
```

### Emergency Procedures
- **Database issues**: Check connection strings in Keychain
- **Authentication failures**: Validate service keys haven't expired
- **Local development**: `supabase stop && supabase start` to reset
- **Secret rotation**: Update in Keychain via `./ops/secrets_put.sh`

### Quality Gates
- All Bruno tests must pass before deployment
- Health RPC must respond successfully
- Platinum installer must be idempotent
- Local and remote databases must be in sync

## Security Notes
- Service keys stored in macOS Keychain only
- No secrets in code or environment files
- Bruno tests use environment variable injection
- RLS (Row Level Security) enabled on all tables
- Service role access gated through public RPC functions