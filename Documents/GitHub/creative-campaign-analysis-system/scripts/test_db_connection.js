#!/usr/bin/env node
/**
 * Simple database connection test for TBWA ProjectScout
 */

const sql = require('mssql');

// Direct connection (same credentials as .env.local)
const config = {
  server: 'sqltbwaprojectscoutserver.database.windows.net',
  database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
  user: 'sqladmin',
  password: 'R@nd0mPA889732025!',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 60000,
    connectionTimeout: 60000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function testConnection() {
  let pool;
  
  try {
    console.log('🔍 Testing connection to TBWA ProjectScout Database...');
    console.log(`📊 Server: ${config.server}`);
    console.log(`🗃️  Database: ${config.database}`);
    console.log('');
    
    pool = await sql.connect(config);
    console.log('✅ Connection successful!');
    
    // Simple query to test
    console.log('📋 Testing basic query...');
    const result = await pool.request().query('SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
    
    console.log('✅ Query successful! Found tables:');
    result.recordset.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    // Count total tables
    const countResult = await pool.request().query('SELECT COUNT(*) as table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
    console.log(`\n📊 Total tables in database: ${countResult.recordset[0].table_count}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('Login failed')) {
      console.log('\n🔒 Authentication issue detected.');
      console.log('Possible causes:');
      console.log('1. Credentials have changed');
      console.log('2. User account is locked/disabled');
      console.log('3. Database firewall rules');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n⏱️  Timeout issue detected.');
      console.log('Possible causes:');
      console.log('1. Network connectivity issues');
      console.log('2. Database server overloaded');
      console.log('3. Firewall blocking connection');
    }
    
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Connection closed.');
    }
  }
}

testConnection().catch(console.error);