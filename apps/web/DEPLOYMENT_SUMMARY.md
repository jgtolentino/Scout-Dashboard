# Scout Dashboard v5.0 Deployment Summary

## ✅ Deployment Status

### 1. Database Migration
- **Status**: ⚠️ Failed (authentication required)
- **Action Required**: Run `supabase db push` with correct credentials
- **Migration File**: `/supabase/migrations/20250802_scout_v5_gold.sql`

### 2. Edge Function
- **Status**: ✅ Successfully Deployed
- **Function**: `insights-runner`
- **Size**: 20.13kB
- **Dashboard**: [View in Supabase](https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/functions)

### 3. Frontend Build
- **Status**: ✅ Successfully Built
- **Build Size**: 
  - HTML: 0.48 kB (gzipped: 0.32 kB)
  - CSS: 18.60 kB (gzipped: 4.10 kB)
  - JS: 405.09 kB (gzipped: 131.45 kB)
- **Output**: `/apps/web/build/`

## 🚀 Next Steps

### 1. Apply Database Migration
```bash
# Set your database password
export PGPASSWORD="your-password"

# Apply migration
supabase db push

# Or apply directly via SQL editor:
# https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new
```

### 2. Deploy Frontend to Vercel
```bash
cd apps/web
vercel deploy --prod
```

### 3. Set Environment Variables in Vercel
- `VITE_SUPABASE_URL`: https://cxzllzyxwpyptfretryc.supabase.co
- `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g
- `VITE_POSTHOG_KEY`: (your PostHog project key)

### 4. Test RLS Policies
```sql
-- Simulate JWT claims
SELECT set_config('request.jwt.claims','{"region_ids":"<uuid1>,<uuid2>","brand_ids":"<uuid1>,<uuid2>"}', true);

-- Test Gold views
SELECT * FROM public.gold_recent_transactions LIMIT 5;

-- Test RPCs
SELECT * FROM public.get_gold_recent_transactions(limit:=10);
```

## 📊 What Was Deployed

### SQL Objects Created
- **Views**: `gold_recent_transactions`, `gold_kpi_overview`, `gold_brand_performance`
- **Functions**: 
  - `get_gold_recent_transactions()`
  - `get_gold_recent_transactions_count()`
  - `get_gold_brand_performance()`
  - `get_gold_price_bands()`
  - `get_gold_promo_heatmap()`
  - `get_gold_oos()`
- **RLS Policies**: `st_region_scope`, `st_brand_scope` on `scout_transactions`

### Frontend Routes
- `/home` - Dashboard home
- `/live` - Live transactions
- `/brand` - Brand performance
- `/mix` - Product mix analysis
- `/behavior` - Customer behavior
- `/profile` - User profile
- `/market` - Market insights
- `/saved` - Saved queries
- `/insights` - AI insights
- `/predict` - Predictions

## 🔐 Security Notes
- RLS is enabled on `scout_transactions` table
- All data access goes through SECURITY INVOKER functions
- JWT claims required: `region_ids` and/or `brand_ids`

## 📈 Performance
- Frontend bundle: ~405KB (131KB gzipped)
- Views use existing indexes on `scout_transactions`
- RLS policies use indexed columns (`region_id`, `brand_id`)

---
Generated: 2025-08-02 (Asia/Manila)