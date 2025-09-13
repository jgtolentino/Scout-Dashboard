# Geospatial Store Map Component Verification Guide

## Overview

This document provides detailed instructions for verifying that the geospatial store map component has been correctly rolled back and is functioning properly. The store map is a critical component of the Scout Advisor Dashboard that displays store locations on a map of the Philippines with performance metrics and interactive features.

## Prerequisites

- Access to the rolled back Scout Advisor Dashboard
- Modern web browser with JavaScript enabled
- Network connectivity to access Leaflet CDN resources

## Verification Steps

### 1. Visual Verification

1. Access the dashboard at [https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor](https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor)
2. Locate the geospatial store map section on the dashboard
3. Confirm that:
   - The map container is visible
   - The map of the Philippines is properly rendered
   - Store location markers are displayed on the map
   - The map legend is visible and styled correctly
   - Map controls (zoom buttons, etc.) are visible and styled correctly

### 2. Functional Verification

1. **Map Navigation**
   - Test zooming in and out using the zoom controls
   - Test panning by clicking and dragging the map
   - Verify that map responds smoothly to interactions

2. **Store Markers**
   - Hover over store markers to verify tooltips appear
   - Click on store markers to verify popup information displays correctly
   - Verify that store information in popups includes:
     - Store name
     - Address
     - Performance metrics
     - Last activity timestamp

3. **Filter Integration**
   - Use the dashboard filters (region, date range, etc.)
   - Verify that map updates to reflect the filtered data
   - Verify that store markers are filtered correctly
   - Verify that any region highlighting updates accordingly

4. **Metric Visualization**
   - Toggle between different metrics (if available)
   - Verify that marker colors or sizes change appropriately
   - Verify that the legend updates to reflect the selected metric

### 3. Technical Verification

1. **Resource Loading**
   - Open browser developer tools (F12 or right-click > Inspect)
   - Navigate to the Network tab
   - Refresh the page and verify that these resources load successfully:
     - Leaflet CSS (`leaflet.css`)
     - Leaflet JavaScript (`leaflet.js`)
     - Store map component JavaScript (`store_map.js`)
     - GeoJSON data files (e.g., `philippines_outline.geojson`)

2. **Error Checking**
   - Check the Console tab for any JavaScript errors
   - Verify there are no 404 errors for map-related resources
   - Verify there are no CORS issues with loading map tiles or GeoJSON data

3. **Responsive Design**
   - Test the dashboard on different screen sizes
   - Verify that the map resizes appropriately
   - Verify that the map is usable on mobile devices

## Common Issues and Solutions

### Map Not Displaying

**Possible Causes:**
- Leaflet CSS or JavaScript failed to load
- CORS issues with map tiles
- JavaScript errors in the map initialization code

**Solutions:**
- Check browser console for specific errors
- Verify network connectivity to CDN resources
- Verify GeoJSON data files are accessible

### Store Markers Missing

**Possible Causes:**
- Store data not loading correctly
- JavaScript error in marker creation code
- Filter settings excluding all stores

**Solutions:**
- Reset all filters to default
- Check for API/data source connectivity issues
- Verify store data format in browser network tab

### Map Interactivity Issues

**Possible Causes:**
- JavaScript errors
- CSS conflicts
- Browser compatibility issues

**Solutions:**
- Check browser console for specific errors
- Try a different modern browser
- Verify Leaflet version compatibility

## Verification Checklist

| Component | Details to Verify | Status |
|-----------|-------------------|--------|
| Map Container | Properly sized and visible | □ |
| Map Tiles | Philippines map correctly rendered | □ |
| Store Markers | All store locations displayed correctly | □ |
| Tooltips/Popups | Display correct information on hover/click | □ |
| Zoom Controls | Function correctly | □ |
| Pan Functionality | Map pans smoothly | □ |
| Filter Integration | Map updates when filters are applied | □ |
| Metric Visualization | Different metrics display correctly | □ |
| Responsiveness | Works on different screen sizes | □ |
| Error-Free | No console errors related to map | □ |

## Reporting Issues

If issues are found with the geospatial store map component, document the following:

1. Specific issue observed
2. Steps to reproduce
3. Browser and device information
4. Screenshots of the issue
5. Any relevant console errors

Submit this information along with the rollback verification report.

---

*Last Updated: May 19, 2025*