/**
 * Azure Function: Stores Nearby
 * Returns nearby stores based on location for geographic visualization
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request object
 */

module.exports = async function (context, req) {
    context.log('Stores Nearby API function processed a request.');

    try {
        // Demo data for Philippine stores with geolocation
        const nearbyStores = {
            stores: [
                {
                    id: "store_001",
                    name: "Sari-Sari Store Manila",
                    latitude: 14.5995,
                    longitude: 120.9842,
                    address: "Manila, Metro Manila",
                    type: "Sari-Sari Store",
                    dailySales: 15000,
                    customerCount: 120,
                    topProducts: ["Rice", "Instant Noodles", "Soft Drinks"]
                },
                {
                    id: "store_002", 
                    name: "Convenience Store Quezon City",
                    latitude: 14.6760,
                    longitude: 121.0437,
                    address: "Quezon City, Metro Manila",
                    type: "Convenience Store",
                    dailySales: 25000,
                    customerCount: 180,
                    topProducts: ["Snacks", "Beverages", "Personal Care"]
                },
                {
                    id: "store_003",
                    name: "Mini Mart Makati",
                    latitude: 14.5547,
                    longitude: 121.0244,
                    address: "Makati City, Metro Manila", 
                    type: "Mini Mart",
                    dailySales: 35000,
                    customerCount: 220,
                    topProducts: ["Ready Meals", "Coffee", "Newspapers"]
                },
                {
                    id: "store_004",
                    name: "Sari-Sari Store Cebu",
                    latitude: 10.3157,
                    longitude: 123.8854,
                    address: "Cebu City, Cebu",
                    type: "Sari-Sari Store",
                    dailySales: 18000,
                    customerCount: 140,
                    topProducts: ["Rice", "Canned Goods", "Ice"]
                },
                {
                    id: "store_005",
                    name: "Corner Store Davao",
                    latitude: 7.0731,
                    longitude: 125.6128,
                    address: "Davao City, Davao del Sur",
                    type: "Corner Store", 
                    dailySales: 20000,
                    customerCount: 160,
                    topProducts: ["Fresh Fruits", "Vegetables", "Fish"]
                }
            ],
            totalStores: 5,
            averageDailySales: 22600,
            totalCustomers: 820,
            coverage: {
                regions: ["Metro Manila", "Cebu", "Davao"],
                cities: 5,
                storeTypes: ["Sari-Sari Store", "Convenience Store", "Mini Mart", "Corner Store"]
            }
        };

        const response = {
            ok: true,
            data: nearbyStores,
            metadata: {
                timestamp: new Date().toISOString(),
                source: "Scout Dashboard Demo",
                version: "1.0.0"
            }
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: response
        };

    } catch (error) {
        context.log.error('Error in stores nearby function:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                ok: false,
                error: 'Internal server error',
                message: 'Unable to fetch nearby stores data'
            }
        };
    }
};