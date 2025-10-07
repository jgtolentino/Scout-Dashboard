// scripts/check-brand-data.js
// Usage: node scripts/check-brand-data.js
// Checks Supabase brand and product data for integrity.

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
config({ path: join(__dirname, '..', '.env') });

console.log('Environment check:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

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

async function runChecks() {
  try {
    // 1. Test connection with a simple query
    const { data: testData, error: testError } = await supabase
      .from('brands')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
      return;
    }
    console.log('Connection successful!');

    // 2. Count brands with error handling
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name', { count: 'exact' });
    
    if (brandsError) {
      console.error('Brands query failed:', brandsError);
      return;
    }
    console.log('Brand count:', brands?.length);

    // 3. Count products with brands
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, brand_id', { count: 'exact' })
      .not('brand_id', 'is', null);
    
    if (productsError) {
      console.error('Products query failed:', productsError);
      return;
    }
    console.log('Products with brands:', products?.length);

    // 4. Sample transaction with items
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        id,
        created_at,
        total_amount,
        transaction_items (
          id,
          quantity,
          unit_price,
          products (
            name,
            brand_id,
            brands (
              name
            )
          )
        )
      `)
      .limit(1);
    
    if (transactionsError) {
      console.error('Transactions query failed:', transactionsError);
      return;
    }
    console.log('Sample transaction:', JSON.stringify(transactions, null, 2));

  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

runChecks(); 