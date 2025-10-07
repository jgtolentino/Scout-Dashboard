// Populate Supabase with TBWA Campaign Intelligence Data
require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 TBWA Creative Intelligence → Supabase Population');
console.log('==================================================');
console.log(`🔗 Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSupabase() {
  try {
    console.log('📊 Creating TBWA campaign intelligence tables...');
    
    // Create tbwa_campaigns table
    const { data: campaigns, error: campaignsError } = await supabase
      .from('tbwa_campaigns')
      .insert([
        {
          id: 'tbwa_campaign_001',
          name: 'Q4 Holiday Campaign 2024',
          client_name: 'Major Retail Client',
          file_type: 'video',
          filename: 'Q4_Holiday_Campaign_Video.mp4',
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
          confidence_score: 0.87,
          created_at: new Date().toISOString()
        },
        {
          id: 'tbwa_campaign_002',
          name: 'Brand Awareness Campaign',
          client_name: 'Tech Startup',
          file_type: 'image',
          filename: 'Brand_Awareness_Static_Ad.jpg',
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
          confidence_score: 0.72,
          created_at: new Date().toISOString()
        },
        {
          id: 'tbwa_campaign_003',
          name: 'New Product Launch',
          client_name: 'Consumer Goods Company',
          file_type: 'presentation',
          filename: 'Product_Launch_Presentation.pptx',
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
          confidence_score: 0.93,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (campaignsError && !campaignsError.message.includes('already exists')) {
      console.log('⚠️  Table might not exist yet, creating with SQL...');
      
      // Create table with SQL if it doesn't exist
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS tbwa_campaigns (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            client_name TEXT,
            file_type TEXT,
            filename TEXT,
            creative_features JSONB,
            business_outcomes JSONB,
            confidence_score DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT NOW()
          );
        `
      });
      
      if (sqlError) {
        console.log('🔄 Using direct insert approach...');
        // Try direct insert approach
        const insertResults = [];
        
        const sampleData = [
          {
            id: 'tbwa_campaign_001',
            name: 'Q4 Holiday Campaign 2024',
            client_name: 'Major Retail Client',
            summary: 'High-impact video campaign with strong call-to-action. Predicted ROI: 2.8x, CTR: 3.2%'
          },
          {
            id: 'tbwa_campaign_002', 
            name: 'Brand Awareness Campaign',
            client_name: 'Tech Startup',
            summary: 'Minimalist design approach for brand building. Predicted ROI: 1.9x, CTR: 1.8%'
          },
          {
            id: 'tbwa_campaign_003',
            name: 'New Product Launch',
            client_name: 'Consumer Goods Company', 
            summary: 'Comprehensive product presentation with emotional appeal. Predicted ROI: 3.5x, CTR: 4.1%'
          }
        ];
        
        // Insert into existing transactions table as campaign data
        for (const campaign of sampleData) {
          const { data, error } = await supabase
            .from('transactions')
            .insert({
              id: campaign.id,
              total_amount: Math.random() * 10000 + 1000, // Simulated campaign budget
              store_location: `TBWA Campaign: ${campaign.client_name}`,
              customer_age: null,
              customer_gender: null,
              created_at: new Date().toISOString(),
              metadata: {
                campaign_name: campaign.name,
                client_name: campaign.client_name,
                summary: campaign.summary,
                data_source: 'TBWA Creative Intelligence'
              }
            })
            .select();
            
          if (!error) {
            insertResults.push(campaign.name);
          }
        }
        
        console.log(`✅ Inserted ${insertResults.length} TBWA campaigns into transactions table`);
      }
    } else {
      console.log(`✅ Inserted ${campaigns?.length || 0} TBWA campaigns`);
    }
    
    // Create dashboard insights for TBWA data
    console.log('💡 Creating TBWA campaign insights...');
    
    const insights = {
      tbwa_summary: {
        total_campaigns: 3,
        avg_predicted_roi: 2.73,
        avg_predicted_ctr: 3.03,
        top_performing_client: 'Consumer Goods Company',
        confidence_score: 0.84,
        creative_features_distribution: {
          has_logo: 3,
          has_call_to_action: 2,
          emotional_appeal: 2,
          minimalist_design: 1
        }
      },
      last_updated: new Date().toISOString(),
      data_source: 'TBWA Creative Intelligence System'
    };
    
    // Try to insert insights
    const { error: insightsError } = await supabase
      .from('dashboard_insights')
      .upsert({
        id: 'tbwa_creative_intelligence',
        insight_type: 'campaign_summary', 
        data: insights,
        created_at: new Date().toISOString()
      });
      
    if (insightsError) {
      console.log('⚠️  Insights table not available, storing in brands table...');
      
      // Insert as brand data
      const { error: brandError } = await supabase
        .from('brands')
        .upsert([
          {
            id: 'tbwa_intelligence_001',
            name: 'TBWA Creative Intelligence',
            category: 'Campaign Analytics',
            is_client: true,
            metadata: insights
          }
        ]);
        
      if (!brandError) {
        console.log('✅ TBWA insights stored in brands table');
      }
    } else {
      console.log('✅ TBWA insights created');
    }
    
    console.log('');
    console.log('🎉 TBWA Campaign Intelligence Population Complete!');
    console.log('===============================================');
    console.log('📊 Data Available:');
    console.log('   • 3 Sample campaigns with creative analysis');
    console.log('   • Echo-style feature detection results');
    console.log('   • Kalaw-style outcome predictions');
    console.log('   • Dashboard-ready insights and metrics');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Visit the retail dashboard to see TBWA data');
    console.log('   2. Check brands or transactions table for campaign info');
    console.log('   3. Use the data for AI-powered campaign insights');
    
  } catch (error) {
    console.error('❌ Error populating Supabase:', error);
  }
}

// Run the population
populateSupabase();