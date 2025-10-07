// Jest setup file
const path = require('path');
const fs = require('fs');

// Create test results directories if they don't exist
const resultsDir = path.join(__dirname, '..', 'test-results');
const unitResultsDir = path.join(resultsDir, 'unit');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

if (!fs.existsSync(unitResultsDir)) {
  fs.mkdirSync(unitResultsDir, { recursive: true });
}

// Set test timeout (10 seconds)
jest.setTimeout(10000);

// Add global test utilities here
global.testUtils = {
  getTestDataPath: (filename) => path.join(__dirname, 'test-data', filename),
  loadTestData: (filename) => {
    const filePath = path.join(__dirname, 'test-data', filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
};