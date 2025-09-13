/**
 * Open Food Facts Data Ingestion Script
 * 
 * This script fetches product data from the Open Food Facts API
 * and imports it into the Brand-SKU Master Data system.
 * 
 * Usage: node utils/ingest_open_food_facts.js
 */

const axios = require('axios');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

// Configuration
const config = {
  // Base URL for Open Food Facts API
  baseUrl: 'https://world.openfoodfacts.org/api/v2',
  
  // Number of products to fetch
  productCount: 50,
  
  // Search parameters to filter products from the Philippines
  searchParams: {
    countries_tags: 'philippines',
    fields: [
      'code', 'product_name', 'brands', 'categories',
      'image_url', 'image_small_url', 'image_front_url',
      'quantity', 'packaging', 'labels', 'origins',
      'ingredients_text', 'allergens', 'nutriments',
      'nutrient_levels', 'nutriscores', 'nova_group',
      'serving_size', 'serving_quantity', 'product_quantity'
    ].join(','),
    page_size: 50,
    json: 1
  },
  
  // Brand mappings for standardization
  brandMappings: {
    'Nestlé': 'NESTLE',
    'Nestle': 'NESTLE',
    'Coca-Cola': 'COCACOLA',
    'Coca Cola': 'COCACOLA',
    'Monde': 'MONDE',
    'Monde Nissin': 'MONDE',
    'URC': 'URC',
    'Universal Robina Corporation': 'URC',
    'P&G': 'PG',
    'Procter & Gamble': 'PG',
    'Procter and Gamble': 'PG'
  },
  
  // Category mappings for standardization
  categoryMappings: {
    'beverages': 'BEVERAGES',
    'drinks': 'BEVERAGES',
    'coffee': 'COFFEE',
    'coffee beverages': 'COFFEE',
    'coffees': 'COFFEE',
    'soft drinks': 'SOFTDRINKS',
    'sodas': 'SOFTDRINKS',
    'carbonated drinks': 'SOFTDRINKS',
    'teas': 'RTD_TEA',
    'tea beverages': 'RTD_TEA',
    'ready-to-drink tea': 'RTD_TEA',
    'snacks': 'SNACKS',
    'chips': 'CHIPS',
    'potato chips': 'CHIPS',
    'corn chips': 'CHIPS',
    'biscuits': 'BISCUITS',
    'cookies': 'BISCUITS',
    'crackers': 'BISCUITS',
    'personal care': 'PERSONAL_CARE',
    'shampoo': 'SHAMPOO',
    'soap': 'SOAP'
  }
};

/**
 * Map brand name to standardized brand ID
 * @param {String} brandName - Brand name from API
 * @returns {String} - Standardized brand ID
 */
function mapBrandName(brandName) {
  if (!brandName) return null;
  
  // Try exact match
  if (config.brandMappings[brandName]) {
    return config.brandMappings[brandName];
  }
  
  // Try case-insensitive match
  const lowerBrandName = brandName.toLowerCase();
  for (const [key, value] of Object.entries(config.brandMappings)) {
    if (key.toLowerCase() === lowerBrandName) {
      return value;
    }
  }
  
  // If no match, generate a brand ID from the name
  return brandName.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);
}

/**
 * Map category name to standardized category ID
 * @param {String} categoryName - Category name from API
 * @returns {String} - Standardized category ID
 */
