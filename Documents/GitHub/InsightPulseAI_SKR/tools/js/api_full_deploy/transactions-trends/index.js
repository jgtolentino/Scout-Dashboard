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
        // Parse query parameters
        const { startDate, endDate, storeId, format: responseFormat } = req.query;
        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateParams(startDate, endDate);
        
        console.log(`[Transaction Trends API] Request: ${parsedStartDate} to ${parsedEndDate}, store: ${storeId || 'all'}`);
        
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
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="transaction_trends.csv"');
            
            const csvData = transformedData.hourlyVolume.map(row => 
                `${row.hour},${row.transactionCount},${row.avgAmount},${row.avgDuration}`
            ).join('\n');
            
            res.status(200).send(`hour,transactionCount,avgAmount,avgDuration\n${csvData}`);
        } else {
            // Default JSON response
            res.status(200).json(transformedData);
        }
        
        console.log(`[Transaction Trends API] Success: ${transformedData.summaryStats.totalTransactions} transactions`);
        
    } catch (error) {
        console.error('[Transaction Trends API] Error:', error);
        
        // Return structured error response
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed',
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9)
        });
    } finally {
        // Close database connection
        try {
            await sql.close();
        } catch (closeError) {
            console.error('[Transaction Trends API] Connection close error:', closeError);
        }
    }
}

// Export for different environments
module.exports = handler;

// Vercel/Netlify Functions export
module.exports.default = handler;

// Express.js route export
module.exports.expressRoute = (app) => {
    app.get('/api/transactions/trends', handler);
};

// Validation schema for OpenAPI/Swagger documentation
module.exports.schema = {
    summary: 'Get transaction trends data for charts',
    description: 'Returns hourly volume and duration distribution data for Transaction Trends POC',
    parameters: [
        {
            name: 'startDate',
            in: 'query',
            description: 'Start date (YYYY-MM-DD format)',
            schema: { type: 'string', format: 'date' }
        },
        {
            name: 'endDate',
            in: 'query',
            description: 'End date (YYYY-MM-DD format)',
            schema: { type: 'string', format: 'date' }
        },
        {
            name: 'storeId',
            in: 'query',
            description: 'Filter by specific store ID',
            schema: { type: 'integer' }
        },
        {
            name: 'format',
            in: 'query',
            description: 'Response format (json or csv)',
            schema: { type: 'string', enum: ['json', 'csv'] }
        }
    ],
    responses: {
        200: {
            description: 'Transaction trends data',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            hourlyVolume: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        hour: { type: 'integer' },
                                        transactionCount: { type: 'integer' },
                                        avgAmount: { type: 'number' },
                                        avgDuration: { type: 'number' }
                                    }
                                }
                            },
                            durationDistribution: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        category: { type: 'string' },
                                        count: { type: 'integer' },
                                        q1: { type: 'number' },
                                        median: { type: 'number' },
                                        q3: { type: 'number' }
                                    }
                                }
                            },
                            summaryStats: {
                                type: 'object',
                                properties: {
                                    totalTransactions: { type: 'integer' },
                                    avgTransactionAmount: { type: 'number' },
                                    avgDurationSeconds: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        },
        500: {
            description: 'Internal server error'
        }
    }
};