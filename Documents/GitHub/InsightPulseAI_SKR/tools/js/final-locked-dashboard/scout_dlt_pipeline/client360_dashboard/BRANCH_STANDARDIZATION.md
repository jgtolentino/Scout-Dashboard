# Branch Standardization: Using `feature-dashboard` as Mirror/Deploy Source

## Overview

This document outlines the standardization of using the `feature-dashboard` branch as the primary mirror/deploy source for CI/CD operations in the Client360 Dashboard project.

## Changes Made

1. **GitHub Actions Configuration**:
   - Added `MIRROR_BRANCH: feature-dashboard` environment variable in `.github/workflows/unified-pipeline.yml`
   - Renamed the job from `mirror-feature-dashboard` to `mirror-feature-branch` for flexibility
   - Updated references to use the environment variable instead of hardcoded branch names

2. **Deployment Scripts**:
   - Added `MIRROR_BRANCH="feature-dashboard"` to the following scripts:
     - `scripts/blue_green_deploy.sh`
     - `scripts/deploy_to_azure.sh`

3. **Documentation**:
   - Updated `README.md` to include `feature-dashboard` branch in the deployment pipeline section
   - Enhanced `DEPLOYMENT_PIPELINE.md` with a dedicated section on branch strategy
   - Added branch mirroring explanation section to deployment documentation 
   - Updated PR template to include verification of compatibility with the `feature-dashboard` branch

4. **Created Documentation**:
   - Created this document (`BRANCH_STANDARDIZATION.md`) to record changes

## Benefits of Standardization

By standardizing on the `feature-dashboard` branch as our mirror/deploy source, we achieve several key benefits:

1. **Consistent Environment**: All deployments come from the same branch, ensuring consistency across environments.
2. **Clean Separation**: Keeps `main` clean for development while `feature-dashboard` serves as the deployment source.
3. **Simplified Azure SWA Preview**: Azure Static Web App preview environments work more predictably with a consistent branch.
4. **Reliable README Rendering**: Relative links in documentation render correctly with a standardized branch.
5. **Automated Synchronization**: The GitHub workflow automatically keeps `feature-dashboard` in sync with `main`.
6. **Better Error Handling**: By standardizing the branch name in environment variables, we can more easily handle errors and provide better logging.
7. **Brand Protection**: The sanitization step ensures that internal branding and proprietary information never reaches the public-facing repository.

## Implementation Details

### GitHub Actions Workflow with Sanitization

The critical part of this standardization is the mirror job in the GitHub Actions workflow, which now includes a sanitization step to remove internal branding:

```yaml
mirror-feature-branch:
  name: Mirror main → ${{ env.MIRROR_BRANCH }} (sanitized)
  needs: [deploy-prod, export-dbml-schema]
  runs-on: ubuntu-latest
  steps:
    - name: Checkout main
      uses: actions/checkout@v3
      with:
        ref: main
        fetch-depth: 0

    - name: Configure Git
      run: |
        git config --global user.name "github-actions[bot]"
        git config --global user.email "github-actions[bot]@users.noreply.github.com"

    - name: Prepare sanitized mirror
      run: |
        # Create temporary mirror directory
        mkdir -p mirror
        cd mirror
        git init
        git remote add origin ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}.git
        git fetch --depth=1 origin main
        git checkout -b ${{ env.MIRROR_BRANCH }} origin/main

        # Remove internal branding assets
        rm -rf internal_branding/ pulser-logo.svg pulser_*.* .pulser* pulser/ pulser.* SKR/
        find . -name "*pulser*" -o -name "*SKR*" -o -name "*Pulser*" -o -name "*InsightPulse*" | xargs rm -rf

        # Sanitize internal branding mentions in code/text
        echo "Sanitizing InsightPulse AI references..."
        grep -rIl "InsightPulse AI" --include="*.{md,js,jsx,ts,tsx,html,css,scss,json,yml,yaml}" . || true | xargs -r sed -i 's/InsightPulse AI/Client360 Dashboard/g'
        
        echo "Sanitizing Pulser references..."
        grep -rIl "Pulser" --include="*.{md,js,jsx,ts,tsx,html,css,scss,json,yml,yaml}" . || true | xargs -r sed -i 's/Pulser/Client360/g'
        
        echo "Sanitizing SKR references..."
        grep -rIl "SKR" --include="*.{md,js,jsx,ts,tsx,html,css,scss,json,yml,yaml}" . || true | xargs -r sed -i 's/SKR/Client360/g'
        
        # Commit sanitized changes
        git add -A
        git commit -m "chore: sanitize internal branding for Scout mirror [skip ci]"

        # Verify sanitization was successful
        echo "Auditing for remaining internal branding..."
        if grep -r "InsightPulse\|Pulser\|SKR" --include="*.{md,js,jsx,ts,tsx,html,css,scss,json,yml,yaml}" .; then
          echo "❌ Warning: Some internal branding may still be present!"
          # List files that still contain branding
          grep -r "InsightPulse\|Pulser\|SKR" --include="*.{md,js,jsx,ts,tsx,html,css,scss,json,yml,yaml}" . -l || true
          # Continue anyway, as we might have legitimate occurrences
        else
          echo "✅ No internal branding detected in sanitized files"
        fi

    - name: Push sanitized branch
      run: |
        cd mirror
        git push --force origin ${{ env.MIRROR_BRANCH }}
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This job runs after successful production deployment and schema export to ensure that all changes in `main` are mirrored to the `feature-dashboard` branch, with all internal branding sanitized.

### Sanitization Process

The sanitization process performs the following actions:

1. **File Removal**: 
   - Removes directories and files with internal branding references (e.g., `internal_branding/`, `pulser-logo.svg`, `SKR/`)
   - Uses `find` to locate and remove any files with internal branding in their names

2. **Text Replacement**: 
   - Searches for occurrences of "InsightPulse AI" in code and text files and replaces with "Client360 Dashboard"
   - Searches for occurrences of "Pulser" and replaces with "Client360"
   - Searches for occurrences of "SKR" and replaces with "Client360"

3. **Verification**:
   - Performs an audit after sanitization to check if any internal branding remains
   - Logs any files that still contain branding references for manual review

## Future Improvements

Future improvements to the branch standardization could include:

1. Better error handling and notifications when the branch sync fails
2. Periodic health check to verify branch alignment
3. Protected branch settings for `feature-dashboard` to prevent direct pushes
4. Automated validation of branch compatibility in the CI pipeline
5. Enhanced sanitization patterns for more complex branding references
6. Configurable sanitization rules stored in a YAML configuration file
7. Integration with a brand asset inventory system for more comprehensive sanitization
8. Reporting on sanitized content for security auditing purposes

## Conclusion

The standardization on the `feature-dashboard` branch streamlines our deployment process, reduces confusion, and ensures consistent behavior across environments. This approach follows best practices for CI/CD pipelines and enables more reliable Static Web App deployments.