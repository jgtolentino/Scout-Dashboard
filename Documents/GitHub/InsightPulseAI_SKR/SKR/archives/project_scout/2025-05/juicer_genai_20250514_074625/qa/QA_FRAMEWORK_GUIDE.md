# Scout Dashboard QA Framework Guide

This guide explains how to use the Scout Dashboard QA Framework, including how to transition from mock tests to real tests when working in development vs. CI environments.

## Table of Contents
- [Overview](#overview)
- [Test Types](#test-types)
- [Mock vs. Real Testing](#mock-vs-real-testing)
- [Setting Up Your Environment](#setting-up-your-environment)
- [Running Tests](#running-tests)
- [Creating Baseline Images](#creating-baseline-images)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The Scout Dashboard QA Framework ensures that dashboards maintain visual and behavioral parity with Power BI standards. It includes tests for:

- Visual parity (pixel-perfect comparisons)
- Behavior parity (interactive elements)
- Accessibility compliance
- Performance benchmarks

The framework is designed to work in both development environments and CI/CD pipelines.

## Test Types

### Visual Parity Tests
Compare dashboard components against baseline images to detect visual regressions.

### Behavior Parity Tests
Verify that interactive elements like filters, tooltips, and drill-downs work correctly.

### Accessibility Tests
Check WCAG 2.1 AA compliance for all dashboard components.

### Performance Tests
Measure and benchmark loading times, rendering performance, and resource usage.

## Mock vs. Real Testing

The framework supports two modes of operation:

### Mock Mode
- Uses simulated browsers and components
- No actual rendering or visual comparison
- Designed for CI environments where browsers aren't available
- Fast and reliable for validating test structure

### Real Mode
- Uses actual browsers (via Puppeteer)
- Performs true visual comparison against baselines
- Interacts with real dashboard components
- Required for development and acceptance testing

## Setting Up Your Environment

### Prerequisites
- Node.js 14+
- NPM or Yarn
- Access to the dashboard server (for real tests)

### Installation
```bash
cd juicer-stack/qa
npm install
```

### Configuration
Modify `config.js` to specify:
- Dashboard URLs
- Component selectors
- Test thresholds
- Environment settings

## Running Tests

### Mock Tests (CI Environment)
```bash
./run_ci_tests.sh
```

### Real Tests (Development)
```bash
npm test
```

### Running Specific Test Types
```bash
# Visual tests only
npm run test:visual

# Accessibility tests only
npm run test:accessibility

# Performance tests only
npm run test:performance

# Behavior tests only
npm run test:behavior
```

## Creating Baseline Images

Baseline images are essential for visual regression testing. To generate them:

1. Ensure the dashboard is in its expected state
2. Run the baseline generator:
   ```bash
   npm run generate-baselines
   ```
3. Review the generated images in the `baselines` directory
4. Commit the baselines to version control

### Updating Baselines
When the design intentionally changes:

1. Run the baseline update tool:
   ```bash
   npm run update-baselines
   ```
2. Review the changes carefully
3. Commit the updated baselines

## Transitioning from Mock to Real Tests

When moving from CI to development:

1. Configure the dashboard server URL in `config.js`
2. Generate real baselines (see above)
3. Run tests in real mode:
   ```bash
   npm run test:real
   ```
4. Debug any failures by checking the comparison images in the `diffs` directory

When making code changes:

1. Run real tests locally to check for visual regressions
2. Update baselines if changes are intentional
3. Push changes with updated baselines
4. CI will run mock tests for basic structural validation

## CI/CD Integration

The framework includes configurations for:

- GitHub Actions (`.github/workflows/dashboard-qa.yml`)
- Azure DevOps pipelines (`azure-pipelines.yml`)

These are pre-configured to:
- Run mock tests
- Store artifacts (test results, reports)
- Send notifications on failures

### Adding New CI Pipelines
When adding new CI/CD integrations:

1. Use `run_ci_tests.sh` as the main entry point
2. Ensure the `CI` environment variable is set
3. Configure artifact storage for test reports

## Troubleshooting

### Test Failures in CI but Not Locally
- Ensure you're running the same Node.js version
- Check for environment-specific configuration
- Validate that mock tests pass locally with `CI=true npm test`

### Visual Test Failures
- Check `diffs` directory for visual comparison results
- Examine pixel difference threshold in `config.js`
- Ensure baseline images are up to date

### Browser Launch Issues
- For headless environments, ensure proper Puppeteer configuration
- Check for missing dependencies on Linux systems

### Performance Test Variability
- Run multiple times to get an average
- Set appropriate thresholds with a buffer for environment variability

## Contributing to the Framework

To add new test types or enhance existing ones:

1. Add test files to the appropriate directory
2. Create both real and mock versions if needed
3. Update helpers in `utils/` as necessary
4. Document changes in code comments
5. Update this guide if relevant

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Puppeteer API](https://pptr.dev/)
- [Pixelmatch Documentation](https://github.com/mapbox/pixelmatch)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)