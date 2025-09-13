# Scout Dashboard v5.0 - Vercel Deployment Guide

## 🚀 Quick Deploy

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy to Production
```bash
vercel --prod
```

## 🔐 Environment Variables

Add these in Vercel Dashboard or via CLI:

```bash
# Add via CLI
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### Required Variables:
| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://cxzllzyxwpyptfretryc.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAxMTI0NDQsImV4cCI6MjAzNTY4ODQ0NH0.EA0GOBXy5FfIkEgmQBd3lPbh3S4JGmqBL5IlJQV8Fks` |
| `SUPABASE_SERVICE_ROLE_KEY` | `[Your Service Role Key]` |

## 📁 Project Structure

```
scout-dashboard-v5/
├── api/                    # Vercel Serverless Functions
│   ├── health.js          # Health check endpoint
│   ├── v5/               # Medallion API v5
│   │   ├── kpis/
│   │   │   └── executive.js
│   │   └── analytics/
│   │       ├── stores.js
│   │       └── brands.js
│   └── legacy/           # MockifyCreator compatibility
│       └── brands/
│           └── kpis.js
├── apps/web/             # React Dashboard
│   ├── build/           # Production build (auto-generated)
│   └── src/
└── vercel.json          # Vercel configuration
```

## 🌍 API Endpoints (Production)

Base URL: `https://your-app.vercel.app`

| Endpoint | Description |
|----------|-------------|
| `/health` | System health check |
| `/api/v5/kpis/executive` | Executive KPIs |
| `/api/v5/analytics/stores` | Store analytics |
| `/api/v5/analytics/brands` | Brand performance |
| `/api/brands/kpis` | Legacy API support |

## 🛠️ Deployment Commands

```bash
# Development preview
vercel

# Production deployment
vercel --prod

# Link existing project
vercel link

# Pull environment variables
vercel env pull

# View deployment logs
vercel logs
```

## ⚡ Performance Optimizations

1. **Edge Functions**: Deployed to Singapore (sin1) region
2. **Caching**: 60s cache with 300s stale-while-revalidate
3. **Static Assets**: Served from Vercel CDN
4. **API Routes**: Serverless functions with 10s timeout

## 🔧 Troubleshooting

### Build Fails
```bash
# Clear cache and redeploy
vercel --force
```

### Environment Variables Not Working
```bash
# List all env vars
vercel env ls

# Pull to local .env
vercel env pull
```

### Function Timeouts
- Default timeout: 10 seconds
- Increase in vercel.json if needed
- Maximum: 60 seconds (Pro plan)

## 📊 Monitoring

1. **Vercel Dashboard**: Real-time metrics
2. **Function Logs**: `vercel logs --follow`
3. **Analytics**: Built-in Web Vitals tracking

## 🚢 CI/CD Integration

### GitHub Actions
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🎯 Ready to Deploy!

1. Run `vercel --prod`
2. Follow the prompts
3. Your Scout Dashboard v5.0 will be live in ~60 seconds!

---

**Support**: For issues, check Vercel status at https://vercel.com/support