# PH Awards Database Setup for Administrators

This document provides instructions for database administrators to set up the PH Awards database tables and access.

## 1. Database Information

- **Server:** tbwa-ces-model-server.database.windows.net
- **Database:** CESDatabank
- **Resource Group:** RG-TBWA-ProjectScout-Data

## 2. Firewall Rules

The following IP has been added to the firewall:
- 175.176.17.118 (rule name: TBWA_User_Access)

If additional IPs need access, run the following Azure CLI command:
```bash
az sql server firewall-rule create --resource-group RG-TBWA-ProjectScout-Data --server tbwa-ces-model-server --name "Rule_Name" --start-ip-address <IP_ADDRESS> --end-ip-address <IP_ADDRESS>
```

## 3. SQL User Setup

### Option 1: Set up TBWA SQL Login (for SQL Authentication)

Run the following SQL commands on the Azure SQL Server to create the login and user:

```sql
-- Connect to master database to create login
USE master;
GO

-- Drop the login if it exists with wrong password
IF EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'TBWA')
BEGIN
    DROP LOGIN [TBWA];
END
GO

-- Create login with correct password
CREATE LOGIN [TBWA] WITH PASSWORD = 'R@nd0mPA$2025!';
GO

-- Connect to the database to create user
USE CESDatabank;
GO

-- Remove existing user if it exists
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'TBWA')
BEGIN
    DROP USER [TBWA];
END
GO

-- Create user and assign to db_owner role
CREATE USER [TBWA] FOR LOGIN [TBWA];
ALTER ROLE db_owner ADD MEMBER [TBWA]; -- Giving full permissions
GO
```

### Option 2: Configure Azure AD Authentication

If you prefer to use Azure AD authentication:

1. Add the user's Azure AD account as an Active Directory admin for the SQL server:

```bash
az sql server ad-admin create --resource-group RG-TBWA-ProjectScout-Data --server-name tbwa-ces-model-server --display-name "AD Admin" --object-id <Azure_AD_User_Object_ID>
```

2. In the SQL database, create a user for the Azure AD account:

```sql
USE CESDatabank;
GO

-- Replace <Azure_AD_User> with the user's Azure AD username or email
CREATE USER [<Azure_AD_User>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_owner ADD MEMBER [<Azure_AD_User>];
GO
```

## 4. Database Table Setup

After setting up the login, you can create the necessary tables by either:

1. Run our provided Python script:
   ```bash
   python3 create_ph_award_tables.py
   ```

2. Execute the SQL script directly:
   ```sql
-- Create Campaigns table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Awards_Campaigns')
CREATE TABLE PH_Awards_Campaigns (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    brand VARCHAR(50),
    year INT,
    awards VARCHAR(255),
    categories VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);

-- Create Award Performance table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Awards_Performance')
CREATE TABLE PH_Awards_Performance (
    campaign_id VARCHAR(50) PRIMARY KEY,
    highest_award_tier INT,
    highest_award_category VARCHAR(50),
    total_awards INT,
    category_competitiveness FLOAT,
    historical_win_rate FLOAT,
    created_at DATETIME DEFAULT GETDATE()
);

-- Create Filipino Metrics table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Filipino_Metrics')
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

-- Create Content Analysis table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Content_Analysis')
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

-- Create Evolution Tracking table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Evolution_Tracking')
CREATE TABLE PH_Evolution_Tracking (
    campaign_id VARCHAR(50) PRIMARY KEY,
    year INT,
    previous_campaign_id VARCHAR(50),
    creative_evolution_score FLOAT,
    metric_improvement VARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);

-- Create Business Impact table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PH_Business_Impact')
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
   ```

## 5. Data Import

After tables are created, data can be imported using our Python script:

```bash
python3 export_ph_awards_to_centraldb.py --results ./analysis_results
```

## Verification

To verify the setup, run:

```bash
python3 test_sql_connection.py
```

This should connect successfully and display the SQL Server version. After data import, you can check table contents using SQL queries:

```sql
SELECT COUNT(*) FROM PH_Awards_Campaigns;
SELECT COUNT(*) FROM PH_Filipino_Metrics;
SELECT COUNT(*) FROM PH_Content_Analysis;
```