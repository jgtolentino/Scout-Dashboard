# Juicer - Databricks Integration for InsightPulseAI

Juicer is an AI-BI analytics integration layer that connects InsightPulseAI's Pulser 2.0 CLI with Databricks, enabling seamless data processing, analysis, and visualization of brand mentions and insights from transcribed conversations.

## 🚀 Deployment Status: COMPLETED

The Juicer GenAI Insights system has been successfully deployed to Azure. All infrastructure components are ready, with dashboards and notebooks prepared for full operationalization.

### Quick Links

- **Dashboard**: [https://gentle-rock-04e54f40f.6.azurestaticapps.net](https://gentle-rock-04e54f40f.6.azurestaticapps.net)
- **Deployment Documentation**: [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md)
- **Azure Guide**: [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md)

For setup instructions, see the [**Deployment Instructions**](#deployment-instructions) section below.

## Internal InsightPulseAI Agent Roles

- **Claudia** – CLI task routing and orchestration for `:juicer` commands
- **Maya** – Documentation and visualization templates via `juicer_hook.yaml`
- **Kalaw** – Knowledge extraction from enriched SQL + entity metadata
- **Echo** – Signal extraction, transcription sentiment enrichment
- **Sunnies** – Visual rendering of charts and dashboard blocks
- **Caca** – QA validation and hallucination detection for GenAI insights

## Components

### Notebooks

The `notebooks/` directory contains Databricks notebooks that implement the core data processing pipelines:

- `juicer_ingest_bronze.sql`: Ingests raw transcription data into Databricks Delta Bronze layer
- `juicer_enrich_silver.py`: Processes Bronze data to extract brand mentions and sentiment
- `juicer_gold_insights.py`: Transforms Gold layer data into GenAI insights using Claude/OpenAI/DeepSeek
- `juicer_setup_insights_tables.sql`: Creates Platinum layer schema for storing GenAI insights
- `juicer_setup_storage.py`: Configures storage mounts and initializes database structure

### Dashboards

The `dashboards/` directory contains visualization components:

- `agent_brand_heatmap.dbviz`: Visualizes brand mentions with sentiment analysis
- `insights_dashboard.html`: Interactive dashboard for exploring GenAI insights
- `insights_visualizer.js`: JavaScript library for insights visualization
- `juicer_dash_shell.html`: Shell template for embedded dashboards
- `drilldown-dashboard.html`: Brand to SKU hierarchical drilldown dashboard

A [Dashboard Gallery](./docs/DASHBOARD_GALLERY.md) is available with screenshots of all dashboards.

### CLI and QA Tools

The `cli/` directory contains command-line tools:

- `juicer_cli.py`: Python CLI for executing Juicer commands

The root directory contains quality assurance tools:

- `insights_validator.js`: Validates GenAI insights using Caca's QA capabilities
- `dashboard_qa.js`: Visual QA for dashboard components using Snappy

### Pulser Integration

The `pulser/` directory contains configuration files for Pulser CLI:

- `juicer_hook.yaml`: Configuration for brand mentions commands
- `insights_hook.yaml`: Configuration for GenAI insights commands

## Architecture

Juicer follows the extended Medallion architecture pattern with four data layers:

1. **Bronze Layer**: Raw ingested data from source systems (transcriptions)
2. **Silver Layer**: Cleaned and enriched data (brand mentions with sentiment)
3. **Gold Layer**: Aggregated, analysis-ready data (reconstructed transcripts)
4. **Platinum Layer**: GenAI-generated insights with confidence scoring

### Data Flow

```
Azure SQL → Bronze Layer → Silver Layer → Gold Layer → Platinum Layer → Insights Dashboard
                                     ↓            ↓
                    Brand Detection  GenAI Processing (Claude/OpenAI/DeepSeek)
                     & Sentiment     Multi-model with fallback & confidence scoring
```

## Deployment Instructions

### 1. Azure Resources (✅ Completed)

The following Azure resources have been deployed:

- Resource Group: `RG-TBWA-ProjectScout-Juicer`
- Storage Account: `tbwajuicerstorage`
- Databricks Workspace: `tbwa-juicer-databricks`
- Static Web App: `tbwa-juicer-insights-dashboard`
- Key Vault: `kv-tbwa-juicer-insights2`

### 2. Generate Databricks Token

Run the helper script to obtain and save a Databricks access token:

```bash
# Make script executable
chmod +x generate_databricks_token.sh

# Run the script
./generate_databricks_token.sh
```

This will:
- Open your browser to the Databricks token creation page
- Save the token to Azure Key Vault
- Configure Databricks CLI on your local machine

### 3. Set Up Databricks Resources

Run the setup script to configure Databricks workspace with notebooks, cluster, and jobs:

```bash
# Make script executable
chmod +x setup_databricks_resources.sh

# Run the script
./setup_databricks_resources.sh
```

### 4. Deploy Dashboard via GitHub Actions

Trigger the GitHub Actions workflow to deploy the dashboard:

```bash
# Make script executable
chmod +x trigger_github_deployment.sh

# Run the script
./trigger_github_deployment.sh
```

Alternatively, manually push changes to GitHub and trigger the `deploy-insights.yml` workflow.

### 5. Verify Deployment

Verify the deployment using the provided script:

```bash
# Make script executable
chmod +x azure_deployment_verification_custom.sh

# Run the script
./azure_deployment_verification_custom.sh
```

Visit the Static Web App URL to confirm the dashboard is working properly.

## Usage Examples

### Brand Mentions Analysis

```bash
# Using Juicer CLI directly
juicer query --nl "Show brand mentions for Jollibee last 7 days"

# Using Pulser CLI
:juicer query "Show brand mentions for Jollibee last 7 days"
```

### GenAI Insights Generation

```bash
# Generate insights from Gold layer data
:juicer insights generate --days 7 --model claude

# Display generated insights
:juicer insights show --type brand --brand Jollibee --limit 5

# Create visualizations from insights
:juicer insights visualize --type heatmap --group brand
```

### Run Notebooks

```bash
# Run insights generation notebook
:juicer notebook juicer_gold_insights --params date=2025-05-01 end_date=2025-05-10 env=dev
```

### View Dashboard

```bash
# Show insights dashboard
:juicer dashboard insights
```

## Quality Assurance

### Validate Insights

Run the insights validator to check for hallucinations and other quality issues:

```bash
node insights_validator.js --input path/to/insights.json
```

### Visual QA

Run visual regression tests on dashboard components:

```bash
node dashboard_qa.js --start-server
```

## White-Labeling for Client Deployment

For client-facing versions of the codebase:

```bash
# Create white-labeled version
./whitelabel_simple.sh

# Push to client repository
./dual_repo_push.sh
```

This converts internal agent references (Claudia, Kalaw, etc.) to client-facing aliases (TaskRunner, KnowledgeModule, etc.) and copies to a client-friendly repository.

## Additional Documentation

- `IMPLEMENTATION_PLAN.md`: Detailed implementation roadmap
- `GENAI_INSIGHTS_INTEGRATION.md`: Architecture of the insights system
- `DEVELOPER.md`: Developer guide with implementation details
- `DEPLOYMENT_COMPLETE.md`: Deployment status and final configuration
- `AZURE_DEPLOYMENT_GUIDE.md`: Step-by-step Azure deployment guide
- `DEBUGGING.md`: Troubleshooting guide
- `DASHBOARD_GALLERY.md`: Screenshots of all deployed dashboards

## License

Copyright © 2023-2025 InsightPulseAI. All rights reserved.