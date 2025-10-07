/**
 * LowDB Database Utility for Brand-SKU Master Data
 * 
 * This module provides a simple database interface using LowDB,
 * which stores data in JSON files. It's designed for prototyping
 * and can be replaced with MongoDB or another database in production.
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database file if it doesn't exist
const dbPath = path.join(dataDir, 'masterdata.json');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({
    brands: [],
    categories: [],
    products: [],
    skus: []
  }));
}

// Initialize database
const adapter = new FileSync(dbPath);
const db = low(adapter);

// Set defaults (initial data structure)
db.defaults({
  brands: [],
  categories: [],
  products: [],
  skus: []
}).write();

/**
 * Get a collection from the database
 * @param {string} collection - Collection name ('brands', 'categories', 'products', 'skus')
 * @returns {Array} - Collection data
 */
function getCollection(collection) {
  return db.get(collection).value();
}

/**
 * Get a single item by ID from a collection
 * @param {string} collection - Collection name
 * @param {string} idField - Name of the ID field (e.g., 'brand_id', 'sku_id')
 * @param {string} id - ID value to search for
 * @returns {Object|null} - Item or null if not found
 */
function getItemById(collection, idField, id) {
  return db.get(collection).find({ [idField]: id }).value() || null;
}

/**
 * Add an item to a collection
 * @param {string} collection - Collection name
 * @param {Object} item - Item to add
 * @returns {Object} - Added item
 */
function addItem(collection, item) {
  db.get(collection).push(item).write();
  return item;
}

/**
 * Update an item in a collection
 * @param {string} collection - Collection name
 * @param {string} idField - Name of the ID field
 * @param {string} id - ID value to update
 * @param {Object} updates - Updated fields
 * @returns {Object|null} - Updated item or null if not found
 */
function updateItem(collection, idField, id, updates) {
  const item = getItemById(collection, idField, id);
  if (!item) return null;
  
  // Apply updates
  Object.assign(item, updates);
  
  // Update 'updated_at' in meta if it exists
  if (item.meta && item.meta.updated_at) {
    item.meta.updated_at = new Date().toISOString();
  }
  
  // Write changes
  db.write();
  
  return item;
}

/**
 * Delete an item from a collection
 * @param {string} collection - Collection name
 * @param {string} idField - Name of the ID field
 * @param {string} id - ID value to delete
 * @returns {boolean} - True if deleted, false if not found
 */
function deleteItem(collection, idField, id) {
  const initialLength = db.get(collection).size().value();
  db.get(collection).remove({ [idField]: id }).write();
  const newLength = db.get(collection).size().value();
  
  return newLength < initialLength;
}

/**
 * Query items with filters
 * @param {string} collection - Collection name
 * @param {Object} filters - Filter conditions
 * @returns {Array} - Filtered items
 */
function queryItems(collection, filters) {
  let query = db.get(collection);
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key && value !== undefined) {
      // Handle nested properties with dot notation (e.g., 'meta.status')
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        query = query.filter(item => 
          item[parent] && item[parent][child] === value
        );
      } else {
        // For string values, enable partial matching (case-insensitive)
        if (typeof value === 'string') {
          query = query.filter(item => {
            const itemValue = item[key];
            return itemValue && 
              itemValue.toLowerCase().includes(value.toLowerCase());
          });
        } else {
          query = query.filter({ [key]: value });
        }
      }
    }
  });
  
  return query.value();
}

/**
 * Import data into the database
 * @param {Object} data - Data object with collections to import
 * @returns {Object} - Import statistics
 */
function importData(data) {
  const stats = {
    brands: 0,
    categories: 0,
    products: 0,
    skus: 0
  };
  
  // Process each collection if it exists in the data
  ['brands', 'categories', 'products', 'skus'].forEach(collection => {
    if (Array.isArray(data[collection])) {
      // Clear existing data in the collection
      db.set(collection, []).write();
      
      // Add new data
      db.set(collection, data[collection]).write();
      stats[collection] = data[collection].length;
    }
  });
  
  return stats;
}

/**
 * Perform a text search across all collections or a specific one
 * @param {string} query - Text to search for
 * @param {string} [collection] - Optional collection to limit search to
 * @returns {Object} - Search results grouped by collection
 */
function search(query, collection) {
  const searchTerm = query.toLowerCase();
  const results = {};
  
  // Define collections to search based on input
  const collectionsToSearch = collection ? 
    [collection] : ['brands', 'categories', 'products', 'skus'];
  
  // Define fields to search in each collection
  const searchableFields = {
    brands: ['name', 'description', 'brand_id'],
    categories: ['name', 'description', 'category_id'],
    products: ['name', 'description', 'product_id'],
    skus: ['name', 'variant', 'sku_id', 'barcode', 'upc']
  };
  
  // Perform search
  collectionsToSearch.forEach(coll => {
    if (!searchableFields[coll]) return;
    
    const fields = searchableFields[coll];
    results[coll] = db.get(coll)
      .filter(item => {
        return fields.some(field => {
          const value = item[field];
          return value && 
            value.toString().toLowerCase().includes(searchTerm);
        });
      })
      .value();
  });
  
  return results;
}

module.exports = {
  getCollection,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
  queryItems,
  importData,
  search
};