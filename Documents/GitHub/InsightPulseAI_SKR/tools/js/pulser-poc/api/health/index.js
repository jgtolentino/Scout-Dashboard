module.exports = async function (context, req) {
  try {
    // Check if brands data is available
    let dataStatus = { status: 'unknown', recordCount: 0, source: 'unknown' };
    
    try {
      const brandsData = require('../data/brands_500.json');
      dataStatus = {
        status: 'healthy',
        recordCount: brandsData.length,
        source: 'production',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      try {
        const mockData = require('../data/sample-brands.json');
        dataStatus = {
          status: 'degraded',
          recordCount: mockData.length,
          source: 'mock',
          lastCheck: new Date().toISOString(),
          note: 'Using fallback mock data'
        };
      } catch (mockError) {
        dataStatus = {
          status: 'unhealthy',
          recordCount: 0,
          source: 'none',
          lastCheck: new Date().toISOString(),
          error: 'No data sources available'
        };
      }
    }
    
    const healthResponse = {
      status: dataStatus.status === 'unhealthy' ? 'unhealthy' : 'healthy',
      service: 'brand-performance-dashboard',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      data: dataStatus,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    };
    
    const statusCode = dataStatus.status === 'unhealthy' ? 503 : 200;
    
    context.res = {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      },
      body: healthResponse
    };
    
  } catch (error) {
    console.error('Health check error:', error);
    
    context.res = {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: {
        status: 'unhealthy',
        service: 'brand-performance-dashboard',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};