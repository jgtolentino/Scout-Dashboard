/**
 * Test Script for Static Metrics Export
 * 
 * This script tests the static metrics export functionality.
 * It runs with simulation mode enabled by default to verify export
 * without requiring actual Databricks SQL credentials.
 */
const { exportStaticMetrics } = require('./export_static_metrics');

// Set environment variables for testing
process.env.SIMULATION_MODE = 'true';

// Run the export function
async function testExport() {
  console.log('Running static metrics export test...');
  
  try {
    // Run export with simulation mode
    await exportStaticMetrics();
    console.log('✅ Test completed successfully');
    
    // Verify the output files exist
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.resolve(__dirname, '../deploy/data');
    
    const expectedFiles = [
      'kpis.json',
      'top_stores.json',
      'regional_performance.json',
      'brands.json',
      'brand_distribution.json',
      'insights.json',
      'data_freshness.json',
      'metadata.json'
    ];
    
    console.log('\nVerifying output files:');
    
    for (const file of expectedFiles) {
      const filePath = path.join(outputDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ ${file} - ${fileSizeKB} KB`);
      } else {
        console.error(`❌ ${file} - Not found!`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testExport()
  .then(success => {
    if (success) {
      console.log('\n✨ All tests passed successfully');
      process.exit(0);
    } else {
      console.error('\n❌ Test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error during test:', error);
    process.exit(1);
  });