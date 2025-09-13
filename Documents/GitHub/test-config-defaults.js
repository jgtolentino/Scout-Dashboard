// Default Test Configuration for Headless/CI Mode
// This file provides default configurations for various test frameworks

module.exports = {
  // Environment detection
  isCI: process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true',
  isHeadless: process.env.HEADED !== 'true' && process.env.HEADLESS !== 'false',
  
  // Playwright defaults
  playwright: {
    use: {
      headless: process.env.HEADED !== 'true',
      screenshot: {
        mode: 'only-on-failure',
        fullPage: true
      },
      video: {
        mode: 'retain-on-failure',
        size: { width: 1280, height: 720 }
      },
      trace: 'on-first-retry',
      actionTimeout: 10000,
      navigationTimeout: 30000
    },
    reporter: [
      ['list'],
      ['json', { outputFile: 'test-results/results.json' }],
      ['html', { open: 'never' }]
    ]
  },
  
  // Jest defaults
  jest: {
    testEnvironment: 'jsdom',
    coverageReporters: ['text', 'json', 'html'],
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: 'test-results',
        outputName: 'jest-junit.xml'
      }]
    ],
    silent: process.env.CI === 'true',
    bail: process.env.CI === 'true' ? 1 : 0
  },
  
  // Vitest defaults
  vitest: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    },
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/index.html'
    },
    pool: 'threads',
    bail: process.env.CI === 'true' ? 1 : 0
  },
  
  // Cypress defaults
  cypress: {
    headless: true,
    video: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  },
  
  // Console error capture
  captureConsoleErrors: true,
  captureNetworkErrors: true,
  
  // Helper function to set up console error capturing
  setupErrorCapture: (page) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          type: 'console',
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    page.on('pageerror', error => {
      errors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('requestfailed', request => {
      errors.push({
        type: 'network',
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
    });
    
    return errors;
  }
};