# SQL Queries for Retail Advisor Sales and Session Data

This document provides instructions for accessing and analyzing session and sales interaction data from the SQL Server database for the Retail Advisor dashboard. It now includes information about dbt models that power the Scout Edge dashboard.

## Database Structure

The database contains the following key schemas and tables:

### Schemas

- **Sales**: Contains transaction and sales related tables
- **Store**: Contains store location and configuration data
- **Inventory**: Contains product and inventory data
- **Customer**: Contains customer profiles and segmentation
- **Analytics**: Contains session data and behavioral metrics
- **HR**: Contains employee information

### Key Tables

- `Sales.Transactions`: Main transactions table
- `Sales.TransactionItems`: Line items for each transaction
- `Analytics.CustomerSessions`: Customer session data for both online and in-store
- `Store.Locations`: Store location information
- `Inventory.Products`: Product catalog
- `Inventory.StockLevels`: Current inventory levels by product and store
- `Customer.Profiles`: Customer information and segments

## Accessing the Data

### Connection Details

```javascript
const config = {
  user: process.env.DB_USER || 'retail_advisor_user',
  password: process.env.DB_PASSWORD || 'your_password_here', 
  server: process.env.DB_SERVER || 'retail-advisor-sql.database.windows.net',
  database: process.env.DB_NAME || 'RetailAdvisorDB',
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true
  }
};
```

### Environment Variables

For security, set the following environment variables:
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_SERVER` - SQL Server address
- `DB_NAME` - Database name

## Included Tools

### SQL Query File

The file `query_sales_data.sql` contains 10 ready-to-use SQL queries:

1. Basic Sales Transactions Query
2. Daily Sales Summary by Store
3. Customer Session Analysis
4. Product Performance Analysis
5. Store Traffic Analysis by Hour
6. Customer Shopping Behavior Analysis
7. Employee Sales Performance
8. Discount Effectiveness Analysis
9. Inventory Turnover Analysis
10. Customer Behavior Segmentation

### JavaScript Utility

The file `query_sales_data.js` provides a Node.js utility for:

- Connecting to the SQL Server
- Executing queries for specific stores
- Exporting results to CSV files

## Usage Examples

### Using the Node.js Utility

```bash
# Install dependencies
npm install mssql

# Run the script for store ID 112 (North Flagship)
node query_sales_data.js 112

# Run the script for store ID 156 (West Express) for the last 14 days
node query_sales_data.js 156 14
```

The script will generate CSV files in the `exports` directory.

### Using SQL Server Management Studio (SSMS)

1. Open SSMS and connect to the database server
2. Open the `query_sales_data.sql` file
3. Update parameters as needed (e.g., StoreID, date ranges)
4. Execute the queries

### Using Azure Data Studio

1. Open Azure Data Studio and connect to the database server
2. Open the `query_sales_data.sql` file
3. Update parameters as needed
4. Execute the queries

## Common Use Cases

### Daily Store Performance Report

```sql
SELECT 
    s.StoreID,
    s.StoreName,
    CAST(t.TransactionDate AS DATE) AS SalesDate,
    COUNT(t.TransactionID) AS TransactionCount,
    SUM(t.TotalAmount) AS TotalSales
FROM 
    Sales.Transactions t
INNER JOIN 
    Store.Locations s ON t.StoreID = s.StoreID
WHERE 
    t.TransactionDate >= DATEADD(day, -30, GETDATE())
GROUP BY 
    s.StoreID, s.StoreName, CAST(t.TransactionDate AS DATE)
ORDER BY 
    s.StoreID, CAST(t.TransactionDate AS DATE);
