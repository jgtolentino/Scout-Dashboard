// Initialize OpenTelemetry first (must be before other imports)
require('./otel');

const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const BrandsProcessor = require('./data/brands-processor');
const { metricsMiddleware, recordCache, getHealthStatus, getMetrics } = require('./metrics');
const app = express();
const port = process.env.PORT || 7072;

// Production environment configuration
const USE_MOCK = process.env.USE_MOCK === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_VERSION = process.env.API_VERSION || '1.0.0';

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_KEY = process.env.REDIS_KEY;
const REDIS_ENABLED = REDIS_HOST && REDIS_KEY;

// Initialize Redis client with fallback
let redis = null;
let redisHealth = { status: 'disabled', lastCheck: null, error: null };

if (REDIS_ENABLED) {
  try {
    redis = new Redis({
      host: REDIS_HOST,
      password: REDIS_KEY,
      port: 6380, // Azure Redis default SSL port
      tls: {}, // Enable TLS for Azure Redis
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      redisHealth = { status: 'connected', lastCheck: new Date().toISOString(), error: null };
    });

    redis.on('error', (error) => {
      console.warn('⚠️ Redis connection error:', error.message);
      redisHealth = { status: 'error', lastCheck: new Date().toISOString(), error: error.message };
    });

    redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      redisHealth = { status: 'disconnected', lastCheck: new Date().toISOString(), error: null };
    });

  } catch (error) {
    console.warn('⚠️ Failed to initialize Redis:', error.message);
    redis = null;
    redisHealth = { status: 'failed', lastCheck: new Date().toISOString(), error: error.message };
  }
} else {
  console.log('ℹ️ Redis caching disabled (missing REDIS_HOST or REDIS_KEY)');
}

// Enable CORS
app.use(cors());
app.use(express.json());

// Metrics middleware for performance tracking
app.use(metricsMiddleware());

// Logging middleware for production monitoring
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Data source selection with fallback strategy
let processor;
let dataSource = 'unknown';
let dataHealth = { status: 'unknown', lastCheck: null, recordCount: 0 };

async function initializeDataSource() {
  try {
    let brandsData;
    
    if (USE_MOCK) {
      // Use mock data (brands_500.json)
      console.log('🔄 Loading mock data from brands_500.json...');
      brandsData = require('./data/brands_500.json');
      dataSource = 'mock';
      console.log('✅ Mock data loaded successfully');
    } else {
      // In production, this would fetch from real API/database
      // For now, we'll use the same file but with production logging
      console.log('🔄 Loading production data...');
      try {
        // Simulate real API call with error handling
        brandsData = await fetchRealBrandData();
        dataSource = 'production';
        console.log('✅ Production data loaded successfully');
      } catch (error) {
        console.warn('⚠️ Production data failed, falling back to mock data');
        console.warn('Error:', error.message);
        brandsData = require('./data/brands_500.json');
        dataSource = 'fallback';
      }
    }

    // Add categories and competitor flags
    const categorizedData = brandsData.map(item => ({
      ...item,
      category: getCategoryForBrand(item.brand),
      competitor: isCompetitor(item.brand)
    }));

    // Update data health metrics
    dataHealth = {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      recordCount: categorizedData.length,
      source: dataSource,
      environment: NODE_ENV,
      version: API_VERSION
    };

    processor = new BrandsProcessor(categorizedData);
    console.log(`📊 Data processor initialized with ${categorizedData.length} brands from ${dataSource} source`);
    
  } catch (error) {
    console.error('❌ Failed to initialize data source:', error);
    dataHealth = {
      status: 'error',
      lastCheck: new Date().toISOString(),
      recordCount: 0,
      source: 'none',
      error: error.message,
      environment: NODE_ENV,
      version: API_VERSION
    };
    throw error;
  }
}

// Simulate real API data fetching (replace with actual implementation)
async function fetchRealBrandData() {
  // In production, this would be:
  // const response = await fetch('https://api.yourdomain.com/brands');
  // return await response.json();
  
  // For now, simulate with the same data but add production validation
  const data = require('./data/brands_500.json');
  
  // Validate data structure
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format: expected array');
  }
  
  if (data.length === 0) {
    throw new Error('No brand data available');
  }
  
  // Validate required fields
  const requiredFields = ['brand', 'value', 'pct_change', 'timestamp'];
  const invalidRecords = data.filter(item => 
    !requiredFields.every(field => item.hasOwnProperty(field))
  );
  
  if (invalidRecords.length > 0) {
    throw new Error(`Invalid records found: ${invalidRecords.length} records missing required fields`);
  }
  
  return data;
}

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

