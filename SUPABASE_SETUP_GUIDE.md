# Supabase Project Setup Guide

## Quick Setup Instructions

### Step 1: Get Your Access Token

1. Open your browser and go to: [https://app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
2. Click "Generate New Token"
3. Give it a name like "TBWA CLI Access"
4. Copy the token (it starts with `sbp_`)

### Step 2: Set the Access Token

Run one of these commands in your terminal:

```bash
# Option 1: Set for current session only
export SUPABASE_ACCESS_TOKEN='sbp_YOUR_TOKEN_HERE'

# Option 2: Save to your shell profile (permanent)
echo "export SUPABASE_ACCESS_TOKEN='sbp_YOUR_TOKEN_HERE'" >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Link to the Project

```bash
# Now link to the TBWA project
supabase link --project-ref cxzllzyxwpyptfretryc
```

## Project Details

- **Project Name**: tbwa-databank
- **Project Ref**: cxzllzyxwpyptfretryc
- **Region**: Southeast Asia (Singapore)
- **Dashboard**: [https://app.supabase.com/project/cxzllzyxwpyptfretryc](https://app.supabase.com/project/cxzllzyxwpyptfretryc)

## After Linking

Once linked, you can:

### Deploy Edge Functions
```bash
# Deploy all functions
cd supabase/functions
supabase functions deploy

# Or deploy individually
supabase functions deploy hello-world
supabase functions deploy user-activity
supabase functions deploy expense-ocr
```

### Work with Database
```bash
# Pull remote schema
supabase db pull

# Push local changes
supabase db push

# Check differences
supabase db diff

# Create new migration
supabase migration new your_migration_name
```

### Generate TypeScript Types
```bash
# Generate types from your database schema
supabase gen types typescript --project-id cxzllzyxwpyptfretryc > types/supabase.ts
```

### Local Development
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View local dashboard
open http://localhost:54323
```

## API Keys

After linking, get your API keys from:
[https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/api](https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/api)

Update your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Need Help?

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Project Dashboard: https://app.supabase.com/project/cxzllzyxwpyptfretryc
- Edge Functions Guide: https://supabase.com/docs/guides/functions