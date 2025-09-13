/**
 * Data Ingestion Utility
 *
 * This module provides utilities for ingesting product master data
 * from various sources (CSV, JSON, API) into the Brand-SKU Master Data system.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const axios = require('axios');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

/**
 * Validate if a data object matches the expected schema
 * @param {Object} data - Data object to validate
 * @param {String} type - Entity type ('brand', 'category', 'product', 'sku')
 * @returns {Object} - Validation result { valid: boolean, errors: Array }
 */
function validateEntity(data, type) {
  // Simple schema validation (a more robust solution would use Joi or JSON Schema)
  const requiredFields = {
    brand: ['brand_id', 'name'],
    category: ['category_id', 'name'],
    product: ['product_id', 'name', 'brand_id', 'category_id'],
    sku: ['product_id']
  };
  
  const errors = [];
  
  if (!requiredFields[type]) {
    return { valid: false, errors: [`Invalid entity type: ${type}`] };
  }
  
  // Check required fields
  for (const field of requiredFields[type]) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Additional validation for specific types
  if (type === 'sku' && !data.sku_id) {
    // Generate a SKU ID if not provided
    data.sku_id = `SKU-${uuidv4().slice(0, 8)}`;
  }
  
  // Ensure meta fields are present
  if (!data.meta) {
    data.meta = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      source_system: 'DATA_INGESTION'
    };
  } else {
    if (!data.meta.created_at) {
      data.meta.created_at = new Date().toISOString();
    }
    if (!data.meta.updated_at) {
      data.meta.updated_at = new Date().toISOString();
    }
    if (!data.meta.status) {
      data.meta.status = 'active';
    }
    if (!data.meta.source_system) {
      data.meta.source_system = 'DATA_INGESTION';
    }
  }
  
  return { 
    valid: errors.length === 0, 
    errors,
    data // Return the potentially modified data (with generated IDs, etc.)
  };
}

/**
 * Import data from a JSON file
 * @param {String} filePath - Path to the JSON file
 * @param {Object} options - Import options
 * @returns {Object} - Import statistics
 */
function importFromJsonFile(filePath, options = {}) {
  const {
    clearExisting = false,
    validateEntities = true,
    entityTypes = ['brands', 'categories', 'products', 'skus'],
    errorOnInvalid = true
  } = options;
  
  try {
    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    // Process data based on entity types
    const stats = {
      brands: { added: 0, skipped: 0, invalid: 0 },
      categories: { added: 0, skipped: 0, invalid: 0 },
      products: { added: 0, skipped: 0, invalid: 0 },
      skus: { added: 0, skipped: 0, invalid: 0 },
      errors: []
    };
    
    // Process each entity type if present in the data
    for (const entityType of entityTypes) {
      const singularType = entityType.slice(0, -1); // 'brands' -> 'brand'
      
      if (Array.isArray(jsonData[entityType])) {
        // Clear existing data if requested
        if (clearExisting) {
          db.clearCollection(entityType);
        }
        
        // Process each entity
        for (const entity of jsonData[entityType]) {
          // Check if entity already exists
          const idField = `${singularType}_id`;
          const existingEntity = entity[idField] ? 
            db.getItemById(entityType, idField, entity[idField]) : null;
          
          if (existingEntity) {
            stats[entityType].skipped++;
            continue;
          }
          
          // Validate entity if requested
          if (validateEntities) {
            const validationResult = validateEntity(entity, singularType);
            
            if (!validationResult.valid) {
              stats[entityType].invalid++;
              stats.errors.push({
                entityType,
                entity: entity[idField] || 'unknown',
                errors: validationResult.errors
              });
              
              if (errorOnInvalid) {
                continue; // Skip this entity
              }
            }
            
            // Use potentially modified data from validation
            db.addItem(entityType, validationResult.data);
          } else {
            // Add without validation
            db.addItem(entityType, entity);
          }
          
          stats[entityType].added++;
        }
      }
    }
    
    return stats;
    
  } catch (error) {
    throw new Error(`Error importing from JSON file: ${error.message}`);
  }
}

/**
 * Import data from a CSV file
 * @param {String} filePath - Path to the CSV file
 * @param {String} entityType - Type of entity to import
 * @param {Object} options - Import options
 * @returns {Object} - Import statistics
 */
