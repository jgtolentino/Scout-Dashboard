# GenAI Insights Deployment Guide

This guide provides step-by-step instructions for deploying the GenAI insights system for Retail Advisor (formerly InsightPulseAI) across Azure and Vercel environments.

## Prerequisites

- Azure subscription with appropriate permissions
- Databricks workspace
- Azure Storage Account
- LLM API access (Claude, OpenAI, DeepSeek)
- Node.js environment for dashboard deployment
- Git access to the repository

## 1. Azure Resources Setup

### 1.1 Databricks Configuration

```bash
# Run the setup script
./setup_azure_resources.sh

# Configure Databricks tokens
./generate_databricks_token.sh
```

Verify the following resources are created:
- Databricks workspace
- Cluster with appropriate specifications
- Storage mounts for Bronze, Silver, Gold, and Platinum layers

### 1.2 Database Schema Setup

1. Navigate to Databricks workspace
2. Import the `juicer_setup_insights_tables.sql` notebook
3. Set parameter `create_sample_data` to "true" for development or "false" for production
4. Run the notebook to create the Platinum layer schema
5. Verify that tables and views are created successfully

## 2. LLM API Configuration

### 2.1 Azure Key Vault Setup

Create secrets for LLM API keys:
```bash
az keyvault secret set --vault-name RetailAdvisorKeyVault --name claude-api-key --value "your-claude-api-key"
az keyvault secret set --vault-name RetailAdvisorKeyVault --name openai-api-key --value "your-openai-api-key"
az keyvault secret set --vault-name RetailAdvisorKeyVault --name deepseek-api-key --value "your-deepseek-api-key"
```

### 2.2 Update Databricks Notebook

Edit `juicer_gold_insights.py` to retrieve API keys from Key Vault:
```python
# Replace the hardcoded API key placeholders
CLAUDE_API_KEY = dbutils.secrets.get(scope="retail-advisor", key="claude-api-key")
OPENAI_API_KEY = dbutils.secrets.get(scope="retail-advisor", key="openai-api-key")
```

## 3. Dashboard Deployment

### 3.1 Dashboard Files Preparation

```bash
# Run white-labeling script
./whitelabel.sh

# Verify dashboard file contents
ls -la dashboards/
```

### 3.2 Azure Web App Deployment

```bash
# Deploy dashboards to Azure
./deploy_dashboard.sh

# For alternative deployment method
./deploy_dashboard_alternative.sh
```

### 3.3 Vercel Deployment

The dashboards are also deployed to Vercel for mockup purposes:
```bash
# Configure Vercel deployment
npm i -g vercel

# Deploy to Vercel
vercel deploy ./dashboards/ --name scoutadvisor
```

## 4. Scheduled Jobs Configuration

### 4.1 Databricks Jobs Setup

Create the following scheduled jobs:

1. **Daily Insights Generation**
   - Schedule: Daily at 6:00 AM
   - Notebook Path: `/juicer/juicer_gold_insights`
   - Parameters:
     - `date`: "1d" (last day)
     - `model`: "claude"

2. **Weekly Insights Summary**
   - Schedule: Weekly on Monday at 7:00 AM
   - Notebook Path: `/juicer/juicer_gold_insights`
   - Parameters:
     - `date`: "7d" (last 7 days)
     - `model`: "auto"

### 4.2 GitHub Actions Workflow

For CI/CD pipeline, configure the GitHub Actions workflow:
```bash
# Set up GitHub secrets
./github_workflows/deploy-insights.yml
```

## 5. Agent Integration

### 5.1 Agent Configuration

Update the agent configuration file:
```bash
# Verify agent configuration
cat pulser/insights_hook.yaml

# Replace all InsightPulseAI references with Retail Advisor
sed -i 's/InsightPulseAI/Retail Advisor/g' pulser/insights_hook.yaml
sed -i 's/Pulser/Analytics/g' pulser/insights_hook.yaml
sed -i 's/Sunnies/Quality/g' pulser/insights_hook.yaml
```

### 5.2 Agent Deployment

```bash
# Deploy agent configuration
cp pulser/insights_hook.yaml /path/to/deployed/config/
```

## 6. API Configuration

### 6.1 API Endpoints

Create the API endpoint for insights:
```javascript
// Sample code for insights API endpoint
app.get('/api/insights', (req, res) => {
  const timeRange = req.query.time_range || '30d';
  const brandFilter = req.query.brand || 'all';
  const insightType = req.query.type || 'all';
  const confidenceThreshold = parseFloat(req.query.confidence || '0.7');
  
  // Query Databricks for insights
  // ...
  
  res.json(insights);
});
```

### 6.2 API Authentication

Configure API authentication:
```bash
# Set up API authentication
az webapp auth update --name RetailAdvisorAPI --resource-group RetailAdvisor --enabled true
```

## 7. Quality Assurance

### 7.1 Verify Integration

Run the following commands to verify the end-to-end integration:
```bash
# Run manual insights generation
curl -X POST "https://your-api-endpoint/api/insights/generate" -d '{"timeRange":"7d"}'

# Verify insights generation results
curl "https://your-api-endpoint/api/insights?time_range=7d"
```

### 7.2 Dashboard Testing

Test the dashboard functionality:
1. Open the main dashboard hub
2. Navigate to the insights dashboard
3. Verify that insights are displayed correctly
4. Test filtering and interactive features
5. Confirm dark mode functionality
6. Check developer mode features

## 8. Monitoring Setup

### 8.1 Azure Monitor

Configure Azure Monitor for system health tracking:
```bash
# Set up monitoring
az monitor metrics alert create --name "InsightsGeneration" --resource-group RetailAdvisor
```

### 8.2 Dashboard Monitoring

Set up the monitoring dashboard:
```bash
# Deploy monitoring dashboard
./deploy_monitoring_dashboard.sh
```

## 9. Troubleshooting

If you encounter issues during deployment:

### 9.1 Data Pipeline Issues

Check the Databricks notebook execution logs:
```bash
# Check Databricks job logs
databricks jobs runs list --job-id <job-id>
```

### 9.2 Dashboard Rendering Issues

Verify the following:
1. Browser console logs for JavaScript errors
2. Network requests to the API endpoint
3. Response payloads from the API

### 9.3 LLM API Issues

Test LLM API connectivity:
```bash
# Test Claude API
curl -X POST "https://api.anthropic.com/v1/messages" \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Generate a test insight"}]
  }'
```

## 10. Post-Deployment

### 10.1 Documentation Updates

Update the following documentation:
- README.md
- GENAI_INSIGHTS_INTEGRATION.md
- DASHBOARD_ORGANIZATION.md

### 10.2 Knowledge Transfer

Schedule a knowledge transfer session with the team to explain:
- Dashboard architecture
- GenAI insights flow
- Monitoring and troubleshooting
- Future enhancement possibilities

### 10.3 Backup Configuration

Set up regular backups of:
- Database schema
- Agent configurations
- Dashboard files
- API configurations

## Conclusion

Following this deployment guide will ensure the successful implementation of the GenAI insights integration across Retail Advisor dashboards. The system will efficiently process transcript data through LLMs to generate actionable business insights, which will be visualized through interactive dashboards with consistent branding.