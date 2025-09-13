# Project Scout Session Matching Migration Guide

## Overview

This guide provides instructions for executing the database migration that enhances Project Scout's schema with session matching capabilities and transaction metrics. The migration adds new tables, procedures, and view for better correlation between audio and video events and more comprehensive transaction data.

## What This Migration Adds

The migration script adds the following to your database:

1. **Session Matching Table**: Explicitly correlates audio transcriptions with visual detections
2. **Transaction Metrics**: Enhances SalesInteractions with duration, item counts, and value
3. **Product Quantity Tracking**: Adds TransactionItems for detailed product tracking
4. **Request Method Classification**: Categorizes how customers request products
5. **Filipino Commodity Support**: Special handling for unbranded items like "yelo" (ice)

## Prerequisites

Before running the migration:

1. **Backup Your Database**: Always create a full backup before running migrations
2. **Node.js**: Ensure Node.js 14+ is installed
3. **SQL Server Access**: You need credentials with schema modification permissions
4. **Dependencies**: Install required npm packages:
   ```
   npm install mssql
   ```

## Running the Migration

### Option 1: Using the Migration Script

1. **Configure Database Connection**:
   Edit `run_sql_migration_direct.js` and update the database configuration:

   ```javascript
   const config = {
     user: process.env.DB_USER || 'your_username',
     password: process.env.DB_PASSWORD || 'your_password',
     server: process.env.DB_SERVER || 'your_server.database.windows.net',
     database: process.env.DB_NAME || 'your_database',
     options: {
       encrypt: true,
       trustServerCertificate: false,
       enableArithAbort: true
     }
   };
   ```

2. **Set Environment Variables** (Optional):
   ```bash
   export DB_USER=your_username
   export DB_PASSWORD=your_password
   export DB_SERVER=your_server.database.windows.net
   export DB_NAME=your_database
   ```

3. **Run the Migration**:
   ```bash
   node run_sql_migration_direct.js
   ```

### Option 2: Using Azure Data Studio or SSMS

1. Open Azure Data Studio or SQL Server Management Studio
2. Connect to your database
3. Open the migration script: `final-locked-dashboard/sql/session_matching_enhancement.sql`
4. Execute the script

## Testing the Migration

After running the migration, verify it was successful:

1. **Check for New Tables**:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_NAME IN ('SessionMatches', 'TransactionItems', 'RequestMethods', 'UnbrandedCommodities');
   ```

2. **Check SalesInteractions for New Columns**:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE 
   FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'SalesInteractions' 
   AND COLUMN_NAME IN ('TransactionDuration', 'ProductCount', 'TotalItemCount', 'TransactionValue');
   ```

3. **Check Dashboard View**:
   ```sql
   SELECT TOP 10 * FROM dbo.SalesInteractionDashboardView;
   ```

## Troubleshooting

### Common Errors

1. **Login failed**: Check your database credentials
   ```
   DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME
   ```

2. **Cannot connect to server**: Ensure the server is accessible and you have network connectivity

3. **Objects already exist**: If running the migration multiple times, you may need to drop existing objects first

4. **Transaction Rollback**: If the transaction is rolled back, check for errors in the specific step that failed

### Running in Mock Mode

For testing purposes, you can run the migration in mock mode:

1. Edit `run_sql_migration_direct.js` and set:
   ```javascript
   const MOCK_MODE = true;
   ```

2. Run the script:
   ```bash
   node run_sql_migration_direct.js
   ```

This will simulate the migration without connecting to a real database.

## Post-Migration Actions

After successful migration:

1. Update application code to use the new schema (e.g., SessionMatches table)
2. Add logic to populate the new transaction metrics
3. Test the dashboard with the enhanced schema
4. Document the updated database schema for future reference

## Need Help?

Contact the database administrator or development team for assistance with this migration.

---

*Last Updated: May 2025*