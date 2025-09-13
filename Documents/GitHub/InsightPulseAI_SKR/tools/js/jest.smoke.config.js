module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/smoke/**/*.test.js'
  ],
  collectCoverage: false,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results/smoke',
      outputName: 'junit.xml',
    }],
    ['jest-html-reporter', {
      pageTitle: 'Smoke Test Report',
      outputPath: 'test-results/smoke/index.html',
      includeFailureMsg: true
    }]
  ],
  setupFilesAfterEnv: ['./tests/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Set higher timeout for smoke tests that use real network calls
  testTimeout: 30000, 
  verbose: true
};