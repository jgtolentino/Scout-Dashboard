const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for API routes
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount API routes
try {
  // Brands lightweight API
  const brandsLightweight = require('./api/brands-lightweight');
  app.use('/api/brands-lightweight', brandsLightweight);
  console.log('✅ Mounted: /api/brands-lightweight');
} catch (error) {
  console.error('Failed to load brands-lightweight API:', error);
}

try {
  // Brands standard API
  const brandsApi = require('./api/brands');
  app.use('/api/brands', brandsApi);
  console.log('✅ Mounted: /api/brands');
} catch (error) {
  console.error('Failed to load brands API:', error);
}

try {
  // Transaction trends API
  const trendsApi = require('./api/transactions-trends');
  app.use('/api/transactions-trends', trendsApi);
  console.log('✅ Mounted: /api/transactions-trends');
} catch (error) {
  console.error('Failed to load transactions-trends API:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const brandsDataPath = path.join(__dirname, 'api', 'data', 'brands_500.json');
  let dataStatus = 'not_found';
  let recordCount = 0;

  try {
    const brandsData = JSON.parse(fs.readFileSync(brandsDataPath, 'utf8'));
    dataStatus = 'loaded';
    recordCount = brandsData.length;
  } catch (error) {
    console.error('Failed to load brands data:', error);
  }

  res.json({
    status: 'healthy',
    service: 'brand-performance-dashboard',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    data: {
      status: dataStatus,
      recordCount: recordCount,
      source: process.env.NODE_ENV === 'production' ? 'production' : 'local'
    },
    endpoints: {
      brands: '/api/brands/*',
      brandsLightweight: '/api/brands-lightweight/*',
      trends: '/api/transactions-trends/*'
    }
  });
});

// Serve static files from dist directory
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`✅ Serving static files from: ${distPath}`);
} else {
  console.warn(`⚠️  dist directory not found at: ${distPath}`);
  console.warn('   Run "npm run build" to create production files');
}

// SPA fallback - must be last
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>Dashboard Not Built</h1>
      <p>Please run <code>npm run build</code> to build the production files.</p>
      <p>API is available at <a href="/api/health">/api/health</a></p>
    `);
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Brand Performance Dashboard Server
====================================
Server running on port ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}

URLs:
- Dashboard: http://localhost:${PORT}
- API Health: http://localhost:${PORT}/api/health
- Brands API: http://localhost:${PORT}/api/brands/*
- Lightweight API: http://localhost:${PORT}/api/brands-lightweight/*

${!fs.existsSync(distPath) ? '⚠️  Warning: Run "npm run build" to create production files\n' : ''}
  `);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port with PORT=3001 npm run start:prod`);
    process.exit(1);
  }
  throw err;
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});