# Scout Dashboard Deployment Guide

## Overview
- **Frontend (Dashboard)**: Deployed on Vercel
- **Backend (Multi-Bot LLM API)**: Deployed on Render with AI Genie, RetailBot, and AdsBot
- **Database**: Hosted on Supabase

## 🚀 Part 1: Deploy LLM API to Render

### Step 1: Push to GitHub
```bash
cd /Users/tbwa/scout-llm-api

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/scout-llm-api.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the `scout-llm-api` repository
5. Configure the service:
   - **Name**: `scout-llm-api`
   - **Environment**: `Docker` (auto-detected)
   - **Instance Type**: `Starter` (or `Standard` for production)
   - **Region**: Choose closest to your users

### Step 3: Set Environment Variables
In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | Your Groq API key |
| `SUPABASE_URL` | `https://cxzllzyxwpyptfretryc.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key |
| `LLM_API_KEY` | Generate a secure API key |

### Step 4: Deploy
Click **"Create Web Service"** and wait for deployment (~5-10 minutes)

Your API will be available at: `https://scout-llm-api.onrender.com`

Test the multi-bot endpoints:
- AI Genie: `https://scout-llm-api.onrender.com/ai-genie/capabilities`
- RetailBot: `https://scout-llm-api.onrender.com/retail-bot/capabilities`
- AdsBot: `https://scout-llm-api.onrender.com/ads-bot/capabilities`

## 🎨 Part 2: Deploy Dashboard to Vercel

### Step 1: Prepare Dashboard
```bash
cd /Users/tbwa/scout-dashboard

# Update .env.local with your Render API URL
echo "NEXT_PUBLIC_LLM_API_URL=https://scout-llm-api.onrender.com" >> .env.local

# Build to test
npm run build
```

### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "Scout Dashboard ready for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/scout-dashboard.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your `scout-dashboard` repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_LLM_API_URL` (your Render API URL)
   - `NEXT_PUBLIC_TRADINGVIEW_WIDGET_KEY` (if available)
5. Click **"Deploy"**

Your dashboard will be available at: `https://scout-dashboard.vercel.app`

## 🗄️ Part 3: Configure Supabase

### Step 1: Run Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `/Users/tbwa/scout-dashboard/supabase/migrations/001_scout_dashboard_schema.sql`
3. Run the SQL

### Step 2: Create Test Users
```sql
-- Create test users with different roles
INSERT INTO auth.users (id, email) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'executive@tbwa.com'),
  ('22222222-2222-2222-2222-222222222222', 'regional@tbwa.com'),
  ('33333333-3333-3333-3333-333333333333', 'analyst@tbwa.com'),
  ('44444444-4444-4444-4444-444444444444', 'store@tbwa.com');

INSERT INTO public.profiles (id, email, full_name, role, department, region, store_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'executive@tbwa.com', 'John Executive', 'executive', 'executive', NULL, NULL),
  ('22222222-2222-2222-2222-222222222222', 'regional@tbwa.com', 'Jane Regional', 'regional_manager', 'operations', 'North', NULL),
  ('33333333-3333-3333-3333-333333333333', 'analyst@tbwa.com', 'Bob Analyst', 'analyst', 'analytics', NULL, NULL),
  ('44444444-4444-4444-4444-444444444444', 'store@tbwa.com', 'Alice Store', 'store_owner', 'retail', 'North', 'STORE001');
```

### Step 3: Seed Sample Data
```sql
-- Insert sample transactions
INSERT INTO public.transactions (transaction_id, store_id, region, timestamp, peso_value, units, category, brand) 
VALUES 
  ('TXN001', 'STORE001', 'North', NOW() - INTERVAL '1 day', 1500.00, 3, 'Electronics', 'Samsung'),
  ('TXN002', 'STORE001', 'North', NOW() - INTERVAL '2 days', 2300.00, 5, 'Groceries', 'Nestle'),
  ('TXN003', 'STORE002', 'South', NOW() - INTERVAL '1 day', 890.00, 2, 'Fashion', 'Nike');

-- Insert daily metrics
INSERT INTO public.daily_metrics (date, store_id, region, total_transactions, total_revenue, avg_transaction_value, total_units)
VALUES 
  (CURRENT_DATE - 1, 'STORE001', 'North', 45, 67500.00, 1500.00, 180),
  (CURRENT_DATE - 2, 'STORE001', 'North', 52, 78000.00, 1500.00, 208),
  (CURRENT_DATE - 1, 'STORE002', 'South', 38, 45600.00, 1200.00, 152);
```

## 🔧 Part 4: Post-Deployment Configuration

### Update Vercel Environment
Once your LLM API is deployed on Render:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_LLM_API_URL` with your Render URL
3. Redeploy by clicking **"Redeploy"** → **"Redeploy with existing Build Cache"**

### Test the Integration
1. Visit your dashboard URL
2. Log in with one of the test users
3. Verify role-based dashboards load correctly
4. Test AI insights generation

## 🔍 Monitoring & Troubleshooting

### Render (LLM API)
- **Logs**: Dashboard → Your Service → Logs
- **Metrics**: Dashboard → Your Service → Metrics
- **Health Check**: `https://scout-llm-api.onrender.com/health`

### Vercel (Dashboard)
- **Logs**: Dashboard → Your Project → Functions → Logs
- **Analytics**: Dashboard → Your Project → Analytics
- **Build Logs**: Dashboard → Your Project → Deployments

### Common Issues
1. **CORS errors**: Update `main.py` CORS settings to include your Vercel domain
2. **API timeout**: Upgrade Render instance for more resources
3. **Auth errors**: Verify Supabase keys and RLS policies

## 🔐 Security Checklist
- [ ] API key for LLM service is strong and unique
- [ ] Supabase service key is NOT exposed in frontend
- [ ] CORS is configured to allow only your domains
- [ ] RLS policies are properly enforced
- [ ] Environment variables are set in Vercel/Render, not in code

## 🚀 Next Steps
1. Set up custom domains
2. Configure monitoring (Sentry, LogRocket)
3. Add CI/CD pipelines
4. Enable auto-scaling on Render
5. Set up database backups

---

**Support Resources:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: [Your GitHub Issues URL]