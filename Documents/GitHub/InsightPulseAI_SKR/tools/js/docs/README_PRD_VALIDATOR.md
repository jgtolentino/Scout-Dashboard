# Client360 PRD Lock & Validator

This document describes the Product Requirements Document (PRD) locking and validation process for the Client360 Dashboard project.

## Overview

The PRD Lock and Validator system ensures that all deployed Client360 Dashboard versions adhere to the requirements specified in the PRD. It:

1. Locks a specific PRD version as the "source of truth"
2. Validates deployed dashboards against this locked PRD
3. Blocks deployments that fail validation
4. Provides detailed reports on validation results

## PRD Lock System

### What is PRD Locking?

PRD locking creates an immutable, versioned snapshot of product requirements that serves as the reference for validation. Once locked, this version is used by the CI/CD pipeline to verify that all required features are implemented correctly.

### Locked PRD Location

The locked PRD is stored at:
```
/docs/client360_prd_v1.0.yaml
```

### PRD Format

The locked PRD is stored in YAML format with:
- Feature IDs (F1-F11)
- Feature validators (CSS selectors, text patterns, or attributes)
- Required/optional status for each feature
- QA validation configuration

## Validation System

### Validation Script

The validation script is located at:
```
/scripts/verify_prd_features.py
```

It:
- Compares PRD feature specifications against deployed UI
- Checks for presence of UI elements that indicate feature implementation
- Tests interactive features like data source toggles and drill-downs
- Generates detailed validation reports

### Running Validation Manually

You can run the validator manually:

```bash
python scripts/verify_prd_features.py \
  --prd docs/client360_prd_v1.0.yaml \
  --deployed_url https://your-dashboard-url.azurestaticapps.net \
  --output validation_report.json
```

### GitHub Actions Integration

A GitHub Actions workflow automatically validates all pushes to `main` and `feature/*` branches:

```
.github/workflows/qa-pipeline.yml
```

This ensures continuous verification of PRD compliance.

## Feature Validation

The system validates features by:

1. **Element Detection**: Checking for HTML elements that indicate feature implementation
2. **Interaction Testing**: Verifying interactive elements like toggles and drill-downs 
3. **Coverage Calculation**: Computing the percentage of PRD features successfully implemented

### Feature Validators

Each feature in the PRD includes a validator that defines how to check for its implementation:

```yaml
- id: F1
  name: Client360 View
  description: 360-degree client relationship visualization
  validator: ".client360-view,.client-relationship-visualization"
  required: true
```

Validators can be:
- CSS selectors (e.g., `.class-name`, `#id-name`)
- Attribute selectors (e.g., `[data-feature="client360"]`)
- Text content matchers (e.g., `text:Client 360 View`)

## Enforcement

### Blocking Deployments

The CI/CD pipeline blocks production deployments when PRD validation fails. This ensures that only compliant versions reach production.

### Notifications

When validation fails:
- Slack notification is sent to `#client360-qa`
- Email notification is sent to QA team and Claudia

## Adding New Features

To add or modify features in the PRD:

1. Create a new version of the PRD YAML file
2. Update feature IDs, descriptions, and validators
3. Increment the `version` field
4. Lock the new version in Pulser
5. Update the GitHub workflow to reference the new PRD version

## Troubleshooting

### Common Validation Issues

1. **Feature UI exists but validation fails**: 
   - Check that the HTML elements match the validators in the PRD
   - Ensure the element has the expected class, ID, or attribute

2. **Interactive feature validation fails**:
   - Verify JavaScript files are properly included
   - Check that event handlers are correctly attached

3. **False positives**:
   - Refine validators to be more specific
   - Use multiple validators for complex features

## For Developers

When implementing PRD features:

1. Review the PRD YAML to understand feature validators
2. Ensure your HTML includes the expected element structures
3. Add appropriate class names, IDs, or data attributes that match the validators
4. Run the validator locally before creating a pull request
5. Fix any validation issues before requesting review

---

For questions or issues with the PRD validation system, contact the QA team or Claudia.

Last updated: May 21, 2025