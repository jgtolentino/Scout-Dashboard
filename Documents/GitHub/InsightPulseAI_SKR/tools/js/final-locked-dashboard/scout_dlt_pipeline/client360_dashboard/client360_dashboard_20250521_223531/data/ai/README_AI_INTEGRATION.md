# Client360 Dashboard AI Integration

This document provides detailed information about the AI integration components for the Client360 Dashboard, enabling AI-powered insights generation using Azure OpenAI.

## Table of Contents

- [Overview](#overview)
- [Configuration Files](#configuration-files)
- [Database Schema](#database-schema)
- [Prompt Templates](#prompt-templates)
- [Scripts](#scripts)
- [Integration with Dashboard](#integration-with-dashboard)
- [Deployment and Testing](#deployment-and-testing)
- [Synthetic vs. Real Data](#synthetic-vs-real-data)

## Overview

The Client360 Dashboard AI integration allows for the generation of AI-powered insights about store performance, brand analysis, and market trends using Azure OpenAI. The system supports both synthetic data generation for development and testing, as well as real data analysis for production use.

Key features:
- Azure OpenAI integration for insight generation
- Configurable model routing based on insight type
- Support for synthetic data generation for development and testing
- Database storage and management of insights
- Dashboard integration for displaying insights
- Export capabilities for offline analysis

## Configuration Files

### `model_routing.yaml`

This is the central configuration file that defines how different AI models are routed and used for various insight types. It includes:

- Global configuration settings
- Azure OpenAI API configuration
- Model definitions and parameters
- Routing rules for different insight types
- Prompt template configurations
- Monitoring and telemetry settings
- Security and compliance configurations

### `.env.example`

Template for environment variables needed for the AI integration. Copy this to `.env.local` and populate with actual values for:

- Azure OpenAI API credentials
- Azure service connections
- Databricks integration settings
- Feature flags
- Security settings

### `pulser_ai_insights.yaml`

Configuration for the Pulser CLI automation of AI insights generation, including:

- Task definitions for synthetic and production insights generation
- Database integration configuration
- Synthetic data generation settings
- Monitoring configurations
- Pipeline definitions

## Database Schema

The `ai_insights_table.sql` script creates the database schema for storing AI insights, including:

- `AIInsights` table for storing generated insights
- Views for dashboard consumption
- Stored procedures for insights management
- Indexes for performance optimization
- Functions for insight processing

## Prompt Templates

The following prompt templates are provided for different insight types:

- `sales_insights_prompt.txt` - For store sales performance analysis
- `brand_analysis_prompt.txt` - For brand interaction analysis
- `store_recommendations_prompt.txt` - For store-specific recommendations
- `market_trends_prompt.txt` - For regional market trend analysis
- `vision_analysis_prompt.txt` - For analyzing store layout images

Each template includes variables that will be replaced with actual data during insight generation.

## Scripts

### `fabricate_ai_insights.py`

The main script for generating AI insights using Azure OpenAI. It supports:

- Both synthetic and production modes
- Multiple output formats (JSON, Parquet, SQL)
- Generation of different insight types
- Integration with Azure Key Vault for secrets

Usage:
```bash
python fabricate_ai_insights.py --mode [synthetic|production] --output [sql|parquet|json]
```

### `verify_azure_openai.py`

Script to verify Azure OpenAI API configuration and test connectivity.

Usage:
```bash
python scripts/verify_azure_openai.py [--config model_routing.yaml] [--verify-only]
```

### `load_insights_to_db.sh`

Bash script to load generated insights into the database.

Usage:
```bash
bash scripts/load_insights_to_db.sh
```

### `update_dashboard_views.py`

Updates database views for dashboard consumption and creates static JSON exports.

Usage:
```bash
python scripts/update_dashboard_views.py [--static-only]
```

### `export_insights.py`

Exports insights from the database to various formats for offline analysis.

Usage:
```bash
python scripts/export_insights.py --format [parquet|json|csv|excel|all] [--days 90] [--by-type]
```

## Integration with Dashboard

The AI insights are integrated with the dashboard through:

1. Database views that structure the insights for consumption
2. Static JSON exports for direct integration
3. Dashboard components that render the insights in the UI

The AI insights components should be integrated into the following dashboard sections:

- **Store Performance** section: Display sales insights
- **Brand Analysis** section: Display brand insights
- **Recommendations** panel: Display store recommendations
- **Market Trends** section: Display market trend insights

## Deployment and Testing

### Prerequisites

- Azure OpenAI API access
- Databricks SQL warehouse
- Python 3.8+
- Required Python packages (see `requirements.txt`)

### Testing Synthetic Data

1. Set up the environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

2. Verify Azure OpenAI configuration:
   ```bash
   python scripts/verify_azure_openai.py
   ```

3. Generate synthetic insights:
   ```bash
   python fabricate_ai_insights.py --mode synthetic --output json
   ```

4. Review the generated insights in the `output` directory.

### Production Deployment

1. Apply the database schema:
   ```bash
   # Connect to your Databricks SQL warehouse
   databricks sql query --file ai_insights_table.sql
   ```

2. Set up regular insights generation using Pulser automation:
   ```bash
   pulser run client360-ai-insights daily_insights
   ```

3. Configure dashboard to use the AI insights views.

## Synthetic vs. Real Data

All synthetic data is clearly marked to differentiate it from real data:

- All synthetic insight IDs are prefixed with `SIM-`
- The `IsSynthetic` flag is set to `1` for synthetic insights
- The dashboard UI displays the data source (Synthetic/Real) for all insights

To toggle between synthetic and real data in development:

1. Use the `ENABLE_SYNTHETIC_DATA` environment variable
2. Use the dashboard's data source toggle (if implemented)

When transitioning to production:
1. Ensure `SYNTHETIC_DATA_ENABLED` is set to `false` in production environment
2. Update the dashboard's data source configuration
3. Verify that only real data is being displayed

---

For any questions or issues, please contact the TBWA Insights Team.