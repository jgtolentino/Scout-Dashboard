const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test the connection by fetching a single brand
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('Connection test failed:', error.message);
      return;
    }

    console.log('Connection successful!');
    console.log('Sample data:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testConnection(); 