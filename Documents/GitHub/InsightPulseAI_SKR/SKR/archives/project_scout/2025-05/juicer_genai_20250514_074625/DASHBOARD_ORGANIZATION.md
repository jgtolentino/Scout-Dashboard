# Retail Advisor Dashboard Organization

## Overview

The Retail Advisor system consists of several separate dashboards, each serving a specific purpose. This document outlines their organization and relationships.

## Dashboard Structure

### 1. Central Hub (index.html)
- Acts as the main navigation portal
- Links to all specialized dashboards
- Contains developer controls and system status information
- Manages dark mode and development mode settings

### 2. AI Insights Dashboard (insights_dashboard.html)
- Displays AI-generated business insights
- Shows brand sentiment tracking across time periods
- Provides trending tags visualization
- Features confidence-scored insight cards with actionable recommendations
- Includes filtering by brand, insight type, time range, and confidence threshold

### 3. System Operations (juicer_dash_shell.html)
- Monitors system health metrics
- Tracks device status
- Displays data pipeline statistics
- Shows machine learning model performance

### 4. Brand to SKU Drilldown (drilldown-dashboard.html)
- Provides hierarchical data analysis
- Allows drilling down from brands to categories to SKUs
- Shows detailed customer insights at each level

### 5. Retail Performance (retail_performance_dashboard.html)
- Tracks store performance metrics
- Displays customer traffic data
- Shows sales statistics across locations
- Provides comparative analysis between stores

### 6. QA Dashboard (qa.html)
- Shows quality assurance metrics
- Displays data quality scores
- Tracks validation metrics
- Shows system test results
- Only visible in development mode

### 7. Juicy Chat Tool (juicy-chat-snippet.html)
- Provides text-to-SQL assistant
- Allows natural language queries against the database
- Offers conversational interface for data exploration

## Dashboard Integration

While these dashboards are separate, they share:
- Common visual styling
- Standard header and footer components
- White-labeled branding as "Retail Advisor"
- Consistent color schemes
- Shared authentication system

## Deployment Strategy

These dashboards are currently deployed in two locations:
1. **Azure Environment**: For production use
2. **Vercel Deployment**: https://scoutadvisor.vercel.app/ (mockup)

## Color Scheme Standardization

A consistent color scheme should be applied across all dashboards to maintain visual coherence:
- Primary color: #342b64 (deep purple)
- Secondary color: #5352ed (bright blue)
- Info color: #00a3e0 (light blue)
- Success color: #2ed573 (green)
- Warning color: #ffa502 (amber)
- Danger color: #ff6b81 (coral)

## Next Steps

1. Apply consistent color scheme to all dashboards
2. Ensure proper white-labeling across all UI components
3. Update dashboard URLs to reflect the new naming conventions
4. Synchronize user preferences across all dashboards
5. Create standardized dashboard templates for future additions