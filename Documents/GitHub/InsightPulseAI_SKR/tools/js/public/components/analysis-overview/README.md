# Analysis Overview Component

A responsive, clickable module for the Project Scout dashboard that displays analysis categories with icons and bulleted features.

## Features

- Responsive 2×2 grid (1-column on mobile, 2-columns on tablets and larger screens)
- Brand-colored pastel backgrounds for each panel
- SVG icons for visual consistency
- Smooth hover effects to indicate clickability
- Accessible links with proper focus states
- Customizable title, bullets, and URLs

## Integration

### Quick Start

1. Add the CSS file to your HTML `<head>`:
   ```html
   <link rel="stylesheet" href="components/analysis-overview/analysis-overview.css">
   ```

2. Add a container div where you want the component to appear:
   ```html
   <div id="analysis-overview-container"></div>
   ```

3. Include the JavaScript file before your closing `</body>` tag:
   ```html
   <script src="components/analysis-overview/AnalysisOverview.js"></script>
   ```

4. Initialize the component:
   ```html
   <script>
     document.addEventListener('DOMContentLoaded', function() {
       new AnalysisOverview('#analysis-overview-container', {
         title: 'Project Scout: Analysis Overview',
         baseUrl: '/dashboards'
       });
     });
   </script>
   ```

### Configuration Options

The component accepts the following options:

```javascript
{
  // Main title for the overview section
  title: 'Project Scout: Analysis Overview',
  
  // Base URL for all panel links (each panel href will be appended to this)
  baseUrl: '/dashboards',
  
  // Array of panel configurations
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
    // Additional panels...
  ]
}
```

## Design Tokens

The component uses the following TBWA design tokens:

| Token               | Value     | Where we use it               |
|---------------------|-----------|-------------------------------|
| `--tbwa-blue-50`    | `#EEF4FF` | Customer Profile card bg      |
| `--tbwa-purple-50`  | `#F5EEFF` | Store Performance card bg     |
| `--tbwa-green-50`   | `#F1FFF6` | Product Intelligence card bg  |
| `--tbwa-orange-50`  | `#FFF8F3` | Advanced Analytics card bg    |

## Demo

A demo page is included at `analysis-overview-demo.html` that demonstrates the component in action with interactive controls.

## Integration with Project Scout Dashboard

To integrate this component into the Project Scout dashboard:

1. Add the CSS and JS references to the dashboard HTML
2. Place the container div in an appropriate location in the dashboard layout
3. Initialize the component with configuration matching your data structure
4. Update panel links to point to the correct dashboard URLs

## Customization

You can customize all aspects of the component:

- Panel titles, icons, and colors
- Bullet points for each panel
- Target URLs for each panel
- Overall section title
- Base URL for all panel links

## Browser Support

The component is compatible with all modern browsers:
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers on iOS and Android