# Scout Analytics Schema Migration Guide
## Sprints 10-12: Data Gap Closure Implementation

### 📋 Overview

This migration package addresses the critical data gaps identified in the Scout Dashboard coverage audit. The migration is split across three sprints to minimize risk and ensure thorough testing at each stage.

### 🎯 Migration Objectives

**Sprint 10**: Foundation - Transaction timing and monetary calculations
**Sprint 11**: Analytics - Substitution patterns and performance views  
**Sprint 12**: Quality - Data integrity and validation systems

---

## 📂 Files Included

| File | Purpose | Sprint |
|------|---------|--------|
| `00_execute_all_migrations.sql` | Master execution script | All |
| `02_sprint10_transaction_duration_amounts.sql` | Duration & amount tracking | 10 |
| `03_sprint11_substitution_tracking_views.sql` | Substitution & analytics views | 11 |
| `04_sprint12_fk_constraints_validation.sql` | Data integrity & validation | 12 |

---

## 🚀 Pre-Migration Checklist

### Database Backup
```sql
-- Create full backup before migration
BACKUP DATABASE [scout_analytics] 
TO DISK = 'C:\Backups\scout_analytics_pre_migration.bak'
WITH FORMAT, COMPRESSION;
```

### System Requirements
- [ ] SQL Server 2017+ or Azure SQL Database
- [ ] Database size: ~500MB additional space required
- [ ] Maintenance window: 2-4 hours (depending on data volume)
- [ ] User permissions: `db_ddladmin`, `db_datawriter`, `db_datareader`

### Environment Validation
```sql
-- Verify database connection
SELECT DB_NAME() as CurrentDatabase, @@VERSION as SQLVersion;

-- Check current table sizes
SELECT 
    t.name as TableName,
    p.rows as RowCount,
    (SUM(a.total_pages) * 8) / 1024 as SizeMB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems', 'Products', 'Stores')
GROUP BY t.name, p.rows
ORDER BY SizeMB DESC;
```

---

## 📋 Execution Steps

### Option 1: Complete Migration (Recommended)
```bash
# Execute all sprints in sequence
sqlcmd -S your_server -d scout_analytics -i 00_execute_all_migrations.sql
```

### Option 2: Sprint-by-Sprint Execution
```bash
# Sprint 10 only
sqlcmd -S your_server -d scout_analytics -i 02_sprint10_transaction_duration_amounts.sql

# Sprint 11 only (after Sprint 10)
sqlcmd -S your_server -d scout_analytics -i 03_sprint11_substitution_tracking_views.sql

# Sprint 12 only (after Sprint 11)  
sqlcmd -S your_server -d scout_analytics -i 04_sprint12_fk_constraints_validation.sql
```

---

## 🎯 Sprint Details

### Sprint 10: Transaction Duration & Amounts

**What it adds:**
- `StartTime`, `EndTime`, `DurationSec` columns to `SalesInteractions`
- `TransactionAmount` persisted computed column
- Performance indexes for time-based analysis
- Trigger to maintain transaction amounts automatically

**Expected impact:**
- Enables duration analysis (service time, efficiency metrics)
- Eliminates runtime calculation overhead for transaction totals
- Supports hour-of-day and weekday analysis

**Validation:**
```sql
-- Check duration data population
SELECT 
    COUNT(*) as TotalTransactions,
    COUNT(DurationSec) as WithDuration,
    AVG(DurationSec) as AvgDurationSec,
    AVG(TransactionAmount) as AvgAmount
FROM dbo.SalesInteractions;
```

### Sprint 11: Substitution Tracking & Views

**What it adds:**
- Substitution tracking fields in `TransactionItems`
- Request method grouping (Branded/Unbranded/Unsure)
- Materialized `v_SkuFrequency` table for top products
- Analytics views: substitution patterns, basket analysis
- Geographic dimension table structure
- Age bracket computed column

**Expected impact:**
- Enables substitution pattern analysis
- Provides fast access to top SKU data
- Supports basket size and brand diversity analysis
- Geographic filtering capabilities

