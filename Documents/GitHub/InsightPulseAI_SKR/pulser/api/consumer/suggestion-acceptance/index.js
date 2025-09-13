/**
 * Consumer Suggestion Acceptance API Endpoint
 * Route: /api/consumer/suggestion-acceptance
 * Purpose: Serve suggestion acceptance rate analysis for Consumer Behavior dashboard
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
        acceptanceRates: [],
        genderAcceptance: [],
        ageBracketAcceptance: [],
        requestGroupAcceptance: [],
        timeSeriesAcceptance: [],
        metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'v_SuggestionAcceptanceAnalysis'
        }
    };
    
    if (results.recordset && results.recordset.length > 0) {
        const data = results.recordset;
        
        // Process acceptance rates by various dimensions
        const genderData = {};
        const ageData = {};
        const requestGroupData = {};
        const timeSeriesData = {};
        
        data.forEach(row => {
            // Gender acceptance breakdown
            const genderKey = row.Gender || 'Unknown';
            if (!genderData[genderKey]) {
                genderData[genderKey] = {
                    gender: genderKey,
                    totalSuggestionsOffered: 0,
                    totalSuggestionsAccepted: 0,
                    acceptanceRate: 0,
                    avgSentiment: 0,
                    count: 0
                };
            }
            genderData[genderKey].totalSuggestionsOffered += row.TotalSuggestionsOffered || 0;
            genderData[genderKey].totalSuggestionsAccepted += row.TotalSuggestionsAccepted || 0;
            genderData[genderKey].avgSentiment += row.AvgSentimentWhenSuggested || 0;
            genderData[genderKey].count += 1;
            
            // Age bracket acceptance breakdown
            const ageKey = row.AgeBracket || 'Unknown';
            if (!ageData[ageKey]) {
                ageData[ageKey] = {
                    ageBracket: ageKey,
                    totalSuggestionsOffered: 0,
                    totalSuggestionsAccepted: 0,
                    acceptanceRate: 0,
                    avgSentiment: 0,
                    count: 0
                };
            }
            ageData[ageKey].totalSuggestionsOffered += row.TotalSuggestionsOffered || 0;
            ageData[ageKey].totalSuggestionsAccepted += row.TotalSuggestionsAccepted || 0;
            ageData[ageKey].avgSentiment += row.AvgSentimentWhenSuggested || 0;
            ageData[ageKey].count += 1;
            
            // Request group acceptance breakdown
            const groupKey = row.RequestGroup || 'Unknown';
            if (!requestGroupData[groupKey]) {
                requestGroupData[groupKey] = {
                    requestGroup: groupKey,
                    totalSuggestionsOffered: 0,
                    totalSuggestionsAccepted: 0,
                    acceptanceRate: 0,
                    avgSentiment: 0,
                    count: 0
                };
            }
            requestGroupData[groupKey].totalSuggestionsOffered += row.TotalSuggestionsOffered || 0;
            requestGroupData[groupKey].totalSuggestionsAccepted += row.TotalSuggestionsAccepted || 0;
            requestGroupData[groupKey].avgSentiment += row.AvgSentimentWhenSuggested || 0;
            requestGroupData[groupKey].count += 1;
            
            // Time series data
            const dateKey = row.InteractionDate ? format(new Date(row.InteractionDate), 'yyyy-MM-dd') : 'Unknown';
            if (!timeSeriesData[dateKey]) {
                timeSeriesData[dateKey] = {
                    date: dateKey,
                    totalSuggestionsOffered: 0,
                    totalSuggestionsAccepted: 0,
                    acceptanceRate: 0,
                    avgSentiment: 0,
                    count: 0
                };
            }
            timeSeriesData[dateKey].totalSuggestionsOffered += row.TotalSuggestionsOffered || 0;
            timeSeriesData[dateKey].totalSuggestionsAccepted += row.TotalSuggestionsAccepted || 0;
            timeSeriesData[dateKey].avgSentiment += row.AvgSentimentWhenSuggested || 0;
            timeSeriesData[dateKey].count += 1;
        });
        
        // Calculate acceptance rates and finalize data
        response.genderAcceptance = Object.values(genderData).map(item => ({
            ...item,
            acceptanceRate: item.totalSuggestionsOffered > 0 ? 
                ((item.totalSuggestionsAccepted / item.totalSuggestionsOffered) * 100).toFixed(2) : 0,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
        }));
        
        response.ageBracketAcceptance = Object.values(ageData).map(item => ({
            ...item,
            acceptanceRate: item.totalSuggestionsOffered > 0 ? 
                ((item.totalSuggestionsAccepted / item.totalSuggestionsOffered) * 100).toFixed(2) : 0,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
        }));
        
        response.requestGroupAcceptance = Object.values(requestGroupData).map(item => ({
            ...item,
            acceptanceRate: item.totalSuggestionsOffered > 0 ? 
                ((item.totalSuggestionsAccepted / item.totalSuggestionsOffered) * 100).toFixed(2) : 0,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
        }));
        
        response.timeSeriesAcceptance = Object.values(timeSeriesData)
            .map(item => ({
                ...item,
                acceptanceRate: item.totalSuggestionsOffered > 0 ? 
                    ((item.totalSuggestionsAccepted / item.totalSuggestionsOffered) * 100).toFixed(2) : 0,
                avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Overall acceptance rates for summary
        response.acceptanceRates = data.map(row => ({
            gender: row.Gender || 'Unknown',
            ageBracket: row.AgeBracket || 'Unknown',
            requestGroup: row.RequestGroup || 'Unknown',
            acceptanceRate: row.AvgAcceptanceRate ? parseFloat(row.AvgAcceptanceRate).toFixed(2) : 0,
            suggestionsOffered: row.TotalSuggestionsOffered || 0,
            suggestionsAccepted: row.TotalSuggestionsAccepted || 0,
            avgSentiment: row.AvgSentimentWhenSuggested ? parseFloat(row.AvgSentimentWhenSuggested).toFixed(3) : 0,
            date: row.InteractionDate ? format(new Date(row.InteractionDate), 'yyyy-MM-dd') : null
        }));
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
        const { startDate, endDate, gender, ageBracket } = req.query;
        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateParams(startDate, endDate);
        
        console.log(`[Suggestion Acceptance API] Request: ${parsedStartDate} to ${parsedEndDate}, gender: ${gender || 'all'}, age: ${ageBracket || 'all'}`);
        
        // Connect to database
        const pool = await sql.connect(dbConfig);
        
        // Execute stored procedure
        const request = pool.request();
        request.input('StartDate', sql.DateTime2, parsedStartDate);
        request.input('EndDate', sql.DateTime2, parsedEndDate);
        
        if (gender) {
            request.input('Gender', sql.NVarChar(10), gender);
        }
        
        if (ageBracket) {
            request.input('AgeBracket', sql.NVarChar(20), ageBracket);
        }
        
        const result = await request.execute('sp_GetSuggestionAcceptance');
        
        // Transform results for frontend
        const transformedData = transformResults(result);
        
        // Add request metadata
        transformedData.metadata.request = {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            gender: gender || null,
            ageBracket: ageBracket || null,
            requestTime: new Date().toISOString()
        };
        
        // Calculate summary statistics
        const totalSuggestionsOffered = transformedData.genderAcceptance.reduce((sum, item) => sum + item.totalSuggestionsOffered, 0);
        const totalSuggestionsAccepted = transformedData.genderAcceptance.reduce((sum, item) => sum + item.totalSuggestionsAccepted, 0);
        const overallAcceptanceRate = totalSuggestionsOffered > 0 ? 
            ((totalSuggestionsAccepted / totalSuggestionsOffered) * 100).toFixed(2) : 0;
            
        transformedData.metadata.summary = {
            totalSuggestionsOffered,
            totalSuggestionsAccepted,
            overallAcceptanceRate,
            dataPoints: result.recordset ? result.recordset.length : 0
        };
        
        res.status(200).json(transformedData);
        
        console.log(`[Suggestion Acceptance API] Success: ${overallAcceptanceRate}% acceptance rate`);
        
    } catch (error) {
        console.error('[Suggestion Acceptance API] Error:', error);
        
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
            console.error('[Suggestion Acceptance API] Connection close error:', closeError);
        }
    }
}

// Export for different environments
module.exports = handler;
module.exports.default = handler;

// Express.js route export
module.exports.expressRoute = (app) => {
    app.get('/api/consumer/suggestion-acceptance', handler);
};

// Validation schema for OpenAPI/Swagger documentation
module.exports.schema = {
    summary: 'Get suggestion acceptance rate analysis',
    description: 'Returns suggestion acceptance rates segmented by demographics and time',
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
            name: 'gender',
            in: 'query',
            description: 'Filter by gender',
            schema: { type: 'string', enum: ['Male', 'Female', 'Non-binary'] }
        },
        {
            name: 'ageBracket',
            in: 'query',
            description: 'Filter by age bracket',
            schema: { type: 'string', enum: ['18-25', '26-35', '36-45', '46-55', '55+'] }
        }
    ],
    responses: {
        200: {
            description: 'Suggestion acceptance data',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            genderAcceptance: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        gender: { type: 'string' },
                                        totalSuggestionsOffered: { type: 'integer' },
                                        totalSuggestionsAccepted: { type: 'integer' },
                                        acceptanceRate: { type: 'string' },
                                        avgSentiment: { type: 'string' }
                                    }
                                }
                            },
                            timeSeriesAcceptance: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        date: { type: 'string' },
                                        acceptanceRate: { type: 'string' },
                                        suggestionsOffered: { type: 'integer' }
                                    }
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