#!/bin/bash
# Set up Azure Monitor alerts for the Client360 Dashboard
set -e

echo "⚙️ Setting up monitoring for Client360 Dashboard..."

# Resource group and app name
RG="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"

# Get the resource ID for the Static Web App
RESOURCE_ID=$(az staticwebapp show --name "$APP_NAME" --resource-group "$RG" --query id -o tsv)

if [ -z "$RESOURCE_ID" ]; then
    echo "❌ Could not find Static Web App $APP_NAME"
    exit 1
fi

echo "📍 Found Static Web App: $RESOURCE_ID"

# Create availability alert (HTTP 5xx errors)
echo "🚨 Creating HTTP 5xx error alert..."
az monitor metrics alert create \
    --name "Client360Dashboard5xxErrors" \
    --resource-group "$RG" \
    --scopes "$RESOURCE_ID" \
    --condition "count Http5xx > 5" \
    --description "Alert when dashboard has 5xx errors" \
    --evaluation-frequency 5m \
    --window-size 5m \
    --severity 1

# Create latency alert
echo "⏱️ Creating latency alert..."
az monitor metrics alert create \
    --name "Client360DashboardLatency" \
    --resource-group "$RG" \
    --scopes "$RESOURCE_ID" \
    --condition "avg SuccessE2ELatency > 2000" \
    --description "Alert when dashboard response time exceeds 2 seconds" \
    --evaluation-frequency 5m \
    --window-size 5m \
    --severity 2

# Set up Log Analytics workspace if not exists
WORKSPACE_NAME="client360-dashboard-logs"
WORKSPACE_ID=$(az monitor log-analytics workspace show --resource-group "$RG" --workspace-name "$WORKSPACE_NAME" --query id -o tsv 2>/dev/null || echo "")

if [ -z "$WORKSPACE_ID" ]; then
    echo "📊 Creating Log Analytics workspace..."
    az monitor log-analytics workspace create \
        --resource-group "$RG" \
        --workspace-name "$WORKSPACE_NAME" \
        --location eastus
    
    WORKSPACE_ID=$(az monitor log-analytics workspace show --resource-group "$RG" --workspace-name "$WORKSPACE_NAME" --query id -o tsv)
fi

# Enable diagnostics settings
echo "🔍 Enabling diagnostic settings..."
az monitor diagnostic-settings create \
    --name "Client360DiagnosticSettings" \
    --resource "$RESOURCE_ID" \
    --workspace "$WORKSPACE_ID" \
    --logs '[{"category": "StaticSiteLogsCategory","enabled": true}]' \
    --metrics '[{"category": "AllMetrics","enabled": true}]'

# Create uptime test web test
echo "🌐 Setting up availability test..."
WEBTEST_LOCATION="eastus"

az deployment group create \
    --resource-group "$RG" \
    --template-file - \
    --parameters appName="$APP_NAME" location="$WEBTEST_LOCATION" webTestName="client360-uptime-test" <<EOF
{
    "\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {
        "appName": {
            "type": "string"
        },
        "location": {
            "type": "string"
        },
        "webTestName": {
            "type": "string"
        }
    },
    "resources": [
        {
            "name": "[parameters('webTestName')]",
            "type": "Microsoft.Insights/webtests",
            "apiVersion": "2015-05-01",
            "location": "[parameters('location')]",
            "tags": {
                "[concat('hidden-link:', resourceId('Microsoft.Web/sites', parameters('appName')))]": "Resource"
            },
            "properties": {
                "Name": "[parameters('webTestName')]",
                "Description": "Client360 Dashboard Availability Test",
                "Enabled": true,
                "Frequency": 300,
                "Timeout": 120,
                "Kind": "ping",
                "RetryEnabled": true,
                "Locations": [
                    {
                        "Id": "us-va-ash-azr"
                    },
                    {
                        "Id": "us-tx-sn1-azr"
                    },
                    {
                        "Id": "us-il-ch1-azr"
                    }
                ],
                "Configuration": {
                    "WebTest": "[concat('<WebTest Name=\"', parameters('webTestName'), '\" Enabled=\"True\" Timeout=\"120\" xmlns=\"http://microsoft.com/schemas/VisualStudio/TeamTest/2010\"><Items><Request Method=\"GET\" Version=\"1.1\" Url=\"https://', reference(resourceId('Microsoft.Web/staticSites', parameters('appName'))).defaultHostname, '/\" /></Items></WebTest>')]"
                }
            }
        }
    ]
}
EOF

echo "✅ Monitoring setup complete!"
echo "You can view alerts and metrics in the Azure Portal under:"
echo "- Azure Monitor > Alerts"
echo "- Azure Monitor > Metrics"
echo "- Log Analytics workspace: $WORKSPACE_NAME"