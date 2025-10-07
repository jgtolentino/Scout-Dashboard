// Simple IoT test without relying on deployed functions
const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';

async function testIoTEndpoints() {
  console.log('🧪 Testing IoT Expert endpoints...\n');
  
  // Test 1: Basic Supabase connectivity
  console.log('1. Testing basic Supabase connectivity...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD'
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: IoT ingest function availability  
  console.log('\n2. Testing IoT ingest function...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/iot-ingest`, {
      method: 'OPTIONS'
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 100)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n✅ IoT endpoint tests complete');
}

testIoTEndpoints();