function importFromCsvFile(filePath, entityType, options = {}) {
  const {
    clearExisting = false,
    validateEntities = true,
    delimiter = ',',
    headerMapping = null,
    skipHeader = true,
    errorOnInvalid = true
  } = options;
  
  try {
    // Read and parse CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Clear existing data if requested
    if (clearExisting) {
      db.clearCollection(entityType);
    }
    
    // Process records
    const stats = {
      added: 0,
      skipped: 0,
      invalid: 0,
      errors: []
    };
    
    const singularType = entityType.slice(0, -1); // 'brands' -> 'brand'
    const idField = `${singularType}_id`;
    
    for (let record of records) {
      // Apply header mapping if provided
      if (headerMapping) {
        const mappedRecord = {};
        for (const [csvField, dbField] of Object.entries(headerMapping)) {
          if (record[csvField] !== undefined) {
            // Handle nested fields
            if (dbField.includes('.')) {
              const [parent, child] = dbField.split('.');
              if (!mappedRecord[parent]) {
                mappedRecord[parent] = {};
              }
              mappedRecord[parent][child] = record[csvField];
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          }
        }
        record = mappedRecord;
      }
      
      // Check if entity already exists
      const existingEntity = record[idField] ? 
        db.getItemById(entityType, idField, record[idField]) : null;
      
      if (existingEntity) {
        stats.skipped++;
        continue;
      }
      
      // Validate entity if requested
      if (validateEntities) {
        const validationResult = validateEntity(record, singularType);
        
        if (!validationResult.valid) {
          stats.invalid++;
          stats.errors.push({
            entity: record[idField] || 'unknown',
            errors: validationResult.errors
          });
          
          if (errorOnInvalid) {
            continue; // Skip this entity
          }
        }
        
        // Use potentially modified data from validation
        db.addItem(entityType, validationResult.data);
      } else {
        // Add without validation
        db.addItem(entityType, record);
      }
      
      stats.added++;
    }
    
    return stats;
    
  } catch (error) {
    throw new Error(`Error importing from CSV file: ${error.message}`);
  }
}

/**
 * Import data from an external API
 * @param {String} apiUrl - URL of the API endpoint
 * @param {String} entityType - Type of entity to import
 * @param {Object} options - Import options
 * @returns {Object} - Import statistics
 */
async function importFromApi(apiUrl, entityType, options = {}) {
  const {
    clearExisting = false,
    validateEntities = true,
    headers = {},
    dataPath = '', // Path to the data in the response (e.g., 'data.items')
    errorOnInvalid = true,
    transformFn = null // Function to transform API data before import
  } = options;
  
  try {
    // Fetch data from API
    const response = await axios.get(apiUrl, { headers });
    
    // Extract data from response
    let data = response.data;
    if (dataPath) {
      // Navigate through the response object using the path
      const pathParts = dataPath.split('.');
      for (const part of pathParts) {
        if (data && data[part] !== undefined) {
          data = data[part];
        } else {
          throw new Error(`Invalid data path: ${dataPath}`);
        }
      }
    }
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      throw new Error('API response data is not an array');
    }
    
    // Transform data if a transform function is provided
    if (transformFn && typeof transformFn === 'function') {
      data = data.map(transformFn);
    }
    
    // Clear existing data if requested
    if (clearExisting) {
      db.clearCollection(entityType);
    }
    
    // Process records
    const stats = {
      added: 0,
      skipped: 0,
      invalid: 0,
      errors: []
    };
    
    const singularType = entityType.slice(0, -1); // 'brands' -> 'brand'
    const idField = `${singularType}_id`;
    
    for (const entity of data) {
      // Check if entity already exists
      const existingEntity = entity[idField] ? 
        db.getItemById(entityType, idField, entity[idField]) : null;
      
      if (existingEntity) {
        stats.skipped++;
        continue;
      }
      
      // Validate entity if requested
      if (validateEntities) {
        const validationResult = validateEntity(entity, singularType);
        
        if (!validationResult.valid) {
          stats.invalid++;
          stats.errors.push({
            entity: entity[idField] || 'unknown',
            errors: validationResult.errors
          });
          
          if (errorOnInvalid) {
            continue; // Skip this entity
          }
        }
        
        // Use potentially modified data from validation
        db.addItem(entityType, validationResult.data);
      } else {
        // Add without validation
        db.addItem(entityType, entity);
      }
      
      stats.added++;
    }
    
    return stats;
    
  } catch (error) {
    throw new Error(`Error importing from API: ${error.message}`);
  }
}

/**
 * Import product images from a directory
 * @param {String} imageDir - Directory containing images
 * @param {Object} options - Import options
 * @returns {Object} - Import statistics
 */
function importImagesFromDirectory(imageDir, options = {}) {
  const {
    targetDir = path.join(__dirname, '..', 'public', 'images'),
    updateDatabase = true,
    fileNamePattern = /^([A-Z0-9\-]+)_.*\.(jpg|jpeg|png|gif)$/i, // e.g., "SKU001_front.jpg"
    entityType = 'skus',
    idField = 'sku_id'
  } = options;
  
  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Get all files in the source directory
    const files = fs.readdirSync(imageDir);
    
    const stats = {
      copied: 0,
      skipped: 0,
      updated: 0,
      errors: []
    };
    
    for (const file of files) {
      const filePath = path.join(imageDir, file);
      
      // Skip directories
      if (fs.statSync(filePath).isDirectory()) {
        continue;
      }
      
      // Check if file matches the expected pattern
      const match = file.match(fileNamePattern);
      if (!match) {
        stats.skipped++;
        continue;
      }
      
      const entityId = match[1];
      const targetPath = path.join(targetDir, file);
      
      // Copy file to target directory
      try {
        fs.copyFileSync(filePath, targetPath);
        stats.copied++;
        
        // Update database if requested
        if (updateDatabase) {
          const entity = db.getItemById(entityType, idField, entityId);
          
          if (entity) {
            // Create image URL (relative to the web root)
            const imageUrl = `/images/${file}`;
            
            // Update entity with image
            if (!entity.images) {
              entity.images = [];
            }
            
            // Check if this image is already in the array
            const existingImage = entity.images.find(img => img.url === imageUrl);
            if (!existingImage) {
              entity.images.push({
                url: imageUrl,
                alt_text: `${entity.name || entityId} image`,
                is_primary: entity.images.length === 0 // First image is primary
              });
              
              // Update entity in database
              db.updateItem(entityType, idField, entityId, entity);
              stats.updated++;
            }
          }
        }
        
      } catch (error) {
        stats.errors.push({
          file,
          error: error.message
        });
      }
    }
    
    return stats;
    
  } catch (error) {
    throw new Error(`Error importing images: ${error.message}`);
  }
}

module.exports = {
  validateEntity,
  importFromJsonFile,
  importFromCsvFile,
  importFromApi,
  importImagesFromDirectory
};