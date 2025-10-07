# Retail Advisor - Intelligent Analytics

This repository contains the Retail Advisor component of Project Scout, powered by the OpsCore agent framework.

## Overview

Retail Advisor provides AI-powered analytics for customer interactions, enabling:

- Brand mention detection and sentiment analysis
- Automated insight generation from customer transcripts
- Interactive visualizations and dashboards
- Action recommendation system

## Components

### Dashboards

The `dashboards/` directory contains visualization components:

- `retail_advisor_insights_dashboard.html`: Interactive dashboard for insights
- `retail_advisor_insights_visualizer.js`: JavaScript visualization library

### Notebooks

The `notebooks/` directory contains data processing pipelines:

- `retail_advisor_gold_insights.py`: Generates insights from transcript data
- `retail_advisor_setup_insights_tables.sql`: Creates database structure

### Configuration

The `config/` directory contains:

- `opscore-config.yaml`: System configuration
- `retail-advisor-hook.yaml`: Command routing configuration

## Getting Started

1. Install the OpsCore CLI:
   ```bash
   ./install_opscore.sh
   ```

2. Configure Retail Advisor integration:
   ```bash
   opscore config --set retail_advisor=true
   ```

3. Run your first insight generation:
   ```bash
   :retail-advisor insights generate --days 7
   ```

## License

This project is licensed under the terms specified in LICENSE.txt.
