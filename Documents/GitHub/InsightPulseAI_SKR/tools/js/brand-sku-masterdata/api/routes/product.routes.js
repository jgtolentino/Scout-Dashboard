/**
 * Product Routes
 * 
 * These routes handle all product-related operations.
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', (req, res) => {
  // Temporary implementation using db directly
  const db = require('../../utils/db');
  const products = db.getCollection('products');
  
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

/**
 * @route   GET /api/products/:productId
 * @desc    Get a single product by ID
 * @access  Public
 */
router.get('/:productId', (req, res) => {
  const db = require('../../utils/db');
  const product = db.getItemById('products', 'product_id', req.params.productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Product with ID '${req.params.productId}' not found`
    });
  }
  
  // Include brand information if requested
  if (req.query.include === 'brand' || req.query.include === 'all') {
    const brand = db.getItemById('brands', 'brand_id', product.brand_id);
    if (brand) {
      product.brand = brand;
    }
  }
  
  res.json({
    success: true,
    data: product
  });
});

// More routes would be added here with proper controllers

module.exports = router;