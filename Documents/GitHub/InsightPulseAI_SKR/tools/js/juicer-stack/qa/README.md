# Scout Dashboard Power BI Parity QA Framework

This QA framework ensures that Scout dashboards maintain visual and behavioral parity with Power BI standards. It provides automated testing for visual fidelity, interactive behavior, accessibility, and performance.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests (development environment)
npm test

# Run in CI environment (mock mode)
./run_ci_tests.sh
```

## Documentation

For detailed usage instructions, see the [QA Framework Guide](./QA_FRAMEWORK_GUIDE.md).

## Table of Contents
- [Directory Structure](#directory-structure)
- [Test Suites](#test-suites)
- [Mock vs. Real Testing](#mock-vs-real-testing)
- [Running Tests](#running-tests)
- [Baseline Management](#baseline-management)
- [CI/CD Integration](#cicd-integration)
- [Style Guide](#style-guide)

## Directory Structure

The QA framework is organized as follows:

```
qa/
├── baselines/         # Baseline screenshots for visual comparison
├── tests/             # Test scripts
│   ├── visual-parity.test.js
│   ├── behavior-parity.test.js
│   ├── accessibility.test.js
│   ├── performance.test.js
│   ├── mock-visual-parity.test.js
│   ├── mock-behavior-parity.test.js
│   ├── mock-accessibility.test.js
│   └── mock-performance.test.js
├── themes/            # Power BI theme definitions
│   └── tbwa.powerbiTheme.json
├── utils/             # Utility scripts
│   ├── capture-baselines.js
│   ├── convert_svg_to_png.js
│   ├── mock-lighthouse.js
│   └── test_helper.js
├── reports/           # Generated test reports
├── temp/              # Temporary files during testing
├── .github/
│   └── workflows/     # GitHub Actions workflow definitions
│       └── dashboard-qa.yml
├── azure-pipelines.yml   # Azure DevOps pipeline
├── jest.setup.js     # Jest setup with mock implementations
├── run_ci_tests.sh   # Script for CI environments
├── package.json      # Dependencies and scripts
├── STYLE_GUIDE.md    # Dashboard styling standards
├── QA_FRAMEWORK_GUIDE.md # Comprehensive usage guide
└── README.md         # This file
```

## Test Suites

### Visual Parity Tests

Ensures that dashboard components visually match Power BI styling standards:

- Component layout and appearance
- Color usage consistent with theme
- Typography following standards
- Responsive behavior at different sizes

```bash
npm run test:visual
```

### Behavior Parity Tests

Verifies that dashboard interactions match Power BI behavior:

- Filtering and cross-filtering
- Drill-through and navigation
- Selection states
- Tooltips and hover effects
- Sorting behavior

```bash
npm run test:behavior
```

### Accessibility Tests

Validates compliance with accessibility standards:

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management

```bash
npm run test:accessibility
```

### Performance Tests

Measures performance metrics against benchmarks:

- Load time
- Interaction responsiveness
- Animation smoothness
- Memory usage
- Network efficiency

```bash
npm run test:performance
```

## Mock vs. Real Testing

The framework supports two modes of operation:

### Mock Mode (CI Environment)
- Uses simulated browsers and components
- No actual rendering or visual comparison
- Suitable for CI/CD pipelines
- Run with: `./run_ci_tests.sh`

### Real Mode (Development)
- Uses actual browsers (via Puppeteer)
- Performs true visual comparison against baselines
- Requires dashboard server access
- Run with: `npm test`

For detailed guidance on transitioning between modes, see the [QA Framework Guide](./QA_FRAMEWORK_GUIDE.md).

## Running Tests

Run all tests:

```bash
npm test
```

Run a specific test suite:

```bash
npm run test:visual
npm run test:behavior
npm run test:accessibility
npm run test:performance
```

Run in CI environment (mock mode):

```bash
./run_ci_tests.sh
```

## Baseline Management

Capture baseline screenshots for visual comparison:

```bash
npm run capture-baselines
```

This will:
1. Launch each dashboard
2. Capture screenshots of key components
3. Save them as baseline images for comparison

When adding new dashboard components:

1. Implement the component following the style guide
2. Run `npm run capture-baselines` to create new baselines
3. Commit the new baseline images along with your code

## CI/CD Integration

This framework integrates with GitHub Actions and Azure DevOps:

- Tests run automatically on pushes and PRs
- Visual diff artifacts are uploaded for review
- Test reports are generated and accessible as artifacts
- PRs require passing tests before merging

The workflows are defined in:
- `.github/workflows/dashboard-qa.yml`
- `azure-pipelines.yml`

## Style Guide

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for comprehensive styling standards, including:

- Color palette and usage
- Typography specifications
- Layout standards
- Visual element styling
- Interactivity patterns
- Accessibility requirements
- Performance targets

All dashboard development must adhere to these standards to ensure Power BI parity.