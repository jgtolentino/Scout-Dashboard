const BrandsProcessor = require('../data/brands-processor');

// Initialize the brands processor with data
let brandsProcessor = null;

function initializeBrandsProcessor() {
  if (!brandsProcessor) {
    try {
      // Try production data first
      const brandsData = require('../data/brands_500.json');
      console.log(`Loaded ${brandsData.length} brands from production data`);
      
      // Add category mapping since the original data doesn't have categories
      const categorizedData = brandsData.map(item => ({
        ...item,
        category: getCategoryForBrand(item.brand),
        competitor: isCompetitor(item.brand)
      }));
      
      brandsProcessor = new BrandsProcessor(categorizedData);
    } catch (error) {
      console.warn('Production data not found, falling back to mock data:', error.message);
      
      // Fallback to mock data
      const mockData = require('../data/sample-brands.json');
      console.log(`Loaded ${mockData.length} brands from mock data`);
      brandsProcessor = new BrandsProcessor(mockData);
    }
  }
  return brandsProcessor;
}

// Simple category mapping based on brand names
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

// Check if brand is a competitor
function isCompetitor(brandName) {
  const competitors = ['Coca-Cola', 'Pepsi', 'Unilever', 'P&G'];
  return competitors.some(comp => brandName.toLowerCase().includes(comp.toLowerCase()));
}

module.exports = async function (context, req) {
  const { action } = req.params;
  
  try {
    const processor = initializeBrandsProcessor();
    let result;
    
    switch (action) {
      case 'kpis':
        result = processor.getKPIs();
        break;
        
      case 'market-share':
        result = processor.getMarketShare();
        break;
        
      case 'movers':
        result = processor.getFastestMovers();
        break;
        
      case 'leaderboard':
        result = processor.getLeaderboard();
        break;
        
      case 'insights':
        result = processor.getInsights();
        break;
        
      case 'schema':
        result = {
          version: '1.0.0',
          endpoints: {
            '/api/brands/kpis': 'Get key performance indicators',
            '/api/brands/market-share': 'Get market share data',
            '/api/brands/movers': 'Get fastest movers (gainers/losers)',
            '/api/brands/leaderboard': 'Get brand leaderboard',
            '/api/brands/insights': 'Get AI-generated insights'
          }
        };
        break;
        
      default:
        // Default endpoint - return health status with data info
        result = {
          status: 'healthy',
          service: 'brands-api',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          data: {
            recordCount: processor.data.length,
            source: processor.data.length > 100 ? 'production' : 'mock',
            lastUpdated: new Date().toISOString()
          }
        };
    }
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: result
    };
    
  } catch (error) {
    console.error('Error in brands API:', error);
    
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