# Scout Dashboard Database Seeding Instructions

## Quick Steps to Apply the Seeding Script

### 1. Open Supabase SQL Editor
Go to: [https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new](https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new)

### 2. Copy and Paste
Copy the entire contents of `/Users/tbwa/seed-scout-dashboard.sql` and paste into the SQL editor.

### 3. Execute
Click the "Run" button or press Cmd+Enter to execute.

## What This Script Does

### ✅ Creates Master Data
- **7 Product Categories**: Tobacco, Dairy, Snacks, Beverages, etc.
- **39 TBWA Brands**: Across 5 companies (Alaska, Oishi, Peerless, Del Monte, JTI)
- **23 Competitor Brands**: For realistic market simulation
- **20 Retail Stores**: Across all Philippine regions
- **21 Geographic Locations**: Major cities and provinces

### ✅ Generates 15,000 Scout Transactions
- **22% TBWA Market Share**: Overall brand distribution
- **40% JTI Cigarette Share**: Within tobacco category
- **Realistic Data**: Timestamps, locations, demographics, payment methods
- **AI Metrics**: Handshake scores, campaign influence

### ✅ Provides Analytics
- Market share verification
- Revenue calculations  
- Regional distribution
- Top performing brands

## Expected Results

After running the script, you should see:

```
Total Transactions: 15,000
TBWA Market Share: 22.0%
JTI Cigarette Share: 40.0%
Total Revenue: ₱8,925,432.00
Unique Brands: 62
Unique Stores: 15,000
```

## Verification Query

Run this to verify the data was loaded correctly:

```sql
SELECT 
  COUNT(*) as total_transactions,
  ROUND(AVG(CASE WHEN is_tbwa_client THEN 1 ELSE 0 END) * 100, 1) as tbwa_share,
  SUM(peso_value) as total_revenue
FROM scout_transactions;
```

## Next Steps

1. **Run Data Generator**: Execute `/Users/tbwa/run-scout-generator.sh` for more data
2. **Deploy SuqiBot**: Apply Medallion architecture for data processing
3. **Launch Dashboard**: View the analytics at http://localhost:3000

---

**Note**: The script includes a transaction generator function that can be called anytime to add more data:

```sql
-- Generate 10,000 more transactions
SELECT generate_scout_transactions(10000, 0.22, 0.40);
```