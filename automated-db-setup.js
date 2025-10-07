#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase credentials
const supabaseUrl = 'https://cxzllzyxwpyptfretryc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Automated Database Setup Starting...');
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('setup-database.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement
      });
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        // Continue with other statements
      } else {
        console.log(`✅ Success`);
      }
    }
    
    console.log('\n✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Alternative approach using direct SQL execution
async function setupDatabaseDirect() {
  console.log('🚀 Direct SQL Execution...');
  
  const sql = fs.readFileSync('setup-database.sql', 'utf8');
  
  // Use fetch to directly call Supabase SQL endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (response.ok) {
    console.log('✅ Database setup complete!');
  } else {
    console.error('❌ Failed:', await response.text());
  }
}

// Run setup
setupDatabase().catch(console.error);