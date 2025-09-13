# TBWA Client 360 Dashboard

> **At-a-glance** visibility across your entire business—Advisor metrics front & center, with one click drill-through.

## Overview

The TBWA Client 360 Dashboard is a unified analytics platform that integrates with the Scout DLT Pipeline to provide comprehensive visibility into business performance, customer insights, and operational metrics. The dashboard is specifically designed for businesses in the Philippines, with a focus on Sari-Sari store retail analytics.

![Dashboard Preview](./client360_dashboard/assets/dashboard_preview.png)

## Key Features

- **Unified View**: All key metrics in a single dashboard
- **Real-time Data**: Live connection to the Scout DLT Pipeline
- **AI-Powered Insights**: Actionable recommendations based on data analysis
- **Interactive Drill-Down**: One-click access to detailed metrics
- **Filipino Context**: Tailored for the Philippine market with Sari-Sari store analytics
- **Multi-Device Support**: Responsive design for desktop and tablet

## Directory Structure

```
client360_dashboard/
├── assets/                 # Images, icons, and other static assets
├── components/             # React components (if using React implementation)
├── data/                   # Data connectors and sample data
│   ├── dlt_connector.js    # Scout DLT Pipeline connector
│   ├── sample_data.json    # Sample data for development
│   └── sql_queries.js      # SQL queries for dashboard data
├── docs/                   # Documentation
│   └── USER_GUIDE.md       # Detailed user guide
├── scripts/                # Utility scripts
│   └── deploy.sh           # Deployment script
├── static/                 # Static HTML implementation
│   ├── css/                # CSS styles
│   │   └── dashboard.css   # Dashboard styles
│   ├── js/                 # JavaScript files
│   │   └── dashboard.js    # Dashboard functionality
│   └── index.html          # Main dashboard page
├── INTEGRATION_GUIDE.md    # Guide for integrating with Scout DLT Pipeline
└── package.json            # Project configuration
```

## Integration with Scout DLT Pipeline

The dashboard integrates with the following data layers from the Scout DLT Pipeline:

- **Bronze Layer**: Raw data from Raspberry Pi devices (transcriptions, visual detections)
- **Silver Layer**: Validated and enriched data (annotated events, device metrics)
- **Gold Layer**: Aggregated metrics and analytics (store performance, sentiment analysis)
- **Platinum Layer (dbt)**: Business-specific metrics and AI insights

For detailed integration instructions, see [INTEGRATION_GUIDE.md](./client360_dashboard/INTEGRATION_GUIDE.md).

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

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to Databricks SQL or equivalent database

### Installation

```bash
# Clone the repository
git clone https://github.com/tbwa/InsightPulseAI_SKR.git
cd InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard

# Install dependencies
npm install

# Start the development server
npm start
```

The dashboard will be available at `http://localhost:8080`.

### Configuration

Configure the data connection in `data/dlt_connector.js`:

```javascript
// Database connection
database: {
    user: process.env.DB_USER || 'your_databricks_user',
    host: process.env.DB_HOST || 'your_databricks_sql_endpoint',
    database: process.env.DB_NAME || 'scout_lakehouse',
    password: process.env.DB_PASSWORD || 'your_databricks_password',
    port: process.env.DB_PORT || 443,
    ssl: true
}
```

### Deployment

Deploy the dashboard to your preferred hosting platform:

```bash
# Deploy to Azure Static Web Apps
npm run deploy:azure

# Deploy to Vercel
npm run deploy:vercel

# Deploy to Netlify
npm run deploy:netlify

# Create a static deployment package
npm run deploy:static
```

## Usage

For detailed usage instructions, see the [User Guide](./client360_dashboard/docs/USER_GUIDE.md).

## Implementation Options

The dashboard is available in two implementations:

1. **Static HTML Implementation**
   - Pure HTML, CSS, and JavaScript
   - No build step required
   - Suitable for simple deployments
   - Located in the `static` directory

2. **React Implementation (Coming Soon)**
   - Component-based architecture
   - Enhanced interactivity
   - More sophisticated state management
   - Will be located in the `components` directory

## Customization

The dashboard can be customized to fit your specific needs:

1. **Branding**: Update logo and colors in `static/css/dashboard.css`
2. **Metrics**: Modify KPIs in `static/js/dashboard.js`
3. **Layout**: Adjust layout in `static/index.html`
4. **Data Source**: Configure data connection in `data/dlt_connector.js`

## Contributing

To contribute to the dashboard development:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Submit a pull request

Please follow the project's coding standards and include appropriate tests.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

For questions or support, contact:
- TBWA Dashboard Team: dashboard-team@tbwa.com
- Data Engineering Team: data-engineering@tbwa.com