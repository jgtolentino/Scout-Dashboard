/**
 * Brand-SKU Master Data API Server
 * 
 * This is the main entry point for the Brand-SKU Master Data API Service.
 * It sets up routes, middleware, and database connections.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const brandRoutes = require('./api/routes/brand.routes');
const categoryRoutes = require('./api/routes/category.routes');
const productRoutes = require('./api/routes/product.routes');
const skuRoutes = require('./api/routes/sku.routes');
const healthRoutes = require('./api/routes/health.routes');
const searchRoutes = require('./api/routes/search.routes');
const lookupRoutes = require('./api/routes/lookup.routes');
const detectionRoutes = require('./api/routes/detection.routes');

// Initialize database
const db = require('./utils/db');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/health', healthRoutes);

// API Documentation route
app.use('/api-docs', express.static(path.join(__dirname, 'docs')));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Brand-SKU Master Data API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at ${req.originalUrl} was not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Brand-SKU Master Data API Server running on port ${PORT}`);
});

module.exports = app; // For testing