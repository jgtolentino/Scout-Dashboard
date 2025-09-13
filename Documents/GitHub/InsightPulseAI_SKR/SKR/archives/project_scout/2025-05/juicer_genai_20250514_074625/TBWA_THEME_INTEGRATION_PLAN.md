# TBWA Brand Theme Integration Plan

This document outlines the implementation plan for integrating the TBWA brand identity across all dashboards while maintaining Power BI's visual grammar.

## Implementation Summary

We've successfully implemented the following components:

1. **Core TBWA CSS Theme**
   - Created `tbwa-theme.css` with the official TBWA color palette
   - Implemented Power BI-compatible card styling and hover effects
   - Added typography standards matching Power BI (Segoe UI)
   - Built responsive layouts with proper grid alignment

2. **Chart Theme Integration**
   - Created `tbwa-charts.js` for consistent chart styling
   - Added support for Chart.js and ECharts libraries
   - Implemented TBWA color sequences for all visualizations
   - Created theme helpers for easy integration

3. **Theme Validator**
   - Built `tbwa_theme_validator.js` for automated theme compliance checking
   - Validates core brand elements (colors, typography, styling)
   - Compares against reference screenshots for regression testing
   - Generates detailed reports for continuous integration

## Integration Steps for Each Dashboard

### 1. Add Theme Files (Day 1)

1. **Include CSS Theme**
   ```html
   <link rel="stylesheet" href="../styles/tbwa-theme.css">
   ```

2. **Include Chart Theme**
   ```html
   <script src="../styles/tbwa-charts.js"></script>
   ```

3. **Apply Theme to Existing Charts**
   ```js
   // For Chart.js
   const myChart = new Chart(ctx, {...});
   Chart.applyTbwaTheme(myChart);
   
   // For ECharts
   const chart = echarts.init(element, 'tbwa');
   ```

### 2. Structure Updates (Day 1-2)

1. **Add Proper Header**
   ```html
   <header class="app-bar">
     <h1>Project Scout Dashboard</h1>
   </header>
   ```

2. **Update Card Structure**
   ```html
   <div class="card">
     <h3 class="card-header">Brand Performance</h3>
     <div class="kpi-number">92%</div>
     <div class="kpi-delta positive">
       <span class="delta-arrow up"></span>
       +1.4% vs last month
     </div>
   </div>
   ```

3. **Add Dashboard Grid**
   ```html
   <div class="dashboard-grid">
     <!-- Cards go here -->
   </div>
   ```

### 3. Typography Updates (Day 2)

1. **Update KPI Styling**
   - Increase font size to 32px for KPI numbers
   - Use Segoe UI Semibold for KPI numbers
   - Apply proper TBWA colors for deltas (cyan for positive, red for negative)

2. **Update Headings**
   - Use Segoe UI for all headings
   - Maintain Power BI heading hierarchy (18px for H1, 16px for H2, etc.)

### 4. QA Integration (Day 3)

1. **Run Theme Validator**
   ```bash
   ./run_tbwa_theme_validator.sh http://localhost:8000/dashboard
   ```

2. **Fix Any Issues**
   - Review validation report
   - Address any theme failures or warnings
   - Re-run validation until passed

3. **Create Reference Screenshots**
   - Capture baseline screenshots for regression testing
   - Store in `/qa/reference_shots/` directory

### 5. CI/CD Integration (Day 4)

1. **Add GitHub Workflow**
   - Configure automated theme validation on PRs
   - Block merges for theme failures
   - Generate reports as workflow artifacts

2. **Update Documentation**
   - Add theme usage guidelines
   - Document validation process
   - Create theme component library

## Dashboard-Specific Plans

### 1. Retail Edge Dashboard

1. **Theme Updates**
   - Add TBWA header with navy background
   - Update card styling with 8px radius and shadows
   - Implement yellow highlight on hover
   - Fix KPI number styling to match Segoe UI Semibold 32px

2. **Chart Updates**
   - Apply TBWA chart theme to all visualizations
   - Use TBWA color sequence for chart elements
   - Update tooltips with TBWA styling

### 2. Retail Performance Dashboard

1. **Theme Updates**
   - Add consistent header matching Retail Edge
   - Update card grid layout with proper spacing
   - Implement Power BI style data cards with TBWA colors
   - Format KPI deltas with cyan/red indicators

2. **Chart Updates**
   - Apply TBWA color sequence to all charts
   - Add proper hover effects to bar/line charts
   - Update legends with consistent styling

### 3. Project Scout Dashboard

1. **Theme Updates**
   - Add TBWA header and footer
   - Update all card components with consistent styling
   - Implement 8px grid alignment across all elements
   - Add hover effects matching Power BI

2. **Chart Updates**
   - Apply TBWA theme to all charts
   - Use navy/yellow/cyan color sequence
   - Update all tooltips and legends with consistent styling

## Testing Plan

1. **Visual Verification**
   - Run theme validator on all dashboards
   - Visually inspect each dashboard on multiple screen sizes
   - Verify all interactions maintain Power BI behavior

2. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, and Edge
   - Verify theme appears consistent across browsers
   - Check responsive layout on various screen sizes

3. **Visual Regression**
   - Create baseline screenshots of all dashboards
   - Run automatic pixel diff on changes
   - Ensure theme changes don't break existing layouts

## Timeline

| Day | Task | Details |
|-----|------|---------|
| Day 1 | Add Theme Files | Include CSS/JS in all dashboards |
| Day 1-2 | Structure Updates | Update HTML structure for theme compatibility |
| Day 2 | Typography Updates | Fix fonts, sizes, and styling |
| Day 3 | QA Integration | Run validators and fix issues |
| Day 4 | CI/CD Integration | Set up automatic theme validation |
| Day 5 | Final Review | Team review of all themed dashboards |

## Success Criteria

1. All dashboards pass the TBWA theme validator
2. Visual style maintains Power BI grammar while using TBWA colors
3. All charts use consistent TBWA color sequences
4. Typography follows Power BI standards (Segoe UI)
5. Cards have proper 8px radius and yellow highlight on hover
6. KPI numbers are properly styled with semibold 32px font
7. CI/CD integration prevents non-compliant theme changes

## Resources

- TBWA Brand Guidelines (core color palette)
- Power BI Interface Guidelines (visual grammar, interaction patterns)
- Theme Validator Tool (automated compliance checking)
- Reference Screenshots (baseline for comparison)

This integration plan ensures all dashboards maintain consistent TBWA branding while preserving the familiar Power BI interaction patterns users expect.