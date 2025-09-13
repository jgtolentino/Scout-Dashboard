// Populate Azure SQL with TBWA Campaign Intelligence Data using tbwa_admin user
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function populateTBWACampaigns() {
  console.log('🚀 TBWA Creative Intelligence → Azure SQL Population');
  console.log('==================================================');
  
  let pool;
  
  try {
    // Connect with tbwa_admin user
    const config = {
      server: process.env.CES_AZURE_SQL_SERVER || 'sqltbwaprojectscoutserver.database.windows.net',
      database: process.env.CES_AZURE_SQL_DATABASE || 'SQL-TBWA-ProjectScout-Reporting-Prod',
      user: 'tbwa_admin',
      password: 'R@nd0mPA$$2025!',
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    console.log('📡 Connecting with tbwa_admin user...');
    pool = await sql.connect(config);
    console.log('✅ Connected successfully');
    
    // Check existing tables
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('📋 Existing tables found:');
    tables.recordset.forEach(table => {
      console.log(`   • ${table.TABLE_NAME}`);
    });
    
    // Determine where to add TBWA data
    const tableNames = tables.recordset.map(t => t.TABLE_NAME);
    
    if (tableNames.includes('SalesInteractions')) {
      await populateSalesInteractions(pool);
    } else if (tableNames.includes('transactions')) {
      await populateTransactions(pool);
    } else {
      await createAndPopulateTBWATable(pool);
    }
    
    // Create comprehensive TBWA campaign intelligence tables
    await createTBWAIntelligenceTables(pool);
    await populateCampaignIntelligence(pool);
    
    console.log('');
    console.log('🎉 TBWA Campaign Intelligence Population Complete!');
    console.log('===============================================');
    console.log('📊 Data Added:');
    console.log('   • Campaign documents and metadata');
    console.log('   • Echo-style creative feature analysis');
    console.log('   • Kalaw-style business outcome predictions');
    console.log('   • Dashboard-ready metrics and insights');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Start the dashboard: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Check the Campaign Intelligence section');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Login failed')) {
      console.log('');
      console.log('💡 tbwa_admin user not found. Please:');
      console.log('   1. Run the SQL commands from create-user-commands.sql');
      console.log('   2. Then run this script again');
    }
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function populateSalesInteractions(pool) {
  console.log('📊 Adding TBWA campaign data to SalesInteractions table...');
  
  const campaigns = [
    {
      StoreID: 'TBWA_HQ_001',
      DeviceID: 'CAMPAIGN_ANALYZER_001', 
      FacialID: 'Q4_HOLIDAY_2024',
      Age: 35,
      Gender: 'Campaign',
      EmotionalState: 'High_Confidence',
      InteractionDate: new Date()
    },
    {
      StoreID: 'TBWA_HQ_002',
      DeviceID: 'CAMPAIGN_ANALYZER_002',
      FacialID: 'BRAND_AWARENESS_SPRING', 
      Age: 28,
      Gender: 'Campaign',
      EmotionalState: 'Medium_Confidence',
      InteractionDate: new Date()
    },
    {
      StoreID: 'TBWA_HQ_003',
      DeviceID: 'CAMPAIGN_ANALYZER_003',
      FacialID: 'PRODUCT_LAUNCH_SUMMER',
      Age: 42,
      Gender: 'Campaign', 
      EmotionalState: 'High_Confidence',
      InteractionDate: new Date()
    }
  ];
  
  for (const campaign of campaigns) {
    await pool.request()
      .input('StoreID', sql.NVarChar, campaign.StoreID)
      .input('DeviceID', sql.NVarChar, campaign.DeviceID)
      .input('FacialID', sql.NVarChar, campaign.FacialID)
      .input('Age', sql.Int, campaign.Age)
      .input('Gender', sql.NVarChar, campaign.Gender)
      .input('EmotionalState', sql.NVarChar, campaign.EmotionalState)
      .input('InteractionDate', sql.DateTime, campaign.InteractionDate)
      .query(`
        INSERT INTO SalesInteractions (StoreID, DeviceID, FacialID, Age, Gender, EmotionalState, TransactionDate)
        VALUES (@StoreID, @DeviceID, @FacialID, @Age, @Gender, @EmotionalState, @InteractionDate)
      `);
      
    console.log(`   ✅ Added campaign: ${campaign.FacialID}`);
  }
}

async function populateTransactions(pool) {
  console.log('📊 Adding TBWA campaign budgets to transactions table...');
  
  const campaigns = [
    { name: 'Q4 Holiday Campaign 2024', budget: 150000, roi: 2.8, ctr: 3.2 },
    { name: 'Brand Awareness Spring Campaign', budget: 80000, roi: 1.9, ctr: 1.8 },
    { name: 'Product Launch Summer Campaign', budget: 220000, roi: 3.5, ctr: 4.1 }
  ];
  
  for (const campaign of campaigns) {
    await pool.request()
      .input('amount', sql.Decimal(10,2), campaign.budget)
      .input('description', sql.NVarChar, `TBWA Campaign Budget: ${campaign.name} (ROI: ${campaign.roi}x, CTR: ${campaign.ctr}%)`)
      .input('date', sql.DateTime, new Date())
      .query(`
        INSERT INTO transactions (total_amount, description, created_at)
        VALUES (@amount, @description, @date)
      `);
      
    console.log(`   ✅ Added: ${campaign.name} ($${campaign.budget.toLocaleString()})`);
  }
}

async function createAndPopulateTBWATable(pool) {
  console.log('📋 Creating TBWA campaigns table...');
  
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
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE()
    )
  `);
  
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
        INSERT INTO tbwa_campaigns (campaign_name, client_name, campaign_type, predicted_roi, predicted_ctr, confidence_score, budget, start_date, end_date)
        VALUES (@name, @client, @type, @roi, @ctr, @confidence, @budget, @start_date, @end_date)
      `);
      
    console.log(`   ✅ Added: ${campaign.name} (${campaign.type})`);
  }
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
      status NVARCHAR(50) DEFAULT 'Pending'
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
  
  console.log('   ✅ TBWA Intelligence tables created');
}

async function populateCampaignIntelligence(pool) {
  console.log('🎯 Populating TBWA Campaign Intelligence data...');
  
  const documents = [
    {
      id: 'doc_q4_holiday_001',
      filename: 'Q4_Holiday_Campaign_Video.mp4',
      type: 'video',
      campaign: 'Q4 Holiday Campaign 2024',
      client: 'Major Retail Client',
      size: 45000000
    },
    {
      id: 'doc_brand_awareness_001',
      filename: 'Brand_Awareness_Static_Ad.jpg',
      type: 'image',
      campaign: 'Brand Awareness Spring Campaign',
      client: 'Tech Startup',
      size: 2500000
    },
    {
      id: 'doc_product_launch_001',
      filename: 'Product_Launch_Presentation.pptx',
      type: 'presentation',
      campaign: 'Product Launch Summer Campaign',
      client: 'Consumer Goods Company',
      size: 15000000
    }
  ];
  
  for (const doc of documents) {
    // Insert document
    await pool.request()
      .input('document_id', sql.NVarChar, doc.id)
      .input('filename', sql.NVarChar, doc.filename)
      .input('file_type', sql.NVarChar, doc.type)
      .input('campaign_name', sql.NVarChar, doc.campaign)
      .input('client_name', sql.NVarChar, doc.client)
      .input('file_size', sql.BigInt, doc.size)
      .input('status', sql.NVarChar, 'Processed')
      .query(`
        INSERT INTO tbwa_campaign_documents (document_id, filename, file_type, campaign_name, client_name, file_size, processed_date, status)
        VALUES (@document_id, @filename, @file_type, @campaign_name, @client_name, @file_size, GETDATE(), @status)
      `);
    
    // Insert creative analysis (Echo simulation)
    await pool.request()
      .input('document_id', sql.NVarChar, doc.id)
      .input('has_logo', sql.Bit, Math.random() > 0.3)
      .input('has_product_shot', sql.Bit, Math.random() > 0.4)
      .input('has_call_to_action', sql.Bit, Math.random() > 0.6)
      .input('is_minimalist', sql.Bit, Math.random() > 0.5)
      .input('uses_bold_typography', sql.Bit, Math.random() > 0.4)
      .input('emotional_appeal', sql.Bit, Math.random() > 0.3)
      .input('color_vibrancy', sql.Decimal(3,2), Math.random())
      .input('text_density', sql.Decimal(3,2), Math.random())
      .input('composition_score', sql.Decimal(3,2), Math.random() * 0.4 + 0.6)
      .query(`
        INSERT INTO tbwa_creative_analysis (
          document_id, has_logo, has_product_shot, has_call_to_action, is_minimalist, 
          uses_bold_typography, emotional_appeal, color_vibrancy, text_density, composition_score
        ) VALUES (
          @document_id, @has_logo, @has_product_shot, @has_call_to_action, @is_minimalist,
          @uses_bold_typography, @emotional_appeal, @color_vibrancy, @text_density, @composition_score
        )
      `);
    
    // Insert business predictions (Kalaw simulation)
    const baseROI = 1.2 + (Math.random() * 2.8);
    const baseCTR = 0.5 + (Math.random() * 3.5);
    
    await pool.request()
      .input('document_id', sql.NVarChar, doc.id)
      .input('predicted_ctr', sql.Decimal(4,2), Math.round(baseCTR * 100) / 100)
      .input('predicted_roi', sql.Decimal(4,2), Math.round(baseROI * 100) / 100)
      .input('predicted_engagement_rate', sql.Decimal(4,2), Math.random() * 8 + 2)
      .input('predicted_conversion_rate', sql.Decimal(4,2), Math.random() * 5 + 1)
      .input('predicted_brand_recall', sql.Decimal(4,2), Math.random() * 30 + 40)
      .input('predicted_revenue_impact', sql.Money, Math.random() * 100000 + 10000)
      .input('confidence_score', sql.Decimal(3,2), Math.random() * 0.3 + 0.7)
      .query(`
        INSERT INTO tbwa_business_predictions (
          document_id, predicted_ctr, predicted_roi, predicted_engagement_rate, 
          predicted_conversion_rate, predicted_brand_recall, predicted_revenue_impact, confidence_score
        ) VALUES (
          @document_id, @predicted_ctr, @predicted_roi, @predicted_engagement_rate,
          @predicted_conversion_rate, @predicted_brand_recall, @predicted_revenue_impact, @confidence_score
        )
      `);
    
    console.log(`   ✅ Processed: ${doc.filename}`);
  }
}

// Run the population
populateTBWACampaigns();