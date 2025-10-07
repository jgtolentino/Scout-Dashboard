# Golden Baseline System Guide

This document explains how to use the enhanced golden baseline system, which provides a comprehensive approach to creating, verifying, and rolling back to known-good application states.

## Overview

The golden baseline system allows you to:

1. **Create** known-good snapshots of your application at important milestones
2. **Verify** changes against these golden baselines
3. **Roll back** to golden baselines when needed

Multiple rollback methods are supported (Git, Docker, and file snapshots), with automated verification and built-in support for deployment.

## Creating a Golden Baseline

Create a golden baseline when your application reaches a stable milestone, such as a successful deployment, a major feature completion, or a version release.

### Basic Usage

```bash
./scripts/create-golden-baseline.sh
```

This creates a golden baseline with the default settings:
- Creates a Git tag with the prefix "golden-" followed by a timestamp
- Runs tests to verify the codebase is in good condition
- Creates a file-based snapshot for later restoration
- Records environment and build information

### Advanced Usage

```bash
./scripts/create-golden-baseline.sh --prefix prod-golden --message "Release v2.3.0 stable version" --no-docker
```

Available options:
- `--prefix PREFIX`: Use a custom prefix for the golden tag (default: "golden")
- `--message "MESSAGE"`: Add a custom message describing the baseline
- `--no-snapshot`: Skip creating a file-based snapshot
- `--no-tests`: Skip running tests (not recommended)
- `--no-docker`: Skip creating a Docker image
- `--name NAME`: Set a custom application name

## Verifying Against a Golden Baseline

Verify your current codebase against a golden baseline to detect potential issues or regressions.

### Basic Usage

```bash
./scripts/verify-against-golden.sh golden-20250519123045
```

This will compare your current codebase against the specified golden baseline and provide a detailed report.

### Advanced Usage

```bash
./scripts/verify-against-golden.sh golden-20250519123045 --no-performance --output verification-report.md --fix
```

Available options:
- `--no-security`: Skip security checks
- `--no-performance`: Skip performance impact analysis
- `--no-tests`: Skip test verification
- `--no-coverage`: Skip coverage checks
- `--no-api`: Skip API compatibility checks
- `--no-details`: Generate a simplified report
- `--output FILE`: Save the verification report to a file
- `--fix`: Try to automatically fix minor issues
- `--verbose`: Show detailed verification information

## Rolling Back to a Golden Baseline

If issues are discovered, roll back to a golden baseline to restore a known-good state.

### Basic Usage

```bash
./scripts/rollback-to-golden.sh golden-20250519123045
```

This creates a new branch with the rolled-back state from the specified golden baseline.

### Advanced Usage

```bash
./scripts/rollback-to-golden.sh golden-20250519123045 --method docker --branch hotfix-v2-rollback --deploy
```

Available options:
- `--method METHOD`: Specify rollback method (git|docker|snapshot|auto)
- `--branch NAME`: Use a custom branch name for the rollback
- `--deploy`: Deploy the rolled-back version to Azure after rollback
- `--no-verify`: Skip verification after rollback
- `--force`: Force rollback even with uncommitted changes
- `--resource-group NAME`: Specify Azure resource group for deployment
- `--app-name NAME`: Specify Azure static web app name for deployment

## Rollback Methods

The system supports multiple rollback methods:

1. **Git Method**: Uses Git to check out the golden baseline commit. Fast and simple, but requires a clean Git history.

2. **Docker Method**: Extracts files from a Docker image of the golden baseline. Useful when the original environment is captured in Docker.

3. **File Snapshot Method**: Restores from a file-based snapshot archive. Reliable and self-contained, but requires snapshots to be created.

4. **Auto Method (Default)**: Automatically selects the best available method based on what's available.

## Best Practices

1. **Create golden baselines regularly**:
   - At the end of each sprint
   - After major feature completions
   - Before significant architectural changes
   - After successful deployments to production

2. **Run verification before deployments**:
   - Verify code against the last golden baseline before deploying
   - Check for security or performance regressions
   - Validate that all tests still pass

3. **Organize golden baselines**:
   - Use meaningful prefixes (e.g., "prod-golden", "staging-golden")
   - Include version information in custom messages
   - Document the purpose of each golden baseline

4. **Keep golden baselines in CI/CD**:
   - Integrate verification into your CI/CD pipeline
   - Automatically create golden baselines after successful deployments
   - Use verification results as deployment gates

## Example Workflow

1. **End of sprint**:
   ```bash
   ./scripts/create-golden-baseline.sh --message "Sprint 12 completion" --prefix sprint-golden
   ```

2. **Before release**:
   ```bash
   ./scripts/verify-against-golden.sh sprint-golden-20250519123045 --output pre-release-verification.md
   ```

3. **After successful release**:
   ```bash
   ./scripts/create-golden-baseline.sh --message "Release v2.3.0" --prefix prod-golden
   ```

4. **Hotfix rollback**:
   ```bash
   ./scripts/rollback-to-golden.sh prod-golden-20250519123045 --branch hotfix-2.3.1 --deploy
   ```

## Support Files

The golden baseline system creates several support files:

- `.golden-baselines/{TAG}.json`: Contains metadata about each golden baseline
- `.golden-baselines/snapshots/{TAG}.tar.gz`: File-based snapshots for rollback
- `.golden-baselines/verification-{TAG}.md`: Verification reports

These files are committed to your repository to ensure they're available to all team members.

## Documentation

For more detailed information, see:
- [create-golden-baseline.sh](./scripts/create-golden-baseline.sh) - Script for creating golden baselines
- [verify-against-golden.sh](./scripts/verify-against-golden.sh) - Script for verifying against golden baselines
- [rollback-to-golden.sh](./scripts/rollback-to-golden.sh) - Script for rolling back to golden baselines
- [README_GUARDRAILS.md](./README_GUARDRAILS.md) - General information about guardrails