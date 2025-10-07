# Dashboard Deployment Quick Start Guide

This guide provides quick instructions for deploying the GenAI insights dashboards to the Project Scout repository.

## Prerequisites

Before starting the deployment, ensure you have:

1. Access to both InsightPulseAI_SKR and Project Scout repositories
2. Proper permissions to push to both repositories
3. Node.js installed (v14 or higher)
4. GitHub access for creating pull requests and running workflows

## Option 1: Automated Deployment (Recommended)

Use the automated deployment script that handles all steps for you:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
./deploy_to_project_scout.sh
```

Follow the prompts and instructions provided by the script.

## Option 2: Manual Deployment

If you prefer to run the steps manually:

1. **Verify Production Readiness**
   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
   ./verify_commit_readiness.sh
   ```

2. **Generate Deployment Files**
   ```bash
   node tools/deploy_insights_all_dashboards.js --env staging
   ```

3. **White-Label the Code**
   ```bash
   ./whitelabel.sh
   ```

4. **Run Dual Repo Push**
   ```bash
   SKR_TAG=prod-ready ./dual_repo_push.sh
   ```

5. **Create GitHub PR in Project Scout Repo**
   
   Navigate to the Project Scout repository and create a pull request from the feature branch to main.

6. **Deploy Using GitHub Actions**
   
   In the Project Scout repository, go to the Actions tab and run the deployment workflow.

## Post-Deployment Verification

After deployment completes:

1. Access the deployed dashboards at:
   ```
   https://gentle-rock-04e54f40f.6.azurestaticapps.net
   ```

2. Verify all three dashboards:
   - Main Insights Dashboard
   - Retail Edge Dashboard
   - Operations Dashboard

3. Confirm that GenAI insights are properly displayed in all dashboards

## Troubleshooting

If you encounter issues during deployment:

- Check logs in the juicer-stack/logs directory
- Verify that all required files exist in the repository
- Ensure that GitHub secrets are properly configured
- Confirm that the Azure Static Web App exists and is properly configured

For detailed deployment instructions, refer to:
- [PROJECT_SCOUT_DEPLOYMENT_PLAN.md](./PROJECT_SCOUT_DEPLOYMENT_PLAN.md)
- [DUAL_PUSH_POLICY.md](./DUAL_PUSH_POLICY.md)
- [GITHUB_DEPLOYMENT_INSTRUCTIONS.md](./GITHUB_DEPLOYMENT_INSTRUCTIONS.md)