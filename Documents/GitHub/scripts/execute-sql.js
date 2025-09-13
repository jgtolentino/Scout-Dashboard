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

async function executeSql() {
  try {
    // First, create the exec_sql function
    const execSqlPath = join(__dirname, 'create-exec-sql-function.sql');
    const execSql = fs.readFileSync(execSqlPath, 'utf8');

    // Execute the SQL directly using the REST API
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: execSql
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error creating exec_sql function:', error);
      process.exit(1);
    }

    console.log('✅ exec_sql function created successfully!');

    // Now, read and execute the dashboard metrics SQL
    const metricsSqlPath = join(__dirname, 'dashboard-metrics.sql');
    const metricsSql = fs.readFileSync(metricsSqlPath, 'utf8');

    // Execute the dashboard metrics SQL
    const { error: execError } = await supabase.rpc('exec_sql', { sql: metricsSql });

    if (execError) {
      console.error('Error creating dashboard metrics function:', execError);
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

executeSql(); 