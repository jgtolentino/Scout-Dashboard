/**
 * SKU Lookup Utility
 * 
 * This module provides optimized lookup functions for SKUs based on
 * various criteria, designed for fast retrieval in the detection pipeline.
 */

const db = require('./db');

// In-memory caches for faster lookups
let barcodeCache = {};
let brandProductCache = {};
let brandCategoryCache = {};
let textSearchCache = {};

// Cache invalidation timestamp
let cacheLastUpdated = Date.now();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Initialize or refresh caches for fast lookups
 */
function initializeCache() {
  console.log('Initializing SKU lookup caches...');
  
  // Reset caches
  barcodeCache = {};
  brandProductCache = {};
  brandCategoryCache = {};
  textSearchCache = {};
  
  // Get all collections
  const brands = db.getCollection('brands');
  const categories = db.getCollection('categories');
  const products = db.getCollection('products');
  const skus = db.getCollection('skus');
  
  // Build barcode cache
  skus.forEach(sku => {
    if (sku.barcode) {
      barcodeCache[sku.barcode] = sku;
    }
    if (sku.upc && sku.upc !== sku.barcode) {
      barcodeCache[sku.upc] = sku;
    }
  });
  
  // Build brand-product cache
  brands.forEach(brand => {
    brandProductCache[brand.brand_id] = {
      brand,
      products: products.filter(p => p.brand_id === brand.brand_id)
    };
  });
  
  // Build brand-category cache
  products.forEach(product => {
    const key = `${product.brand_id}:${product.category_id}`;
    if (!brandCategoryCache[key]) {
      brandCategoryCache[key] = [];
    }
    brandCategoryCache[key].push(product);
  });
  
  // Update cache timestamp
  cacheLastUpdated = Date.now();
  
  console.log(`Cache initialized with: ${Object.keys(barcodeCache).length} barcodes, ` +
              `${Object.keys(brandProductCache).length} brands, ` +
              `${Object.keys(brandCategoryCache).length} brand-category combinations`);
}

/**
 * Check if cache needs refreshing
 */
function checkCacheValidity() {
  const now = Date.now();
  if (now - cacheLastUpdated > CACHE_TTL) {
    initializeCache();
  }
}

/**
 * Lookup a SKU by barcode or UPC
 * @param {String} code - Barcode or UPC code
 * @returns {Object|null} - SKU data or null if not found
 */
function lookupSkuByCode(code) {
  checkCacheValidity();
  
  // Check cache first
  if (barcodeCache[code]) {
    return barcodeCache[code];
  }
  
  // If not in cache, try database directly (in case data was added since cache init)
  const skus = db.getCollection('skus');
  const sku = skus.find(s => s.barcode === code || s.upc === code);
  
  // Update cache if found
  if (sku) {
    barcodeCache[code] = sku;
  }
  
  return sku || null;
}

/**
 * Lookup SKUs by brand and product name
 * @param {String} brandText - Brand name or ID
 * @param {String} productText - Product name or description
 * @returns {Array} - Matching SKUs
 */
function lookupSkusByBrandProduct(brandText, productText) {
  if (!brandText || !productText) {
    return [];
  }
  
  checkCacheValidity();
  
  // Convert to lowercase for case-insensitive comparison
  const brandLower = brandText.toLowerCase();
  const productLower = productText.toLowerCase();
  
  // Check cache first
  const cacheKey = `${brandLower}:${productLower}`;
  if (textSearchCache[cacheKey]) {
    return textSearchCache[cacheKey];
  }
  
  // Get all brands
  const brands = db.getCollection('brands');
  
  // Find matching brand (by ID or name)
  let matchingBrand = brands.find(
    b => b.brand_id.toLowerCase() === brandLower || 
         (b.name && b.name.toLowerCase() === brandLower)
  );
  
  // If not found by exact match, try partial match on name
  if (!matchingBrand) {
    matchingBrand = brands.find(
      b => b.name && b.name.toLowerCase().includes(brandLower)
    );
  }
  
  if (!matchingBrand) {
    return [];
  }
  
  // Use brand-product cache
  const brandId = matchingBrand.brand_id;
  const brandCache = brandProductCache[brandId];
  
  if (!brandCache) {
    return [];
  }
  
  // Find products matching the product text
  const matchingProducts = brandCache.products.filter(p => 
    p.name.toLowerCase().includes(productLower) ||
    (p.description && p.description.toLowerCase().includes(productLower))
  );
  
  if (matchingProducts.length === 0) {
    return [];
  }
  
  // Get SKUs for matching products
  const skus = db.getCollection('skus');
  const results = [];
  
  for (const product of matchingProducts) {
    const productSkus = skus.filter(s => s.product_id === product.product_id);
    
    // Enhance SKUs with product and brand information
    productSkus.forEach(sku => {
      results.push({
        ...sku,
        product: {
          product_id: product.product_id,
          name: product.name,
          brand_id: product.brand_id
        },
        brand: {
          brand_id: matchingBrand.brand_id,
          name: matchingBrand.name
        }
      });
    });
  }
  
  // Cache results
  textSearchCache[cacheKey] = results;
  
  return results;
}

/**
 * Lookup SKUs by description or fuzzy text match
 * @param {String} text - Text to search for
 * @param {Object} options - Search options
 * @returns {Array} - Matching SKUs
 */
