/**
 * Sample Data Import Utility
 * 
 * This script imports sample data from sample_data.json into the database.
 * Run with: node utils/import_sample_data.js
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

console.log('Starting sample data import...');

// Path to sample data file
const sampleDataPath = path.join(__dirname, '..', 'data', 'sample_data.json');

try {
  // Check if sample data file exists
  if (!fs.existsSync(sampleDataPath)) {
    console.error(`Sample data file not found: ${sampleDataPath}`);
    process.exit(1);
  }
  
  // Read sample data
  const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
  
  // Import data
  const importStats = db.importData(sampleData);
  
  console.log('Sample data import completed successfully');
  console.log('Import statistics:');
  console.log(`- Brands: ${importStats.brands}`);
  console.log(`- Categories: ${importStats.categories}`);
  console.log(`- Products: ${importStats.products}`);
  console.log(`- SKUs: ${importStats.skus}`);
  
} catch (error) {
  console.error('Error importing sample data:', error);
  process.exit(1);
}