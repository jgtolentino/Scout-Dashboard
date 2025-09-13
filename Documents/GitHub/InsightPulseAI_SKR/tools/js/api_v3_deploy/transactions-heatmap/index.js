/**
 * Azure Functions v4 Handler - Transaction Heatmap API
 * Route: /api/transactions/heatmap
 */

const sql = require('mssql');
const { format } = require('date-fns');

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
 * Parse and validate date parameters
 */
function parseDateParams(startDate, endDate) {
    const today = new Date();
    const defaultStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let parsedStartDate = startDate ? new Date(startDate) : defaultStartDate;
    let parsedEndDate = endDate ? new Date(endDate) : today;
    
    if (isNaN(parsedStartDate.getTime())) {
        parsedStartDate = defaultStartDate;
    }
    if (isNaN(parsedEndDate.getTime())) {
        parsedEndDate = today;
    }
    
    if (parsedStartDate > parsedEndDate) {
        [parsedStartDate, parsedEndDate] = [parsedEndDate, parsedStartDate];
    }
    
    return {
        startDate: format(parsedStartDate, 'yyyy-MM-dd'),
        endDate: format(parsedEndDate, 'yyyy-MM-dd')
    };
}

/**
 * Azure Functions v4 HTTP Handler
 */
async function httpHandler(request, context) {
    context.log('Transaction Heatmap API triggered');
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    if (request.method === 'OPTIONS') {
        return { status: 200, headers, body: '' };
    }
    
    if (request.method !== 'GET') {
        return {
            status: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed', allowedMethods: ['GET'] })
        };
    }
    
    try {
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateParams(startDate, endDate);
        
        context.log(`Heatmap request: ${parsedStartDate} to ${parsedEndDate}`);
        
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('StartDate', sql.Date, parsedStartDate)
            .input('EndDate', sql.Date, parsedEndDate)
            .execute('sp_GetTransactionHeatmapPOC');
        
        const heatmapData = {
            locations: result.recordset.map(row => ({
                latitude: parseFloat(row.latitude) || 0,
                longitude: parseFloat(row.longitude) || 0,
                transactionCount: row.transaction_count,
                totalAmount: parseFloat(row.total_amount) || 0,
                avgAmount: parseFloat(row.avg_amount) || 0,
                storeName: row.store_name || 'Unknown Store',
                storeId: row.store_id,
                intensity: Math.min(row.transaction_count / 10, 1) // Normalize for heatmap
            })),
            metadata: {
                generatedAt: new Date().toISOString(),
                dateRange: { startDate: parsedStartDate, endDate: parsedEndDate },
                totalLocations: result.recordset.length
            }
        };
        
        context.log(`Success: ${heatmapData.locations.length} locations`);
        
        return {
            status: 200,
            headers,
            body: JSON.stringify(heatmapData)
        };
        
    } catch (error) {
        context.log.error('Heatmap API Error:', error);
        
        return {
            status: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to fetch heatmap data',
                timestamp: new Date().toISOString()
            })
        };
    } finally {
        try {
            await sql.close();
        } catch (closeError) {
            context.log.error('Connection close error:', closeError);
        }
    }
}

module.exports = httpHandler;