**Validation:**
```sql
-- Check new views
SELECT 'v_SubstitutionAnalysis' as ViewName, COUNT(*) as Records
FROM dbo.v_SubstitutionAnalysis
UNION ALL
SELECT 'v_BasketAnalysis', COUNT(*) FROM dbo.v_BasketAnalysis
UNION ALL  
SELECT 'v_SkuFrequency', COUNT(*) FROM dbo.v_SkuFrequency;
```

### Sprint 12: Data Integrity & Validation

**What it adds:**
- Foreign key constraints for referential integrity
- Audit tables for Products and Stores with triggers
- Comprehensive data quality validation procedures
- Nightly maintenance and integrity check procedures
- System health monitoring views
- Dashboard data export procedures

**Expected impact:**
- Prevents orphaned records and data corruption
- Provides audit trail for dimension changes
- Automated data quality monitoring
- Streamlined dashboard data exports

**Validation:**
```sql
-- Run data quality check
EXEC sp_DataQualityCheck;

-- Check system health
SELECT * FROM v_SystemHealthMetrics;
```

---

## 🔧 Post-Migration Setup

### 1. Schedule Maintenance Jobs

```sql
-- Create SQL Server Agent job for nightly checks
USE msdb;
GO

EXEC dbo.sp_add_job
    @job_name = N'Scout Analytics - Nightly Data Integrity Check';

EXEC dbo.sp_add_jobstep
    @job_name = N'Scout Analytics - Nightly Data Integrity Check',
    @step_name = N'Run Integrity Check',
    @command = N'EXEC scout_analytics.dbo.sp_NightlyDataIntegrityCheck',
    @database_name = N'scout_analytics';

EXEC dbo.sp_add_schedule
    @schedule_name = N'Daily at 2 AM',
    @freq_type = 4,
    @freq_interval = 1,
    @active_start_time = 20000;

EXEC dbo.sp_attach_schedule
    @job_name = N'Scout Analytics - Nightly Data Integrity Check',
    @schedule_name = N'Daily at 2 AM';
```

### 2. Configure SKU Frequency Refresh

```sql
-- Create job for SKU frequency refresh
EXEC dbo.sp_add_job
    @job_name = N'Scout Analytics - SKU Frequency Refresh';

EXEC dbo.sp_add_jobstep
    @job_name = N'Scout Analytics - SKU Frequency Refresh',
    @step_name = N'Refresh SKU Data',
    @command = N'EXEC scout_analytics.dbo.sp_RefreshSkuFrequency',
    @database_name = N'scout_analytics';

EXEC dbo.sp_add_schedule
    @schedule_name = N'Every 4 Hours Business Days',
    @freq_type = 4,
    @freq_interval = 1,
    @freq_subtype = 4,
    @freq_subtype_interval = 4,
    @active_start_time = 60000,
    @active_end_time = 180000;
```

### 3. Populate Geographic Data

```sql
-- Sample geographic data population
INSERT INTO dbo.GeoDimension (StoreID, Barangay, Municipality, Province, Region)
SELECT 
    StoreID,
    -- Parse from existing Location field or import from external source
    NULL as Barangay,
    NULL as Municipality, 
    NULL as Province,
    NULL as Region
FROM dbo.Stores;

-- Update with actual geographic data
-- (This requires manual data entry or import from external source)
```

---

## 📊 Performance Impact

### Expected Changes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Transaction Amount Calculation | Runtime aggregation | Persisted column | 90% faster |
| SKU Ranking Queries | Table scan | Materialized view | 95% faster |
| Duration Analysis | Not possible | Indexed column | New capability |
| Substitution Insights | Not available | Dedicated views | New capability |

### Index Usage Monitoring

```sql
-- Monitor index usage after migration
SELECT 
    i.name as IndexName,
    dm_ius.user_seeks + dm_ius.user_scans + dm_ius.user_lookups as TotalUses,
    dm_ius.user_updates as Updates,
    dm_ius.last_user_seek,
    dm_ius.last_user_scan
FROM sys.indexes i
INNER JOIN sys.dm_db_index_usage_stats dm_ius ON i.object_id = dm_ius.object_id AND i.index_id = dm_ius.index_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems')
AND i.name LIKE 'IX_%'
ORDER BY TotalUses DESC;
```

