/**
 * Brand-SKU Master Data Schema
 * 
 * This file defines the core schema for the Brand-SKU master data system.
 * It contains schema definitions for brands, categories, products, and SKUs
 * that form the foundation of the product catalog.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Brand Schema
 * Represents a product brand or manufacturer
 */
const brandSchema = new Schema({
  brand_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  logo_url: String,
  website_url: String,
  parent_company: String,
  country_of_origin: String,
  founded_year: Number,
  meta: {
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    source_system: String
  }
});

/**
 * Category Schema
 * Represents a product category hierarchy
 */
const categorySchema = new Schema({
  category_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  parent_category_id: {
    type: String,
    index: true
  },
  level: {
    type: Number,
    default: 0
  },
  path: [String], // Array of ancestor categories forming a path
  meta: {
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  }
});

/**
 * Product Schema
 * Represents a product within the catalog
 */
const productSchema = new Schema({
  product_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  brand_id: {
    type: String,
    required: true,
    index: true
  },
  category_id: {
    type: String,
    required: true,
    index: true
  },
  subcategory_id: {
    type: String,
    index: true
  },
  images: [{
    url: String,
    alt_text: String,
    is_primary: Boolean
  }],
  meta: {
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'discontinued', 'pending'],
      default: 'active'
    },
    source_system: String
  }
});

/**
 * SKU Schema
 * Represents a specific stock keeping unit of a product
 */
const skuSchema = new Schema({
  sku_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  product_id: {
    type: String,
    required: true,
    index: true
  },
  barcode: {
    type: String,
    index: true
  },
  upc: {
    type: String,
    index: true
  },
  name: String,
  variant: String,
  size: String,
  weight: {
    value: Number,
    unit: {
      type: String,
      default: 'g'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      default: 'cm'
    }
  },
  price: {
    base: Number,
    currency: {
      type: String,
      default: 'PHP'
    }
  },
  inventory: {
    stock_level: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Out of Stock'],
      default: 'Medium'
    },
    quantity: {
      type: Number,
      default: 0
    },
    reorder_point: Number
  },
  images: [{
    url: String,
    alt_text: String,
    is_primary: Boolean
  }],
  meta: {
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'discontinued', 'pending'],
      default: 'active'
    },
    source_system: String,
    last_sync_date: Date
  }
});

// Virtual properties to populate brand and product details when querying SKUs
skuSchema.virtual('brand', {
  ref: 'Brand',
  localField: 'product.brand_id',
  foreignField: 'brand_id',
  justOne: true
});

skuSchema.virtual('product', {
  ref: 'Product',
  localField: 'product_id',
  foreignField: 'product_id',
  justOne: true
});

// Create models
const Brand = mongoose.model('Brand', brandSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const SKU = mongoose.model('SKU', skuSchema);

module.exports = {
  Brand,
  Category,
  Product,
  SKU
};