# Client360 Dashboard v2.3.3

This README provides an overview of the Client360 Dashboard, with particular focus on the new features and improvements introduced in version 2.3.3.

![Client360 Dashboard](./assets/client360_dashboard_header.png)

## Overview

Client360 Dashboard is a comprehensive analytics solution for retail management, providing actionable insights, visualization, and reporting capabilities. The dashboard integrates multiple data sources, AI-powered insights, and geographical analysis to deliver a complete view of retail operations.

Version 2.3.3 introduces significant improvements to the AI Insights Panel, enhanced map visualizations, and improved fallback mechanisms for resilient operation.

## 🚀 Key Features

### New in v2.3.3

- **Azure OpenAI Integration**: Live AI-powered insights using Azure OpenAI API
- **Enhanced Simulation/Live Toggle**: Seamlessly switch between simulated and real data
- **Improved Map Visualization**: Advanced GeoJSON support with interactive regions
- **Multi-Level Fallback**: Parquet support and mock data generation for resilient operation
- **Dynamic Component Loading**: Performance-optimized resource loading
- **Diff-Aware Deployment**: Targeted, component-level deployment for faster updates

### Core Features

- **Store Performance Analytics**: Track KPIs across multiple dimensions
- **Interactive Geospatial Analysis**: Visualize store data on an interactive map
- **AI-Powered Insights**: Actionable recommendations and anomaly detection
- **Multi-Brand Support**: Analyze brand performance across retail locations
- **Trend Visualization**: Track performance changes over time
- **Export & Reporting**: Generate and share custom reports

## 🧠 AI Insights Panel

The AI Insights Panel leverages Azure OpenAI services to generate actionable insights based on your retail data. It analyzes patterns, identifies anomalies, and suggests improvements for retail operations.

### Data Source Toggle

You can switch between two data modes:

- **Simulated Data**: Pre-generated insights for testing and demonstration
- **Live Data**: Real-time insights generated using Azure OpenAI

Toggle between modes using the data source switch in the top right corner of the dashboard.

### Insight Categories

The panel provides three types of insights:

1. **Sales Performance Insights**: Revenue patterns, growth opportunities, and sales anomalies
2. **Brand Analysis**: Brand perception, market position, and competitive intelligence
3. **Strategic Recommendations**: Actionable suggestions for improving retail operations

Each insight card can be expanded to view detailed analysis and specific recommendations.

## 🗺️ Enhanced Map Component

The map component visualizes store data geographically, with support for:

- **Multiple Visualization Modes**: Choropleth, clusters, heatmaps
- **Interactive Regions**: Click on regions to drill down into local performance
- **GeoJSON Integration**: Advanced geographical data rendering
- **Store Markers**: Individual store visualization with performance metrics
- **Customizable Views**: Control what data is displayed and how

## 📊 Dashboard Components

- **KPI Tiles**: Key performance indicators with drill-down capability
- **AI Insights Panel**: Azure OpenAI powered recommendations and analysis
- **Store Map**: Geographical visualization of store performance
- **Filters**: Multi-dimensional data filtering with quick presets
- **Date Range Selector**: Flexible time period selection
- **Export Options**: Multiple export formats for reports and data

## 🔧 Technical Details

### System Architecture

The Client360 Dashboard v2.3.3 is built on:

- Front-end: HTML5, CSS3, JavaScript (vanilla)
- Visualization: Custom charting library with Mapbox GL integration
- AI Integration: Azure OpenAI API
- Deployment: Azure Static Web Apps
- Data Sources: JSON, GeoJSON, Parquet files

### Requirements

- Modern web browser (Chrome, Edge, Firefox, Safari)
- Internet connection for live data mode
- Azure OpenAI API access for live insights generation

### Offline Capability

In environments with limited connectivity, the dashboard can operate in:

1. **Fully Offline Mode**: Using pre-generated simulated data
2. **Cached Mode**: With periodically updated data from parquet files

## 🔄 Usage Guide

### Navigation

- **Top Bar**: Main navigation, data source toggle, user settings
- **Side Panel**: Dashboard section navigation
- **Filter Bar**: Multi-dimensional data filtering
- **Content Area**: Primary visualization and insights display

### Data Source Toggle

1. Locate the toggle switch in the upper right corner
2. Switch to "Live" for real-time Azure OpenAI insights
3. Switch to "Simulated" for pre-generated data

### Filtering Data

1. Use the filter bar to select organization, region, category, etc.
2. Apply date range filters for time-based analysis
3. Save filter presets for frequently used combinations

### Interacting with AI Insights

1. Browse through Sales, Brand, and Recommendation insights
2. Click on insight cards to expand detailed view
3. Use "Refresh" button to generate new insights

### Using the Map

1. Select visualization type (choropleth, clusters, heat map)
2. Toggle between regions, municipalities, and barangays
3. Click on areas to view detailed metrics
4. Add locations to your watchlist for ongoing monitoring

## 📦 Installation

### For Azure Deployment

See [DIFF_AWARE_DEPLOYMENT_GUIDE.md](./DIFF_AWARE_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### For Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Azure OpenAI credentials in `.env.local`
4. Start local server: `npm run start`

## 🔐 Security Considerations

- **API Key Protection**: Azure OpenAI keys are stored in Azure Key Vault
- **Data Privacy**: All AI prompts are sanitized to remove PII
- **Access Control**: Role-based dashboard permissions
- **Secure Communication**: HTTPS enforced for all traffic
- **Audit Logging**: Data access and toggle actions are logged

## 🔍 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| AI Insights panel shows "Loading" indefinitely | Check Azure OpenAI connectivity, toggle to Simulation mode as fallback |
| Map doesn't display | Verify internet connection, check browser console for MapBox errors |
| Filters have no effect | Clear browser cache, check for JavaScript errors in console |
| Exported data is incomplete | Check export parameters, verify data source connectivity |

### Support

For technical support or to report issues:

- Email: support@tbwa-digital.com
- Issue Tracker: https://github.com/tbwa/client360-dashboard/issues
- Documentation: https://tbwa-docs.example.com/client360

## 📚 Additional Resources

- [AI Insights Deployment Guide](./AI_INSIGHTS_DEPLOYMENT_GUIDE.md)
- [Diff-Aware Deployment Guide](./DIFF_AWARE_DEPLOYMENT_GUIDE.md)
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Release Notes](./RELEASE_2.3.3.md)

## 📄 License

© 2025 TBWA\Digital - All rights reserved
Proprietary and confidential