# HRIS Supabase Deployment Guide

## 🚀 Quick Start

Run the complete deployment bundle:

```bash
node clodrep-cli.js deploy-hris-supabase \
  --project-ref cxzllzyxwpyptfretryc \
  --token "your-supabase-service-role-key"
```

## 📋 What Gets Deployed

### 1. **Database Schema** (`hris-schema.sql`)
- ✅ User profiles with employee data
- ✅ Time tracking with location/photo verification
- ✅ Multi-category request management
- ✅ Leave management with balances
- ✅ Expense tracking
- ✅ AI chat session storage
- ✅ Row Level Security policies
- ✅ Indexes for performance

### 2. **Seed Data** (`hris-seed.json`)
- Sample employees with hierarchy
- Leave balances
- Example requests

### 3. **Auth Context** (`server/auth-context.ts`)
- Supabase client integration
- JWT token verification
- User context for tRPC

### 4. **tRPC Routes** (`server/routers/index.ts`)
- `requests.getAll` - List user requests
- `requests.create` - Create new request
- `timeEntries.clockIn` - Clock in with location

### 5. **CI/CD Pipeline** (`.github/workflows/deploy.yml`)
- Automated testing with Bun
- Supabase migrations
- Vercel deployment

### 6. **Frontend Fix** (`hris-frontend-fix.tsx`)
- Proper loading states
- Error handling
- Empty state UI

## 🔧 Manual Steps After Deployment

### 1. Environment Variables
Create `.env.local` in your project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Update Frontend Components

Replace the loading component in your app with the pattern from `hris-frontend-fix.tsx`:

```tsx
// In your requests component
const { data, isLoading, error } = trpc.requests.getAll.useQuery();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
```

### 3. Configure Auth Flow

Update your auth configuration to use Supabase:

```tsx
// In your auth provider
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 4. Test the Integration

1. **Check Schema**: Visit Supabase dashboard → SQL Editor
2. **Test Auth**: Try logging in with test credentials
3. **Test Requests**: Create a request through the UI
4. **Check CI/CD**: Push to main branch to trigger deployment

## 🎯 Next Steps with Fully Agent

To complete the production setup:

```bash
# 1. Validate schema deployment
:fully validate-schema --project cxzllzyxwpyptfretryc

# 2. Run integration tests
:fully test-integration --suite hris

# 3. Deploy edge functions
:fully deploy-edge ./functions --project hris

# 4. Setup monitoring
:fully setup-monitoring --alerts email
```

## 📊 Monitoring

Monitor your deployment at:
- Supabase Dashboard: https://app.supabase.com/project/cxzllzyxwpyptfretryc
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Actions: Check `.github/workflows/` for CI status

## 🐛 Troubleshooting

### "Loading..." stuck on frontend
- Check browser console for tRPC errors
- Verify environment variables are set
- Ensure Supabase project is accessible

### Auth errors
- Verify JWT secret in Supabase settings
- Check CORS configuration
- Ensure auth headers are passed correctly

### Database errors
- Check RLS policies
- Verify user has correct permissions
- Check Supabase logs for details

## 🔗 Resources

- [Supabase Docs](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [HRIS Schema Reference](./hris-schema.sql)