# Scout v6 + Isko Failure Triage Guide

Quick diagnostic guide for common validation failures in the Scout v6 + Isko go-live gate.

## 🔍 Quick Diagnosis Commands

### Check All Systems Status
```bash
# Run full validation locally
python3 -m venv .venv && . .venv/bin/activate
pip install -r validators/requirements.txt
python validators/validate_scout_v6.py

# Run quick smoke tests
./scripts/smoke-tests.sh
```

### Check Individual Components
```bash
# Edge functions only
./scripts/smoke-tests.sh edges

# API endpoints only  
./scripts/smoke-tests.sh api

# CSV data only
./scripts/smoke-tests.sh csv
```

---

## 🚨 Common Failure Patterns

### 1. Pixel Parity Failures

**Symptoms:**
- Visual regression test failures
- Component layout mismatches
- Font rendering differences
- Color/spacing inconsistencies

**Diagnostics:**
```bash
# Check if Figma data is fresh
npm run figma:pull

# Run visual tests in headed mode
npm run test:visual -- --headed

# Check for font loading issues
ls -la public/fonts/
```

**Common Fixes:**
- **Font Issues**: Install exact font families, check font loading in `public/fonts/`
- **Token Drift**: Ban inline CSS, ensure design tokens are synced
- **Data Nondeterminism**: Seed fixtures with consistent data, use stable timestamps
- **Viewport Changes**: Check responsive breakpoints, ensure consistent viewport sizes

**Example Fix:**
```bash
# Update design tokens and re-test
npm run figma:pull
npm run build
npm run test:visual
```

---

### 2. CSV Check Failures

**Symptoms:**
- Missing CSV files (< 12 expected)
- MANIFEST_*.txt file missing
- Outdated manifest entries

**Diagnostics:**
```bash
# Check CSV directory structure
ls -la scout_v6_deployment/data/csv/
wc -l scout_v6_deployment/data/csv/*.csv

# Check manifest
cat scout_v6_deployment/data/csv/MANIFEST_*.txt
```

**Common Fixes:**
- **Missing Exports**: Re-run CSV exporters and rebuild manifest
- **Outdated Data**: Check data pipeline, refresh exports
- **Directory Issues**: Verify CSV_DIR environment variable

**Example Fix:**
```bash
# Re-export all CSV data
npm run export:csv
npm run build:manifest

# Or regenerate from database
python scripts/export_scout_data.py --rebuild-all
```

---

### 3. Edge Function Failures

**Symptoms:**
- HTTP 500/502 errors from Supabase functions
- Timeout errors on function calls
- CORS or authentication failures

**Diagnostics:**
```bash
# Test edge functions directly
curl -v "$SUPABASE_URL/functions/v1/isko-sku-scraper/health"
curl -v "$SUPABASE_URL/functions/v1/agent-job-runner/health"

# Check Supabase logs
supabase functions logs isko-sku-scraper
supabase functions logs agent-job-runner
```

**Common Fixes:**
- **CORS Issues**: Check `x-tenant-id` header is included in requests
- **Authentication**: Verify Supabase service role key
- **Timeouts**: Check function performance, add timeout handling
- **Dependencies**: Verify edge function dependencies are deployed

**Example Fix:**
```bash
# Redeploy edge functions
supabase functions deploy isko-sku-scraper
supabase functions deploy agent-job-runner

# Test with proper headers
curl -X POST "$SUPABASE_URL/functions/v1/isko-sku-scraper" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant" \
  -d '{"dry_run": true}'
```

---

### 4. Database Check Failures

**Symptoms:**
- Connection timeouts
- Missing scout_ux.* views
- RLS policy errors
- Missing scout_silver tables

**Diagnostics:**
```bash
# Test database connection
psql "$DB_URL" -c "SELECT 1"

# Check critical objects
psql "$DB_URL" -c "\\dt scout_ux.*"
psql "$DB_URL" -c "\\dt scout_silver.*"

# Test RLS policies
psql "$DB_URL" -c "SELECT 1 FROM scout_silver.transactions LIMIT 1"
```

