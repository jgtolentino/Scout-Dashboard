/**
 * Consumer Sentiment Trend API Endpoint
 * Route: /api/consumer/sentiment-trend
 * Purpose: Serve sentiment trend analysis data for Consumer Behavior dashboard
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
 * Classify sentiment score into categories
 */
function classifySentiment(score) {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
}

/**
 * Transform database results for frontend consumption
 */
function transformResults(results) {
    const response = {
        sentimentTimeSeries: [],
        sentimentByGender: [],
        sentimentByAgeBracket: [],
        sentimentByRequestGroup: [],
        hourlysentiment: [],
        sentimentDistribution: [],
        metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'v_SentimentTrendAnalysis'
        }
    };
    
    if (results.recordset && results.recordset.length > 0) {
        const data = results.recordset;
        
        // Process sentiment data by various dimensions
        const timeSeriesData = {};
        const genderData = {};
        const ageData = {};
        const requestGroupData = {};
        const hourlyData = {};
        const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
        
        data.forEach(row => {
            const avgSentiment = parseFloat(row.AvgSentiment) || 0;
            const sentimentCategory = classifySentiment(avgSentiment);
            
            // Time series data
            const dateKey = row.InteractionDate ? format(new Date(row.InteractionDate), 'yyyy-MM-dd') : 'Unknown';
            if (!timeSeriesData[dateKey]) {
                timeSeriesData[dateKey] = {
                    date: dateKey,
                    avgSentiment: 0,
                    positiveCount: 0,
                    neutralCount: 0,
                    negativeCount: 0,
                    totalInteractions: 0,
                    sentimentSum: 0,
                    count: 0
                };
            }
            timeSeriesData[dateKey].positiveCount += row.PositiveInteractions || 0;
            timeSeriesData[dateKey].neutralCount += row.NeutralInteractions || 0;
            timeSeriesData[dateKey].negativeCount += row.NegativeInteractions || 0;
            timeSeriesData[dateKey].totalInteractions += row.InteractionCount || 0;
            timeSeriesData[dateKey].sentimentSum += avgSentiment;
            timeSeriesData[dateKey].count += 1;
            
            // Gender sentiment breakdown
            const genderKey = row.Gender || 'Unknown';
            if (!genderData[genderKey]) {
                genderData[genderKey] = {
                    gender: genderKey,
                    avgSentiment: 0,
                    positiveCount: 0,
                    neutralCount: 0,
                    negativeCount: 0,
                    totalInteractions: 0,
                    sentimentSum: 0,
                    count: 0
                };
            }
            genderData[genderKey].positiveCount += row.PositiveInteractions || 0;
            genderData[genderKey].neutralCount += row.NeutralInteractions || 0;
            genderData[genderKey].negativeCount += row.NegativeInteractions || 0;
            genderData[genderKey].totalInteractions += row.InteractionCount || 0;
            genderData[genderKey].sentimentSum += avgSentiment;
            genderData[genderKey].count += 1;
            
            // Age bracket sentiment breakdown
            const ageKey = row.AgeBracket || 'Unknown';
            if (!ageData[ageKey]) {
                ageData[ageKey] = {
                    ageBracket: ageKey,
                    avgSentiment: 0,
                    positiveCount: 0,
                    neutralCount: 0,
                    negativeCount: 0,
                    totalInteractions: 0,
                    sentimentSum: 0,
                    count: 0
                };
            }
            ageData[ageKey].positiveCount += row.PositiveInteractions || 0;
            ageData[ageKey].neutralCount += row.NeutralInteractions || 0;
            ageData[ageKey].negativeCount += row.NegativeInteractions || 0;
            ageData[ageKey].totalInteractions += row.InteractionCount || 0;
            ageData[ageKey].sentimentSum += avgSentiment;
            ageData[ageKey].count += 1;
            
            // Request group sentiment breakdown
            const groupKey = row.RequestGroup || 'Unknown';
            if (!requestGroupData[groupKey]) {
                requestGroupData[groupKey] = {
                    requestGroup: groupKey,
                    avgSentiment: 0,
                    positiveCount: 0,
                    neutralCount: 0,
                    negativeCount: 0,
                    totalInteractions: 0,
                    sentimentSum: 0,
                    count: 0
                };
            }
            requestGroupData[groupKey].positiveCount += row.PositiveInteractions || 0;
            requestGroupData[groupKey].neutralCount += row.NeutralInteractions || 0;
            requestGroupData[groupKey].negativeCount += row.NegativeInteractions || 0;
            requestGroupData[groupKey].totalInteractions += row.InteractionCount || 0;
            requestGroupData[groupKey].sentimentSum += avgSentiment;
            requestGroupData[groupKey].count += 1;
            
            // Hourly sentiment pattern
            const hourKey = row.HourOfDay;
            if (hourKey !== null && hourKey !== undefined) {
                if (!hourlyData[hourKey]) {
                    hourlyData[hourKey] = {
                        hour: hourKey,
                        avgSentiment: 0,
                        positiveCount: 0,
                        neutralCount: 0,
                        negativeCount: 0,
                        totalInteractions: 0,
                        sentimentSum: 0,
                        count: 0
                    };
                }
                hourlyData[hourKey].positiveCount += row.PositiveInteractions || 0;
                hourlyData[hourKey].neutralCount += row.NeutralInteractions || 0;
                hourlyData[hourKey].negativeCount += row.NegativeInteractions || 0;
                hourlyData[hourKey].totalInteractions += row.InteractionCount || 0;
                hourlyData[hourKey].sentimentSum += avgSentiment;
                hourlyData[hourKey].count += 1;
            }
            
            // Overall sentiment distribution
            sentimentCounts.Positive += row.PositiveInteractions || 0;
            sentimentCounts.Neutral += row.NeutralInteractions || 0;
            sentimentCounts.Negative += row.NegativeInteractions || 0;
        });
        
        // Finalize sentiment calculations
        const calculateFinalMetrics = (item) => ({
            ...item,
            avgSentiment: item.count > 0 ? (item.sentimentSum / item.count).toFixed(3) : 0,
            positivePercentage: item.totalInteractions > 0 ? 
                ((item.positiveCount / item.totalInteractions) * 100).toFixed(2) : 0,
            neutralPercentage: item.totalInteractions > 0 ? 
                ((item.neutralCount / item.totalInteractions) * 100).toFixed(2) : 0,
            negativePercentage: item.totalInteractions > 0 ? 
                ((item.negativeCount / item.totalInteractions) * 100).toFixed(2) : 0
        });
        
        response.sentimentTimeSeries = Object.values(timeSeriesData)
            .map(calculateFinalMetrics)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        response.sentimentByGender = Object.values(genderData).map(calculateFinalMetrics);
        response.sentimentByAgeBracket = Object.values(ageData).map(calculateFinalMetrics);
        response.sentimentByRequestGroup = Object.values(requestGroupData).map(calculateFinalMetrics);
        
        response.hourlysentiment = Object.values(hourlyData)
            .map(item => ({
                ...calculateFinalMetrics(item),
                label: `${item.hour}:00`
            }))
            .sort((a, b) => a.hour - b.hour);
            
        // Overall sentiment distribution
        const totalSentimentInteractions = sentimentCounts.Positive + sentimentCounts.Neutral + sentimentCounts.Negative;
        response.sentimentDistribution = [
            {
                category: 'Positive',
                count: sentimentCounts.Positive,
                percentage: totalSentimentInteractions > 0 ? 
                    ((sentimentCounts.Positive / totalSentimentInteractions) * 100).toFixed(2) : 0
            },
            {
                category: 'Neutral',
                count: sentimentCounts.Neutral,
                percentage: totalSentimentInteractions > 0 ? 
                    ((sentimentCounts.Neutral / totalSentimentInteractions) * 100).toFixed(2) : 0
            },
            {
                category: 'Negative',
                count: sentimentCounts.Negative,
                percentage: totalSentimentInteractions > 0 ? 
                    ((sentimentCounts.Negative / totalSentimentInteractions) * 100).toFixed(2) : 0
            }
        ];
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
        
        console.log(`[Sentiment Trend API] Request: ${parsedStartDate} to ${parsedEndDate}, gender: ${gender || 'all'}, age: ${ageBracket || 'all'}`);
        
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
        
        const result = await request.execute('sp_GetSentimentTrends');
        
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
        const totalInteractions = transformedData.sentimentDistribution.reduce((sum, item) => sum + item.count, 0);
        const overallPositivePercentage = transformedData.sentimentDistribution.find(item => item.category === 'Positive')?.percentage || 0;
        const avgSentiment = transformedData.sentimentTimeSeries.length > 0 ?
            transformedData.sentimentTimeSeries.reduce((sum, item) => sum + parseFloat(item.avgSentiment), 0) / transformedData.sentimentTimeSeries.length : 0;
            
        transformedData.metadata.summary = {
            totalInteractions,
            overallPositivePercentage,
            avgSentiment: avgSentiment.toFixed(3),
            dataPoints: result.recordset ? result.recordset.length : 0
        };
        
        res.status(200).json(transformedData);
        
        console.log(`[Sentiment Trend API] Success: ${totalInteractions} interactions, ${overallPositivePercentage}% positive`);
        
    } catch (error) {
        console.error('[Sentiment Trend API] Error:', error);
        
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
            console.error('[Sentiment Trend API] Connection close error:', closeError);
        }
    }
}

// Export for different environments
module.exports = handler;
module.exports.default = handler;

// Express.js route export
module.exports.expressRoute = (app) => {
    app.get('/api/consumer/sentiment-trend', handler);
};

// Validation schema for OpenAPI/Swagger documentation
module.exports.schema = {
    summary: 'Get consumer sentiment trend analysis',
    description: 'Returns sentiment trends segmented by demographics and time',
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
            description: 'Sentiment trend data',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            sentimentTimeSeries: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        date: { type: 'string' },
                                        avgSentiment: { type: 'string' },
                                        positivePercentage: { type: 'string' },
                                        negativePercentage: { type: 'string' },
                                        totalInteractions: { type: 'integer' }
                                    }
                                }
                            },
                            sentimentByGender: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        gender: { type: 'string' },
                                        avgSentiment: { type: 'string' },
                                        positivePercentage: { type: 'string' }
                                    }
                                }
                            },
                            sentimentDistribution: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        category: { type: 'string' },
                                        count: { type: 'integer' },
                                        percentage: { type: 'string' }
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