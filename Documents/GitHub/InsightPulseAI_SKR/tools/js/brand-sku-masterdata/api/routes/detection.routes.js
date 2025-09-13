/**
 * Detection Integration Routes
 * 
 * These routes handle integration with object detection systems
 * to identify products in images and match them to SKUs.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const detectionIntegration = require('../../utils/detection_integration');

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route   POST /api/detection/image
 * @desc    Detect products in an uploaded image
 * @access  Public
 */
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No image file uploaded'
      });
    }
    
    // Get detection options from request
    const prompt = req.body.prompt || 'Detect all product brands and SKUs';
    const threshold = req.body.threshold ? parseFloat(req.body.threshold) : 0.5;
    const includeSkuInfo = req.body.includeSkuInfo !== 'false';
    const useCache = req.body.useCache !== 'false';
    
    // Detect brands and SKUs in the image
    const result = await detectionIntegration.detectBrandsAndSkus(
      req.file.buffer,
      { prompt, threshold, includeSkuInfo, useCache }
    );
    
    return res.json({
      success: true,
      ...result
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
 * @route   POST /api/detection/url
 * @desc    Detect products in an image from a URL
 * @access  Public
 */
router.post('/url', async (req, res) => {
  try {
    const { imageUrl, prompt, threshold, includeSkuInfo, useCache } = req.body;
    
    // Validate image URL
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Image URL is required'
      });
    }
    
    // Prepare options
    const options = {
      prompt: prompt || 'Detect all product brands and SKUs',
      threshold: threshold ? parseFloat(threshold) : 0.5,
      includeSkuInfo: includeSkuInfo !== false,
      useCache: useCache !== false
    };
    
    // Process image URL
    const result = await detectionIntegration.processImageUrl(imageUrl, options);
    
    return res.json({
      success: true,
      ...result
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
 * @route   POST /api/detection/match
 * @desc    Match detection results to SKUs
 * @access  Public
 */
router.post('/match', async (req, res) => {
  try {
    const { detections } = req.body;
    
    if (!detections || !Array.isArray(detections)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Detections array is required'
      });
    }
    
    // Match detections to SKUs
    const results = await detectionIntegration.matchDetectionsToSkus(detections);
    
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
 * @route   POST /api/detection/annotations
 * @desc    Generate annotations for detected SKUs
 * @access  Public
 */
router.post('/annotations', async (req, res) => {
  try {
    const { detectionResult } = req.body;
    
    if (!detectionResult) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Detection result is required'
      });
    }
    
    // Generate annotations
    const annotations = detectionIntegration.generateAnnotations(detectionResult);
    
    return res.json(annotations);
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;