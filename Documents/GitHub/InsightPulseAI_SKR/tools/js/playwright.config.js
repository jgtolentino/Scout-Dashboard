// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables
 */
const CI = process.env.CI === 'true';
const TEST_ENV = process.env.TEST_ENV || 'staging';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met
     */
    timeout: 10000
  },
  /* Run tests in files in parallel */
  fullyParallel: !CI,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!CI,
  /* Retry on CI only */
  retries: CI ? 2 : 0,
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }]
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Maximum time each action (click, fill form) can take */
    actionTimeout: 10000,
    /* Base URL to use in actions like `await page.goto('/')` */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Capture screenshot after each test failure */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    /* Record video for failing tests */
    video: {
      mode: 'on-first-retry',
      size: { width: 1280, height: 720 }
    },
    /* Run browser in headless mode by default (override with HEADED=true) */
    headless: process.env.HEADED !== 'true'
  },

  /* Configure projects for different test types */
  projects: [
    {
      name: 'e2e-chrome',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'e2e-webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'e2e-mobile',
      testDir: './tests/e2e',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'visual-chrome',
      testDir: './tests/visual',
      use: { 
        ...devices['Desktop Chrome'],
        /* For visual tests, we need to have more consistency */
        viewport: { width: 1920, height: 1080 },
        /* Update snapshot with --update-snapshots flag */
        ignoreSnapshots: !process.env.UPDATE_SNAPSHOTS
      },
    }
  ],

  /* Configure the test outputs */
  outputDir: 'test-results/test-output',

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  snapshotDir: `tests/snapshots/${TEST_ENV}`,

  /* Web server to start before tests (useful for local development) */
  webServer: process.env.START_SERVER ? {
    command: 'cd .. && npm run start',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !CI,
  } : undefined,
});