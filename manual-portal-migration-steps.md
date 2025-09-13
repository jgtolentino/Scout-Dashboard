# 🔄 Manual SQL to PostgreSQL Migration via Portal

## 📋 Step-by-Step Portal Migration

### 1️⃣ EXTRACT DATA FROM SQL (Portal)

#### A. Get Table List
1. Go to **SQL-TBWA-ProjectScout-Reporting-Prod**
2. Click **Query editor (preview)**
3. Login with SQL credentials
4. Run this query:
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
```
5. Copy the list of tables

#### B. Export Each Table to CSV
For each table, run:
```sql
SELECT * FROM [your_table_name]
```
Then:
- Click **Export** → **Export as CSV**
- Download the CSV file
- Repeat for ALL tables

#### C. Get Schema (Table Structure)
For each table, run:
```sql
-- Get column definitions
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'your_table_name'
ORDER BY ORDINAL_POSITION
```
Copy results to a text file.

### 2️⃣ PREPARE POSTGRESQL (Portal)

Since you already have PostgreSQL servers:
1. Go to **scout-analytics-db** (or other PostgreSQL)
2. Click **Connect** → **Connection strings**
3. Note the connection details

### 3️⃣ CREATE TABLES IN POSTGRESQL

#### Using Azure Portal Query Editor:
1. Go to your PostgreSQL server
2. **Databases** → Create database (if needed)
3. Use **Azure Cloud Shell** (Portal top bar >_)

#### In Cloud Shell:
```bash
# Connect to PostgreSQL
psql -h scout-analytics-db.postgres.database.azure.com \
     -U adminuser -d postgres

# Create your database
CREATE DATABASE scout_reporting;

# Connect to new database
\c scout_reporting

# Create tables (convert SQL Server syntax)
CREATE TABLE your_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    created_date TIMESTAMP
    -- etc based on schema export
);
```

### 4️⃣ IMPORT CSV DATA

#### Option A: Using Cloud Shell
```bash
# Upload CSV to Cloud Shell
# Click "Upload/Download files" in Cloud Shell

# Import CSV to PostgreSQL
psql -h your-server.postgres.database.azure.com \
     -U adminuser -d scout_reporting \
     -c "\COPY your_table FROM 'data.csv' CSV HEADER"
```

#### Option B: Using Portal Storage
1. Upload CSVs to **projectscoutdata** storage
2. Get the URL for each CSV
3. In PostgreSQL, use COPY FROM PROGRAM

### 📝 DATA TYPE CONVERSIONS

| SQL Server | PostgreSQL |
|------------|------------|
| NVARCHAR | VARCHAR |
| DATETIME | TIMESTAMP |
| BIT | BOOLEAN |
| UNIQUEIDENTIFIER | UUID |
| VARBINARY | BYTEA |
| MONEY | DECIMAL(19,4) |

### 🛠️ COMPLETE MIGRATION SCRIPT EXAMPLE

```sql
-- In PostgreSQL
-- 1. Create table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255),
    created_date TIMESTAMP,
    is_active BOOLEAN
);

-- 2. Import from CSV (in Cloud Shell)
\COPY customers FROM '/home/user/customers.csv' CSV HEADER;

-- 3. Verify
SELECT COUNT(*) FROM customers;
```

### 🔑 MIGRATE KEY VAULT SECRETS

1. Go to **kv-projectscout-prod**
2. Click each secret → **Show Secret Value**
3. Copy to text file
4. In PostgreSQL:
```sql
CREATE TABLE app_secrets (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);

INSERT INTO app_secrets VALUES 
('DATABASE_URL', 'your-connection-string'),
('API_KEY', 'your-api-key');
```

### ⚠️ LIMITATIONS & TIPS

**Challenges:**
- Large tables (>1M rows) - CSV export might timeout
- Complex schemas - Manual conversion needed
- Stored procedures - Must rewrite for PostgreSQL
- Foreign keys - Add after data import

**Tips:**
1. Start with smallest tables first
2. Export in batches for large tables:
```sql
-- Export in chunks
SELECT * FROM large_table 
WHERE id BETWEEN 1 AND 100000
```

3. Disable constraints during import:
```sql
ALTER TABLE your_table DISABLE TRIGGER ALL;
-- import data
ALTER TABLE your_table ENABLE TRIGGER ALL;
```

### 🎯 FINAL CHECKLIST

- [ ] Export all table schemas
- [ ] Export all data as CSV
- [ ] Create PostgreSQL database
- [ ] Create all tables
- [ ] Import all CSV data
- [ ] Verify row counts match
- [ ] Migrate Key Vault secrets
- [ ] Test application connections
- [ ] Delete SQL Server
- [ ] Delete Key Vault

### 💡 ALTERNATIVE: Local Tools

If Portal export is too limited:
1. Use **Azure Data Studio** (free)
2. Connect to SQL Database
3. Export data more easily
4. Import to PostgreSQL

**This is tedious but FREE and works with disabled subscription!**