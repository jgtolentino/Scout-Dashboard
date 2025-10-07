# Client360 Dashboard Drill-Down API

This document describes the implementation and usage of the KPI drill-down functionality for the Client360 Dashboard.

## 📋 Overview

The drill-down API provides detailed breakdowns for KPI tiles in the Client360 Dashboard. When users click on a KPI tile, a drawer slides in from the right showing relevant detailed data, charts, and breakdowns.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Azure         │    │   Databricks    │
│   Dashboard     │────│   Functions     │────│   SQL           │
│                 │    │   API           │    │   Warehouse     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Click KPI tile     │                       │
         │ 2. Call /api/drilldown│                       │
         │                       │ 3. Query gold tables  │
         │                       │                       │
         │ 4. Render drawer with │                       │
         │    detailed data      │                       │
```

## 🚀 Quick Start

### 1. Deploy the API

```bash
# Set environment variables (optional, defaults will be used)
export FUNCTION_APP_NAME="client360-drilldown-api"
export RESOURCE_GROUP="rg-client360-dashboard"
export STORAGE_ACCOUNT="client360storage"

# Deploy to Azure
./deploy_drilldown_api.sh
```

### 2. Update Your Dashboard HTML

Add the drill-down handler script to your dashboard:

```html
<!-- Include the drill-down handler -->
<script src="js/drilldown_handler.js"></script>

<!-- Add data-kpi attributes to your KPI tiles -->
<div class="kpi-tile" data-kpi="total-sales">
    <h3>Total Sales</h3>
    <div class="kpi-value">₱2.5M</div>
</div>

<div class="kpi-tile" data-kpi="transactions">
    <h3>Transactions</h3>
    <div class="kpi-value">45,231</div>
</div>
```

### 3. Test the Integration

1. Click on any KPI tile with a `data-kpi` attribute
2. A drawer should slide in from the right
3. The API will be called and data will be displayed

## 📊 Available KPI Types

| KPI Key | Description | Data Source |
|---------|-------------|-------------|
| `total-sales` | Sales breakdown by region | `gold_store_metrics` |
| `transactions` | Transaction details by store | `gold_store_interaction_metrics` |
| `brand-sentiment` | Brand sentiment analysis | `gold_transcript_sentiment_analysis` |
| `conversion-rate` | Store conversion rates | `gold_store_metrics` |
| `growth-rate` | Store growth performance | `gold_store_metrics` |
| `store-performance` | Detailed store metrics | `gold_store_metrics` |
| `regional-performance` | Regional performance summary | Aggregated from multiple tables |

## 🔌 API Reference

### Drill-Down Endpoint

**GET** `/api/drilldown?kpi=<kpi-key>`

#### Parameters

- `kpi` (required): The KPI identifier (see table above)

#### Response Format

```json
{
  "kpi": "total-sales",
  "data": [
    {
      "region_name": "NCR",
      "total_sales": 1250000,
      "store_count": 125,
      "avg_growth_rate": 12.5,
      "as_of_date": "2025-01-21"
    }
  ],
  "timestamp": "2025-01-22T10:30:00Z",
  "count": 15
}
```

#### Error Response

```json
{
  "error": "Unrecognized KPI key: invalid-kpi",
  "kpi": "invalid-kpi"
}
```

### Example API Calls

```bash
# Get total sales drill-down
curl "https://your-function-app.azurewebsites.net/api/drilldown?kpi=total-sales"

# Get transaction details
curl "https://your-function-app.azurewebsites.net/api/drilldown?kpi=transactions"

# Get brand sentiment analysis
curl "https://your-function-app.azurewebsites.net/api/drilldown?kpi=brand-sentiment"
```

## 🎨 Frontend Integration

### HTML Structure

The drill-down handler automatically creates the necessary HTML elements:

```html
<!-- Overlay (created automatically) -->
<div id="drill-down-overlay" class="drill-down-overlay"></div>

<!-- Drawer (created automatically) -->
<div id="drill-down-drawer" class="drill-down-drawer">
    <div class="drill-down-header">
        <h3 id="drill-down-title">KPI Details</h3>
        <button id="drill-down-close">&times;</button>
        <div id="drill-down-subtitle">Loading...</div>
    </div>
    <div id="drill-down-loading">...</div>
    <div id="drill-down-content">...</div>
</div>
```

### JavaScript Usage

```javascript
// The handler is automatically initialized on page load
// You can also manually initialize it:
const drilldownHandler = new DrilldownHandler({
    apiBaseUrl: '/api',  // Custom API base URL
    drawerSelector: '#my-custom-drawer'  // Custom drawer element
});

// Programmatically show drill-down
drilldownHandler.showDrilldown('total-sales');

// Programmatically hide drill-down
drilldownHandler.hideDrilldown();
```

### Custom Styling

Override the default styles by adding CSS:

```css
.drill-down-drawer {
    width: 800px !important;  /* Make drawer wider */
    background: #f8f9fa !important;  /* Custom background */
}

.drill-down-metric {
    border-left-color: #your-brand-color !important;
}

