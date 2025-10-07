# Final Locked Dashboard Structure

This directory contains the final, locked dashboard structure for Project Scout as specified in patch_id: `dashboard-final-alignment-v3`.

> **🔄 SOP Update**: This project now follows the **[Unified Developer Deployment SOP (v1.0)](./docs/SOP_DEPLOYMENT.md)** for all deployments.

## Dashboard Structure

### New URL Structure (Current)

| Dashboard Name             | URL Path                                  | Purpose                                                              | Access Level |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------------- | ------------ |
| `Scout Ops`              | `/ops`                                    | Infra health, model metrics, anomaly detection, QA + system ops      | **INTERNAL ONLY** |
| `Scout Advisor`          | `/advisor`                                | GenAI-powered retail insights (market intelligence, brand profiling) | **INTERNAL ONLY** |
| `Scout Edge`             | `/edge`                                   | Store-level AI insights (sales uplift, edge performance)             | **CLIENT-FACING** |

### Legacy File Structure (Deprecated)

| Dashboard Name             | Legacy Filename                           | Purpose                                                              | Access Level |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------------- | ------------ |
| `System Architecture & QA` | `/qa.html`                                | Infra health, model metrics, anomaly detection, QA + system ops      | **INTERNAL ONLY** |
| `Scout Advanced Analytics` | `/insights_dashboard.html` or `/insights_dashboard_v2.html` | GenAI-powered retail insights (market intelligence, brand profiling) | **INTERNAL ONLY** |
| `Retail Advisor` | `/retail_edge/retail_edge_dashboard.html` | Store-level AI insights (sales uplift, edge performance)             | **CLIENT-FACING** |

> **Note**: We've implemented a clean URL structure that replaces the old file-based URLs. See [URL_STRUCTURE_CHANGES.md](./docs/URL_STRUCTURE_CHANGES.md) for complete details.

## Features

### System Architecture & QA

- **System Health Monitoring**: Model Reliability, Data Health, Infrastructure Uptime, API Performance
- **Device Monitoring**: Total Devices, Silent Devices, Critical Alerts, Device Health Metrics
- **Anomaly Detection**: Model Drift Status, Confidence Deviation, Outlier Rate
- **QA Developer Mode** (toggle button reveals):
  - System Activity Timeline
  - Azure Well-Architected Metrics
  - Service Health Status Table
- **Footer**: Contains Pulser v2.1.2 versioning

### Scout Advanced Analytics

- Client-focused insights without any system internals
- Power BI-style visualization for executive use
- Brand profiling and market intelligence
- Trending tags and insight categorization
- **NEW**: Power BI styling to match Vercel deployment (v2.0-powerbi-style)
- **NEW**: Medallion Data Architecture integration with real/simulated data toggle
- **NEW**: Dynamic data filters for time period, store, category, and brand

### Retail Advisor

- Store-level metrics and KPIs
- Product performance tracking
- Sales category analysis
- Focused AI insights for retail operations
- SQL Data Explorer for database analysis
- Real-time transaction data visualization

## Deployment

### Clean URL Structure Deployment (Recommended)

To deploy the dashboards with clean URL structure:

```bash
# Using Pulser CLI (recommended)
:dash-deploy all

# Or using the deployment script directly
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard
./tools/cli/deploy_dashboards.sh --deploy
```

This will create a deployment package with the new URL structure, deploy it to Azure Static Web App, and ensure the clean URLs work properly without 404 errors.

### Standard Dashboard Deployment (Legacy)

To deploy the static dashboards (original file structure):

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard
./deploy_locked_dashboard.sh
```

### Power BI Styled Dashboard Deployment

To deploy the Power BI-styled version of Scout Advanced Analytics:

```bash
# Using Make commands (recommended)
make package
make deploy

# Or directly using the deployment script
./scripts/deploy_dashboard.sh
```

See [SOP_DEPLOYMENT.md](./docs/SOP_DEPLOYMENT.md) for detailed deployment instructions and [URL_STRUCTURE_CHANGES.md](./docs/URL_STRUCTURE_CHANGES.md) for URL structure details.

### SQL API Deployment

To start the SQL API server:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard
./run_sql_api.sh
```

This will start the SQL API server on port 3001. The SQL API will:
- Connect to the retail database (or use simulated data)
- Provide REST endpoints for dashboard data
- Support the Data Source Toggle functionality
- Make the SQL Data Explorer available at:
```
http://localhost:3001/retail_edge/sql_data_explorer.html
```

See `README_SQL_INTEGRATION.md` for details about the SQL integration and `README_DATA_SOURCES.md` for information about the data source toggle.

## Documentation

- [**SOP_DEPLOYMENT.md**](./docs/SOP_DEPLOYMENT.md) - **Unified Developer Deployment SOP (v1.0)** - Primary reference for all deployments
- [DEPLOY_NOTES.md](./docs/DEPLOY_NOTES.md) - **NEW** Deployment notes for Azure Static Web App with dbt
- [DEPLOYMENT_LOG.md](./DEPLOYMENT_LOG.md) - **NEW** Deployment log for the latest deployment
- [QA_GUIDELINES_POWERBI_PARITY.md](./docs/QA_GUIDELINES_POWERBI_PARITY.md) - QA guidelines for Power BI parity
- [POWER_BI_STYLE_GUIDE.md](./POWER_BI_STYLE_GUIDE.md) - Style guide for Power BI aesthetic
- [README_SQL_INTEGRATION.md](./README_SQL_INTEGRATION.md) - SQL integration details
- [README_SQL_QUERIES.md](./README_SQL_QUERIES.md) - Available SQL queries reference and dbt models
- [README_DATA_SOURCES.md](./README_DATA_SOURCES.md) - Guide to working with real and simulated data sources
- [README_DESKTOP.md](./README_DESKTOP.md) - Desktop-ready deployment instructions
- [dbt_project/README.md](./dbt_project/README.md) - **NEW** dbt model documentation

