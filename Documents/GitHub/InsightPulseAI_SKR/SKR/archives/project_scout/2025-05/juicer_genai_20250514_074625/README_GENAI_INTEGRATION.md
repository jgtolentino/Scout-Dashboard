# GenAI Insights Integration for Project Scout

This document provides an overview of the GenAI Insights integration implemented for Project Scout, which enhances the system with AI-powered insights generation from transcript data.

## Overview

The GenAI Insights system transforms transcript data from the Gold layer into actionable business intelligence using advanced language models (Claude, OpenAI, DeepSeek) with custom prompting. This adds a new Platinum layer to the Medallion architecture, specifically for AI-generated insights.

## Components Implemented

1. **LLM Integration for Insights Generation**
   - Multi-model support (Claude/OpenAI/DeepSeek)
   - Fallback mechanisms for high availability
   - Custom prompting for different insight types
   - Confidence scoring and metadata tagging

2. **Platinum Layer Data Schema**
   - Tables for insights and recommended actions
   - Views for common query patterns (by brand, type, trending)
   - Delta Lake integration for ACID transactions

3. **Dashboard and Visualization**
   - Interactive dashboard for insights exploration
   - Filtering by brand, insight type, confidence
   - Charts for brand analysis and sentiment trends
   - Tag cloud for trending topics

4. **CLI Tools for Management**
   - Generation of insights on demand
   - Visualization of insights with various charts
   - Executive summary creation
   - Dashboard management

5. **Agent Integration**
   - Pulser agent integration via YAML configuration
   - Natural language query interpretation
   - Command routing to appropriate handlers
   - Scheduled execution of insights generation

## Architecture Diagram

The updated architecture diagram shows the integration of GenAI insights components:

![Project Scout with GenAI Integration](docs/diagrams/project_scout_with_genai.png)

## Getting Started

To use the GenAI insights system:

1. **Generate Insights**
   ```bash
   ./tools/run_insights_generator.sh --days 30 --model claude
   ```

2. **View Insights**
   ```bash
   ./tools/pulser_insights_cli.js show --type brand --brand "Jollibee" --limit 5
   ```

3. **Visualize Insights**
   ```bash
   ./tools/pulser_insights_cli.js visualize --type heatmap --group brand --show
   ```

4. **Generate Summary**
   ```bash
   ./tools/pulser_insights_cli.js summarize --days 7 --format markdown --output summary.md
   ```

## Documentation

For detailed information, refer to:

- [GenAI Insights Tools](tools/README_GENAI_TOOLS.md) - Comprehensive documentation of tools
- [Diagram Updates](GENAI_DIAGRAM_UPDATES.md) - Explanation of architecture updates
- [Integration Plan](GENAI_INSIGHTS_INTEGRATION.md) - Original integration plan
