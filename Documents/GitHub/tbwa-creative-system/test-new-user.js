// Test connection with new tbwa_admin user
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function testNewUserConnection() {
  console.log('🔍 Testing TBWA Admin User Connection');
  console.log('=====================================');
  
  // Test with new tbwa_admin user
  const config = {
    server: process.env.CES_AZURE_SQL_SERVER || 'sqltbwaprojectscoutserver.database.windows.net',
    database: process.env.CES_AZURE_SQL_DATABASE || 'SQL-TBWA-ProjectScout-Reporting-Prod',
    user: 'tbwa_admin',
    password: 'R@nd0mPA$$2025!',
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  };
  
  let pool;
  
  try {
    console.log('📡 Connecting with tbwa_admin user...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
    pool = await sql.connect(config);
    console.log('✅ Connection successful!');
    
    // Test basic query
    console.log('🔍 Testing database access...');
    const result = await pool.request().query(`
      SELECT 
        DB_NAME() as current_database,
        USER_NAME() as current_user,
        GETDATE() as current_time
    `);
    
    console.log('📋 Connection details:');
    console.log(`   Database: ${result.recordset[0].current_database}`);
    console.log(`   User: ${result.recordset[0].current_user}`);
    console.log(`   Time: ${result.recordset[0].current_time}`);
    
    // Check existing tables
    console.log('🔍 Checking existing tables...');
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('📋 Available tables:');
    tables.recordset.forEach(table => {
      console.log(`   • ${table.TABLE_NAME}`);
    });
    
    // Test table creation permissions
    console.log('🔍 Testing table creation permissions...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_tbwa_permissions' AND xtype='U')
        CREATE TABLE test_tbwa_permissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          test_message NVARCHAR(255),
          created_at DATETIME DEFAULT GETDATE()
        )
      `);
      
      await pool.request().query(`
        INSERT INTO test_tbwa_permissions (test_message) VALUES ('TBWA Admin user can create and insert')
      `);
      
      const testResult = await pool.request().query(`
        SELECT * FROM test_tbwa_permissions
      `);
      
      console.log('✅ Table creation and insert permissions confirmed');
      console.log(`   Test record: ${testResult.recordset[0].test_message}`);
      
      // Clean up test table
      await pool.request().query(`DROP TABLE test_tbwa_permissions`);
      console.log('🧹 Test table cleaned up');
      
    } catch (permError) {
      console.log('⚠️  Limited permissions - cannot create tables');
      console.log(`   Error: ${permError.message}`);
    }
    
    console.log('');
    console.log('🎉 tbwa_admin user is ready for TBWA campaign data!');
    return true;
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    
    if (error.message.includes('Login failed')) {
      console.log('');
      console.log('💡 User tbwa_admin does not exist yet. To create:');
      console.log('   1. Log in to Azure Portal');
      console.log('   2. Go to SQL Server: sqltbwaprojectscoutserver');
      console.log('   3. Use Query Editor to run commands from create-user-commands.sql');
      console.log('   4. Run this test again');
    } else if (error.message.includes('firewall')) {
      console.log('');
      console.log('💡 Firewall issue:');
      console.log('   1. Go to Azure SQL Server in portal');
      console.log('   2. Networking → Firewall rules');
      console.log('   3. Add your IP address');
    }
    
    return false;
    
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run the test
testNewUserConnection()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🚀 Ready to populate TBWA campaign data!');
      console.log('Run: node populate-tbwa-campaigns.js');
    }
  })
  .catch(console.error);