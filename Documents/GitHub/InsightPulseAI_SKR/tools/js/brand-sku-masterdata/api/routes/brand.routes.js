/**
 * Brand Routes
 * 
 * These routes handle all brand-related operations.
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/brands
 * @desc    Get all brands
 * @access  Public
 */
router.get('/', (req, res) => {
  // Temporary implementation using db directly
  const db = require('../../utils/db');
  const brands = db.getCollection('brands');
  
  res.json({
    success: true,
    count: brands.length,
    data: brands
  });
});

/**
 * @route   GET /api/brands/:brandId
 * @desc    Get a single brand by ID
 * @access  Public
 */
router.get('/:brandId', (req, res) => {
  const db = require('../../utils/db');
  const brand = db.getItemById('brands', 'brand_id', req.params.brandId);
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Brand with ID '${req.params.brandId}' not found`
    });
  }
  
  res.json({
    success: true,
    data: brand
  });
});

// More routes would be added here with proper controllers

module.exports = router;