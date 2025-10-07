/**
 * Health Check Routes
 * 
 * These routes are used to verify the API service is running correctly.
 */

const express = require('express');
const router = express.Router();
const db = require('../../utils/db');

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    service: 'brand-sku-masterdata-api',
    version: '1.0.0'
  });
});

/**
 * @route   GET /health/db
 * @desc    Database health check
 * @access  Public
 */
router.get('/db', (req, res) => {
  try {
    // Check database connection by querying a small amount of data
    const brandCount = db.getCollection('brands').length;
    const categoryCount = db.getCollection('categories').length;
    const productCount = db.getCollection('products').length;
    const skuCount = db.getCollection('skus').length;
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date(),
      database: {
        status: 'connected',
        counts: {
          brands: brandCount,
          categories: categoryCount,
          products: productCount,
          skus: skuCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date(),
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

module.exports = router;