// Error handling middleware
function handleApiError(endpoint, error, res) {
  console.error(`❌ Error in ${endpoint}:`, error);
  
  // Update data health if it's a data-related error
  if (error.message.includes('processor') || error.message.includes('data')) {
    dataHealth.status = 'degraded';
    dataHealth.lastError = error.message;
  }
  
  res.status(500).json({
    error: 'Internal server error',
    endpoint,
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
}

// Enhanced health check with data validation and Redis status
app.get('/health', (req, res) => {
  const healthCheck = {
    status: dataHealth.status,
    service: 'brands-api',
    version: API_VERSION,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    data: dataHealth,
    redis: redisHealth,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  // Return appropriate HTTP status
  const statusCode = dataHealth.status === 'healthy' ? 200 : 
                    dataHealth.status === 'degraded' ? 206 : 503;
  
  res.status(statusCode).json(healthCheck);
});

// System status endpoint for dashboard health widget
app.get('/api/status', (req, res) => {
  try {
    const healthStatus = getHealthStatus();
    const currentMetrics = getMetrics();
    
    // Combine health status with key metrics for dashboard
    const systemStatus = {
      status: healthStatus.status,
      metrics: {
        p99: currentMetrics.requests.responseTime.p99,
        errorRate: currentMetrics.requests.errorRate,
        cacheHitRate: currentMetrics.cache.hitRate,
        uptime: Math.round(currentMetrics.uptime)
      },
      issues: healthStatus.issues,
      lastChecked: healthStatus.lastCheck,
      service: 'brands-api',
      version: API_VERSION
    };
    
    res.json(systemStatus);
  } catch (error) {
    console.error('❌ Error in /api/status:', error);
    res.status(500).json({
      status: 'error',
      metrics: { p99: null, errorRate: null, cacheHitRate: null, uptime: 0 },
      issues: ['Failed to retrieve system metrics'],
      lastChecked: new Date().toISOString(),
      service: 'brands-api',
      version: API_VERSION,
      error: error.message
    });
  }
});

// Advanced metrics endpoint for detailed monitoring
app.get('/api/metrics', (req, res) => {
  try {
    const metrics = getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('❌ Error in /api/metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Schema validation endpoint
app.get('/api/brands/schema', (req, res) => {
  const schema = {
    version: API_VERSION,
    endpoints: {
      '/api/brands/kpis': {
        method: 'GET',
        description: 'Key performance indicators',
        response: {
          totalRevenue: 'number',
          topBrand: { name: 'string', value: 'number', category: 'string' },
          fastestGrowth: { name: 'string', change: 'number', category: 'string' },
          topCategory: { name: 'string', value: 'number' }
        }
      },
      '/api/brands/market-share': {
        method: 'GET',
        description: 'Market share distribution',
        response: 'array of { name: string, value: number, percentage: string }'
      },
      '/api/brands/leaderboard': {
        method: 'GET',
        description: 'Brand rankings by value',
        response: 'array of { brand: string, value: number, category: string }'
      },
      '/api/brands/movers': {
        method: 'GET',
        description: 'Fastest growing and declining brands',
        response: { gainers: 'array', losers: 'array' }
      },
      '/api/brands/insights': {
        method: 'GET',
        description: 'AI-generated insights',
        response: 'array of { type: string, title: string, message: string, priority: string }'
      }
    }
  };
  
  res.json(schema);
});

// KPIs endpoint with error handling
app.get('/api/brands/kpis', (req, res) => {
  try {
    console.log('Processing KPIs request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const kpis = processor.getKPIs();
    res.json(kpis);
  } catch (error) {
    handleApiError('/api/brands/kpis', error, res);
  }
});

// Trends endpoint
app.get('/api/brands/trends', (req, res) => {
  try {
    console.log('Processing trends request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const { brands, days } = req.query;
    const brandsList = brands ? brands.split(',') : null;
    const trends = processor.getTrends(brandsList, days || 30);
    res.json(trends);
  } catch (error) {
    handleApiError('/api/brands/trends', error, res);
  }
});

// Market share endpoint
app.get('/api/brands/market-share', (req, res) => {
  try {
    console.log('Processing market share request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const { groupBy, limit } = req.query;
    const marketShare = processor.getMarketShare(groupBy || 'brand', parseInt(limit) || 10);
    res.json(marketShare);
  } catch (error) {
    handleApiError('/api/brands/market-share', error, res);
  }
});

// Fastest movers endpoint
app.get('/api/brands/movers', (req, res) => {
  try {
    console.log('Processing movers request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const { limit } = req.query;
    const movers = processor.getFastestMovers(parseInt(limit) || 5);
    res.json(movers);
  } catch (error) {
    handleApiError('/api/brands/movers', error, res);
  }
});

// Leaderboard endpoint with Redis caching
app.get('/api/brands/leaderboard', async (req, res) => {
  try {
    console.log('Processing leaderboard request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    
    const { category, limit } = req.query;
    // Parse and validate parameters
    const parsedLimit = Math.min(parseInt(limit) || 10, 100); // Max 100 items per request
    const parsedPage = Math.max(parseInt(req.query.page) || 1, 1);
    
    // Create cache key
    const cacheKey = `brands:leaders:${category || 'all'}:${parsedLimit}:${parsedPage}`;
    
    // Try to get from cache first
    let cacheHit = false;
    if (redis && redisHealth.status === 'connected') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`🚀 Cache HIT for ${cacheKey}`);
          cacheHit = true;
          recordCache('hit');
          const response = JSON.parse(cached);
          response._cache = { hit: true, key: cacheKey };
          return res.json(response);
        }
        console.log(`💾 Cache MISS for ${cacheKey}`);
        recordCache('miss');
      } catch (cacheError) {
        console.warn('⚠️ Cache read error:', cacheError.message);
        // Continue without cache
      }
    }
    
    // Get all brands for the category
    const allBrands = processor.getLeaderboard(category, 1000); // Get all brands (use high limit)
    const totalBrands = allBrands.length;
    
    // Calculate pagination
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;
    const paginatedBrands = allBrands.slice(startIndex, endIndex);
    
    // Build response
    const response = {
      totalBrands,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalBrands / parsedLimit),
      hasNextPage: endIndex < totalBrands,
      hasPrevPage: parsedPage > 1,
      leaders: paginatedBrands.map(brand => ({
        name: brand.brand,
        value: brand.value,
        category: brand.category,
        rank: brand.rank,
        change: parseFloat(brand.avgChange)
      })),
      _cache: { hit: cacheHit, key: cacheKey }
    };
    
    // Cache the response if Redis is available
    if (redis && redisHealth.status === 'connected') {
      try {
        await redis.set(cacheKey, JSON.stringify(response), 'EX', 60); // Cache for 60 seconds
        console.log(`💾 Cached response for ${cacheKey}`);
      } catch (cacheError) {
        console.warn('⚠️ Cache write error:', cacheError.message);
        // Continue without caching
      }
    }
    
    res.json(response);
  } catch (error) {
    handleApiError('/api/brands/leaderboard', error, res);
  }
});

// Insights endpoint
app.get('/api/brands/insights', (req, res) => {
  try {
    console.log('Processing insights request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const insights = processor.getInsights();
    res.json(insights);
  } catch (error) {
    handleApiError('/api/brands/insights', error, res);
  }
});

// Categories endpoint
app.get('/api/brands/categories', (req, res) => {
  try {
    console.log('Processing categories request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const categories = processor.getCategories();
    res.json(categories);
  } catch (error) {
    handleApiError('/api/brands/categories', error, res);
  }
});

// Brands list endpoint
app.get('/api/brands/list', (req, res) => {
  try {
    console.log('Processing brands list request');
    if (!processor) {
      throw new Error('Data processor not initialized');
    }
    const brands = processor.getBrands();
    res.json(brands);
  } catch (error) {
    handleApiError('/api/brands/list', error, res);
  }
});

// Initialize data source and start server
async function startServer() {
  try {
    console.log('🚀 Starting Brand Performance API Server...');
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Use Mock Data: ${USE_MOCK}`);
    console.log(`API Version: ${API_VERSION}`);
    
    await initializeDataSource();
    
    app.listen(port, '127.0.0.1', () => {
      console.log(`✅ Brands API server running at http://127.0.0.1:${port}`);
      console.log(`📊 Data source: ${dataSource} (${dataHealth.recordCount} records)`);
      console.log(`🔧 Environment: ${NODE_ENV}`);
      console.log(`Available endpoints:`);
      console.log(`  - http://127.0.0.1:${port}/health`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/schema`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/kpis`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/trends`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/market-share`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/movers`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/leaderboard`);
      console.log(`  - http://127.0.0.1:${port}/api/brands/insights`);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
