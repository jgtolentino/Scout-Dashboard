/**
 * Update Simulation Data with TBWA Brands
 * Integrates TBWA\SMP FMCG brands into existing simulation data structure
 */

const fs = require('fs');
const path = require('path');
const TBWABrandsGenerator = require('./generators/tbwa_brands_generator');

// Paths to update
const SIM_DATA_PATH = path.join(__dirname, '../final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy/data/sim');
const BRANDS_FILE = path.join(SIM_DATA_PATH, 'brands.json');
const PRODUCTS_FILE = path.join(SIM_DATA_PATH, 'products.json');
const TRANSACTIONS_FILE = path.join(SIM_DATA_PATH, 'transactions.json');

// Load TBWA brands data
const tbwaBrands = require('./tbwa_smp_brands.json');

function updateBrandsFile() {
    console.log('Updating brands.json with TBWA\SMP brands...');
    
    // Create brands structure matching existing format
    const brandsData = {
        brands: tbwaBrands.brands.map(brand => ({
            BrandID: brand.BrandID,
            BrandName: brand.BrandName,
            CompanyName: brand.CompanyName,
            Category: brand.Category,
            IsTBWAClient: brand.IsTBWAClient,
            PerformanceScore: 85 + Math.random() * 15, // 85-100
            MarketShare: 15 + Math.random() * 20, // 15-35%
            GrowthRate: 5 + Math.random() * 15, // 5-20%
            CustomerLoyalty: 80 + Math.random() * 15 // 80-95%
        })),
        metadata: {
            dataSource: 'simulation',
            isSimulated: true,
            lastUpdated: new Date().toISOString()
        }
    };

    fs.writeFileSync(BRANDS_FILE, JSON.stringify(brandsData, null, 2));
    console.log(`✓ Updated ${BRANDS_FILE}`);
}

function updateProductsFile() {
    console.log('Updating products.json with TBWA\SMP products...');
    
    const products = [];
    tbwaBrands.brands.forEach(brand => {
        brand.SubBrands.forEach(product => {
            products.push({
                ProductID: product.ProductID,
                ProductName: product.ProductName,
                BrandID: brand.BrandID,
                BrandName: brand.BrandName,
                CategoryID: product.CategoryID,
                Category: brand.Category,
                SubCategory: product.SubCategory,
                UPC: product.UPC,
                DefaultPrice: product.DefaultPrice,
                StockLevel: Math.floor(Math.random() * 100) + 50,
                IsActive: true
            });
        });
    });

    const productsData = {
        products: products,
        categories: tbwaBrands.categories,
        metadata: {
            dataSource: 'simulation',
            isSimulated: true,
            lastUpdated: new Date().toISOString()
        }
    };

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsData, null, 2));
    console.log(`✓ Updated ${PRODUCTS_FILE}`);
}

function generateTransactionData() {
    console.log('Generating transaction data with TBWA brands...');
    
    const generator = new TBWABrandsGenerator();
    
    // Use store IDs from existing data
    const storeIds = Array.from({length: 71}, (_, i) => i + 1); // 71 stores
    
    // Generate transactions for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const transactions = generator.generateBulkTransactions(
        storeIds,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        200 // 200 transactions per day
    );

    // Format transactions to match existing structure
    const formattedTransactions = transactions.map((t, index) => ({
        TransactionID: Date.now() + index,
        StoreID: t.StoreID,
        TransactionDate: t.TransactionDate,
        TransactionAmount: t.TransactionAmount,
        Items: t.Items,
        CustomerSegment: ['Regular', 'VIP', 'New', 'Occasional'][Math.floor(Math.random() * 4)],
        PaymentMethod: ['Cash', 'GCash', 'Card'][Math.floor(Math.random() * 3)],
        DataSource: 'simulation',
        IsSimulated: true
    }));

    const transactionsData = {
        transactions: formattedTransactions.slice(0, 1000), // Keep file size manageable
        summary: {
            totalTransactions: formattedTransactions.length,
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            topBrands: calculateTopBrands(formattedTransactions)
        },
        metadata: {
            dataSource: 'simulation',
            isSimulated: true,
            lastUpdated: new Date().toISOString()
        }
    };

    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactionsData, null, 2));
    console.log(`✓ Updated ${TRANSACTIONS_FILE}`);
    
    return formattedTransactions;
}

