# SQL Integration for Retail Advisor Dashboard

This document provides a comprehensive guide to the SQL integration features for the Retail Advisor dashboard.

## Overview

The SQL integration enables the Retail Advisor dashboard to connect directly to the SQL Server database and retrieve real-time data for analysis and visualization. This integration includes:

1. **SQL Data Explorer** - A web-based interface for querying the database
2. **SQL Connector** - A JavaScript library for connecting to SQL Server
3. **SQL API** - A Node.js API for executing queries and returning results
4. **Query Templates** - Pre-defined SQL queries for common analytics tasks

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Dashboard  │◄────┤    SQL API      │◄────┤   SQL Server    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       ^                       ^                        ^
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │
                    ┌─────────────────────┐
                    │                     │
                    │   SQL Connector     │
                    │                     │
                    └─────────────────────┘
```

## Components

### 1. SQL Data Explorer

The SQL Data Explorer is a web-based interface accessible at:

```
http://localhost:3001/retail_edge/sql_data_explorer.html
```

Features:
- Predefined query templates for common analytics tasks
- Query parameter customization
- Results visualization with charts
- Export to CSV and Excel
- Custom query creation and saving

### 2. SQL Connector

The SQL Connector is a JavaScript library that provides a consistent interface for:
- Connecting to SQL Server
- Executing queries
- Transforming results
- Caching results for performance
- Exporting data to various formats

Location: `/js/sql_connector.js`

### 3. SQL API

The SQL API is a Node.js server that:
- Handles web requests for SQL data
- Validates queries for security
- Returns results in JSON format
- Handles data export

Location: `/sql_api.js`

### 4. Query Templates

Pre-defined SQL queries for common analytics tasks:
- Sales transactions
- Daily sales summaries
- Customer sessions
- Product performance
- Store traffic analysis
- Customer behavior analysis

Location: `/query_sales_data.sql`

## Getting Started

### Prerequisites

- Node.js v14 or higher
- Access to SQL Server database
- Database credentials

### Installation

1. Install dependencies:
   ```
   npm install express cors mssql
   ```

2. Set environment variables for database connection:
   ```
   export DB_USER="retail_advisor_user"
   export DB_PASSWORD="your_password_here"
   export DB_SERVER="retail-advisor-sql.database.windows.net"
   export DB_NAME="RetailAdvisorDB"
   ```

3. Start the SQL API server:
   ```
   ./start_sql_api.sh
   ```

4. Access the SQL Data Explorer in your browser:
   ```
   http://localhost:3001/retail_edge/sql_data_explorer.html
   ```

## Usage Examples

### Basic Query Execution

```javascript
// Initialize SQL connector
const sqlConnector = new SQLConnector();

// Get transactions for store 112
const transactions = await sqlConnector.getStoreTransactions({
  storeId: 112,
  days: 30,
  limit: 100
});

// Export to CSV
const csvData = sqlConnector.exportToCSV(transactions);
```

### Using the SQL API

```
POST /api/query
Content-Type: application/json

{
  "queryType": "transactions",
  "parameters": {
    "storeId": 112,
    "days": 30,
    "limit": 100
  }
}
```

### Custom Queries

```
POST /api/custom-query
Content-Type: application/json

{
  "queryName": "MyCustomQuery",
  "queryText": "SELECT * FROM Sales.Transactions WHERE CustomerID = 12345",
  "parameters": {},
  "useCache": true
}
```

## Security Considerations

1. The SQL API only allows read operations (SELECT statements)
2. All queries are validated before execution
3. Parameters are sanitized to prevent SQL injection
4. Database credentials are stored as environment variables
5. Connection uses SSL encryption

## Performance Optimization

1. Query results are cached for 5 minutes by default
2. Limit results to improve response time
3. Use parameters to filter data
4. Close connections when not in use

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check network connectivity
   - Verify firewall settings
   - Ensure database server is running

2. **Authentication Failed**
   - Verify database credentials
   - Check user permissions

3. **Query Failed**
   - Check query syntax
   - Verify table and column names
   - Check database server logs

### Logging

All SQL operations are logged to the console with timing information.

## API Reference

### SQL Connector Methods

- `connect()` - Connect to SQL Server
- `close()` - Close the connection
- `executeQuery(queryName, queryText, params, useCache)` - Execute a query
- `getStoreTransactions(params)` - Get transaction data
- `getDailySales(params)` - Get daily sales summary
- `getCustomerSessions(params)` - Get customer session data
- `getProductPerformance(params)` - Get product performance data
- `getHourlyTraffic(params)` - Get hourly traffic data
- `exportToCSV(data)` - Export data to CSV
- `exportToExcel(data)` - Export data to Excel

### SQL API Endpoints

- `GET /api/health` - Health check
- `POST /api/query` - Execute a predefined query
- `POST /api/custom-query` - Execute a custom query
- `POST /api/export/csv` - Export data to CSV
- `POST /api/export/excel` - Export data to Excel

## Resources

- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)
- [Node.js mssql Package](https://www.npmjs.com/package/mssql)
- [Express.js Documentation](https://expressjs.com/)

## Maintenance

The SQL integration should be reviewed and tested periodically to ensure:
1. Security compliance
2. Performance optimization
3. Compatibility with database schema changes

## Support

For issues related to the SQL integration:
- File issues in the Azure DevOps repository
- Contact the Retail Advisor development team