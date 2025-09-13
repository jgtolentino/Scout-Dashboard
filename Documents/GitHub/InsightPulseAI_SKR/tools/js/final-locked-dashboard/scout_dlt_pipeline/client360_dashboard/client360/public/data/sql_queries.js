/**
 * SQL Queries for Client 360 Dashboard
 * 
 * This module contains SQL query strings for the Client 360 Dashboard.
 */

// Sample query templates
const SQL_QUERIES = {
  // Sales queries
  GET_TOTAL_SALES: `
    SELECT SUM(amount) AS total_sales 
    FROM sales
  `,
  
  GET_SALES_BY_REGION: `
    SELECT region, SUM(amount) AS total 
    FROM sales 
    GROUP BY region 
    ORDER BY total DESC
  `,
  
  GET_SALES_BY_PRODUCT: `
    SELECT product, SUM(amount) AS total 
    FROM sales 
    GROUP BY product 
    ORDER BY total DESC
  `,
  
  GET_SALES_BY_DATE: `
    SELECT date, SUM(amount) AS total 
    FROM sales 
    GROUP BY date 
    ORDER BY date
  `,
  
  // Customer queries
  GET_CUSTOMERS_BY_INDUSTRY: `
    SELECT industry, COUNT(*) AS count 
    FROM customers 
    GROUP BY industry 
    ORDER BY count DESC
  `,
  
  GET_TOP_CUSTOMERS: `
    SELECT c.name, c.industry, SUM(s.amount) AS total_purchases 
    FROM customers c 
    JOIN sales s ON c.name = s.customer 
    GROUP BY c.name, c.industry 
    ORDER BY total_purchases DESC 
    LIMIT 5
  `,
  
  GET_CUSTOMER_REGIONAL_DISTRIBUTION: `
    SELECT region, COUNT(*) AS customer_count 
    FROM customers 
    GROUP BY region
  `,
  
  // Product queries
  GET_PRODUCTS_BY_CATEGORY: `
    SELECT category, COUNT(*) AS count, AVG(price) AS avg_price 
    FROM products 
    GROUP BY category
  `,
  
  GET_ACTIVE_PRODUCTS: `
    SELECT category, COUNT(*) AS count 
    FROM products 
    WHERE active = true 
    GROUP BY category
  `
};

// Function to execute query using our SQL connector
async function executeQuery(queryName, params = {}) {
  // Get the query template
  const queryTemplate = SQL_QUERIES[queryName];
  if (\!queryTemplate) {
    console.error(`Query template "${queryName}" not found`);
    return { success: false, error: 'Query not found' };
  }
  
  // Replace parameters in the query if needed
  let query = queryTemplate;
  Object.keys(params).forEach(key => {
    query = query.replace(new RegExp(`{${key}}`, 'g'), params[key]);
  });
  
  // Use the SQL connector to execute the query
  try {
    // Make sure the SQL connector is available
    if (typeof window.sqlConnector === 'undefined') {
      console.error('SQL Connector not available');
      return { success: false, error: 'SQL Connector not available' };
    }
    
    // Execute the query
    const result = await window.sqlConnector.executeQuery(query);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Export the module
export { SQL_QUERIES, executeQuery };
EOL < /dev/null