module.exports = async function (context, req) {
    context.log('Transaction Trends API triggered');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
        return;
    }
    
    // Return mock data for testing
    const mockData = {
        hourlyVolume: [
            { hour: 9, transactionCount: 45, avgAmount: 125.50, avgDuration: 32.5, label: "9:00", tooltip: "45 transactions at 9:00" },
            { hour: 10, transactionCount: 67, avgAmount: 89.25, avgDuration: 28.1, label: "10:00", tooltip: "67 transactions at 10:00" },
            { hour: 11, transactionCount: 78, avgAmount: 156.75, avgDuration: 41.2, label: "11:00", tooltip: "78 transactions at 11:00" },
            { hour: 12, transactionCount: 92, avgAmount: 203.40, avgDuration: 35.8, label: "12:00", tooltip: "92 transactions at 12:00" },
            { hour: 13, transactionCount: 85, avgAmount: 134.80, avgDuration: 29.5, label: "13:00", tooltip: "85 transactions at 13:00" }
        ],
        durationDistribution: [
            { category: 'Quick', count: 120, q1: 15, median: 25, q3: 35, minDuration: 10, maxDuration: 40, avgDuration: 25.5, lowerFence: 5, upperFence: 65 },
            { category: 'Normal', count: 180, q1: 35, median: 45, q3: 60, minDuration: 30, maxDuration: 70, avgDuration: 47.2, lowerFence: 20, upperFence: 97.5 },
            { category: 'Slow', count: 67, q1: 60, median: 85, q3: 120, minDuration: 55, maxDuration: 150, avgDuration: 88.3, lowerFence: 30, upperFence: 210 }
        ],
        summaryStats: {
            totalTransactions: 367,
            transactionsWithDuration: 352,
            transactionsWithAmount: 361,
            avgTransactionAmount: 141.94,
            avgDurationSeconds: 33.24,
            dateRangeStart: req.query.startDate || '2025-05-15',
            dateRangeEnd: req.query.endDate || '2025-05-22',
            durationCompleteness: '95.9',
            amountCompleteness: '98.4'
        },
        metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'mock_data_v2',
            request: {
                startDate: req.query.startDate || '2025-05-15',
                endDate: req.query.endDate || '2025-05-22',
                storeId: req.query.storeId || null,
                requestTime: new Date().toISOString()
            }
        }
    };
    
    context.log('Success: returning mock transaction trends data');
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(mockData)
    };
};