# TBWA Production Agent Deployment

## 1. Database Setup
```sql
-- Copy contents of setup-database.sql to Supabase SQL Editor
-- Run the SQL to create schemas, tables, and sample data
```

## 2. Edge Function Deployment
```bash
# Deploy each function
supabase functions deploy aladdin
supabase functions deploy retailbot
supabase functions deploy adsbot
supabase functions deploy sql-certifier
```

## 3. Environment Variables
Set these in Supabase Dashboard > Edge Functions > Secrets:
- GROQ_API_KEY (for Aladdin)
- OPENAI_API_KEY (optional backup)

## 4. Test Endpoints
```bash
# Test RetailBot
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/retailbot \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"query": "show top products"}'

# Test AdsBot  
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/adsbot \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"query": "campaign performance"}'

# Test SQL Certifier
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/sql-certifier \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"sql": "SELECT * FROM products LIMIT 10"}'
```
