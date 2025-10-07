# Project Scout Dashboard Demo - Quick Start Guide

This guide provides everything you need to get started with the Project Scout Dashboard Demo package, which showcases the data toggle functionality for presentation and demonstration purposes.

## Setup Instructions

### Option 1: Use a Local Web Server (Recommended)

1. **Run the included server script:**
   ```bash
   # Make the script executable
   chmod +x run_demo_server.sh
   
   # Run the server
   ./run_demo_server.sh
   ```

2. **Access the demo in your browser:**
   Open [http://localhost:8080/DEMO.html](http://localhost:8080/DEMO.html)

### Option 2: Open Files Directly

You can open the HTML files directly in your browser, but some functionality might be limited due to browser security restrictions.

## Dashboard Navigation

The demo package includes two main dashboards:

1. **Retail Edge Dashboard**: Comprehensive retail analytics
   - Path: `retail_edge/retail_edge_dashboard.html`

2. **Insights Dashboard**: Strategic business insights 
   - Path: `insights_dashboard.html`

## Using the Data Toggle

The data toggle feature allows you to switch between real and simulated data sources for demonstration purposes without requiring a backend connection.

### How to Toggle Data Sources

1. Locate the toggle switch in the dashboard header (after the main navigation)
2. Click the switch to change between real and simulated data
   - **Right position (ON)**: Using real data (LIVE)
   - **Left position (OFF)**: Using simulated data (DEMO)

When using simulated data, a "DEMO MODE" watermark appears on the dashboard to clearly indicate you're viewing demonstration data.

### Key Features

- The toggle persists your preference using localStorage
- Clear visual indicators throughout the dashboard show the current data source state
- The dashboard automatically refreshes data when toggling
- DEMO watermark appears when using simulated data

## Common Demo Scenarios

Here are some suggested demonstration scenarios:

### Scenario 1: Data Independence Demo

**Goal**: Show how the dashboard can operate without a live backend connection

1. Start with the Retail Edge Dashboard
2. Ensure the toggle is set to "Using Simulated Data"
3. Point out the "DEMO" indicators and watermark
4. Highlight how all charts and tables are populated with meaningful sample data
5. Mention that this allows for effective presentations in environments without internet access

### Scenario 2: Seamless Transition Demo

**Goal**: Demonstrate the smooth transition between data sources

1. Open the Retail Edge Dashboard
2. Toggle between real and simulated data a few times
3. Highlight how the dashboard refreshes and updates all components
4. Point out the visual indicators that change to show which data source is active
5. Explain that this architecture allows for testing and validation without affecting production data

### Scenario 3: Medallion Architecture Demo

**Goal**: Showcase the layered data approach

1. Start with simulated data mode
2. Explain the four-layer Medallion architecture:
   - Bronze Layer: Raw, unprocessed data
   - Silver Layer: Cleaned and standardized data
   - Gold Layer: Enriched and aggregated data
   - Platinum Layer: AI-generated insights
3. Point out how different dashboard components draw from different layers
4. Highlight how this architecture provides both flexibility and performance

### Scenario 4: Executive Presentation Demo

**Goal**: Prepare for an executive presentation

1. Test the dashboard in simulated mode to ensure all visuals work properly
2. Create screenshots of key metrics for your presentation
3. Practice your narrative using the demo mode
4. When presenting, decide whether to use live or simulated data based on:
   - Network reliability at presentation location
   - Whether you need controlled, predictable data
   - If you need to demonstrate specific edge cases

## Talking Points

- **Medallion Architecture**: The dashboard implements a medallion data architecture with Bronze (raw), Silver (cleaned), Gold (enriched), and Platinum (AI insights) layers.

- **Real-time Capabilities**: When using real data, the dashboard can connect to APIs for real-time updates.

- **Performance Optimization**: The data connector includes caching mechanisms to improve performance.

- **User Experience**: The toggle provides clear visual indicators to ensure users always know which data source they're viewing.

- **Extensibility**: The architecture allows for easily adding new data sources or extending existing ones.

- **Practical Uses**: The toggle functionality is valuable for:
  - Demonstrations in environments without network connectivity
  - Training sessions where predictable data is needed
  - Testing new dashboard features without affecting production systems
  - Presenting specific business scenarios that may not exist in live data

## Troubleshooting Tips

### Issue: Dashboard shows no data

**Solution**: 
- Check that the simulated data files are in the correct location: `/assets/data/simulated/`
- Verify any browser console errors (Press F12 to open developer tools)
- Try refreshing the page with a hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Issue: Toggle doesn't change data

**Solution**:
- Clear browser cache and localStorage (from developer tools)
- Check browser console for JavaScript errors
- Verify that all required JavaScript files are loaded

### Issue: Charts not rendering

**Solution**:
- Ensure Chart.js is properly loaded
- Check for any JavaScript errors in the console
- Verify the data structure in the simulated data files

### Issue: DEMO watermark not appearing

**Solution**:
- Verify you're using the enhanced data toggle from the demo package
- Check if any custom CSS is overriding the watermark styling
- Inspect the page for HTML elements with ID 'demo-watermark'

## Additional Resources

- **Data Toggle Documentation**: See `docs/README_DATA_TOGGLE.md`
- **Original Dashboard README**: See `docs/ORIGINAL_README.md`
- **Implementation Details**: Review the JavaScript files in `js/` directory

## Quick Reference

| Feature | Location | Purpose |
|---------|----------|---------|
| Data Toggle | Dashboard header | Switch between real and simulated data |
| DEMO Watermark | Center of screen | Visual indicator of demo mode |
| DEMO Badges | Charts and data sections | Indicate source of specific data components |
| LocalStorage | Browser storage | Persist user preference between sessions |
| Simulated Data | `/assets/data/simulated/` | JSON files providing demonstration data |