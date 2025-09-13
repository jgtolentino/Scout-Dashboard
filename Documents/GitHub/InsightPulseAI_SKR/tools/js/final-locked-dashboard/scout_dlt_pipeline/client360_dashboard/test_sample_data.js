/**
 * Test script for sample data SQL queries
 * 
 * This script tests the sample data loader to ensure it can properly
 * handle SQL-like queries and return appropriate data.
 * 
 * Usage: node test_sample_data.js
 */

// Mock browser environment for testing
global.fetch = async (url) => {
  const fs = require('fs');
  const path = require('path');
  
  // Handle different URL paths
  if (url.includes('minimal_sample.json')) {
    // Loading the sample data JSON
    const filePath = path.join(__dirname, 'data', 'sample_data', 'minimal_sample.json');
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return {
        ok: true,
        text: () => Promise.resolve(data),
        json: () => Promise.resolve(JSON.parse(data))
      };
    } catch (err) {
      return {
        ok: false,
        statusText: err.message
      };
    }
  } else if (url.includes('sql_queries.js')) {
    // Loading the SQL queries module
    const filePath = path.join(__dirname, 'data', 'sql_queries.js');
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return {
        ok: true,
        text: () => Promise.resolve(data)
      };
    } catch (err) {
      return {
        ok: false,
        statusText: err.message
      };
    }
  }
  
  // Default fallback for unknown URLs
  return {
    ok: false,
    statusText: 'Not found'
  };
};

// Create the window object for the SampleDataLoader
global.window = {};

// Load the sample data loader
require('./js/sample_data_loader.js');
const { executeQuery, loadSQLQueries } = global.window.SampleDataLoader;

// Test SQL queries against sample data
async function runTests() {
  console.log('Testing sample data SQL query execution...\n');
  
  try {
    // Test 1: KPIs query
    console.log('Test 1: KPIs Query');
    const kpisQuery = `
      SELECT
        SUM(sales_amount) AS total_sales,
        AVG(conversion_rate) AS conversion_rate
      FROM gold_store_interaction_metrics
      WHERE date >= current_date - 30
    `;
    const kpisResult = await executeQuery(kpisQuery);
    console.log('KPIs Result:', JSON.stringify(kpisResult, null, 2));
    console.log('----------------------------------------\n');
    
    // Test 2: Brand Performance query
    console.log('Test 2: Brand Performance Query');
    const brandsQuery = `
      SELECT
        brand_name,
        performance_score
      FROM platinum_brand_insights
      ORDER BY performance_score DESC
      LIMIT 5
    `;
    const brandsResult = await executeQuery(brandsQuery);
    console.log('Brands Result:', JSON.stringify(brandsResult, null, 2));
    console.log('----------------------------------------\n');
    
    // Test 3: Insights query
    console.log('Test 3: Insights Query');
    const insightsQuery = `
      SELECT
        insight_type,
        insight_text
      FROM platinum_insight_recommendations
      LIMIT 3
    `;
    const insightsResult = await executeQuery(insightsQuery);
    console.log('Insights Result:', JSON.stringify(insightsResult, null, 2));
    console.log('----------------------------------------\n');
    
    // Test 4: Load SQL queries
    console.log('Test 4: Loading SQL Queries');
    const queries = await loadSQLQueries();
    console.log('SQL Queries Loaded:', Object.keys(queries));
    console.log('----------------------------------------\n');
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
runTests();