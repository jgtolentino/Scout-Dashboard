/**
 * Brand-SKU Detection Integration Utility
 * 
 * This module provides utilities for integrating with AI-based
 * object detection systems to identify products in images and
 * match them to SKUs in the master data system.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const skuLookup = require('./sku_lookup');

// Configuration for detection service
const config = {
  // URL of the detection service API
  // In a production environment, this would be a deployed model endpoint
  detectionServiceUrl: process.env.DETECTION_SERVICE_URL || 'http://localhost:5000/detect',
  
  // Confidence threshold for detection results
  confidenceThreshold: 0.5,
  
  // Maximum timeout for detection requests (ms)
  timeout: 30000,
  
  // Cache directory for detection results
  cacheDir: path.join(__dirname, '..', 'data', 'detection_cache'),
  
  // Whether to use caching for detection results
  useCache: process.env.USE_DETECTION_CACHE === 'true' || true,
  
  // Maximum cache age (ms) - 24 hours
  maxCacheAge: 24 * 60 * 60 * 1000
};

/**
 * Ensure cache directory exists
 */
function ensureCacheDirectory() {
  if (!fs.existsSync(config.cacheDir)) {
    fs.mkdirSync(config.cacheDir, { recursive: true });
  }
}

/**
 * Generate cache key for an image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} prompt - Detection prompt
 * @returns {String} - Cache key
 */
function generateCacheKey(imageBuffer, prompt) {
  // Use a simple hash of the image buffer and prompt
  const crypto = require('crypto');
  const hash = crypto.createHash('md5');
  hash.update(imageBuffer);
  hash.update(prompt || '');
  return hash.digest('hex');
}

/**
 * Check if detection result is cached
 * @param {String} cacheKey - Cache key
 * @returns {Object|null} - Cached result or null
 */
function getFromCache(cacheKey) {
  if (!config.useCache) {
    return null;
  }
  
  const cacheFile = path.join(config.cacheDir, `${cacheKey}.json`);
  
  if (fs.existsSync(cacheFile)) {
    try {
      const stats = fs.statSync(cacheFile);
      const fileAge = Date.now() - stats.mtimeMs;
      
      // Check if cache is still valid
      if (fileAge <= config.maxCacheAge) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        return cacheData;
      }
    } catch (error) {
      console.error('Error reading cache:', error.message);
    }
  }
  
  return null;
}

/**
 * Save detection result to cache
 * @param {String} cacheKey - Cache key
 * @param {Object} result - Detection result
 */
function saveToCache(cacheKey, result) {
  if (!config.useCache) {
    return;
  }
  
  ensureCacheDirectory();
  
  const cacheFile = path.join(config.cacheDir, `${cacheKey}.json`);
  
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error writing cache:', error.message);
  }
}

/**
 * Detect brands and SKUs in an image using object detection API
 * @param {Buffer|String} image - Image buffer or path to image
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} - Detection results
 */
async function detectBrandsAndSkus(image, options = {}) {
  const {
    prompt = 'Detect all product brands and SKUs',
    threshold = config.confidenceThreshold,
    includeSkuInfo = true,
    useCache = config.useCache
  } = options;
  
  // Prepare image data
  let imageBuffer;
  if (typeof image === 'string') {
    // Image path provided
    imageBuffer = fs.readFileSync(image);
  } else {
    // Image buffer provided
    imageBuffer = image;
  }
  
  // Check cache
  const cacheKey = generateCacheKey(imageBuffer, prompt);
  if (useCache) {
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log('Using cached detection result');
      
      // If SKU info requested but not in cache, add it
      if (includeSkuInfo && !cachedResult.skuResults) {
        cachedResult.skuResults = await matchDetectionsToSkus(cachedResult.detections);
      }
      
      return cachedResult;
    }
  }
  
  try {
    // Prepare form data for API request
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer]);
    formData.append('image', imageBlob);
    formData.append('prompt', prompt);
    formData.append('threshold', threshold.toString());
    
    // Call detection API
    const response = await axios.post(config.detectionServiceUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: config.timeout
    });
    
    // Process response
    const detectionResult = {
      timestamp: new Date().toISOString(),
      prompt,
      imageSize: imageBuffer.length,
      detections: response.data.detections || []
    };
    
    // Filter by confidence threshold
    detectionResult.detections = detectionResult.detections.filter(
      detection => detection.confidence >= threshold
    );
    
    // Add SKU lookup results if requested
    if (includeSkuInfo) {
      detectionResult.skuResults = await matchDetectionsToSkus(detectionResult.detections);
    }
    
    // Cache result
    if (useCache) {
      saveToCache(cacheKey, detectionResult);
    }
    
    return detectionResult;
    
  } catch (error) {
    // If the detection service is not available, use a simulated response for development
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('Detection service unavailable, using simulated response for development');
      
      // Simulate detection results
      const simulatedResult = simulateDetectionResults(imageBuffer, prompt);
      
      // Add SKU lookup results if requested
      if (includeSkuInfo) {
        simulatedResult.skuResults = await matchDetectionsToSkus(simulatedResult.detections);
      }
      
      // Cache simulated result
      if (useCache) {
        saveToCache(cacheKey, simulatedResult);
      }
      
      return simulatedResult;
    }
    
    throw new Error(`Detection API error: ${error.message}`);
  }
}

