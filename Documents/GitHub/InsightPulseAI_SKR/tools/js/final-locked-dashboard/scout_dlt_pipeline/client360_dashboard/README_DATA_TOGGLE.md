# Client360 Dashboard Data Toggle Integration Guide

This guide explains how to use the enhanced data toggle feature in the Client360 Dashboard, which allows seamless switching between live and synthetic data sources.

## 🔄 Overview

The Client360 Dashboard now supports two data modes:

1. **Live Data Mode** - Uses Azure OpenAI to generate insights based on real-time data from production databases and APIs
2. **Synthetic Data Mode** - Uses pre-generated Parquet files for simulated data, perfect for demos, testing, and development

The toggle enables you to switch between these modes instantly, with visual indicators showing which mode is active.

## 🧩 Key Components

The data toggle integration consists of several key components:

- **Data Source Toggle UI** - Located in the dashboard header
- **Azure OpenAI Integration** - For live data insights
- **Parquet Data Files** - For synthetic data storage
- **AI Insights Component** - UI component that displays AI-generated insights
- **Diff-Aware Deployment Scripts** - For efficient updates to Azure Static Web Apps

## 🛠️ Configuration Files

### Azure OpenAI Configuration

Live data mode uses Azure OpenAI to generate insights. Configure it in:
```
/data/ai/config/azure_openai_config.json
```

Example configuration:
```json
{
    "endpoint": "https://your-azure-openai-resource.openai.azure.com/",
    "apiKey": "your-azure-openai-api-key",
    "apiVersion": "2023-05-15",
    "deploymentName": "your-deployment-name",
    "maxTokens": 800,
    "temperature": 0.7,
    "enabled": true
}
```

### Synthetic Data (Parquet Files)

Synthetic data mode uses Parquet files stored in:
```
/data/synthetic/
```

Key synthetic data files:
- `stores.parquet` - Store information with geographic data
- `daily_sales.parquet` - Daily sales data per store
- `brands.parquet` - Brand performance metrics
- `ai_insights.parquet` - Pre-generated AI insights

## 🚀 Deployment

### Diff-Aware Deployment

The system uses diff-aware deployment to efficiently update only changed files:

```bash
./patch-deploy-diff-aware.sh
```

Options:
- `--integrate-azure-openai` - Includes Azure OpenAI configuration in deployment
- `--integrate-parquet` - Includes Parquet data files in deployment
- `--with-data-toggle` - Updates UI components for data toggle functionality

Example deployment with all features:
```bash
./patch-deploy-diff-aware.sh --integrate-azure-openai --integrate-parquet --with-data-toggle
```

### Deployment Verification

After deployment, verify the installation:

```bash
./verify_deployment.sh --check-all
```

Options:
- `--verify-azure-openai` - Checks Azure OpenAI configuration
- `--verify-parquet` - Checks Parquet data files
- `--verify-data-toggle` - Checks UI components
- `--check-all` - Checks all components
- `--url URL` - Specifies the deployment URL to verify

## 📊 Generating Synthetic Data

To generate or update synthetic data:

```bash
cd /data/synthetic
python generate_parquet_samples.py
```

This script:
1. Creates sample data in JSON format
2. Converts it to Parquet format for use in the dashboard
3. Includes store data, sales data, and AI insights

## 🧠 AI Insights Component

The AI insights component (`ai_insights_component.js`) automatically:

1. Detects the current data source from the toggle state
2. Loads insights from the appropriate source:
   - Azure OpenAI API when in live mode
   - Parquet files when in synthetic mode
3. Updates the UI with a visual indicator showing the current data source
4. Caches data to minimize repeated API calls

## 🔍 Troubleshooting

### Live Data Mode Issues

If Azure OpenAI insights aren't loading:
1. Check your `azure_openai_config.json` file
2. Ensure your Azure OpenAI service is provisioned and accessible
3. Verify your API key has appropriate permissions
4. Check network connectivity to the Azure OpenAI endpoint

### Synthetic Data Mode Issues

If synthetic data isn't loading:
1. Ensure Parquet files exist in the `/data/synthetic/` directory
2. Run the `generate_parquet_samples.py` script to create sample data
3. Check for browser console errors related to file loading
4. Note that the system will fall back to JSON if Parquet loading fails

### Deployment Issues

If deployment fails:
1. Check logs in `logs/patch_deploy_*.log`
2. Verify Azure credentials and permissions
3. Run `./verify_deployment.sh --check-all` to identify specific issues
4. Try deploying with the `--force` flag to deploy all files regardless of changes

## 🔮 Future Enhancements

Planned improvements for the data toggle system:

1. Real-time switching between data sources without page reload
2. Enhanced caching system for faster data access
3. More granular control over which components use which data source
4. Support for additional synthetic data formats beyond Parquet
5. A/B testing support via the toggle mechanism

## 📚 Additional Resources

- [Parquet File Format](https://parquet.apache.org/)
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Dashboard Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Data Source Integration Guide](./README_DATA_SOURCES.md)