# Juicer - Databricks Integration for InsightPulseAI

Juicer is an AI-BI analytics integration layer that connects InsightPulseAI's Pulser 2.0 CLI with Databricks, enabling seamless data processing, analysis, and visualization of brand mentions in transcribed conversations.

## Internal InsightPulseAI Agent Roles

- **Claudia** – CLI task routing and orchestration for `:juicer` commands
- **Maya** – Documentation and SOP tracking via `juicer_hook.yaml`
- **Kalaw** – Knowledge extraction from enriched SQL + entity metadata
- **Echo** – Signal extraction, transcription sentiment enrichment
- **Sunnies** – Visual rendering of charts and sketch dashboard blocks

## Components

### Notebooks

The `notebooks/` directory contains Databricks notebooks that implement the core data processing pipelines:

- `juicer_ingest_bronze.sql`: Ingests raw transcription data from Azure SQL into Databricks Delta Bronze layer
- `juicer_enrich_silver.py`: Processes Bronze data to extract brand mentions and sentiment, storing results in Silver layer
- `juicer_gold_bi_dashboard.dash`: Creates Gold layer dashboard-ready aggregations for BI visualization

### Dashboards

The `dashboards/` directory contains Databricks dashboard definitions:

- `agent_brand_heatmap.dbviz`: Visualizes brand mentions across agents with sentiment and frequency analysis

### CLI

The `cli/` directory contains command-line tools for interacting with Juicer and Databricks:

- `juicer_cli.py`: Python CLI for executing Juicer commands, querying Databricks, and visualizing results

### Pulser Integration

The `pulser/` directory contains configuration files for integrating with Pulser CLI:

- `juicer_hook.yaml`: YAML configuration for Claudia/Maya routing and command handling

## Repository Integration

To properly commit the Juicer + Databricks integration into the Project Scout repository:

1. **Verify the directory structure:**
   ```
   /tools/js/
   └── juicer-stack/
       ├── notebooks/
       │   ├── juicer_ingest_bronze.sql
       │   ├── juicer_enrich_silver.py
       ├── dashboards/
       │   ├── juicer_dash_shell.html
       │   └── agent_brand_heatmap.dbviz
       ├── cli/
       │   └── juicer_cli.py
       ├── pulser/
       │   └── juicer_hook.yaml
       ├── README.md
       ├── DEBUGGING.md
       └── install.sh
   ```

2. **Use the commit script:**
   ```bash
   ./juicer-stack/commit_juicer.sh
   ```
   This script will:
   - Verify required files and directories
   - Create a feature branch if needed
   - Stage all necessary files
   - Create a commit with proper agent references
   - Set up GitHub Actions workflow

3. **Add Pulser configuration:**
   ```bash
   cat tools/js/juicer-stack/pulser_config/.pulserrc_entry >> ~/.pulserrc
   ```

4. **Push to the repository:**
   ```bash
   git push origin pulser-juicer-integration
   ```

This integration links Juicer to the InsightPulseAI agent system, providing agent-bound routing via Claudia, Kalaw, Echo, Maya, and Sunnies.

## Setup Instructions

### 1. Provision Databricks Workspace

1. Create a Databricks workspace in Azure (recommended for InsightPulseAI integration)
2. Configure workspace with Unity Catalog (if using multiple data layers)
3. Create a compute cluster for running notebooks
4. Generate an access token for API access

### 2. Connect to Azure SQL Source

Use the `juicer_ingest_bronze.sql` notebook to create a connection to your Azure SQL database containing transcription data.

### 3. Deploy Notebooks

Upload the notebooks from the `notebooks/` directory to your Databricks workspace:

```bash
# Using Databricks CLI
databricks workspace import juicer_ingest_bronze.sql /juicer/juicer_ingest_bronze -l SQL -o
databricks workspace import juicer_enrich_silver.py /juicer/juicer_enrich_silver -l PYTHON -o
```

### 4. Set Up Scheduled Jobs

Create scheduled jobs to run the notebooks periodically:

```bash
# Example using Databricks CLI
databricks jobs create --json-file jobs/juicer_bronze_ingest_job.json
databricks jobs create --json-file jobs/juicer_silver_enrich_job.json
```

### 5. Configure Pulser CLI Integration

1. Copy the CLI script to a directory in your PATH:

```bash
cp cli/juicer_cli.py /usr/local/bin/juicer
chmod +x /usr/local/bin/juicer
```

2. Add the Juicer hook to your Pulser configuration:

```bash
cp pulser/juicer_hook.yaml ~/.pulser/hooks/
```

## Usage Examples

### Query Brand Mentions

```bash
# Using Juicer CLI directly
juicer query --nl "Show brand mentions for Jollibee last 7 days"

# Using Pulser CLI
:juicer query "Show brand mentions for Jollibee last 7 days"
```

### Run Data Processing Notebook

```bash
# Using Juicer CLI directly
juicer notebook /juicer/juicer_enrich_silver --params date=2023-05-10 env=prod

# Using Pulser CLI
:juicer notebook juicer_enrich_silver --params date=2023-05-10 env=prod
```

### View Dashboard

```bash
# Using Juicer CLI directly
juicer dashboard --id agent_brand_heatmap

# Using Pulser CLI
:juicer dashboard agent_brand_heatmap
```

## Architecture

Juicer follows the Medallion architecture pattern with three data layers:

1. **Bronze Layer**: Raw ingested data from source systems (transcriptions)
2. **Silver Layer**: Cleaned and enriched data (brand mentions with sentiment)
3. **Gold Layer**: Aggregated, analysis-ready data (dashboards and reports)

### Data Flow

```
Azure SQL → Bronze Layer → Silver Layer → Gold Layer → BI Dashboards
                                       ↓
                      Brand Detection & Sentiment Analysis
```

## Security and Authentication

Juicer securely stores connection credentials and access tokens in the local configuration file `~/.pulser/juicer_config.json`. For production environments, it's recommended to use Azure Key Vault or a similar secure storage service.

## Extending Juicer

You can extend Juicer by:

1. Adding new notebooks for additional data processing steps
2. Creating custom dashboards for specific analytics needs
3. Extending the CLI with new commands or natural language capabilities
4. Adding new ML models for brand detection or sentiment analysis

## License

Copyright © 2023 InsightPulseAI. All rights reserved.