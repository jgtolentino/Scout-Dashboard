# Dashboard Architecture

This document describes the organization and structure of the dashboard system, explaining the separation between client-facing and internal operational dashboards.

## Dashboard Structure

The dashboards are now organized into two main categories:

1. **Client-Facing Dashboards** (`/dashboards/client/`)
   - Focus on business insights, recommendations, and actionable intelligence
   - Designed for client consumption and decision-making
   - Clean, simple interface with minimal technical details
   - Data source transparency with badges identifying real vs. mock data

2. **System Operations Dashboards** (`/dashboards/ops/`)
   - Focus on system health, device status, and model performance metrics
   - Designed for internal technical teams and operations
   - Detailed technical information and diagnostic tools
   - Data source transparency with badges identifying real vs. mock data

## Core Dashboard Files

### Client-Facing
- `/client-facing/insights_dashboard.html` - AI-generated insights, trends, and recommendations
- `/drilldown-dashboard.html` - Hierarchical data drill-down from brand to SKU level

### Operations
- `/ops/system_dashboard.html` - System health, device monitoring, and model performance

## Data Sources and Transparency

All dashboards now clearly indicate the source of data displayed with visual badges:

- **Real Data** - Data directly from production systems or databases
- **Mock Data** - Simulated data for demonstration or development purposes
- **Mixed Data** - A combination of real and simulated data

This transparency helps users understand the reliability of the displayed information and makes development priorities clear.

## Technical Implementation

### Framework and Dependencies
- Bootstrap 5.2.3 for responsive layouts
- Chart.js for data visualization
- FontAwesome 6.2.1 for icons

### Data Pipeline
1. Data is collected via various APIs and services
2. Processed through the metrics collection system
3. Rendered into charts and visualizations with appropriate data source labeling

## URL Structure

- Client-facing insights dashboard: `/dashboards/client/insights_dashboard.html`
- Operations dashboard: `/dashboards/ops/system_dashboard.html`
- Drilldown dashboard: `/dashboards/drilldown-dashboard.html`
- Legacy dashboard (combined): `/dashboards/insights_dashboard.html`

## Deployment Notes

When adding new dashboard components, maintain the clear separation between client-facing and operational metrics. Add new client-oriented visualizations to the client dashboard, and system monitoring features to the operations dashboard.