# GenAI Insights Integration Guide for Juicer

## Overview

The GenAI Insights Integration enhances Juicer with advanced AI-powered analytics capabilities, transforming transcript data into actionable business intelligence. This guide will help you understand how the integration works and how to utilize it effectively.

## Architecture

The integration follows the Medallion architecture pattern with a new Platinum layer:

```
Bronze → Silver → Gold → Platinum
```

- **Bronze Layer**: Raw transcript data
- **Silver Layer**: Enriched with entity detection and sentiment analysis
- **Gold Layer**: Fully reconstructed and contextualized transcripts
- **Platinum Layer**: AI-generated insights, recommendations, and analytics

## Core Components

### 1. Databricks Notebooks

| Notebook | Purpose |
|----------|---------|
| `juicer_gold_insights.py` | Processes Gold layer data through LLMs with multi-provider support (Claude/OpenAI/DeepSeek) to generate structured insights |
| `juicer_setup_insights_tables.sql` | Creates Platinum layer schema for storing insights and actions |

### 2. Agent Integration

| Agent | Role |
|-------|------|
| Claudia | Orchestrates CLI commands, routes queries, handles fallback logic |
| Maya | Documentation visualization, dashboard rendering, YAML configuration |
| Kalaw | Knowledge & context fetching, SKR integration, metadata indexing |
| Echo | Content analysis, sentiment validation, transcript parsing |
| Sunnies | Chart generation, visualization rendering, dashboard integration |

### 3. Pulser Hook Configuration

The system is configured via YAML files:
- `insights_hook.yaml`: Configures agent routing, triggers, and action handlers
- `juicer_hook.yaml`: Provides general Juicer integration including insights-related commands

### 4. Dashboard Visualization

- `insights_dashboard.html`: Interactive UI for insight exploration
- `insights_visualizer.js`: JavaScript library for rendering charts and visualizations

## Insight Types

The system generates four categories of insights:

1. **General Insights**: Broad patterns across all transcripts
2. **Brand Insights**: Specific to brand mentions and competitive positioning
3. **Sentiment Insights**: Emotional patterns and customer reactions
4. **Trend Insights**: Emerging patterns and changes over time

## CLI Commands

Access insights through the following Pulser CLI commands:

```bash
# Generate insights from transcripts
:juicer insights generate --days 7 --model claude

# Display generated insights 
:juicer insights show --type brand --brand Jollibee --limit 5

# Create visualizations from insights
:juicer insights visualize --type heatmap --group brand

# Generate and show insights summary
:juicer summarize --days 30
```

## LLM Integration

The system supports multiple LLM providers with fallback mechanisms:

| Provider | Default Model | Token Limit | Fallback |
|----------|---------------|-------------|----------|
| Claude | claude-3-sonnet-20240229 | 100,000 | OpenAI |
| OpenAI | gpt-4-turbo | 32,000 | DeepSeek |
| DeepSeek | deepseek-chat | 16,000 | None |

## Data Flow

1. Gold layer transcript data is loaded from Databricks
2. Data is processed in batches and sent to LLMs with specialized prompts
3. LLM responses are parsed into structured insights
4. Insights are stored in the Platinum layer
5. Dashboards visualize insights with interactive filtering

## Scheduled Execution

The system is configured with automated jobs:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Daily Insights | 6:00 AM | Generate insights from previous day's transcripts |
| Weekly Summary | Mondays 7:00 AM | Create comprehensive weekly insights digest |

## Dashboard Features

The interactive dashboard provides:

- Brand sentiment tracking across time periods
- Trending tags visualization
- Confidence-scored insight cards
- Actionable recommendations with priority ratings
- Filtering by brand, insight type, time range, and confidence threshold

## Implementation Steps

1. **Setup Platinum Layer**:
   ```bash
   :juicer notebook juicer_setup_insights_tables --params env=dev create_sample_data=true
   ```

2. **Generate Initial Insights**:
   ```bash
   :juicer insights generate --days 30 --model claude
   ```

3. **Access Dashboard**:
   ```bash
   :juicer dashboard insights_dashboard
   ```

## Next Steps

1. Complete Caca integration for hallucination checking
2. Implement RL feedback loops for insight quality improvement
3. Connect insights to SKR via Kalaw for knowledge sharing
4. Enhance dashboard with health metrics and model performance

## Troubleshooting

Common issues and their solutions:

1. **LLM API errors**: Check API keys in environment configuration
2. **JSON parsing failures**: Insights extraction has fallback mechanisms
3. **Empty results**: Verify date ranges contain transcript data
4. **Dashboard loading issues**: Check browser console for JavaScript errors

## References

- [Medallion Architecture Guide](/docs/medallion_architecture.md)
- [Juicer API Documentation](/docs/juicer_api.md)
- [LLM Integration Best Practices](/docs/llm_integration.md)
- [Dashboard Customization Guide](/docs/dashboard_customization.md)