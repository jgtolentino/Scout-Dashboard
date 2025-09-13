/**
 * SQL Server Connection Utility for Retail Advisor
 * 
 * This script demonstrates how to connect to SQL Server and execute
 * queries to retrieve sales and session data.
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuration for SQL Server connection
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

/**
 * Execute a SQL query and return the results
 * @param {string} queryName - Name of the query (for logging)
 * @param {string} queryText - SQL query text
 * @returns {Promise<Array>} - Query results
 */
async function executeQuery(queryName, queryText) {
  console.log(`Executing query: ${queryName}`);
  
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(queryText);
    
    console.log(`Query ${queryName} completed. Rows returned: ${result.recordset.length}`);
    return result.recordset;
  } catch (err) {
    console.error(`Error executing query ${queryName}:`, err);
    throw err;
  }
}

/**
 * Get transaction data for a specific store
 * @param {number} storeId - Store ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Transaction data
 */
async function getStoreTransactions(storeId, days = 30) {
  const query = `
    SELECT 
      t.TransactionID,
      t.StoreID,
      s.StoreName,
      t.RegisterID,
      t.EmployeeID,
      e.EmployeeName,
      t.CustomerID,
      t.TransactionDate,
      t.TransactionTime,
      t.TotalAmount,
      t.PaymentMethod,
      t.ItemCount,
      t.DiscountAmount,
      t.TaxAmount,
      t.Status
    FROM 
      Sales.Transactions t
    INNER JOIN 
      Store.Locations s ON t.StoreID = s.StoreID
    INNER JOIN 
      HR.Employees e ON t.EmployeeID = e.EmployeeID
    WHERE 
      t.StoreID = ${storeId}
      AND t.TransactionDate >= DATEADD(day, -${days}, GETDATE())
    ORDER BY 
      t.TransactionDate DESC, t.TransactionTime DESC;
  `;
  
  return executeQuery(`StoreTransactions-${storeId}`, query);
}

/**
 * Get daily sales summary for a specific store
 * @param {number} storeId - Store ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Daily sales summary
 */
async function getStoreDailySales(storeId, days = 30) {
  const query = `
    SELECT 
      s.StoreID,
      s.StoreName,
      s.Region,
      s.StoreType,
      CAST(t.TransactionDate AS DATE) AS SalesDate,
      COUNT(t.TransactionID) AS TransactionCount,
      SUM(t.TotalAmount) AS TotalSales,
      SUM(t.ItemCount) AS TotalItemsSold,
      AVG(t.TotalAmount) AS AverageTransactionValue,
      SUM(t.TotalAmount) / NULLIF(COUNT(DISTINCT t.CustomerID), 0) AS AverageCustomerSpend
    FROM 
      Sales.Transactions t
    INNER JOIN 
      Store.Locations s ON t.StoreID = s.StoreID
    WHERE 
      t.StoreID = ${storeId}
      AND t.TransactionDate >= DATEADD(day, -${days}, GETDATE())
      AND t.Status = 'Completed'
    GROUP BY 
      s.StoreID, s.StoreName, s.Region, s.StoreType, CAST(t.TransactionDate AS DATE)
    ORDER BY 
      CAST(t.TransactionDate AS DATE) DESC;
  `;
  
  return executeQuery(`StoreDailySales-${storeId}`, query);
}

/**
 * Get customer sessions for a specific store
 * @param {number} storeId - Store ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Customer session data
 */
async function getStoreCustomerSessions(storeId, days = 7) {
  const query = `
    SELECT 
      cs.SessionID,
      cs.CustomerID,
      c.CustomerName,
      c.CustomerSegment,
      cs.StoreID,
      s.StoreName,
      cs.SessionStartTime,
      cs.SessionEndTime,
      DATEDIFF(minute, cs.SessionStartTime, cs.SessionEndTime) AS SessionDurationMinutes,
      cs.DeviceType,
      cs.ChannelType,
      cs.PageViews,
      cs.ProductViews,
      cs.SearchCount,
      cs.CartAdditions,
      cs.CartRemovals,
      CASE WHEN t.TransactionID IS NOT NULL THEN 'Yes' ELSE 'No' END AS MadeAPurchase,
      COALESCE(t.TotalAmount, 0) AS PurchaseAmount
    FROM 
      Analytics.CustomerSessions cs
    LEFT JOIN 
      Customer.Profiles c ON cs.CustomerID = c.CustomerID
    LEFT JOIN 
      Store.Locations s ON cs.StoreID = s.StoreID
    LEFT JOIN 
      Sales.Transactions t ON cs.SessionID = t.SessionID
    WHERE 
      cs.StoreID = ${storeId}
      AND cs.SessionStartTime >= DATEADD(day, -${days}, GETDATE())
    ORDER BY 
      cs.SessionStartTime DESC;
  `;
  
  return executeQuery(`StoreCustomerSessions-${storeId}`, query);
}

/**
 * Get store traffic analysis by hour
 * @param {number} storeId - Store ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Hourly traffic data
 */
