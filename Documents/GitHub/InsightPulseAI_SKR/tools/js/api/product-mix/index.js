/**
 * Product Mix Analysis API Endpoint
 * Route: /api/product-mix
 * Purpose: Serve product sales data and SKU analysis for charts
 */

const sql = require('mssql');

// Database configuration
const dbConfig = {
    server: process.env.SQL_SERVER || 'sqltbwaprojectscoutserver.database.windows.net',
    database: process.env.SQL_DATABASE || 'SQL-TBWA-ProjectScout-Reporting-Prod',
    user: process.env.SQL_USER || 'sqladmin',
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

/**
 * Generate demo data for Product Mix Analysis
 */
function generateDemoData() {
    const products = [
        'Coca-Cola 350ml', 'Lucky Me Instant Pancit Canton', 'Tide Detergent 500g',
        'Maggi Magic Sarap 50g', 'Nescafe 3-in-1 Original', 'Spam Classic 340g',
        'Bear Brand Milk 300ml', 'Knorr Chicken Cubes', 'Dove Soap 90g', 'Colgate Toothpaste 75ml'
    ];
    
    const brands = [
        'Coca-Cola', 'Lucky Me', 'Tide', 'Maggi', 'Nescafe', 
        'Spam', 'Bear Brand', 'Knorr', 'Dove', 'Colgate'
    ];
    
    const categories = ['Beverages', 'Food', 'Household', 'Personal Care'];
    
    return {
        topProducts: products.map((product, i) => ({
            sku: `SKU-${String(i + 1).padStart(3, '0')}`,
            name: product,
            brand: brands[i],
            category: categories[i % categories.length],
            sales: Math.floor(Math.random() * 50000) + 10000,
            units: Math.floor(Math.random() * 1000) + 100,
            margin: (Math.random() * 30) + 10,
            growth: (Math.random() - 0.5) * 50,
            rank: i + 1
        })).sort((a, b) => b.sales - a.sales),
        
        brandPerformance: brands.map(brand => ({
            brand: brand,
            sales: Math.floor(Math.random() * 100000) + 20000,
            products: Math.floor(Math.random() * 10) + 3,
            marketShare: Math.random() * 15 + 5,
            growth: (Math.random() - 0.5) * 40
        })).sort((a, b) => b.sales - a.sales),
        
        categoryMix: categories.map(category => ({
            category: category,
            sales: Math.floor(Math.random() * 200000) + 50000,
            products: Math.floor(Math.random() * 50) + 10,
            avgPrice: Math.random() * 500 + 50,
            margin: Math.random() * 25 + 15
        }))
    };
}

/**
 * Main API handler
 */
async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ 
            error: 'Method not allowed', 
            allowedMethods: ['GET'] 
        });
        return;
    }
    
    try {
        console.log('[Product Mix API] Generating product mix analysis data...');
        
        // Generate demo data (in production, this would query the database)
        const data = generateDemoData();
        
        // Calculate summary metrics
        const totalSales = data.topProducts.reduce((sum, product) => sum + product.sales, 0);
        const totalUnits = data.topProducts.reduce((sum, product) => sum + product.units, 0);
        const avgMargin = data.topProducts.reduce((sum, product) => sum + product.margin, 0) / data.topProducts.length;
        
        const response = {
            ok: true,
            data: {
                products: data.topProducts.slice(0, 10), // Top 10 products
                brands: data.brandPerformance.slice(0, 8), // Top 8 brands
                categories: data.categoryMix,
                summary: {
                    totalSales: totalSales,
                    totalUnits: totalUnits,
                    avgMargin: avgMargin.toFixed(1),
                    topCategory: data.categoryMix.sort((a, b) => b.sales - a.sales)[0].category,
                    skuCount: data.topProducts.length
                }
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'Demo - Product Mix Analysis',
                period: 'Last 30 days',
                currency: 'PHP'
            }
        };
        
        res.status(200).json(response);
        console.log('[Product Mix API] Success: Returned analysis for', data.topProducts.length, 'products');
        
    } catch (error) {
        console.error('[Product Mix API] Error:', error);
        
        res.status(500).json({
            ok: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate product mix data',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = handler;