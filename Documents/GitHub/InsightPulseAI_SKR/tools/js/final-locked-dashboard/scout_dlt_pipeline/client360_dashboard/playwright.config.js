// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Client360 Dashboard Playwright Configuration
 * Optimized for drill-down functionality testing
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Global test configuration */
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Opt out of parallel tests on CI for stability */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter configuration */
  reporter: [
    // HTML report for local development
    ['html', { 
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    
    // JUnit for CI/CD integration
    ['junit', { outputFile: 'test-results/junit.xml' }],
    
    // JSON for programmatic analysis
    ['json', { outputFile: 'test-results/results.json' }],
    
    // List reporter for console output
    ['list']
  ],
  
  /* Global test settings */
  use: {
    /* Base URL - can be overridden via environment variable */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:8000',
    
    /* Browser context options */
    viewport: { width: 1280, height: 720 },
    
    /* Collect trace on failure for debugging */
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for failed tests */
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    /* Action timeout */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Test output directories */
  outputDir: 'test-results/',
  
  /* Configure projects for different browsers and scenarios */
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Specific settings for drill-down testing
        hasTouch: false,
        isMobile: false,
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        hasTouch: false,
        isMobile: false,
      },
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        hasTouch: false,
        isMobile: false,
      },
    },

    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Test drill-down on mobile
      },
    },

    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },

    // Tablet testing
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
      },
    },

    // Performance testing project
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        // Slower CPU simulation for performance testing
        launchOptions: {
          args: ['--cpu-throttling-rate=4']
        }
      },
      testMatch: '**/drilldown.e2e.spec.js',
      grep: /@performance/,
    },

    // API-only testing (headless, faster)
    {
      name: 'api-tests',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      testMatch: '**/drilldown.e2e.spec.js',
      grep: /@api/,
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),

  /* Web server for testing */
  webServer: process.env.CI ? undefined : {
    command: 'python -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    stdout: 'pipe',
    stderr: 'pipe',
  },
});