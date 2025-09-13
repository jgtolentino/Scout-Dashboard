# PH Awards Archive Analysis Database Deployment Guide

This guide will help you complete the setup of the PH Awards Archive Analysis system by deploying the database tables and importing the analysis data.

## Step 1: Run Analysis (Already Completed)

You've already run the analysis in demo mode, which generated data in the `/Users/tbwa/analysis_results/` directory.

## Step 2: Deploy Database Tables

Since we're having authentication issues with the automated deployment, you'll need to deploy the tables manually using the Azure Portal:

1. Sign in to the [Azure Portal](https://portal.azure.com)

2. Navigate to your SQL database:
   - Search for "SQL databases" in the top search bar
   - Find and select the "CESDatabank" database on the "tbwa-ces-model-server" server

3. Open the Query Editor:
   - In the left menu of the database screen, select "Query editor"
   - Sign in using:
     - **SQL Server Authentication**:
       - Username: your Azure SQL admin username
       - Password: your Azure SQL admin password
     - Or use **Active Directory Authentication** if you're set up as an AD admin

4. Deploy the SQL Script:
   - Copy the contents of the `/Users/tbwa/deploy_tables.sql` file
   - Paste it into the query editor
   - Click "Run" to execute the script
   - You should see messages indicating that each table was created

5. Verify the Tables:
   - Run this query to verify the tables were created:
   ```sql
   SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%';
   ```
   - You should see 6 tables with the "PH_" prefix

## Step 3: Import the Analysis Data

After the tables are created, you can import the analysis data:

```bash
python3 /Users/tbwa/import_data_after_tables_created.py /Users/tbwa/analysis_results
```

This script will:
1. Load the JSON data from the analysis results
2. Connect to the database using the TBWA account created by the deploy_tables.sql script
3. Import the data into the tables
4. Verify that the data was imported correctly

## Step 4: Query the Data

Once the data is imported, you can query it using the Azure Portal or SQL Server Management Studio:

```sql
-- Get all campaigns
SELECT * FROM PH_Awards_Campaigns;

-- Get Filipino metrics for campaigns with high Filipino index
SELECT c.name, f.*
FROM PH_Awards_Campaigns c
JOIN PH_Filipino_Metrics f ON c.id = f.campaign_id
WHERE f.filipino_index > 0.5
ORDER BY f.filipino_index DESC;

-- Get award performance metrics
SELECT c.name, c.brand, c.year, a.* 
FROM PH_Awards_Campaigns c
JOIN PH_Awards_Performance a ON c.id = a.campaign_id
ORDER BY a.highest_award_tier DESC;

-- Get content analysis metrics
SELECT c.name, ca.* 
FROM PH_Awards_Campaigns c
JOIN PH_Content_Analysis ca ON c.id = ca.campaign_id
ORDER BY ca.content_analysis_index DESC;

-- Get business impact metrics
SELECT c.name, c.year, b.* 
FROM PH_Awards_Campaigns c
JOIN PH_Business_Impact b ON c.id = b.campaign_id
ORDER BY b.roi_percent DESC;
```

## Troubleshooting

If you encounter issues with database connection:

1. **Firewall Issues**: Make sure your IP address is whitelisted in the Azure SQL Server firewall rules.
   - In the Azure Portal, navigate to the SQL server
   - Select "Networking" from the left menu
   - Add your client IP address to the firewall rules

2. **Authentication Issues**: 
   - Verify that the TBWA login was created by the deploy_tables.sql script
   - If needed, create the login manually:
   ```sql
   CREATE LOGIN [TBWA] WITH PASSWORD = 'R@nd0mPA$2025!';
   CREATE USER [TBWA] FOR LOGIN [TBWA];
   ALTER ROLE db_owner ADD MEMBER [TBWA];
   ```

3. **Driver Issues**:
   - Ensure the ODBC Driver 17 for SQL Server is installed

## Generating Reports

After the data is imported, you can run additional analysis scripts to generate reports:

```bash
# Generate summary report
python3 /Users/tbwa/generate_ph_awards_report.py

# Generate visualization dashboard
python3 /Users/tbwa/generate_ph_awards_dashboard.py
```

## Next Steps

1. Consider setting up a recurring analysis pipeline to keep the data up to date.
2. Explore integrating the data with PowerBI or Tableau for interactive visualization.
3. Implement automated alerting for new award-winning campaigns.

## Support

If you encounter any issues, please reach out to the InsightPulseAI team for assistance.