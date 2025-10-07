#!/bin/bash

# Azure Monitoring Setup for Client360 Dashboard
# This script sets up Application Insights and Azure Monitor alerts

set -e

# Configuration
RESOURCE_GROUP="rg-client360-dashboard"
LOCATION="eastus"
APP_NAME="client360-dashboard"
PRODUCTION_URL="https://proud-forest-0224c7a0f.6.azurestaticapps.net"
NOTIFICATION_EMAIL="team@tbwa.com"

echo "🔧 Setting up Azure monitoring for Client360 Dashboard..."

# Create Application Insights if it doesn't exist
echo "📊 Creating Application Insights..."
az monitor app-insights component create \
  --app "$APP_NAME-insights" \
  --location "$LOCATION" \
  --resource-group "$RESOURCE_GROUP" \
  --application-type web \
  --retention-time 90 \
  --tags environment=production service=client360-dashboard

# Get the instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app "$APP_NAME-insights" \
  --resource-group "$RESOURCE_GROUP" \
  --query instrumentationKey -o tsv)

echo "📈 Application Insights created with key: ${INSTRUMENTATION_KEY:0:8}..."

# Create action group for notifications
echo "📧 Creating notification action group..."
az monitor action-group create \
  --name "$APP_NAME-alerts" \
  --resource-group "$RESOURCE_GROUP" \
  --short-name "Client360" \
  --email-receivers \
    name="TeamNotification" \
    email="$NOTIFICATION_EMAIL"

# Create availability test
echo "🔍 Creating availability test..."
cat > availability-test.xml << EOF
<WebTest Name="Client360-Dashboard-Availability" 
         Id="$(uuidgen)" 
         Enabled="True" 
         CssProjectStructure="" 
         CssIteration="" 
         Timeout="120" 
         WorkItemIds="" 
         xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" 
         Description="" 
         CredentialUserName="" 
         CredentialPassword="" 
         PreAuthenticate="True" 
         Proxy="default" 
         StopOnError="False" 
         RecordedResultFile="" 
         ResultsLocale="">
  <Items>
    <Request Method="GET" 
             Guid="$(uuidgen)" 
             Version="1.1" 
             Url="$PRODUCTION_URL" 
             ThinkTime="0" 
             Timeout="120" 
             ParseDependentRequests="False" 
             FollowRedirects="True" 
             RecordResult="True" 
             Cache="False" 
             ResponseTimeGoal="0" 
             Encoding="utf-8" 
             ExpectedHttpStatusCode="200" 
             ExpectedResponseUrl="" 
             ReportingName="" 
             IgnoreHttpStatusCode="False" />
  </Items>
  <ValidationRules>
    <ValidationRule Classname="Microsoft.VisualStudio.TestTools.WebTesting.Rules.ValidateResponseUrl" 
                    DisplayName="Response URL" 
                    Description="Validates that the response URL after redirects are followed is the same as the recorded response URL." 
                    Level="High" 
                    ExectuionOrder="BeforeDependents" />
    <ValidationRule Classname="Microsoft.VisualStudio.TestTools.WebTesting.Rules.ValidationRuleFindText" 
                    DisplayName="Find Text" 
                    Description="Verifies the existence of the specified text in the response." 
                    Level="High" 
                    ExectuionOrder="BeforeDependents">
      <RuleParameters>
        <RuleParameter Name="FindText" Value="Client360" />
        <RuleParameter Name="IgnoreCase" Value="False" />
        <RuleParameter Name="UseRegularExpression" Value="False" />
        <RuleParameter Name="PassIfTextFound" Value="True" />
      </RuleParameters>
    </ValidationRule>
  </ValidationRules>
</WebTest>
EOF

# Create the availability test
az monitor app-insights web-test create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME-availability" \
  --location "$LOCATION" \
  --web-test-kind "ping" \
  --locations "East US" "West US" "Central US" \
  --frequency 300 \
  --timeout 120 \
  --http-verb "GET" \
  --request-url "$PRODUCTION_URL" \
  --expected-status-code 200 \
  --success-criteria-check-for-text "Client360" \
  --app-insights-name "$APP_NAME-insights"

echo "✅ Availability test created"

# Create alert rules
echo "🚨 Creating alert rules..."

# High error rate alert
az monitor metrics alert create \
  --name "$APP_NAME-high-error-rate" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_NAME-insights" \
  --condition "avg requests/failed > 5" \
  --window-size "5m" \
  --evaluation-frequency "1m" \
  --severity 2 \
  --description "Alert when error rate is high" \
  --action-groups "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/actionGroups/$APP_NAME-alerts"

# Availability alert
az monitor metrics alert create \
  --name "$APP_NAME-availability-down" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/webtests/$APP_NAME-availability" \
  --condition "avg availabilityResults/availabilityPercentage < 95" \
  --window-size "5m" \
  --evaluation-frequency "1m" \
  --severity 1 \
  --description "Alert when availability drops below 95%" \
  --action-groups "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/actionGroups/$APP_NAME-alerts"

# Performance alert
az monitor metrics alert create \
  --name "$APP_NAME-slow-response" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_NAME-insights" \
  --condition "avg requests/duration > 5000" \
  --window-size "10m" \
  --evaluation-frequency "5m" \
  --severity 3 \
  --description "Alert when average response time exceeds 5 seconds" \
  --action-groups "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/actionGroups/$APP_NAME-alerts"

echo "✅ Alert rules created"

# Create dashboard
echo "📋 Creating Azure Dashboard..."
cat > dashboard.json << EOF
{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "ComponentId",
                "value": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_NAME-insights"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AppMapGallerPt"
          }
        },
        "1": {
          "position": {
            "x": 6,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "ComponentId",
                "value": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_NAME-insights"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AvailabilityTestsGalleryPt"
          }
        }
      }
    }
  }
}
EOF

# Output configuration
echo ""
echo "🎉 Azure monitoring setup completed!"
echo ""
echo "📊 Application Insights:"
echo "   - Name: $APP_NAME-insights"
echo "   - Instrumentation Key: ${INSTRUMENTATION_KEY:0:8}..."
echo "   - Resource Group: $RESOURCE_GROUP"
echo ""
echo "🚨 Alerts configured:"
echo "   - High error rate (>5 errors in 5 min)"
echo "   - Availability down (<95% in 5 min)"
echo "   - Slow response time (>5 seconds in 10 min)"
echo ""
echo "📧 Notifications will be sent to: $NOTIFICATION_EMAIL"
echo ""
echo "🔗 Next steps:"
echo "   1. Add the instrumentation key to your application"
echo "   2. Test alerts by temporarily breaking the application"
echo "   3. Set up custom dashboards in Azure Portal"
echo ""
echo "💡 To view your monitoring dashboard:"
echo "   az portal dashboard show --name 'Client360 Dashboard Monitoring'"

# Clean up temporary files
rm -f availability-test.xml dashboard.json

echo "✅ Setup complete!"