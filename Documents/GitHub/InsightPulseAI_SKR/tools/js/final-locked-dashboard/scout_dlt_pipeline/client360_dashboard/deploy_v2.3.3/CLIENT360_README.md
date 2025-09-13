# Client360 Dashboard v2.3.3

This README provides an overview of the Client360 Dashboard v2.3.3, featuring enhanced AI insights with Azure OpenAI integration and improved map visualization.

## 🌟 Key Features

### AI-Powered Insights

- **Live/Simulated Data Toggle**: Switch between simulated data and real-time Azure OpenAI-generated insights
- **Multi-category Insights**: Sales performance, brand analysis, and strategic recommendations
- **Interactive Cards**: Expandable insights with detailed analysis and action plans
- **Failover Support**: Automatic fallback to simulated data when API is unavailable

### Enhanced Map Visualization

- **GeoJSON Integration**: Improved geographical data rendering
- **Interactive Regions**: Click regions to view detailed metrics
- **Heatmap & Clustering**: Toggle between different visualization modes
- **Responsive Performance**: Optimized for large datasets

### Dashboard Improvements

- **Version Tracking**: Clear version indicators throughout the interface
- **Error Handling**: Graceful degradation and user feedback
- **Performance Optimizations**: Faster loading and rendering
- **Enhanced UI Components**: Improved styling and interactivity

## 🚀 Getting Started

### Basic Navigation

1. Toggle between data sources using the switch in the header
2. Explore AI insights in the dedicated panel
3. Interact with the map to view regional data
4. Use filters to customize the dashboard view

### AI Insights Usage

1. The data source toggle controls whether insights are simulated or generated in real-time
2. **Simulated Mode**: Uses pre-generated JSON files for reliable, consistent insights
3. **Live Mode**: Connects to Azure OpenAI to generate real-time, data-driven insights
4. Insights are grouped by category and can be expanded for more details

### Map Interaction

1. Click on regions to view detailed metrics
2. Use controls to toggle between visualization modes
3. Zoom and pan to explore specific areas
4. Filter map data using the dashboard's filter controls

## 🔧 Technical Details

### Version Specifics

- **Version**: 2.3.3
- **Release Date**: May 22, 2025
- **Framework**: Vanilla JavaScript with modular components
- **Back-end Integration**: Azure OpenAI, Azure Static Web Apps

### Modules

1. **Dashboard Core**: Base dashboard functionality and layout
2. **AI Insights**: Azure OpenAI integration and insights rendering
3. **Map Component**: GeoJSON rendering and interactive elements
4. **Data Module**: Data fetching, processing, and caching

### Key File Structure

```
deploy_v2.3.3/
├── index.html              # Main dashboard entry point
├── js/
│   ├── dashboard.js        # Core dashboard functionality
│   ├── components/
│   │   ├── ai/
│   │   │   ├── ai_insights.js             # AI Insights panel component
│   │   │   ├── ai_insights_provider.js    # Data source switching logic
│   │   │   ├── azure_openai_client.js     # Azure OpenAI API integration
│   │   │   └── parquet_reader.js          # Fallback data source support
│   │   └── store_map.js    # Enhanced map component
├── data/
│   ├── simulated/          # Simulated data for offline mode
│   └── live/               # Configuration for live data mode
└── css/                    # Styling and themes
```

## 📚 Related Documentation

For more detailed information, refer to:

- [AI Insights Deployment Guide](../AI_INSIGHTS_DEPLOYMENT_GUIDE.md)
- [Diff-Aware Deployment Guide](../DIFF_AWARE_DEPLOYMENT_GUIDE.md)
- [Azure OpenAI Integration Guide](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)

## 🧩 Integration Points

Client360 Dashboard can integrate with:

- **Azure OpenAI**: For AI-powered insights generation
- **Azure Maps**: For advanced geographical visualization (optional)
- **SQL Data Sources**: For live data connections
- **PowerBI**: For additional analytics capabilities

## 🔒 Security Features

- **API Key Protection**: Azure OpenAI API keys stored in Key Vault
- **Data Sanitization**: All user inputs and API responses are sanitized
- **Error Handling**: Secure error handling that doesn't expose sensitive information
- **Fail-Safe Operation**: Graceful degradation when services are unavailable

## 🔍 Troubleshooting

Common issues and solutions:

1. **AI Insights Not Loading**:
   - Check Azure OpenAI connectivity
   - Verify API key is valid
   - Switch to simulated mode temporarily

2. **Map Visualization Issues**:
   - Ensure GeoJSON files are properly formatted
   - Check browser console for specific errors
   - Verify map token is valid

3. **Performance Issues**:
   - Use Chrome Developer Tools to identify bottlenecks
   - Check network requests for slow responses
   - Optimize data transfer by using filters

## 📝 Changelog Highlights

Key changes in v2.3.3:

- Added Azure OpenAI API integration for live insights
- Implemented data source toggle between simulated and live modes
- Enhanced map component with better GeoJSON support
- Added fallback data sources for offline operation
- Improved error handling and user feedback
- Updated UI styling for better visual harmony
- Implemented comprehensive version tracking

For a complete list of changes, see the [full changelog](../RELEASE_2.3.3.md).

## 📞 Support

For technical support or questions about the Client360 Dashboard, contact:

- **Technical Support**: support@tbwa-tech.com
- **Documentation**: docs.tbwa-tech.com/client360
- **GitHub Issues**: github.com/tbwa/client360-dashboard/issues