const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://cxzllzyxwpyptfretryc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAxMTI0NDQsImV4cCI6MjAzNTY4ODQ0NH0.EA0GOBXy5FfIkEgmQBd3lPbh3S4JGmqBL5IlJQV8Fks'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testGeographicInsights() {
  console.log('🧪 Testing Geographic Insights Function...\n')

  try {
    // Test 1: Call without any filters
    console.log('📍 Test 1: Calling get_geographic_insights without filters')
    const { data: result1, error: error1 } = await supabase.rpc('get_geographic_insights', {
      p_region_id: null,
      p_date_from: null,
      p_date_to: null
    })

    if (error1) {
      console.error('❌ Error:', error1)
    } else {
      console.log('✅ Success! Returned', result1?.length || 0, 'records')
      if (result1 && result1.length > 0) {
        console.log('📊 Sample data structure:')
        console.log(JSON.stringify(result1[0], null, 2))
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Call with date range filter
    console.log('📍 Test 2: Calling get_geographic_insights with date range')
    const { data: result2, error: error2 } = await supabase.rpc('get_geographic_insights', {
      p_region_id: null,
      p_date_from: '2024-01-01',
      p_date_to: '2024-12-31'
    })

    if (error2) {
      console.error('❌ Error:', error2)
    } else {
      console.log('✅ Success! Returned', result2?.length || 0, 'records')
      if (result2 && result2.length > 0) {
        console.log('📊 Sample data with date filter:')
        console.log(JSON.stringify(result2.slice(0, 2), null, 2))
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Call with specific region
    console.log('📍 Test 3: Calling get_geographic_insights with region filter')
    const { data: result3, error: error3 } = await supabase.rpc('get_geographic_insights', {
      p_region_id: 'NCR',
      p_date_from: null,
      p_date_to: null
    })

    if (error3) {
      console.error('❌ Error:', error3)
    } else {
      console.log('✅ Success! Returned', result3?.length || 0, 'records')
      if (result3 && result3.length > 0) {
        console.log('📊 Sample data with region filter:')
        console.log(JSON.stringify(result3.slice(0, 2), null, 2))
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Data structure validation
    console.log('🔍 Data Structure Validation:')
    const sampleData = result1?.[0] || result2?.[0] || result3?.[0]
    
    if (sampleData) {
      const requiredFields = [
        'location_id', 'location_name', 'region_name', 'latitude', 
        'longitude', 'total_revenue', 'transaction_count', 
        'unique_customers', 'average_basket_size', 'top_category'
      ]
      
      const missingFields = requiredFields.filter(field => !(field in sampleData))
      const extraFields = Object.keys(sampleData).filter(field => !requiredFields.includes(field))
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields are present')
      } else {
        console.log('❌ Missing fields:', missingFields)
      }
      
      if (extraFields.length > 0) {
        console.log('ℹ️  Extra fields found:', extraFields)
      }
      
      // Type validation
      const typeChecks = {
        location_id: 'string',
        location_name: 'string', 
        region_name: 'string',
        latitude: 'number',
        longitude: 'number',
        total_revenue: 'number',
        transaction_count: 'number',
        unique_customers: 'number',
        average_basket_size: 'number',
        top_category: 'string'
      }
      
      console.log('\n🔍 Type Validation:')
      for (const [field, expectedType] of Object.entries(typeChecks)) {
        const actualType = typeof sampleData[field]
        const isCorrect = actualType === expectedType
        console.log(`${isCorrect ? '✅' : '❌'} ${field}: expected ${expectedType}, got ${actualType}`)
      }
    } else {
      console.log('❌ No data available for validation')
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run the test
testGeographicInsights().then(() => {
  console.log('\n✨ Test completed!')
}).catch(error => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})