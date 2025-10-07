# TBWA Client 360 Dashboard Implementation

This directory contains the implementation of the TBWA Client 360 Dashboard, a unified analytics interface providing at-a-glance visibility across the entire business with Advisor metrics as the focal point.

## Overview

The Client 360 Dashboard integrates data from the Scout DLT pipeline to create a comprehensive view of business performance, customer insights, and operational metrics. It follows the design specifications outlined in the dashboard blueprint, with customizations tailored to Sari-Sari store analytics in the Philippines.

## Directory Structure

```
client360_dashboard/
├── README.md                    # This file
├── DASHBOARD_ROLLBACK_GUIDE.md  # Guide for rolling back to stable version
├── DEPLOYMENT_VERIFICATION.md   # Deployment verification process
├── assets/                      # Images, icons, and other static assets
├── components/                  # React components (if using React implementation)
│   ├── Header.jsx               # Global header & controls
│   ├── KpiTiles.jsx             # High-level KPI tiles
│   ├── FilterBar.jsx            # Unified filter bar
│   ├── VisualGrid.jsx           # Business performance visual grid
│   ├── InsightPanel.jsx         # AI-powered insight panel
│   ├── DrillDownDrawer.jsx      # Drill-down drawer
│   └── Footer.jsx               # Footer & diagnostic
├── static/                      # Static HTML prototype
│   ├── index.html               # Main dashboard page
│   ├── css/                     # CSS styles
│   └── js/                      # JavaScript files
├── data/                        # Sample data and connectors
│   ├── sample_data.json         # Sample data for development
│   ├── dlt_connector.js         # Connector to Scout DLT pipeline
│   ├── sql_queries.js           # SQL queries for dashboard data
│   ├── audio_visual_correlation.js # Audio-visual correlation engine
│   └── transcript_analysis_extension.js # Transcript analysis functions
└── scripts/                     # Utility scripts
    ├── deploy.sh                # Deployment script
    ├── rollback_dashboard.sh    # Dashboard rollback script
    └── test_data_flow.js        # Script to test data flow
```

## DLT Data Integration

The Client 360 Dashboard connects to the Scout DLT pipeline using the following layers:

### Bronze Layer
- `bronze_transcriptions` - Raw speech-to-text data (with AudioURL in rollback version)
- `bronze_vision_detections` - Raw visual detection data
- `bronze_device_logs` - Device health and diagnostic data

### Silver Layer
- `silver_annotated_events` - Annotated interaction events
- `silver_device_heartbeat` - Device health and status
- `silver_multimodal_aligned` - Aligned speech and visual data

### Gold Layer
- `gold_store_interaction_metrics` - Store-level metrics
- `gold_device_health_summary` - Device health summaries
- `gold_transcript_sentiment_analysis` - Sentiment analysis of customer transcripts

### Platinum Layer (DBT Models)
- `platinum_interaction_summary` - Aggregated interaction summaries
- `platinum_brand_insights` - Brand mention and performance metrics
- `platinum_feature_store` - ML features for recommendations
- `platinum_promo_recommendations` - AI-generated promotional recommendations

## Dashboard Components

1. **Global Header & Controls**
   - Brand + Title: "TBWA Client 360 Dashboard"
   - Date selector: Last 7/30/90 days or custom date range
   - Data-source toggle: Switch between simulated and real-time data
   - Export: Export dashboard as CSV or PPTX
   - Global search: Search by keyword, store ID, etc.

2. **High-Level KPI Tiles**
   - Total Sales: Sum of all sales transactions
   - Conversion Rate: Percentage of interactions resulting in sales
   - Marketing ROI: Return on marketing investment
   - Brand Sentiment: Overall sentiment score for brands

3. **Unified Filter Bar**
   - Organization/Brand: Filter by TBWA client organization
   - Region/Market: Filter by geographic region in the Philippines
   - Category/Product Line: Filter by product category
   - Channel: All, Online, In-Store
   - Custom Tags: Filter by custom tags

4. **Business-Performance Visual Grid**
   - Brand Performance: KPI card + horizontal gauge
   - Competitor Analysis: Bullet chart with attention flag
   - Retail Performance: KPI + sparkline trend
   - Marketing ROI: Donut chart + KPI percentage

5. **AI-Powered Insight Panel**
   - Top 3 Actionable Recommendations
   - Brand Dictionary: Refined insights on brand associations
   - Emotional & Contextual Analysis: Decision triggers and trends
   - Bundling Opportunities: Product combinations for promotions

6. **Drill-Down Drawer**
   - Detail visuals for selected KPIs or chart elements
   - Preset filters for quick analysis
   - "Apply to all visuals" global toggle
   - Export options for the current view

7. **Footer & Diagnostic**
   - Legend explaining icons and color codes
   - Last updated timestamp
   - QA overlay (accessible via Alt + Shift + D)

