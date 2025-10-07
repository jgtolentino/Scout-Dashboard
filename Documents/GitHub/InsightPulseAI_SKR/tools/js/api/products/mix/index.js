const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'scout_user',
    password: process.env.DB_PASSWORD || 'ScoutPass123!',
    server: process.env.DB_SERVER || 'scout-sql-server.database.windows.net',
    database: process.env.DB_DATABASE || 'scout_analytics',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

function transformProductMixResults(recordset) {
    return recordset.map(record => ({
        category: record.Category,
        subCategory: record.SubCategory,
        productCount: parseInt(record.ProductCount),
        transactionCount: parseInt(record.TransactionCount),
        totalUnitsSold: parseInt(record.TotalUnitsSold),
        totalRevenue: parseFloat(record.TotalRevenue),
        totalProfit: parseFloat(record.TotalProfit),
        avgSellingPrice: parseFloat(record.AvgSellingPrice),
        marketSharePercentage: parseFloat(record.MarketSharePercentage),
        profitMarginPercentage: parseFloat(record.ProfitMarginPercentage)
    }));
}

module.exports = async function (context, req) {
    context.log('Product Mix API function processed a request.');

    // CORS headers
    context.res = {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    };

    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        // Parse query parameters
        const startDate = req.query.startDate || '2024-01-01';
        const endDate = req.query.endDate || '2024-12-31';
        const category = req.query.category || null;

        context.log(`Fetching product mix data from ${startDate} to ${endDate}, category: ${category || 'all'}`);

        // Connect to database
        const pool = await sql.connect(config);
        
        // Execute stored procedure
        const result = await pool.request()
            .input('StartDate', sql.DateTime, new Date(startDate))
            .input('EndDate', sql.DateTime, new Date(endDate))
            .input('CategoryFilter', sql.NVarChar(100), category)
            .execute('sp_GetProductMix');

        // Transform and return results
        const productMixData = transformProductMixResults(result.recordset);

        // Calculate summary statistics
        const summaryStats = {
            totalCategories: productMixData.length,
            totalProducts: productMixData.reduce((sum, item) => sum + item.productCount, 0),
            totalRevenue: productMixData.reduce((sum, item) => sum + item.totalRevenue, 0),
            totalProfit: productMixData.reduce((sum, item) => sum + item.totalProfit, 0),
            avgProfitMargin: productMixData.length > 0 
                ? productMixData.reduce((sum, item) => sum + item.profitMarginPercentage, 0) / productMixData.length 
                : 0
        };

        context.log(`Returning ${productMixData.length} product categories`);

        context.res.status = 200;
        context.res.body = {
            success: true,
            data: productMixData,
            summaryStats,
            metadata: {
                startDate,
                endDate,
                categoryFilter: category,
                totalCategories: productMixData.length,
                generatedAt: new Date().toISOString(),
                dataSource: 'sp_GetProductMix'
            }
        };

        await pool.close();

    } catch (error) {
        context.log.error('Error in product mix API:', error);
        
        context.res.status = 500;
        context.res.body = {
            success: false,
            error: 'Internal server error',
            message: error.message
        };
    }
};