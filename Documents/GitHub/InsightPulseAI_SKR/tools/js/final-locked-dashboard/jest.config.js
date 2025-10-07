module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/unit'],
  collectCoverage: true,
  collectCoverageFrom: [
    'deployment-v2/public/js/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Scout Dashboard Unit Tests',
        outputPath: './reports/unit-test-report.html'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './reports',
        outputName: 'unit-test-results.xml'
      }
    ]
  ],
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};