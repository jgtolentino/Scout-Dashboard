# MindsDB MCP Ops Documentation

Complete operational documentation for MindsDB MCP (Model Context Protocol) integration with automated health monitoring.

## Health Monitoring

### CI/CD Health Checks
- **Workflow**: `.github/workflows/mindsdb-health.yml`
- **Schedule**: Every 4 hours + on MindsDB changes
- **Checks**: Instance health, KPI freshness, connectivity

### Instance Health Endpoints
```bash
# Desktop instance (Claude Desktop MCP)
curl -sf http://localhost:47334/api/status

# Code instance (Claude Code CLI MCP)
curl -sf http://localhost:57334/api/status
```

### KPI Data Validation
- **Source**: `kpi_metrics` table with `source = 'mindsdb'`
- **Freshness**: Must be updated within 6 hours
- **Access**: Via Supabase pooler connection

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ Claude Desktop  │───▶│ mindsdb-desktop  │───▶│ mindsdb_desktop_ro │
│ (Analyst)       │    │ Port: 47334      │    │ (analytics only)   │
└─────────────────┘    └──────────────────┘    └────────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ Claude Code CLI │───▶│ mindsdb-code     │───▶│ mindsdb_code_ro    │
│ (Orchestrator)  │    │ Port: 57334      │    │ (analytics + ref)  │
└─────────────────┘    └──────────────────┘    └────────────────────┘
                                                ┌────────────────────┐
                                                │ mindsdb_code_ingest│
                                                │ (write analytics_snap)│
                                                └────────────────────┘
```

## Security Model

### Database Roles
- **mindsdb_desktop_ro**: Most restrictive, analytics views only
- **mindsdb_code_ro**: Broader reads (analytics + ref tables), read-only
- **mindsdb_code_ingest**: Write-only to `analytics_snap.kpi_hourly`

### Instance Isolation
- **Desktop (47334)**: Safe for ad-hoc analysis, limited schema access
- **Code (57334)**: Broader access for orchestration, job scheduling, snapshot writes

## Quick Start

### 1. Setup Database Roles
```bash
./setup_roles.sh
# Creates roles and stores credentials in Keychain
```

### 2. Start MindsDB Instances
```bash
./start_instances.sh
# Starts two Docker containers with health checks
```

### 3. Register Supabase Datasources
```bash
./register_datasources.sh
# Registers 3 datasources with proper role mapping
```

### 4. Configure Claude Connections
```bash
./configure_claude.sh
# Sets up MCP for both Desktop and CLI
```

### 5. Create KPI Job (Optional)
```bash
./create_kpi_job.sh
# Creates hourly KPI snapshot job
```

### 6. Health Check
```bash
./health.sh
# Local health validation script
```

## Health Check Script

The `health.sh` script provides comprehensive local health validation:

- **Instance Status**: Checks both MindsDB instances are running
- **API Health**: Validates REST API endpoints
- **Database Connectivity**: Tests all datasource connections
- **KPI Freshness**: Verifies recent data updates
- **Job Status**: Checks scheduled job execution

Usage:
```bash
chmod +x ./health.sh
./health.sh
```

## Usage Patterns

### Claude Desktop (Analyst)
- Ask: *"What tables are available in analytics?"*
- Query: *"Show me the latest recommendations by tier"*
- Access: Read-only views, safest for exploration

### Claude Code CLI (Orchestrator)
- Start with: `./claude_code_env.sh`
- Access: Analytics + ref tables, can create jobs
- Use for: Automated queries, scheduled jobs, federated analysis

## Operational Commands

### Container Management
```bash
# Status check
docker compose -f docker-compose.mcp.yml ps

# View logs
docker compose -f docker-compose.mcp.yml logs -f

# Stop instances
docker compose -f docker-compose.mcp.yml down

# Restart instances
docker compose -f docker-compose.mcp.yml restart
```

### Health Monitoring
```bash
# Check instance health
curl -s http://127.0.0.1:47334/api/status | jq .
curl -s http://127.0.0.1:57334/api/status | jq .

