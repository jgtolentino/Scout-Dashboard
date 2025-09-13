const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Load brands data
const brandsDataPath = path.join(__dirname, 'api', 'data', 'brands_500.json');
let brandsData = [];

try {
  const rawData = fs.readFileSync(brandsDataPath, 'utf8');
  brandsData = JSON.parse(rawData);
  console.log(`✅ Loaded ${brandsData.length} brands`);
} catch (error) {
  console.error('❌ Error loading brands data:', error);
}

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Helper functions
function generateMockData() {
  return brandsData.map((brand, index) => ({
    ...brand,
    value: Math.floor(Math.random() * 10000000) + 1000000,
    rank: index + 1,
    avgChange: (Math.random() - 0.5) * 30,
    category: brand.category || 'Consumer Goods'
  }));
}

// API Endpoints

// KPIs
app.get('/api/brands/kpis', (req, res) => {
  const mockData = generateMockData();
  const totalRevenue = mockData.reduce((sum, brand) => sum + brand.value, 0);
  const topBrand = mockData.sort((a, b) => b.value - a.value)[0];
  const fastestGrowth = mockData.sort((a, b) => b.avgChange - a.avgChange)[0];
  
  const categories = [...new Set(mockData.map(b => b.category))];
  const categoryValues = categories.map(cat => ({
    name: cat,
    value: mockData.filter(b => b.category === cat).reduce((sum, b) => sum + b.value, 0)
  }));
  const topCategory = categoryValues.sort((a, b) => b.value - a.value)[0];

  res.json({
    totalRevenue,
    topBrand: {
      name: topBrand.name,
      value: topBrand.value
    },
    fastestGrowth: {
      name: fastestGrowth.name,
      change: fastestGrowth.avgChange / 100
    },
    topCategory
  });
});

// Market Share
app.get('/api/brands/market-share', (req, res) => {
  const mockData = generateMockData();
  const top10 = mockData.sort((a, b) => b.value - a.value).slice(0, 10);
  const totalValue = top10.reduce((sum, brand) => sum + brand.value, 0);
  
  const result = top10.map(brand => ({
    name: brand.name,
    value: (brand.value / totalValue) * 100
  }));
  
  res.json(result);
});

// Movers
app.get('/api/brands/movers', (req, res) => {
  const mockData = generateMockData();
  const sorted = mockData.sort((a, b) => b.avgChange - a.avgChange);
  
  res.json({
    gainers: sorted.slice(0, 5).map(brand => ({
      brand: brand.name,
      change: brand.avgChange / 100
    })),
    losers: sorted.slice(-5).map(brand => ({
      brand: brand.name,
      change: brand.avgChange / 100
    }))
  });
});

// Leaderboard with pagination
app.get('/api/brands/leaderboard', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const mockData = generateMockData();
  const sorted = mockData.sort((a, b) => b.value - a.value);
  const paginatedData = sorted.slice(offset, offset + limit);
  
  res.json({
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: mockData.length,
      hasMore: offset + limit < mockData.length
    }
  });
});

// Insights
app.get('/api/brands/insights', (req, res) => {
  const insights = [
    {
      title: "Strong Growth in Electronics",
      message: "Consumer electronics brands are showing 15% higher growth than last quarter.",
      priority: "high"
    },
    {
      title: "Market Share Consolidation",
      message: "Top 10 brands now control 68% of total market share, up from 62%.",
      priority: "medium"
    },
    {
      title: "Regional Performance Variance",
      message: "Metro Manila brands outperforming provincial markets by 12%.",
      priority: "low"
    }
  ];
  
  res.json(insights);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    brandsLoaded: brandsData.length,
    timestamp: new Date().toISOString()
  });
});

// Serve the dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Brand Performance Dashboard
=============================
Server: http://localhost:${PORT}
Health: http://localhost:${PORT}/api/health
Brands: ${brandsData.length} loaded

API Endpoints:
- /api/brands/kpis
- /api/brands/market-share
- /api/brands/movers
- /api/brands/leaderboard
- /api/brands/insights
  `);
});