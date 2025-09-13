# 🔍 How to Check Schemas in Azure Portal

## For SQL Database (SQL-TBWA-ProjectScout-Reporting-Prod):

1. Go to your SQL database in Portal
2. Click **Query editor (preview)**
3. Login with credentials
4. Run these queries:

### Check All Schemas:
```sql
-- List all schemas
SELECT SCHEMA_NAME 
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME NOT IN ('sys', 'guest', 'INFORMATION_SCHEMA')
ORDER BY SCHEMA_NAME;
```

### Check Tables Per Schema:
```sql
-- Count tables in each schema
SELECT 
    TABLE_SCHEMA as SchemaName,
    COUNT(*) as TableCount
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
GROUP BY TABLE_SCHEMA
ORDER BY TABLE_SCHEMA;
```

### List All Tables with Schema:
```sql
-- All tables with their schemas
SELECT 
    TABLE_SCHEMA + '.' + TABLE_NAME as FullTableName,
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

## For PostgreSQL (scout-analytics-db):

1. Go to PostgreSQL server in Portal
2. Open **Cloud Shell** (>_ icon)
3. Connect:
```bash
psql -h scout-analytics-db.postgres.database.azure.com -U adminuser -d postgres
```

4. Run these commands:
```sql
-- List all databases
\l

-- Connect to a database
\c database_name

-- List all schemas
\dn

-- List tables in current schema
\dt

-- List all tables in all schemas
\dt *.*
```

## 🎯 What to Look For:

### Simple Setup (Most Common):
- **1 schema** (dbo in SQL, public in PostgreSQL)
- All tables in default schema
- Easy migration

### Complex Setup:
- Multiple schemas (e.g., sales, inventory, reporting)
- Tables spread across schemas
- Need to recreate schema structure

### Example Output:
```
SchemaName    TableCount
-----------   -----------
dbo           15
reporting     5
staging       3
```

This tells you:
- 3 schemas to migrate
- 23 total tables
- Need CREATE SCHEMA statements

## 📊 Quick Schema Check Script:

```sql
-- Run in SQL Query Editor
-- This gives you everything needed for migration

SELECT 
    'Total Schemas: ' + CAST(COUNT(DISTINCT TABLE_SCHEMA) as VARCHAR) as Summary
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Tables: ' + CAST(COUNT(*) as VARCHAR)
FROM INFORMATION_SCHEMA.TABLES  
WHERE TABLE_TYPE = 'BASE TABLE'
UNION ALL
SELECT 
    'Schema: ' + TABLE_SCHEMA + ' has ' + CAST(COUNT(*) as VARCHAR) + ' tables'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
GROUP BY TABLE_SCHEMA;
```

**Run these queries to see exactly what needs migration!**