**Common Fixes:**
- **Missing Views**: Run database migrations, rebuild views
- **RLS Issues**: Enable RLS on `scout_silver.transactions` and `transaction_items`
- **Connection Issues**: Check database URL, network connectivity
- **Schema Drift**: Apply latest migrations

**Example Fix:**
```bash
# Apply database migrations
supabase db push
supabase db reset --linked

# Or run specific migration
psql "$DB_URL" -f migrations/001_scout_schema.sql
```

---

### 5. API Endpoint Failures

**Symptoms:**
- HTTP 404/500 errors from local app
- JSON parsing errors
- App not responding

**Diagnostics:**
```bash
# Check if app is running
curl -v http://localhost:3000/

# Test specific endpoints
curl -v http://localhost:3000/api/analytics
curl -v http://localhost:3000/api/geo
curl -v http://localhost:3000/api/exports

# Check app logs
npm run dev # Look for error messages
```

**Common Fixes:**
- **App Not Running**: Start the development server
- **Missing Routes**: Check API route definitions
- **Environment Variables**: Verify required env vars are set
- **Database Connection**: Check if app can connect to database

**Example Fix:**
```bash
# Start app and test
npm run build
npm run preview &
sleep 5

# Test endpoints
./scripts/smoke-tests.sh api
```

---

## 🔧 Environment Setup Issues

### Missing Dependencies
```bash
# Python dependencies
pip install -r validators/requirements.txt

# Node dependencies
npm ci

# Playwright browsers
npx playwright install --with-deps
```

### Environment Variables
```bash
# Required variables
export DB_URL="postgresql://..."
export SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
export APP_URL="http://localhost:3000"
export CSV_DIR="scout_v6_deployment/data/csv"

# Optional (for pixel parity)
export FIGMA_TOKEN="..."
export FIGMA_FILE_KEY="..."
```

### GitHub Secrets (CI Only)
```bash
# Set up all required secrets
./scripts/setup-github-secrets.sh

# Or manually
gh secret set DB_URL --body "your-db-url"
gh secret set SUPABASE_URL --body "https://cxzllzyxwpyptfretryc.supabase.co"
```

---

## 📊 Monitoring & Alerts

### Check Validation History
```bash
# View recent validation reports
ls -la validators/logs/scout_v6_validation_*.json
ls -la validators/logs/scout_v6_validation_*.md

# Quick summary of last validation
tail -20 validators/logs/scout_v6_validation_*.md | tail -1
```

### Performance Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "$SUPABASE_URL/functions/v1/agent-job-runner/health"

# Monitor database performance
psql "$DB_URL" -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5"
```

---

## 🆘 Escalation Checklist

When multiple systems are failing:

1. **Check System Status**
   - [ ] Database accessible and responsive
   - [ ] Supabase functions deployed and healthy  
   - [ ] Local app running and responsive
   - [ ] CSV exports recent and complete

2. **Check Dependencies**
   - [ ] All Python packages installed
   - [ ] Node modules up to date
   - [ ] Playwright browsers installed
   - [ ] Environment variables set

3. **Check Data Pipeline**
   - [ ] Database migrations applied
   - [ ] RLS policies active
   - [ ] Views and tables exist
   - [ ] CSV exports recent

4. **Contact Points**
   - Platform issues → DevOps team
   - Data issues → Data engineering team  
   - UI issues → Frontend team
   - Function issues → Backend team

---

## 📝 Adding New Checks

To add new validation checks to `validate_scout_v6.py`:

```python
def validate_new_component(self) -> bool:
    """Test new component"""
    start = time.time()
    
    try:
        # Your validation logic here
        success = check_component()
        
        duration_ms = int((time.time() - start) * 1000)
        
        if success:
            self.result.add_check('New Component', 'pass', 
                {'details': 'relevant_info'}, duration_ms)
            return True
        else:
            self.result.add_check('New Component', 'fail',
                {'error': 'failure_reason'}, duration_ms)
            return False
            
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        self.result.add_check('New Component', 'fail',
            {'error': str(e)}, duration_ms)
        return False
```

Then add it to the `run_validation()` method checks list.