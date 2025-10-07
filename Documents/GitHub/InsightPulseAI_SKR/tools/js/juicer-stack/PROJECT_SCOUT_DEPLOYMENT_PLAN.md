# Project Scout Deployment Plan

This document outlines the steps to deploy the GenAI insights dashboards using dual repo push to the Project Scout repository.

## Step 1: Verify Production Readiness

Before deployment, verify that the code is production-ready:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
./verify_commit_readiness.sh
```

This script will check for critical files and ensure the code meets production standards.

## Step 2: Prepare Deployment Files

Run the deployment script to generate deployment files:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
node tools/deploy_insights_all_dashboards.js --env staging
```

This will create a complete set of dashboard files in `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy`.

## Step 3: Run White-labeling Process

White-label the code for external consumption:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
./whitelabel.sh
```

This script will create white-labeled files in `client-facing/output/` with appropriate naming conventions:
- `Pulser` → `OpsCore`
- `Claudia` → `TaskRunner`
- `Kalaw` → `KnowledgeModule`
- `Maya` → `FlowManager`
- `Echo` → `SignalParser`
- `Sunnies` → `ChartRenderer`
- `Caca` → `QAChecker`

## Step 4: Run Dual Repo Push

Execute the dual repo push script with production-ready flag:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
SKR_TAG=prod-ready ./dual_repo_push.sh
```

This script will:
1. Archive the current version to the SKR repository with appropriate metadata
2. Copy white-labeled files to the Project Scout repository
3. Guide you through the commit process for the Project Scout repository

## Step 5: Create GitHub PR in Project Scout Repo

After the dual push is complete, you'll need to create a pull request in the Project Scout repository:

1. Navigate to the Project Scout repository
2. Create a pull request from the feature branch to the main branch
3. Include relevant details about the GenAI insights integration
4. Request a review from the appropriate team members

## Step 6: Deploy to Azure Static Web App

Once the PR is approved and merged, deploy to Azure Static Web App using GitHub Actions:

1. Go to the Project Scout GitHub repository
2. Navigate to the Actions tab
3. Select the "Deploy Retail Advisor Dashboards" workflow
4. Click "Run workflow" and select the appropriate environment (dev/staging/prod)
5. Monitor the deployment process

## Step 7: Verify Deployment

After deployment completes:

1. Access the deployed dashboards at the provided URL
2. Verify that all dashboards display correctly
3. Confirm that GenAI insights integration is working on all dashboards
4. Run any additional QA tests as needed

## Step 8: Update Documentation

Update relevant documentation to reflect the deployment:

1. Update the `IMPLEMENTATION_COMPLETE.md` file
2. Add deployment details to `DEPLOYMENT_COMPLETE.md`
3. Capture screenshots of the deployed dashboards
4. Update the `README.md` with access instructions

## Troubleshooting

If you encounter issues during deployment:

1. Check the logs in both repositories for error messages
2. Verify that all secrets and environment variables are correctly set
3. Ensure that paths in white-labeled files are correct
4. Confirm that Azure resources are properly configured

For additional support, contact the InsightPulseAI team or review the Azure Static Web Apps documentation.