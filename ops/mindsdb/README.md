# Scout Analytics - MindsDB MCP Integration

Complete setup for two isolated MindsDB instances providing MCP (Model Context Protocol) access to Supabase with proper role-based security.

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
- **mindsdb_code_ro**: Broader reads (analytics + ref tables), still read-only
- **mindsdb_code_ingest**: Write-only to `analytics_snap.kpi_hourly`

### Instance Isolation
- **Desktop**: Safe for ad-hoc analysis, limited schema access
- **Code**: Broader access for orchestration, can schedule jobs and write snapshots

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

## Usage Patterns

### Claude Desktop (Analyst)
- Ask: *"What tables are available in analytics?"*
- Query: *"Show me the latest recommendations by tier"*
- Access: Read-only views, safest for exploration

### Claude Code CLI (Orchestrator)  
- Start with: `./claude_code_env.sh`
- Access: Analytics + ref tables, can create jobs
- Use for: Automated queries, scheduled jobs, federated analysis

## File Structure

```
ops/mindsdb/
├── README.md                 # This file
├── docker-compose.mcp.yml    # Two MindsDB containers
├── setup_roles.sh           # Create DB roles + Keychain storage
├── start_instances.sh       # Start Docker containers
├── register_datasources.sh  # Register Supabase connections
├── configure_claude.sh      # Setup MCP for Claude Desktop/CLI
├── create_kpi_job.sh        # Hourly KPI snapshot job
└── claude_code_env.sh       # CLI wrapper (created by configure_claude.sh)
```

## Management Commands

### Container Management
```bash
# Status
docker compose -f docker-compose.mcp.yml ps

# Logs
docker compose -f docker-compose.mcp.yml logs -f

# Stop
docker compose -f docker-compose.mcp.yml down

# Restart
docker compose -f docker-compose.mcp.yml restart
```

### MindsDB API Access
```bash
# Desktop instance (47334)
curl -s http://127.0.0.1:47334/api/status | jq .

# Code instance (57334)  
curl -s http://127.0.0.1:57334/api/status | jq .

# List jobs
curl -s http://127.0.0.1:57334/api/projects/mindsdb/jobs | jq .

# SQL query
curl -s -X POST http://127.0.0.1:57334/api/sql/query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT 1 as test;"}'
```

### Database Verification
```bash
# Check KPI snapshots
source ../secrets_export.sh remote
psql "$SUPABASE_PG_URL_REMOTE" -c "
  SELECT snapshot_ts, metric, value 
  FROM analytics_snap.kpi_hourly 
  ORDER BY snapshot_ts DESC LIMIT 10;
"
```

## Troubleshooting

### MindsDB Won't Start
- Check Docker daemon is running
- Verify ports 47334/47335 and 57334/57335 are free
- Check logs: `docker compose -f docker-compose.mcp.yml logs`

### MCP Connection Failed  
- Restart Claude Desktop after config changes
- Verify mcp-remote is available: `npx -y mcp-remote --help`
- Check MindsDB SSE endpoint: `curl http://127.0.0.1:47334/sse`

### Database Access Issues
- Verify roles exist: `\du` in psql as postgres user  
- Check Keychain credentials: `./ops/secrets_inventory.sh`
- Test direct connection with role credentials

### Job Execution Failures
- Check job logs in MindsDB UI or via API
- Verify write permissions: try manual INSERT
- Check datasource health: query read datasource first

## Security Best Practices

1. **Principle of Least Privilege**: Each role has minimum required permissions
2. **Network Isolation**: Bind to localhost only, use VPN for remote access  
3. **Credential Management**: All passwords in Keychain, never in code
4. **Audit Logging**: Monitor MindsDB access logs and Supabase queries
5. **Role Separation**: Keep analyst (desktop) and orchestrator (CLI) access distinct

## Next Steps

1. **Add More Datasources**: Register Azure SQL, Snowflake, etc. on Code instance
2. **Expand Jobs**: Create more sophisticated KPI calculations and exports
3. **Dashboard Integration**: Query `analytics_snap.kpi_hourly` from Next.js frontend
4. **Alerting**: Add job failure notifications and anomaly detection
5. **Performance Monitoring**: Track query performance and resource usage