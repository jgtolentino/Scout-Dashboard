# CLAUDE.md - Complete MCP Supabase Integration Guide

## Table of Contents
1. [MCP Server Configuration](#mcp-server-configuration)
2. [Available MCP Tools](#available-mcp-tools)
3. [Edge Functions Integration](#edge-functions-integration)
4. [Security Configuration](#security-configuration)
5. [Testing and Verification](#testing-and-verification)

## MCP Server Configuration

### Primary Configuration for Claude Desktop

Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/Users/tbwa/Library/Application Support/Claude/Claude Extensions/ant.dir.ant.anthropic.filesystem.disabled/server/index.js"],
      "env": {}
    },
    "supabase_primary": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=cxzllzyxwpyptfretryc"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f"
      }
    }
  }
}
```

### Alternative Configuration with Feature Groups

```json
{
  "mcpServers": {
    "supabase_full": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=cxzllzyxwpyptfretryc",
        "--feature-groups=database,functions,storage,secrets"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f"
      }
    }
  }
}
```

## Available MCP Tools

### Complete List of Supabase MCP Tools

When MCP is properly configured, you'll have access to these tools:

#### 1. Database Operations
- `mcp_supabase_execute_sql` - Execute raw SQL queries
- `mcp_supabase_list_tables` - List all tables in specified schemas
- `mcp_supabase_list_views` - List all views
- `mcp_supabase_list_functions` - List database functions
- `mcp_supabase_list_extensions` - List installed extensions
- `mcp_supabase_list_schemas` - List all schemas
- `mcp_supabase_get_table_info` - Get detailed table information
- `mcp_supabase_get_column_info` - Get column details for a table

#### 2. Migration Management
- `mcp_supabase_list_migrations` - List all migrations
- `mcp_supabase_apply_migration` - Apply a new migration
- `mcp_supabase_create_migration` - Create a new migration file
- `mcp_supabase_rollback_migration` - Rollback to previous migration

#### 3. Edge Functions Management
- `mcp_supabase_list_edge_functions` - List all Edge Functions
- `mcp_supabase_deploy_edge_function` - Deploy an Edge Function
- `mcp_supabase_get_edge_function` - Get Edge Function details
- `mcp_supabase_invoke_edge_function` - Invoke an Edge Function
- `mcp_supabase_delete_edge_function` - Delete an Edge Function
- `mcp_supabase_get_edge_function_logs` - Get function logs

#### 4. Storage Operations
- `mcp_supabase_list_buckets` - List storage buckets
- `mcp_supabase_create_bucket` - Create a new bucket
- `mcp_supabase_list_files` - List files in a bucket
- `mcp_supabase_upload_file` - Upload a file
- `mcp_supabase_download_file` - Download a file
- `mcp_supabase_delete_file` - Delete a file

#### 5. Authentication & Security
- `mcp_supabase_list_users` - List auth users
- `mcp_supabase_create_user` - Create a new user
- `mcp_supabase_update_user` - Update user details
- `mcp_supabase_delete_user` - Delete a user
- `mcp_supabase_list_roles` - List database roles
- `mcp_supabase_list_policies` - List RLS policies

#### 6. Project Management
- `mcp_supabase_get_project_info` - Get project details
- `mcp_supabase_get_project_settings` - Get project settings
- `mcp_supabase_update_project_settings` - Update settings
- `mcp_supabase_get_project_usage` - Get usage statistics

#### 7. Secrets Management
- `mcp_supabase_list_secrets` - List environment variables
- `mcp_supabase_set_secret` - Set an environment variable
- `mcp_supabase_delete_secret` - Delete an environment variable

## Edge Functions Integration

### Your Available Edge Functions

Based on your Supabase project, here are the Edge Functions you can work with via MCP:

#### AI & Bot Functions
```typescript
// Example: Invoke retailbot
await mcp_supabase_invoke_edge_function({
  functionName: "retailbot",
  body: { query: "What are today's sales?" }
})

// Example: Invoke adsbot
await mcp_supabase_invoke_edge_function({
  functionName: "adsbot",
  body: { campaign: "Summer Sale 2024" }
})
```

#### Schema Sync Functions
```typescript
// Example: Run schema sync
await mcp_supabase_invoke_edge_function({
  functionName: "toolsync-agent",
  body: { 
    command: "scan", 
    schema: "public",
    prefix: "scout_"
  }
})

