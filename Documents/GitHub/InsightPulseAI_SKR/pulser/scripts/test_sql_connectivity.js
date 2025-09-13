/**
 * SQL Server Consolidation - Connectivity Tester
 * 
 * This script tests connectivity to the consolidated SQL server
 * and verifies that the migrated databases are accessible.
 */

const sql = require('mssql');

// Consolidated SQL server configuration
const SQL_CONFIG = {
  server: 'sqltbwaprojectscoutserver.database.windows.net',
  user: process.env.SQL_USER || 'scout_admin',
  password: process.env.SQL_PASSWORD || '', // Will prompt if empty
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

// Databases to test
const DATABASES = [
  'TBWA_ProjectScout_DB',        // Original database
  'SQL-TBWA-ProjectScout-Reporting-Prod', // Original database
  'RetailAdvisorDB',             // Migrated from retail-advisor-sql
  'RetailAdvisor'                // Migrated from scout-edge-sql
];

// Test query for each database
const TEST_QUERIES = {
  'TBWA_ProjectScout_DB': 'SELECT TOP 5 name FROM sys.tables ORDER BY name',
  'SQL-TBWA-ProjectScout-Reporting-Prod': 'SELECT TOP 5 name FROM sys.tables ORDER BY name',
  'RetailAdvisorDB': 'SELECT TOP 5 name FROM sys.tables ORDER BY name',
  'RetailAdvisor': 'SELECT TOP 5 name FROM sys.tables ORDER BY name'
};

/**
 * Test connection to a specific database
 * @param {string} database - Database name
 * @returns {Promise<boolean>} - Connection success
 */
async function testConnection(database) {
  console.log(`\nTesting connection to database: ${database}`);
  
  const config = {
    ...SQL_CONFIG,
    database
  };
  
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log(`✅ Connected to ${database} successfully`);
    
    // Test query
    if (TEST_QUERIES[database]) {
      console.log(`Running test query: ${TEST_QUERIES[database]}`);
      const result = await pool.request().query(TEST_QUERIES[database]);
      
      console.log('Query results:');
      console.table(result.recordset);
    }
    
    await pool.close();
    return true;
  } catch (error) {
    console.error(`❌ Failed to connect to ${database}:`, error.message);
    return false;
  }
}

/**
 * Prompt for SQL password if not provided
 * @returns {Promise<string>} - Password
 */
async function promptPassword() {
  if (SQL_CONFIG.password) {
    return SQL_CONFIG.password;
  }
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`Enter password for ${SQL_CONFIG.user}@${SQL_CONFIG.server}: `, (password) => {
      rl.close();
      resolve(password);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('SQL Server Consolidation - Connectivity Tester');
  console.log('=============================================');
  console.log(`Server: ${SQL_CONFIG.server}`);
  console.log(`User: ${SQL_CONFIG.user}`);
  console.log(`Databases to test: ${DATABASES.join(', ')}`);
  console.log('');
  
  // Get password if not provided
  SQL_CONFIG.password = await promptPassword();
  
  // Test connection to each database
  const results = {};
  
  for (const database of DATABASES) {
    results[database] = await testConnection(database);
  }
  
  // Print summary
  console.log('\nConnection Test Summary');
  console.log('=======================');
  
  let allSuccessful = true;
  
  for (const database in results) {
    const success = results[database];
    console.log(`${database}: ${success ? '✅ Success' : '❌ Failed'}`);
    
    if (!success) {
      allSuccessful = false;
    }
  }
  
  // Final result
  console.log('');
  if (allSuccessful) {
    console.log('✅ All database connections successful!');
  } else {
    console.log('❌ Some database connections failed. Please check the logs.');
  }
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testConnection
};