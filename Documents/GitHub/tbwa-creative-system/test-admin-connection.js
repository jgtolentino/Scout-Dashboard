// Test connection with admin credentials using provided password
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function testAdminConnection() {
  console.log('🔍 Testing Admin Connection with Provided Password');
  console.log('=================================================');
  
  // Test with admin user and provided password
  const config = {
    server: process.env.CES_AZURE_SQL_SERVER || 'sqltbwaprojectscoutserver.database.windows.net',
    database: process.env.CES_AZURE_SQL_DATABASE || 'SQL-TBWA-ProjectScout-Reporting-Prod',
    user: process.env.CES_AZURE_SQL_USER || 'sqladmin',
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
    console.log('📡 Connecting with admin credentials...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
    pool = await sql.connect(config);
    console.log('✅ Admin connection successful!');
    
    // Test basic query
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
    
    // Now create the tbwa_admin user
    console.log('');
    console.log('👤 Creating tbwa_admin user...');
    
    try {
      // Create login (if not exists)
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'tbwa_admin')
        CREATE LOGIN tbwa_admin WITH PASSWORD = 'R@nd0mPA$$2025!'
      `);
      
      console.log('✅ Login created/verified');
      
      // Create user (if not exists)
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'tbwa_admin')
        CREATE USER tbwa_admin FOR LOGIN tbwa_admin
      `);
      
      console.log('✅ User created/verified');
      
      // Grant permissions
      await pool.request().query(`
        ALTER ROLE db_datareader ADD MEMBER tbwa_admin;
        ALTER ROLE db_datawriter ADD MEMBER tbwa_admin;
        ALTER ROLE db_ddladmin ADD MEMBER tbwa_admin;
        GRANT CREATE TABLE TO tbwa_admin;
      `);
      
      console.log('✅ Permissions granted');
      
    } catch (userError) {
      console.log('⚠️  User creation error (might already exist):', userError.message);
    }
    
    console.log('');
    console.log('🎉 Ready to populate TBWA campaign data!');
    return true;
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    
    if (error.message.includes('Login failed')) {
      console.log('');
      console.log('💡 Admin password might be incorrect.');
      console.log('   Please verify the admin password in Azure portal.');
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
testAdminConnection()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🚀 Now testing tbwa_admin connection...');
      // Test the new user
      const { spawn } = require('child_process');
      const test = spawn('node', ['test-new-user.js']);
      
      test.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      test.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      test.on('close', (code) => {
        if (code === 0) {
          console.log('🎉 Ready to populate TBWA data!');
          console.log('Run: node populate-tbwa-campaigns.js');
        }
      });
    }
  })
  .catch(console.error);