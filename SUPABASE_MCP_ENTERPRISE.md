# Supabase MCP — Agent Orchestration Best Practices

## Purpose
This document codifies all enterprise-level requirements for integrating Supabase MCP with agent orchestration tools (e.g., Bruno, Claude Code CLI, Pulser).

---

## Key Security and Operational Guidelines

- **PAT Scope**: Always use project-scoped, read-only access unless write is absolutely needed. Do NOT share PATs externally.
- **Environment**: Never connect to production without RLS enforced and non-production test data in place.
- **Agent CWD Lockdown**: All AI agents (Claude, Bruno) must remain inside project root to prevent cross-project data access.

---

## Configuration Patterns

- **Project-scoped MCP Server (local)**:
  ```json
  {
    "mcpServers": {
      "supabase": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--read-only",
          "--project-ref=cxzllzyxwpyptfretryc"
        ],
        "env": {
          "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g"
        }
      }
    }
  }
  ```

---

## RLS and Policy Enforcement

* Every new table must have RLS enabled with granular per-role, per-action policies.
* Policies must be separated for `anon` and `authenticated` roles. DO NOT combine.
* Use the bruno-supabase-mcp.yaml script for automated RLS checks.

---

## Troubleshooting & Logs

* **Token Expiry**: If the MCP server fails to start, re-issue PAT via Supabase dashboard.
* **Connection Errors**: Verify port, project-ref, and token match.
* **Logs**: Run `npx @supabase/mcp-server-supabase@latest --verbose` for debugging.

---

## Example CI/CD Pattern

1. Setup MCP server as shown above.
2. Run schema and policy checks via scripted Claude queries.
3. Remove MCP server and clear any PATs from env after tests.

---

**Any violation of these policies will result in immediate revocation of MCP access and full audit.**