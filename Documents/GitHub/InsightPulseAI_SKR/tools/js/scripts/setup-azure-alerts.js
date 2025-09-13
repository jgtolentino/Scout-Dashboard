#!/usr/bin/env node

/**
 * Azure Alerts Setup Script
 * 
 * This script configures Azure monitoring alerts for the application using the Azure CLI.
 * It sets up alerts for performance metrics, error rates, availability, and security.
 * 
 * Usage:
 *   node setup-azure-alerts.js --resource-group=<rg-name> --app-name=<app-name>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let resourceGroup = '';
let appName = '';

args.forEach(arg => {
  if (arg.startsWith('--resource-group=')) {
    resourceGroup = arg.substring(16);
  } else if (arg.startsWith('--app-name=')) {
    appName = arg.substring(11);
  }
});

// Validate inputs
if (!resourceGroup || !appName) {
  console.error('Usage: node setup-azure-alerts.js --resource-group=<rg-name> --app-name=<app-name>');
  process.exit(1);
}

// Ensure Azure CLI is installed
try {
  execSync('az --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Azure CLI is not installed. Please install it first.');
  process.exit(1);
}

// Check if logged in to Azure
try {
  execSync('az account show', { stdio: 'ignore' });
} catch (error) {
  console.error('Not logged in to Azure. Please run "az login" first.');
  process.exit(1);
}

console.log(`Setting up alerts for resource group: ${resourceGroup}, app: ${appName}`);

// Alert definitions
const alerts = [
  // Application errors
  {
    name: 'High-Error-Rate',
    description: 'Alerts when the error rate exceeds 5% over 5 minutes',
    metric: 'exceptions/server',
    condition: 'gt',
    threshold: 5,
    window: 'PT5M',
    aggregation: 'Average',
    frequency: 'PT1M',
    severity: 2,
    actionGroups: ['ops-team-email']
  },
  
  // Performance alerts
  {
    name: 'Slow-Page-Load',
    description: 'Alerts when page load time exceeds 2 seconds',
    metric: 'pageLoadTime',
    condition: 'gt',
    threshold: 2000,
    window: 'PT5M',
    aggregation: 'Average',
    frequency: 'PT1M',
    severity: 3,
    actionGroups: ['devs-slack']
  },
  
  // Availability alerts
  {
    name: 'Availability-Below-99',
    description: 'Alerts when availability drops below 99%',
    metric: 'availability',
    condition: 'lt',
    threshold: 99,
    window: 'PT15M',
    aggregation: 'Average',
    frequency: 'PT5M',
    severity: 1,
    actionGroups: ['ops-team-email', 'devs-slack']
  },
  
  // Resource utilization alerts
  {
    name: 'High-CPU-Usage',
    description: 'Alerts when CPU usage exceeds 80% for 10 minutes',
    metric: 'CpuPercentage',
    condition: 'gt',
    threshold: 80,
    window: 'PT10M',
    aggregation: 'Average',
    frequency: 'PT1M',
    severity: 2,
    actionGroups: ['devs-slack']
  },
  
  // Custom metric alerts
  {
    name: 'Failed-Deployments',
    description: 'Alerts when deployments fail',
    metric: 'DeploymentSuccess',
    condition: 'lt',
    threshold: 100,
    window: 'PT5M',
    aggregation: 'Average',
    frequency: 'PT1M',
    severity: 2,
    actionGroups: ['devs-slack', 'ops-team-email']
  }
];

// Create action groups if they don't exist
console.log('Creating action groups...');

// DevOps team Slack notification
try {
  execSync(`az monitor action-group create --name devs-slack --resource-group ${resourceGroup} --short-name devs \
  --webhook-receiver name=slack uri=https://hooks.slack.com/services/YOUR_SLACK_WEBHOOK`);
  console.log('Created devs-slack action group');
} catch (error) {
  console.log('Action group devs-slack already exists or failed to create');
}

// Ops team email notification
try {
  execSync(`az monitor action-group create --name ops-team-email --resource-group ${resourceGroup} --short-name ops \
  --email-receiver name=ops email=ops@example.com`);
  console.log('Created ops-team-email action group');
} catch (error) {
  console.log('Action group ops-team-email already exists or failed to create');
}

// Create alerts
console.log('Creating alerts...');
alerts.forEach(alert => {
  try {
    const actionGroups = alert.actionGroups.map(group => `--action-group ${group}`).join(' ');
    
    execSync(`az monitor metrics alert create --name ${alert.name} \
    --resource-group ${resourceGroup} \
    --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/${resourceGroup}/providers/Microsoft.Web/staticSites/${appName} \
    --condition "avg ${alert.metric} ${alert.condition} ${alert.threshold}" \
    --window-size ${alert.window} \
    --evaluation-frequency ${alert.frequency} \
    --severity ${alert.severity} \
    --description "${alert.description}" \
    ${actionGroups}`);
    
    console.log(`Created alert: ${alert.name}`);
  } catch (error) {
    console.log(`Failed to create alert ${alert.name}: ${error.message}`);
  }
});

// Create a dashboard for monitoring alerts
console.log('Creating monitoring dashboard...');
try {
  const dashboardTemplate = {
    "properties": {
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
                    "name": "resourceTypeMode",
                    "isOptional": true,
                    "value": "workspace"
                  },
                  {
                    "name": "ComponentId",
                    "isOptional": true,
                    "value": {
                      "SubscriptionId": "$(az account show --query id -o tsv)",
                      "ResourceGroup": resourceGroup,
                      "Name": appName
                    }
                  }
                ],
                "type": "Extension/AppInsightsExtension/PartType/AppMapGalPt",
                "settings": {},
                "asset": {
                  "idInputName": "ComponentId",
                  "type": "ApplicationInsights"
                }
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
                    "name": "resourceTypeMode",
                    "isOptional": true,
                    "value": "workspace"
                  },
                  {
                    "name": "ComponentId",
                    "isOptional": true,
                    "value": {
                      "SubscriptionId": "$(az account show --query id -o tsv)",
                      "ResourceGroup": resourceGroup,
                      "Name": appName
                    }
                  },
                  {
                    "name": "TimeContext",
                    "isOptional": true,
                    "value": {
                      "durationMs": 86400000,
                      "endTime": null,
                      "createdTime": "2023-01-01T00:00:00.000Z",
                      "isInitialTime": true,
                      "grain": 1,
                      "useDashboardTimeRange": false
                    }
                  }
                ],
                "type": "Extension/AppInsightsExtension/PartType/AppMapGalPt",
                "settings": {},
                "asset": {
                  "idInputName": "ComponentId",
                  "type": "ApplicationInsights"
                }
              }
            },
            "2": {
              "position": {
                "x": 0,
                "y": 4,
                "colSpan": 6,
                "rowSpan": 4
              },
              "metadata": {
                "inputs": [
                  {
                    "name": "ComponentId",
                    "value": {
                      "SubscriptionId": "$(az account show --query id -o tsv)",
                      "ResourceGroup": resourceGroup,
                      "Name": appName
                    }
                  }
                ],
                "type": "Extension/AppInsightsExtension/PartType/AvailabilityCurPt",
                "settings": {},
                "asset": {
                  "idInputName": "ComponentId",
                  "type": "ApplicationInsights"
                }
              }
            }
          }
        }
      }
    }
  };
  
  // Save dashboard template to a temporary file
  const tempFile = path.join(__dirname, 'temp-dashboard.json');
  fs.writeFileSync(tempFile, JSON.stringify(dashboardTemplate, null, 2));
  
  // Create the dashboard
  execSync(`az portal dashboard create --resource-group ${resourceGroup} --name ${appName}-monitoring --input-path ${tempFile}`);
  
  // Clean up temporary file
  fs.unlinkSync(tempFile);
  
  console.log(`Created monitoring dashboard: ${appName}-monitoring`);
} catch (error) {
  console.log(`Failed to create dashboard: ${error.message}`);
}

console.log('Alert setup complete!');
console.log(`To view alerts, visit: https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/alertsV2`);
console.log(`To view the dashboard, visit: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Portal%2Fdashboards`);