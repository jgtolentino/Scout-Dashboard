# Client360 Dashboard Onboarding Guide

## Overview

Client360 Dashboard is a comprehensive analytics platform providing retail store performance insights, customer interaction analysis, and brand visibility tracking. Built for TBWA clients, it delivers real-time store metrics, sales data visualization, and geographical performance trends through an interactive web interface.

## Key Features

- **Interactive KPI Monitoring**: Real-time performance indicators
- **Geospatial Analysis**: Store performance visualizations on interactive maps
- **Data Source Flexibility**: Toggle between live Databricks data and sample data
- **Multi-Brand Theming**: TBWA and SariSari theme configurations
- **Rollback System**: Safe reversion to previous dashboard versions
- **SQL Data Connection**: Direct integration with Databricks SQL

## Architecture

The dashboard follows a modern web architecture pattern:

```
Client Browser → Azure Static Web App → Azure API Gateway → Analytics API → Databricks SQL
```

Edge devices (Pi 5) collect data and send events to Azure IoT Hub/Event Hubs, which are processed via Databricks Autoloader into a Delta Lakehouse using a medallion architecture (Bronze, Silver, Gold layers).

## Codebase Structure

- **`/client360_dashboard/`**: Root directory
  - **`/src/`**: Source code
    - **`/components/`**: Reusable UI components
    - **`/connectors/`**: Backend connection modules
    - **`/styles/`**: SCSS files for theming
    - **`/themes/`**: Theme configurations (TBWA, SariSari)
  - **`/data/`**: Data connectors and sample data
    - **`databricks_sql_connector.js`**: Databricks SQL integration
    - **`sample_data.json`**: Sample data for offline development
  - **`/deploy/`**: Deployment-ready assets
  - **`/js/`**: Core JavaScript functionality
    - **`dashboard.js`**: Main dashboard initialization
    - **`components/`**: Dashboard widgets
  - **`/scripts/`**: Build and deployment scripts
  - **`webpack.config.js`**: Build configuration
  - **`package.json`**: Dependencies and scripts

## Theme System

The dashboard supports multiple themes through SCSS variables:

- **TBWA Theme**: Corporate theme with navy blue and cyan accents
  - Configured in `/src/styles/variables-tbwa.scss`
- **SariSari Theme**: Retail-focused theme with vibrant colors
  - Configured in `/src/styles/variables-sarisari.scss`

Themes are compiled using webpack and can be switched dynamically.

## Data Connection

The dashboard connects to data through a flexible connector system:

1. **Databricks SQL Connector**: 
   - Located in `/data/databricks_sql_connector.js`
   - Supports Azure Key Vault integration for secure token storage
   - Includes query caching and error handling
   - Falls back to simulation mode if connection fails

2. **Simulation Mode**:
   - Uses sample data from `/data/sample_data.json`
   - Enables offline development without database access
   - Activated automatically if database connection fails

## Development Environment Setup

### Prerequisites

1. **Node.js**: v16+ required
2. **Package Manager**: npm or yarn
3. **Build Tools**: webpack for SCSS compilation
4. **Local Environment**: `.env.local` file with configuration

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd client360_dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Configure required variables (or use simulation mode)

4. **Run development build**:
   ```bash
   npm run build:dev
   # or 
   yarn build:dev
   ```

5. **Watch for changes during development**:
   ```bash
   npm run watch
   # or
   yarn watch
   ```

6. **Start local server**:
   ```bash
   ./run_local_server.sh
   ```

## Building for Production

1. **Compile SCSS themes**:
   ```bash
   npm run build:themes
   # or
   yarn build:themes
   ```

2. **Prepare deployment package**:
   ```bash
   ./deploy_360_dashboard.sh
   ```

This creates a deployment-ready package in the `/deploy/` directory.

## Deployment

The dashboard uses Azure Static Web Apps for hosting:

1. **Manual deployment**:
   ```bash
   ./deploy_to_azure.sh
   ```

2. **CI/CD Pipeline**: Automated deployment via Azure DevOps or GitHub Actions
   - Configured in `/.github/workflows/deploy-client360.yml`
   - Supports blue-green deployment for zero downtime

The dashboard is deployed to:
- Production: `https://blue-coast-0acb6880f.azurestaticapps.net/360/`
- QA/Staging: `https://blue-coast-0acb6880f-qa.azurestaticapps.net/360/`

## Testing

- **Cypress E2E Tests**: Run with `npm test` or `yarn test`
- **Open Cypress UI**: Run with `npm run test:open` or `yarn test:open`

## Rollback System

The dashboard includes a built-in rollback component allowing authorized users to:
1. Verify current system state
2. View available previous versions
3. Rollback to stable versions when needed

This system uses Azure Static Web Apps slot functionality to maintain multiple deployment versions.

## Working with Data Connections

- **Live Data**: Configure Databricks connection in `.env.local`:
  ```
  DATABRICKS_SQL_HOST=adb-123456789012345.6.azuredatabricks.net
  DATABRICKS_SQL_PATH=/sql/1.0/warehouses/abcdefg1234567890
  DATABRICKS_SQL_TOKEN=your_token_here
  ```

- **Sample Data**: Enable simulation mode:
  ```
  SIMULATION_MODE=true
  ```

## Troubleshooting

- **Dashboard Not Loading**: Check network connectivity and browser cache
- **Data Not Refreshing**: Verify data source toggle settings
- **Theme Issues**: Check compiled CSS in browser inspector
- **Deployment Failures**: Review Azure Static Web App logs

## Additional Resources

- **SQL Schema**: See `/docs/sql_schema.md`
- **API Documentation**: Available in `/docs/api_docs.md`
- **Deployment Guide**: See `/DEPLOYMENT_PIPELINE.md`

## Best Practices

1. **Theme Development**: Always test changes against both themes
2. **Data Handling**: Use simulation mode for local development
3. **Component Creation**: Follow existing patterns for consistency
4. **Deployment**: Test on QA before promoting to production
5. **Version Control**: Create feature branches for new development

## Support and Contact

For technical support, contact the TBWA development team at `support@tbwa.com`.