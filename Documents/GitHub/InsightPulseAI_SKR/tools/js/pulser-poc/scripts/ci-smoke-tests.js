#!/usr/bin/env node

/**
 * CI Smoke Tests for Brand Performance API
 * Validates API endpoints, schema compliance, and data integrity
 * Usage: node scripts/ci-smoke-tests.js [--api-url=http://127.0.0.1:7072]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_API_URL = 'http://127.0.0.1:7072';
const EXPECTED_BRAND_COUNT = 500;
const TIMEOUT_MS = 10000;

// Parse command line arguments
const args = process.argv.slice(2);
const apiUrl = args.find(arg => arg.startsWith('--api-url='))?.split('=')[1] || DEFAULT_API_URL;

// Load schema for validation
const schemaPath = path.join(__dirname, '../api/schema/brands.json');
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load schema:', error.message);
  process.exit(1);
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function makeRequest(url, timeout = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
            responseTime,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            responseTime,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

function validateSchema(data, schemaRef) {
  // Simple schema validation (in production, use ajv or similar)
  try {
    if (schemaRef === '#/definitions/kpis') {
      return validateKPIs(data);
    } else if (schemaRef === '#/definitions/marketShare') {
      return validateMarketShare(data);
    } else if (schemaRef === '#/definitions/leaderboard') {
      return validateLeaderboard(data);
    } else if (schemaRef === '#/definitions/movers') {
      return validateMovers(data);
    } else if (schemaRef === '#/definitions/insights') {
      return validateInsights(data);
    } else if (schemaRef === '#/definitions/healthCheck') {
      return validateHealthCheck(data);
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function validateKPIs(data) {
  if (typeof data !== 'object') throw new Error('KPIs must be an object');
  if (typeof data.totalRevenue !== 'number' || data.totalRevenue < 0) {
    throw new Error('totalRevenue must be a positive number');
  }
  if (!data.topBrand || typeof data.topBrand.name !== 'string' || typeof data.topBrand.value !== 'number') {
    throw new Error('topBrand must have name (string) and value (number)');
  }
  if (!data.fastestGrowth || typeof data.fastestGrowth.name !== 'string' || typeof data.fastestGrowth.change !== 'number') {
    throw new Error('fastestGrowth must have name (string) and change (number)');
  }
  if (!data.topCategory || typeof data.topCategory.name !== 'string' || typeof data.topCategory.value !== 'number') {
    throw new Error('topCategory must have name (string) and value (number)');
  }
  return { valid: true };
}

function validateMarketShare(data) {
  if (!Array.isArray(data)) throw new Error('Market share must be an array');
  if (data.length === 0) throw new Error('Market share array cannot be empty');
  
  for (const item of data) {
    if (typeof item.name !== 'string' || item.name.length === 0) {
      throw new Error('Market share item must have non-empty name');
    }
    if (typeof item.value !== 'number' || item.value < 0) {
      throw new Error('Market share item must have positive value');
    }
    if (typeof item.percentage !== 'string' || !/^\d+\.\d+$/.test(item.percentage)) {
      throw new Error('Market share item must have percentage as decimal string');
    }
  }
  return { valid: true };
}

function validateLeaderboard(data) {
  if (!Array.isArray(data)) throw new Error('Leaderboard must be an array');
  if (data.length === 0) throw new Error('Leaderboard array cannot be empty');
  
  for (const item of data) {
    if (typeof item.brand !== 'string' || item.brand.length === 0) {
      throw new Error('Leaderboard item must have non-empty brand name');
    }
    if (typeof item.value !== 'number' || item.value < 0) {
      throw new Error('Leaderboard item must have positive value');
    }
  }
  return { valid: true };
}

function validateMovers(data) {
  if (typeof data !== 'object') throw new Error('Movers must be an object');
  if (!Array.isArray(data.gainers)) throw new Error('Movers must have gainers array');
  if (!Array.isArray(data.losers)) throw new Error('Movers must have losers array');
  return { valid: true };
}

function validateInsights(data) {
  if (!Array.isArray(data)) throw new Error('Insights must be an array');
  if (data.length === 0) throw new Error('Insights array cannot be empty');
  
  const validTypes = ['growth', 'competition', 'category', 'anomaly', 'trend'];
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  
  for (const item of data) {
    if (!validTypes.includes(item.type)) {
      throw new Error(`Invalid insight type: ${item.type}`);
    }
    if (typeof item.title !== 'string' || item.title.length === 0) {
      throw new Error('Insight must have non-empty title');
    }
    if (typeof item.message !== 'string' || item.message.length === 0) {
      throw new Error('Insight must have non-empty message');
    }
    if (!validPriorities.includes(item.priority)) {
      throw new Error(`Invalid insight priority: ${item.priority}`);
    }
  }
  return { valid: true };
}

function validateHealthCheck(data) {
  if (typeof data !== 'object') throw new Error('Health check must be an object');
  if (!['healthy', 'degraded', 'error'].includes(data.status)) {
    throw new Error(`Invalid health status: ${data.status}`);
  }
  if (data.service !== 'brands-api') {
    throw new Error(`Invalid service name: ${data.service}`);
  }
  if (typeof data.data !== 'object' || typeof data.data.recordCount !== 'number') {
    throw new Error('Health check must include data with recordCount');
  }
  return { valid: true };
}

async function runTest(name, testFn) {
  try {
    log(`Running test: ${name}`);
    const result = await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASS', ...result });
    log(`✅ ${name} - PASSED`, 'success');
    return true;
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    log(`❌ ${name} - FAILED: ${error.message}`, 'error');
    return false;
  }
}

// Test definitions
const tests = [
  {
    name: 'Health Check Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/health`);
      
      if (response.statusCode !== 200 && response.statusCode !== 206) {
        throw new Error(`Expected status 200 or 206, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      const validation = validateSchema(response.data, '#/definitions/healthCheck');
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.error}`);
      }
      
      return {
        responseTime: response.responseTime,
        status: response.data.status,
        recordCount: response.data.data.recordCount
      };
    }
  },
  
  {
    name: 'KPIs Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/brands/kpis`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      const validation = validateSchema(response.data, '#/definitions/kpis');
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.error}`);
      }
      
      // Business logic validation
      if (response.data.totalRevenue <= 0) {
        throw new Error('Total revenue must be positive');
      }
      
      return {
        responseTime: response.responseTime,
        totalRevenue: response.data.totalRevenue,
        topBrand: response.data.topBrand.name
      };
    }
  },
  
  {
    name: 'Market Share Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/brands/market-share`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      const validation = validateSchema(response.data, '#/definitions/marketShare');
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.error}`);
      }
      
      // Check that percentages add up reasonably (allowing for rounding)
      const totalPercentage = response.data.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
      if (totalPercentage < 95 || totalPercentage > 105) {
        throw new Error(`Market share percentages don't add up correctly: ${totalPercentage}%`);
      }
      
      return {
        responseTime: response.responseTime,
        brandCount: response.data.length,
        totalPercentage
      };
    }
  },
  
  {
    name: 'Leaderboard Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/brands/leaderboard?limit=10`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      // Validate new paginated response structure
      if (typeof response.data !== 'object' || !response.data.leaders) {
        throw new Error('Expected paginated response with leaders array');
      }
      
      if (!Array.isArray(response.data.leaders)) {
        throw new Error('Leaders must be an array');
      }
      
      if (response.data.leaders.length !== 10) {
        throw new Error(`Expected 10 leaders, got ${response.data.leaders.length}`);
      }
      
      // Validate pagination metadata
      if (typeof response.data.totalBrands !== 'number' || response.data.totalBrands <= 0) {
        throw new Error('totalBrands must be a positive number');
      }
      
      if (response.data.page !== 1) {
        throw new Error('Expected page 1 for default request');
      }
      
      if (response.data.limit !== 10) {
        throw new Error('Expected limit 10 for request');
      }
      
      // Check that leaderboard is sorted by value (descending)
      for (let i = 1; i < response.data.leaders.length; i++) {
        if (response.data.leaders[i].value > response.data.leaders[i-1].value) {
          throw new Error('Leaderboard is not properly sorted by value');
        }
      }
      
      // Validate leader structure
      const firstLeader = response.data.leaders[0];
      if (!firstLeader.name || typeof firstLeader.value !== 'number') {
        throw new Error('Leader must have name and value properties');
      }
      
      return {
        responseTime: response.responseTime,
        totalBrands: response.data.totalBrands,
        returnedLeaders: response.data.leaders.length,
        topBrand: firstLeader.name,
        topValue: firstLeader.value,
        hasNextPage: response.data.hasNextPage
      };
    }
  },
  
  {
    name: 'Movers Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/brands/movers`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      const validation = validateSchema(response.data, '#/definitions/movers');
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.error}`);
      }
      
      return {
        responseTime: response.responseTime,
        gainersCount: response.data.gainers.length,
        losersCount: response.data.losers.length
      };
    }
  },
  
  {
    name: 'Insights Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/brands/insights`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      const validation = validateSchema(response.data, '#/definitions/insights');
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.error}`);
      }
      
      return {
        responseTime: response.responseTime,
        insightCount: response.data.length,
        types: [...new Set(response.data.map(i => i.type))]
      };
    }
  },
  
  {
    name: 'Cache Performance Test',
    test: async () => {
      // Test cache miss (first request)
      const firstResponse = await makeRequest(`${apiUrl}/api/brands/leaderboard?limit=5&page=2`);
      
      if (firstResponse.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${firstResponse.statusCode}`);
      }
      
      if (!firstResponse.data || !firstResponse.data.leaders) {
        throw new Error('Invalid response structure');
      }
      
      if (firstResponse.data.leaders.length !== 5) {
        throw new Error(`Expected 5 leaders, got ${firstResponse.data.leaders.length}`);
      }
      
      if (firstResponse.data.page !== 2) {
        throw new Error(`Expected page 2, got ${firstResponse.data.page}`);
      }
      
      // Test cache hit (second request - should be faster)
      const secondResponse = await makeRequest(`${apiUrl}/api/brands/leaderboard?limit=5&page=2`);
      
      if (secondResponse.statusCode !== 200) {
        throw new Error(`Cache hit request failed with status ${secondResponse.statusCode}`);
      }
      
      // Validate cache metadata
      const cacheInfo = secondResponse.data._cache;
      if (!cacheInfo || typeof cacheInfo.hit !== 'boolean') {
        throw new Error('Missing cache metadata in response');
      }
      
      return {
        firstRequestTime: firstResponse.responseTime,
        secondRequestTime: secondResponse.responseTime,
        cacheHit: cacheInfo.hit,
        cacheKey: cacheInfo.key,
        performanceGain: firstResponse.responseTime > secondResponse.responseTime
      };
    }
  },

  {
    name: 'System Status Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/status`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      // Validate response structure
      if (!response.data.status || !response.data.metrics) {
        throw new Error('Invalid status response structure');
      }
      
      // Validate status values
      const validStatuses = ['healthy', 'degraded', 'error'];
      if (!validStatuses.includes(response.data.status)) {
        throw new Error(`Invalid status value: ${response.data.status}`);
      }
      
      // Validate metrics presence
      const { p99, errorRate, cacheHitRate, uptime } = response.data.metrics;
      if (typeof p99 !== 'number' || typeof errorRate !== 'number') {
        throw new Error('Missing required metrics (p99, errorRate)');
      }
      
      if (typeof uptime !== 'number' || uptime < 0) {
        throw new Error('Invalid uptime metric');
      }
      
      // Validate timestamp
      if (!response.data.lastChecked || isNaN(Date.parse(response.data.lastChecked))) {
        throw new Error('Invalid or missing lastChecked timestamp');
      }
      
      return {
        status: response.data.status,
        p99: Math.round(p99),
        errorRate: (errorRate * 100).toFixed(2) + '%',
        cacheHitRate: typeof cacheHitRate === 'number' ? (cacheHitRate * 100).toFixed(1) + '%' : 'N/A',
        uptime: Math.round(uptime) + 's',
        responseTime: response.responseTime
      };
    }
  },

  {
    name: 'Detailed Metrics Endpoint',
    test: async () => {
      const response = await makeRequest(`${apiUrl}/api/metrics`);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
      }
      
      if (!response.data) {
        throw new Error('No JSON data received');
      }
      
      // Validate metrics structure
      const { requests, cache, uptime, memory, timestamp } = response.data;
      
      if (!requests || typeof requests.total !== 'number') {
        throw new Error('Invalid requests metrics structure');
      }
      
      if (!requests.responseTime || typeof requests.responseTime.p99 !== 'number') {
        throw new Error('Missing response time percentiles');
      }
      
      if (!cache || typeof cache.hits !== 'number' || typeof cache.misses !== 'number') {
        throw new Error('Invalid cache metrics structure');
      }
      
      if (typeof uptime !== 'number' || uptime < 0) {
        throw new Error('Invalid uptime metric');
      }
      
      if (!memory || typeof memory.heapUsed !== 'number') {
        throw new Error('Invalid memory metrics structure');
      }
      
      if (!timestamp || isNaN(Date.parse(timestamp))) {
        throw new Error('Invalid or missing timestamp');
      }
      
      return {
        totalRequests: requests.total,
        errorRate: (requests.errorRate * 100).toFixed(2) + '%',
        p99: Math.round(requests.responseTime.p99),
        p95: Math.round(requests.responseTime.p95),
        cacheHits: cache.hits,
        cacheMisses: cache.misses,
        memoryUsage: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        responseTime: response.responseTime
      };
    }
  },

  {
    name: 'Performance Test',
    test: async () => {
      const startTime = Date.now();
      const promises = [
        makeRequest(`${apiUrl}/api/brands/kpis`),
        makeRequest(`${apiUrl}/api/brands/market-share`),
        makeRequest(`${apiUrl}/api/brands/leaderboard`),
        makeRequest(`${apiUrl}/api/brands/movers`),
        makeRequest(`${apiUrl}/api/brands/insights`)
      ];
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // Check that all requests succeeded
      for (const response of responses) {
        if (response.statusCode !== 200) {
          throw new Error(`Concurrent request failed with status ${response.statusCode}`);
        }
      }
      
      // Performance thresholds
      const maxTotalTime = 5000; // 5 seconds for all requests
      const maxIndividualTime = 2000; // 2 seconds per request
      
      if (totalTime > maxTotalTime) {
        throw new Error(`Total time ${totalTime}ms exceeds threshold ${maxTotalTime}ms`);
      }
      
      for (const response of responses) {
        if (response.responseTime > maxIndividualTime) {
          throw new Error(`Individual response time ${response.responseTime}ms exceeds threshold ${maxIndividualTime}ms`);
        }
      }
      
      return {
        totalTime,
        averageTime: Math.round(totalTime / responses.length),
        maxResponseTime: Math.max(...responses.map(r => r.responseTime))
      };
    }
  }
];

// Main execution
async function main() {
  log('🚀 Starting CI Smoke Tests for Brand Performance API');
  log(`📍 API URL: ${apiUrl}`);
  log(`📊 Expected brand count: ${EXPECTED_BRAND_COUNT}`);
  log(`⏱️ Timeout: ${TIMEOUT_MS}ms`);
  console.log('');
  
  // Run all tests
  for (const { name, test } of tests) {
    await runTest(name, test);
  }
  
  // Summary
  console.log('');
  log('📋 Test Summary:');
  log(`✅ Passed: ${results.passed}`);
  log(`❌ Failed: ${results.failed}`);
  log(`📊 Total: ${results.tests.length}`);
  
  if (results.failed > 0) {
    console.log('');
    log('❌ Failed Tests:', 'error');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => log(`  - ${t.name}: ${t.error}`, 'error'));
  }
  
  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  log(`🏁 Tests completed with exit code ${exitCode}`);
  
  // Output results for CI
  if (process.env.CI) {
    const output = {
      timestamp: new Date().toISOString(),
      apiUrl,
      summary: {
        passed: results.passed,
        failed: results.failed,
        total: results.tests.length
      },
      tests: results.tests
    };
    
    fs.writeFileSync('smoke-test-results.json', JSON.stringify(output, null, 2));
    log('📄 Results written to smoke-test-results.json');
  }
  
  process.exit(exitCode);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`💥 Unhandled rejection: ${error.message}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run tests
main().catch(error => {
  log(`💥 Test execution failed: ${error.message}`, 'error');
  process.exit(1);
});
