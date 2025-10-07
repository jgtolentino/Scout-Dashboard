/**
 * SKU Lookup Routes
 * 
 * These routes provide high-performance lookup capabilities for SKUs
 * based on various criteria, optimized for the detection pipeline.
 */

const express = require('express');
const router = express.Router();
const skuLookup = require('../../utils/sku_lookup');

/**
 * @route   GET /api/lookup/barcode/:code
 * @desc    Lookup a SKU by barcode or UPC
 * @access  Public
 */
router.get('/barcode/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Barcode or UPC is required'
      });
    }
    
    // Perform lookup
    const sku = skuLookup.lookupSkuByCode(code);
    
    if (!sku) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `SKU with barcode/UPC '${code}' not found`
      });
    }
    
    return res.json({
      success: true,
      data: sku
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/lookup/brand-product
 * @desc    Lookup SKUs by brand and product name
 * @access  Public
 */
router.get('/brand-product', (req, res) => {
  try {
    const { brand, product, limit } = req.query;
    
    if (!brand || !product) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Both brand and product parameters are required'
      });
    }
    
    // Perform lookup
    const results = skuLookup.lookupSkusByBrandProduct(brand, product);
    
    // Apply limit if specified
    const limitNum = limit ? parseInt(limit) : results.length;
    const limitedResults = results.slice(0, limitNum);
    
    return res.json({
      success: true,
      count: limitedResults.length,
      data: limitedResults
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/lookup/text
 * @desc    Lookup SKUs by text search
 * @access  Public
 */
router.get('/text', (req, res) => {
  try {
    const { q, limit, include_product, include_brand, min_score } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Search query (q) is required'
      });
    }
    
    // Prepare options
    const options = {
      limit: limit ? parseInt(limit) : 10,
      includeProductInfo: include_product !== 'false',
      includeBrandInfo: include_brand !== 'false',
      minScore: min_score ? parseFloat(min_score) : 0.5
    };
    
    // Perform lookup
    const results = skuLookup.lookupSkusByText(q, options);
    
    return res.json({
      success: true,
      count: results.length,
      query: q,
      data: results
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/lookup/popular
 * @desc    Get popular/trending SKUs
 * @access  Public
 */
router.get('/popular', (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit) : 10;
    
    // Get popular SKUs
    const results = skuLookup.getPopularSkus(limitNum);
    
    return res.json({
      success: true,
      count: results.length,
      data: results
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/lookup/detection
 * @desc    Lookup SKUs from detection results
 * @access  Public
 */
router.post('/detection', (req, res) => {
  try {
    const { detections } = req.body;
    
    if (!detections || !Array.isArray(detections)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Detection array is required'
      });
    }
    
    // Process each detection
    const results = detections.map(detection => {
      const { label, confidence, bbox } = detection;
      
      if (!label) {
        return {
          original: detection,
          matched: false,
          reason: 'No label provided'
        };
      }
      
      // First, try exact brand-product match
      // Assuming label format is "Brand Product Variant"
      const parts = label.split(' ');
      
      if (parts.length >= 2) {
        const brand = parts[0];
        const product = parts.slice(1).join(' ');
        
        const brandProductMatches = skuLookup.lookupSkusByBrandProduct(brand, product);
        
        if (brandProductMatches.length > 0) {
          return {
            original: detection,
            matched: true,
            method: 'brand_product',
            sku: brandProductMatches[0],
            alternates: brandProductMatches.slice(1, 3)
          };
        }
      }
      
      // If no match, try text search
      const textMatches = skuLookup.lookupSkusByText(label, {
        limit: 3,
        minScore: 0.3
      });
      
      if (textMatches.length > 0) {
        return {
          original: detection,
          matched: true,
          method: 'text_search',
          sku: textMatches[0],
          alternates: textMatches.slice(1)
        };
      }
      
      // No match found
      return {
        original: detection,
        matched: false,
        reason: 'No matching SKU found'
      };
    });
    
    // Calculate match statistics
    const matchCount = results.filter(r => r.matched).length;
    
    return res.json({
      success: true,
      total: detections.length,
      matched: matchCount,
      match_rate: detections.length > 0 ? 
        (matchCount / detections.length * 100).toFixed(1) + '%' : '0%',
      results
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/lookup/refresh-cache
 * @desc    Refresh the lookup cache
 * @access  Private
 */
router.post('/refresh-cache', (req, res) => {
  try {
    skuLookup.initializeCache();
    
    return res.json({
      success: true,
      message: 'SKU lookup cache refreshed successfully'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;