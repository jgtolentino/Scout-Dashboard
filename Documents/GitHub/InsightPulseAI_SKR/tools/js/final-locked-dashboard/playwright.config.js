const { devices } = require('@playwright/test');

module.exports = {
  testDir: './tests/visual',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report' }],
    ['junit', { outputFile: 'reports/visual-test-results.xml' }]
  ],
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'visual-chrome',
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'visual-firefox',
      use: {
        browserName: 'firefox',
      },
    },
    {
      name: 'visual-webkit',
      use: {
        browserName: 'webkit',
      },
    },
    {
      name: 'visual-mobile',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  webServer: {
    command: 'python -m http.server 8080 --directory deployment-v2/public',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
};