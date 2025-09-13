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

function transformSKUPerformanceResults(recordset) {
    return recordset.map(record => ({
        productId: parseInt(record.ProductID),
        productName: record.ProductName,
        sku: record.SKU,
        category: record.Category,
        brand: record.Brand,
        unitPrice: parseFloat(record.UnitPrice),
        unitsSold: parseInt(record.UnitsSold),
        revenue: parseFloat(record.Revenue),
        profit: parseFloat(record.Profit),
        avgStockLevel: parseFloat(record.AvgStockLevel),
        inventoryTurnover: parseFloat(record.InventoryTurnover),
        profitMargin: parseFloat(record.ProfitMargin),
        daysOfStock: parseInt(record.DaysOfStock),
        locationsCovered: parseInt(record.LocationsCovered),
        rank: parseInt(record.Rank),
        performanceStatus: getPerformanceStatus(record)
    }));
}

function getPerformanceStatus(record) {
    const revenue = parseFloat(record.Revenue);
    const profitMargin = parseFloat(record.ProfitMargin);
    const inventoryTurnover = parseFloat(record.InventoryTurnover);
    
    if (revenue > 1000 && profitMargin > 20 && inventoryTurnover > 2) {
        return 'EXCELLENT';
    } else if (revenue > 500 && profitMargin > 15) {
        return 'GOOD';
    } else if (revenue > 100) {
        return 'AVERAGE';
    } else {
        return 'POOR';
    }
}

module.exports = async function (context, req) {
    context.log('SKU Performance API function processed a request.');

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
        const topN = parseInt(req.query.topN) || 20;
        const sortBy = req.query.sortBy || 'Revenue';

        // Validate sortBy parameter
        const validSortOptions = ['Revenue', 'Volume', 'Margin'];
        const sortByParam = validSortOptions.includes(sortBy) ? sortBy : 'Revenue';

        context.log(`Fetching SKU performance data from ${startDate} to ${endDate}, top ${topN}, sorted by ${sortByParam}`);

        // Connect to database
        const pool = await sql.connect(config);
        
        // Execute stored procedure
        const result = await pool.request()
            .input('StartDate', sql.DateTime, new Date(startDate))
            .input('EndDate', sql.DateTime, new Date(endDate))
            .input('TopN', sql.Int, topN)
            .input('SortBy', sql.NVarChar(20), sortByParam)
            .execute('sp_GetSKUPerformance');

        // Transform and return results
        const skuData = transformSKUPerformanceResults(result.recordset);

        // Calculate performance insights
        const performanceInsights = {
            excellentPerformers: skuData.filter(item => item.performanceStatus === 'EXCELLENT').length,
            goodPerformers: skuData.filter(item => item.performanceStatus === 'GOOD').length,
            averagePerformers: skuData.filter(item => item.performanceStatus === 'AVERAGE').length,
            poorPerformers: skuData.filter(item => item.performanceStatus === 'POOR').length,
            totalRevenue: skuData.reduce((sum, item) => sum + item.revenue, 0),
            totalUnits: skuData.reduce((sum, item) => sum + item.unitsSold, 0),
            avgProfitMargin: skuData.length > 0 
                ? skuData.reduce((sum, item) => sum + item.profitMargin, 0) / skuData.length 
                : 0,
            avgInventoryTurnover: skuData.length > 0 
                ? skuData.reduce((sum, item) => sum + item.inventoryTurnover, 0) / skuData.length 
                : 0
        };

        context.log(`Returning ${skuData.length} SKU performance records`);

        context.res.status = 200;
        context.res.body = {
            success: true,
            data: skuData,
            performanceInsights,
            metadata: {
                startDate,
                endDate,
                topN,
                sortBy: sortByParam,
                totalRecords: skuData.length,
                generatedAt: new Date().toISOString(),
                dataSource: 'sp_GetSKUPerformance'
            }
        };

        await pool.close();

    } catch (error) {
        context.log.error('Error in SKU performance API:', error);
        
        context.res.status = 500;
        context.res.body = {
            success: false,
            error: 'Internal server error',
            message: error.message
        };
    }
};