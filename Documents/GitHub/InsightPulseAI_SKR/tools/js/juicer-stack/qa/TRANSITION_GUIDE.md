# Transitioning from Mock to Real Tests

This guide provides step-by-step instructions for transitioning from mock tests (used in CI/CD) to real tests (used in development) and vice versa.

## Table of Contents
- [When to Use Mock vs. Real Tests](#when-to-use-mock-vs-real-tests)
- [From Mock to Real: Development](#from-mock-to-real-development)
- [From Real to Mock: CI/CD](#from-real-to-mock-cicd)
- [Understanding Test Differences](#understanding-test-differences)
- [Managing Baseline Images](#managing-baseline-images)
- [Troubleshooting](#troubleshooting)

## When to Use Mock vs. Real Tests

### Use Mock Tests When:
- Running in CI/CD environments
- Working on pipeline configurations
- Testing test code structure without dashboard availability
- Performing quick validation of test logic
- No access to browser or headless environment not properly configured

### Use Real Tests When:
- Developing dashboard features
- Creating initial baseline images
- Validating visual and interactive components
- Debugging test failures
- Performing acceptance testing

## From Mock to Real: Development

Follow these steps to transition from mock tests to real tests for development:

1. **Ensure Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Verify Puppeteer installation
   npx puppeteer browsers
   ```

2. **Configure Dashboard URLs**
   
   Edit `config.js` to point to your development dashboard server:
   ```javascript
   module.exports = {
     dashboards: {
       retail: 'http://localhost:8080/dashboards/retail-performance',
       drilldown: 'http://localhost:8080/dashboards/drilldown-dashboard'
     },
     // other settings...
   };
   ```

3. **Generate Real Baseline Images**
   ```bash
   # Run the baseline generator
   npm run capture-baselines
   ```

4. **Run Real Tests**
   ```bash
   # Run all real tests
   npm test
   
   # Or run specific test suite
   npm run test:visual
   ```

5. **Debug Any Failures**
   - Check `reports/pixel` for visual difference images
   - Review console output for error messages
   - Adjust selectors or timing if needed

## From Real to Mock: CI/CD

Follow these steps to ensure your tests can run in CI/CD with mock implementations:

1. **Verify Mock Test Files**
   
   Ensure these files exist and are up to date:
   - `tests/mock-visual-parity.test.js`
   - `tests/mock-behavior-parity.test.js`
   - `tests/mock-accessibility.test.js`
   - `tests/mock-performance.test.js`

2. **Run Mock Tests Locally**
   ```bash
   # Set CI environment variable to simulate CI environment
   CI=true ./run_ci_tests.sh
   ```

3. **Review and Update Jest Setup**
   
   Check `jest.setup.js` to ensure all required mocks are properly implemented:
   - Browser mocks
   - PNG structure mocks
   - Lighthouse mocks
   - File system mocks

4. **Update CI Configuration**
   
   Update CI pipeline files (GitHub Actions or Azure DevOps) if needed:
   - Update artifact paths
   - Adjust environment variables
   - Set timeout values

5. **Push Changes**
   
   Push your changes and verify that tests pass in the CI environment.

## Understanding Test Differences

### Visual Parity Tests

| Real Tests | Mock Tests |
|------------|------------|
| Launch actual browser | Use mock browser API |
| Capture screenshots | Return mock PNG data |
| Compare with baseline using pixel diff | Skip comparison |
| Generate diff images on failure | Skip diff generation |
| Report actual pixel differences | Return success result |

### Behavior Parity Tests

| Real Tests | Mock Tests |
|------------|------------|
| Interact with actual elements | Mock element interactions |
| Validate DOM changes | Return success without checking |
| Test event handlers | Skip event handler testing |
| Verify UI state changes | Return success without verification |

### Accessibility Tests

| Real Tests | Mock Tests |
|------------|------------|
| Use real axe-core on page | Return mock accessibility results |
| Find actual violations | Return empty violations array |
| Generate detailed reports | Generate basic mock report |

### Performance Tests

| Real Tests | Mock Tests |
|------------|------------|
| Use Lighthouse on actual page | Use mock Lighthouse module |
| Measure real metrics | Return mock performance metrics |
| Compare with benchmarks | Skip comparison |

## Managing Baseline Images

Baseline images are critical for visual testing but can be challenging to manage across environments:

1. **Version Control**
   - Commit baseline images to the repository
   - Use `.gitattributes` to properly handle binary files
   - Consider using LFS for large repositories

2. **SVG vs PNG Baselines**
   - SVG baselines are more version-control friendly
   - PNGs are required for pixel comparison
   - Use `utils/convert_svg_to_png.js` to convert if needed

3. **Baseline Updates**
   - Update baselines when intentional visual changes are made
   - Review changes carefully before committing
   - Consider using a baseline review process

4. **Baseline Generation**
   ```bash
   # Generate all baselines
   npm run capture-baselines
   
   # Update a specific baseline
   npm run update-baseline -- --dashboard=retail --component=header
   ```

## Troubleshooting

### "Error: Failed to launch the browser process"
- Check that Puppeteer is properly installed
- Ensure required system dependencies are installed
- Try running with `--no-sandbox` (for CI environments only)

### Visual Tests Failing with Pixel Differences
- Check for browser version differences
- Verify that font rendering is consistent
- Adjust the pixel difference threshold in config.js

### Mock Tests Failing in CI
- Ensure all mocks are properly implemented
- Check for missing environment variables
- Verify that Jest configuration is correct

### Memory Issues in CI
- Increase Node.js memory limit
- Close browser instances after each test
- Reduce parallel test execution

### Tests Passing Locally but Failing in CI
- Run tests with `CI=true` locally to simulate CI environment
- Check for environment-specific configurations
- Ensure mock implementations are up to date