## Important Notes

- The main directory index.html now provides a navigation panel to all three dashboards
- Clean URL structure implemented: `/advisor`, `/edge`, and `/ops`
- Directory-based organization with `index.html` files enables clean URLs without file extensions
- All dashboards have cross-navigation properly set up with the new URL structure
- Pulser branding appears only in Scout Ops dashboard (formerly System Architecture & QA)
- Client dashboard (Scout Edge) uses Retail Advisor branding
- Power BI-styled version is now accessible at `/advisor`

## Bookmark Tags

- Original version: `dashboard_scope_locked_v3`
- Power BI styled version: `powerbi-style-v2.0`

This structure has been approved and is the final locked dashboard structure. All future deploys must validate against this schema.

## Data Integration

### Medallion Data Architecture

The dashboard integrates with the Medallion data architecture, which follows a layered approach:

1. **Bronze Layer** - Raw data with minimal processing
2. **Silver Layer** - Cleaned and validated data
3. **Gold Layer** - Enriched business-ready data
4. **Platinum Layer** - AI-generated insights and analysis

### dbt Integration

The dashboard now integrates with dbt (data build tool) to transform data from Databricks into static JSON files:

1. **dbt Models** - Transform raw data into analytics-ready datasets
2. **JSON Export** - Convert dbt model outputs to static JSON files
3. **Azure Blob Storage** - Store and serve JSON files to the dashboard
4. **Static Web App** - Load data using the MedallionDataConnector

To run and deploy the dbt models:

```bash
# Initialize with sample data
cd dbt_project
./init_with_sample_data.sh

# OR run with live data and deploy
./scripts/deploy_dbt_exports.sh --resource-group=scout-edge-rg --storage-account=scoutedgestorage
```

See [dbt_project/README.md](./dbt_project/README.md) for complete details.

### Data Source Toggle

The dashboard includes a data source toggle feature that allows users to switch between:

- **Static JSON** - Uses pre-generated static JSON files for fast loading
- **dbt Models** - Uses data exported from dbt models
- **API** - Connects to live API endpoints from the Medallion architecture
- **Simulated Data** - Uses generated data for development and demonstration

This toggle is useful for:
- Offline development without API dependencies
- Demonstrations with consistent, predictable data
- Testing without affecting production metrics
- Comparing different data sources for quality assurance

See [README_DATA_SOURCES.md](./README_DATA_SOURCES.md) for complete details.

## Pulser Integration

### Standard Deployment Commands

The dashboard deployment tasks are registered with the Pulser system:

```bash
# Deploy Scout dashboard
:deploy scout

# Package dashboard for deployment
:package scout

# Validate deployment (dry run)
:validate scout

# Full workflow: package, validate, deploy, monitor
:deploy full
```

### NEW: Clean URL Deployment with Pulser CLI

The dashboard now supports clean URL structure deployment through Pulser CLI:

```bash
# Full deployment with clean URL structure
:dash-deploy all

# Step-by-step deployment
:dash-deploy build    # Build deployment files
:dash-deploy zip      # Create deployment package
:dash-deploy azure    # Deploy to Azure

# Show help for all options
:dash-deploy help
```

This integration:
- Creates both nested and flat file structures
- Configures proper Azure Static Web App routing
- Implements redirects from legacy URLs
- Prevents 404 errors with the clean URL structure
- Provides automatic validation and documentation updates

See [pulser_tasks.yaml](./pulser_tasks.yaml) for complete Pulser integration details and [SOP_DEPLOYMENT.md](./docs/SOP_DEPLOYMENT.md) for detailed deployment instructions.

## Deployment Permissions

### Client Context

- **TBWA is our direct client**
- TBWA serves multiple retail brands and clients
- All InsightPulseAI deployments are:
  - **White-labeled for TBWA**
  - **Further anonymized** for any downstream TBWA clients

### Access Control Policy

- **`Retail Advisor` dashboard**:
  - CLIENT-FACING - can be exposed to TBWA clients
  - Contains no internal system information
  - Fully white-labeled with no InsightPulseAI branding

- **`System Architecture & QA` and `Scout Advanced Analytics` dashboards**:
  - INTERNAL USE ONLY - never share with TBWA clients or their downstream stakeholders
  - Contains system details that should remain private
  - Some internal system branding is present (Pulser)

### Deployment Verification

Before deploying, always verify:
1. No InsightPulseAI branding appears in client-facing `Retail Advisor` dashboard
2. Internal system dashboards have proper access controls
3. Navigation between dashboards follows defined access boundaries
4. Power BI styling matches the [POWER_BI_STYLE_GUIDE.md](./POWER_BI_STYLE_GUIDE.md) specifications