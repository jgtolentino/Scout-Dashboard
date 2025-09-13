# PostgreSQL-Only Budget Plan

## 🐘 Final Architecture

### Single PostgreSQL Flexible Server
- **Name**: `scout-central-postgres`
- **Location**: East US (single region)
- **Tier**: Burstable B1ms
- **Storage**: 32GB (expandable)
- **Version**: PostgreSQL 15

### Consolidated Databases
1. `scout_reporting` (from SQL Server)
2. `scout_analytics` (from SQL Server)  
3. `genie_db` (from SQL Server)
4. `adsbot_db` (existing PostgreSQL)
5. `analytics_db` (existing PostgreSQL)

## 💰 Cost Breakdown

| Resource | Monthly Cost |
|----------|--------------|
| **PostgreSQL Flexible Server** | |
| - Compute (B1ms) | $25.55 |
| - Storage (32GB) | $4.74 |
| - Backup | $2.50 |
| **ADLS2 Storage** | $25 |
| **Key Vault** | $3 |
| **Total** | **$60.79/month** |

## 📊 Comparison

| Setup | Monthly | Annual | Savings |
|-------|---------|---------|---------|
| **Current (SQL + PostgreSQL)** | $350-500 | $4,200-6,000 | - |
| **PostgreSQL-Only** | $61 | $732 | **85%** |

## 🚀 Migration Steps

### Phase 1: Setup (Day 1)
1. Create `scout-central-postgres` server
2. Configure firewall rules
3. Create empty databases

### Phase 2: Migration (Days 2-3)
1. Export SQL Server databases
2. Convert schema to PostgreSQL
3. Import data to PostgreSQL
4. Test applications

### Phase 3: Cleanup (Day 4)
1. Verify all data migrated
2. Update connection strings
3. Delete SQL Servers
4. Delete old PostgreSQL servers

## 🔧 PostgreSQL Optimization

### Cost Optimization
```sql
-- Use connection pooling
max_connections = 50

-- Enable compression
wal_compression = on

-- Optimize for small workloads
shared_buffers = 256MB
```

### Free Tier Options
- **Development**: Use local PostgreSQL
- **Testing**: Azure Database for PostgreSQL free trial (12 months)
- **Production**: Minimum $25.55/month

## ✅ Benefits

1. **85% cost reduction** ($300-425/month savings)
2. **Single database platform** (easier management)
3. **Better open-source compatibility**
4. **No vendor lock-in**
5. **Simpler backup/restore**

## 🎯 Final Monthly Budget

| Item | Cost |
|------|------|
| PostgreSQL Server | $33 |
| ADLS2 Storage | $25 |
| Key Vault | $3 |
| **Total** | **$61/month** |
| **Annual** | **$732/year** |

From ~$5,000/year to ~$732/year = **85% reduction**