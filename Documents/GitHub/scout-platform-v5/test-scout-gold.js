// Test script to verify scout.gold views are working
// Run with: node test-scout-gold.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cxzllzyxwpyptfretryc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'
);

async function testScoutGoldViews() {
  console.log('🔍 Testing Scout.Gold Views Direct Access...\n');

  const tests = [
    {
      name: 'Executive Dashboard',
      view: 'scout.platinum_executive_dashboard_api',
      expectedFields: ['total_revenue_millions', 'total_transactions', 'tbwa_market_share_pct']
    },
    {
      name: 'Basket Analysis',
      view: 'scout.gold_basket_analysis_api',
      expectedFields: ['transaction_date', 'avg_basket_value', 'total_transactions']
    },
    {
      name: 'Customer Activity',
      view: 'scout.gold_customer_activity_api',
      expectedFields: ['transaction_date', 'total_transactions', 'total_revenue']
    },
    {
      name: 'Campaign Effects',
      view: 'scout.gold_campaign_effect_api',
      expectedFields: ['campaign_name', 'roi_percentage', 'campaign_status']
    }
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      
      const { data, error } = await supabase
        .from(test.view)
        .select('*')
        .limit(1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned');
      }

      const record = data[0];
      const missingFields = test.expectedFields.filter(field => !(field in record));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
      }

      console.log(`✅ ${test.name}: PASSED (${data.length} record(s))`);
      console.log(`   Sample data: ${JSON.stringify(record).substring(0, 100)}...`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
    }
    console.log('');
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All scout.gold views are working correctly!');
    console.log('✅ Frontend replacement is ready to deploy');
  } else {
    console.log('⚠️  Some views need attention before deployment');
  }
}

testScoutGoldViews().catch(console.error);
