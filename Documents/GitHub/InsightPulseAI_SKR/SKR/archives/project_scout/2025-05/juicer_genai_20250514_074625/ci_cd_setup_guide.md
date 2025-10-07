# CI/CD Pipeline Setup Guide for Juicer GenAI Insights

This guide provides comprehensive instructions for setting up a Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Juicer GenAI Insights system.

## Overview

The CI/CD pipeline for Juicer GenAI Insights includes:

1. **Validation**: Automated code quality checks and syntax validation
2. **Build**: Packaging components for deployment
3. **Deployment**: Deploying components to Azure resources
4. **Job Setup**: Configuring scheduled jobs in Databricks
5. **Notifications**: Alerting on deployment status

## GitHub Actions Workflow

The primary CI/CD mechanism is implemented through GitHub Actions, defined in the `deploy-insights.yml` workflow file.

### Workflow Triggers

The workflow is triggered by:

1. **Push events** to specific files:
   - Notebooks: `juicer_gold_insights.py`, `juicer_setup_insights_tables.sql`
   - Dashboard files: `insights_dashboard.html`, `insights_visualizer.js`
   - Configuration: `insights_hook.yaml`
   - Validation scripts: `insights_validator.js`, `dashboard_qa.js`
   - Commands: `prompt_score.js`, `visual_qa.js`
   - Utility files: `prompt-score.js`, `snappy_capture.js`, `snappy_diff.js`

2. **Manual triggers** with options:
   - Environment selection (dev, staging, prod)
   - Force insights generation toggle

## Required Secrets

Before setting up the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `DATABRICKS_HOST` | Databricks workspace URL |
| `DATABRICKS_TOKEN` | Databricks API token |
| `DATABRICKS_CLUSTER_ID` | Databricks cluster ID |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web App deployment token |
| `CLAUDE_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `MS_TEAMS_WEBHOOK_URL` | Microsoft Teams webhook URL (optional) |
| `NOTIFICATION_EMAIL` | Email address for notifications (optional) |
| `MAIL_SERVER` | SMTP server for email notifications (optional) |
| `MAIL_PORT` | SMTP port for email notifications (optional) |
| `MAIL_USERNAME` | SMTP username for email notifications (optional) |
| `MAIL_PASSWORD` | SMTP password for email notifications (optional) |

Refer to `GITHUB_SECRETS_SETUP.md` for detailed instructions on configuring these secrets.

## Setting Up the CI/CD Pipeline

### 1. Repository Configuration

1. Create a `.github/workflows` directory in your repository:
   ```bash
   mkdir -p .github/workflows
   ```

2. Copy the workflow file:
   ```bash
   cp tools/js/juicer-stack/github_workflows/deploy-insights.yml .github/workflows/
   ```

3. Commit and push the workflow file:
   ```bash
   git add .github/workflows/deploy-insights.yml
   git commit -m "Add Juicer GenAI Insights deployment workflow"
   git push
   ```

### 2. Environment Configuration

For each deployment environment (dev, staging, prod), configure environment-specific settings:

1. Go to your GitHub repository settings
2. Navigate to "Environments"
3. Create environments for dev, staging, and prod
4. Configure environment-specific secrets if needed
5. Set up any required approval rules for sensitive environments

### 3. Branch Protection Rules

For production deployments, set up branch protection rules:

1. Go to your GitHub repository settings
2. Navigate to "Branches"
3. Add a rule for your main branch
4. Enable "Require pull request reviews before merging"
5. Enable "Require status checks to pass before merging"
6. Add the workflow status check to the required checks

## Advanced CI/CD Features

### 1. Quality Gates

The CI/CD pipeline includes quality gates to ensure high-quality deployments:

- **Code validation**: Syntax checking for Python, JavaScript, SQL, and HTML files
- **Component testing**: Verification of each component's functionality
- **Integration testing**: Testing the end-to-end pipeline

### 2. Canary Deployments

For production deployments, consider implementing canary deployments:

1. Update the workflow to deploy to a subset of users first
2. Monitor the canary deployment for issues
3. Gradually roll out to all users if no issues are found

### 3. Rollback Mechanism

The workflow includes mechanisms for rolling back failed deployments:

1. Preserve previous versions of notebooks and dashboards
2. Automatically roll back to the previous version if deployment fails
3. Create versioned backups in Azure Storage

## Environment-Specific Deployment Parameters

### Development Environment

For the dev environment, the deployment includes:

- Sample data generation for testing
- Verbose logging for debugging
- Development-specific configuration parameters

```json
{
  "env": "dev",
  "create_sample_data": true,
  "model": "claude",
  "logging_level": "debug"
}
```

### Staging Environment

For the staging environment, the deployment includes:

- Limited sample data
- Standard logging
- Testing-specific configuration parameters

```json
{
  "env": "staging",
  "create_sample_data": true,
  "model": "auto",
  "logging_level": "info"
}
```

### Production Environment

For the production environment, the deployment includes:

- No sample data generation
- Minimal logging
- Production-specific configuration parameters

```json
{
  "env": "prod",
  "create_sample_data": false,
  "model": "claude",
  "logging_level": "warn"
}
```

## Testing the Pipeline

To manually test the CI/CD pipeline:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy Juicer GenAI Insights" workflow
3. Click "Run workflow"
4. Choose the environment and options
5. Monitor the workflow execution
6. Verify the deployment in the target environment

## Monitoring Deployments

After setting up the CI/CD pipeline, implement monitoring:

1. Set up Azure Monitor alerts for deployment failures
2. Configure notification channels for deployment status
3. Implement metrics collection for deployment performance
4. Create dashboards for visualizing deployment statistics

## Continuous Improvement

To continuously improve the CI/CD pipeline:

1. Collect metrics on deployment time, success rate, and quality
2. Analyze deployment failures to identify common issues
3. Automate more parts of the deployment process over time
4. Regularly update the workflow to incorporate best practices

## Troubleshooting

### Common Issues

#### 1. Secret Configuration Issues

**Symptom**: The workflow fails with authentication errors.

**Solution**:
- Verify that all required secrets are configured correctly
- Check secret names and values
- Ensure secrets have not expired

#### 2. Databricks API Issues

**Symptom**: The workflow fails during notebook deployment.

**Solution**:
- Verify Databricks host and token
- Check that the cluster ID is correct
- Ensure the Databricks workspace is accessible

#### 3. Static Web App Deployment Issues

**Symptom**: Dashboard deployment fails.

**Solution**:
- Verify the Static Web App deployment token
- Check that the app location is correct
- Ensure the repository has the required permissions

## Resources

For more information, refer to:

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Azure DevOps documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Databricks REST API documentation](https://docs.databricks.com/dev-tools/api/latest/index.html)
- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)