# Retail Dashboards for Pulser

This document outlines the retail dashboard deployments for Pulser, including the Retail Edge Interaction Dashboard and Retail Performance Uplift Dashboard.

## Overview

Two specialized dashboards have been developed to visualize customer interactions and campaign performance in retail environments:

1. **Retail Edge Interaction Dashboard** - Visualizes customer interactions from edge devices (Raspberry Pi 5) in physical retail environments
2. **Retail Performance Uplift Dashboard** - Campaign-level uplift tracking across in-store AI deployments

## Dashboard Access

### Option 1: Azure Cloud Deployment

The dashboards are deployed to Azure Blob Storage with static website hosting:

- **Retail Edge Dashboard:** https://retailedgedash0513.z13.web.core.windows.net/retail_edge_dashboard.html
- **Retail Performance Dashboard:** https://retailperfdash0513.z13.web.core.windows.net/retail_performance_dashboard.html

**Note:** Access to these URLs requires proper Azure AD permissions and network connectivity.

### Option 2: Local Development Server (Recommended)

For easier access during development and testing, use the local server:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/tools
./serve_retail_dashboards.sh
```

This will start a local web server (typically on port 8000) and provide:
- A landing page with links to both dashboards
- Access via `http://localhost:8000/`
- No need for Azure connectivity or permissions

## Technical Implementation

### Retail Edge Dashboard

The Retail Edge Interaction Dashboard includes:

- STT + face detection events per hour/day 
- Brand mention tracking (per camera node)
- Interaction quality score (per session)
- Conversion proxy via dwell time vs CTA triggers
- Edge device status monitoring

### Retail Performance Dashboard

The Retail Performance Uplift Dashboard includes:

- Before/after campaign uplift by SKU
- Real-time pricing effect (via smart shelf)
- Sentiment and voice tone correlation to action
- Aggregated brand lift metrics

### Architecture

Both dashboards follow a modern web application architecture:

- **Frontend:** HTML5/CSS3/Bootstrap 5/JavaScript with responsive design
- **Data Visualization:** Chart.js for interactive charts and visualizations
- **Data Source:** REST API endpoints for data retrieval
- **Hosting:** Azure Blob Storage with Static Website hosting

## Deployment

The dashboards are deployed using the Azure CLI through a simple deployment script:

```bash
# Deploy both dashboards
./deploy_retail_dashboards.sh

# CLI shortcuts (after loading aliases)
deploy-retail
```

## CLI Commands

After loading the CLI aliases, the following commands are available:

```bash
# Load aliases
source ./retail_cli_aliases.sh

# Main command with subcommands
retail-dashboard <subcommand>

# Open specific dashboards
retail-edge            # Opens Edge Dashboard
retail-performance     # Opens Performance Dashboard

# Deploy dashboards
deploy-retail          # Deploy both dashboards

# Check status
retail-status          # Show deployment status and URLs
```

## Pulser Integration

The dashboards integrate with the Pulser CLI system using the following aliases:

```bash
:retail-dashboard      # Main command
:retail-edge           # Open Edge Dashboard
:retail-performance    # Open Performance Dashboard
:deploy-retail         # Deploy dashboards
:retail-status         # Check status
```

## Development and Maintenance

### Directory Structure

```
/juicer-stack/dashboards/
├── retail_edge/
│   ├── retail_edge_dashboard.html
│   └── retail_edge_visualizer.js
├── retail_performance/
│   ├── retail_performance_dashboard.html
│   └── retail_performance_visualizer.js
└── README_RETAIL_DASHBOARDS.md
```

### Updating Dashboards

To update the dashboards:

1. Make changes to the relevant HTML/JS files
2. Run the deployment script:
   ```bash
   deploy-retail
   ```
3. Test the updated dashboards:
   ```bash
   retail-edge
   retail-performance
   ```

## Additional Notes

- Both dashboards include dark mode support
- All visualizations are responsive and work on desktop and mobile
- The dashboards use sample data for demonstration purposes
- Connection to real-time data sources will be implemented in Phase 2