# Market Intelligence Integration

This directory contains the implementation for integrating professional market data APIs with the Juicer dashboards.

## Overview

The Market Intelligence integration adds industry, market, and competitor context to brand analysis dashboards, creating a more comprehensive view for business decisions.

## Components

- **Azure Functions**: Secure adapters for connecting to professional APIs
- **Pulser Agent**: MarketAgent for handling market intelligence queries
- **Dashboard Components**: UI elements for displaying external market data

## Supported Data Providers

| Provider | Data Type | License Type | Integration Status |
|----------|-----------|--------------|-------------------|
| Bloomberg | Financial & Market | Enterprise | Ready to Configure |
| S&P Global | Industry & Sector | Professional | Ready to Configure |
| Brandwatch | Social & Sentiment | Business | Ready to Configure |
| Crunchbase | Competitor & Funding | Business+ | Ready to Configure |
| Factiva | News & Media | Professional | Planned |
| Nielsen | Consumer Behavior | Enterprise | Planned |

## Setup Instructions

### 1. API License Acquisition

1. Obtain appropriate licenses for selected data providers:
   - Bloomberg Enterprise API: Contact Bloomberg sales 
   - S&P Global Market Intelligence API: https://www.spglobal.com/marketintelligence/en/contact-us
   - Brandwatch API: https://www.brandwatch.com/contact
   - Crunchbase Enterprise API: https://about.crunchbase.com/contact-us/

2. Store API credentials in Azure Key Vault:
   ```bash
   # Login to Azure
   az login
   
   # Create Key Vault (if not exists)
   az keyvault create --name tbwa-market-intelligence --resource-group tbwa-analytics-rg --location eastus2
   
   # Add API key secrets
   az keyvault secret set --vault-name tbwa-market-intelligence --name bloomberg-api-key --value "YOUR_API_KEY"
   az keyvault secret set --vault-name tbwa-market-intelligence --name spglobal-api-key --value "YOUR_API_KEY"
   az keyvault secret set --vault-name tbwa-market-intelligence --name brandwatch-api-credentials --value "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"
   az keyvault secret set --vault-name tbwa-market-intelligence --name crunchbase-api-key --value "YOUR_API_KEY"
   ```

### 2. Azure Functions Deployment

1. Deploy the market data adapter function:
   ```bash
   cd azure-functions
   func azure functionapp publish tbwa-market-intelligence-api
   ```

2. Grant Key Vault access to the function's managed identity:
   ```bash
   # Get function app's managed identity
   functionAppId=$(az functionapp identity show --name tbwa-market-intelligence-api --resource-group tbwa-analytics-rg --query principalId --output tsv)
   
   # Grant Key Vault access
   az keyvault set-policy --name tbwa-market-intelligence --object-id $functionAppId --secret-permissions get list
   ```

### 3. Pulser Agent Configuration

1. Register the MarketAgent with Pulser:
   ```bash
   cp pulser/market-agent.yaml /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/agents/
   ```

2. Update the Pulser agent registry:
   ```bash
   pulser agent register MarketAgent
   ```

3. Verify the agent is properly registered:
   ```bash
   pulser agent list
   ```

### 4. Dashboard Integration

1. Add Market Context Panel to insights dashboard:
   ```bash
   cp dashboard-components/market-context-panel.js /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/rest_dashboard_connector/
   ```

2. Add Competitor Comparison to insights dashboard:
   ```bash
   cp dashboard-components/competitor-comparison.js /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/rest_dashboard_connector/
   ```

## Usage Examples

### Command Line

```bash
# Get market overview for a brand
:market overview Jollibee

# Get industry trends
:market trends restaurant --period 90d

# Compare a brand with competitors
:competitor compare Globe --vs Smart,PLDT

# Get detailed competitor profile
:competitor profile Smart Communications
```

### Natural Language Queries

The MarketAgent responds to natural language queries like:

- "What's the market position of Jollibee compared to competitors?"
- "Show me industry trends for telecommunications in the Philippines"
- "Give me a financial summary of PLDT"
- "How is Globe Telecom performing in social sentiment compared to industry average?"

## Cost Management

To keep API usage costs under control, the implementation includes:

1. **Aggressive Caching**: Data is cached for up to 1 hour to minimize API calls
2. **Usage Monitoring**: Azure Application Insights tracks API call volume
3. **Quota Limits**: Default daily quotas prevent unexpected usage spikes

## Data Storage Pattern

The implementation follows the Bronze/Silver/Gold pattern:

1. **Bronze**: Raw API responses stored by date in ADLS Gen2
2. **Silver**: Normalized market data with standardized schema
3. **Gold**: Combined internal + external data in business-ready views

## Next Steps

1. Deploy the functions and obtain API licenses
2. Test with sample brands and document performance
3. Expand to additional data providers as needed