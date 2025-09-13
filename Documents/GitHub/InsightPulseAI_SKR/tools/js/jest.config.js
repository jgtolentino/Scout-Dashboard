module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/api/**/*.spec.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'test-results/coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
  reporters: [
    'default'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
  transform: {}
};