.drill-down-table th {
    background-color: #your-brand-color !important;
    color: white !important;
}
```

## 🔧 Configuration

### Environment Variables

Set these in your Azure Function App:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABRICKS_SQL_HOST` | Databricks SQL endpoint host | - | No* |
| `DATABRICKS_SQL_TOKEN` | Access token for Databricks | - | No* |
| `DATABRICKS_SQL_PATH` | SQL warehouse path | - | No* |
| `KEY_VAULT_NAME` | Azure Key Vault name | - | No |
| `SIMULATION_MODE` | Use sample data instead of real DB | `true` | No |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` | No |

*Required for production use. In development, `SIMULATION_MODE=true` uses sample data.

### Database Configuration

The API connects to your Databricks SQL warehouse using the existing `DatabricksSQLConnector`. Ensure your gold layer tables are available:

- `client360.gold_store_metrics`
- `client360.gold_stores`
- `client360.gold_store_interaction_metrics`
- `client360.gold_transcript_sentiment_analysis`
- `client360.gold_brands`
- `client360.gold_regions`
- etc.

## 🧪 Testing

### Manual Testing

1. **Test API directly:**
   ```bash
   curl "https://your-function-app.azurewebsites.net/api/drilldown?kpi=total-sales"
   ```

2. **Test frontend integration:**
   - Open your dashboard
   - Click on any KPI tile with `data-kpi` attribute
   - Verify drawer opens and loads data

### Automated Testing

Create test cases for your specific KPIs:

```javascript
// Test API response
const response = await fetch('/api/drilldown?kpi=total-sales');
const data = await response.json();

console.assert(data.kpi === 'total-sales');
console.assert(Array.isArray(data.data));
console.assert(data.count >= 0);
```

## 🚨 Troubleshooting

### Common Issues

1. **API returns 500 error:**
   - Check Function App logs in Azure Portal
   - Verify database connection settings
   - Ensure Key Vault permissions are set correctly

2. **Drawer doesn't open:**
   - Check browser console for JavaScript errors
   - Verify `data-kpi` attribute is set on clickable elements
   - Ensure `drilldown_handler.js` is loaded

3. **No data displayed:**
   - Verify the KPI key is supported
   - Check if `SIMULATION_MODE` is enabled
   - Ensure database tables contain data

### Debug Mode

Enable debug logging:

```bash
az functionapp config appsettings set \
    --name "your-function-app" \
    --resource-group "your-resource-group" \
    --settings "LOG_LEVEL=debug"
```

### Logs Access

View logs in Azure Portal:

1. Go to your Function App
2. Navigate to **Functions** → **drilldown** → **Monitor**
3. Check **Invocations** and **Logs** tabs

## 🔄 Extending the API

### Adding New KPI Types

1. **Add to the switch statement in `api/drilldown/index.js`:**

```javascript
case 'my-new-kpi':
    drilldownData = await getMyNewKpiData(dbConnector);
    break;
```

2. **Implement the data retrieval function:**

```javascript
async function getMyNewKpiData(dbConnector) {
    const query = `
        SELECT 
            column1,
            column2,
            COUNT(*) as total
        FROM 
            client360.my_gold_table
        GROUP BY 
            column1, column2
        ORDER BY 
            total DESC
    `;
    
    return await dbConnector.executeQuery(query);
}
```

3. **Add frontend rendering in `js/drilldown_handler.js`:**

```javascript
case 'my-new-kpi':
    this.renderMyNewKpiDrilldown(content, data.data);
    break;
```

### Custom Data Visualization

Create custom visualization functions:

```javascript
renderMyCustomVisualization(container, data) {
    // Create charts using Chart.js, D3.js, or other libraries
    const chartHtml = `
        <div class="custom-chart">
            <canvas id="my-chart"></canvas>
        </div>
    `;
    
    container.innerHTML = chartHtml;
    
    // Initialize chart library
    // ... chart initialization code
}
```

## 📈 Performance Optimization

### Caching

The API includes built-in caching:

- Cache TTL: 5 minutes (configurable)
- Query-based cache keys
- Automatic cache invalidation

### Database Optimization

1. **Add indexes to frequently queried columns**
2. **Use materialized views for complex aggregations**
3. **Implement data partitioning for large tables**

### Frontend Optimization

1. **Lazy load drill-down handler**
2. **Implement client-side caching**
3. **Add loading skeletons for better UX**

## 🔒 Security

### Authentication

- Function App uses Azure AD integration
- API keys can be configured for additional security
- CORS settings restrict cross-origin requests

### Data Access

- Uses managed identity for Key Vault access
- Database connections use encrypted tokens
- All data queries are parameterized to prevent SQL injection

## 📚 Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Databricks SQL Connector](https://docs.databricks.com/integrations/jdbc-odbc-bi.html)
- [Client360 Dashboard Documentation](README.md)

## 🤝 Contributing

When adding new KPI types or features:

1. Update the KPI table in this README
2. Add appropriate test cases
3. Update the deployment script if needed
4. Document any new environment variables

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Azure Function App logs
3. Create an issue in the project repository