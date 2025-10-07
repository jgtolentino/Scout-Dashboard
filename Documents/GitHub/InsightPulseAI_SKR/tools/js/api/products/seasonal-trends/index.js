const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'scout_user',
    password: process.env.DB_PASSWORD || 'ScoutPass123!',
    server: process.env.DB_SERVER || 'scout-sql-server.database.windows.net',
    database: process.env.DB_DATABASE || 'scout_analytics',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

function transformSeasonalTrendsResults(recordset) {
    return recordset.map(record => ({
        category: record.Category,
        subCategory: record.SubCategory,
        saleYear: parseInt(record.SaleYear),
        saleMonth: parseInt(record.SaleMonth),
        monthName: record.MonthName,
        quarter: parseInt(record.Quarter),
        unitsSold: parseInt(record.UnitsSold),
        revenue: parseFloat(record.Revenue),
        profit: parseFloat(record.Profit),
        transactionCount: parseInt(record.TransactionCount),
        avgPrice: parseFloat(record.AvgPrice),
        locationsCovered: parseInt(record.LocationsCovered),
        prevYearRevenue: record.PrevYearRevenue ? parseFloat(record.PrevYearRevenue) : null,
        yoyGrowthPercentage: record.YoYGrowthPercentage ? parseFloat(record.YoYGrowthPercentage) : null,
        seasonalIndex: calculateSeasonalIndex(record),
        trendDirection: getTrendDirection(record)
    }));
}

function calculateSeasonalIndex(record) {
    // Simple seasonal index calculation based on month
    const seasonalFactors = {
        1: 0.9,   // January - post-holiday low
        2: 0.85,  // February - lowest
        3: 0.95,  // March - recovering
        4: 1.0,   // April - normal
        5: 1.05,  // May - summer prep
        6: 1.1,   // June - summer high
        7: 1.15,  // July - peak summer
        8: 1.1,   // August - back to school
        9: 1.05,  // September - post-summer
        10: 1.0,  // October - normal
        11: 1.2,  // November - holiday prep
        12: 1.25  // December - holiday peak
    };
    
    return seasonalFactors[record.SaleMonth] || 1.0;
}

function getTrendDirection(record) {
    if (record.YoYGrowthPercentage === null) return 'UNKNOWN';
    
    if (record.YoYGrowthPercentage > 10) return 'STRONG_UP';
    if (record.YoYGrowthPercentage > 5) return 'UP';
    if (record.YoYGrowthPercentage > -5) return 'STABLE';
    if (record.YoYGrowthPercentage > -10) return 'DOWN';
    return 'STRONG_DOWN';
}

module.exports = async function (context, req) {
    context.log('Seasonal Trends API function processed a request.');

    // CORS headers
    context.res = {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    };

    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        // Parse query parameters
        const category = req.query.category || null;
        const granularity = req.query.granularity || 'Monthly';
        const yearsBack = parseInt(req.query.yearsBack) || 2;

        // Validate granularity parameter
        const validGranularities = ['Monthly', 'Quarterly'];
        const granularityParam = validGranularities.includes(granularity) ? granularity : 'Monthly';

        context.log(`Fetching seasonal trends data for category: ${category || 'all'}, granularity: ${granularityParam}, years back: ${yearsBack}`);

        // Connect to database
        const pool = await sql.connect(config);
        
        // Execute stored procedure
        const result = await pool.request()
            .input('ProductCategory', sql.NVarChar(100), category)
            .input('TimeGranularity', sql.NVarChar(20), granularityParam)
            .input('YearsBack', sql.Int, yearsBack)
            .execute('sp_GetSeasonalTrends');

        // Transform and return results
        const trendsData = transformSeasonalTrendsResults(result.recordset);

        // Calculate seasonal insights
        const seasonalInsights = {
            totalDataPoints: trendsData.length,
            categoriesAnalyzed: [...new Set(trendsData.map(item => item.category))].length,
            timeSpanMonths: yearsBack * 12,
            avgMonthlyRevenue: trendsData.length > 0 
                ? trendsData.reduce((sum, item) => sum + item.revenue, 0) / trendsData.length 
                : 0,
            peakMonth: getPeakMonth(trendsData),
            lowMonth: getLowMonth(trendsData),
            trendSummary: getTrendSummary(trendsData),
            seasonalPatterns: getSeasonalPatterns(trendsData)
        };

        context.log(`Returning ${trendsData.length} seasonal trend records`);

        context.res.status = 200;
        context.res.body = {
            success: true,
            data: trendsData,
            seasonalInsights,
            metadata: {
                category: category,
                granularity: granularityParam,
                yearsBack,
                totalDataPoints: trendsData.length,
                generatedAt: new Date().toISOString(),
                dataSource: 'sp_GetSeasonalTrends'
            }
        };

        await pool.close();

    } catch (error) {
        context.log.error('Error in seasonal trends API:', error);
        
        context.res.status = 500;
        context.res.body = {
            success: false,
            error: 'Internal server error',
            message: error.message
        };
    }
};

function getPeakMonth(data) {
    if (data.length === 0) return null;
    
    const monthlyTotals = {};
    data.forEach(item => {
        if (!monthlyTotals[item.monthName]) {
            monthlyTotals[item.monthName] = 0;
        }
        monthlyTotals[item.monthName] += item.revenue;
    });
    
    return Object.keys(monthlyTotals).reduce((a, b) => 
        monthlyTotals[a] > monthlyTotals[b] ? a : b
    );
}

function getLowMonth(data) {
    if (data.length === 0) return null;
    
    const monthlyTotals = {};
    data.forEach(item => {
        if (!monthlyTotals[item.monthName]) {
            monthlyTotals[item.monthName] = 0;
        }
        monthlyTotals[item.monthName] += item.revenue;
    });
    
    return Object.keys(monthlyTotals).reduce((a, b) => 
        monthlyTotals[a] < monthlyTotals[b] ? a : b
    );
}

function getTrendSummary(data) {
    const trendsWithGrowth = data.filter(item => item.yoyGrowthPercentage !== null);
    if (trendsWithGrowth.length === 0) return { avgGrowth: 0, growingCategories: 0, decliningCategories: 0 };
    
    const avgGrowth = trendsWithGrowth.reduce((sum, item) => sum + item.yoyGrowthPercentage, 0) / trendsWithGrowth.length;
    const growingCategories = trendsWithGrowth.filter(item => item.yoyGrowthPercentage > 0).length;
    const decliningCategories = trendsWithGrowth.filter(item => item.yoyGrowthPercentage < 0).length;
    
    return {
        avgGrowth: Math.round(avgGrowth * 100) / 100,
        growingCategories,
        decliningCategories,
        stableCategories: trendsWithGrowth.length - growingCategories - decliningCategories
    };
}

function getSeasonalPatterns(data) {
    const quarters = {
        1: { name: 'Q1 (Jan-Mar)', revenue: 0, count: 0 },
        2: { name: 'Q2 (Apr-Jun)', revenue: 0, count: 0 },
        3: { name: 'Q3 (Jul-Sep)', revenue: 0, count: 0 },
        4: { name: 'Q4 (Oct-Dec)', revenue: 0, count: 0 }
    };
    
    data.forEach(item => {
        quarters[item.quarter].revenue += item.revenue;
        quarters[item.quarter].count += 1;
    });
    
    return Object.values(quarters).map(quarter => ({
        quarter: quarter.name,
        avgRevenue: quarter.count > 0 ? quarter.revenue / quarter.count : 0,
        dataPoints: quarter.count
    }));
}