// Test Azure SQL connection with different approaches
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function testConnection() {
  console.log('🔍 Testing Azure SQL Connection');
  console.log('===============================');
  
  // Test 1: Try with provided credentials
  console.log('Test 1: Standard credentials');
  await testCredentials({
    server: process.env.CES_AZURE_SQL_SERVER,
    database: process.env.CES_AZURE_SQL_DATABASE,
    user: process.env.CES_AZURE_SQL_USER,
    password: 'R@nd0mPA$$2025!',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  });
  
  // Test 2: Try with connection timeout
  console.log('\nTest 2: With timeout settings');
  await testCredentials({
    server: process.env.CES_AZURE_SQL_SERVER,
    database: process.env.CES_AZURE_SQL_DATABASE,
    user: process.env.CES_AZURE_SQL_USER,
    password: 'R@nd0mPA$$2025!',
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  });
  
  // Test 3: Try without specifying database
  console.log('\nTest 3: Connect to server without specific database');
  await testCredentials({
    server: process.env.CES_AZURE_SQL_SERVER,
    user: process.env.CES_AZURE_SQL_USER,
    password: 'R@nd0mPA$$2025!',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  });
  
  // Test 4: Try alternative admin user formats
  console.log('\nTest 4: Try alternative user formats');
  await testCredentials({
    server: process.env.CES_AZURE_SQL_SERVER,
    database: process.env.CES_AZURE_SQL_DATABASE,
    user: 'sqladmin@sqltbwaprojectscoutserver', // Fully qualified
    password: 'R@nd0mPA$$2025!',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  });
}

async function testCredentials(config) {
  let pool;
  try {
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database || 'master'}`);
    console.log(`   User: ${config.user}`);
    
    pool = await sql.connect(config);
    console.log('   ✅ Connection successful!');
    
    // Try to list databases
    const result = await pool.request().query('SELECT name FROM sys.databases');
    console.log('   📋 Available databases:');
    result.recordset.forEach(db => {
      console.log(`      • ${db.name}`);
    });
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    
    if (error.message.includes('firewall')) {
      console.log('   💡 Firewall issue - check Azure SQL firewall rules');
    } else if (error.message.includes('Login failed')) {
      console.log('   💡 Authentication issue - check username/password');
    } else if (error.message.includes('timeout')) {
      console.log('   💡 Connection timeout - check server name and network');
    }
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

testConnection();