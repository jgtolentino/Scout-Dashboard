const sql = require('mssql');

// Customer Profiles API endpoint
module.exports = async function (context, req) {
    context.log('Customer Profiles API triggered');

    // Get parameters from query string
    const segment = req.query.segment || null;
    const minLifetimeValue = req.query.minLifetimeValue ? parseFloat(req.query.minLifetimeValue) : null;
    const maxChurnRisk = req.query.maxChurnRisk ? parseFloat(req.query.maxChurnRisk) : null;
    const location = req.query.location || null;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const summary = req.query.summary === 'true';

    // SQL configuration from environment variables
    const config = {
        user: process.env.SQL_USERNAME,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };

    try {
        // Connect to database
        await sql.connect(config);
        
        let result;
        
        if (summary) {
            // Get segment summary
            result = await sql.query`EXEC sp_GetCustomerSegmentSummary`;
            
            // Format the multi-result set response
            const response = {
                segments: result.recordsets[0],
                demographics: result.recordsets[1],
                locations: result.recordsets[2],
                generatedAt: new Date().toISOString()
            };
            
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: response
            };
        } else {
            // Get individual profiles
            const request = new sql.Request();
            request.input('Segment', sql.NVarChar(50), segment);
            request.input('MinLifetimeValue', sql.Decimal(18, 2), minLifetimeValue);
            request.input('MaxChurnRisk', sql.Decimal(3, 2), maxChurnRisk);
            request.input('Location', sql.NVarChar(100), location);
            request.input('PageSize', sql.Int, pageSize);
            request.input('PageNumber', sql.Int, pageNumber);
            
            result = await request.execute('sp_GetCustomerProfiles');
            
            // Format customer data
            const customers = result.recordset.map(row => ({
                customerId: row.CustomerID,
                segment: row.CustomerSegment,
                churnRisk: {
                    score: row.ChurnRiskScore,
                    level: row.ChurnRiskScore >= 0.7 ? 'High' : 
                           row.ChurnRiskScore >= 0.4 ? 'Medium' : 'Low'
                },
                value: {
                    lifetime: row.LifetimeValue,
                    totalSpent: row.TotalSpent,
                    avgTransaction: row.AverageTransactionValue,
                    transactions: row.TotalTransactions
                },
                demographics: {
                    gender: row.InferredGender,
                    ageGroup: row.InferredAgeGroup,
                    preferredTime: row.PreferredTimeOfDay,
                    location: row.LocationCluster
                },
                behavior: {
                    topCategory: row.TopCategory1,
                    topBrand: row.TopBrand1,
                    frequency: row.PurchaseFrequency,
                    brandLoyalty: row.BrandLoyaltyScore,
                    daysSinceLastPurchase: row.DaysSinceLastPurchase
                },
                store: {
                    preferred: row.PreferredStore,
                    location: row.PreferredLocation
                }
            }));
            
            const response = {
                customers: customers,
                pagination: {
                    page: pageNumber,
                    pageSize: pageSize,
                    totalCount: customers.length
                },
                filters: {
                    segment: segment,
                    minLifetimeValue: minLifetimeValue,
                    maxChurnRisk: maxChurnRisk,
                    location: location
                },
                generatedAt: new Date().toISOString()
            };
            
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: response
            };
        }
        
    } catch (err) {
        context.log.error('Database query failed:', err);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                error: 'Failed to retrieve customer profiles',
                details: err.message,
                timestamp: new Date().toISOString()
            }
        };
    } finally {
        await sql.close();
    }
};