#!/usr/bin/env node

// Direct Supabase connection to fix Scout data issues
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY environment variable');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

async function analyzeData() {
    console.log('🔍 Analyzing Scout data...\n');
    
    // Get customer count
    const { count: customerCount } = await supabase
        .from('scout_customers')
        .select('*', { count: 'exact', head: true });
    
    // Get transaction count
    const { count: transactionCount } = await supabase
        .from('scout_transactions')
        .select('*', { count: 'exact', head: true });
    
    // Get customers with transactions
    const { data: customersWithTx } = await supabase
        .from('scout_transactions')
        .select('customer_id')
        .limit(1000);
    
    const uniqueCustomersWithTx = new Set(customersWithTx?.map(t => t.customer_id) || []).size;
    
    console.log(`Total Customers: ${customerCount}`);
    console.log(`Total Transactions: ${transactionCount}`);
    console.log(`Customers with Transactions: ${uniqueCustomersWithTx}`);
    console.log(`Orphaned Customers: ${customerCount - uniqueCustomersWithTx} (${((customerCount - uniqueCustomersWithTx) / customerCount * 100).toFixed(1)}%)\n`);
    
    return { customerCount, transactionCount, orphaned: customerCount - uniqueCustomersWithTx };
}

async function fixOrphanedCustomers() {
    console.log('🛠️  Fixing orphaned customers...\n');
    
    // Get orphaned customers
    const { data: orphanedCustomers } = await supabase
        .from('scout_customers')
        .select('customer_id, store_id, customer_type, created_at')
        .limit(100); // Start with first 100
    
    // Get all store IDs for random assignment
    const { data: stores } = await supabase
        .from('scout_stores')
        .select('store_id')
        .limit(20);
    
    if (!stores || stores.length === 0) {
        console.log('No stores found. Creating sample stores...');
        // Create some stores
        const newStores = [];
        for (let i = 1; i <= 10; i++) {
            newStores.push({
                store_id: `STO${10000 + i}`,
                store_name: `Store ${10000 + i}`,
                store_type: ['urban_high', 'urban_medium', 'residential', 'rural'][i % 4],
                location: {
                    region: 'NCR',
                    province: 'Metro Manila',
                    city: 'Manila',
                    barangay: `Brgy_${i}`
                }
            });
        }
        await supabase.from('scout_stores').insert(newStores);
    }
    
    // Generate transactions for orphaned customers
    const newTransactions = [];
    for (const customer of orphanedCustomers || []) {
        // Check if customer already has transactions
        const { count } = await supabase
            .from('scout_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.customer_id);
        
        if (count === 0) {
            // Generate 1-3 transactions per customer
            const numTransactions = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < numTransactions; i++) {
                const store = stores ? stores[Math.floor(Math.random() * stores.length)] : { store_id: 'STO10001' };
                const transactionDate = new Date(customer.created_at);
                transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 90));
                
                newTransactions.push({
                    transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                    customer_id: customer.customer_id,
                    store_id: customer.store_id || store.store_id,
                    transaction_date: transactionDate.toISOString(),
                    total_amount: (50 + Math.random() * 450).toFixed(2),
                    payment_method: ['cash', 'gcash', 'maya', 'credit'][Math.floor(Math.random() * 4)],
                    status: 'completed',
                    line_items: [
                        `Product ${Math.floor(Math.random() * 100)}`,
                        `SKU-${Math.floor(Math.random() * 1000)}`
                    ],
                    metadata: {
                        generated_to_fix_orphan: true,
                        original_customer_type: customer.customer_type
                    }
                });
            }
        }
    }
    
    if (newTransactions.length > 0) {
        console.log(`Creating ${newTransactions.length} transactions for orphaned customers...`);
        const { error } = await supabase
            .from('scout_transactions')
            .insert(newTransactions);
        
        if (error) {
            console.error('Error creating transactions:', error);
        } else {
            console.log(`✅ Created ${newTransactions.length} transactions`);
        }
    }
    
    return newTransactions.length;
}

async function seedTestData() {
    console.log('\n📊 Seeding additional test data...\n');
    
    // Create more realistic transactions in Bronze layer
    const bronzeData = [];
    for (let i = 0; i < 100; i++) {
        bronzeData.push({
            raw_data: {
                transaction_id: `TX-${Date.now()}-${i}`,
                store_id: `STO${10000 + (i % 20)}`,
                customer_id: `CUST-${Math.floor(Math.random() * 1000)}`,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        sku: `SKU-${Math.floor(Math.random() * 100)}`,
                        name: `Product ${Math.floor(Math.random() * 100)}`,
                        quantity: Math.floor(Math.random() * 5) + 1,
                        price: (10 + Math.random() * 90).toFixed(2)
                    }
                ],
                total: (50 + Math.random() * 450).toFixed(2),
                payment_method: ['cash', 'gcash', 'maya'][Math.floor(Math.random() * 3)]
            },
            source_system: 'pos_system',
            received_at: new Date().toISOString(),
            processing_status: 'pending'
        });
    }
    
    const { error } = await supabase
        .from('raw_transactions')
        .insert(bronzeData);
    
    if (error) {
        console.error('Error seeding bronze data:', error);
    } else {
        console.log(`✅ Seeded ${bronzeData.length} records to Bronze layer`);
    }
    
    return bronzeData.length;
}

// Main execution
async function main() {
    console.log('🚀 Scout Data Fix Script\n');
    console.log('=' .repeat(50) + '\n');
    
    try {
        // Step 1: Analyze current state
        const before = await analyzeData();
        
        if (before.orphaned > 0) {
            // Step 2: Fix orphaned customers
            const fixed = await fixOrphanedCustomers();
            
            // Step 3: Seed additional test data
            const seeded = await seedTestData();
            
            // Step 4: Re-analyze
            console.log('\n📈 After fixes:\n');
            await analyzeData();
            
            console.log('\n✅ Data fix complete!');
            console.log(`- Fixed ${fixed} orphaned customer relationships`);
            console.log(`- Seeded ${seeded} new Bronze layer records`);
        } else {
            console.log('✅ No orphaned customers found!');
        }
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Install instructions if packages missing
const checkDependencies = async () => {
    try {
        require('@supabase/supabase-js');
    } catch {
        console.log('Installing required packages...');
        require('child_process').execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    }
};

checkDependencies().then(() => main());