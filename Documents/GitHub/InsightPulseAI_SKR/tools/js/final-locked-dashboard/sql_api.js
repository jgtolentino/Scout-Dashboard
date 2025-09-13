/**
 * SQL API for Retail Advisor Dashboard
 * 
 * This Node.js script provides a simple API for executing SQL queries
 * and returning results to the Retail Advisor dashboard.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const SQLConnector = require('./js/sql_connector');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Create SQL connector instance
const sqlConnector = new SQLConnector();

// Available query types
const QUERY_TYPES = {
  TRANSACTIONS: 'transactions',
  DAILY_SALES: 'daily-sales',
  CUSTOMER_SESSIONS: 'customer-sessions',
  PRODUCT_PERFORMANCE: 'product-performance',
  HOURLY_TRAFFIC: 'hourly-traffic',
  SHOPPING_BEHAVIOR: 'shopping-behavior',
  EMPLOYEE_PERFORMANCE: 'employee-performance',
  DISCOUNT_EFFECTIVENESS: 'discount-effectiveness',
  INVENTORY_TURNOVER: 'inventory-turnover',
  CUSTOMER_SEGMENTATION: 'customer-segmentation'
};

// API routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SQL API is running' });
});

// Execute SQL query
app.post('/api/query', async (req, res) => {
  try {
    const { queryType, parameters } = req.body;
    
    if (!queryType) {
      return res.status(400).json({ error: 'Query type is required' });
    }
    
    let result;
    
    switch(queryType) {
      case QUERY_TYPES.TRANSACTIONS:
        result = await sqlConnector.getStoreTransactions(parameters);
        break;
      case QUERY_TYPES.DAILY_SALES:
        result = await sqlConnector.getDailySales(parameters);
        break;
      case QUERY_TYPES.CUSTOMER_SESSIONS:
        result = await sqlConnector.getCustomerSessions(parameters);
        break;
      case QUERY_TYPES.PRODUCT_PERFORMANCE:
        result = await sqlConnector.getProductPerformance(parameters);
        break;
      case QUERY_TYPES.HOURLY_TRAFFIC:
        result = await sqlConnector.getHourlyTraffic(parameters);
        break;
      default:
        return res.status(400).json({ error: 'Invalid query type' });
    }
    
    res.json({
      success: true,
      queryType,
      parameters,
      recordCount: result.length,
      data: result
    });
    
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Error executing query', message: err.message });
  }
});

// Execute custom SQL query
app.post('/api/custom-query', async (req, res) => {
  try {
    const { queryName, queryText, parameters, useCache } = req.body;
    
    if (!queryText) {
      return res.status(400).json({ error: 'Query text is required' });
    }
    
    // For security, we should validate the SQL query here
    // This is a simplified example and should be enhanced in production
    if (queryText.toLowerCase().includes('drop ') || 
        queryText.toLowerCase().includes('delete ') ||
        queryText.toLowerCase().includes('truncate ') ||
        queryText.toLowerCase().includes('insert ') ||
        queryText.toLowerCase().includes('update ') ||
        queryText.toLowerCase().includes('alter ') ||
        queryText.toLowerCase().includes('create ')) {
      return res.status(403).json({ error: 'Write operations are not allowed' });
    }
    
    const result = await sqlConnector.executeQuery(
      queryName || 'CustomQuery',
      queryText,
      parameters || {},
      useCache !== false
    );
    
    res.json({
      success: true,
      queryName,
      recordCount: result.length,
      data: result
    });
    
  } catch (err) {
    console.error('Error executing custom query:', err);
    res.status(500).json({ error: 'Error executing custom query', message: err.message });
  }
});

// Export data to CSV
app.post('/api/export/csv', async (req, res) => {
  try {
    const { queryType, parameters, filename } = req.body;
    
    if (!queryType) {
      return res.status(400).json({ error: 'Query type is required' });
    }
    
    let data;
    
    switch(queryType) {
      case QUERY_TYPES.TRANSACTIONS:
        data = await sqlConnector.getStoreTransactions(parameters);
        break;
      case QUERY_TYPES.DAILY_SALES:
        data = await sqlConnector.getDailySales(parameters);
        break;
      case QUERY_TYPES.CUSTOMER_SESSIONS:
        data = await sqlConnector.getCustomerSessions(parameters);
        break;
      case QUERY_TYPES.PRODUCT_PERFORMANCE:
        data = await sqlConnector.getProductPerformance(parameters);
        break;
      case QUERY_TYPES.HOURLY_TRAFFIC:
        data = await sqlConnector.getHourlyTraffic(parameters);
        break;
      default:
        return res.status(400).json({ error: 'Invalid query type' });
    }
    
    const csvData = sqlConnector.exportToCSV(data);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export.csv'}"`);
    
    // Send CSV data
    res.send(csvData);
    
  } catch (err) {
    console.error('Error exporting to CSV:', err);
    res.status(500).json({ error: 'Error exporting to CSV', message: err.message });
  }
});

// Export data to Excel
app.post('/api/export/excel', async (req, res) => {
  try {
    const { queryType, parameters, filename } = req.body;
    
    if (!queryType) {
      return res.status(400).json({ error: 'Query type is required' });
    }
    
    let data;
    
    switch(queryType) {
      case QUERY_TYPES.TRANSACTIONS:
        data = await sqlConnector.getStoreTransactions(parameters);
        break;
      case QUERY_TYPES.DAILY_SALES:
        data = await sqlConnector.getDailySales(parameters);
        break;
      case QUERY_TYPES.CUSTOMER_SESSIONS:
        data = await sqlConnector.getCustomerSessions(parameters);
        break;
      case QUERY_TYPES.PRODUCT_PERFORMANCE:
        data = await sqlConnector.getProductPerformance(parameters);
        break;
      case QUERY_TYPES.HOURLY_TRAFFIC:
        data = await sqlConnector.getHourlyTraffic(parameters);
        break;
      default:
        return res.status(400).json({ error: 'Invalid query type' });
    }
    
    const excelData = sqlConnector.exportToExcel(data);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export.xml'}"`);
    
    // Send Excel data
    res.send(excelData);
    
  } catch (err) {
    console.error('Error exporting to Excel:', err);
    res.status(500).json({ error: 'Error exporting to Excel', message: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`SQL API server running on port ${PORT}`);
  console.log(`Access the SQL Explorer at http://localhost:${PORT}/retail_edge/sql_data_explorer.html`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await sqlConnector.close();
    console.log('SQL connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});