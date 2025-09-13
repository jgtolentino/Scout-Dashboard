# Pulser Extension Commands Reference

## Overview
Pulser CLI now supports extension commands that start with `:` for advanced operations including Supabase management, edge deployments, and data operations.

## Available Commands

### 🗄️ Supabase & Database Operations

```bash
# Create new Supabase project
:pulser create supabase_project <project_name> --region <region>

# List database tables
:pulser db <project_name> tables:list

# Apply SQL migrations
:pulser db <project_name> sql:apply <sql_file>

# Sync Supabase schema
:clodrep supabase schema sync --project-ref <ref> --token <token> --output <file>

# Validate schema compatibility
:clodrep supabase schema validate --schema <file> --input <file> --output <file>
```

### 🚀 Deployment Commands

```bash
# Deploy edge function
:pulser deploy edge <function_file.ts>

# Deploy dashboard
:dash deploy <dashboard_name> --vercel --supabase <project>
```

### 📊 Data Operations

```bash
# Ingest data with normalization
:pulser ingest <source_file> --target <project> --normalize

# Ingest files for RAG
:clodrep fs ingest --source <path> --extensions <exts> --target <target> --rag-enable true
```

### 🔍 Integration Commands

```bash
# Parse Google Drive document
:drive:parse <file_id>

# Run Arkie SDR campaign
:arkie run campaign <campaign_name> --contacts <csv_file>
```

### 📝 Task Management

```bash
# Create a new task
:task <task_description>
```

## Command Structure

All extension commands follow this pattern:
```
:<command> <subcommand> <arguments> --flag <value>
```

## Examples

### Complete Workflow Example

```bash
# 1. Create Supabase project
:pulser create supabase_project scout_mvp --region us-west-2

# 2. Deploy edge function
:pulser deploy edge ./functions/scoutHandler.ts

# 3. Set up database schema
:pulser db scout_mvp sql:apply ./migrations/init.sql

# 4. Ingest initial data
:pulser ingest ./data/seed.json --target scout_mvp --normalize

# 5. Deploy dashboard
:dash deploy scout-dashboard --vercel --supabase scout_mvp
```

### Data Pipeline Example

```bash
# 1. Pull schema from Supabase
:clodrep supabase schema sync \
  --project-ref cxzllzyxwpyptfretryc \
  --token eyJhbGc... \
  --output schema.json

# 2. Ingest files from Google Drive
:clodrep fs ingest \
  --source "/path/to/drive/folder" \
  --extensions ".csv,.json,.sql" \
  --target supabase \
  --rag-enable true \
  --output indexed.json

# 3. Validate compatibility
:clodrep supabase schema validate \
  --schema schema.json \
  --input indexed.json \
  --output validation.md
```

## Tips

1. **View all commands**: Type `/commands` in Pulser CLI
2. **Check command syntax**: Commands will show usage if required arguments are missing
3. **Simulation mode**: Most commands run in simulation mode without real backend connections for testing
4. **File paths**: Use absolute or relative paths for file arguments
5. **Flags**: Optional flags use `--flag value` syntax

## Integration with AI

These commands can be used alongside regular Pulser AI interactions:

```bash
# Start Pulser
node pulser_cli_real.js

# Ask AI to help with a task
> Help me set up a new Supabase project for my retail analytics dashboard

# AI might suggest using these commands
> :pulser create supabase_project retail_analytics --region us-east-1

# Continue conversation
> Now I need to deploy the edge functions

# AI assists with deployment
> :pulser deploy edge ./functions/analyticsHandler.ts
```

## Environment Setup

For full functionality, ensure you have:
- Supabase CLI installed (for real deployments)
- Valid API keys configured
- Google Drive mounted (for Drive operations)
- Required Node.js packages installed