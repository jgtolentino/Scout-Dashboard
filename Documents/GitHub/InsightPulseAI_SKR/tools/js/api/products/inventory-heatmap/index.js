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

function transformInventoryHeatmapResults(recordset) {
    return recordset.map(record => ({
        locationId: parseInt(record.LocationID),
        barangay: record.Barangay,
        municipality: record.Municipality,
        province: record.Province,
        latitude: parseFloat(record.Latitude),
        longitude: parseFloat(record.Longitude),
        category: record.Category,
        productsInStock: parseInt(record.ProductsInStock),
        totalStock: parseInt(record.TotalStock),
        totalStockValue: parseFloat(record.TotalStockValue),
        avgStockLevel: parseFloat(record.AvgStockLevel),
        lowStockItems: parseInt(record.LowStockItems),
        outOfStockItems: parseInt(record.OutOfStockItems),
        stockDensity: parseFloat(record.StockDensity),
        stockStatus: record.StockStatus,
        riskLevel: getInventoryRiskLevel(record)
    }));
}

function getInventoryRiskLevel(record) {
    const outOfStockRatio = record.OutOfStockItems / Math.max(record.ProductsInStock, 1);
    const lowStockRatio = record.LowStockItems / Math.max(record.ProductsInStock, 1);
    
    if (outOfStockRatio > 0.3 || lowStockRatio > 0.5) {
        return 'HIGH';
    } else if (outOfStockRatio > 0.1 || lowStockRatio > 0.3) {
        return 'MEDIUM';
    } else {
        return 'LOW';
    }
}

module.exports = async function (context, req) {
    context.log('Inventory Heatmap API function processed a request.');

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
        const locationLevel = req.query.locationLevel || 'Barangay';
        const stockThreshold = parseInt(req.query.stockThreshold) || 10;

        // Validate locationLevel parameter
        const validLevels = ['Barangay', 'Municipality', 'Province'];
        const locationLevelParam = validLevels.includes(locationLevel) ? locationLevel : 'Barangay';

        context.log(`Fetching inventory heatmap data for ${locationLevelParam} level, threshold: ${stockThreshold}`);

        // Connect to database
        const pool = await sql.connect(config);
        
        // Execute stored procedure
        const result = await pool.request()
            .input('LocationLevel', sql.NVarChar(20), locationLevelParam)
            .input('StockThreshold', sql.Int, stockThreshold)
            .execute('sp_GetInventoryDensity');

        // Transform and return results
        const inventoryData = transformInventoryHeatmapResults(result.recordset);

        // Calculate inventory insights
        const inventoryInsights = {
            totalLocations: inventoryData.length,
            locationsWithStock: inventoryData.filter(item => item.totalStock > 0).length,
            highRiskLocations: inventoryData.filter(item => item.riskLevel === 'HIGH').length,
            mediumRiskLocations: inventoryData.filter(item => item.riskLevel === 'MEDIUM').length,
            lowRiskLocations: inventoryData.filter(item => item.riskLevel === 'LOW').length,
            totalStockValue: inventoryData.reduce((sum, item) => sum + item.totalStockValue, 0),
            avgStockDensity: inventoryData.length > 0 
                ? inventoryData.reduce((sum, item) => sum + item.stockDensity, 0) / inventoryData.length 
                : 0,
            totalOutOfStock: inventoryData.reduce((sum, item) => sum + item.outOfStockItems, 0),
            totalLowStock: inventoryData.reduce((sum, item) => sum + item.lowStockItems, 0)
        };

        // Calculate max density for color scaling
        const maxDensity = inventoryData.length > 0 
            ? Math.max(...inventoryData.map(item => item.stockDensity))
            : 0;

        context.log(`Returning ${inventoryData.length} inventory locations`);

        context.res.status = 200;
        context.res.body = {
            success: true,
            data: inventoryData,
            inventoryInsights,
            metadata: {
                locationLevel: locationLevelParam,
                stockThreshold,
                maxDensity,
                totalLocations: inventoryData.length,
                generatedAt: new Date().toISOString(),
                dataSource: 'sp_GetInventoryDensity'
            }
        };

        await pool.close();

    } catch (error) {
        context.log.error('Error in inventory heatmap API:', error);
        
        context.res.status = 500;
        context.res.body = {
            success: false,
            error: 'Internal server error',
            message: error.message
        };
    }
};