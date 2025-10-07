# Power BI Styling Guide for Retail Dashboards

This guide documents the Power BI styling conventions implemented in our dashboards to ensure visual parity with Microsoft Power BI.

## Design System

All dashboard components follow the Superstore template specifications from the Figma file "Superstore Overview Dashboard – Tableau / Power BI Community".

### Color Tokens

| Purpose | Color | Hex | CSS Variable |
|---------|-------|-----|-------------|
| **Primary Blue** | ![#4E73DF](https://via.placeholder.com/15/4E73DF/000000?text=+) | `#4E73DF` | `--pb-blue` |
| **Orange** | ![#FF9F40](https://via.placeholder.com/15/FF9F40/000000?text=+) | `#FF9F40` | `--pb-orange` |
| **Green** | ![#1CC88A](https://via.placeholder.com/15/1CC88A/000000?text=+) | `#1CC88A` | `--pb-green` |
| **Cyan** | ![#36B9CC](https://via.placeholder.com/15/36B9CC/000000?text=+) | `#36B9CC` | `--pb-cyan` |
| **Yellow** | ![#F6C23E](https://via.placeholder.com/15/F6C23E/000000?text=+) | `#F6C23E` | `--pb-yellow` |
| **Red** | ![#E74A3B](https://via.placeholder.com/15/E74A3B/000000?text=+) | `#E74A3B` | `--pb-red` |
| **Dark Text** | ![#252423](https://via.placeholder.com/15/252423/000000?text=+) | `#252423` | `--neutral-900` |
| **Medium Text** | ![#605E5C](https://via.placeholder.com/15/605E5C/000000?text=+) | `#605E5C` | `--neutral-600` |
| **Border** | ![#E1E1E1](https://via.placeholder.com/15/E1E1E1/000000?text=+) | `#E1E1E1` | `--neutral-200` |
| **Background** | ![#F9F9F9](https://via.placeholder.com/15/F9F9F9/000000?text=+) | `#F9F9F9` | `--neutral-50` |

### Typography

| Element | Font Family | Weight | Size | Example |
|---------|-------------|--------|------|---------|
| Page Title | Segoe UI | 600 (SemiBold) | 24px | `Dashboard Title` |
| Card Titles | Segoe UI | 600 (SemiBold) | 14px | `Sales by Region` |
| KPI Values | Segoe UI | 600 (SemiBold) | 28px | `$1,235,678` |
| KPI Labels | Segoe UI | 400 (Regular) | 12px | `TOTAL SALES` |
| Body Text | Segoe UI | 400 (Regular) | 13px | Description text |
| Links | Segoe UI | 600 (SemiBold) | 13px | `View details` |

### Spacing & Layout

- Canvas width: 1366px (Power BI standard)
- Grid: 12-column with 24px gutters
- Card padding: 16px
- Border radius: 8px
- Border width: 1px
- Component spacing: 16px

## Component Specifications

### KPI Cards

- White background
- Gray border (#E1E1E1)
- 8px border radius
- Center-aligned content
- Uppercase label text
- Arrow indicator for trends
  - Green up arrow for positive
  - Red down arrow for negative
- Subtle hover effect with shadow
- Accessible focus state

### Charts

- White background
- Gray border (#E1E1E1)
- Chart title in header
- Header with action links
- 320px default height
- 0.5px gray grid lines
- Font-size 10px axis labels
- Power BI color palette

### Filter Chips

- Pill-shaped (16px border radius)
- White background with gray border
- Icon + text combination
- Hover state: blue border + blue text
- Selected state: blue background (10% opacity)
- Accessibility: keyboard navigable with `tabindex="0"`

### Insight Cards

- White background
- Gray border (#E1E1E1)
- 4px colored band on top (not full colored header)
- 16px padding
- Action items with left border indicator
- Text links instead of button pills
- Priority colors
  - High: Red
  - Medium: Yellow
  - Low: Blue

## Accessibility Features

1. Focus states with 2px blue outline
2. Proper color contrast (WCAG AA)
3. Keyboard navigation order with `tabindex`
4. Semantic HTML structure

## Implementation Details

The styling is implemented using:
- CSS variables for colors and spacings
- External fonts from Segoe UI (Microsoft)
- Chart.js with custom styling
- Responsive layout with media queries

## Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Desktop | ≥992px | Standard layout (1366px canvas) |
| Tablet | 768px-991px | Reduced gutters (16px), smaller text |
| Mobile | <768px | 2-column grid for KPI cards, stacked charts |

## QA Testing

To verify power BI style parity, run:

```bash
npm run qa:visual
```

This will compare dashboard screenshots against the baseline Figma exports.