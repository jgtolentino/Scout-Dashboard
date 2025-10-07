# Scout Dashboard QA Framework Integration Guide

This guide provides detailed instructions for integrating and running the Scout Dashboard QA Framework in both development and CI/CD environments.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [CI/CD Integration](#cicd-integration)
- [Environment Variables](#environment-variables)
- [Baseline Management](#baseline-management)
- [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- Node.js 16+ 
- npm 7+
- Running dashboard server (default: http://localhost:8080)

### Installation

1. Install dependencies:

```bash
cd /tools/js/juicer-stack/qa
npm install
```

2. Prepare the environment:

```bash
npm run prepare-ci
```

This command:
- Creates necessary directories
- Generates placeholder baseline images if needed
- Sets up environment variables
- Validates test configurations

3. Run tests:

```bash
npm test         # All tests
npm run test:visual       # Visual parity tests only
npm run test:behavior     # Behavior parity tests only
npm run test:accessibility # Accessibility tests only
npm run test:performance  # Performance tests only
```

## CI/CD Integration

### GitHub Actions

The QA Framework comes with a pre-configured GitHub Actions workflow at `.github/workflows/dashboard-qa.yml`.

#### Key Features:

- Runs on pushes/PRs affecting dashboard files
- Parallel test execution for speed
- Artifact generation for test reports and screenshots
- Built-in caching for faster runs

#### Implementation Steps:

1. Ensure your repository has GitHub Actions enabled

2. Add environment variables to your GitHub repository:
   - `DASHBOARD_URL` - URL to your deployed dashboard server

3. Verify the workflow runs on push/PR

### Other CI Systems (Jenkins, CircleCI, etc.)

For other CI systems, follow these general steps:

1. Install dependencies:
```bash
npm install
```

2. Prepare environment:
```bash
npm run prepare-ci
```

3. Run tests:
```bash
npm test
```

4. Process test reports from the `reports/` directory

## Environment Variables

The QA Framework uses these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_URL` | URL to the dashboard server | http://localhost:8080 |
| `NODE_ENV` | Node environment | test |
| `DEBUG` | Enable debug logging | false |
| `HEADLESS` | Run browser tests in headless mode | true |
| `SCREENSHOT_DIR` | Directory for test screenshots | ./temp |

You can set these in your CI system or in a local `.env` file.

## Baseline Management

### Generating Baselines

To create baseline screenshots for visual comparison:

```bash
npm run capture-baselines
```

Run this command when:
- Setting up the framework initially
- After making intentional UI changes
- In a clean environment with known-good dashboard state

### Managing Baselines

Baselines are stored in the `baselines/` directory:

- Commit baseline images to keep them in version control
- Generate new baselines after UI changes
- Use placeholder SVG images in CI if real baselines aren't available

## Troubleshooting

### Debug Mode

Run tests in debug mode for detailed logging:

```bash
npm run test:debug
```

This will:
- Launch browser in visible (non-headless) mode
- Slow down operations for visual inspection
- Generate detailed logs and screenshots
- Produce an HTML report with recommendations

### Common Issues

**Tests Failing in CI but Passing Locally**
- Check if `DASHBOARD_URL` is correctly set
- Verify network access to dashboard server
- Ensure baseline images are committed

**Lighthouse Module Errors**
- Lighthouse is an optional dependency
- Performance tests can run without it
- Use `npm install --no-optional` to skip it

**Visual Test Failures**
- Regenerate baselines with `npm run capture-baselines`
- Check for theme changes affecting UI
- Compare screenshot diffs in the `temp/` directory

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Puppeteer Documentation](https://pptr.dev/)
- [Power BI Design Guidelines](https://docs.microsoft.com/en-us/power-bi/fundamentals/service-design-guidance)