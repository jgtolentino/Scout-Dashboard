/**
 * Customer Profiling Analysis API Endpoint
 * Route: /api/analytics/profiling
 * Purpose: Serve customer segmentation and RFM analysis data
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
 * Generate demo customer profiling data
 */
function generateProfilingData() {
    const segments = [
        'Champions', 'Loyal Customers', 'Potential Loyalists', 
        'New Customers', 'Promising', 'Need Attention',
        'About to Sleep', 'At Risk', 'Cannot Lose Them'
    ];
    
    const loyaltyTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const locations = ['Manila', 'Quezon City', 'Makati', 'Cebu', 'Davao'];
    
    return {
        rfmSegments: segments.map(segment => ({
            segment: segment,
            customerCount: Math.floor(Math.random() * 500) + 50,
            avgRevenue: Math.random() * 5000 + 1000,
            avgFrequency: Math.random() * 10 + 1,
            avgRecency: Math.floor(Math.random() * 60) + 1,
            retentionRate: Math.random() * 40 + 50,
            growthPotential: Math.random() * 100
        })),
        
        loyaltyTiers: loyaltyTiers.map(tier => ({
            tier: tier,
            customerCount: Math.floor(Math.random() * 300) + 100,
            avgLifetimeValue: Math.random() * 10000 + 2000,
            avgOrderValue: Math.random() * 1500 + 300,
            engagementScore: Math.random() * 40 + 60,
            churnRisk: tier === 'Bronze' ? Math.random() * 30 + 20 : Math.random() * 15 + 5
        })),
        
        demographics: {
            ageDistribution: [
                { age: '18-25', count: Math.floor(Math.random() * 200) + 50, percentage: 15 },
                { age: '26-35', count: Math.floor(Math.random() * 300) + 100, percentage: 25 },
                { age: '36-45', count: Math.floor(Math.random() * 400) + 150, percentage: 30 },
                { age: '46-55', count: Math.floor(Math.random() * 250) + 100, percentage: 20 },
                { age: '55+', count: Math.floor(Math.random() * 150) + 50, percentage: 10 }
            ],
            genderSplit: [
                { gender: 'Female', count: Math.floor(Math.random() * 600) + 300, percentage: 55 },
                { gender: 'Male', count: Math.floor(Math.random() * 500) + 250, percentage: 45 }
            ],
            locationDistribution: locations.map(location => ({
                location: location,
                count: Math.floor(Math.random() * 200) + 50,
                avgSpend: Math.random() * 2000 + 500
            }))
        },
        
        customerJourney: [
            { stage: 'Awareness', customers: Math.floor(Math.random() * 1000) + 500, conversionRate: 25 },
            { stage: 'Interest', customers: Math.floor(Math.random() * 800) + 300, conversionRate: 40 },
            { stage: 'Consideration', customers: Math.floor(Math.random() * 600) + 200, conversionRate: 60 },
            { stage: 'Purchase', customers: Math.floor(Math.random() * 400) + 150, conversionRate: 80 },
            { stage: 'Retention', customers: Math.floor(Math.random() * 300) + 100, conversionRate: 70 },
            { stage: 'Advocacy', customers: Math.floor(Math.random() * 150) + 50, conversionRate: 90 }
        ]
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
        console.log('[Customer Profiling API] Generating customer profiling analysis...');
        
        const data = generateProfilingData();
        
        // Calculate key insights
        const topSegment = data.rfmSegments.reduce((prev, current) => 
            prev.customerCount > current.customerCount ? prev : current
        );
        
        const topTier = data.loyaltyTiers.reduce((prev, current) => 
            prev.customerCount > current.customerCount ? prev : current
        );
        
        const totalCustomers = data.rfmSegments.reduce((sum, seg) => sum + seg.customerCount, 0);
        const avgCustomerValue = data.loyaltyTiers.reduce((sum, tier) => sum + tier.avgLifetimeValue, 0) / data.loyaltyTiers.length;
        
        const response = {
            ok: true,
            data: {
                rfmSegments: data.rfmSegments,
                loyaltyTiers: data.loyaltyTiers,
                demographics: data.demographics,
                customerJourney: data.customerJourney,
                insights: {
                    totalCustomers: totalCustomers,
                    largestSegment: topSegment.segment,
                    dominantTier: topTier.tier,
                    avgCustomerValue: Math.round(avgCustomerValue),
                    retentionOpportunity: data.rfmSegments.filter(s => 
                        s.segment.includes('At Risk') || s.segment.includes('Sleep')
                    ).reduce((sum, s) => sum + s.customerCount, 0),
                    highValueCustomers: data.loyaltyTiers.filter(t => 
                        t.tier === 'Gold' || t.tier === 'Platinum'
                    ).reduce((sum, t) => sum + t.customerCount, 0)
                }
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'Demo - Customer Profiling Analysis',
                period: 'Last 90 days',
                analysisType: 'RFM Segmentation & Loyalty Analysis'
            }
        };
        
        res.status(200).json(response);
        console.log('[Customer Profiling API] Success: Generated profiling for', totalCustomers, 'customers');
        
    } catch (error) {
        console.error('[Customer Profiling API] Error:', error);
        
        res.status(500).json({
            ok: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate customer profiling',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = handler;