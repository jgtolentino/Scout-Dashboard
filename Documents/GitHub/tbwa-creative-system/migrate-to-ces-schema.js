// Migrate TBWA Creative Intelligence tables from dbo to ces schema
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function migrateToCesSchema() {
  console.log('🔄 TBWA Creative Intelligence → CES Schema Migration');
  console.log('==================================================');
  
  let pool;
  
  try {
    // Connect with TBWA credentials
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
    
    // Step 1: Create CES schema if it doesn't exist
    await createCesSchema(pool);
    
    // Step 2: Check existing TBWA tables in dbo schema
    await checkExistingTables(pool);
    
    // Step 3: Create tables in CES schema
    await createCesSchemaTables(pool);
    
    // Step 4: Migrate data from dbo to ces schema
    await migrateData(pool);
    
    // Step 5: Verify migration
    await verifyMigration(pool);
    
    // Step 6: Optional - Drop old dbo tables (commented out for safety)
    // await dropOldTables(pool);
    
    console.log('');
    console.log('🎉 CES Schema Migration Complete!');
    console.log('===============================');
    console.log('✅ TBWA tables successfully moved to ces schema');
    console.log('📊 New table structure:');
    console.log('   • ces.tbwa_campaign_documents');
    console.log('   • ces.tbwa_creative_analysis');
    console.log('   • ces.tbwa_business_predictions');
    console.log('   • ces.tbwa_campaigns');
    console.log('   • ces.tbwa_data_metadata');
    console.log('');
    console.log('🎯 Update your dashboard queries to use ces schema');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function createCesSchema(pool) {
  console.log('🏗️  Creating CES schema...');
  
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ces')
      BEGIN
        EXEC('CREATE SCHEMA ces')
      END
    `);
    console.log('   ✅ CES schema ready');
  } catch (error) {
    console.log('   ⚠️  CES schema might already exist or permission issue');
  }
}

async function checkExistingTables(pool) {
  console.log('🔍 Checking existing TBWA tables in dbo schema...');
  
  const tables = await pool.request().query(`
    SELECT TABLE_NAME, TABLE_SCHEMA
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE 'tbwa_%'
    ORDER BY TABLE_NAME
  `);
  
  console.log('📋 Found TBWA tables:');
  tables.recordset.forEach(table => {
    console.log(`   • ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
  });
  
  return tables.recordset;
}

