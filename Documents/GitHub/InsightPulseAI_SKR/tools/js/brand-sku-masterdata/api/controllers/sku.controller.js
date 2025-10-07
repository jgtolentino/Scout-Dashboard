/**
 * SKU Controller
 * 
 * Handles all SKU-related operations including CRUD and specific SKU lookups.
 */

const db = require('../../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all SKUs with optional filtering
 */
exports.getAllSkus = (req, res) => {
  try {
    // Extract filter parameters from query
    const { 
      product_id, brand_id, category_id, status, 
      variant, price_min, price_max, search 
    } = req.query;
    
    let skus = db.getCollection('skus');
    
    // Apply filters if provided
    if (product_id) {
      skus = skus.filter(sku => sku.product_id === product_id);
    }
    
    if (brand_id || category_id) {
      // For brand_id and category_id, we need to join with products
      const products = db.getCollection('products');
      
      if (brand_id) {
        const productIds = products
          .filter(product => product.brand_id === brand_id)
          .map(product => product.product_id);
        
        skus = skus.filter(sku => productIds.includes(sku.product_id));
      }
      
      if (category_id) {
        const productIds = products
          .filter(product => product.category_id === category_id || 
                            product.subcategory_id === category_id)
          .map(product => product.product_id);
        
        skus = skus.filter(sku => productIds.includes(sku.product_id));
      }
    }
    
    // Apply status filter
    if (status) {
      skus = skus.filter(sku => 
        sku.meta && sku.meta.status === status
      );
    }
    
    // Apply variant filter
    if (variant) {
      skus = skus.filter(sku => 
        sku.variant && sku.variant.toLowerCase().includes(variant.toLowerCase())
      );
    }
    
    // Apply price range filter
    if (price_min !== undefined) {
      skus = skus.filter(sku => 
        sku.price && sku.price.base >= parseFloat(price_min)
      );
    }
    
    if (price_max !== undefined) {
      skus = skus.filter(sku => 
        sku.price && sku.price.base <= parseFloat(price_max)
      );
    }
    
    // Apply text search across multiple fields
    if (search) {
      const searchTerm = search.toLowerCase();
      skus = skus.filter(sku => {
        const searchableFields = [
          sku.sku_id, 
          sku.name, 
          sku.variant, 
          sku.barcode, 
          sku.upc
        ];
        
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Return filtered results
    return res.json({
      success: true,
      count: skus.length,
      data: skus
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
 * Get a single SKU by ID
 */
exports.getSkuById = (req, res) => {
  try {
    const skuId = req.params.skuId;
    const sku = db.getItemById('skus', 'sku_id', skuId);
    
    if (!sku) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `SKU with ID '${skuId}' not found`
      });
    }
    
    // Optionally include product, brand, and category information
    if (req.query.include === 'all') {
      const product = db.getItemById('products', 'product_id', sku.product_id);
      
      if (product) {
        sku.product = product;
        
        if (product.brand_id) {
          const brand = db.getItemById('brands', 'brand_id', product.brand_id);
          if (brand) {
            sku.brand = brand;
          }
        }
        
        if (product.category_id) {
          const category = db.getItemById('categories', 'category_id', product.category_id);
          if (category) {
            sku.category = category;
          }
        }
      }
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
};

/**
 * Get a SKU by barcode or UPC
 */
exports.getSkuByBarcode = (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Barcode or UPC is required'
      });
    }
    
    // Find SKU by barcode or UPC
    const skus = db.getCollection('skus');
    const sku = skus.find(
      sku => sku.barcode === code || sku.upc === code
    );
    
    if (!sku) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `SKU with barcode/UPC '${code}' not found`
      });
    }
    
    // Include product information
    if (req.query.include === 'all') {
      const product = db.getItemById('products', 'product_id', sku.product_id);
      
      if (product) {
        sku.product = product;
        
        if (product.brand_id) {
          const brand = db.getItemById('brands', 'brand_id', product.brand_id);
          if (brand) {
            sku.brand = brand;
          }
        }
      }
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
};

/**
 * Create a new SKU
 */
exports.createSku = (req, res) => {
  try {
    const {
      sku_id, product_id, name, variant, barcode, upc,
      size, weight, dimensions, price, inventory, images
    } = req.body;
    
    // Validate required fields
    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'product_id is required'
      });
    }
    
    // Check if product exists
    const product = db.getItemById('products', 'product_id', product_id);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Product with ID '${product_id}' does not exist`
      });
    }
    
    // Check if SKU ID already exists
    if (sku_id) {
      const existingSku = db.getItemById('skus', 'sku_id', sku_id);
      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `SKU with ID '${sku_id}' already exists`
        });
      }
    }
    
    // Create new SKU object
    const newSku = {
      sku_id: sku_id || `SKU-${uuidv4().slice(0, 8)}`,
      product_id,
      name: name || product.name,
      variant: variant || 'Standard',
      barcode,
      upc,
      size,
      weight: weight || { value: 0, unit: 'g' },
      dimensions: dimensions || { length: 0, width: 0, height: 0, unit: 'cm' },
      price: price || { base: 0, currency: 'PHP' },
      inventory: inventory || { 
        stock_level: 'Medium', 
        quantity: 0, 
        reorder_point: 0 
      },
      images: images || [],
      meta: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        source_system: 'API'
      }
    };
    
    // Add SKU to database
    db.addItem('skus', newSku);
    
    return res.status(201).json({
      success: true,
      data: newSku
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
 * Update an existing SKU
 */
exports.updateSku = (req, res) => {
  try {
    const skuId = req.params.skuId;
    const updates = req.body;
    
    // Validate SKU exists
    const existingSku = db.getItemById('skus', 'sku_id', skuId);
    if (!existingSku) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `SKU with ID '${skuId}' not found`
      });
    }
    
    // Validate product_id if being updated
    if (updates.product_id) {
      const product = db.getItemById('products', 'product_id', updates.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Product with ID '${updates.product_id}' does not exist`
        });
      }
    }
    
    // Prevent changing the SKU ID through updates
    if (updates.sku_id && updates.sku_id !== skuId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot change sku_id once created'
      });
    }
    
    // Update meta.updated_at
    if (!updates.meta) {
      updates.meta = { ...existingSku.meta };
    }
    updates.meta.updated_at = new Date().toISOString();
    
    // Apply updates
    const updatedSku = db.updateItem('skus', 'sku_id', skuId, updates);
    
    return res.json({
      success: true,
      data: updatedSku
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
 * Delete a SKU
 */
exports.deleteSku = (req, res) => {
  try {
    const skuId = req.params.skuId;
    
    // Check if SKU exists
    const existingSku = db.getItemById('skus', 'sku_id', skuId);
    if (!existingSku) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `SKU with ID '${skuId}' not found`
      });
    }
    
    // Delete the SKU
    const deleted = db.deleteItem('skus', 'sku_id', skuId);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Error deleting SKU'
      });
    }
    
    return res.json({
      success: true,
      message: `SKU with ID '${skuId}' deleted successfully`
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
 * Get SKUs by product ID
 */
exports.getSkusByProduct = (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Check if product exists
    const product = db.getItemById('products', 'product_id', productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Product with ID '${productId}' not found`
      });
    }
    
    // Find all SKUs for this product
    const skus = db.getCollection('skus').filter(
      sku => sku.product_id === productId
    );
    
    return res.json({
      success: true,
      count: skus.length,
      product: product.name,
      data: skus
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};