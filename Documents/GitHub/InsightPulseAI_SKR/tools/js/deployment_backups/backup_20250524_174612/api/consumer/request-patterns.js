/**
 * Consumer Request Patterns API Endpoint
 * Route: /api/consumer/request-patterns
 * Purpose: Serve request pattern analysis data for Consumer Behavior dashboard
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
        requestPatterns: [],
        hourlyDistribution: [],
        dayOfWeekDistribution: [],
        genderBreakdown: [],
        ageBracketBreakdown: [],
        requestGroupAnalysis: [],
        metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'v_RequestPatternsAnalysis'
        }
    };
    
    if (results.recordset && results.recordset.length > 0) {
        const data = results.recordset;
        
        // Process request patterns by type
        const patternsByType = {};
        const hourlyData = {};
        const dayOfWeekData = {};
        const genderData = {};
        const ageBracketData = {};
        const requestGroupData = {};
        
        data.forEach(row => {
            // Request patterns by type
            const typeKey = row.RequestType || 'unknown';
            if (!patternsByType[typeKey]) {
                patternsByType[typeKey] = {
                    requestType: typeKey,
                    totalRequests: 0,
                    avgResponseTime: 0,
                    avgSentiment: 0,
                    count: 0
                };
            }
            patternsByType[typeKey].totalRequests += row.RequestCount || 0;
            patternsByType[typeKey].avgResponseTime += row.AvgResponseTime || 0;
            patternsByType[typeKey].avgSentiment += row.AvgSentiment || 0;
            patternsByType[typeKey].count += 1;
            
            // Hourly distribution
            const hourKey = row.HourOfDay;
            if (hourKey !== null && hourKey !== undefined) {
                if (!hourlyData[hourKey]) {
                    hourlyData[hourKey] = { hour: hourKey, requests: 0, avgSentiment: 0, count: 0 };
                }
                hourlyData[hourKey].requests += row.RequestCount || 0;
                hourlyData[hourKey].avgSentiment += row.AvgSentiment || 0;
                hourlyData[hourKey].count += 1;
            }
            
            // Day of week distribution
            const dayKey = row.DayOfWeek || 'Unknown';
            if (!dayOfWeekData[dayKey]) {
                dayOfWeekData[dayKey] = { dayOfWeek: dayKey, requests: 0, avgSentiment: 0, count: 0 };
            }
            dayOfWeekData[dayKey].requests += row.RequestCount || 0;
            dayOfWeekData[dayKey].avgSentiment += row.AvgSentiment || 0;
            dayOfWeekData[dayKey].count += 1;
            
            // Gender breakdown
            const genderKey = row.Gender || 'Unknown';
            if (!genderData[genderKey]) {
                genderData[genderKey] = { gender: genderKey, requests: 0, avgSentiment: 0, count: 0 };
            }
            genderData[genderKey].requests += row.RequestCount || 0;
            genderData[genderKey].avgSentiment += row.AvgSentiment || 0;
            genderData[genderKey].count += 1;
            
            // Age bracket breakdown
            const ageKey = row.AgeBracket || 'Unknown';
            if (!ageBracketData[ageKey]) {
                ageBracketData[ageKey] = { ageBracket: ageKey, requests: 0, avgSentiment: 0, count: 0 };
            }
            ageBracketData[ageKey].requests += row.RequestCount || 0;
            ageBracketData[ageKey].avgSentiment += row.AvgSentiment || 0;
            ageBracketData[ageKey].count += 1;
            
            // Request group analysis
            const groupKey = row.RequestGroup || 'Unknown';
            if (!requestGroupData[groupKey]) {
                requestGroupData[groupKey] = { requestGroup: groupKey, requests: 0, avgSentiment: 0, count: 0 };
            }
            requestGroupData[groupKey].requests += row.RequestCount || 0;
            requestGroupData[groupKey].avgSentiment += row.AvgSentiment || 0;
            requestGroupData[groupKey].count += 1;
        });
        
        // Finalize averages and format data
        response.requestPatterns = Object.values(patternsByType).map(pattern => ({
            ...pattern,
            avgResponseTime: pattern.count > 0 ? (pattern.avgResponseTime / pattern.count).toFixed(2) : 0,
            avgSentiment: pattern.count > 0 ? (pattern.avgSentiment / pattern.count).toFixed(3) : 0
        }));
        
        response.hourlyDistribution = Object.values(hourlyData)
            .map(item => ({
                ...item,
                avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0,
                label: `${item.hour}:00`
            }))
            .sort((a, b) => a.hour - b.hour);
            
        response.dayOfWeekDistribution = Object.values(dayOfWeekData).map(item => ({
            ...item,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
        }));
        
        response.genderBreakdown = Object.values(genderData).map(item => ({
            ...item,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
        }));
        
        response.ageBracketBreakdown = Object.values(ageBracketData).map(item => ({
            ...item,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
        }));
        
        response.requestGroupAnalysis = Object.values(requestGroupData).map(item => ({
            ...item,
            avgSentiment: item.count > 0 ? (item.avgSentiment / item.count).toFixed(3) : 0
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
        
        console.log(`[Request Patterns API] Request: ${parsedStartDate} to ${parsedEndDate}, gender: ${gender || 'all'}, age: ${ageBracket || 'all'}`);
        
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
        
        const result = await request.execute('sp_GetRequestPatterns');
        
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
        const totalRequests = transformedData.requestPatterns.reduce((sum, p) => sum + p.totalRequests, 0);
        const avgOverallSentiment = transformedData.requestPatterns.length > 0 ?
            transformedData.requestPatterns.reduce((sum, p) => sum + parseFloat(p.avgSentiment), 0) / transformedData.requestPatterns.length : 0;
            
        transformedData.metadata.summary = {
            totalRequests,
            uniqueRequestTypes: transformedData.requestPatterns.length,
            avgOverallSentiment: avgOverallSentiment.toFixed(3),
            dataPoints: result.recordset ? result.recordset.length : 0
        };
        
        res.status(200).json(transformedData);
        
        console.log(`[Request Patterns API] Success: ${totalRequests} total requests analyzed`);
        
    } catch (error) {
        console.error('[Request Patterns API] Error:', error);
        
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
            console.error('[Request Patterns API] Connection close error:', closeError);
        }
    }
}

// Export for different environments
module.exports = handler;
module.exports.default = handler;

// Express.js route export
module.exports.expressRoute = (app) => {
    app.get('/api/consumer/request-patterns', handler);
};

// Validation schema for OpenAPI/Swagger documentation
module.exports.schema = {
    summary: 'Get consumer request patterns analysis',
    description: 'Returns request pattern data segmented by demographics and time',
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
            description: 'Request patterns data',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            requestPatterns: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        requestType: { type: 'string' },
                                        totalRequests: { type: 'integer' },
                                        avgResponseTime: { type: 'string' },
                                        avgSentiment: { type: 'string' }
                                    }
                                }
                            },
                            hourlyDistribution: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        hour: { type: 'integer' },
                                        requests: { type: 'integer' },
                                        avgSentiment: { type: 'string' }
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