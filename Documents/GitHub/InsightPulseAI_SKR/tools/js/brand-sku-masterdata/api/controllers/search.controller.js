/**
 * Search Controller
 * 
 * Provides comprehensive search capabilities across all entity types
 * in the Brand-SKU Master Data system.
 */

const db = require('../../utils/db');

/**
 * Unified search across all collections
 */
exports.searchAll = (req, res) => {
  try {
    const { q, collection, limit } = req.query;
    
    // Validate query parameter
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Search query (q) is required'
      });
    }
    
    // Perform search
    const results = db.search(q, collection);
    
    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit))) {
      const limitNum = parseInt(limit);
      Object.keys(results).forEach(key => {
        results[key] = results[key].slice(0, limitNum);
      });
    }
    
    // Calculate total result count
    const totalCount = Object.values(results)
      .reduce((sum, arr) => sum + arr.length, 0);
    
    return res.json({
      success: true,
      query: q,
      totalCount,
      results
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Advanced search with more flexible matching criteria
 */
exports.advancedSearch = (req, res) => {
  try {
    const { 
      brand, product, category, sku, 
      barcode, price_min, price_max,
      status, sort, limit, offset
    } = req.query;
    
    // Require at least one search parameter
    if (!brand && !product && !category && !sku && !barcode) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'At least one search parameter is required'
      });
    }
    
    // Start with all SKUs
    let skus = db.getCollection('skus');
    let products = db.getCollection('products');
    let brands = db.getCollection('brands');
    
    // Create a map of products by ID for quick lookups
    const productMap = {};
    products.forEach(product => {
      productMap[product.product_id] = product;
    });
    
    // Create a map of brands by ID for quick lookups
    const brandMap = {};
    brands.forEach(brand => {
      brandMap[brand.brand_id] = brand;
    });
    
    // Apply filtering on SKU level
    if (sku) {
      const skuTerm = sku.toLowerCase();
      skus = skus.filter(item => 
        (item.sku_id && item.sku_id.toLowerCase().includes(skuTerm)) ||
        (item.name && item.name.toLowerCase().includes(skuTerm)) ||
        (item.variant && item.variant.toLowerCase().includes(skuTerm))
      );
    }
    
    if (barcode) {
      skus = skus.filter(item => 
        (item.barcode && item.barcode === barcode) ||
        (item.upc && item.upc === barcode)
      );
    }
    
    if (price_min !== undefined) {
      const minPrice = parseFloat(price_min);
      skus = skus.filter(item => 
        item.price && item.price.base >= minPrice
      );
    }
    
    if (price_max !== undefined) {
      const maxPrice = parseFloat(price_max);
      skus = skus.filter(item => 
        item.price && item.price.base <= maxPrice
      );
    }
    
    if (status) {
      skus = skus.filter(item => 
        item.meta && item.meta.status === status
      );
    }
    
    // Apply filtering based on product/brand criteria
    if (product || brand || category) {
      // Filter the products first
      let filteredProductIds = Object.keys(productMap);
      
      if (product) {
        const productTerm = product.toLowerCase();
        filteredProductIds = filteredProductIds.filter(id => {
          const p = productMap[id];
          return (p.name && p.name.toLowerCase().includes(productTerm)) ||
                (p.description && p.description.toLowerCase().includes(productTerm)) ||
                (p.product_id && p.product_id.toLowerCase().includes(productTerm));
        });
      }
      
      if (brand) {
        const brandTerm = brand.toLowerCase();
        
        // If it's a brand ID, use exact match
        if (brandMap[brand]) {
          filteredProductIds = filteredProductIds.filter(id => 
            productMap[id].brand_id === brand
          );
        } else {
          // Otherwise use text search on brand names
          const matchingBrandIds = Object.values(brandMap)
            .filter(b => 
              (b.name && b.name.toLowerCase().includes(brandTerm)) ||
              (b.brand_id && b.brand_id.toLowerCase().includes(brandTerm))
            )
            .map(b => b.brand_id);
            
          filteredProductIds = filteredProductIds.filter(id => 
            matchingBrandIds.includes(productMap[id].brand_id)
          );
        }
      }
      
      if (category) {
        filteredProductIds = filteredProductIds.filter(id => 
          productMap[id].category_id === category ||
          productMap[id].subcategory_id === category
        );
      }
      
      // Now filter SKUs based on the filtered product IDs
      skus = skus.filter(item => 
        filteredProductIds.includes(item.product_id)
      );
    }
    
    // Determine total count before applying pagination
    const totalCount = skus.length;
    
    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      const sortDir = direction === 'desc' ? -1 : 1;
      
      skus.sort((a, b) => {
        let valA, valB;
        
        // Handle nested fields with dot notation
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          valA = a[parent] ? a[parent][child] : null;
          valB = b[parent] ? b[parent][child] : null;
        } else {
          valA = a[field];
          valB = b[field];
        }
        
        // Handle case when values are undefined
        if (valA === undefined) return sortDir;
        if (valB === undefined) return -sortDir;
        
        // Handle numeric values
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * sortDir;
        }
        
        // Handle string values
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * sortDir;
        }
        
        // Default comparison
        return ((valA > valB) ? 1 : -1) * sortDir;
      });
    }
    
    // Apply pagination
    const pageSize = limit ? parseInt(limit) : 20;
    const startIndex = offset ? parseInt(offset) : 0;
    const paginatedSkus = skus.slice(startIndex, startIndex + pageSize);
    
    // Enhance results with product and brand information
    const enhancedResults = paginatedSkus.map(sku => {
      const result = { ...sku };
      
      if (sku.product_id && productMap[sku.product_id]) {
        const product = productMap[sku.product_id];
        result.product = {
          product_id: product.product_id,
          name: product.name,
          brand_id: product.brand_id
        };
        
        if (product.brand_id && brandMap[product.brand_id]) {
          const brand = brandMap[product.brand_id];
          result.brand = {
            brand_id: brand.brand_id,
            name: brand.name
          };
        }
      }
      
      return result;
    });
    
    // Prepare pagination info
    const pagination = {
      total: totalCount,
      limit: pageSize,
      offset: startIndex,
      returned: enhancedResults.length
    };
    
    return res.json({
      success: true,
      pagination,
      data: enhancedResults
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};