// scripts/check-brand-data.cjs
// Usage: node scripts/check-brand-data.cjs
// Checks Supabase brand and product data for integrity.

require('dotenv').config();
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function runChecks() {
  try {
    // 1. Count brands
    const { data: brands, error: brandsError } = await supabase.from('brands').select('id');
    if (brandsError) throw brandsError;
    console.log('Brand count:', brands?.length);

    // 2. Count products with brands
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .not('brand_id', 'is', null);
    if (productsError) throw productsError;
    console.log('Products with brands:', products?.length);

    // 3. Sample join: transactions → items → products → brands
    const { data: sample, error: sampleError } = await supabase
      .from('transactions')
      .select('id, store_location, transaction_items(product_id, products(name, brand_id, brands(name)))')
      .limit(10);
    if (sampleError) throw sampleError;
    console.log('Sample join results:', sample?.length, 'records');

    // 4. Aggregate top brands by revenue
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select('quantity, price, products!inner(name, brand_id, brands!inner(id, name))')
      .limit(10000);
    if (itemsError) throw itemsError;

    const brandRevenue = {};
    items?.forEach(item => {
      const brandName = item.products?.brands?.name || 'Unknown Brand';
      const revenue = (item.quantity || 0) * (item.price || 0);
      brandRevenue[brandName] = (brandRevenue[brandName] || 0) + revenue;
    });

    const topBrands = Object.entries(brandRevenue)
      .map(([brand, revenue]) => ({ brand, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    console.log('Top 10 brands by revenue:');
    topBrands.forEach(({ brand, revenue }, index) => {
      console.log(`${index + 1}. ${brand}: $${revenue.toFixed(2)}`);
    });
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

runChecks(); 