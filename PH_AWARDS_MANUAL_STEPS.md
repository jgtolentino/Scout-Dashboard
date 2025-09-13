# PH Awards Analysis System - Manual Setup Steps

## Step 1: Create Database Tables in Azure Portal

The Azure Portal Query Editor has been opened and the SQL schema has been copied to your clipboard. Follow these steps:

1. **Login to Azure Portal**:
   - Use your Microsoft account credentials

2. **In the Query Editor**:
   - Paste the schema from your clipboard
   - Click "Run" to execute the SQL script
   - You should see messages confirming each table was created

3. **Verify Tables**:
   - After execution, run this SQL query:
   ```sql
   SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%';
   ```
   - You should see 6 tables with names starting with 'PH_'

## Step 2: Import Data to Database

After the tables are created in the Azure Portal, return to your terminal and run:

```bash
python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results
```

This script will:
- Connect to the database using SQL authentication
- Import all analysis data into the tables
- Verify the imports

## Step 3: Verify Complete Setup

Run the verification script to ensure everything is working:

```bash
python3 /Users/tbwa/verify_ph_awards_setup.py
```

## Step 4: View Results Dashboard

Open the interactive dashboard to view analysis results:

```bash
open /Users/tbwa/analysis_results/ph_awards_dashboard.html
```

## Analysis Component

The analysis component is fully functional and has successfully:
- Generated demo data in the `/Users/tbwa/analysis_results/` directory
- Created visualizations for all metrics
- Built an interactive HTML dashboard

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

3. **Check table existence**:
   - In Azure Portal Query Editor, run:
   ```sql
   SELECT name FROM sys.tables WHERE name LIKE 'PH_%';
   ```
   - If tables don't exist, re-run the schema script