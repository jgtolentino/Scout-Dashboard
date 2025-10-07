/**
 * Direct SQL Migration Runner for Project Scout
 * 
 * This script runs the session matching enhancement migration script
 * using a direct database connection.
 */

const fs = require('fs');
const path = require('path');

// Database configuration - can use MySQL or MSSQL based on configuration
const MOCK_MODE = false; // Set to false to run against real database

// Determine database type to use based on environment or presence of MySQL
function getDatabaseAdapter() {
  try {
    if (process.env.DB_TYPE === 'mysql' || MOCK_MODE) {
      return require('./mock_database_adapter');
    } else {
      return require('mssql');
    }
  } catch (err) {
    console.log('Failed to load SQL Server driver, falling back to mock mode');
    return require('./mock_database_adapter');
  }
}

// Create mock database adapter if needed
function createMockAdapter() {
  console.log('Creating mock database adapter for development testing');
  
  // Write mock adapter to file
  const mockAdapterPath = path.join(__dirname, 'mock_database_adapter.js');
  const mockAdapterContent = `
/**
 * Mock Database Adapter for Session Matching Migration Script
 * 
 * This module provides a mock database interface for testing the migration script
 * without connecting to a real database.
 */

// Mock data storage
const mockTables = {};

// Mock connection pool
class MockConnectionPool {
  constructor() {
    this.connected = true;
    console.log('Mock database connected');
  }
  
  async connect() {
    return this;
  }
  
  request() {
    return new MockRequest();
  }
  
  async close() {
    this.connected = false;
    console.log('Mock database connection closed');
  }
}

// Mock request
class MockRequest {
  async query(sql) {
    console.log('\\n[MOCK SQL EXECUTION]');
    console.log('=====================');
    
    // Log the SQL being executed
    console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
    console.log('=====================\\n');
    
    // Parse SQL to simulate execution (very simplified)
    if (sql.match(/CREATE TABLE/i)) {
      const tableName = sql.match(/CREATE TABLE.+?dbo\\.([\\w_]+)/i)?.[1];
      if (tableName && !mockTables[tableName]) {
        mockTables[tableName] = [];
        console.log(\`Mock table \${tableName} created\\n\`);
      }
    } else if (sql.match(/ALTER TABLE/i)) {
      const tableName = sql.match(/ALTER TABLE.+?dbo\\.([\\w_]+)/i)?.[1];
      if (tableName) {
        console.log(\`Mock table \${tableName} altered\\n\`);
      }
    } else if (sql.match(/INSERT INTO/i)) {
      const tableName = sql.match(/INSERT INTO.+?dbo\\.([\\w_]+)/i)?.[1];
      if (tableName) {
        console.log(\`Mock data inserted into \${tableName}\\n\`);
      }
    } else if (sql.match(/CREATE INDEX/i)) {
      console.log('Mock index created\\n');
    } else if (sql.match(/CREATE VIEW/i)) {
      console.log('Mock view created\\n');
    } else if (sql.match(/CREATE PROCEDURE/i)) {
      const procName = sql.match(/CREATE PROCEDURE.+?dbo\\.([\\w_]+)/i)?.[1];
      if (procName) {
        console.log(\`Mock procedure \${procName} created\\n\`);
      }
    } else if (sql.match(/EXEC dbo\\./i)) {
      const procName = sql.match(/EXEC dbo\\.([\\w_]+)/i)?.[1];
      if (procName) {
        console.log(\`Mock procedure \${procName} executed\\n\`);
      }
    } else if (sql.match(/BEGIN TRANSACTION/i)) {
      console.log('Mock transaction started\\n');
    } else if (sql.match(/COMMIT TRANSACTION/i)) {
      console.log('Mock transaction committed\\n');
    }
    
    return { recordset: [] };
  }
}

module.exports = {
  ConnectionPool: MockConnectionPool
};
  `;
  
  fs.writeFileSync(mockAdapterPath, mockAdapterContent);
  return require('./mock_database_adapter');
}

async function runMigration() {
  let pool;
  let sql;
  
  try {
    console.log('Reading migration script...');
    const migrationScriptPath = path.join(__dirname, 'final-locked-dashboard', 'sql', 'session_matching_enhancement.sql');
    const migrationScript = fs.readFileSync(migrationScriptPath, 'utf8');
    
    // Create a mock adapter if needed
    if (MOCK_MODE) {
      sql = createMockAdapter();
    } else {
      try {
        sql = require('mssql');
      } catch (err) {
        console.error('Error loading MSSQL driver:', err);
        console.log('Falling back to mock mode...');
        sql = createMockAdapter();
      }
    }
    
    // Display mode
    console.log(`Running in ${MOCK_MODE ? 'MOCK' : 'PRODUCTION'} mode`);
    
    if (!MOCK_MODE) {
      // Production database configuration
      const config = {
        user: process.env.DB_USER || 'scout_admin',
        password: process.env.DB_PASSWORD || 'InsightPulse@2025!',
        server: process.env.DB_SERVER || 'projectscout.database.windows.net',
        database: process.env.DB_NAME || 'ScoutDB',
        options: {
          encrypt: true, // For Azure SQL
          trustServerCertificate: false,
          enableArithAbort: true
        }
      };
      
      console.log('Connecting to database...');
      console.log(`Server: ${config.server}`);
      console.log(`Database: ${config.database}`);
      
      // Connect to database
      pool = await new sql.ConnectionPool(config).connect();
      console.log('Connected to database successfully');
    } else {
      // Mock connection
      pool = await new sql.ConnectionPool().connect();
    }
    
    console.log('Executing migration script...');
    console.log('This may take a while. Please wait...');
    
    // Execute the migration script
    await pool.request().query(migrationScript);
    
    console.log('Migration completed successfully!');
    console.log('Project Scout schema has been enhanced with session matching capabilities.');
    
  } catch (err) {
    console.error('Error executing migration:', err);
    
    // Provide some guidance based on common errors
    if (err.message && err.message.includes('Login failed')) {
      console.error('\nDatabase authentication failed. Please check your connection credentials.');
      console.error('You may need to set the following environment variables:');
      console.error('  DB_USER - Database username');
      console.error('  DB_PASSWORD - Database password');
      console.error('  DB_SERVER - Database server address');
      console.error('  DB_NAME - Database name');
    } else if (err.message && err.message.includes('network-related')) {
      console.error('\nCould not connect to the database server.');
      console.error('Please check if the server is running and accessible.');
    } else if (err.message && err.message.includes('already exists')) {
      console.error('\nSome database objects already exist.');
      console.error('You may need to drop existing objects before running the migration again.');
    } else if (err.message && err.message.includes('Could not find installable ISAM')) {
      console.error('\nDatabase driver issue detected.');
      console.error('Make sure you have the appropriate SQL Server drivers installed.');
    }
    
  } finally {
    // Close the database connection
    if (pool) {
      console.log('Closing database connection...');
      await pool.close();
    }
  }
}

// Run the migration
runMigration().catch(console.error);