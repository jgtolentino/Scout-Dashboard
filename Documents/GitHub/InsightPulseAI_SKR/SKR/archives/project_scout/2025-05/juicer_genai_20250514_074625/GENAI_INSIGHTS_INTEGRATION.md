# GenAI Insights Integration for Juicer

This document outlines the implementation of automated insights generation using GenAI for the Juicer system. The integration enables transforming Medallion data model's Gold layer into actionable business insights.

## Overview

The insights generation system leverages GenAI models (Claude/OpenAI/DeepSeek) to process transcripts and extract valuable business intelligence. Insights are stored in the Platinum layer and visualized in interactive dashboards.

## Pulser Agent Integration

| Agent   | Role in Insights Generation                                         |
|---------|---------------------------------------------------------------------|
| Claudia | Orchestrates CLI commands, routes queries, handles fallback logic    |
| Maya    | Documentation visualization, dashboard rendering, YAML configuration |
| Kalaw   | Knowledge & context fetching, SKR integration, metadata indexing     |
| Echo    | Content analysis, sentiment validation, transcript parsing           |
| Sunnies | Chart generation, visualization rendering, dashboard integration     |

## Implementation Components

### 1. LLM Integration (juicer_gold_insights.py)

The core Python notebook for insights generation processes Gold layer data through LLMs with:

- Multi-provider support (Claude, OpenAI, DeepSeek)
- Provider fallback mechanisms for high availability
- Batched processing for efficient resource utilization
- Specialized insight type generation (general, brand, sentiment, trend)
- Confidence scoring and metadata tagging

### 2. Agent Configuration (insights_hook.yaml)

YAML configuration for Pulser agent integration enables command routing, natural language processing, and scheduled execution:

```yaml
triggers:
  commands:
    - pattern: "^:juicer\\s+insights\\s+(.+)$"
      action: "generate_insights"
  
  natural_language:
    - pattern: "(extract|generate|create)\\s+(insights|summaries|analysis).+(transcript|call|conversation)"
      action: "generate_insights"
```

### 3. SQL Schema (juicer_setup_insights_tables.sql)

The Platinum layer schema for insights storage includes:

- `genai_insights` table for storing LLM-generated insights
- `insight_actions` table for tracking recommended business actions
- Views for insights by brand, type, and trending tags
- Sample data generation for testing

### 4. Dashboard Visualization

The insights dashboard provides an interactive UI for exploring and actioning insights:

- Brand sentiment tracking across time periods
- Trending tags visualization
- Confidence-scored insight cards
- Actionable recommendations with priority ratings
- Filtering by brand, insight type, time range, and confidence threshold

## Usage

### CLI Commands

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

### Scheduled Execution

The system is configured with scheduled jobs:

- Daily insights generation (6:00 AM)
- Weekly insights summary (Mondays at 7:00 AM)

## Integration with Existing Components

- **Bronze Layer Integration**: Connects to `SalesInteractionTranscripts` and `TranscriptionChunks`
- **Silver Layer Integration**: Leverages brand mentions and sentiment data
- **Gold Layer Integration**: Processes reconstructed transcripts with brand contextualization
- **Platinum Layer Creation**: New layer for storing and querying generated insights

## Next Steps

1. Complete Caca integration for hallucination checking
2. Implement RL feedback loops for insight quality improvement
3. Connect insights to SKR via Kalaw for knowledge sharing
4. Enhance dashboard with health metrics and model performance

## Technical Details

- **Data Flow**: Gold transcripts → LLM processing → JSON insights → Platinum storage → Dashboard visualization
- **Model Config**: Default provider Claude, with auto-fallback mechanism
- **Performance**: Batched processing with configurable chunk size
- **Deployment**: Integrated with GitHub Actions workflow for CI/CD

---

*This integration was developed as part of Project Scout's Juicer enhancement initiative.*