```

### Customer Engagement Analysis

```sql
SELECT 
    cs.SessionStartTime,
    COUNT(cs.SessionID) AS SessionCount,
    SUM(cs.PageViews) AS TotalPageViews,
    SUM(cs.ProductViews) AS TotalProductViews,
    SUM(cs.SearchCount) AS TotalSearches,
    SUM(CASE WHEN t.TransactionID IS NOT NULL THEN 1 ELSE 0 END) AS CompletedTransactions,
    CAST(SUM(CASE WHEN t.TransactionID IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / 
        COUNT(cs.SessionID) AS ConversionRate
FROM 
    Analytics.CustomerSessions cs
LEFT JOIN 
    Sales.Transactions t ON cs.SessionID = t.SessionID
WHERE 
    cs.SessionStartTime >= DATEADD(day, -7, GETDATE())
GROUP BY 
    CAST(cs.SessionStartTime AS DATE)
ORDER BY 
    CAST(cs.SessionStartTime AS DATE);
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Check VPN or firewall settings
2. **Permission Denied**: Verify your user has appropriate permissions
3. **No Data Returned**: Check date filters or store IDs

### Support Resources

- File any database issues in the Azure DevOps repository
- Contact the DBA team at `retail-advisor-dba@tbwa.com`

## Data Refresh Schedule

- Transaction data: Real-time
- Inventory data: Hourly
- Analytics data: 15-minute delay
- Customer segments: Daily refresh at 2:00 AM EST
- dbt model exports: Daily refresh at 3:00 AM EST

## dbt Models for Scout Edge Dashboard

The Scout Edge dashboard is powered by dbt models that transform the raw data into the required format for visualizations. These models are located in the `dbt_project` directory.

### Core dbt Models

- **sales_interaction_brands**: Base model containing all sales interactions with brand data for choropleth map visualizations.
- **top_brands**: Analysis of the most popular brands by geographical area, with ranking at different geographic levels.
- **top_combos**: Identification of brand combinations frequently purchased together, supporting cross-sell analysis.
- **store_metrics**: Comprehensive performance metrics for each store, including sales trends, brand distribution, and growth metrics.

### Running the dbt Models

To run the dbt models and export data for the dashboard:

```bash
cd dbt_project
./run_and_export.sh
```

This will:
1. Run the dbt models
2. Export the data to JSON files in `assets/data/exports`
3. Copy the data to the dashboard assets folder
4. Generate documentation

### Integration with the Dashboard

The exported dbt data is automatically integrated with the Scout Edge dashboard using the `data_source_toggle.js` component. This allows you to switch between different data sources (static, dbt, API, or simulated) in the dashboard interface.

For more details on the dbt models, see the [dbt project README](dbt_project/README.md).

## Deployment Automation

The Scout Edge dashboard includes automation for deploying dbt model data to Azure Static Web Apps.

### Data Pipeline Integration

The data pipeline follows this flow:

1. Azure SQL → Databricks Delta (Bronze Layer)
2. Databricks ETL → Structured Delta Tables (Silver Layer)
3. dbt Models → Transformed Analytics Views (Gold Layer)
4. Python Export → JSON Files
5. GitHub Actions → Azure Blob Storage
6. Static Web App → Dashboard Visualization

### Deployment Scripts

The following scripts automate the deployment process:

```bash
# Deploy dbt exports to Azure
./dbt_project/scripts/deploy_dbt_exports.sh --resource-group=my-rg --storage-account=mystorageacct --static-webapp=my-webapp

# Generate sample data (for development)
./dbt_project/run_and_export.sh --sample

# Set up SKR integration for dbt metadata
./dbt_project/scripts/setup_skr_integration.sh

# Monitor data freshness
python ./dbt_project/scripts/monitor_freshness.py
```

### Data Freshness Monitoring

The dashboard includes a data freshness badge that displays information about the age and quality of the data. This badge reads metadata from the `metadata.json` file generated by the `monitor_freshness.py` script.

To include the badge in your dashboard:

```html
<script src="./js/data_freshness_badge.js"></script>
<script>
  const freshnessBadge = new DataFreshnessBadge();
</script>
```

### GitHub Actions Integration

The repository includes GitHub Actions workflows for:

1. Daily dbt model runs and data export
2. Automatic upload to Azure Blob Storage
3. Static Web App rebuild triggers
4. Data freshness monitoring and notifications

To configure GitHub Actions, set up the following secrets:

- `DBT_DATABRICKS_HOST`
- `DBT_DATABRICKS_HTTP_PATH`
- `DBT_DATABRICKS_TOKEN`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_KEY`
- `AZURE_BLOB_CONTAINER`