# 🚀 Scout Platform v5.2 Frontend Setup Guide

## Quick Start (5 minutes)

### 1. Initialize Next.js Project
```bash
# Navigate to your project directory
cd /Users/tbwa/Documents/GitHub/scout-platform-v5

# Install dependencies
npm install

# Install additional dependencies if needed
npm install @supabase/supabase-js lucide-react clsx tailwind-merge recharts date-fns zustand
npm install -D @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=5.2.0
```

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the connection test page, then auto-redirect to dashboard.

---

## ✅ Verification Checklist

### Database Connection Test
```bash
# In browser console at localhost:3000
await scoutFetch.testConnection()
// Should return: true
```

### API Endpoint Tests
```bash
# Test key v5.2 endpoints
await scoutFetch.platinum.executive_dashboard_api()
await scoutFetch.gold.campaign_effect_api()
await scoutFetch.deep_research.test_api()
```

### Dashboard Features Test
- [ ] 4 KPI cards load with real data
- [ ] Timeseries chart displays campaign trends
- [ ] Bar charts show brand performance
- [ ] System health badge shows "OPERATIONAL"
- [ ] Loading states work properly
- [ ] Error handling displays appropriate messages

---

## 📊 Dashboard Architecture

### Component Structure
```
ExecutiveDashboard (Main Container)
├── KPICard (×4) - Executive Summary Metrics
├── TimeseriesChart (×1) - Campaign Performance Trends  
├── BarChart (×3) - Brand Performance, ROI, Regional Revenue
└── MiniCards (×4) - Campaign Effectiveness, Growth Rates, Market Share, Monthly Campaigns
```

### Data Flow
```
scoutFetch.v5.2 → API Endpoints → Component State → UI Render
    ↓
Error Handling → User Feedback → Retry Logic
```

### API Integration Points
- **Platinum Layer**: `executive_dashboard_api()` - Main KPIs and trends
- **Gold Layer**: `campaign_effect_api()`, `regional_performance_api()` - Chart data
- **Deep Research**: `test_api()` - System health validation

---

## 🔧 Customization Options

### Replace Mock Components
The dashboard currently includes inline KPICard, TimeseriesChart, and BarChart components. Replace these with your existing implementations:

```typescript
// Replace mock components in ExecutiveDashboard.tsx
import { KPICard } from '@/components/ui/KPICard';
import { TimeseriesChart } from '@/components/ui/TimeseriesChart'; 
import { BarChart } from '@/components/ui/BarChart';
```

### Add New Chart Types
```typescript
// Example: Add Heatmap component
import { Heatmap } from '@/components/ui/Heatmap';

// In dashboard grid:
<Heatmap 
  title="Regional Performance Heat Map"
  data={regionalData}
  loading={loading}
/>
```

### Custom API Endpoints
```typescript
// Add new API calls to scoutFetch
const customData = await scoutFetch.gold.product_metrics_api({
  category_filter: 'beverages',
  limit: 10
});
```

---

## 🚀 Next Steps (Ready for your TODOs)

### ✅ Completed
- [x] 4.0 Frontend - Next.js Dashboard Setup
- [x] 4.2.1 scoutFetch v5.2 consolidated architecture  
- [x] 4.3 Executive Overview dashboard with 8 charts
- [x] v5.2 database migration with API endpoint renaming

### 🎯 Ready to Tackle Next
- [ ] **4.1 Configure Vercel deployment with env vars**
- [ ] **4.7 Implement Heatmap component**  
- [ ] **4.8 Implement Choropleth map component**
- [ ] **5.0 SUQI Ask Bar Implementation**

### Deployment Ready Commands
```bash
# Build for production
npm run build

# Test production build locally  
npm start

# Deploy to Vercel
vercel --prod

# Environment variables for Vercel:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY  
# NEXT_PUBLIC_APP_ENV=production
```

---

## 🐛 Troubleshooting

### Common Issues

**Connection Failed on Homepage**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase connectivity
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/api_health" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

**API Endpoints Return Errors**
```sql
-- Verify function names in Supabase dashboard
SELECT proname FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'scout' AND proname LIKE '%_api%';
```

**TypeScript Errors**
```bash
# Check types and rebuild
npm run type-check
rm -rf .next && npm run dev
```

---

## 📈 Performance Optimizations

### API Caching
```typescript
// Add to scoutFetch for caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

private async callRPCCached<T>(functionName: string, params = {}) {
  const cacheKey = `${functionName}_${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await this.callRPC<T>(functionName, params);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

### Component Optimization
```typescript
// Add React.memo for chart components
export default React.memo(TimeseriesChart);

// Use useMemo for expensive calculations
const chartData = useMemo(() => 
  processChartData(rawData), [rawData]
);
```

Your Scout Platform v5.2 dashboard is now ready! 🎉