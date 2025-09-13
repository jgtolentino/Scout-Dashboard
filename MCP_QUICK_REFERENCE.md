# MCP Supabase Quick Reference Guide

## 🚀 Quick Start Commands

### After MCP Configuration, Use These Commands in Claude:

#### Database Operations
```
"List all tables in public schema"
"Show me the structure of the campaigns table"
"Execute SQL: SELECT COUNT(*) FROM scout_campaigns"
"Create a new table called test_data with id, name, and created_at columns"
```

#### Edge Functions
```
"List all my Edge Functions"
"Show me the logs for toolsync-agent function"
"Invoke the retailbot function with query 'show sales data'"
"Deploy a new Edge Function called hello-world"
```

#### Schema Management
```
"Scan the public schema for missing scout views"
"Generate SQL for missing RLS policies"
"Apply migration to add scout_metrics table"
"Show me all migrations"
```

## 📝 Common Tasks

### 1. Working with Your Edge Functions

#### Schema Sync Tools
```typescript
// Scan for missing tools
"Invoke toolsync-agent with command scan and schema public"

// Generate missing SQL
"Invoke toolsync-agent with command generate and schema public"

// Sync everything
"Invoke toolsync-agent with command sync and schema public"

// Analyze schema changes
"Invoke toolsync-analyzer for the public schema over the last 7 days"
```

#### AI Bots
```typescript
// Retail Bot
"Invoke retailbot with query about today's sales performance"

// Ads Bot
"Invoke adsbot to analyze campaign performance"

// Sari-Sari Expert
"Invoke sari-sari-expert with question about inventory management"
```

### 2. Database Management

#### Create Tables with RLS
```sql
"Create a table scout_reports with:
- id (UUID primary key)
- report_name (text)
- data (jsonb)
- created_by (UUID references auth.users)
- created_at (timestamp)
And enable RLS with policies for users to manage their own reports"
```

#### Query Data
```sql
"Show me the first 10 rows from scout_campaigns ordered by created_at desc"
"Count the total number of records in each scout_ table"
"Find all tables that don't have RLS enabled"
```

### 3. Storage Operations
```
"List all storage buckets"
"Create a bucket called campaign-assets"
"List files in the campaign-assets bucket"
```

## 🔧 Troubleshooting Commands

### Check MCP Status
```
"Test MCP connection by listing schemas"
"Show me the current database user and permissions"
"List available MCP tools that start with mcp_supabase"
```

### Debug Edge Functions
```
"Show logs for toolsync-agent from the last hour"
"Get the deployment history of retailbot"
"Check if ai-categorize function is running"
```

## 📊 Useful Queries

### Schema Analysis
```sql
-- Find all tables without primary keys
"Find all tables in public schema without primary keys"

-- List all foreign key relationships
"Show all foreign key relationships in the public schema"

-- Check table sizes
"Show the size of all tables in the database ordered by size"
```

### Performance Monitoring
```sql
-- Check slow queries
"Show me the slowest queries from the last 24 hours"

-- Index usage
"List all indexes and their usage statistics"

-- Table statistics
"Show table statistics for scout_campaigns"
```

## 🎯 Best Practices

### Always Verify Before Executing
```
"Show me the SQL that would be generated to create scout views for all tables"
"What would happen if I sync the bronze schema?"
"Preview the migration before applying it"
```

### Use Transactions for Safety
```sql
"Execute in a transaction: 
BEGIN;
-- your SQL here
-- then ask me to COMMIT or ROLLBACK"
```

### Regular Maintenance
```
"Check for unused indexes in the database"
"Find duplicate indexes"
"Analyze all tables for query optimization"
```

## 🔗 Integration Examples

### With Your Edge Functions

#### Complete Schema Sync Workflow
```
1. "Invoke toolsync-agent to scan the bronze schema"
2. "Show me what views are missing"
3. "Generate the SQL for missing views"
4. "Review the generated SQL"
5. "Apply the changes if they look good"
```

#### AI-Powered Analysis
```
1. "Invoke toolsync-analyzer for bronze schema changes in last 30 days"
2. "Show me the GPT-4 recommendations"
3. "Create a migration based on the recommendations"
```

### Database to Edge Function Pipeline
```
1. "Create a table for storing AI responses"
2. "Enable RLS on the AI responses table"
3. "Create an Edge Function to process and store AI responses"
4. "Test the Edge Function with sample data"
```

## 🛡️ Security Reminders

### Always Enable RLS
```
"After creating any table, enable RLS and add appropriate policies"
"Check which tables don't have RLS enabled"
"Generate RLS policies for user-owned data pattern"
```

### Audit Regularly
```
"Show me all users with elevated privileges"
"List all RLS policies in the public schema"
"Check for any tables accessible by anon role"
```

---

💡 **Pro Tip**: You can combine multiple operations in a single request:
```
"Create a scout_analytics table with proper structure, enable RLS with user-based policies, create an index on created_at, and then show me the first 10 rows"
```