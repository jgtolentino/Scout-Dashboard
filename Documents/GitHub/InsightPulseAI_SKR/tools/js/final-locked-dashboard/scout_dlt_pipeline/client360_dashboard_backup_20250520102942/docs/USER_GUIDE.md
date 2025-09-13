# TBWA Client 360 Dashboard User Guide

This guide provides instructions for using the TBWA Client 360 Dashboard, a comprehensive analytics interface that offers at-a-glance visibility across your entire business with Advisor metrics front and center.

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Accessing the Dashboard](#accessing-the-dashboard)
3. [Navigation and Layout](#navigation-and-layout)
4. [Features and Functionality](#features-and-functionality)
5. [Using Filters](#using-filters)
6. [Exporting Data](#exporting-data)
7. [Drill-Down Analysis](#drill-down-analysis)
8. [AI-Powered Insights](#ai-powered-insights)
9. [Frequently Asked Questions](#frequently-asked-questions)
10. [Troubleshooting](#troubleshooting)

## Dashboard Overview

The TBWA Client 360 Dashboard is a unified analytics platform that brings together retail performance data, marketing metrics, brand sentiment, and AI-powered insights in a single interface. The dashboard is specifically tailored for businesses operating in the Philippines, with a focus on Sari-Sari store retail analytics.

### Key Dashboard Components

- **Global Header & Controls**: Navigation, date range selection, data source toggle, search, and export options
- **High-Level KPI Tiles**: Key performance indicators with trends and comparisons
- **Unified Filter Bar**: Filter data by organization, region, category, channel, and custom tags
- **Business-Performance Visual Grid**: Visual representations of key business metrics
- **AI-Powered Insight Panel**: AI-generated recommendations and insights
- **Drill-Down Drawer**: Detailed analysis of selected metrics
- **Footer & Diagnostic**: Legends, timestamps, and diagnostic tools

## Accessing the Dashboard

### URL and Login

The dashboard is accessible at:
- Production: `https://client360-dashboard.tbwa.com`
- Staging: `https://staging-client360-dashboard.tbwa.com`
- Development: `https://dev-client360-dashboard.tbwa.com`

No login is required to access the dashboard as it uses Azure AD authentication integrated with your corporate account.

### Supported Browsers

The dashboard is optimized for the following browsers:
- Google Chrome (latest version)
- Microsoft Edge (latest version)
- Safari (latest version)
- Firefox (latest version)

For the best experience, use Chrome or Edge with a minimum screen resolution of 1366x768.

## Navigation and Layout

The dashboard follows a hierarchical layout, presenting information from high-level KPIs down to detailed metrics:

### Global Header

Located at the top of the dashboard, the header contains:
- TBWA logo and dashboard title
- Date selector (Last 7/30/90 days or custom range)
- Data source toggle (switch between simulated and real-time data)
- Export button (CSV or PPTX export options)
- Global search (search by keyword, store ID, etc.)

### KPI Tiles

Below the header, four key performance indicator tiles display:
- **Total Sales**: Overall sales performance with trend indicator
- **Conversion Rate**: Percentage of interactions resulting in sales
- **Marketing ROI**: Return on marketing investment
- **Brand Sentiment**: Overall sentiment score from customer interactions

### Filter Bar

The unified filter bar allows filtering data by:
- **Organization/Brand**: Filter by TBWA client organization
- **Region/Market**: Filter by geographic region in the Philippines
- **Category/Product Line**: Filter by product category
- **Channel**: All, Online, In-Store
- **Custom Tags**: Filter by custom tags like "Holiday Promo"

### Visual Grid

The main dashboard area contains four visualization panels:
- **Brand Performance**: Brand performance metrics with gauge visualization
- **Competitor Analysis**: Competitive positioning with bullet charts
- **Retail Performance**: Regional sales performance with sparklines
- **Marketing ROI**: Channel ROI breakdown with donut chart

### Insight Panel

The AI-powered insight panel provides:
- Top 3 actionable recommendations
- Brand dictionary insights
- Emotional and contextual analysis
- Bundling opportunities

### Footer

The dashboard footer contains:
- Legend explaining color codes and icons
- Last updated timestamp
- Access to the QA overlay (Alt + Shift + D)

## Features and Functionality

### Date Range Selection

Select the time period for dashboard data:
1. Click the date selector dropdown in the header
2. Choose from preset options (Last 7/30/90 days)
3. Select "Custom" for a specific date range
4. All dashboard metrics will update to reflect the selected timeframe

### Data Source Toggle

Toggle between simulated and real-time data:
1. Click the toggle switch in the header
2. "Simulated" shows sample data for demonstration
3. "Real-time" connects to live data from the Scout DLT pipeline
4. This feature is useful for testing and presentations

### Search Functionality

Search across all dashboard data:
1. Enter keywords, store IDs, or brand names in the search box
2. Results will highlight matching items across all visualizations
3. Press Enter to execute the search
4. Clear the search box to reset

## Using Filters

The unified filter bar allows you to focus on specific segments of your data:

### Organization/Brand Filter

1. Click the Organization/Brand dropdown
2. Select a specific organization or "All Organizations"
3. The dashboard updates to show data for the selected organization

### Region/Market Filter

1. Click the Region/Market dropdown
2. Select a specific region (NCR, Luzon, Visayas, Mindanao) or "All Regions"
3. The dashboard updates to show data for the selected region

### Category/Product Filter

1. Click the Category/Product dropdown
2. Select a specific product category or "All Categories"
3. The dashboard updates to show data for the selected category

### Channel Filter

1. Click one of the channel buttons (All, Online, In-Store)
2. The dashboard updates to show data for the selected channel

### Custom Tags Filter

1. Click the Custom Tags dropdown
2. Select a specific tag (e.g., "Holiday Promo") or "All Tags"
3. The dashboard updates to show data for the selected tag

## Exporting Data

Export dashboard data for reports and presentations:

### Exporting to CSV

1. Click the "Export" button in the header
2. Select "Export as CSV" from the dropdown
3. Choose whether to export all data or only filtered data
4. Save the CSV file to your preferred location

### Exporting to PowerPoint

1. Click the "Export" button in the header
2. Select "Export as PPTX" from the dropdown
3. Choose whether to export all visualizations or only selected ones
4. Save the PPTX file to your preferred location

## Drill-Down Analysis

Explore detailed metrics by drilling down into specific KPIs:

### Accessing Drill-Down Views

1. Click on any KPI tile or chart element
2. The drill-down drawer appears with detailed analysis
3. Review charts, tables, and metrics related to the selected item

### Sales Drill-Down

When clicking the Total Sales KPI:
1. View sales breakdown by region
2. See month-over-month trends
3. Analyze year-over-year comparisons
4. Export specific sales data

### Conversion Drill-Down

When clicking the Conversion Rate KPI:
1. View the complete conversion funnel
2. See breakdown by store type
3. Analyze abandonment points
4. Compare against benchmarks

### ROI Drill-Down

When clicking the Marketing ROI KPI:
1. View ROI by channel
2. See investment vs. revenue breakdowns
3. Analyze ROI trends over time
4. Identify highest and lowest performing channels

### Sentiment Drill-Down

When clicking the Brand Sentiment KPI:
1. View sentiment trends over time
2. See sentiment breakdown by brand
3. Analyze top positive and negative phrases
4. View sentiment by product feature

## AI-Powered Insights

The dashboard includes AI-generated insights based on data analysis:

### Actionable Recommendations

The top section displays three actionable recommendations:
1. Each recommendation includes expected impact
2. Recommendations are prioritized by potential value
3. Click on any recommendation for implementation details

### Brand Dictionary

This section provides insights about brands:
1. Most mentioned brands and their trends
2. Key brand associations and attributes
3. Comparative brand positioning

### Emotional & Contextual Analysis

This section analyzes customer behavior:
1. Peak purchasing times and patterns
2. Contextual factors influencing purchases
3. Emotional triggers for product interest

### Bundling Opportunities

This section identifies product combination opportunities:
1. Products frequently purchased together
2. Correlation strengths between products
3. Potential basket size increase from bundling

## Frequently Asked Questions

### How often is the data updated?

The dashboard data is refreshed:
- Every 5 minutes for real-time mode
- On-demand for simulated mode
- The last updated timestamp is shown in the footer

### How is the data sourced?

Data comes from multiple sources:
- Edge devices in Sari-Sari stores (Raspberry Pi)
- Event Hubs for data streaming
- Delta Live Tables for data processing
- dbt models for business-level transformations

### How do I share specific views or insights?

To share specific dashboard views:
1. Apply filters to create the desired view
2. Export the view as PPTX
3. Or copy the URL including filter parameters
4. Recipients will see the same filtered view

### Can I save custom views?

Yes, you can save custom dashboard views:
1. Apply filters to create your custom view
2. Click the "Save View" button in the top right
3. Name your custom view
4. Access saved views from the "Saved Views" dropdown

## Troubleshooting

### Dashboard Not Loading

If the dashboard doesn't load:
1. Check your internet connection
2. Clear your browser cache
3. Try a different browser
4. Contact IT support if the issue persists

### Data Discrepancies

If you notice data discrepancies:
1. Check the selected date range
2. Verify filter selections
3. Toggle between simulated and real-time data
4. Check the data source information in the QA overlay (Alt + Shift + D)

### Export Problems

If you encounter export issues:
1. Try exporting a smaller dataset
2. Check if you have appropriate permissions
3. Make sure your browser allows downloads
4. Try a different export format

### Mobile View Issues

For mobile view problems:
1. Use landscape orientation
2. Try the "Request Desktop Site" option in your browser
3. Note that some visualizations may be simplified on mobile devices

---

For additional support, contact the TBWA Dashboard Support Team at dashboard-support@tbwa.com.