# PH Awards Analysis System - Setup Guide

## Overview

The PH Awards Analysis System consists of two main components:
1. **Analysis Component**: Generates metrics from campaign data (fully functional)
2. **Database Component**: Stores analysis results for querying (needs setup)

## Current Status

- ✅ Analysis component has successfully generated sample data in `/Users/tbwa/analysis_results/`
- ✅ Visualizations and dashboard have been created
- ✅ Database schema has been defined and scripts prepared
- ❌ Database tables need to be created (authentication issues encountered)

## Option 1: Manual Setup via Azure Portal (Recommended)

### Step 1: Create Database Tables in Azure Portal

1. **Login to Azure Portal**:
   - Go to: [https://portal.azure.com](https://portal.azure.com)
   - Use your Microsoft account credentials (s224670304@deakin.edu.au)
   - Navigate to SQL server "tbwa-ces-model-server"
   - Select the "CESDatabank" database
   - Click on "Query editor"

2. **In the Query Editor**:
   - Run the SQL script located at `/Users/tbwa/ph_awards_schema.sql`
   - Or copy it from below:

```sql
-- PH Awards Database Tables - For Azure Portal Query Editor
-- Generated: Sat 10 May 2025

-- Create PH_Awards_Campaigns table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Awards_Campaigns')
BEGIN
    CREATE TABLE PH_Awards_Campaigns (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        brand VARCHAR(50),
        year INT,
        awards VARCHAR(255),
        categories VARCHAR(255),
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PH_Awards_Campaigns table';
END
ELSE
BEGIN
    PRINT 'PH_Awards_Campaigns table already exists';
END

-- [Additional table creation statements...]

-- Verify tables were created
SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%';
```

3. **Verify Tables**:
   - After execution, run this SQL query:
   ```sql
   SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%';
   ```
   - You should see 6 tables with names starting with 'PH_'

### Step 2: Import Data to Database

After the tables are created in the Azure Portal, return to your terminal and run:

```bash
python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results
```

This script will:
- Connect to the database using SQL authentication
- Import all analysis data into the tables
- Verify the imports

### Step 3: Verify Complete Setup

Run the verification script to ensure everything is working:

```bash
python3 /Users/tbwa/verify_ph_awards_setup.py
```

### Step 4: View Results Dashboard

Open the interactive dashboard to view analysis results:

```bash
open /Users/tbwa/analysis_results/ph_awards_dashboard.html
```

## Option 2: CLI Setup (Automated Attempt)

We've created a Python script that attempts to deploy the tables via CLI with multiple authentication methods:

```bash
python3 /Users/tbwa/deploy_tables_cli.py
```

Note: This script has been encountering authentication issues with:
- SQL authentication using TBWA user
- SQL authentication using cesadmin user
- Microsoft Entra (Azure AD) authentication

## Troubleshooting

If you encounter database connection issues:

1. **Check that TBWA login exists**:
   - In Azure Portal Query Editor, run:
   ```sql
   SELECT name FROM sys.sql_logins WHERE name = 'TBWA';
   ```
   - If it doesn't exist, run:
   ```sql
   CREATE LOGIN [TBWA] WITH PASSWORD = 'R@nd0mPA$$2025!';
   CREATE USER [TBWA] FOR LOGIN [TBWA];
   ALTER ROLE db_owner ADD MEMBER [TBWA];
   ```

2. **Check firewall rules**:
   - Ensure your IP address is allowed in the firewall rules
   - We've already added it during our setup attempts

3. **Check database exists**:
   - In Azure Portal, verify that CESDatabank exists
   - Current setup shows it is a Standard tier database with 10 DTUs

## Analysis Component

The analysis component is fully functional and has successfully:
- Generated demo data in the `/Users/tbwa/analysis_results/` directory
- Created visualizations for all metrics
- Built an interactive HTML dashboard

## Key Files

- `/Users/tbwa/enhanced_analyzer.py` - Main analysis script
- `/Users/tbwa/run_enhanced_analysis.sh` - Analysis script runner
- `/Users/tbwa/deploy_tables.sql` - Complete database setup script
- `/Users/tbwa/ph_awards_schema.sql` - Simplified schema for Azure Portal
- `/Users/tbwa/import_ph_awards_data.py` - Data import script
- `/Users/tbwa/verify_ph_awards_setup.py` - Setup verification script
- `/Users/tbwa/deploy_tables_cli.py` - CLI deployment script