---

## 🛠️ Troubleshooting

### Common Issues

**1. Foreign Key Constraint Violations**
```sql
-- Find orphaned records before migration
SELECT 'Orphaned TransactionItems' as Issue, COUNT(*) as Count
FROM dbo.TransactionItems ti
LEFT JOIN dbo.SalesInteractions si ON ti.InteractionID = si.InteractionID
WHERE si.InteractionID IS NULL;
```

**2. Performance Degradation**
```sql
-- Check for missing statistics
SELECT 
    t.name as TableName,
    s.name as StatName,
    s.stats_id,
    STATS_DATE(s.object_id, s.stats_id) as LastUpdated
FROM sys.stats s
INNER JOIN sys.tables t ON s.object_id = t.object_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems')
AND STATS_DATE(s.object_id, s.stats_id) < DATEADD(DAY, -7, GETDATE());

-- Update statistics if needed
UPDATE STATISTICS dbo.SalesInteractions;
UPDATE STATISTICS dbo.TransactionItems;
```

**3. Trigger Performance Issues**
```sql
-- Monitor trigger execution time
SELECT 
    name,
    is_disabled,
    create_date,
    modify_date
FROM sys.triggers
WHERE parent_id IN (OBJECT_ID('dbo.SalesInteractions'), OBJECT_ID('dbo.TransactionItems'));
```

### Rollback Procedures

If issues arise, use these rollback scripts:

```sql
-- Rollback Sprint 12 (if needed)
DROP PROCEDURE IF EXISTS sp_DataQualityCheck;
DROP PROCEDURE IF EXISTS sp_NightlyDataIntegrityCheck;
DROP PROCEDURE IF EXISTS sp_ExportDashboardData;
DROP TABLE IF EXISTS dbo.ProductUpdates;
DROP TABLE IF EXISTS dbo.StoreUpdates;
-- Continue with other objects...

-- Rollback Sprint 11 (if needed)
DROP VIEW IF EXISTS v_SubstitutionAnalysis;
DROP VIEW IF EXISTS v_RequestMethodAnalysis;
DROP VIEW IF EXISTS v_BasketAnalysis;
DROP TABLE IF EXISTS dbo.v_SkuFrequency;
DROP TABLE IF EXISTS dbo.GeoDimension;
-- Continue with column drops...

-- Rollback Sprint 10 (if needed)
ALTER TABLE dbo.SalesInteractions DROP COLUMN IF EXISTS TransactionAmount;
ALTER TABLE dbo.SalesInteractions DROP COLUMN IF EXISTS DurationSec;
ALTER TABLE dbo.SalesInteractions DROP COLUMN IF EXISTS EndTime;
ALTER TABLE dbo.SalesInteractions DROP COLUMN IF EXISTS StartTime;
```

---

## 📈 Success Metrics

After migration completion, validate these metrics:

1. **Data Completeness**: >95% of transactions have duration and amount data
2. **Performance**: Dashboard queries execute in <2 seconds
3. **Data Quality**: Zero critical issues in daily quality checks
4. **Audit Trail**: All dimension changes are logged
5. **Referential Integrity**: Zero orphaned records

---

## 🤝 Support

For issues or questions:
- Database Team: Check `IntegrationAuditLogs` for detailed error messages
- Dashboard Team: Use new views and export procedures for data access
- ETL Team: Monitor audit tables for dimension change impacts

### Monitoring Commands

```sql
-- Check migration status
SELECT * FROM dbo.IntegrationAuditLogs 
WHERE Message LIKE '%MIGRATION%' 
ORDER BY CreatedAt DESC;

-- Daily health check
EXEC sp_DataQualityCheck;

-- Export data for dashboard
EXEC sp_ExportDashboardData @StartDate = '2024-01-01', @EndDate = '2024-12-31';
```

---

*Migration prepared by: Database Architecture Team*  
*Last updated: 2024*  
*Version: 1.0*