#!/usr/bin/env node

/**
 * UAT Deployment Validation Script
 * Validates the Scout Dashboard deployment in UAT environment
 */

const https = require('https');
const { spawn } = require('child_process');

// Configuration
const UAT_BASE_URL = process.env.UAT_BASE_URL || 'https://scout-dashboard-uat.azurestaticapps.net';
const VALIDATION_TIMEOUT = 30000; // 30 seconds

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * Make HTTPS request with promise
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(VALIDATION_TIMEOUT);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Test endpoint availability
 */
async function testEndpoint(name, path, expectedStatus = 200) {
  const url = `${UAT_BASE_URL}${path}`;
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await httpsRequest(url);
    
    if (response.statusCode === expectedStatus) {
      console.log(`   ${colors.green}✅ Status: ${response.statusCode}${colors.reset}`);
      results.passed++;
      return true;
    } else {
      console.log(`   ${colors.red}❌ Status: ${response.statusCode} (expected ${expectedStatus})${colors.reset}`);
      results.failed++;
      results.details.push(`${name}: Got status ${response.statusCode}, expected ${expectedStatus}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    results.failed++;
    results.details.push(`${name}: ${error.message}`);
    return false;
  }
}

/**
 * Test API data integrity
 */
async function testApiData(name, path, validator) {
  const url = `${UAT_BASE_URL}${path}`;
  console.log(`\n📊 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await httpsRequest(url);
    
    if (response.statusCode !== 200) {
      console.log(`   ${colors.red}❌ Status: ${response.statusCode}${colors.reset}`);
      results.failed++;
      results.details.push(`${name}: Non-200 status code`);
      return false;
    }
    
    const data = JSON.parse(response.data);
    const validationResult = validator(data);
    
    if (validationResult === true) {
      console.log(`   ${colors.green}✅ Data validation passed${colors.reset}`);
      results.passed++;
      return true;
    } else {
      console.log(`   ${colors.red}❌ Data validation failed: ${validationResult}${colors.reset}`);
      results.failed++;
      results.details.push(`${name}: ${validationResult}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    results.failed++;
    results.details.push(`${name}: ${error.message}`);
    return false;
  }
}

/**
 * Test page load performance
 */
async function testPerformance(name, path, maxLoadTime = 3000) {
  const url = `${UAT_BASE_URL}${path}`;
  console.log(`\n⚡ Testing ${name} performance...`);
  console.log(`   URL: ${url}`);
  console.log(`   Max load time: ${maxLoadTime}ms`);
  
  const startTime = Date.now();
  
  try {
    await httpsRequest(url);
    const loadTime = Date.now() - startTime;
    
    console.log(`   Load time: ${loadTime}ms`);
    
    if (loadTime <= maxLoadTime) {
      console.log(`   ${colors.green}✅ Performance passed${colors.reset}`);
      results.passed++;
      return true;
    } else {
      console.log(`   ${colors.yellow}⚠️  Performance warning (${loadTime}ms > ${maxLoadTime}ms)${colors.reset}`);
      results.warnings++;
      results.details.push(`${name}: Load time ${loadTime}ms exceeds threshold`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    results.failed++;
    results.details.push(`${name}: ${error.message}`);
    return false;
  }
}

/**
 * Main validation routine
 */
async function runValidation() {
  console.log(`${colors.blue}🚀 Scout Dashboard UAT Validation${colors.reset}`);
  console.log(`${colors.blue}===================================${colors.reset}`);
  console.log(`Base URL: ${UAT_BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  // Test static pages
  await testEndpoint('Homepage', '/');
  await testEndpoint('Health Check', '/api/health');
  
  // Test API endpoints
  await testEndpoint('Transaction Trends API', '/api/transactions/trends');
  await testEndpoint('Product Mix API', '/api/products/mix');
  await testEndpoint('Consumer Behavior API', '/api/consumer/behavior');
  await testEndpoint('Customer Profiles API', '/api/customer/profiles');
  
  // Test data integrity
  await testApiData('Transaction Data', '/api/transactions/trends?period=daily', (data) => {
    if (!data.data || !Array.isArray(data.data)) {
      return 'Missing or invalid data array';
    }
    if (data.data.length === 0) {
      return 'No transaction data found';
    }
    return true;
  });
  
  await testApiData('TBWA Brands', '/api/products/brands', (data) => {
    if (!data.data || !Array.isArray(data.data)) {
      return 'Missing or invalid data array';
    }
    
    const tbwaBrands = ['Del Monte', 'Oishi', 'Alaska', 'Peerless'];
    const foundBrands = data.data.filter(item => 
      tbwaBrands.some(brand => item.brandFamily && item.brandFamily.includes(brand))
    );
    
    if (foundBrands.length === 0) {
      return 'TBWA brands not found in data';
    }
    
    console.log(`   Found ${foundBrands.length} TBWA brand entries`);
    return true;
  });
  
  // Test performance
  await testPerformance('Homepage Load', '/', 3000);
  await testPerformance('API Response', '/api/transactions/trends', 2000);
  
  // Print summary
  console.log(`\n${colors.blue}📋 Validation Summary${colors.reset}`);
  console.log(`${colors.blue}===================${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  
  if (results.details.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.details.forEach(detail => {
      console.log(`  - ${detail}`);
    });
  }
  
  // Exit code
  const exitCode = results.failed > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? colors.green : colors.red}Exit code: ${exitCode}${colors.reset}`);
  process.exit(exitCode);
}

// Run validation
runValidation().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});