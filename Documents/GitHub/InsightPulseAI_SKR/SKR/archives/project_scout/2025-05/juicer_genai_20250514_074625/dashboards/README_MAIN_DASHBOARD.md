# Main Dashboard Hub

This document provides information about the main dashboard hub, which serves as the centralized entry point to all dashboards in the InsightPulseAI platform.

## Overview

The main dashboard hub connects all individual dashboards into a unified interface, making it easy for users to navigate between different aspects of the system. It includes:

- AI Insights Dashboard
- System Operations
- Brand to SKU Drilldown
- Retail Performance
- QA Dashboard
- Juicy Chat (Text-to-SQL Assistant)

## Features

### Dashboard Cards

Each dashboard is represented by a card with:
- Colored header based on dashboard type
- Icon representing functionality
- Brief description
- Data source badge
- Launch button that opens in a new tab

### Data Source Transparency

The hub includes a section explaining data source types:
- Real Data: Metrics from production systems
- Mock Data: Simulated data for development
- Mixed Data: Combination of real and simulated data

### Floating Juicy Chat Button

A floating action button in the bottom right provides quick access to the Juicy Chat text-to-SQL assistant from anywhere in the hub.

### Developer Tools

A collapsible developer section provides:
- Toggle between real and mock data sources
- Debug tools including a console and cache clearing
- Visual indication of development mode

### System Status Indicators

The footer includes:
- Pulser version badge (v2.1.2)
- System status indicator
- Link to detailed system status page

### Responsive Design

The hub is fully responsive with:
- 3-column layout on desktop
- 2-column layout on tablets
- Single column on mobile devices
- Proper spacing and alignment adjustments

### Accessibility Features

- Proper color contrast
- Semantic HTML structure
- All links open in new tabs to preserve navigation
- Visual feedback on interactive elements

## Dark Mode

The hub includes a dark mode toggle in the header that:
- Persists user preference in localStorage
- Adjusts all UI components for better nighttime viewing
- Changes icon between moon/sun based on current state

## URLs and Access

The main dashboard hub is available at:
- Local development: http://localhost:9090/dashboards/
- Azure deployed URL: https://pscoutdash0513.z13.web.core.windows.net/

## Deployment

The hub is automatically deployed to Azure Blob Storage when changes are pushed to the main branch using:
```bash
./deploy_retail_dashboard.sh
```

## Technical Details

- Built with Bootstrap 5.2.3 and FontAwesome 6.2.1
- Uses CSS variables for consistent theming
- Implements localStorage for persisting user preferences
- All dashboard links are relative to support various deployment environments

## Future Enhancements

Planned improvements include:
- User authentication integration
- Dashboard favoriting and customization
- Usage analytics tracking
- Advanced filtering options across all dashboards