## Implementation Options

This repository provides two implementation options:

1. **React + Tailwind Components**
   - Full interactive dashboard with React components
   - Real-time data updates
   - Drill-down capabilities
   - AI insights integration

2. **Static HTML Prototype**
   - Lightweight HTML prototype with Tailwind CSS
   - Sample data visualizations
   - Basic interactivity
   - Suitable for quick demonstrations

## Getting Started

### Prerequisites
- Node.js and npm (for React implementation)
- Access to Scout DLT pipeline data
- Azure SQL credentials (if connecting to live data)

### Installation

For React implementation:
```bash
cd client360_dashboard
npm install
npm start
```

For static HTML prototype:
```bash
cd client360_dashboard/static
# Open index.html in your browser
```

### Data Configuration

Configure the data sources in `data/dlt_connector.js`:
```javascript
// Example configuration
const dltConfig = {
  dataSource: "Azure SQL",
  connectionString: process.env.AZURE_SQL_CONNECTION_STRING,
  refreshInterval: 300000, // 5 minutes
  useSimulatedData: false
};
```

## Test Data

The dashboard includes sample data for development and testing:
- Simulated Sari-Sari store transactions
- Brand mentions and sentiment analysis
- Device health metrics
- Customer interactions

To test with sample data:
```bash
node scripts/test_data_flow.js
```

## Deployment

To deploy the dashboard:
```bash
./scripts/deploy.sh --target=[azure|vercel|netlify]
```

## Rollback

In case of deployment issues or styling problems, the dashboard can be rolled back to a previous stable version:

### Automated Rollback Implementation (New)

Use the new rollback implementation script for a comprehensive rollback process:

```bash
./scripts/implement_rollback_dashboard.sh
```

This script will:
- Create a backup of the current deployment
- Extract files from a known working backup
- Verify essential files like GeoJSON map data
- Create a deployment package
- Copy the package to the Desktop
- Offer to deploy to Azure Static Web Apps

After rollback, verify the implementation with:

```bash
./scripts/verify_rollback_implementation.sh
```

This will check both local and remote files and create a detailed verification report.

For complete instructions, see [ROLLBACK_IMPLEMENTATION_GUIDE.md](./ROLLBACK_IMPLEMENTATION_GUIDE.md).

### Legacy Rollback Method

The repository also maintains a legacy rollback script that uses git tags:

```bash
./scripts/rollback_dashboard.sh
```

This will restore the dashboard to the golden version tagged as `golden-20250519`. For more information on this legacy process, see [DASHBOARD_ROLLBACK_GUIDE.md](./DASHBOARD_ROLLBACK_GUIDE.md).

### Golden Baseline

The repository maintains golden baselines for stable dashboard versions, which can be used for rollback in case of issues. These baselines are:
1. **Git Tags**: Tagged in git with the `golden-YYYYMMDD` format
2. **Output Zip Files**: Stored in the `output` directory with timestamps 
3. **Backup Directories**: Created automatically during rollback operations

## Power BI Parity Audit App

The repository includes a Power BI Parity Audit App for ensuring visual consistency between dashboards:

### Overview

The audit app provides:
- Side-by-side comparison between Power BI dashboards and Dash equivalents
- Visual parity checking for all dashboard components
- Data consistency validation
- Automated audit reporting

### Usage

To run the audit app with the dashboard:
```bash
./run_with_audit.sh
```

This will start:
- The Client 360 Dashboard on port 8000
- The Parity Audit App on port 8080

### Deployment

The audit app can be deployed to Azure using the provided deployment script:
```bash
cd audit
./deployment.sh
```

For more information, see the [Audit App README](./audit/README.md).

## Additional Resources

- [Scout DLT Pipeline Documentation](../README.md)
- [SARI_SARI_DASHBOARD_GUIDE.md](../SARI_SARI_DASHBOARD_GUIDE.md)
- [Dashboard Blueprint](../client360_dashboard/assets/dashboard_blueprint.md)
- [Power BI Parity Audit Documentation](./audit/README.md)

### Rollback & Verification Documentation
- [Rollback Implementation Guide](./ROLLBACK_IMPLEMENTATION_GUIDE.md) - Comprehensive rollback implementation guide
- [Data Toggle Fix Plan](./DATA_TOGGLE_FIX_PLAN.md) - Plan to fix data toggle issues
- [Dashboard Rollback Guide](./DASHBOARD_ROLLBACK_GUIDE.md) - Legacy rollback guide
- [Deployment Verification](./DEPLOYMENT_VERIFICATION.md) - Deployment verification process
- [Geospatial Map Verification](./GEOSPATIAL_MAP_VERIFICATION.md) - Store map verification guide
- [Sari-Sari Enhancement Summary](./SARI_SARI_ENHANCEMENT_SUMMARY.md) - Summary of Sari-Sari store enhancements