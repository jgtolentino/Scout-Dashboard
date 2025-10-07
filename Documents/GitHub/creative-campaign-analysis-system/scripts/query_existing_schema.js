#!/usr/bin/env node
/**
 * Query Existing TBWA ProjectScout Database Schema
 * Identify populated tables and gaps for CES integration
 */

const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  server: process.env.CES_AZURE_SQL_SERVER || 'sqltbwaprojectscoutserver.database.windows.net',
  database: process.env.CES_AZURE_SQL_DATABASE || 'SQL-TBWA-ProjectScout-Reporting-Prod',
  user: process.env.CES_AZURE_SQL_USER || 'sqladmin',
  password: process.env.CES_AZURE_SQL_PASSWORD || 'R@nd0mPA889732025!',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function analyzeSchema() {
  let pool;
  
  try {
    console.log('🔍 Connecting to TBWA ProjectScout Database...');
    console.log(`📊 Database: ${config.database}`);
    console.log(`🖥️  Server: ${config.server}`);
    console.log('');
    
    pool = await sql.connect(config);
    console.log('✅ Connected successfully!');
    console.log('');
    
    // Get all tables
    console.log('=== DISCOVERING ALL TABLES ===');
    const tablesQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const tablesResult = await pool.request().query(tablesQuery);
    const tables = tablesResult.recordset;
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => {
      const fullName = table.TABLE_SCHEMA !== 'dbo' ? 
        `${table.TABLE_SCHEMA}.${table.TABLE_NAME}` : 
        table.TABLE_NAME;
      console.log(`  📋 ${fullName}`);
    });
    
    console.log('');
    console.log('=== ANALYZING TABLE POPULATION ===');
    
    const populatedTables = [];
    const emptyTables = [];
    const errorTables = [];
    
    for (const table of tables) {
      const fullName = `[${table.TABLE_SCHEMA}].[${table.TABLE_NAME}]`;
      const displayName = table.TABLE_SCHEMA !== 'dbo' ? 
        `${table.TABLE_SCHEMA}.${table.TABLE_NAME}` : 
        table.TABLE_NAME;
      
      try {
        const countResult = await pool.request().query(`SELECT COUNT(*) as count FROM ${fullName}`);
        const count = countResult.recordset[0].count;
        
        if (count > 0) {
          populatedTables.push({ name: displayName, count });
          console.log(`✅ ${displayName}: ${count.toLocaleString()} records`);
        } else {
          emptyTables.push(displayName);
          console.log(`❌ ${displayName}: 0 records (EMPTY)`);
        }
      } catch (error) {
        errorTables.push({ name: displayName, error: error.message });
        console.log(`⚠️  ${displayName}: Error - ${error.message}`);
      }
    }
    
    console.log('');
    console.log('=== DETAILED ANALYSIS OF POPULATED TABLES ===');
    
    for (const table of populatedTables) {
      console.log(`\n📊 ${table.name} (${table.count.toLocaleString()} records):`);
      
      // Get column information
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE, 
          IS_NULLABLE, 
          CHARACTER_MAXIMUM_LENGTH,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${table.name.split('.').pop()}'
        ORDER BY ORDINAL_POSITION
      `;
      
      try {
        const columnsResult = await pool.request().query(columnsQuery);
        const columns = columnsResult.recordset;
        
        console.log(`  Columns (${columns.length}):`);
        columns.slice(0, 5).forEach(col => {
          const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
          const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
          console.log(`    - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
        });
        
        if (columns.length > 5) {
          console.log(`    ... and ${columns.length - 5} more columns`);
        }
        
        // Sample a few records
        const sampleQuery = `SELECT TOP 3 * FROM [${table.name.includes('.') ? table.name.replace('.', '].[') : `dbo].[${table.name}`}]`;
        const sampleResult = await pool.request().query(sampleQuery);
        
        if (sampleResult.recordset.length > 0) {
          console.log(`  Sample data (first 3 records):`);
          sampleResult.recordset.forEach((record, idx) => {
            const keys = Object.keys(record).slice(0, 3);
            const sample = keys.map(key => `${key}: ${record[key]}`).join(', ');
            console.log(`    ${idx + 1}. ${sample}...`);
          });
        }
        
      } catch (error) {
        console.log(`    Error getting details: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('=== CES/PAGEINDEX SCHEMA GAPS ===');
    
    // Check for Creative Campaign Analysis specific tables
    const cesRequiredTables = [
      'pageIndex',
      'fileMetadata', 
      'campaignInsights',
      'semanticIndex',
      'qualityMetrics',
      'processingLogs',
      'campaign_documents',
      'creative_features',
      'business_outcomes'
    ];
    
    const existingTables = tables.map(t => t.TABLE_NAME.toLowerCase());
    const missingCesTables = cesRequiredTables.filter(required => 
      !existingTables.includes(required.toLowerCase())
    );
    const existingCesTables = cesRequiredTables.filter(required => 
      existingTables.includes(required.toLowerCase())
    );
    
    if (existingCesTables.length > 0) {
      console.log('✅ Existing CES tables:');
      existingCesTables.forEach(table => console.log(`  - ${table}`));
    }
    
    if (missingCesTables.length > 0) {
      console.log('❌ Missing CES tables:');
      missingCesTables.forEach(table => console.log(`  - ${table}`));
    }
    
    console.log('');
    console.log('=== SUMMARY & RECOMMENDATIONS ===');
    console.log(`📊 Total tables: ${tables.length}`);
    console.log(`✅ Populated tables: ${populatedTables.length}`);
    console.log(`❌ Empty tables: ${emptyTables.length}`);
    console.log(`⚠️  Error tables: ${errorTables.length}`);
    
    if (populatedTables.length > 0) {
      console.log('\n📈 DATA RICH AREAS:');
      populatedTables
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .forEach(table => {
          console.log(`  🔥 ${table.name}: ${table.count.toLocaleString()} records`);
        });
    }
    
    if (emptyTables.length > 0) {
      console.log('\n🔍 DATA GAPS:');
      emptyTables.forEach(table => {
        console.log(`  ❌ ${table} - Needs population`);
      });
    }
    
    if (missingCesTables.length > 0) {
      console.log('\n📋 CES INTEGRATION NEEDS:');
      console.log('  Run: sqlcmd -i sql/pageindex.schema.sql');
      console.log('  Deploy PageIndex schema for semantic indexing');
    }
    
    // Check for campaign/creative related data
    console.log('\n🎯 CREATIVE CAMPAIGN DATA ASSESSMENT:');
    const campaignKeywords = ['campaign', 'creative', 'brand', 'client', 'document', 'file'];
    const relevantTables = populatedTables.filter(table => 
      campaignKeywords.some(keyword => 
        table.name.toLowerCase().includes(keyword)
      )
    );
    
    if (relevantTables.length > 0) {
      console.log('  ✅ Found campaign-related data:');
      relevantTables.forEach(table => {
        console.log(`    - ${table.name}: ${table.count.toLocaleString()} records`);
      });
    } else {
      console.log('  ❌ No obvious campaign data found - Fresh database');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check .env.local credentials');
    console.log('2. Verify Azure SQL firewall rules');
    console.log('3. Confirm database permissions');
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

analyzeSchema().catch(console.error);