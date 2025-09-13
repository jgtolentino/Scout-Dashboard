# PH Awards Analysis System - Azure Portal Deployment

We need to use the Azure Portal for the database deployment since we don't have sufficient permissions to create a service principal or manage SQL authentication. Follow these steps:

## Step 1: Access Azure Portal Query Editor

1. Open a web browser and go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Microsoft account (s224670304@deakin.edu.au)
3. Navigate to SQL server 'tbwa-ces-model-server'
4. Select the 'CESDatabank' database
5. Click on 'Query editor' in the left menu

## Step 2: Authenticate in Query Editor

1. Under "Authentication type", select "Microsoft Entra"
2. Sign in with your Microsoft account (s224670304@deakin.edu.au)

## Step 3: Run the SQL Script

Copy and paste the following script into the Query Editor:

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

-- Create PH_Awards_Performance table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Awards_Performance')
BEGIN
    CREATE TABLE PH_Awards_Performance (
        campaign_id VARCHAR(50) PRIMARY KEY,
        highest_award_tier INT,
        highest_award_category VARCHAR(50),
        total_awards INT,
        category_competitiveness FLOAT,
        historical_win_rate FLOAT,
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PH_Awards_Performance table';
END
ELSE
BEGIN
    PRINT 'PH_Awards_Performance table already exists';
END

-- Create PH_Filipino_Metrics table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Filipino_Metrics')
BEGIN
    CREATE TABLE PH_Filipino_Metrics (
        campaign_id VARCHAR(50) PRIMARY KEY,
        has_sari_sari INT,
        has_jeepney INT,
        has_palengke INT,
        has_badyet_meal INT,
        has_fiesta INT,
        has_barangay INT,
        has_pinoy_pride INT,
        has_ofw_reference INT,
        has_filipino_food INT,
        has_filipino_slang INT,
        has_taglish INT,
        has_regional_dialect INT,
        has_local_celebrity INT,
        has_fiesta_theme INT,
        has_province_reference INT,
        has_local_humor INT,
        has_filipino_values INT,
        filipino_index FLOAT,
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PH_Filipino_Metrics table';
END
ELSE
BEGIN
    PRINT 'PH_Filipino_Metrics table already exists';
END

-- Create PH_Content_Analysis table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Content_Analysis')
BEGIN
    CREATE TABLE PH_Content_Analysis (
        campaign_id VARCHAR(50) PRIMARY KEY,
        message_clarity FLOAT,
        narrative_structure FLOAT,
        emotional_resonance FLOAT,
        brand_prominence FLOAT,
        consumer_insight_quality FLOAT,
        execution_quality FLOAT,
        content_analysis_index FLOAT,
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PH_Content_Analysis table';
END
ELSE
BEGIN
    PRINT 'PH_Content_Analysis table already exists';
END

-- Create PH_Evolution_Tracking table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Evolution_Tracking')
BEGIN
    CREATE TABLE PH_Evolution_Tracking (
        campaign_id VARCHAR(50) PRIMARY KEY,
        year INT,
        previous_campaign_id VARCHAR(50),
        creative_evolution_score FLOAT,
        metric_improvement VARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PH_Evolution_Tracking table';
END
ELSE
BEGIN
    PRINT 'PH_Evolution_Tracking table already exists';
END

-- Create PH_Business_Impact table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Business_Impact')
BEGIN
    CREATE TABLE PH_Business_Impact (
        campaign_id VARCHAR(50) PRIMARY KEY,
        roi_percent FLOAT,
        sales_lift_percent FLOAT,
        brand_lift_percent FLOAT,
        market_share_increase FLOAT,
        new_customers_percent FLOAT,
        customer_retention FLOAT,
        cost_efficiency FLOAT,
        conversion_rate FLOAT,
        engagement_increase FLOAT,
        media_efficiency FLOAT,
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PH_Business_Impact table';
END
ELSE
BEGIN
    PRINT 'PH_Business_Impact table already exists';
END

-- Create TBWA user if it doesn't exist (run this after you connect with admin permissions)
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'TBWA')
BEGIN
    CREATE USER [TBWA] WITH PASSWORD = 'R@nd0mPA$$2025!';
    ALTER ROLE db_owner ADD MEMBER [TBWA];
    PRINT 'Created TBWA user and added to db_owner role';
END
ELSE
BEGIN
    PRINT 'TBWA user already exists';
END

-- Verify tables were created
SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%';
```

Click the "Run" button to execute the script.

## Step 4: Verify Tables

After running the script, you should see a message for each table created and a table listing all PH_ tables.

## Step 5: Import Data

Return to your terminal and run:

```bash
python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results
```

This script will:
- Connect to the database using SQL authentication
- Import all analysis data into the tables
- Verify the imports

## Step 6: Verify Setup

Run the verification script to ensure everything is working:

```bash
python3 /Users/tbwa/verify_ph_awards_setup.py
```

## Step 7: View Results Dashboard

Open the interactive dashboard to view analysis results:

```bash
open /Users/tbwa/analysis_results/ph_awards_dashboard.html
```

## Troubleshooting

If you encounter issues with the TBWA user authentication:

1. In Azure Portal Query Editor, try running:
   ```sql
   SELECT name FROM sys.database_principals WHERE name = 'TBWA';
   ```

2. If the TBWA user exists but authentication fails:
   ```sql
   ALTER USER [TBWA] WITH PASSWORD = 'R@nd0mPA$$2025!';
   ALTER ROLE db_owner ADD MEMBER [TBWA];
   ```

3. You can continue to use the Azure Portal Query Editor with Microsoft Entra authentication for all database operations if SQL authentication continues to fail.