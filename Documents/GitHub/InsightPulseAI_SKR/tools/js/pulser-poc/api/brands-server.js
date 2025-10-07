const express = require('express');
const cors = require('cors');
const BrandsProcessor = require('./data/brands-processor');
const app = express();
const port = 7072; // Different port for brands API

// Enable CORS
app.use(cors());
app.use(express.json());

// Load real brands data
const brandsData = require('./data/brands_500.json');

// Add categories based on brand names (you can customize this mapping)
const categorizedData = brandsData.map(item => ({
  ...item,
  category: getCategoryForBrand(item.brand),
  competitor: isCompetitor(item.brand)
}));

const processor = new BrandsProcessor(categorizedData);

// Helper function to categorize brands
function getCategoryForBrand(brand) {
  const brandLower = brand.toLowerCase();
  
  // Beverages
  if (brandLower.includes('cola') || brandLower.includes('pepsi') || brandLower.includes('sprite') ||
      brandLower.includes('coffee') || brandLower.includes('tea') || brandLower.includes('juice') ||
      brandLower.includes('milo') || brandLower.includes('nescafe') || brandLower.includes('kopiko') ||
      brandLower.includes('c2') || brandLower.includes('gatorade')) {
    return 'beverages';
  }
  
  // Snacks
  if (brandLower.includes('chip') || brandLower.includes('oishi') || brandLower.includes('piattos') ||
      brandLower.includes('nova') || brandLower.includes('cracker') || brandLower.includes('pillows') ||
      brandLower.includes('ridges') || brandLower.includes('kirei') || brandLower.includes('hansel')) {
    return 'snacks';
  }
  
  // Noodles
  if (brandLower.includes('lucky me') || brandLower.includes('nissin') || brandLower.includes('payless') ||
      brandLower.includes('noodle') || brandLower.includes('pancit') || brandLower.includes('mi goreng')) {
    return 'noodles';
  }
  
  // Household/Personal Care
  if (brandLower.includes('safeguard') || brandLower.includes('palmolive') || brandLower.includes('downy') ||
      brandLower.includes('ariel') || brandLower.includes('tide') || brandLower.includes('colgate') ||
      brandLower.includes('shampoo') || brandLower.includes('soap') || brandLower.includes('detergent')) {
    return 'household';
  }
  
  // Cigarettes
  if (brandLower.includes('marlboro') || brandLower.includes('winston') || brandLower.includes('philip') ||
      brandLower.includes('fortune') || brandLower.includes('hope')) {
    return 'cigarettes';
  }
  
  // Default
  return 'others';
}

// Helper function to identify competitors (customize as needed)
function isCompetitor(brand) {
  const competitors = ['Coca-Cola', 'Pepsi', 'Nissin', 'Oishi', 'Palmolive', 'Tide', 'Marlboro'];
  return competitors.some(comp => brand.toLowerCase().includes(comp.toLowerCase()));
}

// KPIs endpoint
app.get('/api/brands/kpis', (req, res) => {
  console.log('Processing KPIs request');
  const kpis = processor.getKPIs();
  res.json(kpis);
});

// Trends endpoint
app.get('/api/brands/trends', (req, res) => {
  console.log('Processing trends request');
  const { brands, days } = req.query;
  const brandsList = brands ? brands.split(',') : null;
  const trends = processor.getTrends(brandsList, days || 30);
  res.json(trends);
});

// Market share endpoint
app.get('/api/brands/market-share', (req, res) => {
  console.log('Processing market share request');
  const { groupBy, limit } = req.query;
  const marketShare = processor.getMarketShare(groupBy || 'brand', parseInt(limit) || 10);
  res.json(marketShare);
});

// Fastest movers endpoint
app.get('/api/brands/movers', (req, res) => {
  console.log('Processing movers request');
  const { limit } = req.query;
  const movers = processor.getFastestMovers(parseInt(limit) || 5);
  res.json(movers);
});

// Leaderboard endpoint
app.get('/api/brands/leaderboard', (req, res) => {
  console.log('Processing leaderboard request');
  const { category, limit } = req.query;
  const leaderboard = processor.getLeaderboard(category, parseInt(limit) || 10);
  res.json(leaderboard);
});

// Insights endpoint
app.get('/api/brands/insights', (req, res) => {
  console.log('Processing insights request');
  const insights = processor.getInsights();
  res.json(insights);
});

// Categories endpoint
app.get('/api/brands/categories', (req, res) => {
  console.log('Processing categories request');
  const categories = processor.getCategories();
  res.json(categories);
});

// Brands list endpoint
app.get('/api/brands/list', (req, res) => {
  console.log('Processing brands list request');
  const brands = processor.getBrands();
  res.json(brands);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'brands-api' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Brands API server running at http://127.0.0.1:${port}`);
  console.log(`Available endpoints:`);
  console.log(`  - http://127.0.0.1:${port}/api/brands/kpis`);
  console.log(`  - http://127.0.0.1:${port}/api/brands/trends`);
  console.log(`  - http://127.0.0.1:${port}/api/brands/market-share`);
  console.log(`  - http://127.0.0.1:${port}/api/brands/movers`);
  console.log(`  - http://127.0.0.1:${port}/api/brands/leaderboard`);
  console.log(`  - http://127.0.0.1:${port}/api/brands/insights`);
});