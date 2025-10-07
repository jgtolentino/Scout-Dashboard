# Visual Review Integration Guide

This guide explains how to integrate the Scout Dashboard QA framework with visual review tools like Percy and Chromatic, which provide interactive visual comparison interfaces that make it easier to review visual changes.

## Percy Integration

[Percy](https://percy.io/) is a visual review platform that makes it easy to catch visual regressions.

### Setup Steps

1. **Create a Percy Account**
   - Sign up at [percy.io](https://percy.io/)
   - Create a new project for your Scout dashboards

2. **Install Percy Dependencies**
   ```bash
   npm install --save-dev @percy/cli @percy/puppeteer
   ```

3. **Create a Percy Script**
   Create a new file at `qa/utils/percy_capture.js`:

   ```javascript
   const puppeteer = require('puppeteer');
   const percySnapshot = require('@percy/puppeteer');
   
   // Dashboard configurations (same as tests)
   const dashboards = [
     {
       name: 'drilldown-dashboard',
       path: '/dashboards/drilldown-dashboard.html',
       components: ['header', 'brand-table', 'breadcrumb', 'kpi-cards', 'timeline-chart']
     },
     {
       name: 'retail-performance',
       path: '/dashboards/retail_performance/retail_performance_dashboard.html',
       components: ['header', 'performance-metrics', 'regional-map', 'trend-chart']
     }
   ];
   
   async function captureSnapshots() {
     // Get dashboard URL from environment or use default
     const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8080';
     console.log(`Using dashboard URL: ${DASHBOARD_URL}`);
   
     // Launch browser
     const browser = await puppeteer.launch({
       headless: true,
       args: ['--no-sandbox', '--disable-setuid-sandbox'],
     });
   
     try {
       // Process each dashboard
       for (const dashboard of dashboards) {
         console.log(`Processing dashboard: ${dashboard.name}`);
         
         // Create a new page
         const page = await browser.newPage();
         
         // Set viewport to consistent size for testing
         await page.setViewport({ width: 1200, height: 800 });
         
         try {
           // Navigate to dashboard
           console.log(`Loading ${DASHBOARD_URL}${dashboard.path}`);
           await page.goto(`${DASHBOARD_URL}${dashboard.path}`, { timeout: 30000 });
           await page.waitForTimeout(2000); // Allow time for rendering
           
           // Take full page snapshot
           await percySnapshot(page, `${dashboard.name} - Full Page`);
           
           // Process each component
           for (const component of dashboard.components) {
             console.log(`Capturing component: ${component}`);
             
             try {
               // Try to find the component
               await page.waitForSelector(`.${component}`, { timeout: 5000 });
               
               // Take Percy snapshot of just this component
               await percySnapshot(page, `${dashboard.name} - ${component}`, {
                 scope: `.${component}`
               });
             } catch (error) {
               console.log(`Error capturing ${component}: ${error.message}`);
             }
           }
         } catch (error) {
           console.log(`Failed to load dashboard: ${error.message}`);
         }
         
         // Close the page
         await page.close();
       }
   
     } finally {
       // Close the browser
       await browser.close();
     }
   }
   
   // Run the snapshots
   captureSnapshots().catch(error => {
     console.error('Percy capture failed:', error);
     process.exit(1);
   });
   ```

4. **Add Percy Script to Package.json**
   ```json
   "scripts": {
     "percy": "percy exec -- node utils/percy_capture.js"
   }
   ```

5. **Set Up Percy in CI**

   **GitHub Actions**:
   ```yaml
   - name: Install dependencies
     run: npm ci
     
   - name: Percy Test
     run: npx percy exec -- node qa/utils/percy_capture.js
     env:
       PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
   ```

   **Azure DevOps**:
   ```yaml
   - script: |
       npm ci
       npx percy exec -- node qa/utils/percy_capture.js
     displayName: 'Run Percy Visual Tests'
     env:
       PERCY_TOKEN: $(PERCY_TOKEN)
   ```

6. **Review Changes in Percy Dashboard**
   - Percy will provide a link to review the snapshots
   - You can approve or reject changes
   - Changes can be viewed in a slider interface

## Chromatic Integration

[Chromatic](https://www.chromatic.com/) is primarily designed for Storybook but can also be used for general visual testing.

### Setup Steps (with Storybook)

1. **Set Up Storybook**
   If you don't already have Storybook set up:
   ```bash
   npx storybook init
   ```

2. **Create Dashboard Stories**
   Create a file `dashboard.stories.js` in your Storybook:
   ```javascript
   import { useEffect, useRef } from 'react';
   
   export default {
     title: 'Dashboards',
     parameters: {
       layout: 'fullscreen',
     },
   };
   
   const dashboards = [
     {
       name: 'Drilldown Dashboard',
       path: '/dashboards/drilldown-dashboard.html',
     },
     {
       name: 'Retail Performance',
       path: '/dashboards/retail_performance/retail_performance_dashboard.html',
     },
   ];
   
   export const DrilldownDashboard = () => {
     const iframeRef = useRef(null);
     
     useEffect(() => {
       // Set iframe height and handle responsive sizing
       if (iframeRef.current) {
         iframeRef.current.style.height = '800px';
       }
     }, []);
     
     return (
       <iframe 
         ref={iframeRef}
         src={`${process.env.STORYBOOK_DASHBOARD_URL || 'http://localhost:8080'}${dashboards[0].path}`}
         width="100%"
         title={dashboards[0].name}
       />
     );
   };
   
   export const RetailPerformance = () => {
     const iframeRef = useRef(null);
     
     useEffect(() => {
       // Set iframe height and handle responsive sizing
       if (iframeRef.current) {
         iframeRef.current.style.height = '800px';
       }
     }, []);
     
     return (
       <iframe 
         ref={iframeRef}
         src={`${process.env.STORYBOOK_DASHBOARD_URL || 'http://localhost:8080'}${dashboards[1].path}`}
         width="100%"
         title={dashboards[1].name}
       />
     );
   };
   ```

3. **Install Chromatic**
   ```bash
   npm install --save-dev chromatic
   ```

4. **Run Chromatic**
   ```bash
   npx chromatic --project-token=<your-project-token>
   ```

5. **Add to CI**

   **GitHub Actions**:
   ```yaml
   - name: Publish to Chromatic
     uses: chromaui/action@v1
     with:
       projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
       workingDir: tools/js/juicer-stack
     env:
       STORYBOOK_DASHBOARD_URL: ${{ secrets.DASHBOARD_URL }}
   ```

   **Azure DevOps**:
   ```yaml
   - script: |
       cd tools/js/juicer-stack
       npx chromatic --project-token=$(CHROMATIC_PROJECT_TOKEN)
     displayName: 'Publish to Chromatic'
     env:
       STORYBOOK_DASHBOARD_URL: $(DASHBOARD_URL)
   ```

### Alternative: Non-Storybook Approach

If you don't want to use Storybook, you can still use Chromatic with a simpler approach:

1. **Create a Simple HTML Build**
   Set up a simple static site with screenshots of your dashboards

2. **Run Chromatic on Your Static Site**
   ```bash
   npx chromatic --build-script-name="build:html" --project-token=<your-project-token>
   ```

## Playwright Trace Viewer

For interactive test debugging, Playwright Trace Viewer provides a way to record and replay test executions with time travel debugging.

### Setup Steps

1. **Install Playwright**
   ```bash
   npm install --save-dev @playwright/test
   ```

2. **Create Playwright Test File**
   Create `qa/playwright/dashboard.spec.js`:
   ```javascript
   const { test, expect } = require('@playwright/test');
   
   const dashboards = [
     {
       name: 'drilldown-dashboard',
       path: '/dashboards/drilldown-dashboard.html',
       components: ['header', 'brand-table', 'breadcrumb', 'kpi-cards', 'timeline-chart']
     },
     {
       name: 'retail-performance',
       path: '/dashboards/retail_performance/retail_performance_dashboard.html',
       components: ['header', 'performance-metrics', 'regional-map', 'trend-chart']
     }
   ];
   
   const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8080';
   
   test.describe('Dashboard Interactions', () => {
     for (const dashboard of dashboards) {
       test(`${dashboard.name} components and interactions`, async ({ page, context }) => {
         // Start tracing
         await context.tracing.start({ screenshots: true, snapshots: true });
         
         // Navigate to the dashboard
         await page.goto(`${DASHBOARD_URL}${dashboard.path}`);
         await page.waitForLoadState('networkidle');
         
         // Check each component
         for (const component of dashboard.components) {
           await test.step(`Check ${component}`, async () => {
             const element = page.locator(`.${component}`);
             await expect(element).toBeVisible();
             
             // Perform some interactions
             await element.hover();
             await page.mouse.move(0, 0); // Move away
           });
         }
         
         // Stop tracing
         await context.tracing.stop({
           path: `./reports/traces/${dashboard.name}.zip`,
         });
       });
     }
   });
   ```

3. **Add Playwright Config**
   Create `qa/playwright.config.js`:
   ```javascript
   module.exports = {
     use: {
       headless: true,
       viewport: { width: 1200, height: 800 },
       ignoreHTTPSErrors: true,
       video: 'on-first-retry',
       trace: 'on',
     },
     projects: [
       {
         name: 'Chrome',
         use: { browserName: 'chromium' },
       },
     ],
     testDir: './playwright',
     outputDir: './reports/playwright-results',
     reporter: [
       ['html', { outputFolder: './reports/playwright-report' }],
       ['junit', { outputFile: './reports/playwright-results/results.xml' }],
     ],
   };
   ```

4. **Add Script to Package.json**
   ```json
   "scripts": {
     "test:playwright": "playwright test",
     "show-trace": "playwright show-trace reports/traces/*.zip"
   }
   ```

5. **Run the Tests and View the Trace**
   ```bash
   npm run test:playwright
   npm run show-trace
   ```

6. **CI Integration**

   **GitHub Actions**:
   ```yaml
   - name: Install Playwright browsers
     run: npx playwright install --with-deps
     
   - name: Run Playwright tests
     run: npm run test:playwright
     
   - uses: actions/upload-artifact@v3
     if: always()
     with:
       name: playwright-traces
       path: qa/reports/traces/
       retention-days: 30
   ```

## Best Practices

1. **Review Changes as Part of PR Process**
   - Always review visual changes before merging PRs
   - Use visual review tools to catch unintended regressions

2. **Keep Baselines Updated**
   - Update baselines when intentional changes are approved
   - Use scheduled jobs to create fresh baselines

3. **Set Threshold Appropriately**
   - Adjust pixel diff thresholds based on your needs
   - Consider anti-aliasing and minor rendering differences

4. **Combine with Component Tests**
   - Visual tests work best alongside functional tests
   - Test both appearance and behavior together

## Conclusion

Adding visual review tools like Percy or Chromatic to your QA framework provides a more interactive and intuitive way to catch and review visual regressions. The integration takes just a few minutes but adds significant value to your QA process.