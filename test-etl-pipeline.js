#!/usr/bin/env node

const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

// Color coding for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testFunction(functionName, payload = {}) {
  console.log(`\n${colors.blue}Testing ${functionName}...${colors.reset}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✅ ${functionName}: Success${colors.reset}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log(`${colors.red}❌ ${functionName}: Failed (${response.status})${colors.reset}`);
      console.log('Error:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${functionName}: Network Error${colors.reset}`);
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runETLPipelineTests() {
  console.log(`${colors.yellow}=== Scout ETL Pipeline Test Suite ===${colors.reset}`);
  console.log('Testing data flow: Bronze → Silver → Gold → Scout\n');

  const results = {
    passed: 0,
    failed: 0,
    functions: {}
  };

  // Test 1: Upload raw data to Bronze
  const bronzeTest = await testFunction('on_device_upload', {
    device_id: 'test-device-001',
    timestamp: new Date().toISOString(),
    data: {
      transaction_id: `test-tx-${Date.now()}`,
      store_id: 'test-store-001',
      customer_id: 'test-customer-001',
      amount: 150.50,
      items: [
        { sku: 'PROD-001', quantity: 2, price: 50.25 },
        { sku: 'PROD-002', quantity: 1, price: 50.00 }
      ]
    }
  });
  results.functions.bronze = bronzeTest;
  bronzeTest.success ? results.passed++ : results.failed++;

  // Test 2: Transform to Silver
  const silverTest = await testFunction('transform_to_silver', {
    batch_size: 10,
    source: 'bronze.raw_transactions'
  });
  results.functions.silver = silverTest;
  silverTest.success ? results.passed++ : results.failed++;

  // Test 3: Scout ETL (Silver → Gold → Scout)
  const scoutTest = await testFunction('scout-etl', {
    mode: 'incremental',
    batch_size: 100
  });
  results.functions.scout = scoutTest;
  scoutTest.success ? results.passed++ : results.failed++;

  // Test 4: Municipality GeoJSON (Supporting function)
  const geoTest = await testFunction('municipalities-geojson', {
    region: 'NCR',
    format: 'simplified'
  });
  results.functions.geo = geoTest;
  geoTest.success ? results.passed++ : results.failed++;

  // Test 5: AI Categorization
  const aiTest = await testFunction('ai-categorize', {
    text: 'Coca Cola 1.5L Bottle',
    type: 'product'
  });
  results.functions.ai = aiTest;
  aiTest.success ? results.passed++ : results.failed++;

  // Summary
  console.log(`\n${colors.yellow}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  return results;
}

// Test active make-server functions
async function testMakeServers() {
  console.log(`\n${colors.yellow}=== Testing Active Make-Server Functions ===${colors.reset}`);

  const makeServers = [
    { id: '012fcae1', desc: 'Expense Management' },
    { id: '5cb509f9', desc: 'Choropleth/Geo Data' },
    { id: 'e0a3193f', desc: 'Unknown payload' },
    { id: 'fa8c3d86', desc: 'Unknown payload' },
    { id: 'c6022503', desc: 'Unknown payload' },
    { id: 'd9a2b5fe', desc: 'Unknown payload' }
  ];

  for (const server of makeServers) {
    await testFunction(`make-server-${server.id}`, {
      action: 'list',
      limit: 5
    });
  }
}

// Main execution
async function main() {
  if (!process.env.SUPABASE_ANON_KEY) {
    console.log(`${colors.red}Error: Please set SUPABASE_ANON_KEY environment variable${colors.reset}`);
    console.log('Usage: SUPABASE_ANON_KEY=your_key_here node test-etl-pipeline.js');
    process.exit(1);
  }

  const etlResults = await runETLPipelineTests();
  await testMakeServers();

  // Return exit code based on test results
  process.exit(etlResults.failed > 0 ? 1 : 0);
}

main().catch(console.error);