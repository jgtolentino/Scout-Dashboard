/**
 * Mock Lighthouse module for CI environments
 * 
 * This module provides a simple mock implementation of the Lighthouse
 * module to avoid ESM compatibility issues in Jest tests.
 */

// Mock Lighthouse result with typical values
const MOCK_LIGHTHOUSE_RESULT = {
  lhr: {
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 0.92 },
      'best-practices': { score: 0.87 }
    },
    audits: {
      'first-contentful-paint': { 
        score: 0.9,
        numericValue: 1200,
        displayValue: '1.2 s'
      },
      'speed-index': { 
        score: 0.85,
        numericValue: 1800,
        displayValue: '1.8 s'
      },
      'largest-contentful-paint': { 
        score: 0.8,
        numericValue: 2300,
        displayValue: '2.3 s'
      },
      'total-blocking-time': { 
        score: 0.75,
        numericValue: 250,
        displayValue: '250 ms'
      },
      'cumulative-layout-shift': { 
        score: 0.95,
        numericValue: 0.05,
        displayValue: '0.05'
      },
      'first-meaningful-paint': {
        score: 0.85,
        numericValue: 1500,
        displayValue: '1.5 s'
      },
      'max-potential-fid': {
        score: 0.7,
        numericValue: 300,
        displayValue: '300 ms'
      }
    },
    fetchTime: new Date().toISOString(),
    finalUrl: 'http://localhost:8080/dashboards/drilldown-dashboard.html',
    runWarnings: [],
    userAgent: 'MockLighthouse/1.0.0'
  },
  report: JSON.stringify({
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 0.92 },
      'best-practices': { score: 0.87 }
    }
  }),
  artifacts: {}
};

// Mock Lighthouse function
function lighthouse(url, options) {
  console.log(`[Mock Lighthouse] Running audit for ${url}`);
  
  return new Promise(resolve => {
    setTimeout(() => {
      // Return mock result with the URL included
      const result = {...MOCK_LIGHTHOUSE_RESULT};
      result.lhr.finalUrl = url;
      resolve(result);
    }, 500); // Simulate a half-second audit
  });
}

// Export the mock
module.exports = lighthouse;