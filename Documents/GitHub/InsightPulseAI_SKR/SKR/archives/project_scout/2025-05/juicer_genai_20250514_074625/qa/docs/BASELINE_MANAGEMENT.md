# Baseline Management Guide

This document provides detailed guidance on managing baseline images for visual regression testing in the Scout Dashboard QA Framework.

## Table of Contents
- [Introduction](#introduction)
- [Baseline Types](#baseline-types)
- [Creating Baselines](#creating-baselines)
- [Updating Baselines](#updating-baselines)
- [Storing and Versioning Baselines](#storing-and-versioning-baselines)
- [Comparison Strategy](#comparison-strategy)
- [Handling Layout Changes](#handling-layout-changes)
- [Common Problems](#common-problems)

## Introduction

Visual regression testing requires baseline images that represent the "correct" state of the UI. These baselines serve as the reference point for comparisons to detect visual changes.

The Scout Dashboard QA Framework uses pixel-perfect comparison to ensure consistent visual parity with Power BI standards.

## Baseline Types

The framework supports several types of baseline images:

### Component Baselines
Individual UI components (charts, slicers, tables) captured in isolation:
- `visual-bar.png`
- `visual-donut.png`
- `visual-kpi.png`

### Dashboard Section Baselines
Larger sections of the dashboard:
- `retail-performance-header.png`
- `retail-performance-performance-metrics.png`
- `retail-performance-regional-map.png`

### Responsive Baselines
Device-specific captures:
- `drilldown-dashboard-desktop.png`
- `drilldown-dashboard-mobile.png`
- `drilldown-dashboard-tablet.png`

### Source Formats
Baselines exist in two formats:
- SVG: Vector format used for version control
- PNG: Bitmap format used for pixel comparison

## Creating Baselines

### Initial Baseline Generation

To generate initial baselines:

1. Ensure the dashboard server is running
2. Configure dashboard URLs in `config.js`
3. Run the baseline generator:

```bash
npm run capture-baselines
```

This executes `utils/capture-baselines.js`, which:
1. Launches each dashboard in Puppeteer
2. Captures screenshots of predefined components
3. Saves PNG images to the `baselines/` directory

### Baseline Configuration

Component selectors and capture settings are defined in `config.js`:

```javascript
module.exports = {
  dashboards: {
    retail: 'http://localhost:8080/dashboards/retail-performance',
    drilldown: 'http://localhost:8080/dashboards/drilldown-dashboard'
  },
  components: {
    retail: [
      { name: 'header', selector: '.dashboard-header' },
      { name: 'performance-metrics', selector: '.metrics-container' },
      { name: 'regional-map', selector: '.map-visual' },
      { name: 'trend-chart', selector: '.trend-chart-container' }
    ],
    drilldown: [
      { name: 'header', selector: '.dashboard-header' },
      { name: 'breadcrumb', selector: '.breadcrumb-navigation' },
      { name: 'kpi-cards', selector: '.kpi-cards-container' },
      { name: 'brand-table', selector: '.brand-table-container' },
      { name: 'timeline-chart', selector: '.timeline-chart' }
    ]
  },
  // Additional settings...
};
```

## Updating Baselines

Baselines need updating when intentional UI changes occur.

### When to Update

- After design changes with stakeholder approval
- When implementing new Power BI standards
- After dashboard component refactoring
- When adding new dashboard components

### Update Process

1. Make UI changes to the dashboard
2. Verify the changes work correctly 
3. Update specific baselines:

```bash
# Update a specific baseline
npm run update-baseline -- --dashboard=retail --component=header

# Update all baselines for a dashboard
npm run update-baseline -- --dashboard=retail

# Update all baselines
npm run update-baseline -- --all
```

### Baseline Review

Always verify updated baselines:

1. Compare old and new baselines visually
2. Ensure changes align with requirements
3. Verify Power BI styling standards are maintained
4. Have another team member review significant changes

## Storing and Versioning Baselines

### Directory Structure

Baselines are stored in the repository using a version-based structure:

```
baselines/
├── README.md            # Documentation
├── placeholders/        # SVG vector versions
│   ├── retail-performance-header.svg
│   ├── retail-performance-performance-metrics.svg
│   └── ...
├── retail-performance-header.png       # Current baselines
├── retail-performance-performance-metrics.png
├── ...
└── 2024Q2/              # Version archives
    └── images/
        ├── dashboard-drilldown.png
        ├── dashboard-retail.png
        └── ...
```

### Version Control

- SVG versions are preferred for version control due to better diff handling
- Use the SVG to PNG conversion tool for test-ready formats:

```bash
node utils/convert_svg_to_png.js
```

### Git Considerations

Configure Git to handle baseline images properly:

```
# .gitattributes
*.png filter=lfs diff=lfs merge=lfs -text
*.svg diff=xml
```

## Comparison Strategy

### Pixel Comparison Algorithm

The framework uses the pixelmatch library with these parameters:

```javascript
// visual-parity.test.js
const diffPixels = pixelmatch(
  img1.data,
  img2.data,
  diff.data,
  img1.width,
  img1.height,
  {
    threshold: config.pixelMatchThreshold || 0.1,
    alpha: 0.5,
    diffColor: [255, 0, 0],    // Red highlight for differences
    diffMask: false
  }
);
```

### Thresholds and Tolerance

Adjust comparison thresholds in `config.js`:

```javascript
module.exports = {
  // Other settings...
  pixelMatchThreshold: 0.1,     // 0-1 range, higher is more tolerant
  maxDiffPixelsPercent: 0.05,   // Max % of pixels that can differ
  // Additional settings...
};
```

### Difference Reporting

When tests fail, diff images are generated in `reports/pixel/`:
- Red areas highlight differences
- Difference percentage is reported in test output
- Artifacts are saved for later review

## Handling Layout Changes

### Component-Based Testing

The framework uses component-based testing to minimize false positives from layout changes:

```javascript
// Capture each component independently
for (const component of config.components[dashboard]) {
  const element = await page.$(component.selector);
  const screenshot = await element.screenshot();
  fs.writeFileSync(`baselines/${dashboard}-${component.name}.png`, screenshot);
}
```

### Responsive Testing Strategies

For responsive layout:

1. Specify viewport sizes in `config.js`:

```javascript
module.exports = {
  // Other settings...
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  // Additional settings...
};
```

2. Create viewport-specific baselines:

```bash
npm run capture-baselines -- --viewport=desktop
npm run capture-baselines -- --viewport=tablet
npm run capture-baselines -- --viewport=mobile
```

## Common Problems

### Missing Fonts

Different fonts between capture and test environments can cause false failures:

1. Ensure fonts are installed in all environments
2. Pre-load fonts before capture:

```javascript
// utils/capture-baselines.js
await page.evaluate(() => {
  return new Promise(resolve => {
    document.fonts.ready.then(resolve);
  });
});
```

### Animation Issues

Animations can cause inconsistent captures:

1. Disable animations before baseline capture:

```javascript
// utils/capture-baselines.js
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
});
```

2. Add delays to ensure rendering is complete:

```javascript
await page.waitForTimeout(500); // Wait for rendering to stabilize
```

### Browser Rendering Differences

Different browser versions may render differently:

1. Use the same Puppeteer version in all environments
2. Lock Chromium version in package.json
3. Consider increasing threshold for CI environments:

```javascript
const threshold = process.env.CI ? 0.15 : 0.1;
```

### Dynamic Content

Handle dynamic content with:

1. Mocking API responses
2. Setting fixed dates for test runs
3. Using a consistent test user/dataset

Example for timestamp mocking:

```javascript
// Before capture, fix timestamps
await page.evaluate(() => {
  const now = new Date('2024-05-01T12:00:00Z');
  
  // Override Date constructor
  const OriginalDate = Date;
  window.Date = class extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) {
        return new OriginalDate(now);
      }
      return new OriginalDate(...args);
    }
  };
  
  // Preserve original methods
  window.Date.now = () => now.getTime();
});
```