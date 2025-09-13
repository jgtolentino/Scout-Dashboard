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

function transformHeatmapResults(recordset) {
    return recordset.map(record => ({
        barangay: record.Barangay,
        municipality: record.Municipality,
        province: record.Province,
        latitude: parseFloat(record.Latitude),
        longitude: parseFloat(record.Longitude),
        transactionCount: parseInt(record.TransactionCount),
        totalAmount: parseFloat(record.TotalAmount),
        avgAmount: parseFloat(record.AvgAmount),
        density: parseFloat(record.Density)
    }));
}

module.exports = async function (context, req) {
    context.log('Heatmap API function processed a request.');

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
        const minDensity = parseFloat(req.query.minDensity) || 0;

        context.log(`Fetching heatmap data from ${startDate} to ${endDate}, minDensity: ${minDensity}`);

        // Connect to database
        const pool = await sql.connect(config);
        
        // Execute stored procedure
        const result = await pool.request()
            .input('StartDate', sql.DateTime, new Date(startDate))
            .input('EndDate', sql.DateTime, new Date(endDate))
            .input('MinDensity', sql.Float, minDensity)
            .execute('sp_GetTransactionDensity');

        // Transform and return results
        const heatmapData = transformHeatmapResults(result.recordset);

        context.log(`Returning ${heatmapData.length} heatmap data points`);

        context.res.status = 200;
        context.res.body = {
            success: true,
            data: heatmapData,
            metadata: {
                startDate,
                endDate,
                minDensity,
                totalPoints: heatmapData.length,
                generatedAt: new Date().toISOString()
            }
        };

        await pool.close();

    } catch (error) {
        context.log.error('Error in heatmap API:', error);
        
        context.res.status = 500;
        context.res.body = {
            success: false,
            error: 'Internal server error',
            message: error.message
        };
    }
};