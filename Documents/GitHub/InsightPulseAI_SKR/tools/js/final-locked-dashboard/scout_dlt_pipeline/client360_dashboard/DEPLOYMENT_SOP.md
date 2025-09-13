# Deployment Standard Operating Procedure (SOP)

## Overview

This document outlines the standard procedures for deploying the Client360 Dashboard, with special emphasis on Quality Assurance (QA) mechanisms to ensure successful deployments.

## Pre-Deployment Requirements

Before any deployment is initiated, the following must be in place:

1. Code changes have been peer-reviewed and approved
2. All unit tests and integration tests have passed
3. The verification script has been run successfully
4. Deployment credentials and permissions have been verified

## Deployment Process

### 1. Pre-Deployment Verification (MANDATORY)

**All deployments MUST run the automated verification script:**

```bash
./scripts/verify_deployment.sh
```

This script performs critical checks including:

- TBWA theme file verification
- Rollback component style validation
- Logo resource verification
- Deployment script validation
- CSS build verification
- Azure credential validation
- Deploy directory structure validation

**A deployment MUST NOT proceed if the verification fails.** Issues must be fixed first.

### 2. Theme Verification

For TBWA-themed deployments, additional theme-specific checks are performed:

- Brand color correctness (#002B80 Navy, #00C3EC Cyan)
- Theme CSS file structure and content
- Rollback component styling
- Logo paths and resources

### 3. Deployment Execution

After successful verification:

1. Run the deployment script:
   ```bash
   ./deploy_to_azure.sh
   ```

2. The script automatically includes the verification step from step 1

3. Verify the deployment URL returns a 200 status code after completion

### 4. Post-Deployment Verification

After deployment completes:

1. Verify the live dashboard loads successfully
2. Manually check TBWA theme appearance
3. Test rollback component functionality
4. Document any issues encountered during deployment

## Troubleshooting

If verification or deployment fails:

1. Check verification logs in `logs/deployment_verification_*.log`
2. Review verification reports in `reports/deployment_verification_*.md`
3. Address reported issues in order of severity
4. Run verification again after fixing issues

## Implementation Requirements for New Features

**All new features or modifications MUST include:**

1. Appropriate entries in the verification script
2. Updates to theme files if UI components are affected
3. Documentation of changes and verification steps
4. Verification that the feature doesn't break existing functionality

## PRD Development Guidelines

When creating Product Requirements Documents (PRDs) for new features:

1. Include a "Deployment Verification" section with:
   - Specific verification steps for the feature
   - Expected verification outputs
   - Potential failure points

2. Require QA mechanisms:
   - Add verification checks for all new components
   - Document expected theme behavior
   - List critical elements that must be verified

3. Define success criteria:
   - Clear metrics for successful deployment
   - Visual verification checklist if applicable
   - Performance expectations after deployment

## Documentation

All deployments must be documented with:

1. Deployment timestamp and version
2. Verification results
3. Any issues encountered and their resolutions
4. Notes for future deployments

## Continuous Improvement

The verification and deployment process should be reviewed after each deployment for potential improvements:

1. Update verification scripts with new checks as needed
2. Document recurring issues and their solutions
3. Automate additional aspects of verification where possible

By following this SOP, we can significantly reduce deployment failures and ensure consistent quality in our dashboard deployments.