# List active jobs
curl -s http://127.0.0.1:57334/api/projects/mindsdb/jobs | jq .

# Execute test query
curl -s -X POST http://127.0.0.1:57334/api/sql/query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT 1 as health_check;"}'
```

### KPI Data Verification
```bash
# Check recent KPI data
source ../secrets_export.sh remote
psql "$SUPABASE_PG_URL_REMOTE" -c "
  SELECT 
    MAX(updated_at) as last_update,
    COUNT(*) as total_records
  FROM kpi_metrics 
  WHERE source = 'mindsdb'
  AND updated_at > NOW() - INTERVAL '24 hours';
"
```

## Troubleshooting

### Common Issues

**MindsDB Instance Unreachable**
- Check Docker containers: `docker ps`
- Verify ports not in use: `lsof -i :47334 -i :57334`
- Check instance logs: `docker logs mindsdb-desktop`

**MCP Connection Failed**
- Restart Claude Desktop after config changes
- Verify mcp-remote availability: `npx -y mcp-remote --help`
- Test SSE endpoint: `curl http://127.0.0.1:47334/sse`

**Stale KPI Data**
- Check job execution: Visit MindsDB UI at http://localhost:57334
- Verify write permissions: Test manual INSERT to analytics_snap
- Check datasource connectivity from MindsDB

**Database Connection Issues**
- Verify roles exist: `\du` in psql as postgres user
- Check Keychain credentials: `./ops/secrets_inventory.sh`
- Test direct connection with role credentials

### Health Check Failure Recovery

1. **Check Instance Status**
   ```bash
   ./health.sh
   ```

2. **Restart Unhealthy Instances**
   ```bash
   docker compose -f docker-compose.mcp.yml restart
   ```

3. **Verify Configuration**
   ```bash
   ./configure_claude.sh
   ```

4. **Test Connections**
   ```bash
   curl -s http://localhost:47334/api/status
   curl -s http://localhost:57334/api/status
   ```

## CI/CD Integration

### GitHub Actions Workflow
- **File**: `.github/workflows/mindsdb-health.yml`
- **Triggers**: Schedule (4h), workflow_dispatch, MindsDB changes
- **Timeout**: 10 minutes
- **Notifications**: Failure alerts with diagnostic info

### Environment Variables
- `SUPABASE_POOLER_URL`: Database connection for KPI checks
- Auto-configured via secrets injection

### Health Check Criteria
- ✅ Both instances respond to `/api/status`
- ✅ KPI data updated within 6 hours
- ✅ Local health script passes
- ❌ Any failure triggers notification

## Security Best Practices

1. **Principle of Least Privilege**: Minimal required permissions per role
2. **Network Isolation**: Localhost binding only, VPN for remote access
3. **Credential Management**: All passwords in Keychain, never in code
4. **Audit Logging**: Monitor MindsDB and Supabase query logs
5. **Role Separation**: Distinct analyst vs orchestrator access patterns

## File Structure

```
ops/mindsdb/
├── README.md                 # This documentation
├── docker-compose.mcp.yml    # Two MindsDB containers
├── setup_roles.sh           # Create DB roles + Keychain storage
├── start_instances.sh       # Start Docker containers  
├── register_datasources.sh  # Register Supabase connections
├── configure_claude.sh      # Setup MCP for Claude Desktop/CLI
├── create_kpi_job.sh        # Hourly KPI snapshot job
├── health.sh               # Local health check script
└── claude_code_env.sh       # CLI wrapper (auto-generated)
```

## Next Steps

1. **Enhanced Monitoring**: Add Grafana dashboards for MindsDB metrics
2. **Alerting Integration**: Slack/email notifications for health failures
3. **Performance Optimization**: Query caching and connection pooling
4. **Security Hardening**: API authentication and SSL/TLS termination
5. **Scaling**: Load balancing for multiple MindsDB instances