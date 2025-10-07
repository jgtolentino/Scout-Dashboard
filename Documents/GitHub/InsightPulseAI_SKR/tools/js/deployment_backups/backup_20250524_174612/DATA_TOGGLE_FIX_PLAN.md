# Data Source Toggle Styling Fix Plan

## Overview
This document outlines the plan to permanently fix the styling issues with the Simulated/Real-time data source toggle in the Scout Advisor dashboard.

## Issue Diagnosis
The dashboard's data source toggle styling was lost after recent updates. Currently, the toggle appears as static text "Simulated Real-time" without proper styling or interactive functionality. This change likely occurred during the recent UI modernization or feature flag enhancement work.

## Investigation Steps

1. **Identify Relevant Files**:
   - Review the styling files in `/deploy-advisor-fixed/css/`
   - Check the implementation in `/deploy-advisor-fixed/js/data_source_toggle.js`
   - Examine related components in `/js/dashboard_integrator.js`
   - Inspect HTML structure in `/advisor/index.html` and `/advisor.html`

2. **Identify Breaking Changes**:
   - Compare files between the current version and the working version (e5a75c8)
   - Look for CSS class changes or removals
   - Check for JavaScript function changes that handle the toggle
   - Investigate if there were feature flag changes that affected the toggle

## Implementation Plan

1. **Restore Toggle Component**:
   Create a branch `fix-data-toggle-styling` from main and apply these changes:

   a. **Restore CSS Classes**:
   ```css
   /* In css/shared-theme.css or css/analytics-dashboard.css */
   .data-source-toggle {
     display: inline-flex;
     align-items: center;
     background: rgba(255, 255, 255, 0.1);
     border-radius: 16px;
     padding: 4px;
     margin-left: 8px;
     border: 1px solid rgba(255, 255, 255, 0.2);
   }

   .toggle-option {
     padding: 4px 12px;
     border-radius: 12px;
     cursor: pointer;
     transition: all 0.2s ease;
   }

   .toggle-option.active {
     background: rgba(0, 120, 212, 0.8);
     color: white;
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   }
   ```

   b. **Restore JavaScript Function**:
   ```javascript
   // In js/data_source_toggle.js
   function initializeDataSourceToggle() {
     const simToggle = document.getElementById('simulated-toggle');
     const realToggle = document.getElementById('realtime-toggle');
     
     if (simToggle && realToggle) {
       simToggle.addEventListener('click', () => {
         simToggle.classList.add('active');
         realToggle.classList.remove('active');
         toggleDataSource('simulated');
       });
       
       realToggle.addEventListener('click', () => {
         realToggle.classList.add('active');
         simToggle.classList.remove('active');
         toggleDataSource('realtime');
       });
     }
   }

   function toggleDataSource(source) {
     // Implement data source switching logic
     console.log(`Switched to ${source} data source`);
     
     // Update data or visualizations based on source
     const event = new CustomEvent('dataSourceChanged', { detail: { source } });
     document.dispatchEvent(event);
   }
   
   // Initialize on page load
   document.addEventListener('DOMContentLoaded', initializeDataSourceToggle);
   ```

   c. **Update HTML Structure**:
   ```html
   <!-- In advisor/index.html -->
   <div class="dashboard-header-meta">
     <span>Data Source:</span>
     <div class="data-source-toggle">
       <div id="simulated-toggle" class="toggle-option active">Simulated</div>
       <div id="realtime-toggle" class="toggle-option">Real-time</div>
     </div>
   </div>
   ```

2. **Handle Feature Flag Integration**:
   Ensure the toggle respects the feature flags system:

   ```javascript
   // In js/data_source_toggle.js
   function checkFeatureFlags() {
     // Check if real-time data is enabled
     const isRealTimeEnabled = window.featureFlags && 
                               window.featureFlags.enableRealTimeData;
     
     const realTimeToggle = document.getElementById('realtime-toggle');
     
     if (realTimeToggle) {
       if (!isRealTimeEnabled) {
         realTimeToggle.classList.add('disabled');
         realTimeToggle.title = "Real-time data currently unavailable";
       } else {
         realTimeToggle.classList.remove('disabled');
         realTimeToggle.title = "";
       }
     }
   }
   
   // Check feature flags on page load
   document.addEventListener('DOMContentLoaded', () => {
     initializeDataSourceToggle();
     checkFeatureFlags();
   });
   ```

3. **Add Responsive Styling**:
   Ensure the toggle works on mobile devices:

   ```css
   /* In css/shared-theme.css or css/analytics-dashboard.css */
   @media (max-width: 768px) {
     .data-source-toggle {
       margin-left: 0;
       margin-top: 8px;
       font-size: 0.85rem;
     }
     
     .toggle-option {
       padding: 3px 8px;
     }
   }
   ```

## Testing Plan

1. **Visual Testing**:
   - Verify toggle appears correctly on desktop, tablet, and mobile
   - Check that toggle state is visually indicated
   - Confirm disabled state appears correctly when feature flags are off

2. **Functional Testing**:
   - Verify clicking toggles updates the UI state
   - Confirm data refresh when toggle is clicked
   - Test feature flag interaction

3. **Cross-Browser Testing**:
   - Test in Chrome, Firefox, Safari, and Edge
   - Verify on iOS and Android mobile browsers

## Deployment Plan

1. **Staged Rollout**:
   - Deploy fix to development environment
   - Verify with QA team
   - Deploy to staging environment for stakeholder approval
   - Use Canary deployment for production

2. **Monitoring**:
   - Add telemetry to track toggle usage
   - Set up dashboard to monitor toggle-related issues

3. **Documentation**:
   - Update DEPLOYMENT_VERIFICATION.md to include toggle verification
   - Document the toggle component in the codebase

## Long-Term Improvements

1. **Component Refactoring**:
   - Consider refactoring the toggle into a reusable component
   - Ensure consistent styling with other toggle elements

2. **Automated Testing**:
   - Add visual regression tests for the toggle component
   - Include toggle functionality in E2E tests

3. **Enhanced Features**:
   - Add animation to the toggle transition
   - Consider adding a timestamp indicator showing when real-time data was last updated
   - Add ability to see data refresh status when switching sources