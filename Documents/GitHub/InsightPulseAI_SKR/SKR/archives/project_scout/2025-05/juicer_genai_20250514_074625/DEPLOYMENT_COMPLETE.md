# JuicyChat Deployment Complete

The Chat with Data (GENIE-equivalent) module has been successfully deployed across all dashboards.

## Deployment Status

✅ **API Server**: Running on port 8889
✅ **Dashboard Integration**: Completed for all dashboards
✅ **UI Component**: Integrated as a floating chat button
✅ **Local Serving**: Available via serve_dashboards_locally.sh

## How to Access

### API Server

The JuicyChat API is running at:
```
http://localhost:8889/api/juicer/query
```

API documentation is available at:
```
http://localhost:8889/docs
```

### Dashboards

Dashboards with JuicyChat are available locally at:
```
http://localhost:8080/
```

To serve dashboards locally:
```bash
./serve_dashboards_locally.sh
```

## Available Dashboards

The following dashboards have been updated with JuicyChat:

1. Main dashboards:
   - `index.html`
   - `insights_dashboard.html`
   - `juicer_dash_shell.html`

2. Client-facing dashboards:
   - `retail_advisor_insights_dashboard.html`
   - `retail_advisor_insights.html`

## Testing JuicyChat

You can test JuicyChat with these example queries:

- "Compare sales uplift for Campaign B vs A in NCR"
- "How many brand mentions did Jollibee get last quarter?"
- "What insights have we gathered about vegetarian menu items?"

## Azure Deployment

For deployment to Azure, ensure you have:

1. A valid Azure subscription
2. The correct resource group: "RG-TBWA-ProjectScout-Juicer" (Project Scout naming convention)
3. A storage account: "tbwajuicerstorage" (Project Scout naming convention)
4. A container named "$web" for static website hosting

The script has been updated to align with Project Scout's Azure resource naming conventions. To deploy:

```bash
./deploy_dashboards_with_chat.sh
```

You can also override the default values by setting environment variables:
```bash
RESOURCE_GROUP=your-resource-group STORAGE_ACCOUNT=your-storage-account ./deploy_dashboards_with_chat.sh
```

## Troubleshooting

If you encounter issues:

1. **API Connection Errors**:
   - Verify the API is running: `curl http://localhost:8889/health`
   - Check API logs: `cat juicychat_api_8889.log`

2. **Dashboard Loading Issues**:
   - Ensure the correct API endpoint is configured
   - Check browser console for JavaScript errors

3. **CORS Issues**:
   - When accessing from different domains, ensure CORS is properly configured

## Next Steps

1. **Production Deployment**:
   - Set up proper authentication for the API
   - Configure secure access to LLM API keys
   - Connect to actual Databricks tables

2. **Enhanced Features**:
   - Add context awareness based on dashboard filters
   - Implement chat history persistence
   - Add support for more complex visualizations

## Support

For assistance with JuicyChat:
- Check `JUICYCHAT_INTEGRATION.md` for implementation details
- See `README_GENIE_INTEGRATION.md` for architecture overview