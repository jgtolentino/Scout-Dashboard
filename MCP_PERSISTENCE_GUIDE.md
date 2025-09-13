# MCP Persistence Guide - Making MCP Tools Always Available

## 🎯 Understanding MCP Availability

### Where MCP Tools Work:
- ✅ **Claude Desktop App** (macOS/Windows/Linux)
- ❌ **Claude Web Interface** (claude.ai)
- ❌ **API Sessions**
- ❌ **Mobile Apps**

## 🔧 Ensuring MCP is Always Available

### 1. Use Claude Desktop App
**This is the ONLY way to have MCP tools available**

Download from: https://claude.ai/download

### 2. Your Configuration is Already Set Up
Your `~/Library/Application Support/Claude/claude_desktop_config.json` already has:
- ✅ Supabase Primary Project
- ✅ Supabase Alternate Project  
- ✅ Multiple role-based configurations
- ✅ Agent project configuration

### 3. Restart Claude Desktop
After any configuration change:
1. Completely quit Claude Desktop (Cmd+Q on Mac)
2. Start Claude Desktop again
3. MCP servers will auto-connect

### 4. Verify MCP is Working
In Claude Desktop, type:
```
What MCP tools are available?
```

You should see tools starting with `mcp_` like:
- `mcp_supabase_execute_sql`
- `mcp_supabase_list_tables`
- `mcp_supabase_deploy_edge_function`

## 🚀 Direct SQL Execution (No Copy-Paste!)

### Instead of Copy-Paste SQL:
❌ **Don't do this:**
```
Claude: "Copy this SQL and paste in Supabase dashboard..."
```

✅ **Do this (in Claude Desktop):**
```
You: "Create a table called test_data with id and name columns"
Claude: [Uses mcp_supabase_execute_sql directly]
```

### Examples of Direct Commands:
```
"List all tables in the public schema"
"Execute SQL: CREATE TABLE campaigns (id UUID PRIMARY KEY)"
"Show me the structure of the employees table"
"Create an index on the created_at column of posts table"
"Enable RLS on the users table"
```

## 📱 Workaround for Non-Desktop Sessions

If you're not in Claude Desktop, create this helper:

### Quick SQL Executor Script
Save as `~/sq.sh`:
```bash
#!/bin/bash
# Quick SQL executor for Supabase

SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"

if [ -z "$1" ]; then
    echo "Usage: sq 'SELECT * FROM users LIMIT 5'"
    exit 1
fi

curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql_query\": \"$1\"}"
```

Then use:
```bash
sq "CREATE TABLE test (id INT)"
sq "SELECT * FROM campaigns LIMIT 10"
```

## 🔍 Troubleshooting MCP

### If MCP tools aren't showing:

1. **Check Claude Desktop Version**
   - Help → About Claude
   - Ensure you have the latest version

2. **Validate Configuration**
   ```bash
   # Check if config file exists
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Validate JSON syntax
   python3 -m json.tool ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Check MCP Server Logs**
   - View → Developer → Toggle Developer Tools
   - Check Console tab for MCP errors

4. **Test Individual MCP Server**
   ```bash
   # Test if MCP server can start
   npx -y @supabase/mcp-server-supabase@latest --help
   ```

## 🎯 Key Points

1. **MCP only works in Claude Desktop** - not in web interface
2. **Your config is already set up** - just use Claude Desktop
3. **Direct execution** - I should execute SQL directly, not ask you to copy-paste
4. **Natural language** - Just tell me what you want, I'll use MCP tools

## 📝 What You Can Say (In Claude Desktop)

Instead of technical commands, just say:
- "Create a users table with email and password"
- "Show me all Edge Functions"
- "Add an index to improve query performance"
- "Check what tables don't have RLS enabled"
- "Deploy a new Edge Function for authentication"

The key is: **Use Claude Desktop, not the web interface!**