function mapCategoryName(categoryName) {
  if (!categoryName) return null;
  
  // Try exact match
  if (config.categoryMappings[categoryName]) {
    return config.categoryMappings[categoryName];
  }
  
  // Try case-insensitive match
  const lowerCategoryName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(config.categoryMappings)) {
    if (key.toLowerCase() === lowerCategoryName) {
      return value;
    }
  }
  
  // If no match, try to find a partial match
  for (const [key, value] of Object.entries(config.categoryMappings)) {
    if (lowerCategoryName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default to BEVERAGES if no match
  return 'OTHER';
}

/**
 * Create product ID from brand and product name
 * @param {String} brandId - Brand ID
 * @param {String} productName - Product name
 * @returns {String} - Generated product ID
 */
function createProductId(brandId, productName) {
  if (!brandId || !productName) {
    return `PROD-${uuidv4().slice(0, 8)}`;
  }
  
  // Extract first word of product name
  const firstWord = productName.split(' ')[0].toUpperCase();
  
  // Create ID by combining brand and first word
  return `${brandId}-${firstWord}`;
}

/**
 * Create SKU ID from product ID and variant
 * @param {String} productId - Product ID
 * @param {String} variant - Variant or size
 * @returns {String} - Generated SKU ID
 */
function createSkuId(productId, variant) {
  if (!productId) {
    return `SKU-${uuidv4().slice(0, 8)}`;
  }
  
  // Create a suffix based on variant or random string
  const suffix = variant ? 
    variant.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() : 
    Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${productId}-${suffix}`;
}

/**
 * Extract size and weight from product quantity
 * @param {String} quantity - Quantity string (e.g., "250 ml", "100g")
 * @returns {Object} - Parsed size and weight
 */
function parseQuantity(quantity) {
  if (!quantity) {
    return { size: null, weight: null };
  }
  
  const sizeRegex = /(\d+(?:\.\d+)?)\s*(ml|l|g|kg|oz|lb|ct|pcs)/i;
  const match = quantity.match(sizeRegex);
  
  if (!match) {
    return { size: quantity, weight: null };
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  // Size is the full string
  const size = quantity;
  
  // Weight depends on the unit
  let weight = null;
  
  if (unit === 'g') {
    weight = { value, unit: 'g' };
  } else if (unit === 'kg') {
    weight = { value: value * 1000, unit: 'g' };
  } else if (unit === 'ml') {
    // Assuming 1ml = 1g for simplicity
    weight = { value, unit: 'g' };
  } else if (unit === 'l') {
    weight = { value: value * 1000, unit: 'g' };
  }
  
  return { size, weight };
}

/**
 * Transform Open Food Facts product to our schema
 * @param {Object} offProduct - Open Food Facts product
 * @returns {Object} - Transformed product and SKU data
 */
function transformProduct(offProduct) {
  // Skip products without a name
  if (!offProduct.product_name) {
    return null;
  }
  
  // Extract brand information
  const brandName = offProduct.brands || 'Generic';
  const brandId = mapBrandName(brandName);
  
  // Extract category information
  let categoryName = 'Other';
  let categoryId = 'OTHER';
  
  if (offProduct.categories) {
    const categories = offProduct.categories.split(',');
    if (categories.length > 0) {
      categoryName = categories[0].trim();
      categoryId = mapCategoryName(categoryName);
    }
  }
  
  // Create product ID
  const productId = createProductId(brandId, offProduct.product_name);
  
  // Parse quantity for size and weight
  const { size, weight } = parseQuantity(offProduct.quantity);
  
  // Create SKU ID
  const skuId = createSkuId(productId, size);
  
  // Extract images
  const images = [];
  
  if (offProduct.image_front_url) {
    images.push({
      url: offProduct.image_front_url,
      alt_text: `${offProduct.product_name} front image`,
      is_primary: true
    });
  }
  
  if (offProduct.image_url && offProduct.image_url !== offProduct.image_front_url) {
    images.push({
      url: offProduct.image_url,
      alt_text: `${offProduct.product_name} image`,
      is_primary: images.length === 0
    });
  }
  
  // Create brand object
  const brand = {
    brand_id: brandId,
    name: brandName,
    description: `Brand imported from Open Food Facts`,
    meta: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_system: 'OPEN_FOOD_FACTS'
    }
  };
  
  // Create category object
  const category = {
    category_id: categoryId,
    name: categoryName,
    description: `Category imported from Open Food Facts`,
    meta: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
  
  // Create product object
  const product = {
    product_id: productId,
    name: offProduct.product_name,
    description: offProduct.ingredients_text || `${offProduct.product_name} from ${brandName}`,
    brand_id: brandId,
    category_id: categoryId,
    images: images,
    meta: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      source_system: 'OPEN_FOOD_FACTS'
    }
  };
  
  // Create SKU object
  const sku = {
    sku_id: skuId,
    product_id: productId,
    barcode: offProduct.code,
    upc: offProduct.code,
    name: offProduct.product_name,
    variant: size || 'Standard',
    size: size,
    weight: weight,
    price: {
      base: Math.floor(Math.random() * 100) + 5, // Random price between 5 and 105
      currency: 'PHP'
    },
    inventory: {
      stock_level: 'Medium',
      quantity: Math.floor(Math.random() * 100) + 10,
      reorder_point: 5
    },
    images: images,
    meta: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      source_system: 'OPEN_FOOD_FACTS',
      last_sync_date: new Date().toISOString()
    }
  };
  
  return {
    brand,
    category,
    product,
    sku
  };
}

/**
 * Fetch products from Open Food Facts API
 */
async function fetchProducts() {
  console.log('Fetching products from Open Food Facts API...');
  
  try {
    // Build search URL with parameters
    const searchParams = new URLSearchParams(config.searchParams);
    const url = `${config.baseUrl}/search?${searchParams.toString()}`;
    
    // Fetch data
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid API response format');
    }
    
    console.log(`Fetched ${data.products.length} products from API`);
    
    // Transform products to our schema
    const transformedData = data.products
      .map(transformProduct)
      .filter(Boolean); // Remove null results
    
    return transformedData;
    
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }
}

/**
 * Import transformed data into the database
 * @param {Array} transformedData - Array of transformed products
 */
function importTransformedData(transformedData) {
  console.log(`Importing ${transformedData.length} products into database...`);
  
  const stats = {
    brands: { added: 0, skipped: 0 },
    categories: { added: 0, skipped: 0 },
    products: { added: 0, skipped: 0 },
    skus: { added: 0, skipped: 0 }
  };
  
  // Process each transformed product
  for (const item of transformedData) {
    // Import brand
    if (item.brand) {
      const existingBrand = db.getItemById('brands', 'brand_id', item.brand.brand_id);
      if (!existingBrand) {
        db.addItem('brands', item.brand);
        stats.brands.added++;
      } else {
        stats.brands.skipped++;
      }
    }
    
    // Import category
    if (item.category) {
      const existingCategory = db.getItemById('categories', 'category_id', item.category.category_id);
      if (!existingCategory) {
        db.addItem('categories', item.category);
        stats.categories.added++;
      } else {
        stats.categories.skipped++;
      }
    }
    
    // Import product
    if (item.product) {
      const existingProduct = db.getItemById('products', 'product_id', item.product.product_id);
      if (!existingProduct) {
        db.addItem('products', item.product);
        stats.products.added++;
      } else {
        stats.products.skipped++;
      }
    }
    
    // Import SKU
    if (item.sku) {
      const existingSku = db.getItemById('skus', 'sku_id', item.sku.sku_id);
      if (!existingSku) {
        db.addItem('skus', item.sku);
        stats.skus.added++;
      } else {
        stats.skus.skipped++;
      }
    }
  }
  
  console.log('Import statistics:');
  console.log(`- Brands: ${stats.brands.added} added, ${stats.brands.skipped} skipped`);
  console.log(`- Categories: ${stats.categories.added} added, ${stats.categories.skipped} skipped`);
  console.log(`- Products: ${stats.products.added} added, ${stats.products.skipped} skipped`);
  console.log(`- SKUs: ${stats.skus.added} added, ${stats.skus.skipped} skipped`);
  
  return stats;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Open Food Facts data ingestion...');
    
    // Fetch and transform products
    const transformedData = await fetchProducts();
    
    // Import transformed data
    if (transformedData.length > 0) {
      importTransformedData(transformedData);
      console.log('Data ingestion completed successfully');
    } else {
      console.log('No products to import');
    }
    
  } catch (error) {
    console.error('Error in data ingestion:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();