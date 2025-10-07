
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
    console.log('\n[MOCK SQL EXECUTION]');
    console.log('=====================');
    
    // Log the SQL being executed
    console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
    console.log('=====================\n');
    
    // Parse SQL to simulate execution (very simplified)
    if (sql.match(/CREATE TABLE/i)) {
      const tableName = sql.match(/CREATE TABLE.+?dbo\.([\w_]+)/i)?.[1];
      if (tableName && !mockTables[tableName]) {
        mockTables[tableName] = [];
        console.log(`Mock table ${tableName} created\n`);
      }
    } else if (sql.match(/ALTER TABLE/i)) {
      const tableName = sql.match(/ALTER TABLE.+?dbo\.([\w_]+)/i)?.[1];
      if (tableName) {
        console.log(`Mock table ${tableName} altered\n`);
      }
    } else if (sql.match(/INSERT INTO/i)) {
      const tableName = sql.match(/INSERT INTO.+?dbo\.([\w_]+)/i)?.[1];
      if (tableName) {
        console.log(`Mock data inserted into ${tableName}\n`);
      }
    } else if (sql.match(/CREATE INDEX/i)) {
      console.log('Mock index created\n');
    } else if (sql.match(/CREATE VIEW/i)) {
      console.log('Mock view created\n');
    } else if (sql.match(/CREATE PROCEDURE/i)) {
      const procName = sql.match(/CREATE PROCEDURE.+?dbo\.([\w_]+)/i)?.[1];
      if (procName) {
        console.log(`Mock procedure ${procName} created\n`);
      }
    } else if (sql.match(/EXEC dbo\./i)) {
      const procName = sql.match(/EXEC dbo\.([\w_]+)/i)?.[1];
      if (procName) {
        console.log(`Mock procedure ${procName} executed\n`);
      }
    } else if (sql.match(/BEGIN TRANSACTION/i)) {
      console.log('Mock transaction started\n');
    } else if (sql.match(/COMMIT TRANSACTION/i)) {
      console.log('Mock transaction committed\n');
    }
    
    return { recordset: [] };
  }
}

module.exports = {
  ConnectionPool: MockConnectionPool
};
  