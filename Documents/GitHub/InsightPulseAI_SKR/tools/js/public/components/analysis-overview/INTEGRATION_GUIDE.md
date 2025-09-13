# Analysis Overview Integration Guide

This guide provides detailed instructions for integrating the Analysis Overview component into the Project Scout dashboard.

## 1. Update Project Scout Dashboard HTML

Locate your `project_scout_dashboard.html` file and add the following code at the appropriate location (typically below the header/filter section and above your main metrics).

```html
<!-- Analysis Overview Component -->
<link rel="stylesheet" href="components/analysis-overview/analysis-overview.css">
<div id="analysis-overview-container"></div>
<script src="components/analysis-overview/AnalysisOverview.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    new AnalysisOverview('#analysis-overview-container', {
      title: 'Project Scout: Analysis Overview',
      baseUrl: 'https://pscoutdash0513.z13.web.core.windows.net/dashboards',
      panels: [
        {
          title: 'Customer Profile',
          icon: 'users',
          bgClass: 'bg-blue-50',
          iconClass: 'text-blue-600',
          bullets: [
            'Purchase patterns by demographics',
            'Brand loyalty metrics',
            'Cultural influence analysis'
          ],
          href: '/customer-profile'
        },
        {
          title: 'Store Performance',
          icon: 'store',
          bgClass: 'bg-purple-50',
          iconClass: 'text-purple-600',
          bullets: [
            'Regional performance',
            'Store size impact',
            'Peak transaction analysis'
          ],
          href: '/store-performance'
        },
        {
          title: 'Product Intelligence',
          icon: 'shopping-cart',
          bgClass: 'bg-green-50',
          iconClass: 'text-green-600',
          bullets: [
            'Bundle effectiveness',
            'Category performance', 
            'SKU-level patterns',
            'BUMO (Brand-Used-Most-Often)'
          ],
          href: '/product-intelligence'
        },
        {
          title: 'Advanced Analytics',
          icon: 'bar-chart-2',
          bgClass: 'bg-orange-50',
          iconClass: 'text-orange-600',
          bullets: [
            'Market basket analysis',
            'Demand forecasting',
            'Promotional impact'
          ],
          href: '/advanced-analytics'
        }
      ]
    });
  });
</script>
```

## 2. Upload Component Files to Azure Storage

Upload the component files to your Azure Storage static website:

```bash
# 1. Navigate to the component directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/public/components/analysis-overview

# 2. Upload CSS file with correct MIME type
az storage blob upload \
  --account-name pscoutdash0513 \
  --container-name '$web' \
  --file "analysis-overview.css" \
  --name "components/analysis-overview/analysis-overview.css" \
  --content-type "text/css"

# 3. Upload JavaScript file with correct MIME type
az storage blob upload \
  --account-name pscoutdash0513 \
  --container-name '$web' \
  --file "AnalysisOverview.js" \
  --name "components/analysis-overview/AnalysisOverview.js" \
  --content-type "application/javascript"

# 4. (Optional) Upload demo file with correct MIME type
az storage blob upload \
  --account-name pscoutdash0513 \
  --container-name '$web' \
  --file "analysis-overview-demo.html" \
  --name "components/analysis-overview/analysis-overview-demo.html" \
  --content-type "text/html"
```

## 3. Verify the Integration

After uploading all the files, verify that the component is working correctly:

1. Open the main dashboard: https://pscoutdash0513.z13.web.core.windows.net/project_scout_dashboard.html
2. Check that the Analysis Overview section appears with all four panels
3. Verify that the hover effects work and the panels are clickable
4. Test the component on different devices to ensure responsive behavior

## 4. Set Up Dashboard Detail Pages

Create the four detail dashboard pages for each analysis category:

1. Create the following HTML files:
   - `dashboards/customer-profile.html`
   - `dashboards/store-performance.html`
   - `dashboards/product-intelligence.html`
   - `dashboards/advanced-analytics.html`

2. Upload them with the correct MIME type:
   ```bash
   az storage blob upload \
     --account-name pscoutdash0513 \
     --container-name '$web' \
     --file "dashboards/customer-profile.html" \
     --name "dashboards/customer-profile.html" \
     --content-type "text/html"
   ```

3. Repeat for each detail dashboard file

## 5. Customize Data Integration (Optional)

If you want to dynamically load the panel data from an API:

```javascript
// Example dynamic data loading
fetch('https://tbwa-analytics-api.azurewebsites.net/api/dashboard-sections')
  .then(response => response.json())
  .then(data => {
    new AnalysisOverview('#analysis-overview-container', {
      title: data.title,
      baseUrl: data.baseUrl,
      panels: data.panels
    });
  })
  .catch(error => {
    console.error('Failed to load dashboard sections:', error);
    // Fall back to static configuration
    new AnalysisOverview('#analysis-overview-container', { 
      // Default configuration here
    });
  });
```

## 6. Troubleshooting

If you encounter any issues:

1. Check browser console for JavaScript errors
2. Verify that file paths are correct
3. Ensure all files have the proper MIME types
4. Confirm that the container element exists in your HTML
5. Test the demo page to verify that the component works in isolation

## 7. Additional Customization Options

You can further customize the component by:

- Adding custom icons (create new icon functions in the JavaScript)
- Changing the color scheme (modify CSS variables)
- Adding animation effects (via CSS transitions)
- Implementing click tracking for analytics
- Adding interactive features (filtering, sorting, etc.)