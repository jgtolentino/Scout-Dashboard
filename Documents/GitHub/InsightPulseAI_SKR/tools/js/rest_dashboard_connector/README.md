# REST API Dashboard Connector

This directory contains the implementation for the REST API-based dashboards that connect directly to ADLS Gen2 using Azure Functions as a secure API layer.

## Architecture Overview

```
Client Dashboard UI → Azure Function API → ADLS Gen2 (Gold container)
```

## Components

- **Azure Function API**: Secure proxy that connects to ADLS Gen2 with managed identity
- **Dashboard Visualizer**: JavaScript library for rendering KPI cards and charts
- **QA Tools**: Automated tests to verify data freshness and dashboard functionality

## Directory Structure

- `/azure-functions/` - API implementation for secure data access
- `/schema/` - Cube.js schema definitions (for Cube.js implementation option)
- `/qa/` - QA scripts and monitoring tools
- `retail_edge_visualizer.js` - Dashboard visualization library
- `LAKE_STRUCTURE.md` - Documentation of Bronze/Silver/Gold lake structure
- `SECURITY_SETUP.md` - Security configuration for ADLS Gen2 access

## Implementation Options

### Option A: REST API with Azure Functions

Uses Azure Functions with managed identity to securely access ADLS Gen2 data.

1. Azure Function authenticates using DefaultAzureCredential
2. Client dashboard calls API endpoints to fetch data
3. API reads directly from the Gold container

### Option B: Cube.js Semantic Layer

Optional implementation that uses Cube.js as a semantic layer over ADLS Gen2.

1. Cube.js connects to ADLS Gen2 using Athena-like direct mode
2. Dashboard queries Cube.js API for data
3. Benefits include caching, pre-aggregations, and access control

## Setup Instructions

1. Deploy Azure Functions app with system-assigned managed identity
2. Grant Storage Blob Data Reader role on Gold container to the function's identity
3. Add CORS configuration to allow dashboard domain
4. Deploy dashboard UI to Azure Static Web App or App Service

## Security Configuration

See `SECURITY_SETUP.md` for detailed security configuration instructions.

## Lake Structure

See `LAKE_STRUCTURE.md` for details on the Bronze/Silver/Gold pattern implementation.

## QA and Monitoring

The QA tools verify data freshness by checking a heartbeat file in the Gold container:

```bash
# Run freshness check
cd qa
npm install
npm run test:freshness
```

## Next Steps

1. Create CI/CD pipeline for automated deployment
2. Implement row-level security for brand-specific data
3. Add additional dashboard visualizations for new data sources