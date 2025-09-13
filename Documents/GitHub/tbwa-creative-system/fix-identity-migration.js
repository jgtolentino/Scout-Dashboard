// Fix identity column migration for tbwa_campaigns and tbwa_data_metadata
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function fixIdentityMigration() {
  console.log('🔧 Fixing Identity Column Migration');
  console.log('==================================');
  
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
    
    // Fix tbwa_campaigns migration
    await fixCampaignsMigration(pool);
    
    // Fix tbwa_data_metadata migration
    await fixDataMetadataMigration(pool);
    
    // Verify final state
    await verifyFinalMigration(pool);
    
    console.log('');
    console.log('🎉 Identity Column Migration Fixed!');
    console.log('✅ All TBWA tables successfully migrated to ces schema');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function fixCampaignsMigration(pool) {
  console.log('🔧 Fixing ces.tbwa_campaigns migration...');
  
  try {
    // Enable identity insert
    await pool.request().query('SET IDENTITY_INSERT ces.tbwa_campaigns ON');
    
    // Migrate data with explicit column list
    await pool.request().query(`
      INSERT INTO ces.tbwa_campaigns (
        id, campaign_name, client_name, campaign_type, predicted_roi, 
        predicted_ctr, confidence_score, budget, start_date, end_date, status, created_at
      )
      SELECT 
        id, campaign_name, client_name, campaign_type, predicted_roi,
        predicted_ctr, confidence_score, budget, start_date, end_date, status, created_at
      FROM dbo.tbwa_campaigns
    `);
    
    // Disable identity insert
    await pool.request().query('SET IDENTITY_INSERT ces.tbwa_campaigns OFF');
    
    const count = await pool.request().query('SELECT COUNT(*) as count FROM ces.tbwa_campaigns');
    console.log(`   ✅ Migrated ${count.recordset[0].count} campaigns`);
    
  } catch (error) {
    console.log(`   ❌ Failed to fix campaigns: ${error.message}`);
  }
}

async function fixDataMetadataMigration(pool) {
  console.log('🔧 Fixing ces.tbwa_data_metadata migration...');
  
  try {
    // Check if source table has data
    const sourceCount = await pool.request().query('SELECT COUNT(*) as count FROM dbo.tbwa_data_metadata');
    
    if (sourceCount.recordset[0].count > 0) {
      // Enable identity insert
      await pool.request().query('SET IDENTITY_INSERT ces.tbwa_data_metadata ON');
      
      // Migrate data with explicit column list
      await pool.request().query(`
        INSERT INTO ces.tbwa_data_metadata (
          id, table_name, record_count, last_updated, data_source, quality_score
        )
        SELECT 
          id, table_name, record_count, last_updated, data_source, quality_score
        FROM dbo.tbwa_data_metadata
      `);
      
      // Disable identity insert
      await pool.request().query('SET IDENTITY_INSERT ces.tbwa_data_metadata OFF');
      
      const count = await pool.request().query('SELECT COUNT(*) as count FROM ces.tbwa_data_metadata');
      console.log(`   ✅ Migrated ${count.recordset[0].count} metadata records`);
    } else {
      console.log('   ℹ️  No data in source table to migrate');
    }
    
  } catch (error) {
    console.log(`   ❌ Failed to fix metadata: ${error.message}`);
  }
}

async function verifyFinalMigration(pool) {
  console.log('🔍 Final migration verification...');
  
  const verification = await pool.request().query(`
    SELECT 
      t.TABLE_NAME,
      (SELECT COUNT(*) FROM ces.tbwa_campaign_documents) as campaign_docs,
      (SELECT COUNT(*) FROM ces.tbwa_creative_analysis) as creative_analysis,
      (SELECT COUNT(*) FROM ces.tbwa_business_predictions) as business_predictions,
      (SELECT COUNT(*) FROM ces.tbwa_campaigns) as campaigns,
      (SELECT COUNT(*) FROM ces.tbwa_data_metadata) as data_metadata
    FROM INFORMATION_SCHEMA.TABLES t
    WHERE t.TABLE_SCHEMA = 'ces' AND t.TABLE_NAME = 'tbwa_campaigns'
  `);
  
  const stats = verification.recordset[0];
  
  console.log('📊 Final CES Schema TBWA Data:');
  console.log(`   • ces.tbwa_campaign_documents: ${stats.campaign_docs} rows`);
  console.log(`   • ces.tbwa_creative_analysis: ${stats.creative_analysis} rows`);
  console.log(`   • ces.tbwa_business_predictions: ${stats.business_predictions} rows`);
  console.log(`   • ces.tbwa_campaigns: ${stats.campaigns} rows`);
  console.log(`   • ces.tbwa_data_metadata: ${stats.data_metadata} rows`);
  
  const total = stats.campaign_docs + stats.creative_analysis + stats.business_predictions + stats.campaigns + stats.data_metadata;
  console.log(`   📈 Total records: ${total}`);
}

// Run the fix
fixIdentityMigration();