/**
 * Simulate detection results for development/testing
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} prompt - Detection prompt
 * @returns {Object} - Simulated detection results
 */
function simulateDetectionResults(imageBuffer, prompt) {
  // Extract brand/product hints from the prompt
  const promptLower = prompt.toLowerCase();
  let detections = [];
  
  // Look for brand names in the prompt
  const brandKeywords = [
    'nestle', 'nescafe', 'milo', 'coca-cola', 'coke', 'sprite',
    'lucky me', 'chippy', 'cream-o', 'c2', 'safeguard'
  ];
  
  // Get available brands from the database
  const db = require('./db');
  const availableBrands = db.getCollection('brands').map(b => b.name.toLowerCase());
  
  // Combine with known brands
  const allBrands = [...new Set([...brandKeywords, ...availableBrands])];
  
  // Check for brand mentions in the prompt
  const mentionedBrands = allBrands.filter(brand => 
    promptLower.includes(brand.toLowerCase())
  );
  
  if (mentionedBrands.length > 0) {
    // Generate simulated detections for mentioned brands
    detections = mentionedBrands.map((brand, index) => {
      // Get a product for this brand
      const products = db.getCollection('products').filter(
        p => p.brand_id.toLowerCase() === brand.toUpperCase() ||
             (p.brand && p.brand.name && p.brand.name.toLowerCase() === brand.toLowerCase())
      );
      
      let label = brand;
      if (products.length > 0) {
        // Use real product name if available
        const product = products[Math.floor(Math.random() * products.length)];
        label = `${brand} ${product.name}`;
      }
      
      // Generate random bounding box
      const x1 = Math.random() * 0.5;
      const y1 = Math.random() * 0.5;
      const width = Math.random() * 0.3 + 0.2;
      const height = Math.random() * 0.3 + 0.2;
      
      return {
        label,
        confidence: Math.random() * 0.3 + 0.7, // Between 0.7 and 1.0
        bbox: [x1, y1, x1 + width, y1 + height]
      };
    });
  } else {
    // Generate a few random detections from the database
    const products = db.getCollection('products');
    const brands = db.getCollection('brands');
    
    const randomCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < randomCount; i++) {
      // Pick a random product
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      if (!randomProduct) continue;
      
      // Find its brand
      const brand = brands.find(b => b.brand_id === randomProduct.brand_id);
      const brandName = brand ? brand.name : 'Unknown Brand';
      
      // Generate random bounding box
      const x1 = Math.random() * 0.5;
      const y1 = Math.random() * 0.5;
      const width = Math.random() * 0.3 + 0.2;
      const height = Math.random() * 0.3 + 0.2;
      
      detections.push({
        label: `${brandName} ${randomProduct.name}`,
        confidence: Math.random() * 0.3 + 0.7, // Between 0.7 and 1.0
        bbox: [x1, y1, x1 + width, y1 + height]
      });
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    prompt,
    imageSize: imageBuffer.length,
    detections,
    simulated: true
  };
}

/**
 * Match detection results to SKUs in the master data
 * @param {Array} detections - Array of detection objects
 * @returns {Promise<Array>} - Array of SKU match results
 */
async function matchDetectionsToSkus(detections) {
  if (!detections || !Array.isArray(detections)) {
    return [];
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
  
  return results;
}

/**
 * Process image URL and detect products
 * @param {String} imageUrl - URL of the image
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} - Detection and SKU results
 */
async function processImageUrl(imageUrl, options = {}) {
  try {
    // Download image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    // Convert response to buffer
    const imageBuffer = Buffer.from(response.data);
    
    // Detect brands and SKUs
    return await detectBrandsAndSkus(imageBuffer, options);
    
  } catch (error) {
    throw new Error(`Error processing image URL: ${error.message}`);
  }
}

/**
 * Generate annotations for detected SKUs
 * @param {Object} detectionResult - Detection result
 * @returns {Object} - Annotated image data
 */
function generateAnnotations(detectionResult) {
  if (!detectionResult || !detectionResult.skuResults) {
    return {
      success: false,
      error: 'No detection results available'
    };
  }
  
  // Generate annotations for each detection
  const annotations = detectionResult.skuResults.map(result => {
    if (!result.matched) {
      return {
        bbox: result.original.bbox,
        label: result.original.label,
        confidence: result.original.confidence,
        matched: false,
        color: '#FF0000' // Red for unmatched
      };
    }
    
    const sku = result.sku;
    const productName = sku.product && sku.product.name ? sku.product.name : 'Unknown Product';
    const brandName = sku.brand && sku.brand.name ? sku.brand.name : 'Unknown Brand';
    
    return {
      bbox: result.original.bbox,
      label: `${brandName} ${productName}`,
      sku_id: sku.sku_id,
      variant: sku.variant,
      price: sku.price && sku.price.base ? 
        `${sku.price.base.toFixed(2)} ${sku.price.currency}` : 'N/A',
      confidence: result.original.confidence,
      matched: true,
      color: '#00FF00' // Green for matched
    };
  });
  
  return {
    success: true,
    timestamp: detectionResult.timestamp,
    annotations
  };
}

// Ensure cache directory exists on module load
ensureCacheDirectory();

module.exports = {
  detectBrandsAndSkus,
  matchDetectionsToSkus,
  processImageUrl,
  generateAnnotations
};