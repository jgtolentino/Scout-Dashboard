/**
 * Consumer Behavior Analysis API Endpoint
 * Route: /api/analytics/behavior
 * Purpose: Serve consumer behavior insights and patterns
 */

const sql = require('mssql');

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
    }
};

/**
 * Generate demo consumer behavior data
 */
function generateBehaviorData() {
    const timeSlots = ['06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00', '21:00-24:00'];
    const demographics = ['18-25', '26-35', '36-45', '46-55', '55+'];
    const sentiments = ['Positive', 'Neutral', 'Negative'];
    const shopperTypes = ['Regular', 'Occasional', 'First-time', 'Returning'];
    
    return {
        shoppingPatterns: timeSlots.map(slot => ({
            timeSlot: slot,
            customerCount: Math.floor(Math.random() * 200) + 50,
            avgBasketSize: Math.random() * 1500 + 300,
            avgDuration: Math.floor(Math.random() * 20) + 5,
            peakActivity: Math.random() > 0.7
        })),
        
        demographics: demographics.map(age => ({
            ageGroup: age,
            percentage: Math.random() * 25 + 10,
            avgSpend: Math.random() * 2000 + 500,
            visitFrequency: Math.random() * 5 + 1,
            preferredTime: timeSlots[Math.floor(Math.random() * timeSlots.length)]
        })),
        
        sentimentAnalysis: sentiments.map(sentiment => ({
            sentiment: sentiment,
            count: Math.floor(Math.random() * 100) + 20,
            percentage: Math.random() * 40 + 20,
            avgRating: Math.random() * 2 + 3,
            keywords: sentiment === 'Positive' ? ['great', 'helpful', 'quality'] :
                     sentiment === 'Negative' ? ['slow', 'expensive', 'limited'] :
                     ['okay', 'average', 'decent']
        })),
        
        shopperProfiles: shopperTypes.map(type => ({
            type: type,
            count: Math.floor(Math.random() * 150) + 30,
            avgSpend: Math.random() * 1800 + 400,
            conversionRate: Math.random() * 40 + 60,
            loyaltyScore: Math.random() * 100
        }))
    };
}

/**
 * Main API handler
 */
async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ 
            error: 'Method not allowed', 
            allowedMethods: ['GET'] 
        });
        return;
    }
    
    try {
        console.log('[Consumer Behavior API] Generating behavior analysis...');
        
        const data = generateBehaviorData();
        
        // Calculate insights
        const peakHour = data.shoppingPatterns.reduce((prev, current) => 
            prev.customerCount > current.customerCount ? prev : current
        );
        
        const dominantAge = data.demographics.reduce((prev, current) => 
            prev.percentage > current.percentage ? prev : current
        );
        
        const overallSentiment = data.sentimentAnalysis.reduce((prev, current) => 
            prev.percentage > current.percentage ? prev : current
        );
        
        const response = {
            ok: true,
            data: {
                shoppingPatterns: data.shoppingPatterns,
                demographics: data.demographics,
                sentimentAnalysis: data.sentimentAnalysis,
                shopperProfiles: data.shopperProfiles,
                insights: {
                    peakShoppingTime: peakHour.timeSlot,
                    dominantDemographic: dominantAge.ageGroup,
                    overallSentiment: overallSentiment.sentiment,
                    avgBasketValue: data.shoppingPatterns.reduce((sum, p) => sum + p.avgBasketSize, 0) / data.shoppingPatterns.length,
                    totalCustomers: data.shoppingPatterns.reduce((sum, p) => sum + p.customerCount, 0)
                }
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'Demo - Consumer Behavior Analysis',
                period: 'Last 7 days',
                analysisType: 'Behavioral Patterns'
            }
        };
        
        res.status(200).json(response);
        console.log('[Consumer Behavior API] Success: Generated behavior analysis');
        
    } catch (error) {
        console.error('[Consumer Behavior API] Error:', error);
        
        res.status(500).json({
            ok: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to analyze consumer behavior',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = handler;