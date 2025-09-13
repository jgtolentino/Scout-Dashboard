# Scout Advisor Dashboard QA Test Checklist

## Overview
This checklist is designed for manual verification of the Power BI-style interactivity features implemented in the Scout Advisor Dashboard. Use this document to thoroughly test all functionality before final deployment.

## Prerequisites
- Access to the deployed dashboard: `https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor`
- Modern browser (Chrome, Firefox, Safari, or Edge)
- Network connection to test data loading

## 1. TBWA Theme & Styling

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Brand colors | View entire dashboard | Yellow (#F6E14D) and dark blue (#002B5B) color scheme consistent throughout | ☐ |
| Button styling | View primary & secondary buttons | Primary: Yellow background with dark text<br>Secondary: White with yellow border | ☐ |
| Card styling | View KPI cards & insight cards | Left border color-coding, proper shadows, hover effects | ☐ |
| Typography | Check headings & body text | Consistent font sizing and weights | ☐ |
| Responsive layout | Resize browser window | Layout adjusts appropriately for mobile, tablet & desktop | ☐ |

## 2. Data Toggle Functionality

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Toggle visibility | Look for data toggle in filter bar | Toggle shows "Simulated" and "Real-time" options | ☐ |
| Toggle selection | Click between Simulated & Real-time | Selected option is highlighted | ☐ |
| Data refresh | Toggle between options | Charts visibly refresh with slight animation | ☐ |
| Data persistence | Toggle, then refresh page | Previously selected option remains active | ☐ |
| Confidence indicators | Toggle to Simulated | Insight confidence levels should change slightly | ☐ |

## 3. Chart Interactivity

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Chart hover | Hover over chart elements | Enhanced tooltip appears with styled background | ☐ |
| Tooltip content | Hover on various elements | Tooltips show formatted values and context | ☐ |
| Chart click | Click on a bar in Marketing Spend chart | Should filter other visualizations | ☐ |
| Pie chart click | Click on a slice in Market Risks chart | Should update recommendations panel | ☐ |
| Filter indication | After clicking chart element | Visual indication shows chart is filtered | ☐ |
| Reset filters | Click active chart element again | Filter should toggle off, restoring original view | ☐ |

## 4. KPI Card Interactivity

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Card hover | Hover over KPI cards | Card should have subtle elevation effect | ☐ |
| Card click | Click on Brand Performance KPI | Modal should open with detailed view | ☐ |
| Modal content | View modal after clicking KPI | All content and charts load correctly | ☐ |
| Dismiss modal | Click X or outside modal | Modal should close smoothly | ☐ |
| KPI filtering | Click on "warning" status card | Should filter insights to show only warnings | ☐ |
| Filter reset | Click same card again | Original unfiltered state should restore | ☐ |

## 5. Insight Card Interactivity

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Explainer toggle | Click "AI Explainer" on an insight | Explanation area should expand smoothly | ☐ |
| Confidence bars | View different insight cards | Confidence bars should be proportional to value | ☐ |
| Take Action | Click "Take Action" button | Appropriate feedback should be shown | ☐ |
| Insight filtering | Apply a filter from filter bar | Relevant insights should be highlighted | ☐ |
| Insight click | Click on insight card body | Should set filter to insight's impact level | ☐ |
| Impact badges | View badges on insight cards | High/Medium/Low impact styling should be distinct | ☐ |

## 6. Export Functionality

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Main export button | Click "Export" in header | CSV download should initiate | ☐ |
| Chart export | Click export icon on chart panel | Chart-specific CSV should download | ☐ |
| Export format | Open downloaded CSV file | Properly formatted with headers and data | ☐ |
| Export content | Check CSV contents | Should include all relevant metrics from view | ☐ |
| Filter-aware export | Apply filter, then export | Exported data should reflect current filters | ☐ |
| Export feedback | During export process | Visual feedback should indicate export in progress | ☐ |

## 7. Filter Bar Functionality

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Filter pill display | View filter bar | Organization, Status, Region, Category pills visible | ☐ |
| Remove filter | Click X on a filter pill | Filter should be removed, dashboard updates | ☐ |
| Date range | Click date range selector | Should cycle through time period options | ☐ |
| Add filter | Click + Add Filter button | Selection UI should appear | ☐ |
| Multiple filters | Apply 2+ different filters | Dashboard should reflect combined filter state | ☐ |
| Filter persistence | Apply filters, refresh page | Filter state should persist via localStorage | ☐ |

## 8. AI Assistant Section

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Assistant card styling | View AI assistant section | TBWA-styled card with proper spacing | ☐ |
| Filter-aware content | Apply various filters | Assistant recommendations should update | ☐ |
| Button styling | View buttons in assistant card | Primary/secondary TBWA button styles | ☐ |
| Action items | View recommended actions | Properly styled with icons and separators | ☐ |
| Generate AI Recommendations | Click the button | Visual feedback of processing | ☐ |
| View Analytics | Click "View Analytics" button | Should navigate to Edge dashboard | ☐ |

## 9. Performance & Browser Compatibility

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Initial load time | Load dashboard freshly | Should load within 2 seconds | ☐ |
| Filter response time | Apply/remove filters | UI should update within 300ms | ☐ |
| Animation smoothness | Interact with various elements | Animations should be smooth without jank | ☐ |
| Memory usage | Monitor during extended use | No significant memory growth over time | ☐ |
| Chrome compatibility | Test in Chrome browser | All features work as expected | ☐ |
| Firefox compatibility | Test in Firefox browser | All features work as expected | ☐ |
| Safari compatibility | Test in Safari browser | All features work as expected | ☐ |
| Edge compatibility | Test in Edge browser | All features work as expected | ☐ |

## 10. Accessibility

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Keyboard navigation | Tab through interface | All interactive elements are focusable | ☐ |
| Focus indicators | Tab to various elements | Visible focus state on all interactive elements | ☐ |
| Screen reader compatibility | Test with screen reader | All content properly announced | ☐ |
| Color contrast | Inspect text/background pairs | Meets WCAG 2.0 AA standards | ☐ |
| Modal keyboard access | Open modal, press ESC | Modal should close | ☐ |
| Tooltips | Use keyboard to access charts | Tooltip info available to keyboard/screen reader | ☐ |

## Issue Reporting
For any failed tests or issues discovered, please document:
1. Test case name and step that failed
2. Browser and version
3. Screenshot if possible
4. Expected vs. actual behavior
5. Steps to reproduce

Report issues to: [Project Scout Development Team]

## Sign-off
After all tests pass, obtain sign-off from:
- [ ] QA Lead
- [ ] UX Designer
- [ ] Product Owner