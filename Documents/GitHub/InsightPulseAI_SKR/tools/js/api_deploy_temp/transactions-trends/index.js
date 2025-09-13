/**
 * Transaction Trends API Endpoint
 * Route: /api/transactions/trends
 * Purpose: Serve data for Transaction Trends POC charts
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
 * Main API handler for Azure Functions
 */
module.exports = async function (context, req) {
    // Set CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        context.res = {
            status: 405,
            body: { 
                error: 'Method not allowed', 
                allowedMethods: ['GET'] 
            }
        };
        return;
    }
    
    try {
        // Parse query parameters
        const { startDate, endDate, storeId, format: responseFormat } = req.query;
        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateParams(startDate, endDate);
        
        context.log(`[Transaction Trends API] Request: ${parsedStartDate} to ${parsedEndDate}, store: ${storeId || 'all'}`);
        
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
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="transaction_trends.csv"'
                },
                body: transformedData.hourlyVolume.map(row => 
                    `${row.hour},${row.transactionCount},${row.avgAmount},${row.avgDuration}`
                ).join('\n')
            };
        } else {
            // Default JSON response
            context.res = {
                status: 200,
                body: transformedData
            };
        }
        
        context.log(`[Transaction Trends API] Success: ${transformedData.summaryStats.totalTransactions} transactions`);
        
    } catch (error) {
        context.log.error('[Transaction Trends API] Error:', error);
        
        // Return structured error response
        context.res = {
            status: 500,
            body: {
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed',
                timestamp: new Date().toISOString(),
                requestId: Math.random().toString(36).substr(2, 9)
            }
        };
    } finally {
        // Close database connection
        try {
            await sql.close();
        } catch (closeError) {
            context.log.error('[Transaction Trends API] Connection close error:', closeError);
        }
    }
};