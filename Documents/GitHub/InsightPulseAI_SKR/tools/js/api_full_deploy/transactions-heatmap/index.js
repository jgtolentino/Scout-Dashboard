/**
 * Transaction Heatmap API Endpoint
 * Route: /api/transactions/heatmap
 * Purpose: Serve geographic heatmap data for Transaction Density visualization
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
 * Transform database results for heatmap visualization
 */
function transformResults(results) {
    const response = {
        heatmapData: [],
        densityMetrics: [],
        geographicSummary: {},
        metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'v_TransactionDensity'
        }
    };
    
    // Process each result set from stored procedure
    if (results.recordsets && results.recordsets.length >= 2) {
        // Heatmap data (for geographic visualization)
        response.heatmapData = results.recordsets[0].map(row => ({
            storeId: row.StoreID,
            storeName: row.StoreName || `Store ${row.StoreID}`,
            location: row.Location || 'Unknown',
            latitude: parseFloat(row.Latitude) || 0,
            longitude: parseFloat(row.Longitude) || 0,
            transactionCount: row.transaction_count,
            avgAmount: parseFloat(row.avg_amount) || 0,
            density: parseFloat(row.density_score) || 0,
            barangay: row.Barangay || 'Unknown',
            municipality: row.Municipality || 'Unknown',
            // Color intensity for heatmap
            intensity: Math.min(100, (row.transaction_count / 10) * 100) // Scale to 0-100
        }));
        
        // Density metrics by geographic area
        response.densityMetrics = results.recordsets[1].map(row => ({
            area: row.area_name,
            areaType: row.area_type, // 'barangay', 'municipality', etc.
            totalTransactions: row.total_transactions,
            averageDensity: parseFloat(row.avg_density) || 0,
            storeCount: row.store_count,
            transactionsPerStore: row.store_count > 0 ? 
                (row.total_transactions / row.store_count).toFixed(2) : 0
        }));
        
        // Geographic summary
        if (results.recordsets.length >= 3 && results.recordsets[2].length > 0) {
            const summary = results.recordsets[2][0];
            response.geographicSummary = {
                totalStores: summary.total_stores,
                totalTransactions: summary.total_transactions,
                avgTransactionsPerStore: parseFloat(summary.avg_transactions_per_store) || 0,
                highestDensityArea: summary.highest_density_area || 'N/A',
                lowestDensityArea: summary.lowest_density_area || 'N/A',
                coverageArea: summary.coverage_area || 'N/A'
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
        const { startDate, endDate } = req.query;
        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateParams(startDate, endDate);
        
        console.log(`[Transaction Heatmap API] Request: ${parsedStartDate} to ${parsedEndDate}`);
        
        // Connect to database
        const pool = await sql.connect(dbConfig);
        
        // Execute stored procedure (fallback to direct query if stored procedure doesn't exist)
        const request = pool.request();
        request.input('StartDate', sql.Date, parsedStartDate);
        request.input('EndDate', sql.Date, parsedEndDate);
        
        let result;
        try {
            // Try to execute the stored procedure
            result = await request.execute('sp_GetTransactionDensity');
        } catch (spError) {
            console.log('[Transaction Heatmap API] Stored procedure not found, using fallback query');
            
            // Fallback to a direct query
            const fallbackQuery = `
                SELECT 
                    s.StoreID,
                    s.StoreName,
                    s.Location,
                    s.Latitude,
                    s.Longitude,
                    s.Barangay,
                    COUNT(si.TransactionDate) as transaction_count,
                    AVG(CAST(si.TransactionAmount AS FLOAT)) as avg_amount,
                    COUNT(si.TransactionDate) * 1.0 / NULLIF(DATEDIFF(day, @StartDate, @EndDate), 0) as density_score
                FROM Stores s
                LEFT JOIN SalesInteractions si ON s.StoreID = si.StoreID
                    AND si.TransactionDate BETWEEN @StartDate AND @EndDate
                GROUP BY s.StoreID, s.StoreName, s.Location, s.Latitude, s.Longitude, s.Barangay
                ORDER BY transaction_count DESC;
                
                -- Summary query
                SELECT 
                    COUNT(DISTINCT s.StoreID) as total_stores,
                    COUNT(si.TransactionDate) as total_transactions,
                    AVG(CAST(store_transactions.transaction_count AS FLOAT)) as avg_transactions_per_store,
                    'Sample Area' as highest_density_area,
                    'Sample Area' as lowest_density_area,
                    'Metro Manila' as coverage_area
                FROM Stores s
                LEFT JOIN SalesInteractions si ON s.StoreID = si.StoreID
                    AND si.TransactionDate BETWEEN @StartDate AND @EndDate
                CROSS APPLY (
                    SELECT COUNT(*) as transaction_count
                    FROM SalesInteractions si2 
                    WHERE si2.StoreID = s.StoreID 
                    AND si2.TransactionDate BETWEEN @StartDate AND @EndDate
                ) store_transactions;
            `;
            
            const fallbackRequest = pool.request();
            fallbackRequest.input('StartDate', sql.Date, parsedStartDate);
            fallbackRequest.input('EndDate', sql.Date, parsedEndDate);
            
            result = await fallbackRequest.query(fallbackQuery);
        }
        
        // Transform results for frontend
        const transformedData = transformResults(result);
        
        // Add request metadata
        transformedData.metadata.request = {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            requestTime: new Date().toISOString()
        };
        
        res.status(200).json(transformedData);
        
        console.log(`[Transaction Heatmap API] Success: ${transformedData.heatmapData.length} stores processed`);
        
    } catch (error) {
        console.error('[Transaction Heatmap API] Error:', error);
        
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
            console.error('[Transaction Heatmap API] Connection close error:', closeError);
        }
    }
}

// Export for different environments
module.exports = handler;
module.exports.default = handler;