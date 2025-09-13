import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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

async function applySqlFile(filePath) {
  try {
    console.log(`📝 Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('🚀 Executing SQL...');
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Error executing SQL from ${filePath}:`, error);
      throw error;
    }
    
    console.log(`✅ Successfully applied SQL from ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to apply SQL from ${filePath}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Apply dashboard functions
    await applySqlFile(path.join(process.cwd(), 'scripts', 'dashboard-functions.sql'));
    
    // Apply category metrics function
    await applySqlFile(path.join(process.cwd(), 'scripts', 'category-metrics.sql'));
    
    console.log('✨ All SQL functions applied successfully!');
  } catch (error) {
    console.error('❌ Failed to apply SQL functions:', error);
    process.exit(1);
  }
}

main(); 