const BrandsProcessor = require('../data/brands-processor');

// Initialize the brands processor with data
let brandsProcessor = null;

function initializeBrandsProcessor() {
  if (!brandsProcessor) {
    try {
      // Load brands data
      const brandsData = require('../data/brands_500.json');
      console.log(`Loaded ${brandsData.length} brands from production data`);
      
      // Add category mapping
      const categorizedData = brandsData.map(item => ({
        ...item,
        category: getCategoryForBrand(item.brand),
        competitor: isCompetitor(item.brand)
      }));
      
      brandsProcessor = new BrandsProcessor(categorizedData);
    } catch (error) {
      console.warn('Production data not found, using mock data:', error.message);
      const mockData = require('../data/sample-brands.json');
      brandsProcessor = new BrandsProcessor(mockData);
    }
  }
  return brandsProcessor;
}

// Simple category mapping
function getCategoryForBrand(brandName) {
  const categories = {
    'Beverages': ['Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', 'Mountain Dew', 'Coffee', 'Tea', 'Juice'],
    'Food & Snacks': ['Lays', 'Doritos', 'Pringles', 'Oreo', 'Kit Kat', 'Nestle', 'Del Monte', 'Oishi'],
    'Personal Care': ['Unilever', 'P&G', 'Pantene', 'Head & Shoulders', 'Dove', 'Safeguard'],
    'Household': ['Joy', 'Tide', 'Ariel', 'Surf', 'Champion', 'Downy'],
    'Dairy': ['Nestle', 'Alaska', 'Bear Brand', 'Alpine']
  };
  
  for (const [category, brands] of Object.entries(categories)) {
    if (brands.some(brand => brandName.toLowerCase().includes(brand.toLowerCase()))) {
      return category;
    }
  }
  return 'Others';
}

// Check if brand is competitor
function isCompetitor(brandName) {
  const competitors = ['Coca-Cola', 'Pepsi', 'Unilever', 'P&G'];
  return competitors.some(comp => brandName.toLowerCase().includes(comp.toLowerCase()));
}

module.exports = async function (context, req) {
  const { action } = req.params;
  const query = req.query || {};
  
  try {
    const processor = initializeBrandsProcessor();
    let result;
    
    switch (action) {
      case 'kpis':
        // Return only aggregated KPIs - no raw data
        result = processor.getKPIs();
        break;
        
      case 'market-share':
        // Return top 10 brands by market share
        result = processor.getMarketShare(10);
        break;
        
      case 'movers':
        // Return only top 5 gainers/losers
        const movers = processor.getFastestMovers();
        result = {
          gainers: movers.gainers.slice(0, 5),
          losers: movers.losers.slice(0, 5)
        };
        break;
        
      case 'leaderboard':
        // Paginated leaderboard
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get full leaderboard then paginate
        const fullLeaderboard = processor.getLeaderboard(query.category, 100);
        result = {
          data: fullLeaderboard.slice(offset, offset + limit),
          pagination: {
            page,
            limit,
            total: fullLeaderboard.length,
            hasMore: offset + limit < fullLeaderboard.length
          }
        };
        break;
        
      case 'insights':
        // Return insights without raw data
        result = processor.getInsights();
        break;
        
      case 'trends':
        // Return only recent trends for top brands
        const topBrands = processor.getLeaderboard(null, 5)
          .map(b => b.brand);
        result = processor.getTrends(topBrands, 7); // Last 7 days only
        break;
        
      case 'schema':
        result = {
          version: '1.0.0',
          endpoints: {
            '/api/brands/kpis': 'Aggregated KPIs only',
            '/api/brands/market-share': 'Top 10 brands by share',
            '/api/brands/movers': 'Top 5 gainers/losers',
            '/api/brands/leaderboard?page=1&limit=10': 'Paginated leaderboard',
            '/api/brands/insights': 'AI insights',
            '/api/brands/trends': 'Trends for top 5 brands'
          }
        };
        break;
        
      default:
        // Health check with minimal data
        result = {
          status: 'healthy',
          service: 'brands-api-lightweight',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          data: {
            recordCount: processor.data.length,
            source: 'production',
            mode: 'lightweight'
          }
        };
    }
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      },
      body: result
    };
    
  } catch (error) {
    console.error('Error in lightweight brands API:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};