function lookupSkusByText(text, options = {}) {
  if (!text) {
    return [];
  }
  
  const {
    limit = 10,
    includeProductInfo = true,
    includeBrandInfo = true,
    minScore = 0.5
  } = options;
  
  checkCacheValidity();
  
  // Convert to lowercase for case-insensitive comparison
  const textLower = text.toLowerCase();
  
  // Check cache first
  const cacheKey = `text:${textLower}`;
  if (textSearchCache[cacheKey]) {
    return textSearchCache[cacheKey].slice(0, limit);
  }
  
  // Get all SKUs
  const skus = db.getCollection('skus');
  
  // Prepare scoring function for relevance ranking
  const scoreSkuMatch = (sku, searchText) => {
    let score = 0;
    
    // Check direct SKU fields
    if (sku.name && sku.name.toLowerCase().includes(searchText)) {
      score += 0.8;
    }
    
    if (sku.variant && sku.variant.toLowerCase().includes(searchText)) {
      score += 0.7;
    }
    
    // Get product info if needed
    if (score < minScore && (includeProductInfo || includeBrandInfo)) {
      const product = db.getItemById('products', 'product_id', sku.product_id);
      
      if (product) {
        if (product.name && product.name.toLowerCase().includes(searchText)) {
          score += 0.6;
        }
        
        if (product.description && product.description.toLowerCase().includes(searchText)) {
          score += 0.4;
        }
        
        // Get brand info if needed
        if (score < minScore && includeBrandInfo) {
          const brand = db.getItemById('brands', 'brand_id', product.brand_id);
          
          if (brand && brand.name && brand.name.toLowerCase().includes(searchText)) {
            score += 0.3;
          }
        }
      }
    }
    
    return score;
  };
  
  // Score all SKUs
  const scoredResults = skus
    .map(sku => ({
      sku,
      score: scoreSkuMatch(sku, textLower)
    }))
    .filter(result => result.score >= minScore)
    .sort((a, b) => b.score - a.score);
  
  // Add product and brand info to top results
  const results = scoredResults.slice(0, limit).map(result => {
    const enhancedSku = { ...result.sku };
    
    if (includeProductInfo) {
      const product = db.getItemById('products', 'product_id', result.sku.product_id);
      if (product) {
        enhancedSku.product = {
          product_id: product.product_id,
          name: product.name
        };
        
        if (includeBrandInfo) {
          const brand = db.getItemById('brands', 'brand_id', product.brand_id);
          if (brand) {
            enhancedSku.brand = {
              brand_id: brand.brand_id,
              name: brand.name
            };
          }
        }
      }
    }
    
    return enhancedSku;
  });
  
  // Cache results
  textSearchCache[cacheKey] = results;
  
  return results;
}

/**
 * Lookup SKUs by category and brand
 * @param {String} categoryId - Category ID
 * @param {String} brandId - Brand ID
 * @returns {Array} - Matching SKUs
 */
function lookupSkusByCategoryAndBrand(categoryId, brandId) {
  if (!categoryId || !brandId) {
    return [];
  }
  
  checkCacheValidity();
  
  // Check cache first
  const cacheKey = `${brandId}:${categoryId}`;
  if (brandCategoryCache[cacheKey]) {
    const products = brandCategoryCache[cacheKey];
    
    // Get SKUs for these products
    const skus = db.getCollection('skus');
    const productIds = products.map(p => p.product_id);
    
    return skus.filter(s => productIds.includes(s.product_id));
  }
  
  // If not in cache, query directly
  const products = db.getCollection('products').filter(
    p => p.brand_id === brandId && 
         (p.category_id === categoryId || p.subcategory_id === categoryId)
  );
  
  if (products.length === 0) {
    return [];
  }
  
  // Get SKUs for these products
  const skus = db.getCollection('skus');
  const productIds = products.map(p => p.product_id);
  
  return skus.filter(s => productIds.includes(s.product_id));
}

/**
 * Get most popular SKUs (can be used as fallback)
 * @param {Number} limit - Maximum number of SKUs to return
 * @returns {Array} - Popular SKUs
 */
function getPopularSkus(limit = 10) {
  checkCacheValidity();
  
  // In a real system, this would use actual popularity metrics
  // For this prototype, we'll return random SKUs
  const skus = db.getCollection('skus');
  
  // Shuffle array for randomness
  const shuffled = [...skus].sort(() => 0.5 - Math.random());
  
  // Return limited number with product info
  return shuffled.slice(0, limit).map(sku => {
    const product = db.getItemById('products', 'product_id', sku.product_id);
    const enhancedSku = { ...sku };
    
    if (product) {
      enhancedSku.product = {
        product_id: product.product_id,
        name: product.name,
        brand_id: product.brand_id
      };
      
      const brand = db.getItemById('brands', 'brand_id', product.brand_id);
      if (brand) {
        enhancedSku.brand = {
          brand_id: brand.brand_id,
          name: brand.name
        };
      }
    }
    
    return enhancedSku;
  });
}

// Initialize cache on module load
initializeCache();

module.exports = {
  lookupSkuByCode,
  lookupSkusByBrandProduct,
  lookupSkusByText,
  lookupSkusByCategoryAndBrand,
  getPopularSkus,
  initializeCache // Exported for testing and manual refresh
};