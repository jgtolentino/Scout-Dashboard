/**
 * Jest configuration for Scout Dashboard QA Framework
 */

module.exports = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Define environment variables for tests
  testEnvironmentOptions: {
    // Dashboard server URL can be overridden with environment variable
    DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:8080'
  },
  
  // Setup code to run before each test file is executed
  setupFilesAfterEnv: ['./jest.setup.js'],
  
  // Transform ESM modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Define transformIgnorePatterns to process node_modules that use ESM
  transformIgnorePatterns: [
    '/node_modules/(?!(lighthouse|axe-core)/)'
  ],
  
  // Global variables available in all test files
  globals: {
    DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:8080'
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Fail test suite on any errors
  bail: false,
  
  // Generate coverage report
  collectCoverage: false,
  
  // Patterns to search for test files
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};