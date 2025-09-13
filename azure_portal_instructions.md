# Azure Portal SQL Deployment Instructions

## 1. Access Azure Portal

Go to [Azure Portal](https://portal.azure.com) and log in with your account.

## 2. Navigate to the SQL Database

1. Use the search bar at the top and type "SQL databases"
2. Click on "SQL databases" in the results
3. Find and select "CESDatabank" in the list

## 3. Open Query Editor

1. In the left menu panel, look for "Query editor"
2. Click on it to open the query editor interface

## 4. Authentication

You'll need to authenticate to access the database:

- If prompted, select "Active Directory authentication" 
- You should be able to use your current Azure login

If that doesn't work, try SQL authentication:
- Username: TBWA
- Password: R@nd0mPA$$2025!

## 5. Execute the SQL Script

1. **Copy the SQL script**: The script is ready at `/Users/tbwa/deploy_tables.sql`
2. **Paste into Query Editor**: Click in the editor area and paste the script
3. **Execute**: Click the "Run" button to execute the script

## 6. Verify Tables Were Created

After execution, run this query to verify:

```sql
SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%';
```

You should see 6 tables with names starting with "PH_".

## 7. Import the Data

After the tables are created, come back to your terminal and run:

```bash
python3 /Users/tbwa/import_data_after_tables_created.py /Users/tbwa/analysis_results
```

## 8. Verify the Setup

Finally, run the verification script:

```bash
python3 /Users/tbwa/verify_ph_awards_setup.py
```

This will check if everything is set up correctly.