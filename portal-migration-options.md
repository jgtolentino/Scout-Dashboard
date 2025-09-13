# 🔄 Migration Options in Azure Portal

## ⚠️ LIMITED - Portal Migration Capabilities

### ❌ What Portal CANNOT Do:
- **Direct SQL → PostgreSQL migration** (no built-in tool)
- **Automated data transfer** between different database types
- **Cross-service migrations** (SQL Server to PostgreSQL)

### ✅ What Portal CAN Do:

## 1️⃣ EXPORT Data (Manual Migration)

### SQL Database Export:
1. Go to your SQL Database in Portal
2. Click **"Export"** (top menu)
3. Choose:
   - Storage account (for .bacpac file)
   - Container name
   - File name
   - Admin login/password
4. Creates `.bacpac` file (SQL Server format)

### PostgreSQL Import Challenge:
- `.bacpac` is SQL Server specific
- PostgreSQL can't read it directly
- Need conversion tools

## 2️⃣ AZURE DATABASE MIGRATION SERVICE (DMS)

### Portal Access:
1. Search "Database Migration Service"
2. Create new migration project
3. **Problem**: Requires subscription to be ENABLED
4. **Cost**: Additional charges for DMS

### DMS Capabilities:
- SQL Server → PostgreSQL supported
- Schema and data migration
- But needs active subscription

## 3️⃣ CONNECTION STRINGS (Manual Copy)

### Portal Data Viewing:
1. **SQL Database** → Query editor
   ```sql
   SELECT * FROM your_table
   ```
2. **Copy results** manually
3. **Paste** into PostgreSQL

### For Small Datasets:
- View data in Portal
- Copy/paste to text file
- Import to PostgreSQL

## 🎯 REALISTIC PORTAL-ONLY OPTIONS

### Option 1: Export + Convert (Semi-Manual)
```
1. Portal: Export SQL to .bacpac
2. Download .bacpac file
3. Use online converter (bacpac → PostgreSQL)
4. Import to PostgreSQL
```

### Option 2: Query Editor Copy (Very Manual)
```
1. Portal → SQL Database → Query editor
2. Run: SELECT * FROM each_table
3. Export results as CSV
4. Import CSV to PostgreSQL
```

### Option 3: Wait for Subscription
```
1. Enable subscription
2. Use Azure DMS
3. Automated migration
```

## 💡 WORKAROUND: Portal + Free Tools

### Step 1: Get Schema (Portal)
- SQL Database → Query editor
- Run: `sp_helptext` for each object
- Copy CREATE statements

### Step 2: Get Data (Portal)
- Query editor → SELECT * FROM table
- Export as CSV
- Download files

### Step 3: Import (Local)
- Install PostgreSQL locally
- Create schema
- Import CSV files
- Upload to Azure PostgreSQL

## 🚨 REALITY CHECK

**Portal-only migration is:**
- ❌ Very manual
- ❌ Time consuming  
- ❌ Error prone
- ❌ No direct SQL→PostgreSQL

**Better approach:**
1. Delete non-critical resources NOW
2. Enable subscription
3. Use proper migration tools

## 📊 DATA SIZE MATTERS

| Data Size | Portal Migration Feasible? |
|-----------|---------------------------|
| < 1GB | Yes (manual copy) |
| 1-10GB | Maybe (very tedious) |
| > 10GB | No (need proper tools) |

**For disabled subscription + Portal only = Very limited options**