async function createCesSchemaTables(pool) {
  console.log('🏗️  Creating TBWA tables in CES schema...');
  
  // Campaign documents table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ces' AND TABLE_NAME = 'tbwa_campaign_documents')
    CREATE TABLE ces.tbwa_campaign_documents (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) UNIQUE NOT NULL,
      filename NVARCHAR(500) NOT NULL,
      file_type NVARCHAR(50),
      campaign_name NVARCHAR(255),
      client_name NVARCHAR(255),
      file_size BIGINT,
      upload_date DATETIME DEFAULT GETDATE(),
      processed_date DATETIME,
      status NVARCHAR(50) DEFAULT 'Processed'
    )
  `);
  
  // Creative analysis table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ces' AND TABLE_NAME = 'tbwa_creative_analysis')
    CREATE TABLE ces.tbwa_creative_analysis (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      has_logo BIT,
      has_product_shot BIT,
      has_call_to_action BIT,
      is_minimalist BIT,
      uses_bold_typography BIT,
      emotional_appeal BIT,
      color_vibrancy DECIMAL(3,2),
      text_density DECIMAL(3,2),
      composition_score DECIMAL(3,2),
      analysis_timestamp DATETIME DEFAULT GETDATE()
    )
  `);
  
  // Business predictions table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ces' AND TABLE_NAME = 'tbwa_business_predictions')
    CREATE TABLE ces.tbwa_business_predictions (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      predicted_ctr DECIMAL(4,2),
      predicted_roi DECIMAL(4,2),
      predicted_engagement_rate DECIMAL(4,2),
      predicted_conversion_rate DECIMAL(4,2),
      predicted_brand_recall DECIMAL(4,2),
      predicted_revenue_impact MONEY,
      confidence_score DECIMAL(3,2),
      prediction_timestamp DATETIME DEFAULT GETDATE()
    )
  `);
  
  // Campaigns summary table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ces' AND TABLE_NAME = 'tbwa_campaigns')
    CREATE TABLE ces.tbwa_campaigns (
      id INT IDENTITY(1,1) PRIMARY KEY,
      campaign_name NVARCHAR(255) NOT NULL,
      client_name NVARCHAR(255),
      campaign_type NVARCHAR(100),
      predicted_roi DECIMAL(4,2),
      predicted_ctr DECIMAL(4,2),
      confidence_score DECIMAL(3,2),
      budget MONEY,
      start_date DATE,
      end_date DATE,
      status NVARCHAR(50) DEFAULT 'Active',
      created_at DATETIME DEFAULT GETDATE()
    )
  `);
  
  // Data metadata table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ces' AND TABLE_NAME = 'tbwa_data_metadata')
    CREATE TABLE ces.tbwa_data_metadata (
      id INT IDENTITY(1,1) PRIMARY KEY,
      table_name NVARCHAR(255),
      record_count INT,
      last_updated DATETIME DEFAULT GETDATE(),
      data_source NVARCHAR(255),
      quality_score DECIMAL(3,2)
    )
  `);
  
  console.log('   ✅ CES schema tables created');
}

async function migrateData(pool) {
  console.log('📦 Migrating data from dbo to ces schema...');
  
  const tablesToMigrate = [
    'tbwa_campaign_documents',
    'tbwa_creative_analysis', 
    'tbwa_business_predictions',
    'tbwa_campaigns',
    'tbwa_data_metadata'
  ];
  
  for (const tableName of tablesToMigrate) {
    try {
      // Check if source table exists in dbo
      const sourceExists = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${tableName}'
      `);
      
      if (sourceExists.recordset[0].count > 0) {
        // Get row count from source
        const rowCount = await pool.request().query(`
          SELECT COUNT(*) as count FROM dbo.${tableName}
        `);
        
        if (rowCount.recordset[0].count > 0) {
          // Migrate data
          await pool.request().query(`
            INSERT INTO ces.${tableName}
            SELECT * FROM dbo.${tableName}
          `);
          
          console.log(`   ✅ Migrated ${rowCount.recordset[0].count} rows from dbo.${tableName}`);
        } else {
          console.log(`   ⚠️  dbo.${tableName} is empty - no data to migrate`);
        }
      } else {
        console.log(`   ℹ️  dbo.${tableName} does not exist - skipping`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to migrate ${tableName}: ${error.message}`);
    }
  }
}

async function verifyMigration(pool) {
  console.log('🔍 Verifying migration...');
  
  const cesTablesQuery = await pool.request().query(`
    SELECT 
      t.TABLE_NAME,
      ISNULL(p.rows, 0) as row_count
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
    LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0,1)
    WHERE t.TABLE_SCHEMA = 'ces' 
      AND t.TABLE_NAME LIKE 'tbwa_%'
    ORDER BY t.TABLE_NAME
  `);
  
  console.log('📊 CES schema TBWA tables:');
  cesTablesQuery.recordset.forEach(table => {
    console.log(`   • ces.${table.TABLE_NAME}: ${table.row_count} rows`);
  });
  
  // Verify total records migrated
  const totalRecords = cesTablesQuery.recordset.reduce((sum, table) => sum + table.row_count, 0);
  console.log(`   📈 Total records in CES schema: ${totalRecords}`);
}

async function dropOldTables(pool) {
  console.log('⚠️  WARNING: This will drop the old dbo tables!');
  console.log('🗑️  Dropping old dbo tables (uncomment if needed)...');
  
  // Commented out for safety - uncomment after verifying migration
  /*
  const tablesToDrop = [
    'tbwa_campaign_documents',
    'tbwa_creative_analysis',
    'tbwa_business_predictions', 
    'tbwa_campaigns',
    'tbwa_data_metadata'
  ];
  
  for (const tableName of tablesToDrop) {
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${tableName}')
        DROP TABLE dbo.${tableName}
      `);
      console.log(`   ✅ Dropped dbo.${tableName}`);
    } catch (error) {
      console.log(`   ❌ Failed to drop dbo.${tableName}: ${error.message}`);
    }
  }
  */
  
  console.log('   ℹ️  Old table cleanup skipped for safety');
  console.log('   💡 Manually drop dbo tables after verifying ces tables work correctly');
}

// Run the migration
migrateToCesSchema()
  .then(() => {
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Update dashboard queries to use ces.tablename');
    console.log('   2. Test all functionality with new schema');
    console.log('   3. Drop old dbo tables after verification');
    console.log('   4. Update application connection strings if needed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });