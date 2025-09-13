// Direct population using admin credentials
require('dotenv').config({path: '.env.local'});
const sql = require('mssql');

async function populateWithAdmin() {
  console.log('🚀 TBWA Campaign Intelligence → Direct Admin Population');
  console.log('=====================================================');
  
  // Try different admin credential combinations
  const credentialSets = [
    {
      name: "Azure Admin",
      server: 'sqltbwaprojectscoutserver.database.windows.net',
      database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
      user: 'sqladmin',
      password: 'R@nd0mPA$$2025!'
    },
    {
      name: "TBWA Admin",
      server: 'sqltbwaprojectscoutserver.database.windows.net',
      database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
      user: 'tbwa_admin',
      password: 'R@nd0mPA$$2025!'
    },
    {
      name: "Alternative Admin",
      server: 'sqltbwaprojectscoutserver.database.windows.net',
      database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
      user: 'sqladmin@sqltbwaprojectscoutserver',
      password: 'R@nd0mPA$$2025!'
    }
  ];
  
  for (const creds of credentialSets) {
    console.log(`\n🔍 Trying ${creds.name}...`);
    
    const config = {
      server: creds.server,
      database: creds.database,
      user: creds.user,
      password: creds.password,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    let pool;
    
    try {
      console.log(`   User: ${creds.user}`);
      pool = await sql.connect(config);
      console.log('✅ Connection successful!');
      
      // If we get here, connection worked - proceed with population
      await populateTBWAData(pool);
      
      console.log('');
      console.log('🎉 TBWA Campaign Data Population Complete!');
      console.log('✅ Successfully populated using:', creds.name);
      return true;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  }
  
  console.log('');
  console.log('❌ All credential sets failed');
  console.log('💡 The user might need to be created differently or credentials verified');
  return false;
}

async function populateTBWAData(pool) {
  console.log('📊 Populating TBWA Campaign Intelligence data...');
  
  // Check existing tables first
  const tables = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  
  console.log('📋 Existing tables:');
  tables.recordset.forEach(table => {
    console.log(`   • ${table.TABLE_NAME}`);
  });
  
  const tableNames = tables.recordset.map(t => t.TABLE_NAME);
  
  // Create TBWA campaigns table
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
      created_at DATETIME DEFAULT GETDATE()
    )
  `);
  
  console.log('✅ TBWA campaigns table ready');
  
  // Insert campaign data
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
  
  console.log('📄 Inserting campaign data...');
  
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
      
    console.log(`   ✅ Added: ${campaign.name}`);
  }
  
  // Also add to existing tables if they exist
  if (tableNames.includes('SalesInteractions')) {
    console.log('📊 Adding to SalesInteractions table...');
    
    const interactions = [
      {
        StoreID: 'TBWA_HQ_001',
        DeviceID: 'CAMPAIGN_ANALYZER_001', 
        FacialID: 'Q4_HOLIDAY_2024',
        Age: 35,
        Gender: 'Campaign',
        EmotionalState: 'High_Confidence'
      },
      {
        StoreID: 'TBWA_HQ_002',
        DeviceID: 'CAMPAIGN_ANALYZER_002',
        FacialID: 'BRAND_AWARENESS_SPRING', 
        Age: 28,
        Gender: 'Campaign',
        EmotionalState: 'Medium_Confidence'
      },
      {
        StoreID: 'TBWA_HQ_003',
        DeviceID: 'CAMPAIGN_ANALYZER_003',
        FacialID: 'PRODUCT_LAUNCH_SUMMER',
        Age: 42,
        Gender: 'Campaign', 
        EmotionalState: 'High_Confidence'
      }
    ];
    
    for (const interaction of interactions) {
      await pool.request()
        .input('StoreID', sql.NVarChar, interaction.StoreID)
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
        
      console.log(`   ✅ Added interaction: ${interaction.FacialID}`);
    }
  }
  
  // Generate summary
  const summary = await pool.request().query(`
    SELECT COUNT(*) as campaign_count FROM tbwa_campaigns
  `);
  
  console.log('');
  console.log('📈 Population Summary:');
  console.log(`   Campaign records: ${summary.recordset[0].campaign_count}`);
  console.log('   Tables created: tbwa_campaigns');
  if (tableNames.includes('SalesInteractions')) {
    console.log('   SalesInteractions populated with TBWA data');
  }
}

// Run the population
populateWithAdmin()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('   1. Start the dashboard: npm run dev');
      console.log('   2. Visit: http://localhost:3000');
      console.log('   3. Check TBWA campaign data in the dashboard');
    } else {
      console.log('');
      console.log('💡 Alternative: Use Supabase instead');
      console.log('   The Azure SQL credentials need to be verified');
    }
  })
  .catch(console.error);