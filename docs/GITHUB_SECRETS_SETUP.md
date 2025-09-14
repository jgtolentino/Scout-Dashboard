# GitHub Secrets Setup for Supabase Storage ETL

## Required Repository Secrets

Navigate to: **Settings → Secrets and variables → Actions** in your GitHub repository

Add these secrets:

```
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIwNjMzNCwiZXhwIjoyMDcwNzgyMzM0fQ.vB9MIfInzX-ch4Kzb-d0_0ndNm-id1MVgQZuDBmtrdw
SUPABASE_PG_URL_REMOTE=postgres://postgres.cxzllzyxwpyptfretryc:Postgres_26@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
GDRIVE_FOLDER_ID=1j3CGrL1r_jX_K21mstrSh8lrLNzDnpiA
GDRIVE_SA_JSON_B64=[base64-encoded-service-account-json]
```

## Database Password Reference

- **Supabase DB Password**: `Postgres_26`
- **Azure SQL Password**: `R@nd0mPA$$2025!`

## Current Status

✅ Database layer: Complete (193 schemas, ETL infrastructure)  
✅ RPC Functions: `link_and_extract_rpc()` working  
✅ Cron Jobs: Running every 5 minutes  
✅ Analytics Views: Real-time data flowing  
✅ Makefile: Deployment targets ready  

🚧 **Manual Step**: Set GitHub secrets above, then workflows will auto-run