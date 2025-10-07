# Client360 Dashboard Rollback UAT Guide

## Overview

This guide documents the User Acceptance Testing (UAT) process for the Client360 Dashboard rollback feature. Rolling back to known good versions (golden baselines) is a critical operation that requires thorough testing to ensure dashboard functionality is preserved while maintaining TBWA branding and theme consistency.

## Rollback UAT Workflow

The rollback UAT process follows this workflow:

1. **Preparation Phase**
   - Identify the golden baseline to roll back to
   - Generate a UAT checklist for the rollback
   - Create a backup of the current deployment
   
2. **Rollback Execution Phase**
   - Execute the rollback script to restore the golden baseline
   - Deploy the restored version to the UAT environment
   
3. **Verification Phase**
   - Verify TBWA theme and branding consistency
   - Complete the UAT checklist
   - Document any issues found
   
4. **Sign-off Phase**
   - Stakeholders review UAT results
   - Decision to approve or reject the rollback
   - Sign-off by required approvers

## UAT Scripts

The following scripts are available to support the rollback UAT process:

| Script | Description |
|--------|-------------|
| `scripts/generate_rollback_uat.sh` | Generates a UAT checklist specific to the rollback operation |
| `scripts/verify_tbwa_theme.sh` | Verifies that TBWA branding and theme are correctly preserved |
| `scripts/rollback_dashboard.sh` | Performs the actual rollback to a golden baseline |

## Step-by-Step UAT Process

### 1. Preparation

1.1. **Identify the golden baseline**
```bash
# List available golden tags
git tag -l "golden-*"
```

1.2. **Generate a UAT checklist**
```bash
# Example: Generate UAT checklist for golden-20250519
./scripts/generate_rollback_uat.sh golden-20250519 uat/rollback_uat_checklist.md
```

1.3. **Review the generated UAT checklist**
   - Ensure it includes all necessary verification steps
   - Customize if needed for specific rollback scenarios

### 2. Rollback Execution

2.1. **Execute the rollback script**
```bash
# Example: Roll back to golden-20250519
./scripts/rollback_dashboard.sh golden-20250519
```

2.2. **Deploy to UAT environment**
   - This is typically handled by the rollback script
   - If manual deployment is needed, follow Azure deployment instructions in the script output

### 3. Verification

3.1. **Verify TBWA theme consistency**
```bash
# Run the theme verification script
./scripts/verify_tbwa_theme.sh
```

3.2. **Complete UAT checklist**
   - Work through each item in the UAT checklist
   - Test all dashboard functionality
   - Document expected and actual results
   - Take screenshots as evidence

3.3. **Document issues**
   - Record any discrepancies or issues found
   - Classify by severity (Critical, Major, Minor)
   - Assign ownership for resolution if needed

### 4. Sign-off

4.1. **Review UAT results with stakeholders**
   - Present the completed UAT checklist
   - Discuss any issues found and their impact

4.2. **Decision point**
   - Approve: Proceed with the rollback to production
   - Conditionally approve: Proceed with minor issues noted for future fix
   - Reject: Address critical issues and repeat UAT

4.3. **Formal sign-off**
   - Required approvers sign the UAT document
   - Store the signed document for audit purposes

## UAT Acceptance Criteria

For a rollback to be approved, it must meet these criteria:

1. **Functionality Preservation**
   - All critical dashboard functions work as expected
   - Data is displayed correctly in all components
   - Navigation and filters operate properly

2. **TBWA Branding Consistency**
   - TBWA brand colors are preserved
   - Logo and visual elements appear correctly
   - Font styling and typography match brand guidelines

3. **Performance**
   - Dashboard loads within acceptable time frame
   - Interactive elements respond quickly
   - No resource-intensive processes affecting user experience

4. **Rollback Component**
   - Rollback UI elements render correctly
   - Version information displays accurately
   - Rollback controls function as expected

## UAT Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| **UAT Lead** | Coordinates the UAT process, ensures checklist completion |
| **QA Engineer** | Executes detailed testing, documents results |
| **Business Analyst** | Validates business requirements are met |
| **Developer** | Provides technical support, addresses technical issues |
| **Product Owner** | Reviews UAT results, makes approval decisions |

## Known Rollback Limitations

- **CSS Theme Consistency**: Occasionally requires manual intervention if theme files were significantly changed
- **New Features**: Features added after the golden baseline was created will not be available
- **Data Schema Changes**: If data schema changed, some visualizations may require adjustments

## Troubleshooting Common Rollback Issues

### Theme Issues

If TBWA theme is not applied correctly:
```bash
# Deploy the TBWA theme explicitly
./scripts/deploy_tbwa_theme.sh
```

### Missing Geospatial Map

If the map component is missing or not functioning:
```bash
# Verify map component is present
find deploy -name "*map*.js"

# Check if GeoJSON data exists
find deploy -name "*.geojson"
```

### Rollback Component Not Appearing

If the rollback dashboard component is not visible:
```bash
# Check if rollback styles exist in CSS
grep -r "rollback-dashboard" deploy/
```

## Post-Rollback Verification

After the rollback is applied to production, perform a final verification:

1. **Production Validation**
   - Verify the dashboard loads correctly in production
   - Check that all components function as expected
   - Confirm TBWA branding is consistent

2. **Monitoring**
   - Monitor dashboard performance for 24-48 hours
   - Check for any error reports or user complaints
   - Verify data freshness and accuracy

## Appendix: UAT Template Structure

The UAT template for rollbacks includes these key sections:

1. **Rollback Information**: Basic details about the rollback
2. **Acceptance Criteria**: Functionality, UI/UX, Performance, Theme requirements
3. **Test Scenarios**: Detailed steps to verify rollback functionality
4. **Visual Verification**: Design vs. implementation comparison
5. **Post-Rollback Feature Verification**: Checking all dashboard components
6. **Issues Tracking**: Documenting any problems found
7. **Sign-off**: Formal approval from stakeholders

---

*Last Updated: May 21, 2025*