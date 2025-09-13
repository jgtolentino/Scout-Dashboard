/**
 * SQL Connector for Retail Advisor Dashboard
 * 
 * This module provides functions for connecting to the SQL database and
 * retrieving data for the Retail Advisor dashboard.
 */

class SQLConnector {
  constructor(config = {}) {
    this.config = {
      user: config.user || process.env.DB_USER || 'retail_advisor_user',
      password: config.password || process.env.DB_PASSWORD || 'your_password_here',
      server: config.server || process.env.DB_SERVER || 'retail-advisor-sql.database.windows.net',
      database: config.database || process.env.DB_NAME || 'RetailAdvisorDB',
      options: {
        encrypt: true, // For Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true
      }
    };
    
    this.connected = false;
    this.queryCache = new Map(); // Simple cache for query results
    this.cacheExpiryTime = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Connect to the SQL Server
   * @returns {Promise<boolean>} - Connection success status
   */
  async connect() {
    if (this.connected) {
      console.log('Already connected to SQL Server');
      return true;
    }
    
    try {
      // Import mssql dynamically to avoid loading it in the browser
      const sql = await import('mssql');
      this.sql = sql;
      this.pool = await new sql.ConnectionPool(this.config).connect();
      this.connected = true;
      console.log('Connected to SQL Server');
      return true;
    } catch (err) {
      console.error('Error connecting to SQL Server:', err);
      this.connected = false;
      throw err;
    }
  }

  /**
   * Close the SQL Server connection
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.connected || !this.pool) {
      return;
    }
    
    try {
      await this.pool.close();
      this.connected = false;
      console.log('SQL Server connection closed');
    } catch (err) {
      console.error('Error closing SQL Server connection:', err);
      throw err;
    }
  }

  /**
   * Execute a SQL query
   * @param {string} queryName - Name of the query for logging/caching
   * @param {string} queryText - SQL query text
   * @param {Object} params - Query parameters
   * @param {boolean} useCache - Whether to use cached results if available
   * @returns {Promise<Array>} - Query results
   */
  async executeQuery(queryName, queryText, params = {}, useCache = true) {
    if (!this.connected) {
      await this.connect();
    }
    
    // Generate a cache key based on query name and parameters
    const cacheKey = this.generateCacheKey(queryName, params);
    
    // Check cache if enabled
    if (useCache && this.queryCache.has(cacheKey)) {
      const cachedResult = this.queryCache.get(cacheKey);
      if (Date.now() - cachedResult.timestamp < this.cacheExpiryTime) {
        console.log(`Using cached results for query: ${queryName}`);
        return cachedResult.data;
      } else {
        // Cache expired, remove it
        this.queryCache.delete(cacheKey);
      }
    }
    
    console.log(`Executing query: ${queryName}`);
    console.time(`Query ${queryName}`);
    
    try {
      // Replace parameters in the query
      let finalQuery = queryText;
      Object.entries(params).forEach(([key, value]) => {
        // For SQL injection prevention, we should use proper parameterization
        // This is a simplified example for demonstration
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        finalQuery = finalQuery.replace(regex, this.sanitizeValue(value));
      });
      
      const result = await this.pool.request().query(finalQuery);
      console.timeEnd(`Query ${queryName}`);
      
      console.log(`Query ${queryName} completed. Rows returned: ${result.recordset.length}`);
      
      // Cache the results
      if (useCache) {
        this.queryCache.set(cacheKey, {
          data: result.recordset,
          timestamp: Date.now()
        });
      }
      
      return result.recordset;
    } catch (err) {
      console.error(`Error executing query ${queryName}:`, err);
      throw err;
    }
  }

  /**
   * Generate a cache key based on query name and parameters
   * @param {string} queryName - Name of the query
   * @param {Object} params - Query parameters
   * @returns {string} - Cache key
   */
  generateCacheKey(queryName, params) {
    return `${queryName}-${JSON.stringify(params)}`;
  }

  /**
   * Sanitize a value for use in SQL queries
   * Note: This is a simplified approach. In production, use prepared statements.
   * @param {any} value - Value to sanitize
   * @returns {string} - Sanitized value
   */
  sanitizeValue(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    
    // Escape single quotes in strings
    return `'${value.toString().replace(/'/g, "''")}'`;
  }

  /**
   * Get store transactions
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Transaction data
   */
  async getStoreTransactions(params = {}) {
    const { storeId = 'all', days = 30, limit = 100 } = params;
    
    let storeFilter = '';
    if (storeId !== 'all') {
      storeFilter = `AND t.StoreID = ${storeId}`;
    }
    
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
        t.TransactionDate >= DATEADD(day, -${days}, GETDATE())
        ${storeFilter}
      ORDER BY 
        t.TransactionDate DESC, t.TransactionTime DESC
      OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY;
    `;
    
    return this.executeQuery('StoreTransactions', query, { storeId, days, limit });
  }

  /**
   * Get daily sales summary
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Daily sales data
   */
  async getDailySales(params = {}) {
    const { storeId = 'all', days = 30 } = params;
    
    let storeFilter = '';
    if (storeId !== 'all') {
      storeFilter = `AND t.StoreID = ${storeId}`;
    }
    
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
        t.TransactionDate >= DATEADD(day, -${days}, GETDATE())
        AND t.Status = 'Completed'
        ${storeFilter}
      GROUP BY 
        s.StoreID, s.StoreName, s.Region, s.StoreType, CAST(t.TransactionDate AS DATE)
      ORDER BY 
        s.StoreID, CAST(t.TransactionDate AS DATE);
    `;
    
    return this.executeQuery('DailySales', query, { storeId, days });
  }

  /**
   * Get customer sessions
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Customer session data
   */
  async getCustomerSessions(params = {}) {
    const { storeId = 'all', days = 7, limit = 100 } = params;
    
    let storeFilter = '';
    if (storeId !== 'all') {
      storeFilter = `AND cs.StoreID = ${storeId}`;
    }
    
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
        cs.SessionStartTime >= DATEADD(day, -${days}, GETDATE())
        ${storeFilter}
      ORDER BY 
        cs.SessionStartTime DESC
      OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY;
    `;
    
    return this.executeQuery('CustomerSessions', query, { storeId, days, limit });
  }

  /**
   * Get product performance
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Product performance data
   */
  async getProductPerformance(params = {}) {
    const { storeId = 'all', days = 30, limit = 100 } = params;
    
    let storeFilter = '';
    if (storeId !== 'all') {
      storeFilter = `AND t.StoreID = ${storeId}`;
    }
    
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
        t.TransactionDate >= DATEADD(day, -${days}, GETDATE())
        AND t.Status = 'Completed'
        ${storeFilter}
      GROUP BY 
        p.ProductID, p.ProductName, p.Category, p.SubCategory, p.Brand
      ORDER BY 
        TotalRevenue DESC
      OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY;
    `;
    
    return this.executeQuery('ProductPerformance', query, { storeId, days, limit });
  }

  /**
   * Get hourly traffic data
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Hourly traffic data
   */
  async getHourlyTraffic(params = {}) {
    const { storeId = 'all', days = 30 } = params;
    
    let storeFilter = '';
    if (storeId !== 'all') {
      storeFilter = `AND cs.StoreID = ${storeId}`;
    }
    
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
        cs.SessionStartTime >= DATEADD(day, -${days}, GETDATE())
        ${storeFilter}
      GROUP BY 
        s.StoreID, s.StoreName, DATEPART(hour, cs.SessionStartTime)
      ORDER BY 
        s.StoreID, DATEPART(hour, cs.SessionStartTime);
    `;
    
    return this.executeQuery('HourlyTraffic', query, { storeId, days });
  }

  /**
   * Export data to CSV
   * @param {Array} data - Data to export
   * @param {string} filename - Filename to save as
   * @returns {string} - CSV content
   */
  exportToCSV(data) {
    if (!data || data.length === 0) {
      console.log('No data to export');
      return '';
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
    
    return csvContent;
  }

  /**
   * Export data to Excel format
   * @param {Array} data - Data to export
   * @returns {string} - Excel XML content
   */
  exportToExcel(data) {
    if (!data || data.length === 0) {
      console.log('No data to export');
      return '';
    }
    
    // Get headers from the first row
    const headers = Object.keys(data[0]);
    
    // Create Excel XML content
    let excelContent = '<?xml version="1.0"?>\n';
    excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">\n';
    excelContent += '<Worksheet ss:Name="Sheet1">\n';
    excelContent += '<Table>\n';
    
    // Header row
    excelContent += '<Row>\n';
    headers.forEach(header => {
      excelContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
    });
    excelContent += '</Row>\n';
    
    // Data rows
    data.forEach(row => {
      excelContent += '<Row>\n';
      headers.forEach(header => {
        const value = row[header];
        if (typeof value === 'number') {
          excelContent += `<Cell><Data ss:Type="Number">${value}</Data></Cell>\n`;
        } else if (value instanceof Date) {
          excelContent += `<Cell><Data ss:Type="DateTime">${value.toISOString()}</Data></Cell>\n`;
        } else {
          excelContent += `<Cell><Data ss:Type="String">${value !== null && value !== undefined ? value : ''}</Data></Cell>\n`;
        }
      });
      excelContent += '</Row>\n';
    });
    
    excelContent += '</Table>\n';
    excelContent += '</Worksheet>\n';
    excelContent += '</Workbook>';
    
    return excelContent;
  }
}

// Export for CommonJS environment (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SQLConnector;
}

// Export for ES modules (Browser)
if (typeof window !== 'undefined') {
  window.SQLConnector = SQLConnector;
}