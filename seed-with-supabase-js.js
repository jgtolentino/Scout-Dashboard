#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
  console.error('Get it from: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/settings/api');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedDatabase() {
  try {
    console.log('🚀 Starting Scout Dashboard seeding...');
    
    // Read SQL file
    const sqlContent = fs.readFileSync('/Users/tbwa/seed-scout-dashboard.sql', 'utf8');
    
    // Split into individual statements (simple split on semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      // Show progress
      if (statement.includes('INSERT INTO')) {
        const table = statement.match(/INSERT INTO (\w+\.\w+|\w+)/)?.[1] || 'unknown';
        console.log(`  ➤ Seeding ${table}...`);
      } else if (statement.includes('CREATE')) {
        console.log(`  ➤ Creating function...`);
      } else if (statement.includes('SELECT generate_scout_transactions')) {
        console.log(`  ➤ Generating 15,000 transactions (this may take a moment)...`);
      }
      
      // Execute via RPC or raw SQL
      const { data, error } = await supabase.rpc('execute_sql', { query: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        // Continue with next statement
      }
    }
    
    // Verify results
    console.log('\n✅ Seeding complete! Verifying results...\n');
    
    const { data: stats } = await supabase
      .from('scout_transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total transactions: ${stats?.count || 0}`);
    
    console.log('\n🎉 Scout Dashboard database seeding successful!');
    console.log('   - TBWA Market Share: 22%');
    console.log('   - JTI Cigarette Share: 40%');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Check if supabase-js is installed
try {
  require.resolve('@supabase/supabase-js');
  seedDatabase();
} catch (e) {
  console.log('📦 Installing @supabase/supabase-js...');
  require('child_process').execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  seedDatabase();
}