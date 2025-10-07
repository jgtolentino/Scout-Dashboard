# GenAI Insights Integration Summary

This document summarizes how the GenAI insights functionality is integrated across the Retail Advisor (formerly InsightPulseAI) dashboard system.

## Architecture Overview

The GenAI insights system integrates with multiple dashboards within the Retail Advisor platform. Each dashboard serves a specific purpose, with insights data flowing through a well-defined pipeline.

### Data Flow

1. **Data Collection**: Customer interactions and transcripts are collected in the Bronze layer
2. **Data Processing**: Information is refined through the Silver layer with brand mentions
3. **Data Contextualization**: The Gold layer provides reconstructed transcripts with context
4. **Insights Generation**: LLM processing converts Gold data into actionable insights
5. **Platinum Storage**: Structured insights stored in the Platinum layer
6. **Dashboard Visualization**: Web interfaces display insights through interactive charts

## Key Components

### Backend Components

1. **Insight Generation Engine** (`juicer_gold_insights.py`)
   - Processes Gold layer transcript data through multiple LLMs
   - Supports Claude, OpenAI, and DeepSeek with fallback mechanisms
   - Extracts different insight types (general, brand, sentiment, trend)
   - Scores confidence and adds metadata tags

2. **Database Schema** (`juicer_setup_insights_tables.sql`)
   - Creates Platinum layer tables for `genai_insights` and `insight_actions`
   - Defines views for insights by brand, type, and trending tags
   - Implements SQL templates for common insights queries

3. **Agent Configuration** (`insights_hook.yaml`)
   - Configures Pulser agent integration (now Retail Advisor)
   - Defines triggers for commands and natural language processing
   - Maps agent capabilities to insight generation tasks
   - Specifies scheduled job configurations

### Frontend Components

1. **Dashboard Hub** (`index.html`)
   - Central navigation portal to access all specialized dashboards
   - Supports dark mode and developer mode settings
   - Implements consistent styling and branding

2. **Insights Dashboard** (`insights_dashboard.html`)
   - Primary visualization for GenAI-generated insights
   - Features brand sentiment tracking and trending tags
   - Displays confidence-scored insight cards with actionable recommendations
   - Provides filtering by brand, insight type, time range, and confidence

3. **Visualization Engine** (`insights_visualizer.js`)
   - Handles API calls to fetch insights data
   - Processes and prepares data for visualization
   - Renders charts and interactive elements
   - Implements dark mode and responsive design

## Integration Points

1. **API Endpoint**: `/api/insights` serves as the bridge between backend and frontend

2. **Scheduled Jobs**:
   - `juicer_insights_daily`: Daily insights generation (6:00 AM)
   - `juicer_insights_weekly`: Weekly insights summary (Mondays at 7:00 AM)

3. **Agent Integration**:
   - **Claudia**: Orchestrates CLI commands and routes queries
   - **Maya**: Handles documentation and dashboard rendering
   - **Kalaw**: Manages knowledge integration and context fetching
   - **Echo**: Processes content analysis and sentiment validation
   - **Quality** (formerly Sunnies): Creates chart generation and dashboard integration

## White-Labeling Implementation

The following brand transitions have been implemented:
- "InsightPulseAI" → "Retail Advisor"
- "Pulser" → "Analytics"
- "Sunnies" → "Quality"

These changes have been applied consistently across:
- User interface elements
- Documentation
- Code comments
- Configuration files
- API endpoints

## Dashboard Cross-Communication

While each dashboard operates independently, they share:
1. Common branding elements
2. User authentication
3. Theme preferences (dark/light mode)
4. Developer mode settings

## Deployment Model

The dashboards are currently deployed in two environments:
1. **Azure Environment**: Primary production platform
2. **Vercel Deployment**: https://scoutadvisor.vercel.app/ (mockup version)

## Monitoring and Health Checks

The system includes:
1. **Model Performance Monitoring**: Tracks LLM reliability and metrics
2. **Data Quality Scoring**: Measures transcript and insight quality
3. **Device Status Tracking**: Monitors connected data collection devices
4. **Azure WAF Metrics**: Tracks the 5 pillars (Cost, Operations, Performance, Reliability, Security)

## Conclusion

The GenAI insights integration provides a sophisticated system for transforming customer interaction data into actionable business intelligence. The architecture leverages multiple LLM providers with fallback mechanisms for high availability and presents insights through interactive, responsive dashboards with consistent branding as Retail Advisor.