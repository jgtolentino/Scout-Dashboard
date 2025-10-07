module.exports = async function (context, req) {
    context.log('Transaction Heatmap API triggered');
    
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
    
    try {
        // Mock heatmap data for Geographic Transaction Density
        const mockHeatmapData = {
            locations: [
                {
                    latitude: 14.5995,
                    longitude: 120.9842,
                    transactionCount: 127,
                    totalAmount: 15750.80,
                    avgAmount: 124.02,
                    storeName: "Metro Manila Hub",
                    storeId: "MM001",
                    intensity: 1.0
                },
                {
                    latitude: 14.6760,
                    longitude: 121.0437,
                    transactionCount: 89,
                    totalAmount: 11234.50,
                    avgAmount: 126.23,
                    storeName: "Quezon City Store",
                    storeId: "QC002",
                    intensity: 0.7
                },
                {
                    latitude: 14.5547,
                    longitude: 121.0244,
                    transactionCount: 76,
                    totalAmount: 9856.75,
                    avgAmount: 129.69,
                    storeName: "Makati Branch",
                    storeId: "MK003",
                    intensity: 0.6
                },
                {
                    latitude: 14.6507,
                    longitude: 121.0494,
                    transactionCount: 92,
                    totalAmount: 12456.90,
                    avgAmount: 135.40,
                    storeName: "Mandaluyong Outlet",
                    storeId: "MD004",
                    intensity: 0.73
                },
                {
                    latitude: 14.5764,
                    longitude: 120.9772,
                    transactionCount: 65,
                    totalAmount: 8234.25,
                    avgAmount: 126.68,
                    storeName: "Manila Central",
                    storeId: "MN005",
                    intensity: 0.51
                },
                {
                    latitude: 14.5389,
                    longitude: 121.0270,
                    transactionCount: 58,
                    totalAmount: 7123.40,
                    avgAmount: 122.82,
                    storeName: "Taguig Store",
                    storeId: "TG006",
                    intensity: 0.46
                },
                {
                    latitude: 14.6194,
                    longitude: 121.0568,
                    transactionCount: 71,
                    totalAmount: 9567.80,
                    avgAmount: 134.76,
                    storeName: "Pasig Junction",
                    storeId: "PS007",
                    intensity: 0.56
                },
                {
                    latitude: 14.7110,
                    longitude: 121.0669,
                    transactionCount: 43,
                    totalAmount: 5234.60,
                    avgAmount: 121.73,
                    storeName: "Marikina Branch",
                    storeId: "MR008",
                    intensity: 0.34
                }
            ],
            metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'transaction_heatmap_poc_mock_v2',
                dateRange: {
                    startDate: req.query.startDate || '2025-05-15',
                    endDate: req.query.endDate || '2025-05-22'
                },
                totalLocations: 8,
                totalTransactions: 621,
                totalAmount: 79458.00,
                avgAmountPerLocation: 9932.25,
                request: {
                    startDate: req.query.startDate || '2025-05-15',
                    endDate: req.query.endDate || '2025-05-22',
                    requestTime: new Date().toISOString()
                }
            }
        };
        
        context.log(`Success: returning heatmap data for ${mockHeatmapData.locations.length} locations`);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(mockHeatmapData)
        };
        
    } catch (error) {
        context.log.error('Transaction Heatmap API Error:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to fetch heatmap data',
                timestamp: new Date().toISOString(),
                requestId: Math.random().toString(36).substr(2, 9)
            })
        };
    }
};