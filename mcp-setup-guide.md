# MCP Supabase Configuration Guide

## Configuration Added

I've added a new MCP server configuration called `supabase_full_access` to your Claude Desktop config that will persist across all sessions.

### Location
`/Users/tbwa/Library/Application Support/Claude/claude_desktop_config.json`

### What's Configured
- **Server**: `supabase_full_access` 
- **Project**: cxzllzyxwpyptfretryc
- **Access**: Full service role permissions
- **Persistence**: Will be available in all Claude sessions after restart

## To Activate

1. **Restart Claude Desktop completely**:
   ```bash
   # Kill all Claude processes
   pkill -f Claude
   
   # Or use Activity Monitor to quit Claude Desktop
   ```

2. **Restart Claude Desktop**

3. **Test the MCP connection**:
   In any new Claude conversation, say:
   ```
   "Using supabase_full_access, show me the scout_customers table count"
   ```

## Available MCP Servers After Restart

1. **supabase_primary** - Read-only with PAT
2. **supabase_alternate** - Alternate project 
3. **supabase_full_access** - Full access with service role (NEW)
4. **tbwa_hr_intelligence** - HR schema access
5. **tbwa_finance_operations** - Finance schema access
6. **tbwa_executive_dashboard** - Executive access
7. **tbwa_scout_dashboard** - Scout analytics access

## Troubleshooting

If MCP tools still show as unauthorized:

1. **Check Claude is fully restarted**:
   ```bash
   ps aux | grep -i claude
   ```

2. **Verify config file**:
   ```bash
   cat "/Users/tbwa/Library/Application Support/Claude/claude_desktop_config.json" | jq .
   ```

3. **Check MCP server logs**:
   ```bash
   # In Claude's developer tools (if available)
   # View > Toggle Developer Tools > Console
   ```

4. **Alternative: Use environment variable**:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI"
   ```

## Direct Database Access Script

While waiting for MCP to activate, use this:

```bash
# Fix Scout data directly
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI" \
node /Users/tbwa/fix-scout-data-now.js
```

## Security Note

Your service role key provides full database access. It's now stored in:
- Claude Desktop config (for MCP usage)
- This guide (for reference)

Keep these files secure and don't share them publicly.