# Complete Supabase Deployment Guide with Figma Make

## 🚀 Quick Start

### 1. Initialize Supabase Project

```bash
# Create project directory
mkdir my-figma-app && cd my-figma-app

# Initialize Supabase
supabase init

# Login to Supabase
supabase login
```

### 2. Connect to Your Supabase Project

```bash
# Link to existing project
supabase link --project-ref your-project-ref

# Or create new project
supabase projects create my-figma-app --org-id your-org-id
```

### 3. Apply Database Schema

```bash
# Apply the migration we created
supabase db push

# Reset database with seed data
supabase db reset
```

## 📋 Project Structure

```
my-figma-app/
├── .github/
│   └── workflows/
│       └── supabase-deploy.yml    # CI/CD pipeline
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_create_leads_accounts.sql
│   ├── functions/                 # Edge functions
│   ├── seed.sql                   # Development data
│   └── config.toml                # Local config
├── figma-make-prompts.md          # Example prompts
└── supabase-deployment-guide.md   # This file
```

## 🔧 Environment Setup

### Local Development

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production

Set these in your deployment platform:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# GitHub Actions Secrets
SUPABASE_ACCESS_TOKEN=your-personal-access-token
SUPABASE_DB_PASSWORD=your-db-password
STAGING_PROJECT_ID=your-staging-ref
PRODUCTION_PROJECT_ID=your-production-ref
```

## 🎨 Figma Make Integration

### Step 1: Design in Figma Make

Use this prompt template:

```
Create a [APP TYPE] with Supabase backend.

Authentication: [email/Google/GitHub]

Database tables:
[LIST YOUR TABLES AND FIELDS]

Features:
- [FEATURE 1]
- [FEATURE 2]
- [FEATURE 3]

Include RLS policies for [SECURITY REQUIREMENTS].

Style with [UI LIBRARY] components.
```

### Step 2: Export and Connect

1. Export code from Figma Make
2. Install dependencies:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

3. Initialize Supabase client:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 🔄 Migration Workflow

### Creating Migrations

```bash
# After making schema changes
supabase migration new descriptive_name

# This creates: supabase/migrations/[timestamp]_descriptive_name.sql
```

### Migration Best Practices

1. **Always use IF NOT EXISTS**:
```sql
CREATE TABLE IF NOT EXISTS public.table_name (...)
```

2. **Include rollback logic**:
```sql
-- Up Migration
CREATE TABLE public.new_table (...);

-- Down Migration (in separate file)
DROP TABLE IF EXISTS public.new_table;
```

3. **Version your RLS policies**:
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name ...
```

## 🚢 Deployment Strategies

### Option 1: Direct Push (Simple)

```bash
# Push all migrations to production
supabase db push --linked
```

### Option 2: GitHub Actions (Recommended)

The included workflow handles:
- ✅ Type generation verification
- ✅ Staging deployment on push
- ✅ Production deployment with approval
- ✅ Schema change detection
- ✅ Edge function deployment

### Option 3: Preview Branches

```bash
# Create preview branch
supabase branches create preview/feature-name

# Switch to branch
supabase branches switch preview/feature-name

# Test changes
supabase db push

# Merge when ready
supabase branches merge preview/feature-name
```

## 🛡️ Security Checklist

- [ ] Enable RLS on all tables
- [ ] Test policies with different user roles
- [ ] Use environment variables for secrets
- [ ] Enable 2FA on Supabase account
- [ ] Audit database permissions
- [ ] Set up API rate limiting
- [ ] Configure CORS properly
- [ ] Enable audit logging

## 📊 Monitoring

### Database Metrics

```sql
-- Monitor slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Set Up Alerts

1. Go to Supabase Dashboard > Settings > Logs
2. Create alerts for:
   - High error rates
   - Slow queries
   - Failed auth attempts
   - Storage quota

## 🔧 Troubleshooting

### Common Issues

**Migration Conflicts**
```bash
# Reset to clean state
supabase db reset

# Or resolve manually
supabase migration repair --status applied
```

**Type Generation Mismatch**
```bash
# Regenerate types
supabase gen types typescript --linked > types/supabase.ts
```

**RLS Policy Errors**
```sql
-- Debug policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test as specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM your_table;
```

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Figma Make + Supabase Guide](https://supabase.com/blog/figma-make-support-for-supabase)
- [Migration Best Practices](https://supabase.com/docs/guides/deployment/database-migrations)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Next Steps

1. **Set up monitoring**: Configure Sentry or LogRocket
2. **Add testing**: Jest for unit tests, Playwright for E2E
3. **Performance**: Add indexes, optimize queries
4. **Scale**: Configure read replicas, caching
5. **Backup**: Set up point-in-time recovery

---

Remember: Always test migrations in staging before production! 🚀