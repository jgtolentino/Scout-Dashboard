# SuqiBot Deployment Guide - Complete 105+ Feature Orchestration

## Overview

SuqiBot is the unified orchestration layer that powers the executive dashboard with 105+ features from:
- **Scout Dashboard** (40+ features)
- **Sari IQ** (30+ features) 
- **SimilarWeb Retail** (35+ features)

It implements the **Medallion Architecture** (Bronze → Silver → Gold) for data processing and provides real-time analytics, AI insights, and automated ETL pipelines.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                        │
│         (Suqi Executive Intelligence - 105+ Features)        │
└─────────────────────────┬───────────────────────────────────┘
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SuqiBot Edge Function                      │
│  /ingest  /curate  /insights  /orchestrate  /analytics      │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Bronze Layer  │ │ Silver Layer  │ │  Gold Layer   │
│ (Raw Data)    │ │(Cleansed Data)│ │  (Insights)   │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Deployment Options

### 1. Edge Function (Primary API)
```bash
supabase functions deploy suqi-bot --no-verify-jwt
```

### 2. Scheduled Job (Automated ETL)
```bash
# Deploy with cron schedule (every 15 minutes)
supabase functions deploy suqi-bot-scheduler --no-verify-jwt
```

### 3. Database Triggers (Real-time Processing)
- Automatically processes Bronze → Silver → Gold
- Triggered on data insertion

### 4. CLI/Script Runner (Manual/Batch)
```bash
./suqi-bot-cli.sh orchestrate '{"source": "manual", "data": {...}}'
```

### 5. CI/CD Pipeline (GitHub Actions)
- Automated testing and deployment
- Rollback on failure

## Quick Start

### Prerequisites
- Supabase project with service role key
- Node.js 18+ (for local development)
- Supabase CLI installed

### Step 1: Clone and Setup
```bash
git clone <your-repo>
cd <your-repo>
npm install
```

### Step 2: Configure Environment
```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Deploy
```bash
# Run the deployment script
./deploy-suqi-bot.sh
```

### Step 4: Verify
```bash
# Check health
curl https://your-project.supabase.co/functions/v1/suqi-bot/health

# Response:
{
  "status": "healthy",
  "features": {
    "scout_dashboard": { "healthy": true, "features_active": 40 },
    "sari_iq": { "healthy": true, "features_active": 30 },
    "similarweb_retail": { "healthy": true, "features_active": 35 }
  },
  "arsenal": {
    "total_features": 105,
    "active_features": 105
  }
}
```

## API Endpoints

### 1. Data Ingestion (Bronze Layer)
```bash
POST /functions/v1/suqi-bot/ingest
{
  "source": "scout_dashboard|sari_iq|similarweb",
  "data": [...],
  "batch_id": "optional_batch_id"
}
```

### 2. Data Curation (Silver Layer)
```bash
POST /functions/v1/suqi-bot/curate
{
  "batch_id": "batch_123",
  "rules": {
    "standardize_dates": true,
    "normalize_currency": true,
    "validate_locations": true
  }
}
```

### 3. Generate Insights (Gold Layer)
```bash
POST /functions/v1/suqi-bot/insights
{
  "batch_id": "batch_123",
  "analytics_type": "executive_summary|market_intelligence|demand_forecast"
}
```

### 4. Full Orchestration
```bash
POST /functions/v1/suqi-bot/orchestrate
{
  "source": "scout_dashboard",
  "data": [...]
}
# Runs Bronze → Silver → Gold automatically
```

### 5. Real-time Analytics
```bash
POST /functions/v1/suqi-bot/analytics
{
  "metric": "revenue_stream|market_share|inventory_health",
  "timeframe": "1h|24h|7d",
  "filters": {}
}
```

### 6. AI Executive Summary
```bash
POST /functions/v1/suqi-bot/ai-summary
{
  "timeframe": "24h",
  "focus_areas": ["revenue", "competition", "inventory"]
}
```

## Scheduled Jobs Configuration

### Every 15 Minutes - Pipeline Run
```yaml
schedule: "*/15 * * * *"
function: suqi-bot-scheduler
action: orchestrate
```

### Hourly - Analytics Refresh
```yaml
schedule: "0 * * * *"
function: suqi-bot
action: analytics
```

### Daily 8 AM - Executive Summary
```yaml
schedule: "0 8 * * *"
function: suqi-bot
action: ai-summary
```

## Monitoring & Observability

### Dashboard Queries
```sql
-- Pipeline Performance
SELECT * FROM medallion_pipeline_status
WHERE ingested_at > NOW() - INTERVAL '24 hours';

