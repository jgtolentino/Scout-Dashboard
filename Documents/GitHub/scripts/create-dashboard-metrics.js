import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createDashboardMetricsFunction() {
  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'dashboard-metrics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL using the REST API
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error creating dashboard metrics function:', error);
      process.exit(1);
    }

    console.log('✅ Dashboard metrics function created successfully!');
    
    // Test the function
    const { data: testData, error: testError } = await supabase.rpc('get_dashboard_metrics');
    
    if (testError) {
      console.error('Error testing dashboard metrics function:', testError);
      process.exit(1);
    }

    console.log('✅ Function test successful! Sample data:', testData);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createDashboardMetricsFunction(); 