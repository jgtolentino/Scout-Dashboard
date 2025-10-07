module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/smoke'],
  testMatch: ['**/?(*.)+(spec|test).js'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Scout Dashboard Smoke Tests',
        outputPath: './reports/smoke-test-report.html'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './reports',
        outputName: 'smoke-test-results.xml'
      }
    ]
  ],
  verbose: true,
  testTimeout: 30000
};