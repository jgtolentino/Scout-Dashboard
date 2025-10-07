# Analysis Overview Module - Integration Guide

This document provides instructions for integrating the Analysis Overview module into the Project Scout dashboard.

## Overview

The Analysis Overview module provides high-level metrics about brand mention analysis quality, volume, and business impact, with a detailed breakdown of key performance indicators. This component is designed to enhance the existing dashboard by providing users with meaningful analytics about the analysis process itself.

## Files Created

1. **CSS Styles:**
   - `/styles/analysis-overview.css` - Component-specific styles using TBWA design tokens

2. **JavaScript Component:**
   - `/components/analysis-overview.js` - Self-contained component with all functionality

3. **Demo Page:**
   - `/analysis-overview-demo.html` - Standalone demo page to test the component

## Integration Steps

### 1. Include Required Files

Add these lines to the `<head>` section of the main dashboard HTML file (`juicer_dash_shell.html`):

```html
<!-- Analysis Overview Styles -->
<link rel="stylesheet" href="styles/analysis-overview.css">
```

Add this line before the closing `</body>` tag:

```html
<!-- Analysis Overview Component -->
<script src="components/analysis-overview.js"></script>
```

### 2. Add Container to Dashboard

Insert this code in `juicer_dash_shell.html` after the filter bar section (around line 342) and before the KPI row (around line 345):

```html
<!-- Analysis Overview Section -->
<div id="analysisOverviewContainer"></div>
```

### 3. Initialize the Component

Add this code to the `script` section of the dashboard, inside the DOMContentLoaded event listener (around line 798):

```javascript
// Initialize Analysis Overview component
const analysisOverview = new AnalysisOverview({
  container: '#analysisOverviewContainer',
  apiEndpoint: '/api/analysis',
  refreshInterval: dashboardConfig.refreshInterval || 3600000
});
```

## API Integration

The component expects an API endpoint that returns analysis metrics in the following format:

```json
{
  "overview": {
    "quality": {
      "score": 87,
      "change": 5.2
    },
    "volume": {
      "score": 72,
      "change": 8.7
    },
    "impact": {
      "score": 64,
      "change": -2.3
    }
  },
  "breakdown": [
    {
      "title": "Brand Detection Accuracy",
      "value": "94.3%",
      "description": "Precision of brand mention detection",
      "icon": "fas fa-bullseye"
    },
    // ... other breakdown items
  ]
}
```

For initial integration, the component provides sample data for demonstration purposes. Connect to the real API endpoint when available.

## Design Notes

- The component utilizes TBWA design tokens from `tbwa-theme.css` to maintain consistent styling
- The layout is responsive and will adapt to different screen sizes
- The color scheme uses the TBWA visualization palette defined in the design token CSS

## Recommended Placement

The Analysis Overview component is designed to be placed at the top of the dashboard, after the filter bar and before the main KPI row. This placement provides users with immediate visibility into the overall analysis metrics before diving into specific brand data.

## Testing

A standalone demo page (`analysis-overview-demo.html`) is provided to test the component in isolation. Open this page in a browser to see how the component appears and functions.

## Support

For questions or issues with integration, contact the InsightPulseAI development team.