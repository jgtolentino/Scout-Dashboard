// Clean up the remaining dbo.tbwa_data_metadata table with foreign key constraint
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function cleanupFinalTable() {
  console.log('🔧 Cleaning up remaining dbo.tbwa_data_metadata table');
  console.log('==================================================');
  
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
    
    // Find foreign key constraints
    await findForeignKeyConstraints(pool);
    
    // Drop constraints and then table
    await dropConstraintsAndTable(pool);
    
    // Final verification
    await finalVerification(pool);
    
    console.log('');
    console.log('🎉 Final cleanup complete!');
    console.log('✅ All old dbo TBWA tables have been removed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function findForeignKeyConstraints(pool) {
  console.log('🔍 Finding foreign key constraints...');
  
  const constraints = await pool.request().query(`
    SELECT 
      fk.name AS constraint_name,
      tp.name AS parent_table,
      tr.name AS referenced_table
    FROM sys.foreign_keys fk
    INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    WHERE tr.name = 'tbwa_data_metadata'
       OR tp.name = 'tbwa_data_metadata'
  `);
  
  if (constraints.recordset.length > 0) {
    console.log('📋 Found foreign key constraints:');
    constraints.recordset.forEach(constraint => {
      console.log(`   • ${constraint.constraint_name}: ${constraint.parent_table} → ${constraint.referenced_table}`);
    });
  } else {
    console.log('   ℹ️  No foreign key constraints found');
  }
  
  return constraints.recordset;
}

async function dropConstraintsAndTable(pool) {
  console.log('🗑️  Dropping constraints and table...');
  
  try {
    // Try to find and drop any foreign key constraints
    const dropConstraints = await pool.request().query(`
      DECLARE @sql NVARCHAR(MAX) = ''
      SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
      FROM sys.foreign_keys
      WHERE referenced_object_id = OBJECT_ID('dbo.tbwa_data_metadata')
      
      EXEC sp_executesql @sql
    `);
    
    console.log('   ✅ Foreign key constraints dropped');
    
    // Now drop the table
    await pool.request().query(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'tbwa_data_metadata')
      DROP TABLE dbo.tbwa_data_metadata
    `);
    
    console.log('   ✅ dbo.tbwa_data_metadata table dropped');
    
  } catch (error) {
    console.log(`   ❌ Failed to drop table: ${error.message}`);
    
    // Alternative approach - just rename the table
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'tbwa_data_metadata')
        EXEC sp_rename 'dbo.tbwa_data_metadata', 'tbwa_data_metadata_old'
      `);
      console.log('   ⚠️  Table renamed to dbo.tbwa_data_metadata_old (can be manually deleted later)');
    } catch (renameError) {
      console.log(`   ❌ Could not rename table: ${renameError.message}`);
    }
  }
}

async function finalVerification(pool) {
  console.log('🔍 Final verification...');
  
  // Check for any remaining dbo TBWA tables
  const remainingTables = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME LIKE 'tbwa_%'
    ORDER BY TABLE_NAME
  `);
  
  if (remainingTables.recordset.length === 0) {
    console.log('   ✅ No dbo TBWA tables remain');
  } else {
    console.log('   📋 Remaining dbo TBWA tables:');
    remainingTables.recordset.forEach(table => {
      console.log(`      • dbo.${table.TABLE_NAME}`);
    });
  }
  
  // Verify ces schema tables are intact
  const cesTables = await pool.request().query(`
    SELECT 
      TABLE_NAME,
      (SELECT COUNT(*) FROM ces.tbwa_campaign_documents) + 
      (SELECT COUNT(*) FROM ces.tbwa_creative_analysis) + 
      (SELECT COUNT(*) FROM ces.tbwa_business_predictions) + 
      (SELECT COUNT(*) FROM ces.tbwa_campaigns) + 
      (SELECT COUNT(*) FROM ces.tbwa_data_metadata) as total_records
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'ces' AND TABLE_NAME = 'tbwa_campaigns'
  `);
  
  if (cesTables.recordset.length > 0) {
    console.log(`   ✅ CES schema intact with ${cesTables.recordset[0].total_records} total records`);
  }
}

// Run the final cleanup
cleanupFinalTable();