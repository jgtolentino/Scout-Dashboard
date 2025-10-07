/**
 * Category Routes
 * 
 * These routes handle all category-related operations.
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', (req, res) => {
  // Temporary implementation using db directly
  const db = require('../../utils/db');
  const categories = db.getCollection('categories');
  
  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

/**
 * @route   GET /api/categories/:categoryId
 * @desc    Get a single category by ID
 * @access  Public
 */
router.get('/:categoryId', (req, res) => {
  const db = require('../../utils/db');
  const category = db.getItemById('categories', 'category_id', req.params.categoryId);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Category with ID '${req.params.categoryId}' not found`
    });
  }
  
  res.json({
    success: true,
    data: category
  });
});

// More routes would be added here with proper controllers

module.exports = router;