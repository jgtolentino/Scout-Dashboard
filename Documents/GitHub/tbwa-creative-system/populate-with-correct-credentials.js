// Populate Azure SQL with correct TBWA credentials
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function populateWithCorrectCredentials() {
  console.log('🚀 TBWA Campaign Intelligence → Azure SQL (Correct Credentials)');
  console.log('==============================================================');
  
  let pool;
  
  try {
    // Use the correct credentials from connection string
    const config = {
      server: 'sqltbwaprojectscoutserver.database.windows.net',
      database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
      user: 'TBWA',
      password: 'R@nd0mPA$$2025!',
      options: {
        encrypt: true,
        trustServerCertificate: false
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    };
    
    console.log('📡 Connecting with correct TBWA credentials...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
    pool = await sql.connect(config);
    console.log('✅ Connection successful!');
    
    // Test basic query
    const result = await pool.request().query(`
      SELECT 
        DB_NAME() as current_database,
        USER_NAME() as current_user_name,
        GETDATE() as server_time
    `);
    
    console.log('📋 Connection details:');
    console.log(`   Database: ${result.recordset[0].current_database}`);
    console.log(`   User: ${result.recordset[0].current_user_name}`);
    console.log(`   Time: ${result.recordset[0].server_time}`);
    
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
    
    // Populate TBWA campaign intelligence data
    await populateTBWACampaignIntelligence(pool);
    
    console.log('');
    console.log('🎉 TBWA Campaign Intelligence Population Complete!');
    console.log('===============================================');
    console.log('📊 Data Successfully Added:');
    console.log('   • Campaign documents and metadata');
    console.log('   • Echo-style creative feature analysis');
    console.log('   • Kalaw-style business outcome predictions');
    console.log('   • Dashboard-ready metrics and insights');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Start the dashboard: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Check TBWA Campaign Intelligence data');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Login failed')) {
      console.log('');
      console.log('💡 Authentication issue with TBWA user');
      console.log('   Please verify the credentials are correct');
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

async function populateTBWACampaignIntelligence(pool) {
  const tableNames = await getExistingTables(pool);
  
  // Create comprehensive TBWA campaign intelligence tables
  await createTBWAIntelligenceTables(pool);
  
  // Populate with campaign data
  await populateCampaignDocuments(pool);
  await populateCreativeAnalysis(pool);
  await populateBusinessPredictions(pool);
  
  // Skip SalesInteractions due to schema constraints
  console.log('ℹ️  Skipping SalesInteractions (schema constraints)');
  
  // Add to transactions if available  
  if (tableNames.includes('transactions')) {
    await populateTransactions(pool);
  }
}

async function getExistingTables(pool) {
  const tables = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  return tables.recordset.map(t => t.TABLE_NAME);
}

async function createTBWAIntelligenceTables(pool) {
  console.log('🧠 Creating TBWA Intelligence schema...');
  
  // Campaign documents table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbwa_campaign_documents' AND xtype='U')
    CREATE TABLE tbwa_campaign_documents (
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
  
  // Creative analysis table (Echo simulation)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbwa_creative_analysis' AND xtype='U')
    CREATE TABLE tbwa_creative_analysis (
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
  
  // Business outcomes table (Kalaw simulation)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbwa_business_predictions' AND xtype='U')
    CREATE TABLE tbwa_business_predictions (
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
  
  // Campaign summary table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbwa_campaigns' AND xtype='U')
    CREATE TABLE tbwa_campaigns (
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
  
  console.log('   ✅ TBWA Intelligence tables created');
}

async function populateCampaignDocuments(pool) {
  console.log('📄 Populating campaign documents...');
  
  const documents = [
    {
      id: 'tbwa_doc_q4_holiday_001',
      filename: 'Q4_Holiday_Campaign_Video.mp4',
      type: 'video',
      campaign: 'Q4 Holiday Campaign 2024',
      client: 'Major Retail Client',
      size: 45000000
    },
    {
      id: 'tbwa_doc_brand_awareness_001',
      filename: 'Brand_Awareness_Static_Ad.jpg',
      type: 'image',
      campaign: 'Brand Awareness Spring Campaign',
      client: 'Tech Startup',
      size: 2500000
    },
    {
      id: 'tbwa_doc_product_launch_001',
      filename: 'Product_Launch_Presentation.pptx',
      type: 'presentation',
      campaign: 'Product Launch Summer Campaign',
      client: 'Consumer Goods Company',
      size: 15000000
    }
  ];
  
  for (const doc of documents) {
    await pool.request()
      .input('document_id', sql.NVarChar, doc.id)
      .input('filename', sql.NVarChar, doc.filename)
      .input('file_type', sql.NVarChar, doc.type)
      .input('campaign_name', sql.NVarChar, doc.campaign)
      .input('client_name', sql.NVarChar, doc.client)
      .input('file_size', sql.BigInt, doc.size)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tbwa_campaign_documents WHERE document_id = @document_id)
        INSERT INTO tbwa_campaign_documents (document_id, filename, file_type, campaign_name, client_name, file_size, processed_date)
        VALUES (@document_id, @filename, @file_type, @campaign_name, @client_name, @file_size, GETDATE())
      `);
    
    console.log(`   ✅ Added: ${doc.filename}`);
  }
}

async function populateCreativeAnalysis(pool) {
  console.log('🎨 Populating creative analysis (Echo simulation)...');
  
  const analyses = [
    {
      doc_id: 'tbwa_doc_q4_holiday_001',
      has_logo: true,
      has_product_shot: true,
      has_call_to_action: true,
      is_minimalist: false,
      uses_bold_typography: true,
      emotional_appeal: true,
      color_vibrancy: 0.85,
      text_density: 0.65,
      composition_score: 0.92
    },
    {
      doc_id: 'tbwa_doc_brand_awareness_001',
      has_logo: true,
      has_product_shot: false,
      has_call_to_action: false,
      is_minimalist: true,
      uses_bold_typography: false,
      emotional_appeal: false,
      color_vibrancy: 0.45,
      text_density: 0.30,
      composition_score: 0.78
    },
    {
      doc_id: 'tbwa_doc_product_launch_001',
      has_logo: true,
      has_product_shot: true,
      has_call_to_action: true,
      is_minimalist: false,
      uses_bold_typography: true,
      emotional_appeal: true,
      color_vibrancy: 0.75,
      text_density: 0.85,
      composition_score: 0.95
    }
  ];
  
  for (const analysis of analyses) {
    await pool.request()
      .input('document_id', sql.NVarChar, analysis.doc_id)
      .input('has_logo', sql.Bit, analysis.has_logo)
      .input('has_product_shot', sql.Bit, analysis.has_product_shot)
      .input('has_call_to_action', sql.Bit, analysis.has_call_to_action)
      .input('is_minimalist', sql.Bit, analysis.is_minimalist)
      .input('uses_bold_typography', sql.Bit, analysis.uses_bold_typography)
      .input('emotional_appeal', sql.Bit, analysis.emotional_appeal)
      .input('color_vibrancy', sql.Decimal(3,2), analysis.color_vibrancy)
      .input('text_density', sql.Decimal(3,2), analysis.text_density)
      .input('composition_score', sql.Decimal(3,2), analysis.composition_score)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tbwa_creative_analysis WHERE document_id = @document_id)
        INSERT INTO tbwa_creative_analysis (
          document_id, has_logo, has_product_shot, has_call_to_action, is_minimalist,
          uses_bold_typography, emotional_appeal, color_vibrancy, text_density, composition_score
        ) VALUES (
          @document_id, @has_logo, @has_product_shot, @has_call_to_action, @is_minimalist,
          @uses_bold_typography, @emotional_appeal, @color_vibrancy, @text_density, @composition_score
        )
      `);
    
    console.log(`   ✅ Analyzed: ${analysis.doc_id}`);
  }
}

async function populateBusinessPredictions(pool) {
  console.log('📈 Populating business predictions (Kalaw simulation)...');
  
  const predictions = [
    {
      doc_id: 'tbwa_doc_q4_holiday_001',
      predicted_ctr: 3.2,
      predicted_roi: 2.8,
      predicted_engagement_rate: 7.5,
      predicted_conversion_rate: 4.2,
      predicted_brand_recall: 65,
      predicted_revenue_impact: 85000,
      confidence_score: 0.87
    },
    {
      doc_id: 'tbwa_doc_brand_awareness_001',
      predicted_ctr: 1.8,
      predicted_roi: 1.9,
      predicted_engagement_rate: 4.2,
      predicted_conversion_rate: 2.1,
      predicted_brand_recall: 45,
      predicted_revenue_impact: 32000,
      confidence_score: 0.72
    },
    {
      doc_id: 'tbwa_doc_product_launch_001',
      predicted_ctr: 4.1,
      predicted_roi: 3.5,
      predicted_engagement_rate: 8.9,
      predicted_conversion_rate: 5.8,
      predicted_brand_recall: 78,
      predicted_revenue_impact: 125000,
      confidence_score: 0.93
    }
  ];
  
  for (const prediction of predictions) {
    await pool.request()
      .input('document_id', sql.NVarChar, prediction.doc_id)
      .input('predicted_ctr', sql.Decimal(4,2), prediction.predicted_ctr)
      .input('predicted_roi', sql.Decimal(4,2), prediction.predicted_roi)
      .input('predicted_engagement_rate', sql.Decimal(4,2), prediction.predicted_engagement_rate)
      .input('predicted_conversion_rate', sql.Decimal(4,2), prediction.predicted_conversion_rate)
      .input('predicted_brand_recall', sql.Decimal(4,2), prediction.predicted_brand_recall)
      .input('predicted_revenue_impact', sql.Money, prediction.predicted_revenue_impact)
      .input('confidence_score', sql.Decimal(3,2), prediction.confidence_score)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tbwa_business_predictions WHERE document_id = @document_id)
        INSERT INTO tbwa_business_predictions (
          document_id, predicted_ctr, predicted_roi, predicted_engagement_rate,
          predicted_conversion_rate, predicted_brand_recall, predicted_revenue_impact, confidence_score
        ) VALUES (
          @document_id, @predicted_ctr, @predicted_roi, @predicted_engagement_rate,
          @predicted_conversion_rate, @predicted_brand_recall, @predicted_revenue_impact, @confidence_score
        )
      `);
    
    console.log(`   ✅ Predicted: ${prediction.doc_id}`);
  }
  
  // Also populate campaign summary
  const campaigns = [
    { 
      name: 'Q4 Holiday Campaign 2024', 
      client: 'Major Retail Client', 
      type: 'Seasonal', 
      roi: 2.8, 
      ctr: 3.2, 
      confidence: 0.87,
      budget: 150000,
      start_date: '2024-10-01',
      end_date: '2024-12-31'
    },
    { 
      name: 'Brand Awareness Spring Campaign', 
      client: 'Tech Startup', 
      type: 'Awareness', 
      roi: 1.9, 
      ctr: 1.8, 
      confidence: 0.72,
      budget: 80000,
      start_date: '2024-03-01',
      end_date: '2024-05-31'
    },
    { 
      name: 'Product Launch Summer Campaign', 
      client: 'Consumer Goods Company', 
      type: 'Product Launch', 
      roi: 3.5, 
      ctr: 4.1, 
      confidence: 0.93,
      budget: 220000,
      start_date: '2024-06-01',
      end_date: '2024-08-31'
    }
  ];
  
  console.log('📊 Populating campaign summaries...');
  
  for (const campaign of campaigns) {
    await pool.request()
      .input('name', sql.NVarChar, campaign.name)
      .input('client', sql.NVarChar, campaign.client)
      .input('type', sql.NVarChar, campaign.type)
      .input('roi', sql.Decimal(4,2), campaign.roi)
      .input('ctr', sql.Decimal(4,2), campaign.ctr)
      .input('confidence', sql.Decimal(3,2), campaign.confidence)
      .input('budget', sql.Money, campaign.budget)
      .input('start_date', sql.Date, campaign.start_date)
      .input('end_date', sql.Date, campaign.end_date)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tbwa_campaigns WHERE campaign_name = @name)
        INSERT INTO tbwa_campaigns (campaign_name, client_name, campaign_type, predicted_roi, predicted_ctr, confidence_score, budget, start_date, end_date)
        VALUES (@name, @client, @type, @roi, @ctr, @confidence, @budget, @start_date, @end_date)
      `);
      
    console.log(`   ✅ Campaign: ${campaign.name}`);
  }
}

async function populateSalesInteractions(pool) {
  console.log('📊 Adding TBWA data to SalesInteractions...');
  
  const interactions = [
    {
      StoreID: 9001,
      DeviceID: 'CAMPAIGN_ANALYZER_001', 
      FacialID: 'Q4_HOLIDAY_2024',
      Age: 35,
      Gender: 'Campaign',
      EmotionalState: 'High_Confidence'
    },
    {
      StoreID: 9002,
      DeviceID: 'CAMPAIGN_ANALYZER_002',
      FacialID: 'BRAND_AWARENESS_SPRING', 
      Age: 28,
      Gender: 'Campaign',
      EmotionalState: 'Medium_Confidence'
    },
    {
      StoreID: 9003,
      DeviceID: 'CAMPAIGN_ANALYZER_003',
      FacialID: 'PRODUCT_LAUNCH_SUMMER',
      Age: 42,
      Gender: 'Campaign', 
      EmotionalState: 'High_Confidence'
    }
  ];
  
  for (const interaction of interactions) {
    await pool.request()
      .input('StoreID', sql.Int, interaction.StoreID)
      .input('DeviceID', sql.NVarChar, interaction.DeviceID)
      .input('FacialID', sql.NVarChar, interaction.FacialID)
      .input('Age', sql.Int, interaction.Age)
      .input('Gender', sql.NVarChar, interaction.Gender)
      .input('EmotionalState', sql.NVarChar, interaction.EmotionalState)
      .input('InteractionDate', sql.DateTime, new Date())
      .query(`
        INSERT INTO SalesInteractions (StoreID, DeviceID, FacialID, Age, Gender, EmotionalState, TransactionDate)
        VALUES (@StoreID, @DeviceID, @FacialID, @Age, @Gender, @EmotionalState, @InteractionDate)
      `);
      
    console.log(`   ✅ Added: ${interaction.FacialID}`);
  }
}

async function populateTransactions(pool) {
  console.log('💰 Adding TBWA campaign budgets to transactions...');
  
  const campaigns = [
    { name: 'Q4 Holiday Campaign 2024', budget: 150000 },
    { name: 'Brand Awareness Spring Campaign', budget: 80000 },
    { name: 'Product Launch Summer Campaign', budget: 220000 }
  ];
  
  for (const campaign of campaigns) {
    await pool.request()
      .input('amount', sql.Decimal(10,2), campaign.budget)
      .input('description', sql.NVarChar, `TBWA Campaign Budget: ${campaign.name}`)
      .input('date', sql.DateTime, new Date())
      .query(`
        INSERT INTO transactions (total_amount, description, created_at)
        VALUES (@amount, @description, @date)
      `);
      
    console.log(`   ✅ Added: ${campaign.name} ($${campaign.budget.toLocaleString()})`);
  }
}

// Run the population
populateWithCorrectCredentials()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Population failed:', error);
    process.exit(1);
  });