function calculateTopBrands(transactions) {
    const brandCounts = {};
    
    transactions.forEach(t => {
        t.Items.forEach(item => {
            if (!brandCounts[item.BrandName]) {
                brandCounts[item.BrandName] = {
                    name: item.BrandName,
                    transactionCount: 0,
                    totalRevenue: 0
                };
            }
            brandCounts[item.BrandName].transactionCount++;
            brandCounts[item.BrandName].totalRevenue += item.SubTotal;
        });
    });

    return Object.values(brandCounts)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);
}

function updateDrilldownData() {
    console.log('Updating drilldown data files...');
    
    const drilldownPath = path.join(SIM_DATA_PATH, 'drilldowns');
    
    // Brand sentiment data
    const brandSentiment = {
        brands: tbwaBrands.brands.map(brand => ({
            name: brand.BrandName,
            sentiment: {
                positive: 60 + Math.random() * 25,
                neutral: 15 + Math.random() * 10,
                negative: 5 + Math.random() * 5
            },
            nps: 40 + Math.random() * 30,
            mentions: Math.floor(Math.random() * 1000) + 500
        })),
        metadata: {
            dataSource: 'simulation',
            isSimulated: true
        }
    };

    fs.writeFileSync(
        path.join(drilldownPath, 'brand-sentiment.json'),
        JSON.stringify(brandSentiment, null, 2)
    );

    console.log(`✓ Updated brand sentiment drilldown data`);
}

function createAIInsightsData(transactions) {
    console.log('Generating AI insights for TBWA brands...');
    
    const generator = new TBWABrandsGenerator();
    const insights = generator.generateAIInsights(transactions);
    
    const aiInsightsData = {
        insights: insights.map((insight, index) => ({
            id: `insight_${Date.now()}_${index}`,
            timestamp: new Date().toISOString(),
            type: insight.type,
            category: insight.category,
            message: insight.insight,
            confidence: insight.confidence,
            impact: 'medium',
            actionable: true
        })),
        summary: {
            totalInsights: insights.length,
            byType: insights.reduce((acc, i) => {
                acc[i.type] = (acc[i.type] || 0) + 1;
                return acc;
            }, {}),
            averageConfidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
        },
        metadata: {
            dataSource: 'simulation',
            isSimulated: true,
            lastUpdated: new Date().toISOString()
        }
    };

    const aiInsightsFile = path.join(SIM_DATA_PATH, 'ai_insights.json');
    fs.writeFileSync(aiInsightsFile, JSON.stringify(aiInsightsData, null, 2));
    console.log(`✓ Created ${aiInsightsFile}`);
}

// Main execution
async function main() {
    console.log('Starting TBWA brands integration...\n');

    try {
        // Ensure directories exist
        if (!fs.existsSync(SIM_DATA_PATH)) {
            fs.mkdirSync(SIM_DATA_PATH, { recursive: true });
        }

        const drilldownPath = path.join(SIM_DATA_PATH, 'drilldowns');
        if (!fs.existsSync(drilldownPath)) {
            fs.mkdirSync(drilldownPath, { recursive: true });
        }

        // Update all data files
        updateBrandsFile();
        updateProductsFile();
        const transactions = generateTransactionData();
        updateDrilldownData();
        createAIInsightsData(transactions);

        console.log('\n✅ TBWA brands integration complete!');
        console.log('\nFiles updated:');
        console.log('- data/sim/brands.json');
        console.log('- data/sim/products.json');
        console.log('- data/sim/transactions.json');
        console.log('- data/sim/drilldowns/brand-sentiment.json');
        console.log('- data/sim/ai_insights.json');
        console.log('\nThe dashboard will now show TBWA\SMP client brands when toggled to simulation data.');
        
    } catch (error) {
        console.error('❌ Error during integration:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { updateBrandsFile, updateProductsFile, generateTransactionData };