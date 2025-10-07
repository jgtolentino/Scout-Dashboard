# TBWA Scout Dashboard Style Guide

This style guide ensures consistency with Power BI styling across Scout dashboards.

## Table of Contents
- [Color Usage](#color-usage)
- [Typography](#typography)
- [Layout](#layout)
- [Visual Elements](#visual-elements)
- [Interactivity](#interactivity)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [QA Process](#qa-process)

## Color Usage

### Primary Color Palette
All dashboards must use the official TBWA Scout color palette:

- Primary Orange: `#FF671F`
- Primary Purple: `#3B1A86`
- Primary Blue: `#00A3E0`
- Primary Green: `#82BC00`
- Warning: `#FF9900`
- Error/Alert: `#E0004D`
- Yellow: `#FFCD00`

### Semantic Color Usage
- Good/Positive: `#82BC00` (Green)
- Neutral: `#FF9900` (Orange)
- Bad/Negative: `#E0004D` (Red)
- High value: `#FF671F` (Primary Orange)
- Low value: `#3B1A86` (Primary Purple)

### Background Colors
- Primary background: `#FFFFFF` (White)
- Secondary background: `#F3F2F1` (Light Gray)
- Tertiary background: `#C8C6C4` (Medium Gray)

### Text Colors
- Primary text: `#252423` (Dark Gray)
- Secondary text: `#605E5C` (Medium Gray)
- Tertiary text: `#B3B0AD` (Light Gray)

## Typography

### Font Family
- Primary font: Segoe UI
- Fallback: Arial, sans-serif

### Font Sizes
- Titles: 14px
- Headers: 14px (Semibold)
- Body text: 12px
- Labels: 10px
- Callouts: 32px

### Font Weights
- Regular: 400
- Semibold: 600
- Bold: 700

## Layout

### Card Layout
- Consistent padding: 12px
- Border radius: 4px
- Border color: `#E1DFDD`
- Shadow: `rgba(0, 0, 0, 0.1)` with 4px blur and 90% transparency

### Grid System
- Responsive 12-column grid
- Consistent gutters: 12px
- Alignment: Left-aligned for text, right-aligned for numbers

### Responsiveness
- All dashboards must respond to three breakpoints:
  - Desktop: 1920 x 1080
  - Tablet: 1024 x 768
  - Mobile: 375 x 667

### Component Spacing
- Uniform margin between components: 16px
- Section padding: 24px
- Visual element grouping: Related elements should have reduced spacing (8px)

## Visual Elements

### Charts
- Consistent styling across all chart types
- Axis lines: `#E1DFDD` (Light Gray)
- Grid lines: `#F3F2F1` (Lighter Gray)
- Legend position: Bottom
- Chart titles: Follow typography guidelines
- Tooltips: Consistent format and styling

### Tables
- Header background: `#3B1A86` (Primary Purple)
- Header text: `#FFFFFF` (White)
- Zebra striping: `#F3F2F1` (Light Gray)
- Border: `#E1DFDD` (Light Gray)
- Selected row: `#00A3E0` at 10% opacity

### KPI Cards
- Value font size: 24px
- Value font weight: Semibold
- Label position: Above value
- Trend indicators: Use semantic colors

### Icons
- Consistent icon set
- Size: 16px for inline, 24px for featured
- Color: Match with chart/card primary color or semantic meaning

## Interactivity

### Hover States
- Background color change: 10% darker than base
- Cursor: pointer for interactive elements
- Tooltips: Show on hover with 300ms delay

### Selection States
- Selected item background: `#00A3E0` at 10% opacity
- Selected item border: `#00A3E0`
- Multiple selection: Must be clear which items are selected

### Filtering
- Filter controls: Consistent position and styling
- Clear indicators when filters are active
- Reset button: Always available when filters are active

### Cross-filtering
- Elements should highlight related data when selected
- Inactive data: 50% opacity
- Transitions: 200ms animation for state changes

## Accessibility

### Color Contrast
- Text must have a minimum contrast ratio of 4.5:1
- Large text (18px+) must have a minimum contrast ratio of 3:1
- UI components must have a minimum contrast ratio of 3:1

### Focus Indicators
- Keyboard focus: Clear indicator with `#00A3E0` outline
- Tab order: Logical flow through dashboard elements

### Screen Reader Support
- All charts must have alt text
- All interactive elements must have aria labels
- Tables must use proper header associations

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Shortcut keys documented in info panel
- Skip navigation link for keyboard users

## Performance

### Load Time
- Initial load: Under 3 seconds
- Filtering operations: Under 300ms
- Transitions: Smooth 60fps

### Memory Usage
- Stay under 100MB JavaScript heap
- Clean up event listeners when components unmount
- Optimize chart redraw operations

### Network Efficiency
- Minimize API calls
- Use appropriate data caching strategies
- Implement progressive loading for large datasets

## QA Process

### Visual Testing
- Compare screenshots against baselines
- Verify all color usage matches standards
- Check typography consistency

### Behavior Testing
- Verify all interactions work as expected
- Test cross-filtering behavior
- Validate keyboard navigation

### Accessibility Testing
- Run automated WCAG 2.1 AA checks
- Test with screen readers
- Verify keyboard-only operation

### Performance Testing
- Measure and log load times
- Test interaction responsiveness
- Verify memory usage is within limits

### PR Requirements
- Must pass all automated tests
- Must include baseline screenshots for new components
- Must maintain or improve accessibility scores
- Must maintain or improve performance metrics