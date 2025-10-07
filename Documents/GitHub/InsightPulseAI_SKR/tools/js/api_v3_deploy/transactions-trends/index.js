/**
 * Azure Functions v4 Handler - Transaction Trends API
 * Route: /api/transactions/trends
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
    const defaultStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    let parsedStartDate = startDate ? new Date(startDate) : defaultStartDate;
    let parsedEndDate = endDate ? new Date(endDate) : today;
    
    // Validate dates
    if (isNaN(parsedStartDate.getTime())) {
        parsedStartDate = defaultStartDate;
    }
    if (isNaN(parsedEndDate.getTime())) {
        parsedEndDate = today;
    }
    
    // Ensure start date is before end date
    if (parsedStartDate > parsedEndDate) {
        [parsedStartDate, parsedEndDate] = [parsedEndDate, parsedStartDate];
    }
    
    return {
        startDate: format(parsedStartDate, 'yyyy-MM-dd'),
        endDate: format(parsedEndDate, 'yyyy-MM-dd')
    };
}

/**
 * Transform database results for frontend consumption
 */
function transformResults(results) {
    const response = {
        hourlyVolume: [],
        durationDistribution: [],
        summaryStats: {},
        metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'v_TransactionTrendsPOC'
        }
    };
    
    // Process each result set from stored procedure
    if (results.recordsets && results.recordsets.length >= 3) {
        // Hourly volume data (for time-series chart)
        response.hourlyVolume = results.recordsets[0].map(row => ({
            hour: row.hour,
            transactionCount: row.transaction_count,
            avgAmount: parseFloat(row.avg_amount) || 0,
            avgDuration: parseFloat(row.avg_duration) || 0,
            // Format for chart display
            label: `${row.hour}:00`,
            tooltip: `${row.transaction_count} transactions at ${row.hour}:00`
        }));
        
        // Duration distribution (for box plot)
        response.durationDistribution = results.recordsets[1].map(row => ({
            category: row.DurationCategory,
            count: row.count,
            minDuration: row.min_duration,
            maxDuration: row.max_duration,
            avgDuration: parseFloat(row.avg_duration) || 0,
            q1: parseFloat(row.q1) || 0,
            median: parseFloat(row.median) || 0,
            q3: parseFloat(row.q3) || 0,
            // Outlier detection thresholds
            lowerFence: (parseFloat(row.q1) || 0) - 1.5 * ((parseFloat(row.q3) || 0) - (parseFloat(row.q1) || 0)),
            upperFence: (parseFloat(row.q3) || 0) + 1.5 * ((parseFloat(row.q3) || 0) - (parseFloat(row.q1) || 0))
        }));
        
        // Summary statistics
        if (results.recordsets[2].length > 0) {
            const summary = results.recordsets[2][0];
            response.summaryStats = {
                totalTransactions: summary.total_transactions,
                transactionsWithDuration: summary.transactions_with_duration,
                transactionsWithAmount: summary.transactions_with_amount,
                avgTransactionAmount: parseFloat(summary.avg_transaction_amount) || 0,
                avgDurationSeconds: parseFloat(summary.avg_duration_seconds) || 0,
                dateRangeStart: summary.date_range_start,
                dateRangeEnd: summary.date_range_end,
                // Calculate data completeness percentages
                durationCompleteness: summary.total_transactions > 0 ? 
                    (summary.transactions_with_duration / summary.total_transactions * 100).toFixed(1) : 0,
                amountCompleteness: summary.total_transactions > 0 ? 
                    (summary.transactions_with_amount / summary.total_transactions * 100).toFixed(1) : 0
            };
        }
    }
    
    return response;
}

/**
 * Azure Functions v4 HTTP Handler
 */
async function httpHandler(request, context) {
    context.log('Transaction Trends API triggered');
    
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return {
            status: 200,
            headers,
            body: ''
        };
    }
    
    // Only allow GET requests
    if (request.method !== 'GET') {
        return {
            status: 405,
            headers,
            body: JSON.stringify({ 
                error: 'Method not allowed', 
                allowedMethods: ['GET'] 
            })
        };
    }
    
    try {
        // Parse query parameters
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const storeId = url.searchParams.get('storeId');
        const responseFormat = url.searchParams.get('format');
        
        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateParams(startDate, endDate);
        
        context.log(`Request: ${parsedStartDate} to ${parsedEndDate}, store: ${storeId || 'all'}`);
        
        // Connect to database
        const pool = await sql.connect(dbConfig);
        
        // Execute stored procedure
        const request = pool.request();
        request.input('StartDate', sql.Date, parsedStartDate);
        request.input('EndDate', sql.Date, parsedEndDate);
        
        if (storeId) {
            request.input('StoreID', sql.Int, parseInt(storeId));
        }
        
        const result = await request.execute('sp_GetTransactionTrendsPOC');
        
        // Transform results for frontend
        const transformedData = transformResults(result);
        
        // Add request metadata
        transformedData.metadata.request = {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            storeId: storeId || null,
            requestTime: new Date().toISOString()
        };
        
        // Handle different response formats
        if (responseFormat === 'csv') {
            // CSV export for data analysis
            const csvData = transformedData.hourlyVolume.map(row => 
                `${row.hour},${row.transactionCount},${row.avgAmount},${row.avgDuration}`
            ).join('\n');
            
            return {
                status: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="transaction_trends.csv"'
                },
                body: `hour,transactionCount,avgAmount,avgDuration\n${csvData}`
            };
        } else {
            // Default JSON response
            context.log(`Success: ${transformedData.summaryStats.totalTransactions} transactions`);
            
            return {
                status: 200,
                headers,
                body: JSON.stringify(transformedData)
            };
        }
        
    } catch (error) {
        context.log.error('Error:', error);
        
        // Return structured error response
        return {
            status: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed',
                timestamp: new Date().toISOString(),
                requestId: Math.random().toString(36).substr(2, 9)
            })
        };
    } finally {
        // Close database connection
        try {
            await sql.close();
        } catch (closeError) {
            context.log.error('Connection close error:', closeError);
        }
    }
}

module.exports = httpHandler;