// Example: Analyze schema drift
await mcp_supabase_invoke_edge_function({
  functionName: "toolsync-analyzer",
  body: { 
    schema: "public",
    days: 7
  }
})
```

#### Utility Functions
```typescript
// Example: Parse files
await mcp_supabase_invoke_edge_function({
  functionName: "parse-files",
  body: { 
    fileUrl: "https://example.com/document.pdf"
  }
})

// Example: AI categorization
await mcp_supabase_invoke_edge_function({
  functionName: "ai-categorize",
  body: { 
    text: "Product description text here",
    categories: ["electronics", "clothing", "food"]
  }
})
```

## Security Configuration

### Environment Variables Required

Create a `.env` file or set these in your environment:

```bash
# Supabase Configuration
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ACCESS_TOKEN=sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f

# Additional Services (if needed)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### RLS (Row Level Security) Best Practices

When using MCP to create tables, always enable RLS:

```sql
-- Example: Create table with RLS
CREATE TABLE IF NOT EXISTS public.scout_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scout_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON public.scout_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.scout_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Testing and Verification

### 1. Test MCP Connection

After configuring MCP, restart Claude Desktop and test with:

```
"List all tables in the public schema using Supabase MCP"
```

Expected response should show your tables.

### 2. Test Edge Function Access

```
"List all Edge Functions in my Supabase project"
```

Should return the 24 functions listed above.

### 3. Test SQL Execution

```
"Execute this SQL: SELECT current_database(), current_user, version();"
```

### 4. Test Edge Function Invocation

```
"Invoke the toolsync-agent function with command 'scan' and schema 'public'"
```

## Common MCP Commands

### Database Operations
```typescript
// List all tables
await mcp_supabase_list_tables({ schemas: ["public", "bronze", "silver", "gold"] })

// Execute SQL
await mcp_supabase_execute_sql({ 
  query: "SELECT * FROM scout_campaigns LIMIT 10" 
})

// Get table info
await mcp_supabase_get_table_info({ 
  schema: "public", 
  table: "campaigns" 
})
```

### Edge Functions
```typescript
// List functions
await mcp_supabase_list_edge_functions()

// Deploy new function
await mcp_supabase_deploy_edge_function({
  name: "my-function",
  code: `
    Deno.serve(async (req) => {
      return new Response("Hello World!")
    })
  `
})

// Get logs
await mcp_supabase_get_edge_function_logs({ 
  functionName: "toolsync-agent",
  limit: 100 
})
```

### Migrations
```typescript
// Create migration
await mcp_supabase_create_migration({
  name: "add_scout_tables",
  sql: `
    CREATE TABLE scout_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      metric_name TEXT NOT NULL,
      metric_value NUMERIC,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `
})

// Apply migration
await mcp_supabase_apply_migration({
  name: "add_scout_tables"
})
```

## Troubleshooting

### MCP Tools Not Showing
1. Ensure Claude Desktop is completely closed
2. Verify the config file is valid JSON
3. Check the path to the config file
4. Restart Claude Desktop
5. Look for MCP tools starting with `mcp_supabase_`

### Connection Issues
1. Verify your access token is valid
2. Check project reference ID
3. Ensure you have internet connection
4. Try with `--read-only` flag for testing

### Permission Errors
1. Use Personal Access Token (PAT) instead of API keys
2. Ensure PAT has necessary permissions
3. For write operations, remove `--read-only` flag

## Advanced Configuration

### Multi-Project Setup
```json
{
  "mcpServers": {
    "supabase_prod": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=cxzllzyxwpyptfretryc",
        "--read-only"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_prod_token"
      }
    },
    "supabase_dev": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=your_dev_project_ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_dev_token"
      }
    }
  }
}
```

### Schema-Specific Configuration
```json
{
  "mcpServers": {
    "supabase_bronze": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=cxzllzyxwpyptfretryc",
        "--schema=bronze"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_token"
      }
    }
  }
}
```

## Best Practices

1. **Always use read-only mode for production**
   ```json
   "args": ["--read-only", "--project-ref=prod_ref"]
   ```

2. **Separate development and production configurations**
   - Use different MCP server names
   - Use different access tokens
   - Consider read-only for production

3. **Regular backups before migrations**
   ```sql
   -- Always backup before major changes
   pg_dump -h localhost -U postgres -d your_db > backup.sql
   ```

4. **Monitor Edge Function usage**
   - Check logs regularly
   - Monitor execution times
   - Set up alerts for errors

5. **Document your Edge Functions**
   - Add clear descriptions
   - Include example payloads
   - Document expected responses

---

This configuration enables full MCP integration with your Supabase project, giving Claude direct access to all database operations, Edge Functions, and management capabilities.