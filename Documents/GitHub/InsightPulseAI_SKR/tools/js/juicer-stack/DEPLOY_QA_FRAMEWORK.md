# Scout Dashboard QA Framework Deployment Instructions

This document provides instructions for deploying the Scout Dashboard QA Framework.

## Deployment Package

The QA framework is packaged as `scout-dashboard-qa-1.0.0.tar.gz`.

## Installation Steps

1. Extract the package:
   ```bash
   tar -xzf scout-dashboard-qa-1.0.0.tar.gz
   cd qa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate baseline images:
   ```bash
   npm run capture-baselines
   ```

4. Run tests:
   ```bash
   npm test
   ```

## CI/CD Integration

To integrate with your CI/CD pipeline:

1. Set environment variables:
   - `DASHBOARD_URL`: URL to the dashboard server (default: http://localhost:8080)

2. Install the GitHub workflow:
   - Copy `.github/workflows/dashboard-qa.yml` to your repository's `.github/workflows/` directory

3. Add test job to your pipeline:
   ```yaml
   test-dashboards:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v3
       - name: Set up Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '16'
       - name: Install dependencies
         run: cd path/to/qa && npm install
       - name: Run tests
         run: cd path/to/qa && npm test
         env:
           DASHBOARD_URL: ${{ env.DASHBOARD_URL }}
   ```

## Troubleshooting

If tests fail, run the debug utility:

```bash
node utils/debug_tests.js
```

This will generate detailed logs and screenshots in the `debug/` directory.
