# GenAI Insights Tools for Juicer Stack

This directory contains tools for generating, visualizing, and managing GenAI-powered insights from Juicer's Medallion data architecture.

## Overview

The GenAI Insights system transforms transcript data from the Gold layer into actionable business intelligence using advanced language models (Claude, OpenAI, DeepSeek) with custom prompting. These tools help manage the entire lifecycle of insights generation and visualization.

## Available Tools

### 1. `run_insights_generator.sh`

A user-friendly bash script for generating insights with interactive mode support.

**Features:**
- Interactive mode with guided prompts
- Configuration for insight type, date range, and model selection
- Command-line options for automation/scripting

**Usage:**
```bash
# Interactive mode
./run_insights_generator.sh -i

# Command-line mode with options
./run_insights_generator.sh --days 30 --model claude --visualize
./run_insights_generator.sh --type brand --brand "Jollibee" --confidence 0.8
```

### 2. `insights_generator.js`

The core Node.js script for generating insights by interfacing with Databricks notebooks.

**Features:**
- Multi-model support (Claude/OpenAI/DeepSeek)
- Fallback mechanisms for high availability
- JSON output with confidence scoring
- Visualization dashboard generation

**Usage:**
```bash
# Basic usage
node insights_generator.js --days 7 --model claude

# Advanced options
node insights_generator.js --days 30 --model auto --type brand --visualize
```

### 3. `insights_dashboard_helper.js`

Utility for customizing and deploying insights dashboards.

**Features:**
- Multiple theme support (default, dark, light, tbwa)
- Preview server with hot-reload
- Production deployment automation
- Custom data source integration

**Usage:**
```bash
# Generate and preview dashboard
node insights_dashboard_helper.js --theme dark --preview

# Deploy to production
node insights_dashboard_helper.js --theme tbwa --deploy
```

### 4. `pulser_insights_cli.js`

Command-line interface for the Pulser CLI integration, providing a familiar experience for Pulser users.

**Features:**
- Multiple subcommands (generate, show, visualize, dashboard, summarize)
- Consistent command structure with the Pulser CLI
- Integration with Claudia, Maya, and other Pulser agents
- Executive summary generation

**Usage:**
```bash
# Generate insights
./pulser_insights_cli.js generate --days 30 --model claude

# Display insights
./pulser_insights_cli.js show --type brand --brand "Jollibee" --limit 5

# Visualize insights
./pulser_insights_cli.js visualize --type heatmap --group brand --show

# Open dashboard
./pulser_insights_cli.js dashboard --refresh

# Generate summary
./pulser_insights_cli.js summarize --days 7 --format markdown --output summary.md
```

### 5. `insights_monitor.js` and `run_insights_monitor.sh`

Real-time monitoring dashboard for GenAI insights integration with system health metrics.

**Features:**
- Interactive web dashboard showing insights statistics and system health
- Multi-model distribution visualization
- Insight type and status tracking
- Historical data charts for trend analysis
- Real-time monitoring with automatic refresh
- REST API for metrics integration with other tools

**Usage:**
```bash
# Start the monitoring dashboard with default settings
./run_insights_monitor.sh

# Custom configuration
./run_insights_monitor.sh --port=3500 --log-level=debug --history=14

# Run with API only (no browser dashboard)
./run_insights_monitor.sh --no-dashboard

# Run without automatic refresh
./run_insights_monitor.sh --no-watch
```

## Pulser Agent Integration

The tools integrate with the Pulser agent system through `insights_hook.yaml` and `juicer_hook.yaml` configurations:

| Agent   | Role in Insights Generation                                |
|---------|-----------------------------------------------------------|
| Claudia | Orchestrates commands, handles fallback logic              |
| Maya    | Documentation visualization, dashboard rendering           |
| Kalaw   | Knowledge & context fetching, SKR integration              |
| Echo    | Content analysis, sentiment validation                     |
| Sunnies | Chart generation, visualization rendering                  |

## Workflow Examples

### 1. Basic Insights Generation

```bash
# Generate insights for the last 7 days using Claude
./run_insights_generator.sh --days 7 --model claude

# View generated insights
./pulser_insights_cli.js show --days 7
```

### 2. Brand-Specific Analysis

```bash
# Generate brand-specific insights
./pulser_insights_cli.js generate --type brand --brand "Jollibee" --days 30

# Generate executive summary for the brand
./pulser_insights_cli.js summarize --brand "Jollibee" --format markdown --output jollibee_summary.md
```

### 3. Dashboard Visualization

```bash
# Generate insights with visualization
./run_insights_generator.sh --days 30 --model claude --visualize

# Customize and deploy dashboard
node insights_dashboard_helper.js --theme tbwa --deploy
```

### 4. Regular Insights Schedule

For scheduled insights generation, add to crontab:

```
# Daily insights generation at 6:00 AM
0 6 * * * cd /path/to/tools && ./run_insights_generator.sh --days 1 --model claude

# Weekly executive summary on Mondays at 7:00 AM
0 7 * * 1 cd /path/to/tools && ./pulser_insights_cli.js summarize --days 7 --format html --output weekly_summary.html
```

### 5. Real-time Monitoring

```bash
# Start the insights monitoring dashboard
./run_insights_monitor.sh

# Monitor insights from specific model in debug mode
./run_insights_monitor.sh --log-level=debug

# Integrate with other monitoring systems via API
curl -s http://localhost:3400/api/metrics | jq '.insights.total'

# Launch in production mode (headless)
./run_insights_monitor.sh --no-dashboard --port=3500 > monitoring.log 2>&1 &
```

## Configuration

The tools are designed to work with minimal configuration, but can be customized through:

1. Environment variables (e.g., `JUICER_MODEL_PREFERENCE`, `JUICER_OUTPUT_DIR`)
2. Command-line parameters for specific runs
3. Configuration files for persistent settings

## Requirements

- Node.js 14+ (for core functionality)
- Bash shell environment (for shell scripts)
- Optional: Databricks CLI (for direct Databricks integration)
- Optional: ImageMagick/ffmpeg (for better image processing)

## Troubleshooting

If you encounter issues:

1. **Connection errors**: Check Databricks access and authentication
2. **Visualization problems**: Ensure proper permissions for output directories
3. **Performance issues**: Consider adjusting batch size or model selection
4. **Quality concerns**: Fine-tune prompts or increase confidence threshold

For detailed technical documentation, refer to the [Juicer Documentation Portal](DOCS_LINK) or contact the InsightPulseAI team.