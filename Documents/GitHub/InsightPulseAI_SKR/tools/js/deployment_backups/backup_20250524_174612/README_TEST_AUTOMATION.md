# Scout Dashboard Test Automation & Rollback System

A comprehensive test automation framework and rollback system for Scout dashboards, covering unit tests, smoke tests, end-to-end (E2E) tests, visual regression tests, and safe rollback procedures.

## Overview

This framework ensures quality and reliability across the Scout dashboard ecosystem:

- **Unit Tests**: Verify code functions and components work correctly in isolation
- **Smoke Tests**: Validate that critical paths and API endpoints are functioning
- **E2E Tests**: Test complete user journeys through the dashboard UI
- **Visual Regression Tests**: Ensure UI appearance remains consistent and correct
- **Golden Baseline System**: Create, verify against, and roll back to known-good states
- **Rollback Procedures**: Safely restore production to a reliable state when issues occur

## Getting Started

### Prerequisites

- Node.js 16+
- npm
- Git (for baseline management)
- Docker (optional, for containerized rollbacks)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage report
npm run test:unit -- --coverage
```

### Smoke Tests

```bash
# Run smoke tests against staging environment (default)
npm run test:smoke

# Run against specific environment
TEST_ENV=production npm run test:smoke
```

### E2E Tests

```bash
# Run E2E tests in Chrome
npm run test:e2e

# Run E2E tests in all browsers
npm run test:e2e:all

# Run E2E tests on mobile viewport
npm run test:e2e:mobile
```

### Visual Regression Tests

```bash
# Run visual regression tests
npm run test:visual

# Update baseline screenshots
npm run test:visual:update
```

### All Tests

```bash
# Run all test suites and generate consolidated report
npm run test:all
```

## Golden Baseline System

The golden baseline system provides a reliable way to manage known-good states of the dashboard for future reference or rollback.

### Creating a Golden Baseline

Use this when reaching a stable milestone (e.g., successful deployment, feature completion, version release):

```bash
# Create with default options
./scripts/create-golden-baseline.sh

# Create with custom options
./scripts/create-golden-baseline.sh --prefix prod-golden --message "v2.3.0 production release"
```

Golden baselines include:
- Git tag for the commit
- Full snapshot of the code
- Build information
- Test results
- Theme verification
- Environment metadata

### Verifying Against a Golden Baseline

Use this to detect regressions or issues compared to a known-good state:

```bash
# Verify current code against latest golden baseline
./scripts/verify-against-golden.sh

# Verify against specific baseline with detailed report
./scripts/verify-against-golden.sh golden-20250519123045 --output verification-report.md
```

Verification includes:
- Code changes analysis
- Security checks
- Performance impact assessment
- Test verification
- Coverage comparison
- Theme integrity verification

### Rolling Back to a Golden Baseline

When issues are discovered in production, use this to restore to a reliable state:

```bash
# Basic rollback to a golden baseline
./scripts/rollback-to-golden.sh golden-20250519123045

# Rollback and deploy in one step
./scripts/rollback-to-golden.sh golden-20250519123045 --method snapshot --deploy
```

Rollback options include:
- Multiple rollback methods (Git, Docker, file snapshot)
- Automatic verification after rollback
- Direct deployment to production
- Custom branch creation

## CI/CD Integration

Tests and baseline management are integrated into the CI/CD pipeline:

- **Unit & Smoke Tests**: Run on every push to main/develop branches and PRs
- **E2E & Visual Tests**: Run on schedule (nightly) and can be triggered manually
- **Golden Baseline Creation**: Automatic after successful deployments
- **Verification**: Run against golden baselines before deployments
- **Rollback Automation**: Available via workflow dispatch

See `.github/workflows/` directory for complete CI/CD configurations.

## Test Directory Structure

```
tests/
├── config/                  # Environment configurations
│   ├── local.config.json
│   ├── staging.config.json
│   └── production.config.json
├── e2e/                     # E2E tests
│   └── dashboard-navigation.spec.js
├── jest.setup.js            # Jest setup file
├── smoke/                   # Smoke tests
│   └── dashboard-smoke.test.js
├── snapshots/               # Visual test baselines
│   └── staging/
├── test-data/               # Test data files
│   └── staging/
├── unit/                    # Unit tests
│   └── dashboard.test.js
└── visual/                  # Visual regression tests
    └── visual-regression.spec.js
```

## Golden Baseline Structure

```
.golden-baselines/
├── golden-20250519123045.json           # Baseline metadata
├── snapshots/                           # File snapshots for rollback
│   └── golden-20250519123045.tar.gz
├── test-output-20250519123045.log       # Test results at baseline creation
├── verification-20250519123045.md       # Verification report
└── code-metrics-20250519123045.json     # Code metrics at baseline
```

## Rollback Workflow Example

1. **Issue Detection**: Identify a problem in production dashboard
   ```bash
   # Verify against golden baseline to confirm regression
   ./scripts/verify-against-golden.sh --output verification-report.md
   ```

2. **Rollback Decision**: Determine rollback is necessary
   ```bash
   # List available golden baselines
   git tag -l "golden-*" | sort -r
   ```

3. **Rollback Execution**: Roll back to last stable version
   ```bash
   # Create rollback branch and restore code
   ./scripts/rollback-to-golden.sh golden-20250519123045 --branch hotfix-rollback
   ```

4. **Verification**: Ensure rollback fixed the issue
   ```bash
   # Verify the dashboard's core functionality 
   npm run test:smoke
   ```

5. **Deployment**: Deploy the rolled-back version
   ```bash
   # Deploy via Azure Static Web Apps
   npm run deploy
   ```

6. **Root Cause Analysis**: Investigate the original issue
   ```bash
   # Compare current production against rollback
   git diff main hotfix-rollback
   ```

7. **Fix Implementation**: Fix the issue in the main branch
   ```bash
   # Create branch from main, fix issues and deploy
   git checkout -b fix-dashboard-styling main
   ```

## Theme Verification

The system includes specialized verification for dashboard themes:

- TBWA brand color verification
- Theme file integrity check
- Styling component validation
- Theme switching verification

## Best Practices

### Writing Tests

- Create tests in appropriate directories with consistent extensions
- Keep unit tests small and focused on a single component/function
- Test complete user flows in E2E tests, not individual components
- Create visual tests for critical UI components/pages

### Managing Baselines

- Create golden baselines after successful deployments
- Use descriptive messages for golden baselines
- Verify against baselines before deploying new changes
- Create theme-specific baselines when making theme changes

### Rollback Procedures

- Document each rollback in incident logs
- Always verify after rollback
- Create fixes from main branch, not rollback branch
- Update golden baselines after successful fix deployments

## Troubleshooting

### Common Issues

1. **Golden baseline creation fails**: Ensure all tests pass first
   ```bash
   npm run test:all
   ```

2. **Verification shows false positives**: Update expected changes
   ```bash
   ./scripts/verify-against-golden.sh --no-security --no-api
   ```

3. **Rollback conflicts**: Use force mode for emergency rollbacks
   ```bash
   ./scripts/rollback-to-golden.sh golden-20250519123045 --force
   ```

4. **Theme verification failures**: Check theme variables and files
   ```bash
   # Verify theme files integrity
   ./scripts/verify-against-golden.sh --output theme-report.md
   ```

## Contributing

When adding or modifying tests and baseline management:

1. Follow naming conventions and directory structure
2. Update documentation for major features
3. Run tests locally before pushing
4. Create new golden baselines after significant changes
5. Test rollback procedures in development before relying on them in production

## License

This test automation and rollback system is proprietary to InsightPulseAI.