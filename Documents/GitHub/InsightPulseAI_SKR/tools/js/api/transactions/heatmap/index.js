/**
 * Geographic Heatmap API Endpoint
 * Route: /api/transactions/heatmap
 * Purpose: Serve geographic data for store performance heatmap
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
 * Generate demo geographic heatmap data for Philippines
 */
function generateHeatmapData() {
    const philippinesCities = [
        { city: 'Manila', lat: 14.5995, lng: 120.9842, region: 'NCR' },
        { city: 'Quezon City', lat: 14.6760, lng: 121.0437, region: 'NCR' },
        { city: 'Makati', lat: 14.5547, lng: 121.0244, region: 'NCR' },
        { city: 'Pasig', lat: 14.5764, lng: 121.0851, region: 'NCR' },
        { city: 'Cebu City', lat: 10.3157, lng: 123.8854, region: 'Central Visayas' },
        { city: 'Davao', lat: 7.1907, lng: 125.4553, region: 'Davao' },
        { city: 'Zamboanga', lat: 6.9214, lng: 122.0790, region: 'Zamboanga Peninsula' },
        { city: 'Antipolo', lat: 14.5932, lng: 121.1735, region: 'CALABARZON' },
        { city: 'Pasay', lat: 14.5378, lng: 120.9896, region: 'NCR' },
        { city: 'Taguig', lat: 14.5176, lng: 121.0509, region: 'NCR' },
        { city: 'Valenzuela', lat: 14.7000, lng: 120.9833, region: 'NCR' },
        { city: 'Marikina', lat: 14.6507, lng: 121.1029, region: 'NCR' },
        { city: 'Iloilo City', lat: 10.7202, lng: 122.5621, region: 'Western Visayas' },
        { city: 'Caloocan', lat: 14.6507, lng: 120.9668, region: 'NCR' },
        { city: 'Cagayan de Oro', lat: 8.4542, lng: 124.6319, region: 'Northern Mindanao' }
    ];
    
    return philippinesCities.map((location, index) => {
        const baseIntensity = Math.random();
        const salesMultiplier = location.region === 'NCR' ? 1.5 : 1.0; // NCR gets higher sales
        
        return {
            storeId: `STORE-${String(index + 1).padStart(3, '0')}`,
            storeName: `${location.city} Branch`,
            city: location.city,
            region: location.region,
            latitude: location.lat + (Math.random() - 0.5) * 0.02, // Add slight variation
            longitude: location.lng + (Math.random() - 0.5) * 0.02,
            
            // Performance metrics
            dailySales: Math.floor((Math.random() * 50000 + 20000) * salesMultiplier),
            transactionCount: Math.floor((Math.random() * 200 + 50) * salesMultiplier),
            avgBasketSize: Math.random() * 800 + 200,
            customerFootfall: Math.floor((Math.random() * 500 + 100) * salesMultiplier),
            
            // Heatmap intensity (0-1 scale)
            intensity: baseIntensity * salesMultiplier,
            
            // Performance indicators
            performanceScore: Math.random() * 40 + 60, // 60-100 range
            growthRate: (Math.random() - 0.5) * 30, // -15% to +15%
            
            // Store details
            storeSize: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
            openDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            manager: `Manager ${index + 1}`,
            
            // Additional metrics for tooltips
            topProducts: [
                'Coca-Cola 350ml',
                'Lucky Me Pancit Canton',
                'Bear Brand Milk'
            ],
            lastUpdated: new Date().toISOString()
        };
    });
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
        console.log('[Geographic Heatmap API] Generating heatmap data...');
        
        const { region, minIntensity, format } = req.query;
        
        let stores = generateHeatmapData();
        
        // Apply filters
        if (region) {
            stores = stores.filter(store => 
                store.region.toLowerCase().includes(region.toLowerCase())
            );
        }
        
        if (minIntensity) {
            const threshold = parseFloat(minIntensity);
            stores = stores.filter(store => store.intensity >= threshold);
        }
        
        // Calculate regional summaries
        const regionSummary = stores.reduce((acc, store) => {
            if (!acc[store.region]) {
                acc[store.region] = {
                    region: store.region,
                    storeCount: 0,
                    totalSales: 0,
                    totalTransactions: 0,
                    avgPerformance: 0
                };
            }
            
            acc[store.region].storeCount++;
            acc[store.region].totalSales += store.dailySales;
            acc[store.region].totalTransactions += store.transactionCount;
            acc[store.region].avgPerformance += store.performanceScore;
            
            return acc;
        }, {});
        
        // Calculate averages for regional summary
        Object.values(regionSummary).forEach(region => {
            region.avgPerformance = (region.avgPerformance / region.storeCount).toFixed(1);
        });
        
        const response = {
            ok: true,
            data: {
                stores: stores,
                summary: {
                    totalStores: stores.length,
                    totalSales: stores.reduce((sum, store) => sum + store.dailySales, 0),
                    totalTransactions: stores.reduce((sum, store) => sum + store.transactionCount, 0),
                    avgIntensity: (stores.reduce((sum, store) => sum + store.intensity, 0) / stores.length).toFixed(3),
                    topPerformer: stores.reduce((prev, current) => 
                        prev.performanceScore > current.performanceScore ? prev : current
                    ),
                    regionalBreakdown: Object.values(regionSummary)
                },
                mapConfig: {
                    center: { lat: 12.8797, lng: 121.7740 }, // Philippines center
                    zoom: 6,
                    heatmapConfig: {
                        radius: 20,
                        maxIntensity: 1,
                        blur: 15,
                        gradient: {
                            0.0: '#3366cc',
                            0.3: '#06c4e8',
                            0.5: '#00ff00',
                            0.7: '#ffff00',
                            1.0: '#ff0000'
                        }
                    }
                }
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'Demo - Geographic Heatmap',
                coverage: 'Philippines Nationwide',
                lastUpdated: new Date().toISOString(),
                filters: {
                    region: region || 'all',
                    minIntensity: minIntensity || 'none'
                }
            }
        };
        
        // Handle CSV export
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="store_heatmap.csv"');
            
            const csvHeaders = 'storeId,storeName,city,region,latitude,longitude,dailySales,transactionCount,intensity,performanceScore';
            const csvData = stores.map(store => 
                `${store.storeId},${store.storeName},${store.city},${store.region},${store.latitude},${store.longitude},${store.dailySales},${store.transactionCount},${store.intensity},${store.performanceScore}`
            ).join('\n');
            
            res.status(200).send(`${csvHeaders}\n${csvData}`);
        } else {
            res.status(200).json(response);
        }
        
        console.log('[Geographic Heatmap API] Success: Generated heatmap for', stores.length, 'stores');
        
    } catch (error) {
        console.error('[Geographic Heatmap API] Error:', error);
        
        res.status(500).json({
            ok: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate heatmap data',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = handler;