-- Feature Usage
SELECT * FROM feature_performance;

-- Error Tracking
SELECT * FROM suqi_bot_logs
WHERE status = 'error'
AND timestamp > NOW() - INTERVAL '1 hour';
```

### Health Checks
- Endpoint: `/functions/v1/suqi-bot/health`
- Checks all 3 data sources
- Validates database connectivity
- Returns feature availability

## Security

### Authentication
- Service role key for backend operations
- Anon key for frontend read-only access
- Row Level Security enabled on all tables

### Best Practices
1. Never expose service role key to frontend
2. Use environment variables for sensitive data
3. Enable audit logging for all operations
4. Implement rate limiting for public endpoints

## Troubleshooting

### Common Issues

1. **Function timeout**
   - Increase timeout in function config
   - Optimize database queries
   - Use caching for repeated analytics

2. **Data quality issues**
   - Check Silver layer quality scores
   - Review curation rules
   - Validate source data format

3. **Missing insights**
   - Verify Bronze → Silver → Gold pipeline
   - Check batch_id consistency
   - Review error logs

### Debug Commands
```bash
# View recent errors
supabase db query "SELECT * FROM suqi_bot_logs WHERE status = 'error' ORDER BY timestamp DESC LIMIT 10"

# Check pipeline status
supabase db query "SELECT * FROM medallion_pipeline_status ORDER BY bronze_time DESC LIMIT 5"

# Verify feature usage
supabase db query "SELECT * FROM feature_performance"
```

## Integration Examples

### Frontend Integration (React)
```javascript
// api/suqi-bot.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function getExecutiveSummary() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/suqi-bot/ai-summary`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeframe: '24h',
      focus_areas: ['revenue', 'competition', 'inventory']
    })
  })
  
  return response.json()
}

export async function getRealtimeAnalytics(metric) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/suqi-bot/analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metric,
      timeframe: '1h'
    })
  })
  
  return response.json()
}
```

### Python Integration
```python
import requests
import os

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

def orchestrate_pipeline(source, data):
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/suqi-bot/orchestrate",
        headers={
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'source': source,
            'data': data
        }
    )
    return response.json()

# Example usage
result = orchestrate_pipeline('scout_dashboard', transaction_data)
print(f"Batch ID: {result['batch_id']}")
print(f"Insights: {result['insights']}")
```

## Performance Optimization

### Caching Strategy
- Analytics results cached for 5 minutes
- Executive summaries cached for 1 hour
- Real-time data bypasses cache

### Database Optimization
- Proper indexes on all foreign keys
- Partitioning for time-series data
- Connection pooling enabled

### Edge Function Optimization
- Minimal dependencies
- Efficient JSON parsing
- Parallel processing where possible

## Roadmap

### Phase 1 (Current)
- ✅ Basic Medallion architecture
- ✅ 105+ feature integration
- ✅ Real-time analytics
- ✅ AI summaries

### Phase 2 (Next)
- [ ] Advanced ML models
- [ ] Predictive alerts
- [ ] Custom dashboard builder
- [ ] Mobile app support

### Phase 3 (Future)
- [ ] Multi-tenant support
- [ ] Advanced security features
- [ ] GraphQL API
- [ ] WebSocket real-time updates

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review logs in Supabase dashboard
3. Contact: support@your-domain.com

---

**Remember**: SuqiBot is the orchestration layer - keep business logic here, not in the frontend!