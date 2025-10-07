# Color Scheme Standardization for Retail Advisor Dashboards

This document defines the standard color scheme that should be applied consistently across all three Retail Advisor dashboards to ensure visual coherence and proper white-labeling.

## Primary Color Palette

```css
:root {
  /* Main Brand Colors */
  --primary-color: #F89E1B;       /* Orange */
  --secondary-color: #2E2F33;     /* Deep Gray */
  
  /* Functional Colors */
  --success-color: #28a745;       /* Green */
  --info-color: #00a3e0;          /* Blue */
  --warning-color: #ffc107;       /* Amber */
  --danger-color: #dc3545;        /* Red */
  
  /* GenAI Insight Type Colors */
  --insight-general: #8a4fff;     /* Purple */
  --insight-brand: #00a3e0;       /* Blue */
  --insight-sentiment: #ff7e47;   /* Coral */
  --insight-trend: #00c389;       /* Teal */
  
  /* Background Colors */
  --bg-light: #f8f9fa;            /* Light Gray */
  --bg-dark: #212529;             /* Dark Gray */
  
  /* Text Colors */
  --text-primary: #212529;        /* Dark Gray */
  --text-secondary: #6c757d;      /* Medium Gray */
  --text-light: #f8f9fa;          /* Light Gray */
}
```

## Dashboard-Specific Implementations

### 1. AI Insights Dashboard (insights_dashboard.html)

Update the existing CSS in insights_dashboard.html:

```css
:root {
  --tbwa-primary: #F89E1B;        /* Change from #ff3300 to Retail Advisor orange */
  --tbwa-secondary: #2E2F33;      /* Change from #002b49 to Retail Advisor deep gray */
  --tbwa-light: #f8f9fa;
  --tbwa-dark: #212529;
  --tbwa-success: #28a745;
  --tbwa-warning: #ffc107;
  --tbwa-danger: #dc3545;
  --tbwa-info: #00a3e0;
  --insight-general: #8a4fff;
  --insight-brand: #00a3e0;
  --insight-sentiment: #ff7e47;
  --insight-trend: #00c389;
}
```

### 2. System Operations Dashboard (juicer_dash_shell.html)

Replace the CSS variables in juicer_dash_shell.html:

```css
:root {
  --primary-color: #F89E1B;       /* Retail Advisor orange */
  --secondary-color: #2E2F33;     /* Retail Advisor deep gray */
  --accent-color: #00a3e0;        /* Blue for accent elements */
  --bg-color: #f8f9fa;
  --text-color: #212529;
  --border-color: #dee2e6;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --info-color: #00a3e0;
}
```

### 3. QA Dashboard (qa.html)

Update the CSS variables in qa.html:

```css
:root {
  --primary: #F89E1B;             /* Retail Advisor orange */
  --secondary: #2E2F33;           /* Retail Advisor deep gray */
  --success: #28a745;
  --info: #00a3e0;
  --warning: #ffc107;
  --danger: #dc3545;
  --light: #f8f9fa;
  --dark: #212529;
  --qa-card-header: #2E2F33;
  --qa-card-border: #dee2e6;
}
```

## Component Color Application

### Headers

```css
.header, .footer {
  background-color: var(--secondary-color);
  color: white;
}
```

### Dashboard Cards

```css
.card-header.primary {
  background-color: var(--primary-color);
  color: white;
}

.card-header.secondary {
  background-color: var(--secondary-color);
  color: white;
}
```

### Buttons

```css
.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-secondary {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}
```

### GenAI Insight Cards

```css
.card-insight-general .card-header {
  background-color: var(--insight-general);
  color: white;
}

.card-insight-brand .card-header {
  background-color: var(--insight-brand);
  color: white;
}

.card-insight-sentiment .card-header {
  background-color: var(--insight-sentiment);
  color: white;
}

.card-insight-trend .card-header {
  background-color: var(--insight-trend);
  color: white;
}
```

### Charts and Visualizations

For Chart.js visualizations, use the following colors:

```javascript
// Default color scheme for charts
const chartColors = {
  primary: '#F89E1B',       // Retail Advisor orange
  secondary: '#2E2F33',     // Retail Advisor deep gray
  tertiary: '#00a3e0',      // Blue
  quaternary: '#28a745',    // Green
  quinary: '#ffc107',       // Amber
  senary: '#dc3545',        // Red
};

// For transparency, use rgba versions
const chartColorsAlpha = {
  primary: 'rgba(248, 158, 27, 0.7)',
  secondary: 'rgba(46, 47, 51, 0.7)',
  tertiary: 'rgba(0, 163, 224, 0.7)',
  quaternary: 'rgba(40, 167, 69, 0.7)',
  quinary: 'rgba(255, 193, 7, 0.7)',
  senary: 'rgba(220, 53, 69, 0.7)',
};
```

## Dark Mode Adjustments

When implementing dark mode, adjust the following:

```css
body.dark-mode {
  --bg-light: #2E2F33;        /* Deep gray as light background */
  --bg-dark: #1a1a1a;         /* Darker gray as dark background */
  --text-primary: #f8f9fa;    /* Light gray text */
  --text-secondary: #adb5bd;  /* Medium gray text */
  --border-color: #495057;    /* Medium-dark gray border */
}
```

## Implementation Steps

1. **Create a Shared CSS File**:
   - Create `css/retail_advisor_theme.css` with these color definitions
   - Include it in all three dashboards

2. **Update Existing CSS**:
   - Replace all color references in each dashboard CSS
   - Ensure consistent variable names where possible
   - Create a consolidated stylesheet for shared components

3. **Update JavaScript Charting**:
   - Ensure all Chart.js instances use the standardized colors
   - Create a shared chart configuration function

4. **Test Visual Consistency**:
   - Compare all three dashboards side-by-side
   - Check both light and dark modes
   - Verify that all components use the proper colors

## Next Steps

After implementing the color standardization:

1. Run the white-label verification to ensure all branding has been properly updated
2. Test all interactive components to ensure proper styling on hover/active states
3. Verify dark mode functionality across all dashboards
4. Capture screenshots of the standardized dashboards for documentation

By implementing this standardized color scheme across all three dashboards, we ensure that the Retail Advisor brand is consistently represented and provides a cohesive user experience.