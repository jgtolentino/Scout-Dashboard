/**
 * Search Routes
 * 
 * These routes handle all search operations across the master data entities.
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

/**
 * @route   GET /api/search
 * @desc    Search across all collections
 * @access  Public
 */
router.get('/', searchController.searchAll);

/**
 * @route   GET /api/search/advanced
 * @desc    Advanced search with filtering
 * @access  Public
 */
router.get('/advanced', searchController.advancedSearch);

module.exports = router;