async function getStoreTrafficByHour(storeId, days = 30) {
  const query = `
    SELECT 
      s.StoreID,
      s.StoreName,
      DATEPART(hour, cs.SessionStartTime) AS HourOfDay,
      COUNT(cs.SessionID) AS SessionCount,
      COUNT(DISTINCT cs.CustomerID) AS UniqueCustomers,
      AVG(DATEDIFF(minute, cs.SessionStartTime, cs.SessionEndTime)) AS AvgSessionDurationMinutes,
      SUM(CASE WHEN t.TransactionID IS NOT NULL THEN 1 ELSE 0 END) AS CompletedTransactions,
      SUM(COALESCE(t.TotalAmount, 0)) AS TotalSales,
      CAST(SUM(CASE WHEN t.TransactionID IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(cs.SessionID), 0) AS ConversionRate
    FROM 
      Analytics.CustomerSessions cs
    LEFT JOIN 
      Store.Locations s ON cs.StoreID = s.StoreID
    LEFT JOIN 
      Sales.Transactions t ON cs.SessionID = t.SessionID AND t.Status = 'Completed'
    WHERE 
      cs.StoreID = ${storeId}
      AND cs.SessionStartTime >= DATEADD(day, -${days}, GETDATE())
    GROUP BY 
      s.StoreID, s.StoreName, DATEPART(hour, cs.SessionStartTime)
    ORDER BY 
      DATEPART(hour, cs.SessionStartTime);
  `;
  
  return executeQuery(`StoreTrafficByHour-${storeId}`, query);
}

/**
 * Get product performance for a specific store
 * @param {number} storeId - Store ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Product performance data
 */
async function getStoreProductPerformance(storeId, days = 30) {
  const query = `
    SELECT 
      p.ProductID,
      p.ProductName,
      p.Category,
      p.SubCategory,
      p.Brand,
      SUM(ti.Quantity) AS TotalQuantitySold,
      SUM(ti.LineTotal) AS TotalRevenue,
      COUNT(DISTINCT t.TransactionID) AS TransactionCount,
      COUNT(DISTINCT t.CustomerID) AS UniqueCustomers,
      AVG(ti.UnitPrice) AS AverageSellingPrice,
      SUM(ti.LineTotal) / SUM(ti.Quantity) AS AverageRevenuePerUnit
    FROM 
      Sales.TransactionItems ti
    INNER JOIN 
      Sales.Transactions t ON ti.TransactionID = t.TransactionID
    INNER JOIN 
      Inventory.Products p ON ti.ProductID = p.ProductID
    WHERE 
      t.StoreID = ${storeId}
      AND t.TransactionDate >= DATEADD(day, -${days}, GETDATE())
      AND t.Status = 'Completed'
    GROUP BY 
      p.ProductID, p.ProductName, p.Category, p.SubCategory, p.Brand
    ORDER BY 
      TotalRevenue DESC;
  `;
  
  return executeQuery(`StoreProductPerformance-${storeId}`, query);
}

/**
 * Export data to CSV file
 * @param {Array} data - Data to export
 * @param {string} filename - Output filename
 */
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    console.log('No data to export');
    return;
  }
  
  const outputPath = path.resolve(__dirname, 'exports', filename);
  
  // Ensure exports directory exists
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  
  // Get headers from the first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that need quotes (strings with commas, quotes, or newlines)
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value !== null && value !== undefined ? value : '';
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Write to file
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Data exported to ${outputPath}`);
}

/**
 * Main function to demonstrate the usage
 */
async function main() {
  try {
    // Example: get sales data for store 112 (North Flagship)
    const storeId = process.argv[2] || 112;
    const days = process.argv[3] || 30;
    
    console.log(`Retrieving data for store ID: ${storeId} for the last ${days} days`);
    
    // Connect to SQL Server
    await sql.connect(config);
    console.log('Connected to SQL Server');
    
    // Execute various queries
    const transactions = await getStoreTransactions(storeId, days);
    exportToCSV(transactions, `store_${storeId}_transactions.csv`);
    
    const dailySales = await getStoreDailySales(storeId, days);
    exportToCSV(dailySales, `store_${storeId}_daily_sales.csv`);
    
    const sessions = await getStoreCustomerSessions(storeId, Math.min(days, 7));
    exportToCSV(sessions, `store_${storeId}_customer_sessions.csv`);
    
    const hourlyTraffic = await getStoreTrafficByHour(storeId, days);
    exportToCSV(hourlyTraffic, `store_${storeId}_hourly_traffic.csv`);
    
    const productPerformance = await getStoreProductPerformance(storeId, days);
    exportToCSV(productPerformance, `store_${storeId}_product_performance.csv`);
    
    console.log('Data retrieval complete');
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    // Close the SQL connection
    await sql.close();
    console.log('SQL connection closed');
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other modules
module.exports = {
  getStoreTransactions,
  getStoreDailySales,
  getStoreCustomerSessions,
  getStoreTrafficByHour,
  getStoreProductPerformance,
  executeQuery,
  exportToCSV
};