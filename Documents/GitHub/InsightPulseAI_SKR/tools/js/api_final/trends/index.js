module.exports = async function (context, req) {
    context.log('Transaction Trends API triggered');
    
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers, body: '' };
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        context.res = {
            status: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed', allowedMethods: ['GET'] })
        };
        return;
    }
    
    try {
        // For now, return mock data to test connectivity
        const mockData = {
            hourlyVolume: [
                { hour: 9, transactionCount: 45, avgAmount: 125.50, avgDuration: 32.5 },
                { hour: 10, transactionCount: 67, avgAmount: 89.25, avgDuration: 28.1 },
                { hour: 11, transactionCount: 78, avgAmount: 156.75, avgDuration: 41.2 },
                { hour: 12, transactionCount: 92, avgAmount: 203.40, avgDuration: 35.8 },
                { hour: 13, transactionCount: 85, avgAmount: 134.80, avgDuration: 29.5 }
            ],
            durationDistribution: [
                { category: 'Quick', count: 120, q1: 15, median: 25, q3: 35 },
                { category: 'Normal', count: 180, q1: 35, median: 45, q3: 60 },
                { category: 'Slow', count: 67, q1: 60, median: 85, q3: 120 }
            ],
            summaryStats: {
                totalTransactions: 367,
                avgTransactionAmount: 141.94,
                avgDurationSeconds: 33.24
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'mock_data',
                request: {
                    startDate: req.query.startDate || '2025-05-15',
                    endDate: req.query.endDate || '2025-05-22'
                }
            }
        };
        
        context.log('Success: returning mock data');
        
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify(mockData)
        };
        
    } catch (error) {
        context.log.error('Error:', error);
        
        context.res = {
            status: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to fetch trends data',
                timestamp: new Date().toISOString()
            })
        };
    }
};