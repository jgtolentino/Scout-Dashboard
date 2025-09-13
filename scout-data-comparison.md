# Scout Data: Current vs Aligned Generator

## Current Issues in Your Database

### 1. Customer-Transaction Imbalance
- **Current**: 20,940 customers but only 15,000 transactions
- **Issue**: 5,940 customers (28.4%) have NO transactions
- **Root Cause**: Likely from incomplete data imports or test data

### 2. Data Flow Bottleneck
```
Bronze (50) → Silver (45) → Gold (3) → Scout (15,000)
```
- Only 3 records in Gold layer despite 15,000 in Scout
- Indicates direct imports bypassing ETL pipeline

### 3. Missing Standardization
- No consistent customer ID generation
- Missing location hierarchies
- Incomplete metadata fields

## How the Aligned Generator Fixes This

### 1. Guaranteed 1:1 Customer-Transaction Relationships
```python
# Generator creates customer_id from transaction data
customer_id = 'CUST-' + hash(store_id + customer_type + timestamp)
```
- Every transaction has a customer
- Every customer has at least one transaction
- No orphaned records

### 2. Complete 26-Field Data Dictionary Compliance
The generator creates ALL required fields:
- ✅ Geographic: All 17 Philippine regions with proper barangay/city/province
- ✅ Product: 49 TBWA SKUs + competitor brands  
- ✅ Behavioral: request_mode, request_type, substitution_event
- ✅ Demographics: gender, age_bracket, economic_class
- ✅ Analytics: handshake_score, campaign_influenced, is_tbwa_client

### 3. Realistic Data Distributions
```python
# TBWA market share
is_tbwa = random.random() < 0.22  # 22% market share

# Economic class by region
if location['region'] in ['NCR', 'Region III', 'Region IV-A']:
    economic_class = weighted_choice(['A':15%, 'B':25%, 'C':35%, 'D':20%, 'E':5%])
else:
    economic_class = weighted_choice(['A':2%, 'B':8%, 'C':25%, 'D':40%, 'E':25%])
```

### 4. Proper ETL Pipeline Flow
```sql
Aligned CSV → Bronze (staging) → Silver (validation) → Gold (aggregation) → Scout (production)
```

## Implementation Steps

### Quick Fix (Immediate)
```bash
# 1. Generate 10k aligned transactions
python3 aligned_data_generator.py --transactions 10000 --format csv

# 2. Import to Bronze
# Upload CSV to Supabase Storage, then run integrate-scout-generator.sql

# 3. Process through ETL
# Automatic: Bronze → Silver → Gold → Scout
```

### Full Migration (Recommended)
```bash
# 1. Generate full dataset matching your current volume
python3 aligned_data_generator.py --transactions 50000 --format csv

# 2. Backup current data
pg_dump -t scout.* > scout_backup.sql

# 3. Clear inconsistent data
TRUNCATE scout.scout_customers, scout.scout_transactions CASCADE;

# 4. Import aligned data
# Run full integrate-scout-generator.sql

# 5. Verify consistency
SELECT 
    (SELECT COUNT(*) FROM scout.scout_customers) as customers,
    (SELECT COUNT(*) FROM scout.scout_transactions) as transactions,
    (SELECT COUNT(DISTINCT customer_id) FROM scout.scout_transactions) as customers_with_tx;
```

## Benefits of Using Aligned Generator

1. **Data Consistency**: No orphaned customers, proper relationships
2. **Realistic Patterns**: Regional distributions, TBWA market share, economic classes
3. **Complete Metadata**: All 26 fields properly populated
4. **ETL Compatible**: Designed to flow through your Bronze→Silver→Gold→Scout pipeline
5. **Reproducible**: Seed-based generation for testing

## Edge Function Testing After Import

With properly aligned data, your Edge Functions will work correctly:

```javascript
// scout-etl function can now process complete records
{
    "transaction_id": "TXN12345678",
    "customer_id": "CUST-abc123",  // Always exists
    "store_id": "STO12345",        // Always exists
    "handshake_score": 0.85,       // Properly calculated
    "is_tbwa_client": true,        // Accurate flag
    "location": {                  // Complete hierarchy
        "barangay": "Brgy_Poblacion",
        "city": "Makati",
        "province": "Metro Manila",
        "region": "NCR"
    }
}
```

## Summary

Your current data has structural issues (orphaned customers, incomplete ETL flow). The aligned generator:
- Creates perfectly structured data matching Scout Dashboard v4.0 specs
- Ensures every customer has transactions
- Populates all 26 required fields
- Flows properly through your ETL pipeline
- Provides realistic Philippine retail patterns

Run `./run-scout-data-pipeline.sh` to generate and import clean data!