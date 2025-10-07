# Client360 Dashboard Deployment Pipeline

This document outlines the enhanced build and deployment pipeline for the Client360 Dashboard, designed to ensure consistent, high-quality releases with proper environment isolation and automated testing.

## 0. Branch Strategy

The Client360 Dashboard uses a standardized branch strategy:

- **main** - Main development branch, protected from direct pushes
- **feature-dashboard** - Mirror of `main`, used as the standard deployment source
- **feature/\*** - Feature branches for individual work items
- **hotfix/\*** - Emergency fixes that bypass parts of the pipeline

The `feature-dashboard` branch is automatically synchronized with `main` after successful CI builds to ensure a consistent deployment source. All CI/CD operations standardize on the `feature-dashboard` branch as the mirror/deploy source.

### Benefits of feature-dashboard Standardization

1. Consistent deployment source across environments
2. Clean separation between development and deployment branches
3. Simplified Azure Static Web App preview environments
4. Reliable README rendering with proper relative links
5. Consistent environment for automated tests

## 1. Environment Structure

The Client360 Dashboard uses three distinct environments:

### Development
- **Purpose**: Fast feedback for feature development
- **URL Pattern**: `https://gray-pond-0f9ac4803-dev.azurestaticapps.net`
- **Deployment Trigger**: Any push to feature branches
- **Automated Previews**: Each PR gets a unique preview URL

### QA/Staging
- **Purpose**: Pre-production validation and UAT
- **URL Pattern**: `https://blue-coast-0acb6880f-qa.azurestaticapps.net`
- **Deployment Trigger**: Merges to `main` or tags with `-rc` suffix
- **Data Source**: Production-like data with same Key Vault and SQL connections

### Production
- **Purpose**: Live dashboard for end users
- **URL Pattern**: `https://blue-coast-0acb6880f.azurestaticapps.net`
- **Deployment Trigger**: Merges to `main` after QA approval or manual workflow dispatch
- **Deployment Strategy**: Blue-Green deployment for zero downtime

## 2. CI/CD Pipeline Stages

Our enhanced pipeline contains the following stages:

1. **Validate**
   - Lint code with zero-warnings policy
   - Type check with TypeScript
   - Validate DBML schema

2. **Test**
   - Run unit tests with Jest
   - Generate code coverage report

3. **Build**
   - Create optimized production build
   - Generate version.json with build metadata
   - Archive artifacts with SHA-based identifiers for immutability

4. **E2E Tests**
   - Run Playwright tests against a local server
   - Verify critical user flows
   - Generate test reports

5. **Deploy to Environment**
   - Deploy to appropriate environment based on branch or manual trigger
   - Run smoke tests to verify deployment
   - Send notification to Slack/Teams

6. **Export Schema**
   - Export DBML schema to SQL and JSON formats
   - Create documentation for data structure
   - Archive schema as a build artifact

7. **Blue-Green Production Deployment**
   - Deploy to inactive slot (blue or green)
   - Run smoke tests on inactive slot
   - Swap slots to make the new version live
   - Run smoke tests on production
   - Support instant rollback if needed

## 3. Quality Gates

The pipeline enforces the following quality gates:

- **Linting**: ESLint and Stylelint with `--max-warnings=0`
- **Unit Tests**: Must pass with required coverage thresholds
- **E2E Tests**: Critical user flows must function correctly
- **Smoke Tests**: Basic functionality checks post-deployment
- **Performance**: Load time thresholds for key resources
- **Accessibility**: WCAG 2.1 AA compliance checked with automated tools

## 4. Rollback Strategy

The dashboard supports two rollback mechanisms:

1. **Blue-Green Slot Swap**
   - Instant rollback by swapping back to the previous production slot
   - Controlled by `blue_green_deploy.sh` script

2. **Version Archive Deployment**
   - Deploy a specific previous version from archives
   - Every build is archived with SHA-based identifiers
   - Controlled through `deploy_version.sh` script

## 5. Monitoring and Alerts

- **Deployment Notifications**: Slack/Teams messages for success/failure
- **Smoke Test Results**: Automated reports after each deployment
- **QA Test Results**: Comprehensive test reports with screenshots
- **Azure Monitor Alerts**: Set up for error rates, latency, and availability

## 6. Usage Instructions

### Manually Triggering Deployments

```bash
# Trigger workflow via GitHub CLI
gh workflow run "Client360 Dashboard Pipeline" --ref main -f environment=qa

# Directly trigger a blue-green deployment to production
./scripts/blue_green_deploy.sh production

# Emergency rollback to previous version
./scripts/azure_deploy_rollback.sh
```

### Reviewing Test Reports

After each deployment, check the following artifacts:
- Smoke test reports in `reports/smoke_test_*`
- QA test reports in `reports/qa_test_*`
- Screenshots in `screenshots/qa_test_*`

### Post-Deployment Verification

Always verify:
1. URL redirects from root to dashboard
2. TBWA theme is correctly applied
3. Rollback component is functioning
4. Data toggles work as expected

## 7. Branch Mirroring and Deployment Source

The GitHub Actions workflow automatically mirrors the `main` branch to `feature-dashboard` after successful builds:

```yaml
mirror-feature-branch:
  name: Mirror main → ${{ env.MIRROR_BRANCH }}
  needs: [deploy-prod, export-dbml-schema]
  runs-on: ubuntu-latest
  steps:
    - name: Checkout repository
      uses: actions/checkout@v3
      with:
        # need full history so we can reset branches
        fetch-depth: 0

    - name: Configure Git
      run: |
        git config user.name  "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"

    - name: Reset ${{ env.MIRROR_BRANCH }} branch to main
      run: |
        # ensure we're on main
        git checkout main
        # force-update ${{ env.MIRROR_BRANCH }}
        git branch -f ${{ env.MIRROR_BRANCH }}
        git push origin ${{ env.MIRROR_BRANCH }} --force
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This ensures that after a successful production deployment, the `feature-dashboard` branch is updated to match `main` exactly, providing a reliable and consistent deployment source for the next cycle.

## 8. Continuous Improvement

We will continuously enhance this pipeline by:
- Adding visual regression testing
- Implementing canary deployments for safer releases
- Adding synthetic monitoring for production
- Expanding E2E test coverage
- Further automating the mirroring process with better error handling