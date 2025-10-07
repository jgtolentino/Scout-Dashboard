# Client360 Dashboard Full PRD Deployment Guide

This document provides instructions for deploying the Client360 Dashboard with all PRD requirements, including LLM integration with Azure OpenAI, synthetic data support with Parquet files, and data source toggle functionality.

## 📋 Prerequisites

- Azure CLI installed and configured
- Python 3.8+ with required packages (pandas, pyarrow)
- Access to Azure Static Web Apps service
- Azure OpenAI resource (optional, for live data insights)

## 🔧 Components

The complete deployment includes:

1. **Azure OpenAI Integration**
   - Configuration for generating AI insights from live data
   - Integration with dashboard UI for real-time insights
   - Fallback mechanisms for when Azure OpenAI is unavailable

2. **Parquet File Support**
   - Synthetic data stored in efficient Parquet format
   - Sample data generation for development and testing
   - Conversion utilities for JSON to Parquet

3. **Data Toggle Functionality**
   - UI component to switch between live and synthetic data
   - Visual indicators showing current data source
   - Persistent preference storage

4. **Diff-Aware Deployment**
   - Efficient deployment that only updates changed files
   - Support for multiple deployment environments
   - Verification steps to ensure proper functionality

## 🚀 Deployment

We've created a comprehensive deployment script `deploy_client360_full.sh` that handles the entire process in a single command:

```bash
./deploy_client360_full.sh
```

### Options

- `--force` - Deploy all files regardless of changes
- `--skip-verification` - Skip the verification step
- `--skip-openai` - Skip Azure OpenAI integration
- `--skip-parquet` - Skip Parquet file support

### What the Deployment Script Does

1. **Setup**
   - Verifies dependencies and Azure CLI login
   - Creates necessary directories
   - Initializes logging

2. **Azure OpenAI Configuration**
   - Creates or uses existing Azure OpenAI configuration
   - Sets up integration components

3. **Parquet Support**
   - Generates sample data if needed
   - Converts JSON to Parquet format
   - Configures dashboard to use Parquet files

4. **Data Toggle Implementation**
   - Adds data source toggle to dashboard UI
   - Updates AI insights component to support toggle
   - Implements data source persistence

5. **Deployment**
   - Uses diff-aware deployment when available
   - Falls back to direct deployment if needed
   - Includes all necessary files and configurations

6. **Verification**
   - Runs verification to ensure functionality
   - Generates comprehensive deployment report
   - Provides URL and access information

## 🔍 Post-Deployment Verification

After deployment, verify the following:

1. **Azure OpenAI Integration**
   - Dashboard can connect to Azure OpenAI
   - AI insights are generated from live data
   - Fallback to synthetic data works when needed

2. **Parquet Support**
   - Synthetic data loads correctly
   - Parquet files are accessible to the dashboard
   - Data integrity is maintained

3. **Data Toggle**
   - Toggle UI is visible and functional
   - Switching between data sources works
   - Data source preference is remembered

4. **Overall Functionality**
   - Dashboard loads all components correctly
   - Maps and visualizations render properly
   - Performance meets requirements

## 📝 Troubleshooting

### Azure OpenAI Issues

- Check your Azure OpenAI configuration
- Verify API key and permissions
- Ensure deployment name is correct

### Parquet File Issues

- Verify Python dependencies are installed
- Check if Parquet files were generated correctly
- Ensure file paths are correct in configuration

### Deployment Issues

- Check Azure credentials and permissions
- Verify Static Web App exists and is configured
- Check deployment logs for specific errors

## 🔄 Rollback Procedure

If the deployment fails or causes issues:

1. Use the backup version of the dashboard
   ```bash
   ./rollback_to_previous_version.sh
   ```

2. Or deploy a specific version
   ```bash
   ./deploy_client360_full.sh --version 2.3.0
   ```

## 📊 Demonstration Guide

For showcasing the deployed dashboard:

1. **Start with Synthetic Data View**
   - Explain that this uses pre-generated data
   - Show all available insights and visualizations
   - Demonstrate filtering and interaction

2. **Switch to Live Data View**
   - Use the data toggle to switch to live data
   - Explain that insights are now generated in real-time
   - Show how data refreshes automatically

3. **Highlight Key Features**
   - AI-generated insights on sales performance
   - Brand analysis with sentiment tracking
   - Store-specific recommendations

## 🧪 Testing the Full PRD

The deployment script automatically runs verification tests. For manual testing:

1. **Test Data Toggle**
   ```
   1. Load the dashboard
   2. Click the "Live Data" button
   3. Verify the indicator shows "Live Data"
   4. Click the "Simulated Data" button
   5. Verify the indicator shows "Simulated Data"
   6. Refresh the page and verify the preference is remembered
   ```

2. **Test Azure OpenAI Integration**
   ```
   1. Enable live data mode
   2. Check browser console for API requests
   3. Verify insights are loaded from Azure OpenAI
   4. Modify Azure OpenAI config to be invalid
   5. Verify the fallback to synthetic data works
   ```

3. **Test Parquet Support**
   ```
   1. Enable synthetic data mode
   2. Verify insights load from Parquet files
   3. Add new Parquet files to the synthetic folder
   4. Refresh and verify new data appears
   ```

## 🔒 Security Considerations

- Azure OpenAI API key is stored securely
- All HTTP requests use HTTPS
- No sensitive data is included in the client-side code
- Authentication and authorization are handled by Azure Static Web Apps

---

For any questions or issues, please contact the development team.