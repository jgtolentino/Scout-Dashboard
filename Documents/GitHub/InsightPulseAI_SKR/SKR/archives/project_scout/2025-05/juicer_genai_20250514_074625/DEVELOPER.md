# Juicer GenAI Insights Developer Guide

This guide provides detailed information for developers working on the Juicer Stack GenAI Insights system. It covers architecture, key components, integration points, and development workflows.

## Table of Contents

- [1. System Architecture](#1-system-architecture)
- [2. GenAI Insights Engine](#2-genai-insights-engine)
- [3. System Prompts Integration](#3-system-prompts-integration)
- [4. Visual QA Pipeline](#4-visual-qa-pipeline)
- [5. Development Environment](#5-development-environment)
- [6. Testing](#6-testing)
- [7. Deployment](#7-deployment)
- [8. Common Tasks](#8-common-tasks)
- [9. Troubleshooting](#9-troubleshooting)

## 1. System Architecture

### Medallion Architecture

Juicer follows the Medallion architecture pattern with the following layers:

1. **Bronze Layer**: Raw ingested data from source systems (transcriptions)
2. **Silver Layer**: Cleaned and enriched data (brand mentions with sentiment)
3. **Gold Layer**: Aggregated, analysis-ready data
4. **Platinum Layer**: GenAI-generated insights with confidence scoring

### Agent Integration

The system integrates with the following Pulser agents:

- **Claudia**: CLI task routing and LLM orchestration
- **Maya**: Documentation and visualization templates
- **Kalaw**: Knowledge integration and SKR archiving
- **Echo**: Content analysis and sentiment validation
- **Sunnies**: Chart generation and visualization
- **Caca**: QA validation and hallucination detection

### Key Components

- **Databricks Notebooks**: Core data processing logic
- **SQL Schema**: Database structure for insights storage
- **LLM Clients**: Multi-provider LLM integration
- **Dashboard UI**: Visual presentation of insights
- **Pulser CLI Integration**: Command routing and agent integration
- **QA Tools**: Validation and visual testing

## 2. GenAI Insights Engine

### Core Files

- `/notebooks/juicer_gold_insights.py`: LLM processing of Gold layer data
- `/notebooks/juicer_setup_insights_tables.sql`: Platinum layer schema
- `/insights_validator.js`: Validation system using Caca

### LLM Integration

The system supports multiple LLM providers:

- **Claude** (Anthropic): Primary provider with best quality
- **GPT-4** (OpenAI): Secondary provider with strong categorization
- **DeepSeek**: Tertiary provider for fallback

Provider configuration is in `juicer_gold_insights.py`:

```python
LLM_PROVIDERS = {
    "claude": {
        "name": "Claude",
        "model": "claude-3-sonnet-20240229",
        "token_limit": 100000,
        "fallback": "openai"
    },
    "openai": {
        "name": "OpenAI",
        "model": "gpt-4-turbo",
        "token_limit": 32000,
        "fallback": "deepseek"
    },
    "deepseek": {
        "name": "DeepSeek",
        "model": "deepseek-chat",
        "token_limit": 16000,
        "fallback": None
    }
}
```

### Prompt Templates

The system uses specialized prompt templates for different insight types:

- **General**: Overall business insights and recommendations
- **Brand**: Competitive positioning and brand perception
- **Sentiment**: Emotional patterns and reactions
- **Trend**: Emerging patterns and opportunities

Templates are defined in `generate_insight_prompt()` function in `juicer_gold_insights.py`.

### Confidence Scoring

Insights include confidence scores:

- **High (0.8-1.0)**: Strong confidence in the insight
- **Medium (0.5-0.8)**: Moderate confidence
- **Low (0-0.5)**: Low confidence, requires verification

Confidence is computed from model signals and validation metrics.

## 3. System Prompts Integration

### Integration with Prompt Quality Framework

The insights system leverages the Pulser 2.2.0 prompt quality framework:

- **Prompt Scoring**: Evaluate prompt effectiveness with `prompt-score.js`
- **Prompt Templates**: Create and manage templates with variable substitution
- **Quality Metrics**: Track hallucination, coherence, and instruction following
- **Feedback Loop**: Improve prompts based on insight quality

### Prompt Composition

To create a new insight type:

1. Define a new prompt template in `generate_insight_prompt()`
2. Add the type to `insight_types` array in processing logic
3. Update SQL schema if new fields are required
4. Test with the prompt scoring system

Example of creating a new template:

```python
elif insight_type == "competitive":
    prompt = base_prompt + """
    Focus specifically on competitive analysis in the data. Generate 3-5 key competitive insights:

    1. Identify strengths and weaknesses relative to competitors
    2. Highlight competitive advantages mentioned by customers
    3. Note competitor features that are praised or criticized
    4. Suggest ways to improve competitive positioning

    Format your response as JSON with the following structure:
    ```json
    {
      "competitive_insights": [
        {
          "title": "Concise competitive insight title",
          "description": "Detailed explanation with supporting evidence",
          "competitors": ["Competitor1", "Competitor2"],
          "strength_gap": "positive|negative|neutral",
          "actions": ["Suggested action 1", "Suggested action 2"],
          "confidence": "high|medium|low"
        }
      ],
      "summary": "Brief overall summary of competitive position",
      "time_period": "Date range analyzed"
    }
    ```
    """
```

## 4. Visual QA Pipeline

### Dashboard Testing

The `dashboard_qa.js` script integrates Snappy visual QA with dashboards:

- Captures screenshots of dashboard components
- Compares against approved baselines
- Generates visual diff reports
- Tracks visual regressions

### Running Visual Tests

```bash
# Test all dashboard components
node dashboard_qa.js --start-server

# Test specific components
node dashboard_qa.js --component brand-chart,sentiment-chart --breakpoint desktop
```

### Insight Validation

The `insights_validator.js` script validates insights using Caca:

- Checks for hallucinations and factual errors
- Validates statistical claims
- Ensures source alignment
- Scores overall quality

### Running Validation

```bash
# Validate insights from JSON file
node insights_validator.js --input ./platinum_insights.json
```

## 5. Development Environment

### Prerequisites

- Node.js 18+
- Python 3.8+
- Databricks CLI
- Azure CLI

### Environment Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:example/InsightPulseAI_SKR.git
   cd InsightPulseAI_SKR/tools/js/juicer-stack
   ```

2. Install dependencies:
   ```bash
   npm install
   pip install -r cli/requirements.txt
   ```

3. Set up environment variables:
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. Configure Pulser integration:
   ```bash
   # Add to ~/.pulserrc
   cat pulser_config/.pulserrc_entry >> ~/.pulserrc
   ```

5. Upload Databricks notebooks:
   ```bash
   # Using Databricks CLI
   databricks workspace import notebooks/juicer_gold_insights.py /Shared/InsightPulseAI/Juicer/juicer_gold_insights -l PYTHON -o
   databricks workspace import notebooks/juicer_setup_insights_tables.sql /Shared/InsightPulseAI/Juicer/juicer_setup_insights_tables -l SQL -o
   ```

## 6. Testing

### Unit Testing

```bash
# Run all tests
npm test

# Test specific component
npm test -- --testPathPattern=insights_validator
```

### Integration Testing

```bash
# Run integration tests against Databricks
npm run test:integration

# Test LLM integration
npm run test:llm
```

### Visual Testing

```bash
# Run visual tests
node dashboard_qa.js --start-server

# Generate test insights
node test_insights_generator.js
```

## 7. Deployment

### Local Deployment

```bash
# Start dashboard server
npm run start:dashboard

# Run CLI
./cli/juicer_cli.py query "Show brand mentions for last 7 days"
```

### Azure Deployment

Use the GitHub Actions workflow:

1. Configure secrets in GitHub repository:
   - `DATABRICKS_HOST`
   - `DATABRICKS_TOKEN`
   - `CLAUDE_API_KEY`
   - `OPENAI_API_KEY`
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`

2. Push to the appropriate branch to trigger deployment

### Client Deployment

For client-facing versions:

```bash
# Create white-labeled version
./whitelabel_simple.sh

# Push to client repository
./dual_repo_push.sh
```

## 8. Common Tasks

### Adding a New Insight Type

1. Create prompt template in `juicer_gold_insights.py`
2. Add type to `insight_types` array
3. Update SQL schema if needed
4. Update dashboard to display new insight type
5. Add validation rules in `insights_validator.js`

### Optimizing LLM Performance

1. Adjust batch size in `generate_insights_for_batch()`
2. Tune prompt templates for better quality
3. Optimize token usage in prompts
4. Configure provider fallback strategy

### Dashboard Customization

1. Modify HTML/CSS in `dashboards/insights_dashboard.html`
2. Update chart configuration in JavaScript
3. Run visual QA tests to verify changes
4. Update baselines if changes are intentional

## 9. Troubleshooting

### Common Issues

#### LLM API Errors

- Check API keys in environment variables
- Verify model names in `LLM_PROVIDERS` configuration
- Check rate limits and quotas
- Configure proper fallback strategy

#### Databricks Integration

- Verify workspace access and permissions
- Check SQL schema compatibility
- Test notebook execution manually
- Check cluster configuration

#### Visual QA Failures

- Review diff images to identify changes
- Update baselines for intentional changes
- Check browser compatibility
- Verify component selectors

#### Low Insight Quality

- Adjust prompt templates for better specificity
- Tune confidence thresholds
- Improve validation rules
- Check source data quality

### Logging

Enable debug logging for more detailed information:

```bash
# Enable debug logging
export DEBUG=1
node insights_validator.js --input ./platinum_insights.json
```

### Support

For additional assistance:

- Check the `DEBUGGING.md` guide
- Review GitHub issues for similar problems
- Contact the InsightPulseAI team