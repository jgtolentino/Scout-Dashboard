# Unified GenAI Integration for Scout Advanced Analytics

## Overview

This document provides implementation details for the Unified GenAI integration in the Scout Advanced Analytics dashboard. The integration enables AI-powered insights to be displayed within the dashboard, enhancing SQL analytics with natural language interpretations.

Version: 2.2.1
Last Updated: May 16, 2025

> **Update 2.2.1 (May 16, 2025)**:
> - Fixed several critical stability issues
> - Improved rendering performance and memory usage
> - Enhanced DOM security with proper node creation
> - Added fallback thresholds for minimum insights display
> - Implemented reliable button and filter selection
> - Added proper event listener management
> - Added dynamic insight type detection from data

## Features

- **Unified Insights Display**: Consistent styling and presentation of GenAI insights across all dashboards
- **Dynamic Insights Loading**: Automatically loads insights from API or falls back to sample data
- **Filtering Capabilities**: Filter insights by type (General, Brand, Sentiment, Trend, Operations)
- **Confidence Scoring**: Visual indicators for insight confidence levels
- **Dark Mode Support**: Automatic theming based on user preference
- **Responsive Design**: Optimized for all screen sizes from mobile to large displays
- **SQL Data Integration**: Enhances SQL-based reports with contextual AI insights
- **Model-Agnostic**: Abstracts away specific AI model details for a unified user experience

## Implementation

### Files Structure

```
deployment-v2/
├── public/
│   ├── css/
│   │   ├── unified-genai.css       # Styling for GenAI components
│   │   └── ...
│   ├── js/
│   │   ├── insights_visualizer.js  # Core insights visualization
│   │   ├── unified_genai_insights.js # GenAI integration logic
│   │   └── ...
│   ├── assets/
│   │   └── data/
│   │       └── insights_data.json  # Sample insights data
│   ├── insights_dashboard.html     # Main dashboard page
│   └── ...
```

### Integration Components

1. **Insights Data Format**

```json
{
  "metadata": {
    "generated_at": "2025-05-14T07:58:42Z",
    "time_period": "2025-04-15 to 2025-05-14",
    "model": "retail-advisor-gpt-20240229",
    "insights_count": 124
  },
  "insights": [
    {
      "id": "ins001",
      "type": "general",
      "title": "Increasing focus on value meals across all demographics",
      "text": "Analysis of 327 transcripts reveals that 64% of customers mention value when discussing meal options...",
      "confidence": 0.85,
      "brands": ["Brand A", "Brand B", "Brand C"],
      "tags": ["pricing", "value", "economy", "family"],
      "date": "2025-05-02"
    },
    // Additional insights...
  ]
}
```

2. **JS Component Initialization**

```javascript
// Initialize the Unified GenAI component
document.addEventListener('DOMContentLoaded', function() {
  UnifiedGenAI.init();
});
```

3. **HTML Integration**

```html
<!-- GenAI Insights Section -->
<section class="mb-5">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="analytics-title">
      AI-Powered Retail Insights
      <span class="genai-badge">Unified GenAI</span>
    </h2>
    <div class="dropdown">
      <button class="header-btn dropdown-toggle" type="button" id="insightFilterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fas fa-filter me-1"></i> Filter
      </button>
      <ul class="dropdown-menu" aria-labelledby="insightFilterDropdown">
        <li><a class="dropdown-item" href="#">All Insights</a></li>
        <li><a class="dropdown-item" href="#">General</a></li>
        <li><a class="dropdown-item" href="#">Brand</a></li>
        <li><a class="dropdown-item" href="#">Sentiment</a></li>
        <li><a class="dropdown-item" href="#">Trend</a></li>
      </ul>
    </div>
  </div>
  
  <div class="insights-grid">
    <!-- Insights will be dynamically inserted here -->
  </div>
</section>
```

## Usage

### Loading Insights

The system automatically loads insights from the configured API endpoint. If the API is unavailable, it falls back to sample data.

```javascript
// To manually load insights data
UnifiedGenAI.loadInsights();
```

### Generating Contextual Insights

For SQL-based reports, the system can generate contextual insights based on the data:

```javascript
// Listen for SQL data rendering events
document.addEventListener('sql-data-rendered', function(event) {
  // event.detail.reportType - Type of report (sales, inventory, etc.)
  // event.detail.data - The SQL query result data
});
```

## Styling Guide

The `unified-genai.css` file provides consistent styling for all GenAI components. Key style elements include:

- **Insight Type Badges**: Colored indicators for insight categories
  - General: Purple (#8a4fff)
  - Brand: Blue (#00a3e0)
  - Sentiment: Orange (#ff7e47)
  - Trend: Green (#00c389)
  - Operations: Gray (#6b7280)

- **Confidence Indicators**:
  - High (≥85%): Green (#28a745)
  - Medium (70-84%): Yellow (#ffc107)
  - Low (<70%): Red (#dc3545)

## Deployment

1. **Local Deployment**

```bash
./deploy_unified_genai_dashboard.sh
```

This will create a deployment package and start a local HTTP server for testing.

2. **Azure Deployment**

For production deployment to Azure Static Web Apps:

```bash
az staticwebapp create --name scout-analytics --resource-group retail-analytics --source ./output/scout_unified_genai_dashboard --location "West US 2"
```

## Troubleshooting

1. **Insights Not Loading**

- Check browser console for JavaScript errors
- Verify API endpoint is accessible
- Ensure insights_data.json is properly formatted

2. **Styling Issues**

- Verify CSS files are included in the correct order
- Check for conflicting CSS rules from other components
- Test in both light and dark modes

3. **Performance Concerns**

- Large insights datasets may impact performance
- Consider pagination for datasets with more than 20 insights
- Lazy-load charts and visualizations

## Future Enhancements

- **Webhook Integration**: Allow real-time insights updates via webhooks
- **Personalized Insights**: Tailor insights based on user role and permissions
- **Export Capability**: Allow exporting insights to PDF or Excel
- **Advanced Filtering**: Enable multi-criteria filtering and sorting
- **Insight Rating System**: Allow users to rate the usefulness of insights

## Support

For support or feature requests, contact the Scout Analytics team at scout-analytics@example.com or file an issue in the project repository.