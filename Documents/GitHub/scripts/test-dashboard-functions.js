import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardMetrics() {
  console.log('\n📊 Testing get_dashboard_metrics...');
  const { data: metrics, error: metricsError } = await supabase
    .rpc('get_dashboard_metrics', {
      filter_categories: ['Beverages'],
      filter_brands: ['1', '2'],
      filter_locations: ['Store A'],
      date_from: '2024-01-01',
      date_to: '2024-12-31'
    });

  if (metricsError) {
    console.error('❌ Error testing get_dashboard_metrics:', metricsError);
    return false;
  }
  console.log('✅ get_dashboard_metrics test passed');
  console.log('Sample metrics:', JSON.stringify(metrics, null, 2));
  return true;
}

async function testBrandPerformance() {
  console.log('\n📈 Testing get_brand_performance...');
  const { data: performance, error: perfError } = await supabase
    .rpc('get_brand_performance', {
      filter_categories: ['Beverages'],
      filter_brands: [1, 2],
      filter_locations: ['Store A'],
      date_from: '2024-01-01',
      date_to: '2024-12-31',
      limit_count: 5
    });

  if (perfError) {
    console.error('❌ Error testing get_brand_performance:', perfError);
    return false;
  }
  console.log('✅ get_brand_performance test passed');
  console.log('Sample performance:', JSON.stringify(performance, null, 2));
  return true;
}

async function testTopBrand() {
  console.log('\n🏆 Testing get_top_brand...');
  const { data: topBrand, error: topBrandError } = await supabase
    .rpc('get_top_brand');

  if (topBrandError) {
    console.error('❌ Error testing get_top_brand:', topBrandError);
    return false;
  }
  console.log('✅ get_top_brand test passed');
  console.log('Top brand:', JSON.stringify(topBrand, null, 2));
  return true;
}

async function testFilterOptions() {
  console.log('\n🔍 Testing get_filter_options...');
  const { data: options, error: optionsError } = await supabase
    .rpc('get_filter_options');

  if (optionsError) {
    console.error('❌ Error testing get_filter_options:', optionsError);
    return false;
  }
  console.log('✅ get_filter_options test passed');
  console.log('Filter options:', JSON.stringify(options, null, 2));
  return true;
}

async function main() {
  console.log('🚀 Starting dashboard functions tests...\n');

  try {
    const results = await Promise.all([
      testDashboardMetrics(),
      testBrandPerformance(),
      testTopBrand(),
      testFilterOptions()
    ]);

    const allPassed = results.every(result => result === true);
    
    if (allPassed) {
      console.log('\n✨ All tests passed successfully!');
    } else {
      console.error('\n❌ Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main(); 