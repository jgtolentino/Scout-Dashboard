// Verify CES schema setup and updated configuration
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function verifyCesSetup() {
  console.log('✅ TBWA Creative Intelligence - CES Schema Verification');
  console.log('====================================================');
  
  let pool;
  
  try {
    const config = {
      server: process.env.CES_AZURE_SQL_SERVER,
      database: process.env.CES_AZURE_SQL_DATABASE,
      user: process.env.CES_AZURE_SQL_USER,
      password: process.env.CES_AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    console.log('📡 Testing connection with updated .env credentials...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Schema: ${process.env.CES_SCHEMA}`);
    
    pool = await sql.connect(config);
    console.log('✅ Connection successful with updated credentials');
    
    // Test environment variables
    await testEnvironmentVariables();
    
    // Verify CES schema tables
    await verifyCesTables(pool);
    
    // Test sample queries using environment variables
    await testSampleQueries(pool);
    
    // Verify no old dbo tables remain
    await verifyNoOldTables(pool);
    
    console.log('');
    console.log('🎉 CES Schema Setup Verification Complete!');
    console.log('✅ All systems ready for production use');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...');
  
  const requiredVars = [
    'CES_AZURE_SQL_SERVER',
    'CES_AZURE_SQL_DATABASE', 
    'CES_AZURE_SQL_USER',
    'CES_AZURE_SQL_PASSWORD',
    'CES_SCHEMA',
    'TBWA_CAMPAIGN_DOCUMENTS_TABLE',
    'TBWA_CREATIVE_ANALYSIS_TABLE',
    'TBWA_BUSINESS_PREDICTIONS_TABLE',
    'TBWA_CAMPAIGNS_TABLE',
    'TBWA_DATA_METADATA_TABLE'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log('   ✅ All environment variables configured');
  } else {
    throw new Error('Missing required environment variables');
  }
}

async function verifyCesTables(pool) {
  console.log('📊 Verifying CES schema TBWA tables...');
  
  const tables = await pool.request().query(`
    SELECT 
      t.TABLE_NAME,
      ISNULL(p.rows, 0) as row_count
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
    LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0,1)
    WHERE t.TABLE_SCHEMA = '${process.env.CES_SCHEMA}' 
      AND t.TABLE_NAME LIKE 'tbwa_%'
    ORDER BY t.TABLE_NAME
  `);
  
  console.log('📋 CES Schema TBWA Tables:');
  let totalRecords = 0;
  
  tables.recordset.forEach(table => {
    const records = table.row_count || 0;
    totalRecords += records;
    console.log(`   ✅ ${process.env.CES_SCHEMA}.${table.TABLE_NAME}: ${records} rows`);
  });
  
  console.log(`   📈 Total records: ${totalRecords}`);
  
  if (tables.recordset.length < 5) {
    throw new Error('Missing TBWA tables in CES schema');
  }
}

async function testSampleQueries(pool) {
  console.log('🔍 Testing sample queries with environment variables...');
  
  // Test campaigns query
  const campaignsQuery = `SELECT COUNT(*) as count FROM ${process.env.TBWA_CAMPAIGNS_TABLE}`;
  const campaignsResult = await pool.request().query(campaignsQuery);
  console.log(`   ✅ Campaigns query: ${campaignsResult.recordset[0].count} campaigns found`);
  
  // Test documents query
  const documentsQuery = `SELECT COUNT(*) as count FROM ${process.env.TBWA_CAMPAIGN_DOCUMENTS_TABLE}`;
  const documentsResult = await pool.request().query(documentsQuery);
  console.log(`   ✅ Documents query: ${documentsResult.recordset[0].count} documents found`);
  
  // Test creative analysis query
  const analysisQuery = `SELECT COUNT(*) as count FROM ${process.env.TBWA_CREATIVE_ANALYSIS_TABLE}`;
  const analysisResult = await pool.request().query(analysisQuery);
  console.log(`   ✅ Analysis query: ${analysisResult.recordset[0].count} analyses found`);
  
  // Test business predictions query
  const predictionsQuery = `SELECT COUNT(*) as count FROM ${process.env.TBWA_BUSINESS_PREDICTIONS_TABLE}`;
  const predictionsResult = await pool.request().query(predictionsQuery);
  console.log(`   ✅ Predictions query: ${predictionsResult.recordset[0].count} predictions found`);
  
  // Test joined query
  const joinedQuery = `
    SELECT 
      c.campaign_name,
      c.predicted_roi,
      c.predicted_ctr,
      COUNT(d.id) as document_count
    FROM ${process.env.TBWA_CAMPAIGNS_TABLE} c
    LEFT JOIN ${process.env.TBWA_CAMPAIGN_DOCUMENTS_TABLE} d ON c.campaign_name = d.campaign_name
    GROUP BY c.campaign_name, c.predicted_roi, c.predicted_ctr
    ORDER BY c.predicted_roi DESC
  `;
  
  const joinedResult = await pool.request().query(joinedQuery);
  console.log(`   ✅ Joined query: ${joinedResult.recordset.length} campaign summaries`);
  
  if (joinedResult.recordset.length > 0) {
    console.log('   📋 Sample campaign data:');
    joinedResult.recordset.forEach(campaign => {
      console.log(`      • ${campaign.campaign_name}: ROI ${campaign.predicted_roi}x, CTR ${campaign.predicted_ctr}%, ${campaign.document_count} docs`);
    });
  }
}

async function verifyNoOldTables(pool) {
  console.log('🔍 Verifying old dbo tables are removed...');
  
  const oldTables = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME LIKE 'tbwa_%'
  `);
  
  if (oldTables.recordset.length === 0) {
    console.log('   ✅ No old dbo TBWA tables found - cleanup complete');
  } else {
    console.log('   ⚠️  Some old dbo tables still exist:');
    oldTables.recordset.forEach(table => {
      console.log(`      • dbo.${table.TABLE_NAME}`);
    });
  }
}

// Run verification
verifyCesSetup()
  .then(() => {
    console.log('');
    console.log('🎯 Next Steps for Dashboard Integration:');
    console.log('   1. Update your dashboard queries to use environment variables:');
    console.log('      - process.env.TBWA_CAMPAIGNS_TABLE');
    console.log('      - process.env.TBWA_CAMPAIGN_DOCUMENTS_TABLE');
    console.log('      - process.env.TBWA_CREATIVE_ANALYSIS_TABLE');
    console.log('      - process.env.TBWA_BUSINESS_PREDICTIONS_TABLE');
    console.log('');
    console.log('   2. Example query:');
    console.log('      SELECT * FROM process.env.TBWA_CAMPAIGNS_TABLE');
    console.log('      // Resolves to: SELECT * FROM ces.tbwa_campaigns');
    console.log('');
    console.log('✅ TBWA Creative Intelligence CES Schema is production ready!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });