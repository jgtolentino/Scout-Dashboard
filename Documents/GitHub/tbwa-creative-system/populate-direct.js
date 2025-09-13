// Direct population script for TBWA Campaign data → Azure SQL
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

// Azure SQL configuration
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

async function populateAzureSQL() {
  console.log('🚀 TBWA Creative Intelligence → Azure SQL Population');
  console.log('==================================================');
  
  let pool;
  
  try {
    // Connect to Azure SQL
    console.log('📡 Connecting to Azure SQL...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database}`);
    
    pool = await sql.connect(config);
    console.log('✅ Connected to Azure SQL');
    
    // Initialize schema
    await initializeSchema(pool);
    
    // Insert sample TBWA campaign data
    await insertSampleData(pool);
    
    // Generate summary
    await generateSummary(pool);
    
    console.log('');
    console.log('🎉 Population Complete!');
    console.log('✅ TBWA campaign data ready in Azure SQL');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function initializeSchema(pool) {
  console.log('🔧 Initializing database schema...');
  
  // Create campaign_documents table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaign_documents' AND xtype='U')
    CREATE TABLE campaign_documents (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) UNIQUE NOT NULL,
      filename NVARCHAR(500) NOT NULL,
      mime_type NVARCHAR(100),
      size BIGINT,
      drive_id NVARCHAR(255),
      path NVARCHAR(1000),
      campaign_name NVARCHAR(255),
      client_name NVARCHAR(255),
      file_type NVARCHAR(50),
      processed_at DATETIME2 DEFAULT GETDATE()
    )
  `);
  
  // Create campaign_analysis table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaign_analysis' AND xtype='U')
    CREATE TABLE campaign_analysis (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      creative_features NVARCHAR(MAX),
      business_outcomes NVARCHAR(MAX),
      confidence_score DECIMAL(3,2),
      analysis_timestamp DATETIME2 DEFAULT GETDATE()
    )
  `);
  
  console.log('   ✅ Schema initialized');
}

async function insertSampleData(pool) {
  console.log('📄 Inserting TBWA campaign sample data...');
  
  const sampleCampaigns = [
    {
      document_id: 'tbwa_doc_001',
      filename: 'Q4_Holiday_Campaign_Video.mp4',
      campaign_name: 'Q4 Holiday Campaign 2024',
      client_name: 'Major Retail Client',
      file_type: 'video',
      creative_features: {
        content: { has_logo: true, has_product_shot: true, has_call_to_action: true },
        design: { is_minimalist: false, uses_bold_typography: true, has_strong_contrast: true },
        messaging: { emotional_appeal: true, rational_benefits: false, urgency_indicators: true }
      },
      business_outcomes: {
        engagement: { predicted_ctr: 3.2, predicted_engagement_rate: 7.5 },
        conversion: { predicted_roi: 2.8, predicted_conversion_rate: 4.2 },
        brand: { predicted_brand_recall: 65, predicted_brand_sentiment: 0.75 }
      },
      confidence: 0.87
    },
    {
      document_id: 'tbwa_doc_002',
      filename: 'Brand_Awareness_Static_Ad.jpg',
      campaign_name: 'Brand Awareness Campaign',
      client_name: 'Tech Startup',
      file_type: 'image',
      creative_features: {
        content: { has_logo: true, has_product_shot: false, has_call_to_action: false },
        design: { is_minimalist: true, uses_bold_typography: false, has_strong_contrast: false },
        messaging: { emotional_appeal: false, rational_benefits: true, urgency_indicators: false }
      },
      business_outcomes: {
        engagement: { predicted_ctr: 1.8, predicted_engagement_rate: 4.2 },
        conversion: { predicted_roi: 1.9, predicted_conversion_rate: 2.1 },
        brand: { predicted_brand_recall: 45, predicted_brand_sentiment: 0.65 }
      },
      confidence: 0.72
    },
    {
      document_id: 'tbwa_doc_003',
      filename: 'Product_Launch_Presentation.pptx',
      campaign_name: 'New Product Launch',
      client_name: 'Consumer Goods Company',
      file_type: 'presentation',
      creative_features: {
        content: { has_logo: true, has_product_shot: true, has_call_to_action: true },
        design: { is_minimalist: false, uses_bold_typography: true, has_strong_contrast: true },
        messaging: { emotional_appeal: true, rational_benefits: true, urgency_indicators: false }
      },
      business_outcomes: {
        engagement: { predicted_ctr: 4.1, predicted_engagement_rate: 8.9 },
        conversion: { predicted_roi: 3.5, predicted_conversion_rate: 5.8 },
        brand: { predicted_brand_recall: 78, predicted_brand_sentiment: 0.82 }
      },
      confidence: 0.93
    }
  ];
  
  for (const campaign of sampleCampaigns) {
    // Insert document
    await pool.request()
      .input('document_id', sql.NVarChar(255), campaign.document_id)
      .input('filename', sql.NVarChar(500), campaign.filename)
      .input('campaign_name', sql.NVarChar(255), campaign.campaign_name)
      .input('client_name', sql.NVarChar(255), campaign.client_name)
      .input('file_type', sql.NVarChar(50), campaign.file_type)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM campaign_documents WHERE document_id = @document_id)
        INSERT INTO campaign_documents (document_id, filename, campaign_name, client_name, file_type)
        VALUES (@document_id, @filename, @campaign_name, @client_name, @file_type)
      `);
    
    // Insert analysis
    await pool.request()
      .input('document_id', sql.NVarChar(255), campaign.document_id)
      .input('creative_features', sql.NVarChar(sql.MAX), JSON.stringify(campaign.creative_features))
      .input('business_outcomes', sql.NVarChar(sql.MAX), JSON.stringify(campaign.business_outcomes))
      .input('confidence_score', sql.Decimal(3,2), campaign.confidence)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM campaign_analysis WHERE document_id = @document_id)
        INSERT INTO campaign_analysis (document_id, creative_features, business_outcomes, confidence_score)
        VALUES (@document_id, @creative_features, @business_outcomes, @confidence_score)
      `);
    
    console.log(`   ✅ Inserted: ${campaign.filename}`);
  }
}

async function generateSummary(pool) {
  console.log('📊 Generating summary...');
  
  const result = await pool.request().query(`
    SELECT 
      COUNT(*) as total_documents,
      COUNT(DISTINCT campaign_name) as total_campaigns,
      COUNT(DISTINCT client_name) as total_clients,
      AVG(confidence_score) as avg_confidence
    FROM campaign_documents cd
    LEFT JOIN campaign_analysis ca ON cd.document_id = ca.document_id
  `);
  
  const stats = result.recordset[0];
  
  console.log('');
  console.log('📈 TBWA Campaign Intelligence Summary');
  console.log('===================================');
  console.log(`📄 Total Documents: ${stats.total_documents}`);
  console.log(`🎯 Total Campaigns: ${stats.total_campaigns}`);
  console.log(`🏢 Total Clients: ${stats.total_clients}`);
  console.log(`🎯 Avg Confidence: ${Math.round(stats.avg_confidence * 100)}%`);
}

// Run the script
populateAzureSQL();