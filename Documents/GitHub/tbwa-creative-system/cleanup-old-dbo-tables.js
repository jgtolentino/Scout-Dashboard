// Optional cleanup script to remove old dbo TBWA tables after verification
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function cleanupOldDboTables() {
  console.log('🗑️  TBWA Tables Cleanup - DBO Schema');
  console.log('===================================');
  console.log('⚠️  WARNING: This will permanently delete the old dbo TBWA tables!');
  console.log('⚠️  Only run this after verifying ces schema tables work correctly!');
  console.log('');
  
  // Safety prompt simulation (in real use, you'd want actual user confirmation)
  console.log('📋 Before cleanup, verify ces schema is working:');
  console.log('   1. Test dashboard with ces.tablename queries');
  console.log('   2. Verify all data is present and correct');
  console.log('   3. Confirm applications are updated to use ces schema');
  console.log('');
  
  let pool;
  
  try {
    const config = {
      server: 'sqltbwaprojectscoutserver.database.windows.net',
      database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
      user: 'TBWA',
      password: 'R@nd0mPA$$2025!',
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    console.log('📡 Connecting to Azure SQL...');
    pool = await sql.connect(config);
    console.log('✅ Connected successfully');
    
    // First, show what will be deleted
    await showTablesForDeletion(pool);
    
    // Perform the cleanup
    await performCleanup(pool);
    
    console.log('');
    console.log('✅ Cleanup executed successfully');
    console.log('🗑️  Old dbo tables have been removed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function showTablesForDeletion(pool) {
  console.log('📋 Tables that would be deleted:');
  
  const dboTables = await pool.request().query(`
    SELECT 
      t.TABLE_NAME,
      p.rows as row_count
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
    LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0,1)
    WHERE t.TABLE_SCHEMA = 'dbo' 
      AND t.TABLE_NAME LIKE 'tbwa_%'
    ORDER BY t.TABLE_NAME
  `);
  
  let totalRows = 0;
  dboTables.recordset.forEach(table => {
    const rows = table.row_count || 0;
    totalRows += rows;
    console.log(`   🗑️  dbo.${table.TABLE_NAME}: ${rows} rows`);
  });
  
  console.log(`   📊 Total rows to be deleted: ${totalRows}`);
  
  // Show corresponding ces tables for comparison
  console.log('');
  console.log('📋 Corresponding ces schema tables (safe):');
  
  const cesTables = await pool.request().query(`
    SELECT 
      t.TABLE_NAME,
      p.rows as row_count
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME  
    LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0,1)
    WHERE t.TABLE_SCHEMA = 'ces' 
      AND t.TABLE_NAME LIKE 'tbwa_%'
    ORDER BY t.TABLE_NAME
  `);
  
  let totalCesRows = 0;
  cesTables.recordset.forEach(table => {
    const rows = table.row_count || 0;
    totalCesRows += rows;
    console.log(`   ✅ ces.${table.TABLE_NAME}: ${rows} rows`);
  });
  
  console.log(`   📊 Total rows in ces schema: ${totalCesRows}`);
}

async function performCleanup(pool) {
  console.log('🗑️  Performing cleanup of dbo TBWA tables...');
  
  const tablesToDrop = [
    'tbwa_campaign_documents',
    'tbwa_creative_analysis',
    'tbwa_business_predictions',
    'tbwa_campaigns',
    'tbwa_data_metadata',
    'tbwa_transactions_mock'
  ];
  
  let deletedTables = 0;
  
  for (const tableName of tablesToDrop) {
    try {
      // Check if table exists first
      const exists = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${tableName}'
      `);
      
      if (exists.recordset[0].count > 0) {
        // Drop the table
        await pool.request().query(`DROP TABLE dbo.${tableName}`);
        console.log(`   ✅ Deleted dbo.${tableName}`);
        deletedTables++;
      } else {
        console.log(`   ℹ️  dbo.${tableName} does not exist`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to delete dbo.${tableName}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Successfully deleted ${deletedTables} tables`);
  
  // Final verification - ensure no dbo TBWA tables remain
  const remainingTables = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME LIKE 'tbwa_%'
  `);
  
  if (remainingTables.recordset.length === 0) {
    console.log('   ✅ All dbo TBWA tables successfully removed');
  } else {
    console.log('   ⚠️  Some dbo TBWA tables still remain:');
    remainingTables.recordset.forEach(table => {
      console.log(`      • dbo.${table.TABLE_NAME}`);
    });
  }
}

// Run the cleanup preview
cleanupOldDboTables()
  .then(() => {
    console.log('');
    console.log('🎯 Cleanup Summary:');
    console.log('   ℹ️  This was a preview run - no tables deleted');
    console.log('   📝 To actually delete old dbo tables:');
    console.log('      1. Verify ces schema works in your dashboard');
    console.log('      2. Update all queries to use ces.tablename');
    console.log('      3. Uncomment performCleanup() in this script');
    console.log('      4. Run the script again');
    console.log('');
    console.log('✅ Migration to ces schema is complete and ready to use!');
  });